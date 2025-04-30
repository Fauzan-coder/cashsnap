import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'] });
import React from 'react';

export const metadata = {
  title: 'CashSnap - Shop Financial Management',
  description: 'Financial management App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cashsnap-logo.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/cashsnap-logo.ico" />
      </head>
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}