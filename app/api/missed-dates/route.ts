import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET() {
  try {
    const missedDates = await googleSheetsService.checkMissedDates();
    return NextResponse.json({ missedDates });
  } catch (error) {
    console.error('Error checking missed dates:', error);
    return NextResponse.json({ error: 'Failed to check missed dates' }, { status: 500 });
  }
}