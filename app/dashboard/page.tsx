"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, Cell, ResponsiveContainer } from 'recharts';
import { Home, IndianRupee, ArrowDown, Users } from 'lucide-react';
import ReportGenerator from '../components/ReportGenerator';
import Link from 'next/link';

// TypeScript interfaces
interface SalesDataPoint {
  time?: string;
  day?: string;
  month?: string;
  sales: number;
}

interface ExpenseDetail {
  description: string;
  amount: number;
}

interface AdvanceSalary {
  employee: string;
  amount: number;
}

interface DailyData {
  date?: string;
  totalSales?: number;
  totalExpenses?: number;
  openingBalance?: number;
  closingBalance?: number;
  cash?: string;
  upi?: string;
  card?: string;
  expenses?: ExpenseDetail[];
  advanceSalary?: AdvanceSalary;
}

interface PaymentMethodDistribution {
  name: string;
  value: number;
  color: string;
}

interface ExpenseCategory {
  name: string;
  amount: number;
}

interface EmployeeAdvance {
  name: string;
  advances: number;
}

interface DailySummary {
  date: string;
  openingBalance: number;
  totalSales: number;
  totalExpenses: number;
  closingBalance: number;
}

interface AnalyticsState {
  loading: boolean;
  salesData: SalesDataPoint[];
  paymentMethodDistribution: PaymentMethodDistribution[];
  expenseCategories: ExpenseCategory[];
  employeeAdvances: EmployeeAdvance[];
  dailySummary: DailySummary[];
}

export default function Dashboard() {
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    loading: true,
    salesData: [],
    paymentMethodDistribution: [],
    expenseCategories: [],
    employeeAdvances: [],
    dailySummary: []
  });

  // Fetch available dates and generate weeks/months
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch('/api/available-dates');
        if (!response.ok) throw new Error('Failed to fetch available dates');
        
        const data = await response.json();
        setAvailableDates(data.dates || []);
        
        if (data.dates?.length > 0 && !selectedDate) {
          setSelectedDate(data.dates[data.dates.length - 1]);
        }
    
        if (data.dates?.length > 0) {
          const weeks = generateWeekOptions(data.dates);
          setAvailableWeeks(weeks);
          if (weeks.length > 0) setSelectedWeek(weeks[weeks.length - 1]);
    
          const months = generateMonthOptions(data.dates);
          setAvailableMonths(months);
          if (months.length > 0) setSelectedMonth(months[months.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        setAvailableDates([]);
        setAvailableWeeks([]);
        setAvailableMonths([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailableDates();
  }, []);

  // Generate week options from available dates
  const generateWeekOptions = (dates: string[]): string[] => {
    const weekMap = new Map<string, string>();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const dayOfMonth = date.getDate();
      const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
      
      const weekKey = `Week ${weekOfMonth} of ${monthNames[month]} ${year}`;
      weekMap.set(weekKey, weekKey);
    });
    
    return Array.from(weekMap.keys()).sort();
  };

  // Generate month options from available dates
  const generateMonthOptions = (dates: string[]): string[] => {
    const monthMap = new Map<string, string>();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${monthNames[month]} ${year}`;
      monthMap.set(monthKey, monthKey);
    });
    
    return Array.from(monthMap.keys()).sort();
  };

  // Fetch data when period or filters change
  useEffect(() => {
    const fetchDashboardData = async () => {
      setAnalytics(prev => ({ ...prev, loading: true }));
      const cacheKey = `${selectedPeriod}-${selectedDate || selectedWeek || selectedMonth}`;
      
      if (dataCache[cacheKey]) {
        setAnalytics({ loading: false, ...dataCache[cacheKey] });
        return;
      }
      
      try {
        let apiUrl = '/api/daily-data';
        let dateFilter = '';
        
        if (selectedPeriod === 'daily' && selectedDate) {
          dateFilter = `?date=${selectedDate}`;
        } else if (selectedPeriod === 'weekly' && selectedWeek) {
          const match = selectedWeek.match(/Week (\d+) of (\w+) (\d+)/);
          if (match) {
            const [_, weekNum, monthName, year] = match;
            dateFilter = `?week=${weekNum}&month=${monthName}&year=${year}`;
          }
        } else if (selectedPeriod === 'monthly' && selectedMonth) {
          const match = selectedMonth.match(/(\w+) (\d+)/);
          if (match) {
            const [_, monthName, year] = match;
            dateFilter = `?month=${monthName}&year=${year}`;
          }
        }
        
        const response = await fetch(apiUrl + dateFilter);
        if (!response.ok) throw new Error('Failed to fetch data');

        const dailyData: DailyData = await response.json();
        let dateRange: string[] = [];

        if (selectedPeriod === 'daily') {
          dateRange = [selectedDate];
        } else if (selectedPeriod === 'weekly') {
          const match = selectedWeek.match(/Week (\d+) of (\w+) (\d+)/);
          if (match) {
            const [_, weekNum, monthName, year] = match;
            dateRange = getDatesForWeek(parseInt(weekNum), monthName, parseInt(year), availableDates);
          }
        } else if (selectedPeriod === 'monthly') {
          const match = selectedMonth.match(/(\w+) (\d+)/);
          if (match) {
            const [_, monthName, year] = match;
            dateRange = getDatesForMonth(monthName, parseInt(year), availableDates);
          }
        }

        const allData = await Promise.all(
          dateRange.map(date => 
            fetch(`/api/daily-data?date=${date}`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          )
        ).then(results => results.filter(Boolean));

        const processedData = processDataForDashboard(dailyData, allData, selectedPeriod);
        
        setDataCache(prev => ({ ...prev, [cacheKey]: processedData }));
        setAnalytics({
          loading: false,
          salesData: processedData.salesData || [],
          paymentMethodDistribution: processedData.paymentMethodDistribution || [],
          expenseCategories: processedData.expenseCategories || [],
          employeeAdvances: processedData.employeeAdvances || [],
          dailySummary: processedData.dailySummary || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };
    
    if (
      (selectedPeriod === 'daily' && selectedDate) ||
      (selectedPeriod === 'weekly' && selectedWeek) ||
      (selectedPeriod === 'monthly' && selectedMonth)
    ) {
      fetchDashboardData();
    }
  }, [selectedPeriod, selectedDate, selectedWeek, selectedMonth, availableDates, dataCache]);

  // Helper function to get dates for a specific week
  const getDatesForWeek = (weekNum: number, monthName: string, year: number, availableDates: string[]): string[] => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.findIndex(m => m === monthName);
    if (monthIndex === -1) return [];
    
    return availableDates.filter(dateStr => {
      const date = new Date(dateStr);
      if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return false;
      
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      const dayOfMonth = date.getDate();
      const currentWeekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
      return currentWeekOfMonth === weekNum;
    });
  };

  // Helper function to get dates for a specific month
  const getDatesForMonth = (monthName: string, year: number, availableDates: string[]): string[] => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.findIndex(m => m === monthName);
    if (monthIndex === -1) return [];
    
    return availableDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
  };

  // Process the fetched data for the dashboard
  const processDataForDashboard = (dailyData: DailyData, allData: DailyData[], 
    periodType: 'daily' | 'weekly' | 'monthly'): Partial<AnalyticsState> => {
    
    // Payment method distribution
    let totalCash = 0, totalUpi = 0, totalCard = 0;
    
    if (periodType === 'daily') {
      totalCash = parseFloat(dailyData.cash || '0');
      totalUpi = parseFloat(dailyData.upi || '0');
      totalCard = parseFloat(dailyData.card || '0');
    } else {
      allData.forEach(data => {
        totalCash += parseFloat(data.cash || '0');
        totalUpi += parseFloat(data.upi || '0');
        totalCard += parseFloat(data.card || '0');
      });
    }
    
    const totalPayments = totalCash + totalUpi + totalCard;
    const paymentMethodDistribution = [
      { name: 'Cash', value: Math.round((totalCash / totalPayments) * 100) || 0, color: '#FF6384' },
      { name: 'UPI', value: Math.round((totalUpi / totalPayments) * 100) || 0, color: '#36A2EB' },
      { name: 'Card', value: Math.round((totalCard / totalPayments) * 100) || 0, color: '#FFCE56' }
    ].filter(method => method.value > 0);

    // Expense categories
    const expenseMap = new Map<string, number>();
    const processExpenses = (expenses: ExpenseDetail[] = []) => {
      expenses.forEach(expense => {
        if (expense.description && expense.amount) {
          expenseMap.set(expense.description, (expenseMap.get(expense.description) || 0) + expense.amount);
        }
      });
    };

    if (periodType === 'daily') {
      processExpenses(dailyData.expenses);
    } else {
      allData.forEach(data => processExpenses(data.expenses));
    }

    const expenseCategories = Array.from(expenseMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .filter(category => category.amount > 0);

    // Sales data
    let salesData: SalesDataPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (periodType === 'daily') {
      salesData = [{ time: 'Daily Total', sales: dailyData.totalSales || 0 }];
    } else if (periodType === 'weekly') {
      salesData = allData
        .filter(data => data.date && data.totalSales !== undefined)
        .map(data => ({
          day: data.date ? dayNames[new Date(data.date).getDay()] : 'Unknown',
          sales: data.totalSales || 0
        }));
    } else {
      salesData = allData
        .filter(data => data.date && data.totalSales !== undefined)
        .map(data => ({
          month: `${data.date ? new Date(data.date).getDate() : ''}`,
          sales: data.totalSales || 0
        }));
    }

    // Employee advances
    const employeeAdvanceMap = new Map<string, number>();
    allData.forEach(data => {
      if (data.advanceSalary?.employee && data.advanceSalary.amount > 0) {
        const name = data.advanceSalary.employee;
        employeeAdvanceMap.set(name, (employeeAdvanceMap.get(name) || 0) + data.advanceSalary.amount);
      }
    });

    const employeeAdvances = Array.from(employeeAdvanceMap.entries())
      .map(([name, advances]) => ({ name, advances }))
      .filter(advance => advance.advances > 0);

    // Daily summary
    const dailySummary = allData
      .filter(data => data.date)
      .map(data => ({
        date: data.date || '',
        openingBalance: data.openingBalance || 0,
        totalSales: data.totalSales || 0,
        totalExpenses: data.totalExpenses || 0,
        closingBalance: data.closingBalance || 0
      }));

    return {
      salesData,
      paymentMethodDistribution,
      expenseCategories,
      employeeAdvances,
      dailySummary
    };
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeek(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate summaries
  const totalSales = analytics.loading ? 0 : analytics.salesData.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalExpenses = analytics.loading ? 0 : analytics.expenseCategories.reduce((sum, item) => sum + (item.amount || 0), 0);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        {/* Key Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 flex items-center">
              <div className="p-4 bg-gray-100 rounded-lg mr-4">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-full">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
              <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="overflow-x-auto">
            <div className="h-8 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded w-full mb-2 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              <Home size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Business Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {selectedPeriod === 'daily' && (
              <select 
                className="bg-white border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={handleDateChange}
              >
                {availableDates.length > 0 ? (
                  availableDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))
                ) : (
                  <option value="">No dates available</option>
                )}
              </select>
            )}
            
            {selectedPeriod === 'weekly' && (
              <select 
                className="bg-white border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedWeek}
                onChange={handleWeekChange}
              >
                {availableWeeks.length > 0 ? (
                  availableWeeks.map(week => (
                    <option key={week} value={week}>{week}</option>
                  ))
                ) : (
                  <option value="">No weeks available</option>
                )}
              </select>
            )}
            
            {selectedPeriod === 'monthly' && (
              <select 
                className="bg-white border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                {availableMonths.length > 0 ? (
                  availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))
                ) : (
                  <option value="">No months available</option>
                )}
              </select>
            )}
            
            <div className="bg-white rounded-md shadow-sm flex">
              <button 
                className={`py-2 px-4 ${selectedPeriod === 'daily' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                onClick={() => handlePeriodChange('daily')}
              >
                Daily
              </button>
              <button 
                className={`py-2 px-4 ${selectedPeriod === 'weekly' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                onClick={() => handlePeriodChange('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`py-2 px-4 ${selectedPeriod === 'monthly' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                onClick={() => handlePeriodChange('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
        
        {analytics.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 flex items-center">
                <div className="p-4 bg-gray-100 rounded-lg mr-4">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
              <div className="p-4 bg-blue-100 rounded-lg mr-4">
                <IndianRupee size={24} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSales)}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
              <div className="p-4 bg-red-100 rounded-lg mr-4">
                <ArrowDown size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
              <div className="p-4 bg-purple-100 rounded-lg mr-4">
                <Users size={24} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Staff Advances</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(analytics.employeeAdvances.reduce((sum, emp) => sum + (emp.advances || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
            <div className="h-80">
              {analytics.loading ? (
                <div className="h-full bg-gray-100 rounded animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.salesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={selectedPeriod === 'daily' ? 'time' : 
                              selectedPeriod === 'weekly' ? 'day' : 'month'} 
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            <div className="h-80 flex items-center justify-center">
              {analytics.loading ? (
                <div className="h-full bg-gray-100 rounded animate-pulse"></div>
              ) : analytics.paymentMethodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.paymentMethodDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.paymentMethodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No payment data available
                </div>
              )}
            </div>
          </div>
          
          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
            <div className="h-80">
              {analytics.loading ? (
                <div className="h-full bg-gray-100 rounded animate-pulse"></div>
              ) : analytics.expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.expenseCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="amount" fill="#FF6384">
                      {analytics.expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
          </div>
          
          {/* Staff Advances Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Staff Advances</h2>
            <div className="h-80 overflow-y-auto">
              {analytics.loading ? (
                <div className="h-full bg-gray-100 rounded animate-pulse"></div>
              ) : analytics.employeeAdvances.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.employeeAdvances.map((employee, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{formatCurrency(employee.advances)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        {formatCurrency(analytics.employeeAdvances.reduce((sum, emp) => sum + (emp.advances || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No staff advances recorded
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Daily Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
          <div className="overflow-x-auto">
            {analytics.loading ? (
              <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
            ) : analytics.dailySummary && analytics.dailySummary.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.dailySummary.map((day, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(day.openingBalance)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(day.totalSales)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatCurrency(day.totalExpenses)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(day.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totals</td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {analytics.dailySummary.length > 0 ? formatCurrency(analytics.dailySummary[0].openingBalance) : '₹0'}
                    </td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                      {formatCurrency(analytics.dailySummary.reduce((sum, day) => sum + (day.totalSales || 0), 0))}
                    </td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                      {formatCurrency(analytics.dailySummary.reduce((sum, day) => sum + (day.totalExpenses || 0), 0))}
                    </td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      {analytics.dailySummary.length > 0 ? formatCurrency(analytics.dailySummary[analytics.dailySummary.length - 1].closingBalance) : '₹0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No daily summary data available
              </div>
            )}
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Financial Reports</h1>
          <ReportGenerator />
        </div>
      </div>
    </div>
  );
}