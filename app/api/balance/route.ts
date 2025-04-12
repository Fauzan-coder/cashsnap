import { getDailyBalance, updateBalance } from '@/lib/google-sheets';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface BalanceRequestBody {
  date: string;
  openingBalance: number;
  closingBalance: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const balance = await getDailyBalance(date);
    return NextResponse.json({ success: true, data: balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: BalanceRequestBody = await request.json();

    const { date, openingBalance, closingBalance } = body;

    if (!date || openingBalance === undefined || closingBalance === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await updateBalance(date, openingBalance, closingBalance);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}