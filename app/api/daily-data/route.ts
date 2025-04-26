// app/api/daily-data/route.ts
import { NextResponse } from 'next/server';
import googleSheetsService from '@/lib/googleSheetsService';

export async function GET(request: Request) {
  try {
    // Get the URL to check if a date parameter is provided
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    if (date) {
      // If a date is provided, fetch data for that specific date
      const dataForDate = await googleSheetsService.getDataForDate(date);
      
      if (!dataForDate) {
        return NextResponse.json({ error: 'No data found for the specified date' }, { status: 404 });
      }
      
      return NextResponse.json(dataForDate);
    } else {
      // If no date is provided, return yesterday's data for opening balance
      const yesterdayData = await googleSheetsService.getYesterdayData();
      return NextResponse.json({ 
        openingBalance: yesterdayData.openingBalance + yesterdayData.sales - 
                      yesterdayData.expenses - yesterdayData.advanceSalary 
      });
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const data = await request.json();
      console.log("API received data:", JSON.stringify(data, null, 2));
      
      // Check if this is an update operation
      const isUpdate = data.isUpdate === true;
      
      if (isUpdate) {
        await googleSheetsService.updateDataForDate(data.date, data);
        return NextResponse.json({ success: true, message: 'Data updated successfully' });
      } else {
        // Ensure all required fields are present
        if (!data.date || data.totalSales === undefined || data.totalExpenses === undefined) {
          return NextResponse.json({ 
            error: 'Missing required fields in data', 
            receivedData: data 
          }, { status: 400 });
        }
        
        await googleSheetsService.appendSalesData(data);
        return NextResponse.json({ success: true, message: 'Data saved successfully' });
      }
    } catch (error) {
      console.error('Error in API route:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      } else {
        console.error('Error details:', error);
      }
      return NextResponse.json({ 
        error: 'Failed to save data', 
        message: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  }

// export async function POST(request: Request) {
//   try {
//     const data = await request.json();
    
//     // Check if this is an update operation
//     const isUpdate = data.isUpdate === true;
    
//     if (isUpdate) {
//       await googleSheetsService.updateDataForDate(data.date, data);
//       return NextResponse.json({ success: true, message: 'Data updated successfully' });
//     } else {
//       await googleSheetsService.appendSalesData(data);
//       return NextResponse.json({ success: true, message: 'Data saved successfully' });
//     }
//   } catch (error) {
//     console.error('Error in API route:', error);
//     return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
//   }
// }