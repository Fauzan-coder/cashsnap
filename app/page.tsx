// app/page.tsx
import Link from 'next/link';
import React from 'react';
const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">CashSnap - Shop Financial Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/sales" className="block">
          <div className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow-md transition-all">
            <h2 className="text-xl font-semibold mb-2">Record Sales</h2>
            <p>Enter daily sales via UPI, card, and cash</p>
          </div>
        </Link>

        <Link href="/expenses" className="block">
          <div className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg shadow-md transition-all">
            <h2 className="text-xl font-semibold mb-2">Record Expenses</h2>
            <p>Log daily expenses with descriptions</p>
          </div>
        </Link>

        <Link href="/advances" className="block">
          <div className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-lg shadow-md transition-all">
            <h2 className="text-xl font-semibold mb-2">Salary Advances</h2>
            <p>Record advances given to employees</p>
          </div>
        </Link>

        <Link href="/balance" className="block">
          <div className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow-md transition-all">
            <h2 className="text-xl font-semibold mb-2">Daily Balance</h2>
            <p>View opening and closing balances</p>
          </div>
        </Link>

        <Link href="/dashboard" className="block">
          <div className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow-md transition-all">
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p>View summary and reports</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
