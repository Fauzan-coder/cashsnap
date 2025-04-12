// app/dashboard/page.tsx
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BalanceData {
  openingBalance: number;
  closingBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalAdvances?: number;
}

interface SalesRecord {
  [key: string]: string | number;
  UPI_Amount: string;
  Card_Amount: string;
  Cash_Amount: string;
  Total: string;
  Timestamp: string;
}

interface ExpenseRecord {
  [key: string]: string | number;
  Amount: string;
  Description: string;
  Timestamp: string;
}

export default function DashboardPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [expensesData, setExpensesData] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch balance data
      const balanceResponse = await fetch(`/api/balance?date=${date}`);
      const balanceResult = await balanceResponse.json();

      if (!balanceResponse.ok) {
        throw new Error(balanceResult.error || 'Failed to fetch balance data');
      }

      setBalanceData(balanceResult.data);

      // Fetch sales data
      const salesResponse = await fetch('/api/sales');
      const salesResult = await salesResponse.json();

      if (!salesResponse.ok) {
        throw new Error(salesResult.error || 'Failed to fetch sales data');
      }

      // Process sales data (get header and filter by date)
      if (salesResult.data && salesResult.data.length > 0) {
        const headers = salesResult.data[0] as string[];
        const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
        
        const filteredSales = salesResult.data
          .slice(1)
          .filter((row: string[]) => row[dateIndex] === date);
        
        setSalesData(filteredSales.map((row: string[]) => {
          const rowObj: SalesRecord = {
            UPI_Amount: '',
            Card_Amount: '',
            Cash_Amount: '',
            Total: '',
            Timestamp: ''
          };
          headers.forEach((header: string, i: number) => {
            rowObj[header] = row[i];
          });
          return rowObj;
        }));
      }

      // Fetch expenses data
      const expensesResponse = await fetch('/api/expenses');
      const expensesResult = await expensesResponse.json();

      if (!expensesResponse.ok) {
        throw new Error(expensesResult.error || 'Failed to fetch expenses data');
      }

      // Process expenses data (get header and filter by date)
      if (expensesResult.data && expensesResult.data.length > 0) {
        const headers = expensesResult.data[0] as string[];
        const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
        
        const filteredExpenses = expensesResult.data
          .slice(1)
          .filter((row: string[]) => row[dateIndex] === date);
        
        setExpensesData(filteredExpenses.map((row: string[]) => {
          const rowObj: ExpenseRecord = {
            Amount: '',
            Description: '',
            Timestamp: ''
          };
          headers.forEach((header: string, i: number) => {
            rowObj[header] = row[i];
          });
          return rowObj;
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          Back to Home
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={date}
            onChange={handleDateChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading data...</p>
          </div>
        ) : (
          <div>
            {balanceData && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Opening Balance</h3>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(balanceData.openingBalance)}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">Closing Balance</h3>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(balanceData.closingBalance)}</p>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="text-sm font-semibold text-indigo-800 mb-1">Total Sales</h3>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(balanceData.totalSales)}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Total Expenses</h3>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(balanceData.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Transactions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Sales Transactions</h2>
                {salesData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            UPI
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Card
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cash
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesData.map((sale, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(sale.UPI_Amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(sale.Card_Amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(sale.Cash_Amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(sale.Total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(sale.Timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    No sales recorded for this date
                  </div>
                )}
              </div>

              {/* Expenses Transactions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Expenses</h2>
                {expensesData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expensesData.map((expense, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              {formatCurrency(expense.Amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {expense.Description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(expense.Timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    No expenses recorded for this date
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/sales" className="block">
          <div className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg shadow-md transition-all text-center">
            Record New Sale
          </div>
        </Link>
        
        <Link href="/expenses" className="block">
          <div className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg shadow-md transition-all text-center">
            Record New Expense
          </div>
        </Link>
      </div>
    </div>
  );
}