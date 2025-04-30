"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, BarChart, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, Cell, ResponsiveContainer } from 'recharts';
import { Home, IndianRupee, ArrowDown, Users } from 'lucide-react';
import ReportGenerator from '../components/ReportGenerator';
import Link from 'next/link';
import SearchableDropdown from '../components/SearchableDropdown';

// TypeScript interfaces
interface SalesDataPoint {
  time?: string;
  day?: string;
  month?: string;
  date?: string;
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
  const [dataCache, setDataCache] = useState<{[key: string]: Partial<AnalyticsState>}>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
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

  // Parse date string to Date object
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };

  // Generate week options from available dates
  const generateWeekOptions = useCallback((dates: string[]): string[] => {
    const weekMap = new Map<string, string>();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    dates.forEach(dateStr => {
      const date = parseDate(dateStr);
      const year = date.getFullYear();
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Calculate start of week (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      
      // Calculate end of week (Saturday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Format: "21-27 April 2025"
      const weekKey = `${weekStart.getDate()}-${weekEnd.getDate()} ${monthNames[weekStart.getMonth()]} ${year}`;
      
      weekMap.set(weekKey, weekKey);
    });
    
    return Array.from(weekMap.keys()).sort((a, b) => {
      const dateA = new Date(a.split(' ').slice(1).join(' '));
      const dateB = new Date(b.split(' ').slice(1).join(' '));
      return dateA.getTime() - dateB.getTime();
    });
  }, []);

  // Generate month options from available dates
  const generateMonthOptions = useCallback((dates: string[]): string[] => {
    const monthMap = new Map<string, string>();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    dates.forEach(dateStr => {
      const date = parseDate(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${monthNames[month]} ${year}`;
      monthMap.set(monthKey, monthKey);
    });
    
    return Array.from(monthMap.keys()).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, []);

  // Fetch available dates
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/available-dates');
        if (!response.ok) throw new Error('Failed to fetch available dates');
        
        const data = await response.json();
        const sortedDates = (data.dates || []).sort();
        setAvailableDates(sortedDates);
        
        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[sortedDates.length - 1]);
          
          const weeks = generateWeekOptions(sortedDates);
          setAvailableWeeks(weeks);
          if (weeks.length > 0) setSelectedWeek(weeks[weeks.length - 1]);
    
          const months = generateMonthOptions(sortedDates);
          setAvailableMonths(months);
          if (months.length > 0) setSelectedMonth(months[months.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableDates();
  }, [generateWeekOptions, generateMonthOptions]);

  // Get dates for selected week
  const getDatesForWeek = useCallback((weekRange: string): string[] => {
    // Parse format like "21-27 April 2025"
    const parts = weekRange.split(' ');
    const dayRange = parts[0].split('-');
    const month = parts[1];
    const year = parseInt(parts[2]);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(month);
    
    if (monthIndex === -1) return [];
    
    const startDate = new Date(year, monthIndex, parseInt(dayRange[0]));
    const endDate = new Date(year, monthIndex, parseInt(dayRange[1]));
    
    return availableDates.filter(dateStr => {
      const date = parseDate(dateStr);
      return date >= startDate && date <= endDate;
    });
  }, [availableDates]);

  // Get dates for selected month
  const getDatesForMonth = useCallback((monthYear: string): string[] => {
    if (!monthYear) return [];
    
    const parts = monthYear.split(' ');
    if (parts.length !== 2) return [];
    
    const month = parts[0];
    const year = parseInt(parts[1]);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(month);
    
    if (monthIndex === -1 || isNaN(year)) return [];
    
    // Add explicit logging
    console.log(`Filtering for month: ${month} (index: ${monthIndex}), year: ${year}`);
    
    const filteredDates = availableDates.filter(dateStr => {
      const date = new Date(dateStr);
      const matches = date.getFullYear() === year && date.getMonth() === monthIndex;
      return matches;
    });
    
    console.log(`Found ${filteredDates.length} dates for ${month} ${year}`);
    return filteredDates;
  }, [availableDates]);
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    const cacheKey = `${selectedPeriod}-${selectedPeriod === 'daily' ? selectedDate : 
    selectedPeriod === 'weekly' ? selectedWeek : selectedMonth}`;

    console.log("Fetching data with key:", cacheKey);
    console.log("Cache contains keys:", Object.keys(dataCache));

    if (dataCache[cacheKey]) {
    console.log("Using cached data for", cacheKey);
    setAnalytics({
      loading: false,
      salesData: dataCache[cacheKey]?.salesData || [],
      paymentMethodDistribution: dataCache[cacheKey]?.paymentMethodDistribution || [],
      expenseCategories: dataCache[cacheKey]?.expenseCategories || [],
      employeeAdvances: dataCache[cacheKey]?.employeeAdvances || [],
      dailySummary: dataCache[cacheKey]?.dailySummary || []
    });
    return;
    }
    
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      console.log("Loading new data for", cacheKey);

      
      let dateRange: string[] = [];
      
      if (selectedPeriod === 'daily' && selectedDate) {
        dateRange = [selectedDate];
      } else if (selectedPeriod === 'weekly' && selectedWeek) {
        dateRange = getDatesForWeek(selectedWeek);
        console.log("Week dates:", selectedWeek, dateRange);
      } else if (selectedPeriod === 'monthly' && selectedMonth) {
        dateRange = getDatesForMonth(selectedMonth);
        console.log("Month dates:", selectedMonth, dateRange);
      }
      if (dateRange.length === 0) {
        setAnalytics({
          loading: false,
          salesData: [],
          paymentMethodDistribution: [],
          expenseCategories: [],
          employeeAdvances: [],
          dailySummary: []
        });
        return;
      }
      
      // Fetch all data in parallel
      const allData = await Promise.all(
        dateRange.map(date => 
          fetch(`/api/daily-data?date=${date}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
      ).then(results => results.filter(Boolean));
      
      if (allData.length === 0) {
        setAnalytics({
          loading: false,
          salesData: [],
          paymentMethodDistribution: [],
          expenseCategories: [],
          employeeAdvances: [],
          dailySummary: []
        });
        return;
      }
      
      const processedData = processDataForDashboard(allData, selectedPeriod);
      
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
  }, [selectedPeriod, selectedDate, selectedWeek, selectedMonth, dataCache, getDatesForWeek, getDatesForMonth]);

  useEffect(() => {
    if (
      (selectedPeriod === 'daily' && selectedDate) ||
      (selectedPeriod === 'weekly' && selectedWeek) ||
      (selectedPeriod === 'monthly' && selectedMonth)
    ) {
      fetchDashboardData();
    }
  }, [selectedPeriod, selectedDate, selectedWeek, selectedMonth, fetchDashboardData]);

  // Process data for dashboard display
  const processDataForDashboard = (
    allData: DailyData[],
    periodType: 'daily' | 'weekly' | 'monthly'
  ): Partial<AnalyticsState> => {
    // Payment method distribution
    let totalCash = 0, totalUpi = 0, totalCard = 0;
    
    allData.forEach(data => {
      totalCash += parseFloat(data.cash || '0');
      totalUpi += parseFloat(data.upi || '0');
      totalCard += parseFloat(data.card || '0');
    });
    
    const totalPayments = totalCash + totalUpi + totalCard;
    const paymentMethodDistribution = [
      { name: 'Cash', value: Math.round((totalCash / totalPayments) * 100) || 0, color: '#FF6384' },
      { name: 'UPI', value: Math.round((totalUpi / totalPayments) * 100) || 0, color: '#36A2EB' },
      { name: 'Card', value: Math.round((totalCard / totalPayments) * 100) || 0, color: '#FFCE56' }
    ].filter(method => method.value > 0);

    // Expense categories
    const expenseMap = new Map<string, number>();
    allData.forEach(data => {
      (data.expenses || []).forEach(expense => {
        if (expense.description && expense.amount) {
          expenseMap.set(expense.description, (expenseMap.get(expense.description) || 0) + expense.amount);
        }
      });
    });

    const expenseCategories = Array.from(expenseMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .filter(category => category.amount > 0);

    // Sales data
    let salesData: SalesDataPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (periodType === 'daily') {
      salesData = allData.map(data => ({
        time: data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        date: data.date,
        sales: data.totalSales || 0
      }));
    } else if (periodType === 'weekly') {
      salesData = allData.map(data => ({
        day: data.date ? dayNames[new Date(data.date).getDay()] : 'Unknown',
        date: data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        sales: data.totalSales || 0
      }));
    } else {
      salesData = allData.map(data => ({
        month: data.date ? new Date(data.date).toLocaleDateString('en-US', { day: 'numeric' }) : 'Unknown',
        date: data.date,
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
      .sort((a, b) => b.advances - a.advances)
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

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const handleWeekChange = (newWeek: string) => {
    setSelectedWeek(newWeek);
    console.log("Selected week changed to:", newWeek);
  };

  const handleMonthChange = (newMonth: string) => {
    console.log("Month changed from", selectedMonth, "to", newMonth);
    
    // Clear cached data for this period type
    const cacheKeysToRemove = Object.keys(dataCache).filter(key => key.startsWith('monthly-'));
    const newCache = {...dataCache};
    cacheKeysToRemove.forEach(key => delete newCache[key]);
    setDataCache(newCache);
    
    // Update the selected month
    setSelectedMonth(newMonth);
  };

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    // Clear cache when switching period types
    setDataCache({});
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format functions for the dropdowns
  const formatDateForDisplay = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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

  // Calculate summaries
  const totalSales = analytics.loading ? 0 : analytics.salesData.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalExpenses = analytics.loading ? 0 : analytics.expenseCategories.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAdvances = analytics.loading ? 0 : analytics.employeeAdvances.reduce((sum, emp) => sum + (emp.advances || 0), 0);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

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
              <SearchableDropdown
                value={selectedDate}
                options={availableDates}
                onChange={handleDateChange}
                placeholder="Select a date"
                className="w-64"
                formatOption={formatDateForDisplay}
                formatSelection={formatDateForDisplay}
              />
            )}
            
            {selectedPeriod === 'weekly' && (
              <SearchableDropdown
                value={selectedWeek}
                options={availableWeeks}
                onChange={handleWeekChange}
                placeholder="Select a week"
                className="w-64"
              />
            )}
            
            {selectedPeriod === 'monthly' && (
              <SearchableDropdown
                value={selectedMonth}
                options={availableMonths}
                onChange={handleMonthChange}
                placeholder="Select a month"
                className="w-64"
              />
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
                  {formatCurrency(totalAdvances)}
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
              ) : analytics.salesData.length > 0 ? (
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
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => {
                        const dataPoint = analytics.salesData.find(item => 
                          selectedPeriod === 'daily' ? item.time === label :
                          selectedPeriod === 'weekly' ? item.day === label :
                          item.month === label
                        );
                        return dataPoint?.date ? 
                          new Date(dataPoint.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : label;
                      }}
                    />
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
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No sales data available
                </div>
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
                        {formatCurrency(totalAdvances)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(day.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
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