import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET() {
  try {
    const suggestions = await googleSheetsService.getExpenseSuggestions();
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching expense suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch expense suggestions' }, { status: 500 });
  }
}