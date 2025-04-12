// app/balance/page.tsx
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BalanceData {
  openingBalance: number;
  closingBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalAdvances: number;
}

export default function BalancePage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBalanceData();
  }, [date]);

  const fetchBalanceData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/balance?date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance data');
      }

      setBalanceData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Balance</h1>
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
            <p className="mt-2">Loading balance data...</p>
          </div>
        ) : balanceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Opening Balance</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(balanceData.openingBalance)}</p>
                <p className="text-sm text-blue-500 mt-1">Balance at start of day</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Closing Balance</h3>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(balanceData.closingBalance)}</p>
                <p className="text-sm text-green-500 mt-1">Balance at end of day</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold">Daily Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="text-md font-semibold text-indigo-800 mb-1">Total Sales</h4>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(balanceData.totalSales)}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-800 mb-1">Total Expenses</h4>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(balanceData.totalExpenses)}</p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="text-md font-semibold text-amber-800 mb-1">Salary Advances</h4>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(balanceData.totalAdvances)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-1">Net Change</h4>
                <p className={`text-2xl font-bold ${balanceData.closingBalance >= balanceData.openingBalance ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balanceData.closingBalance - balanceData.openingBalance)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select a date to view balance data
          </div>
        )}
      </div>
    </div>
  );
}