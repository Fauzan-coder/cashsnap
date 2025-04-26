"use client";
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

export default function Settings() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const initializeSheet = async () => {
    setIsInitializing(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/init-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initialize sheet');
      }

      setMessage('Sheet initialized successfully!');
    } catch (error) {
      console.error("Failed to initialize sheet:", error);
      setMessage('Failed to initialize sheet. Please check your configuration.');
      setIsError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Settings - Daily Sales & Expense Tracker</title>
        <meta name="description" content="Configure your sales and expense tracker" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Back to Home
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Google Sheets Configuration</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Initialize or reset your Google Sheets. This will create all necessary sheets and headers if they don't exist.
            </p>
            
            <button 
              onClick={initializeSheet}
              disabled={isInitializing}
              className={`${
                isInitializing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium py-2 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300`}
            >
              {isInitializing ? 'Initializing...' : 'Initialize Sheets'}
            </button>
            
            {message && (
              <p className={`mt-4 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-3">Environment Variables Required:</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>GOOGLE_CLIENT_EMAIL - Your Google service account email</li>
              <li>GOOGLE_PRIVATE_KEY - Your Google service account private key</li>
              <li>SPREADSHEET_ID - The ID of your Google Sheet</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}