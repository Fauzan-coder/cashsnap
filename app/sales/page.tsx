// app/sales/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

interface FormData {
  date: string;
  upiAmount: string;
  cardAmount: string;
  cashAmount: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    upiAmount: '',
    cardAmount: '',
    cashAmount: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          upiAmount: parseFloat(formData.upiAmount) || 0,
          cardAmount: parseFloat(formData.cardAmount) || 0,
          cashAmount: parseFloat(formData.cashAmount) || 0,
        }),
      });

      
let data;
try {
  data = await response.json();
} catch (jsonError) {
  throw new Error('Invalid JSON response from server');
}


      if (!response.ok) {
        throw new Error(data.error || 'Failed to record sale');
      }

      setSuccess('Sale recorded successfully!');
      setFormData({
        date: formData.date,
        upiAmount: '',
        cardAmount: '',
        cashAmount: '',
      });

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Record Daily Sales</h1>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          Back to Home
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="upiAmount">
              UPI Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              id="upiAmount"
              name="upiAmount"
              value={formData.upiAmount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardAmount">
              Card Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              id="cardAmount"
              name="cardAmount"
              value={formData.cardAmount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cashAmount">
              Cash Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              id="cashAmount"
              name="cashAmount"
              value={formData.cashAmount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Recording...' : 'Record Sale'}
            </button>
            <div className="text-lg font-bold">
              Total: ₹{(
                parseFloat(formData.upiAmount || '0') +
                parseFloat(formData.cardAmount || '0') +
                parseFloat(formData.cashAmount || '0')
              ).toFixed(2)}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}