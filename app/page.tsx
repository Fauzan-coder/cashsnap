"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Type definitions
type SalesData = {
  cash: string;
  upi: string;
  card: string;
};

type ExpenseItem = {
  description: string;
  amount: string;
  id: string;
};

type AdvanceSalary = {
  employee: string;
  amount: string;
  remarks: string;
};

export default function Home() {
  // State for sales data
  const [salesData, setSalesData] = useState<SalesData>({
    cash: '',
    upi: '',
    card: '',
  });

  // State for expense items
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { description: '', amount: '', id: '1' },
  ]);

  // State for advance salary
  const [advanceSalary, setAdvanceSalary] = useState<AdvanceSalary>({
    employee: '',
    amount: '',
    remarks: '',
  });

  // State for balances
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showEditSection, setShowEditSection] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [originalOpeningBalance, setOriginalOpeningBalance] = useState<number>(0);

  // Fetch previous data and available dates when component mounts
  useEffect(() => {
    fetchPreviousData();
    fetchAvailableDates();
  }, []);

  // Calculate closing balance whenever relevant data changes
  useEffect(() => {
    calculateClosingBalance();
  }, [salesData, expenses, advanceSalary, openingBalance]);

  // Fetch previous day's data
  const fetchPreviousData = async () => {
    try {
      const response = await fetch('/api/daily-data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setOpeningBalance(data.openingBalance);
      setOriginalOpeningBalance(data.openingBalance);
    } catch (error) {
      console.error("Failed to fetch previous data:", error);
      setOpeningBalance(0);
      setOriginalOpeningBalance(0);
    }
  };

  // Fetch available dates for editing
  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/available-dates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch available dates');
      }
      
      const data = await response.json();
      // Remove duplicates using Set
      const uniqueDates = [...new Set((data.dates || []) as string[])];
      setAvailableDates(uniqueDates);
    } catch (error) {
      console.error("Failed to fetch available dates:", error);
      setAvailableDates([]);
    }
  };

  // Fetch data for a specific date
  const fetchDataForDate = async (date: string) => {
    try {
      const response = await fetch(`/api/daily-data?date=${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data for date');
      }
      
      const data = await response.json();
      
      // Populate the form with the fetched data
      setSalesData({
        cash: data.cash || '',
        upi: data.upi || '',
        card: data.card || ''
      });
      
      // Set expenses
      if (data.expenses && data.expenses.length > 0) {
        setExpenses(data.expenses.map((exp: any, index: number) => ({
          description: exp.description || '',
          amount: exp.amount.toString() || '',
          id: (index + 1).toString()
        })));
      } else {
        setExpenses([{ description: '', amount: '', id: '1' }]);
      }
      
      // Set advance salary
      setAdvanceSalary({
        employee: data.advanceSalary.employee || '',
        amount: data.advanceSalary.amount.toString() || '',
        remarks: data.advanceSalary.remarks || ''
      });
      
      // Set balances
      setOpeningBalance(data.openingBalance || 0);
      setOriginalOpeningBalance(data.openingBalance || 0);
      setClosingBalance(data.closingBalance || 0);
      
      // Set edit mode
      setIsEditMode(true);
      setSelectedDate(date);
    } catch (error) {
      console.error("Failed to fetch data for date:", error);
      alert("Failed to load data for the selected date.");
    }
  };

  // Handle date selection change
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDate = e.target.value;
    
    if (selectedDate) {
      fetchDataForDate(selectedDate);
    } else {
      resetForm();
      setIsEditMode(false);
      setSelectedDate('');
      fetchPreviousData();
    }
  };

  // Function to calculate closing balance
  const calculateClosingBalance = () => {
    const totalSales = 
      parseFloat(salesData.cash || '0') + 
      parseFloat(salesData.upi || '0') + 
      parseFloat(salesData.card || '0');
    
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount || '0');
    }, 0);
    
    const totalAdvanceSalary = parseFloat(advanceSalary.amount || '0');
    
    const closing = openingBalance + totalSales - totalExpenses - totalAdvanceSalary;
    setClosingBalance(closing);
  };

  // Handle sales input changes
  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalesData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle expense input changes
  const handleExpenseChange = (id: string, field: 'description' | 'amount', value: string) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  // Add a new expense row
  const addExpenseRow = () => {
    const newId = (parseInt(expenses[expenses.length - 1].id) + 1).toString();
    setExpenses([...expenses, { description: '', amount: '', id: newId }]);
  };
  
  // Remove expense row
  const removeExpenseRow = (id: string) => {
    if (expenses.length > 1) {
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
    }
  };

  // Handle advance salary input changes
  const handleAdvanceSalaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdvanceSalary(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const cancelEdit = () => {
    resetForm();
    setIsEditMode(false);
    setSelectedDate('');
    setShowEditSection(false);
    fetchPreviousData();
  };

  // Toggle edit section visibility
  const toggleEditSection = () => {
    setShowEditSection(!showEditSection);
  };

  // Submit data to Google Sheets
  const handleSubmit = async () => {
    try {
      // Calculate totals
      const totalSales = 
        parseFloat(salesData.cash || '0') + 
        parseFloat(salesData.upi || '0') + 
        parseFloat(salesData.card || '0');
      
      const formattedExpenses = expenses
        .filter(exp => exp.description && exp.amount)
        .map(exp => ({
          description: exp.description,
          amount: parseFloat(exp.amount || '0')
        }));
      
      const totalExpenses = formattedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      const advanceSalaryAmount = parseFloat(advanceSalary.amount || '0');
      
      // Prepare data for submission
      const submissionData = {
        date: isEditMode ? selectedDate : new Date().toISOString().split('T')[0],
        cash: salesData.cash,
        upi: salesData.upi,
        card: salesData.card,
        totalSales,
        expenses: formattedExpenses,
        totalExpenses,
        advanceSalary: {
          employee: advanceSalary.employee,
          amount: advanceSalaryAmount,
          remarks: advanceSalary.remarks
        },
        openingBalance: isEditMode ? originalOpeningBalance : openingBalance,
        closingBalance,
        isUpdate: isEditMode // Flag to indicate if this is an update operation
      };
  
      // Send data to API
      const response = await fetch('/api/daily-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to submit data');
      }
  
      const result = await response.json();
      alert(isEditMode ? "Data updated successfully!" : "Data submitted successfully!");
      
      // Reset form fields after submission
      resetForm();
      setIsEditMode(false);
      setSelectedDate('');
      setShowEditSection(false);
      fetchPreviousData();
      fetchAvailableDates(); // Refresh available dates list
    } catch (error) {
      console.error("Failed to submit data:", error);
      alert("Failed to submit data. Please try again.");
    }
  };

  // Reset form after submission
  const resetForm = () => {
    setSalesData({ cash: '', upi: '', card: '' });
    setExpenses([{ description: '', amount: '', id: '1' }]);
    setAdvanceSalary({ employee: '', amount: '', remarks: '' });
    // Don't reset balances as they should persist
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>CashSnap</title>
        <meta name="description" content="Track daily sales, expenses and advance salary" />
      </Head>

      <header className="bg-gradient-to-r from-gray-100 to-gray-200 shadow-lg py-6 border-b border-gray-300">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-gray-600 to-black">Cash</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">Snap</span>
          </h1>
          <div className="flex space-x-6">
            <Link href="/dashboard" className="relative group">
              <span className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-300 ease-in-out">
                Dashboard
              </span>
              <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-gray-400 to-gray-600 transition-all duration-300 ease-in-out"></span>
            </Link>
            <Link href="/settings" className="relative group">
              <span className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-300 ease-in-out">
                Settings
              </span>
              <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-gray-400 to-gray-600 transition-all duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? `Editing: ${selectedDate}` : "New Entry"}
          </h2>
          <button 
            onClick={toggleEditSection}
            className="bg-gray-800 hover:bg-black text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {showEditSection ? "Hide Edit Options" : "Edit Previous Entry"}
          </button>
        </div>
        
        {/* Edit Mode Selection - Only visible when toggled */}
        {showEditSection && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Select a Date to Edit</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-2/3">
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={selectedDate}
                  onChange={handleDateChange}
                >
                  <option value="">-- Select Date --</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              {isEditMode && (
                <button 
                  onClick={cancelEdit}
                  className="w-full md:w-1/3 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Balance Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Opening Balance</h3>
              <p className="text-3xl font-bold text-gray-800">₹{openingBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Closing Balance</h3>
              <p className="text-3xl font-bold text-gray-800">₹{closingBalance.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                (Opening + Sales - Expenses - Advance)
              </p>
            </div>
          </div>
        </div>
        
        {/* Sales Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">
            {isEditMode ? `Sales for ${selectedDate}` : "Today's Sales"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                  type="number"
                  name="cash"
                  value={salesData.cash}
                  onChange={handleSalesChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter cash amount"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                  type="number"
                  name="upi"
                  value={salesData.upi}
                  onChange={handleSalesChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter UPI amount"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                  type="number"
                  name="card"
                  value={salesData.card}
                  onChange={handleSalesChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter card amount"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h3 className="text-xl font-semibold text-gray-800">Expenses</h3>
            <button 
              onClick={addExpenseRow}
              className="flex items-center text-gray-700 hover:text-gray-900 font-medium py-1 px-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="mr-1 text-lg">+</span> Add Expense
            </button>
          </div>
          
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={expense.description}
                    onChange={(e) => handleExpenseChange(expense.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Expense description"
                  />
                </div>
                <div className="md:w-1/3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Amount"
                    />
                  </div>
                </div>
                {expenses.length > 1 && (
                  <button 
                    onClick={() => removeExpenseRow(expense.id)}
                    className="md:w-auto text-gray-500 hover:text-red-600 transition-colors duration-200"
                    title="Remove expense"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Advance Salary Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">Advance Salary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
              <input
                type="text"
                name="employee"
                value={advanceSalary.employee}
                onChange={handleAdvanceSalaryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Employee name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={advanceSalary.amount}
                  onChange={handleAdvanceSalaryChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Advance amount"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <input
                type="text"
                name="remarks"
                value={advanceSalary.remarks}
                onChange={handleAdvanceSalaryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Additional remarks"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleSubmit}
            className="bg-gray-800 hover:bg-black text-white font-medium py-3 px-8 rounded-lg focus:outline-none focus:ring-4 focus:ring-gray-400 transition-colors duration-200"
          >
            {isEditMode ? `Update Data for ${selectedDate}` : "Submit Data"}
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} CashSnap
        </div>
      </footer>
    </div>
  );
}