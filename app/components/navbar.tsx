import Link from 'next/link';
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link href="/" className="text-xl font-bold">CashSnap</Link>
          <div className="space-x-6">
            <Link href="/" className="hover:text-blue-300">Home</Link>
            <Link href="/dashboard" className="hover:text-blue-300">Dashboard</Link>
            <Link href="/balance" className="hover:text-blue-300">Balance</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;