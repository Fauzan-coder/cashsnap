// app/api/available-dates/route.ts
import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET() {
  try {
    const dates = await googleSheetsService.getAvailableDates();
    return NextResponse.json({ dates });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json({ error: 'Failed to fetch available dates' }, { status: 500 });
  }
}