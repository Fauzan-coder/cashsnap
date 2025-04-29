// app/api/available-dates/route.ts
import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET() {
  try {
    const dates = await googleSheetsService.getAvailableDates();
    
    // Set CORS headers to allow requests from any origin
    return new NextResponse(JSON.stringify({ dates }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch available dates' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
// // app/api/available-dates/route.ts
// import { NextResponse } from 'next/server';
// import googleSheetsService from '@/lib/googleSheetsService';

// export async function GET() {
//   try {
//     const dates = await googleSheetsService.getAvailableDates();
//     return NextResponse.json({ dates });
//   } catch (error) {
//     console.error('Error fetching available dates:', error);
//     return NextResponse.json({ error: 'Failed to fetch available dates' }, { status: 500 });
//   }
// }