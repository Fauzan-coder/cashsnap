import { NextResponse } from 'next/server';
import { addSale, testConnection } from '@/lib/google-sheets';

export async function POST(request: Request) {
  console.log('Received POST request to /api/sales');
  
  try {
    // Test the connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to Google Sheets');
      return NextResponse.json({ 
        error: 'Could not connect to Google Sheets API' 
      }, { status: 500 });
    }
    
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Extract and validate data
    const { date, upiAmount, cardAmount, cashAmount } = body;
    
    if (!date) {
      console.error('Missing required field: date');
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    
    // Convert to numbers and handle potential NaN values
    const upiAmountNum = parseFloat(upiAmount.toString()) || 0;
    const cardAmountNum = parseFloat(cardAmount.toString()) || 0;
    const cashAmountNum = parseFloat(cashAmount.toString()) || 0;
    
    console.log('Processing sale:', { 
      date, 
      upiAmount: upiAmountNum, 
      cardAmount: cardAmountNum, 
      cashAmount: cashAmountNum 
    });
    
    // Call the Google Sheets API function to add the sale
    const result = await addSale(date, upiAmountNum, cardAmountNum, cashAmountNum);
    
    console.log('Sale recorded successfully:', result);
    return NextResponse.json({ 
      success: true, 
      message: 'Sale recorded successfully',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error recording sale:', error);
    
    // Check if it's an object with a message property
    let errorMessage = 'Failed to record sale';
    if (error && typeof error === 'object') {
      if ('message' in error) {
        errorMessage = error.message;
      } else if ('toString' in error && typeof error.toString === 'function') {
        errorMessage = error.toString();
      }
    }
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}

// Add a GET method to test if the API route is working
export async function GET() {
  return NextResponse.json({ status: 'Sales API is working' });
}