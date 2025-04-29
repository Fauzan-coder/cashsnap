// app/lib/googleSheetsService.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Interface for sales data
interface SalesData {
  date: string;
  cash: string;
  upi: string;
  card: string;
  totalSales: number;
  expenses: { description: string; amount: number }[];
  totalExpenses: number;
  advanceSalary: {
    employee: string;
    amount: number;
    remarks?: string;
  };
  openingBalance: number;
  closingBalance: number;
}

class GoogleSheetsService {
  private jwtClient: JWT;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.jwtClient });
    this.spreadsheetId = process.env.SPREADSHEET_ID || '';
  }

  async initializeSheet(): Promise<void> {
    try {
      // Check if the spreadsheet exists
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      // Create or ensure required sheets exist with headers
      const sheets = ['Sales', 'Expenses', 'AdvanceSalary', 'Summary'];
      const headers = {
        'Sales': ['Date', 'Cash', 'UPI', 'Card', 'Total Sales'],
        'Expenses': ['Date', 'Description', 'Amount'],
        'AdvanceSalary': ['Date', 'Employee', 'Amount', 'Remarks'],
        'Summary': ['Date', 'Opening Balance', 'Total Sales', 'Total Expenses', 'Advance Salary', 'Closing Balance']
      };

      // Get existing sheets
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const existingSheets = spreadsheet.data.sheets.map(
        (sheet: any) => sheet.properties.title
      );

      // Add any missing sheets
      for (const sheet of sheets) {
        if (!existingSheets.includes(sheet)) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: [{
                addSheet: {
                  properties: {
                    title: sheet
                  }
                }
              }]
            }
          });

          // Add headers to the new sheet
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheet}!A1:E1`,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [headers[sheet as keyof typeof headers]]
            }
          });
        }
      }

      return;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }

  async getYesterdayData(): Promise<{ 
    openingBalance: number;
    sales: number;
    expenses: number;
    advanceSalary: number;
  }> {
    try {
      // Read from Summary sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:G', // Adjust range as needed
      });
  
      const rows = response.data.values || [];
      
      // First check if there are any rows (beyond headers)
      if (rows.length <= 1) {
        return { openingBalance: 0, sales: 0, expenses: 0, advanceSalary: 0 };
      }
      
      // Get today's date and format it
      let today = new Date();
      // If it's past midnight but before 5AM, consider it previous day
      if (today.getHours() >= 0 && today.getHours() < 5) {
        today.setDate(today.getDate() - 1);
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split('T')[0];
      
      // Find yesterday's row
      const yesterdayRow: string[] | undefined = rows.find((row: string[]) => row[0] === yesterdayFormatted);
      
      if (yesterdayRow) {
        return {
          openingBalance: parseFloat(yesterdayRow[5] || '0'), // Use closing balance as opening balance
          sales: 0,
          expenses: 0,
          advanceSalary: 0
        };
      }
      
      // If no data found for yesterday, use the last available entry's closing balance
      // Sort rows by date and find the most recent one
      const dataRows = rows.slice(1); // Skip header
      dataRows.sort((a: string[], b: string[]) => {
        return new Date(b[0]).getTime() - new Date(a[0]).getTime();
      });
      
      const lastRow = dataRows[0];
      return {
        openingBalance: parseFloat(lastRow[5] || '0'),  // Use the closing balance as opening
        sales: 0,
        expenses: 0,
        advanceSalary: 0
      };
    } catch (error) {
      console.error('Error fetching yesterday data:', error);
      return { openingBalance: 0, sales: 0, expenses: 0, advanceSalary: 0 };
    }
  }

  async appendSalesData(data: SalesData): Promise<void> {
    try {
      // Append to Sales sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sales!A:E',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            data.date,
            data.cash,
            data.upi,
            data.card,
            data.totalSales
          ]]
        }
      });

      // Append to Expenses sheet
      if (data.expenses.length > 0) {
        const expenseRows = data.expenses.map(expense => [
          data.date,
          expense.description,
          expense.amount
        ]);

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Expenses!A:C',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: expenseRows
          }
        });
      }

      // Append to Advance Salary sheet
      if (data.advanceSalary.amount > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'AdvanceSalary!A:D',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              data.date,
              data.advanceSalary.employee,
              data.advanceSalary.amount,
              data.advanceSalary.remarks || ''
            ]]
          }
        });
      }

      // Update Summary sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:G',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            data.date,
            data.openingBalance,
            data.totalSales,
            data.totalExpenses,
            data.advanceSalary.amount,
            data.closingBalance
          ]]
        }
      });

    } catch (error) {
      console.error('Error appending data to Google Sheets:', error);
      throw error;
    }
  }

  // Get all available dates with data
  async getAvailableDates(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:A',
      });
  
      const rows = response.data.values || [];
      
      // Skip the header row, filter out empty values, and sort by date (newest first)
      const dates = rows.slice(1)
        .map((row: string[]) => row[0] || '')
        .filter(Boolean);
        
      return dates.sort((a: string, b: string): number => new Date(b).getTime() - new Date(a).getTime());
    } catch (error) {
      console.error('Error fetching available dates:', error);
      return [];
    }
  }

  async checkDateExists(date: string): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:A',
      });
  
      const rows = response.data.values || [];
      
      // Skip the header row and check if date exists
      return rows.slice(1).some((row: string[]) => row[0] === date);
    } catch (error) {
      console.error('Error checking if date exists:', error);
      return false;
    }
  }

  // Check for missed dates
async checkMissedDates(): Promise<string[]> {
  try {
    const dates = await this.getAvailableDates();
    if (dates.length === 0) return [];
    
    const sortedDates = [...dates].sort();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Find the last date with an entry
    const lastDate = sortedDates[sortedDates.length - 1];
    
    // If the last date is yesterday or today, no missing entries
    if (lastDate >= yesterdayStr) return [];
    
    // Calculate missing dates between last entry and yesterday
    const missedDates: string[] = [];
    const lastEntryDate = new Date(lastDate);
    const currDate = new Date(lastEntryDate);
    currDate.setDate(currDate.getDate() + 1);
    
    while (currDate <= yesterday) {
      missedDates.push(currDate.toISOString().split('T')[0]);
      currDate.setDate(currDate.getDate() + 1);
    }
    
    return missedDates;
  } catch (error) {
    console.error('Error checking missed dates:', error);
    return [];
  }
}

// Get expense suggestions based on previous entries
async getExpenseSuggestions(): Promise<string[]> {
  try {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Expenses!B:B',
    });
    
    const values = response.data.values || [];
    const descriptions = (values.flat() as string[]).filter(Boolean);
    
    // Get unique expense descriptions
    const uniqueDescriptions = [...new Set(descriptions)];
    
    // Skip header if it exists
    if (uniqueDescriptions[0] === "Description") {
      return uniqueDescriptions.slice(1);
    }
    
    return uniqueDescriptions;
  } catch (error) {
    console.error('Error fetching expense suggestions:', error);
    return [];
  }
}

  async getDataForDate(date: string): Promise<SalesData | null> {
    try {
      // Get all data in a single batch request
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges: ['Sales!A:E', 'Expenses!A:C', 'AdvanceSalary!A:D', 'Summary!A:G'],
      });
      
      const [salesData, expensesData, advanceData, summaryData] = response.data.valueRanges;
      
      const salesRows = salesData.values || [];
      const salesRow = salesRows.find((row: string[]) => row[0] === date);
      
      if (!salesRow) {
        return null; // No data found for this date
      }
      
      const expensesRows = expensesData.values || [];
      const dateExpenses = expensesRows
        .filter((row: string[]) => row[0] === date)
        .map((row: string[]) => ({
          description: row[1] || '',
          amount: parseFloat(row[2] || '0')
        }));
      
      const advanceRows = advanceData.values || [];
      const advanceRow = advanceRows.find((row: string[]) => row[0] === date);
      
      const advanceSalary = {
        employee: advanceRow ? advanceRow[1] || '' : '',
        amount: advanceRow ? parseFloat(advanceRow[2] || '0') : 0,
        remarks: advanceRow ? advanceRow[3] || '' : ''
      };
      
      const summaryRows = summaryData.values || [];
      const summaryRow = summaryRows.find((row: string[]) => row[0] === date);
      
      if (!summaryRow) {
        return null; // No summary data found
      }
      
      return {
        date,
        cash: salesRow[1] || '0',
        upi: salesRow[2] || '0',
        card: salesRow[3] || '0',
        totalSales: parseFloat(salesRow[4] || '0'),
        expenses: dateExpenses as { description: string; amount: number }[],
        totalExpenses: dateExpenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0),
        advanceSalary: advanceSalary as { employee: string; amount: number; remarks?: string },
        openingBalance: parseFloat(summaryRow[1] || '0'),
        closingBalance: parseFloat(summaryRow[5] || '0')
      };
    } catch (error) {
      console.error('Error fetching data for date:', error);
      return null;
    }
  }

  private async getSheetIds(): Promise<Record<string, number>> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const sheetIds: Record<string, number> = {};
      response.data.sheets.forEach((sheet: any) => {
        sheetIds[sheet.properties.title] = sheet.properties.sheetId;
      });
      
      return sheetIds;
    } catch (error) {
      console.error('Error getting sheet IDs:', error);
      throw error;
    }
  }

  async updateDataForDate(date: string, data: SalesData): Promise<void> {
    try {
      // First, find the rows for this date
      const sheetIds = await this.getSheetIds();
      const salesResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sales!A:E',
      });
      
      const salesRows = salesResponse.data.values || [];
      const salesRowIndex = salesRows.findIndex((row: string[]) => row[0] === date);
      
      if (salesRowIndex === -1) {
        throw new Error('No data found for the specified date');
      }
      
      // Update Sales sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sales!B${salesRowIndex + 1}:E${salesRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            data.cash,
            data.upi,
            data.card,
            data.totalSales
          ]]
        }
      });
      
      // For expenses, delete all existing entries for this date and add new ones
      const expensesResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Expenses!A:C',
      });
      
      const expensesRows = expensesResponse.data.values || [];
      const expenseIndices: number[] = expensesRows
        .map((row: string[], index: number): number => row[0] === date ? index : -1)
        .filter((index: number): boolean => index !== -1);
      
      // Delete existing expense entries (in reverse order to maintain indices)
      if (expenseIndices.length > 0) {
        for (let i = expenseIndices.length - 1; i >= 0; i--) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetIds['Expenses'], // Use the actual Expenses sheet ID
                    dimension: 'ROWS',
                    startIndex: expenseIndices[i],
                    endIndex: expenseIndices[i] + 1
                  }
                }
              }]
            }
          });
        }
      }
      
      // Add new expense entries
      if (data.expenses.length > 0) {
        const expenseRows = data.expenses.map(expense => [
          date,
          expense.description,
          expense.amount
        ]);

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Expenses!A:C',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: expenseRows
          }
        });
      }
      
      // Update or add advance salary entry
      const advanceResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'AdvanceSalary!A:D',
      });
      
      const advanceRows = advanceResponse.data.values || [];
      const advanceRowIndex = advanceRows.findIndex((row: string[]) => row[0] === date);
      
      if (advanceRowIndex !== -1) {
        // Update existing entry
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `AdvanceSalary!B${advanceRowIndex + 1}:D${advanceRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              data.advanceSalary.employee,
              data.advanceSalary.amount,
              data.advanceSalary.remarks || ''
            ]]
          }
        });
      } else if (data.advanceSalary.amount > 0) {
        // Add new entry
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'AdvanceSalary!A:D',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              date,
              data.advanceSalary.employee,
              data.advanceSalary.amount,
              data.advanceSalary.remarks || ''
            ]]
          }
        });
      }
      
      // Update Summary sheet
      const summaryResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:G',
      });
      
      const summaryRows = summaryResponse.data.values || [];
      const summaryRowIndex = summaryRows.findIndex((row: string[]) => row[0] === date);
      
      if (summaryRowIndex !== -1) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Summary!B${summaryRowIndex + 1}:F${summaryRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              data.openingBalance,
              data.totalSales,
              data.totalExpenses,
              data.advanceSalary.amount,
              data.closingBalance
            ]]
          }
        });
      } else {
        throw new Error('Summary entry not found for the specified date');
      }
      
      // After updating this date, we need to recalculate subsequent dates
      // This is important to maintain the chain of opening/closing balances
      await this.recalculateSubsequentDates(date);
    } catch (error) {
      console.error('Error updating data for date:', error);
      throw error;
    }
  }

  // Helper method to recalculate balances for dates after the edited date
  private async recalculateSubsequentDates(fromDate: string): Promise<void> {
    try {
      const summaryResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Summary!A:G',
      });
      
      const summaryRows = summaryResponse.data.values || [];
      
      // Find the index of the edited date
      const fromDateIndex = summaryRows.findIndex((row: string[]) => row[0] === fromDate);
      
      if (fromDateIndex === -1 || fromDateIndex === summaryRows.length - 1) {
        // No subsequent dates to update
        return;
      }
      
      // Process all subsequent dates
      for (let i = fromDateIndex + 1; i < summaryRows.length; i++) {
        const currentRow = summaryRows[i];
        const previousRow = summaryRows[i - 1];
        
        // Get the current date
        const currentDate = currentRow[0];
        
        // Set opening balance to previous day's closing balance
        const newOpeningBalance = parseFloat(previousRow[5] || '0');
        
        // Keep the current day's sales, expenses, and advance salary
        const sales = parseFloat(currentRow[2] || '0');
        const expenses = parseFloat(currentRow[3] || '0');
        const advanceSalary = parseFloat(currentRow[4] || '0');
        
        // Calculate new closing balance
        const newClosingBalance = newOpeningBalance + sales - expenses - advanceSalary;
        
        // Update the row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Summary!B${i + 1}:F${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              newOpeningBalance,
              sales,
              expenses,
              advanceSalary,
              newClosingBalance
            ]]
          }
        });
        
        // Update the summaryRows array for the next iteration
        summaryRows[i][1] = newOpeningBalance.toString();
        summaryRows[i][5] = newClosingBalance.toString();
      }
    } catch (error) {
      console.error('Error recalculating subsequent dates:', error);
      throw error;
    }
  }
}

export default new GoogleSheetsService();