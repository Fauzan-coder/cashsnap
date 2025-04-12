import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';

console.log('Loading Google Sheets credentials from env variables...');

// Extract credentials from environment variables
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

if (!client_email || !private_key || !spreadsheetId) {
  console.error('Missing required Google Sheets environment variables.');
  throw new Error('Missing required Google Sheets environment variables.');
}

console.log('Google credentials loaded. Initializing auth with:', client_email);

// Create a JWT auth client
const auth = new JWT({
  email: client_email,
  key: private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize the Google Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Sheet names
const SALES_SHEET = 'Sales';
const EXPENSES_SHEET = 'Expenses';
const ADVANCES_SHEET = 'Advances';
const BALANCE_SHEET = 'Balance';

// Function to append data to a sheet
async function appendToSheet(sheetName: string, values: any[]): Promise<sheets_v4.Schema$AppendValuesResponse> {
  try {
    console.log(`Appending to ${sheetName}:`, values);
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
    throw error;
  }
}

// Update daily balance
export async function updateBalance(date: string, openingBalance: number, closingBalance: number): Promise<sheets_v4.Schema$AppendValuesResponse> {
  return appendToSheet(BALANCE_SHEET, [
    date,
    openingBalance,
    closingBalance,
    new Date().toISOString(),
  ]);
}

// Get daily balance
export async function getDailyBalance(date: string): Promise<{
  date: string;
  openingBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalAdvances: number;
  closingBalance: number;
}> {
  return calculateClosingBalance(date);
}

// Calculate closing balance
export async function calculateClosingBalance(date: string): Promise<{
  date: string;
  openingBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalAdvances: number;
  closingBalance: number;
}> {
  const salesData = await getSheetData(SALES_SHEET);
  const salesHeader = salesData[0];
  const dateIndex = salesHeader.findIndex(col => col.toLowerCase() === 'date');
  const totalIndex = salesHeader.findIndex(col => col.toLowerCase() === 'total');

  const dailySales = salesData.slice(1).filter(row => row[dateIndex] === date);
  const totalSales = dailySales.reduce((sum, row) => sum + Number(row[totalIndex] || 0), 0);

  const expensesData = await getSheetData(EXPENSES_SHEET);
  const expensesHeader = expensesData[0];
  const expDateIndex = expensesHeader.findIndex(col => col.toLowerCase() === 'date');
  const expAmountIndex = expensesHeader.findIndex(col => col.toLowerCase() === 'amount');

  const dailyExpenses = expensesData.slice(1).filter(row => row[expDateIndex] === date);
  const totalExpenses = dailyExpenses.reduce((sum, row) => sum + Number(row[expAmountIndex] || 0), 0);

  const advancesData = await getSheetData(ADVANCES_SHEET);
  const advHeader = advancesData[0];
  const advDateIndex = advHeader.findIndex(col => col.toLowerCase() === 'date');
  const advAmountIndex = advHeader.findIndex(col => col.toLowerCase() === 'amount');

  const dailyAdvances = advancesData.slice(1).filter(row => row[advDateIndex] === date);
  const totalAdvances = dailyAdvances.reduce((sum, row) => sum + Number(row[advAmountIndex] || 0), 0);

  const balanceData = await getSheetData(BALANCE_SHEET);

  let openingBalance = 0;
  if (balanceData.length > 1) {
    const balHeader = balanceData[0];
    const balDateIndex = balHeader.findIndex(col => col.toLowerCase() === 'date');
    const closingBalIndex = balHeader.findIndex(col => col.toLowerCase() === 'closing_balance');

    const previousBalances = balanceData.slice(1)
      .filter(row => new Date(row[balDateIndex]) < new Date(date))
      .sort((a, b) => new Date(b[balDateIndex]).getTime() - new Date(a[balDateIndex]).getTime());

    if (previousBalances.length > 0) {
      openingBalance = Number(previousBalances[0][closingBalIndex]);
    }
  }

  const closingBalance = openingBalance + totalSales - totalExpenses - totalAdvances;

  return {
    date,
    openingBalance,
    totalSales,
    totalExpenses,
    totalAdvances,
    closingBalance,
  };
}

// Function to get data from a sheet
export async function getSheetData(sheetName: string, range: string = 'A:Z'): Promise<string[][]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    });
    return response.data.values || [];
  } catch (error) {
    console.error(`Error getting data from ${sheetName}:`, error);
    throw error;
  }
}

// Add a new sales entry
export async function addSale(date: string, upiAmount: number, cardAmount: number, cashAmount: number): Promise<sheets_v4.Schema$AppendValuesResponse> {
  console.log('Adding sale:', { date, upiAmount, cardAmount, cashAmount });
  const totalAmount = upiAmount + cardAmount + cashAmount;
  return appendToSheet(SALES_SHEET, [
    date,
    upiAmount,
    cardAmount,
    cashAmount,
    totalAmount,
    new Date().toISOString(),
  ]);
}

// Add a new expense entry
export async function addExpense(date: string, amount: number, description: string): Promise<sheets_v4.Schema$AppendValuesResponse> {
  return appendToSheet(EXPENSES_SHEET, [
    date,
    amount,
    description,
    new Date().toISOString(),
  ]);
}

// Add a new salary advance
export async function addAdvance(date: string, employeeName: string, amount: number, notes: string): Promise<sheets_v4.Schema$AppendValuesResponse> {
  return appendToSheet(ADVANCES_SHEET, [
    date,
    employeeName,
    amount,
    notes,
    new Date().toISOString(),
  ]);
}

// Initialize sheets if they don't exist
export async function initializeSheets(): Promise<void> {
  try {
    console.log('Initializing sheets...');
    
    const salesHeader = ['Date', 'UPI_Amount', 'Card_Amount', 'Cash_Amount', 'Total', 'Timestamp'];
    const expensesHeader = ['Date', 'Amount', 'Description', 'Timestamp'];
    const advancesHeader = ['Date', 'Employee_Name', 'Amount', 'Notes', 'Timestamp'];
    const balanceHeader = ['Date', 'Opening_Balance', 'Closing_Balance', 'Timestamp'];

    // Check if sheet exists and create headers if empty
    try {
      const salesData = await getSheetData(SALES_SHEET);
      if (!salesData || salesData.length === 0) {
        await appendToSheet(SALES_SHEET, salesHeader);
        console.log('Sales sheet initialized');
      }
    } catch (e) {
      console.error('Error initializing Sales sheet:', e);
    }

    try {
      const expensesData = await getSheetData(EXPENSES_SHEET);
      if (!expensesData || expensesData.length === 0) {
        await appendToSheet(EXPENSES_SHEET, expensesHeader);
        console.log('Expenses sheet initialized');
      }
    } catch (e) {
      console.error('Error initializing Expenses sheet:', e);
    }

    try {
      const advancesData = await getSheetData(ADVANCES_SHEET);
      if (!advancesData || advancesData.length === 0) {
        await appendToSheet(ADVANCES_SHEET, advancesHeader);
        console.log('Advances sheet initialized');
      }
    } catch (e) {
      console.error('Error initializing Advances sheet:', e);
    }

    try {
      const balanceData = await getSheetData(BALANCE_SHEET);
      if (!balanceData || balanceData.length === 0) {
        await appendToSheet(BALANCE_SHEET, balanceHeader);
        console.log('Balance sheet initialized');
      }
    } catch (e) {
      console.error('Error initializing Balance sheet:', e);
    }
    
    console.log('Sheets initialization complete');
  } catch (error) {
    console.error('Error initializing sheets:', error);
    throw error;
  }
}

// Helper function to test the connection
export async function testConnection(): Promise<boolean> {
  try {
    console.log('Testing connection to Google Sheets...');
    await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Connection successful');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}