// app/api/init-sheet/route.ts
import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function POST() {
  try {
    await googleSheetsService.initializeSheet();
    return NextResponse.json({ success: true, message: 'Sheet initialized successfully' });
  } catch (error) {
    console.error('Error initializing sheet:', error);
    return NextResponse.json({ error: 'Failed to initialize sheet' }, { status: 500 });
  }
}