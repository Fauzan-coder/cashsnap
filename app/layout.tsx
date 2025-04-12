// app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/navbar';
const inter = Inter({ subsets: ['latin'] });
import React from 'react';

export const metadata = {
  title: 'CashSnap - Shop Financial Management',
  description: 'Financial management app for small retail shops',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
