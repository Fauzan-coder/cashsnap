// app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { addExpense, getSheetData } from '@/lib/google-sheets';

interface ExpenseRequestBody {
  date: string;
  amount: number;
  description: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ExpenseRequestBody = await request.json();
    const { date, amount, description } = body;

    if (!date || amount === undefined || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await addExpense(date, amount, description);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getSheetData('Expenses');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}