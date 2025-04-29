// app/api/date-exists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }
    
    const exists = await googleSheetsService.checkDateExists(date);
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking if date exists:', error);
    return NextResponse.json({ error: 'Failed to check if date exists' }, { status: 500 });
  }
}