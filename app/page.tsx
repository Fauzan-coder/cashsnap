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

type SubmissionData = {
  date: string;
  cash: string;
  upi: string;
  card: string;
  totalSales: number;
  expenses: {
    description: string;
    amount: number;
  }[];
  totalExpenses: number;
  advanceSalary: {
    employee: string;
    amount: number;
    remarks: string;
  };
  openingBalance: number;
  closingBalance: number;
  isUpdate: boolean;
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
  
  // State for missed entry notification
  const [missedDates, setMissedDates] = useState<string[]>([]);
  const [showMissedDateReminder, setShowMissedDateReminder] = useState<boolean>(false);
  const [remindLaterDismissed, setRemindLaterDismissed] = useState<boolean>(false);
  
  // State for expense suggestions
  const [expenseSuggestions, setExpenseSuggestions] = useState<string[]>([]);
  
  // State for manual date entry
  const [manualEntryDate, setManualEntryDate] = useState<string>('');
  const [showManualDateEntry, setShowManualDateEntry] = useState<boolean>(false);
  
  // New state variables for date modal and filtering
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  // State for submission loading
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for today's data check
  const [todayDataExists, setTodayDataExists] = useState<boolean>(false);

  // Fetch previous data and available dates when component mounts
  useEffect(() => {
    fetchPreviousData();
    fetchAvailableDates();
    checkForMissedDates();
    fetchExpenseSuggestions();
    checkTodayDataExists();
  }, []);

  // Calculate closing balance whenever relevant data changes
  useEffect(() => {
    calculateClosingBalance();
  }, [salesData, expenses, advanceSalary, openingBalance]);

  // Filter dates based on user input
  useEffect(() => {
    if (dateFilter) {
      const filtered = availableDates.filter(date => 
        date.includes(dateFilter)
      );
      setFilteredDates(filtered);
    } else {
      setFilteredDates(availableDates.slice(0, 10)); // Show only recent 10 dates when no filter
    }
  }, [dateFilter, availableDates]);

  // Check if today's data exists
  const checkTodayDataExists = async () => {
    if (isEditMode) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch(`/api/date-exists?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to check date');
      }
      
      const data = await response.json();
      setTodayDataExists(data.exists);
    } catch (error) {
      console.error("Error checking today's data:", error);
    }
  };

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

  const checkForMissedDates = async () => {
    try {
      const response = await fetch('/api/missed-dates');
      if (response.ok) {
        const data = await response.json();
        if (data.missedDates && data.missedDates.length > 0) {
          setMissedDates(data.missedDates);
          setShowMissedDateReminder(!remindLaterDismissed);
        }
      }
    } catch (error) {
      console.error("Failed to check for missed dates:", error);
    }
  };

  // Fetch expense suggestions
  const fetchExpenseSuggestions = async () => {
    try {
      const response = await fetch('/api/expense-suggestions');
      if (response.ok) {
        const data = await response.json();
        setExpenseSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch expense suggestions:", error);
    }
  };

  // Toggle manual date entry mode
  const toggleManualDateEntry = () => {
    setShowManualDateEntry(!showManualDateEntry);
    setManualEntryDate(new Date().toISOString().split('T')[0]);
  };

  // Handle manual date change
  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualEntryDate(e.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
  };

  // Fetch available dates for editing
  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/available-dates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const dates = data.dates || [];
      setAvailableDates(dates);
      setFilteredDates(dates.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch available dates:", error);
      setAvailableDates([]);
      setFilteredDates([]);
    }
  };

  // Check if entry already exists for this date
  const checkForExistingEntry = async (): Promise<boolean> => {
    const entryDate = showManualDateEntry ? manualEntryDate : new Date().toISOString().split('T')[0];
    
    // If we already know today's data exists (from page load check), show the modal immediately
    if (!isEditMode && !showManualDateEntry && todayDataExists) {
      setModalMessage(`Data already exists for today. Please use the Edit feature instead.`);
      setShowDateModal(true);
      return true;
    }
    
    try {
      const response = await fetch(`/api/date-exists?date=${entryDate}`);
      if (!response.ok) {
        throw new Error('Failed to check date');
      }
      
      const data = await response.json();
      
      if (data.exists && !isEditMode) {
        setModalMessage(`Data already exists for ${entryDate}. Please use the Edit feature instead.`);
        setShowDateModal(true);
        
        // If it's today's data, update the state
        if (entryDate === new Date().toISOString().split('T')[0]) {
          setTodayDataExists(true);
        }
        
        return true; // Entry exists
      }
      return false; // No entry exists
    } catch (error) {
      console.error("Error checking for existing entry:", error);
      return false; // Proceed with caution if check fails
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
        setExpenses(data.expenses.map((exp: {description?: string, amount: number}, index: number) => ({
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
    
    const closing = totalSales - totalExpenses - totalAdvanceSalary;
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

  // Close modal function
  const closeModal = () => {
    setShowDateModal(false);
  };

  // Switch to edit mode for the current date
  const switchToEditMode = () => {
    const dateToEdit = showManualDateEntry ? manualEntryDate : new Date().toISOString().split('T')[0];
    setShowDateModal(false);
    setShowEditSection(true);
    fetchDataForDate(dateToEdit);
  };

  // Submit data to Google Sheets
  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if entry already exists
      if (await checkForExistingEntry()) {
        return; // Stop submission if entry exists
      }
      
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
      const submissionData: SubmissionData = {
        date: showManualDateEntry ? manualEntryDate : (isEditMode ? selectedDate : new Date().toISOString().split('T')[0]),        
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
        isUpdate: isEditMode
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
      
      await response.json();
      alert(isEditMode ? "Data updated successfully!" : "Data submitted successfully!");
      
      // Reset form fields after submission
      resetForm();
      setIsEditMode(false);
      setSelectedDate('');
      setShowEditSection(false);
      fetchPreviousData();
      fetchAvailableDates();
      checkTodayDataExists();
    } catch (error) {
      console.error("Failed to submit data:", error);
      alert("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form after submission
  const resetForm = () => {
    setSalesData({ cash: '', upi: '', card: '' });
    setExpenses([{ description: '', amount: '', id: '1' }]);
    setAdvanceSalary({ employee: '', amount: '', remarks: '' });
    setClosingBalance(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 via-gray-100 to-white">
      <Head>
        <title>CashSnap</title>
        <meta name="description" content="Track daily sales, expenses and advance salary" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
  
      <header className="bg-gradient-to-r from-gray-300 to-gray-100 shadow-md py-4 sm:py-6 border-b border-gray-300">
        <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-gray-600 to-black">Cash</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">Snap</span>
          </h1>
          <div className="flex space-x-4 sm:space-x-6">
            <Link href="/dashboard" className="relative group">
              <span className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-300 ease-in-out">
                Dashboard
              </span>
              <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-gray-400 to-gray-600 transition-all duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>
      </header>
  
      <main className="container mx-auto py-6 sm:py-8 px-4 sm:px-6">    
        {/* Today's Data Already Exists Notification */}
        {todayDataExists && !isEditMode && !showManualDateEntry && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
              <h3 className="text-base sm:text-lg font-medium text-blue-800">Today&apos;s data already submitted</h3>
              <p className="mt-1 text-sm text-blue-600">
                You&apos;ve already submitted data for today. If you need to make changes, please use the &quot;Edit Previous Entry&quot; option.
              </p>
              </div>
            </div>
          </div>
        )}
  
        {/* Edit Mode Selection - Only visible when toggled */}
        {showEditSection && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border-l-4 border-gray-800 transition-all duration-300">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Select a Date to Edit</h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter dates (YYYY-MM-DD)"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {filteredDates.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredDates.map(date => (
                      <li key={date} className="p-2 hover:bg-gray-50">
                        <button
                          onClick={() => fetchDataForDate(date)}
                          className="w-full text-left px-2 py-1 text-gray-700 hover:text-gray-900"
                        >
                          {date}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-gray-500 text-center">No matching dates found</p>
                )}
              </div>
              
              {isEditMode && (
                <button 
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}
  
        {/* Date Exists Modal */}
        {showDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 sm:mx-auto">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Date Already Has Data</h3>
              <p className="text-gray-600 mb-4 sm:mb-6">{modalMessage}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-3 sm:px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={switchToEditMode}
                  className="px-3 sm:px-4 py-2 bg-gray-800 rounded-md text-white hover:bg-black transition-colors"
                >
                  Edit This Date
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Missed Date Reminder */}
        {showMissedDateReminder && missedDates.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-white border-l-4 border-yellow-400 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">Missing Entry Reminder</h3>
                <p className="text-yellow-700">
                  You forgot to enter data for: <strong>{missedDates.join(', ')}</strong>
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  Would you like to enter this data now?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button 
                  onClick={() => {
                    setShowMissedDateReminder(false);
                    toggleManualDateEntry();
                    setManualEntryDate(missedDates[0]);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200"
                >
                  Enter Now
                </button>
                <button 
                  onClick={() => setShowMissedDateReminder(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200"
                >
                  I Know
                </button>
                <button 
                  onClick={() => {
                    setShowMissedDateReminder(false);
                    setRemindLaterDismissed(true);
                  }}
                  className="bg-transparent hover:bg-gray-100 text-gray-600 font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200"
                >
                  Remind Later
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Manual Date Entry */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {isEditMode ? `Editing: ${selectedDate}` : 
            (showManualDateEntry ? `New Entry for Custom Date` : "New Entry")}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={toggleManualDateEntry}
              className="flex-grow sm:flex-grow-0 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-black hover:to-gray-800 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 shadow-sm"
            >
              {showManualDateEntry ? "Use Today's Date" : "Enter Different Date"}
            </button>
            <button 
              onClick={toggleEditSection}
              className="flex-grow sm:flex-grow-0 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 shadow-sm"
            >
              {showEditSection ? "Hide Edit Options" : "Edit Previous Entry"}
            </button>
          </div>
        </div>
  
        {/* Custom Date Selector */}
        {showManualDateEntry && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border-l-4 border-blue-500 transition-all duration-300">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Select Date for Entry</h3>
            <input
              type="date"
              value={manualEntryDate}
              onChange={handleManualDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        )}
        
        {/* Balance Summary */}
        <div className="bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Opening Balance</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">₹{openingBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Closing Balance</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">₹{closingBalance.toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                (Sales - Expenses - Advance)
              </p>
            </div>
          </div>
        </div>
        
        {/* Sales Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b pb-2">
            {isEditMode ? `Sales for ${selectedDate}` : "Today's Sales"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                  type="number"
                  name="cash"
                  value={salesData.cash}
                  onChange={handleSalesChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
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
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
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
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  placeholder="Enter card amount"
                />
              </div>
            </div>
          </div>
        </div>
  
        {/* Expenses Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
          <div className="flex justify-between items-center mb-4 sm:mb-6 border-b pb-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Expenses</h3>
            <button 
              onClick={addExpenseRow}
              className="flex items-center text-gray-700 hover:text-gray-900 font-medium py-1 px-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="mr-1 text-lg">+</span> Add Expense
            </button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <input
                    type="text"
                    list="expense-suggestions"
                    value={expense.description}
                    onChange={(e) => handleExpenseChange(expense.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                    placeholder="Expense description"
                  />
                  <datalist id="expense-suggestions">
                    {expenseSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion} />
                    ))}
                  </datalist>
                </div>
                <div className="sm:w-1/3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                      placeholder="Amount"
                    />
                  </div>
                </div>
                {expenses.length > 1 && (
                  <button 
                    onClick={() => removeExpenseRow(expense.id)}
                    className="self-center text-gray-500 hover:text-red-600 transition-colors duration-200"
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
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 transition-all duration-300">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b pb-2">Advance Salary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
              <input
                type="text"
                name="employee"
                value={advanceSalary.employee}
                onChange={handleAdvanceSalaryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
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
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                placeholder="Additional remarks"
              />
            </div>
          </div>
        </div>
  
        {/* Submit Button */}
        <div className="flex justify-center mb-6">
          <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`bg-gradient-to-r from-gray-800 to-gray-700 hover:from-black hover:to-gray-800 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-lg focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all duration-200 shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Processing...' : (isEditMode ? `Update Data for ${selectedDate}` : "Submit Data")}
        </button>
        </div>
      </main>
  
      <footer className="bg-gradient-to-r from-gray-100 to-white border-t border-gray-200 py-4 mt-6 sm:mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} CashSnap
        </div>
      </footer>
    </div>
  );
}