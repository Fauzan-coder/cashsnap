// app/components/ReportGenerator.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type ReportData = {
  date: string;
  cash: string;
  upi: string;
  card: string;
  totalSales: number;
  expenses: { description: string; amount: number }[];
  totalExpenses: number;
  advanceSalary: {
    employee: string;
    amount: number;
    remarks?: string;
  };
  openingBalance: number;
  closingBalance: number;
};

const ReportGenerator: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isFromDatePickerOpen, setIsFromDatePickerOpen] = useState(false);
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/available-dates');
      const data = await response.json();
      if (data.dates) {
        setAvailableDates(data.dates);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchDataForDateRange = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      
      const datesInRange = availableDates.filter(dateStr => {
        return dateStr >= startDateStr && dateStr <= endDateStr;
      });
      
      // Sort dates in ascending order
      datesInRange.sort((a, b) => a.localeCompare(b));
      
      const dataPromises = datesInRange.map(dateStr => 
        fetch(`/api/daily-data?date=${dateStr}`).then(res => res.json())
      );
      
      const results = await Promise.all(dataPromises);
      const filteredResults = results.filter(result => !result.error);
      
      // Ensure data is sorted by date in ascending order
      filteredResults.sort((a, b) => a.date.localeCompare(b.date));
      
      setReportData(filteredResults);
      return filteredResults;
    } catch (error) {
      console.error('Error fetching data for date range:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    let data: ReportData[] = [];
    
    try {
      let startDate: Date;
      let endDate: Date;
      
      switch (reportType) {
        case 'daily':
          if (selectedDate) {
            startDate = selectedDate;
            endDate = selectedDate;
            data = await fetchDataForDateRange(startDate, endDate);
          }
          break;
        
        case 'weekly':
          if (selectedDate) {
            const day = selectedDate.getDay();
            const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(selectedDate);
            startDate.setDate(diff);
            
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            
            data = await fetchDataForDateRange(startDate, endDate);
          }
          break;
        
        case 'monthly':
          if (selectedDate) {
            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            
            data = await fetchDataForDateRange(startDate, endDate);
          }
          break;
        
        case 'yearly':
          if (selectedDate) {
            startDate = new Date(selectedDate.getFullYear(), 0, 1);
            endDate = new Date(selectedDate.getFullYear(), 11, 31);
            
            data = await fetchDataForDateRange(startDate, endDate);
          }
          break;
        
        case 'custom':
          if (fromDate && toDate) {
            data = await fetchDataForDateRange(fromDate, toDate);
          }
          break;
      }
      
      if (data.length > 0) {
        generatePDF(data, reportType);
      } else {
        alert('No data available for the selected date range.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = (data: ReportData[], type: ReportType) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header
    const reportTitle = getReportTitle(type);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, pageWidth / 2, 15, { align: 'center' });
    
    // Add date range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateRangeText = getDateRangeText(type);
    doc.text(dateRangeText, pageWidth / 2, 22, { align: 'center' });
    
    // Add company info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Business Financial Report', pageWidth / 2, 30, { align: 'center' });
    
    // Add summary section
    const summary = calculateSummary(data);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Total Sales: ₹${summary.totalSales.toFixed(2)}`, 14, 40);
    doc.text(`Total Expenses: ₹${summary.totalExpenses.toFixed(2)}`, 14, 45);
    doc.text(`Total Advance Salary: ₹${summary.totalAdvanceSalary.toFixed(2)}`, 14, 50);
    doc.text(`Net Profit: ₹${summary.netProfit.toFixed(2)}`, 14, 55);
    
    // Add sales table
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Summary', 14, 65);
    
    // Ensure data is sorted by date in ascending order before generating tables
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Cash', 'UPI', 'Card', 'Total Sales', 'Opening Balance', 'Closing Balance']],
      body: sortedData.map(item => [
        item.date,
        `₹${parseFloat(item.cash).toFixed(2)}`,
        `₹${parseFloat(item.upi).toFixed(2)}`,
        `₹${parseFloat(item.card).toFixed(2)}`,
        `₹${item.totalSales.toFixed(2)}`,
        `₹${item.openingBalance.toFixed(2)}`,
        `₹${item.closingBalance.toFixed(2)}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Add expenses table
    const expensesTableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Details', 14, expensesTableY);
    
    const expensesData: Array<[string, string, string]> = [];
    sortedData.forEach(dateData => {
      dateData.expenses.forEach(expense => {
        expensesData.push([
          dateData.date,
          expense.description,
          `₹${expense.amount.toFixed(2)}`
        ]);
      });
    });
    
    if (expensesData.length > 0) {
      autoTable(doc, {
        startY: expensesTableY + 5,
        head: [['Date', 'Description', 'Amount']],
        body: expensesData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text('No expenses recorded for this period.', 14, expensesTableY + 10);
    }
    
    // Add advance salary table
    const advanceSalaryData = sortedData
      .filter(item => item.advanceSalary.amount > 0)
      .map(item => [
        item.date,
        item.advanceSalary.employee,
        `₹${item.advanceSalary.amount.toFixed(2)}`,
        item.advanceSalary.remarks || ''
      ]);
    
    if (advanceSalaryData.length > 0) {
      const advanceSalaryTableY = (doc as any).lastAutoTable?.finalY + 10 || 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Advance Salary Details', 14, advanceSalaryTableY);
      
      autoTable(doc, {
        startY: advanceSalaryTableY + 5,
        head: [['Date', 'Employee', 'Amount', 'Remarks']],
        body: advanceSalaryData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });
    }
    
    // Add footer with generated date
    const generatedDate = `Report generated on: ${format(new Date(), 'PPP')}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(generatedDate, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    
    // Generate filename based on report type and date range
    const filename = generateFilename(type);
    
    // Save the PDF
    doc.save(filename);
  };

  const calculateSummary = (data: ReportData[]) => {
    return data.reduce((summary, item) => {
      return {
        totalSales: summary.totalSales + item.totalSales,
        totalExpenses: summary.totalExpenses + item.totalExpenses,
        totalAdvanceSalary: summary.totalAdvanceSalary + item.advanceSalary.amount,
        netProfit: summary.netProfit + item.totalSales - item.totalExpenses - item.advanceSalary.amount
      };
    }, {
      totalSales: 0,
      totalExpenses: 0,
      totalAdvanceSalary: 0,
      netProfit: 0
    });
  };

  const getReportTitle = (type: ReportType): string => {
    switch (type) {
      case 'daily': return `Daily Financial Report`;
      case 'weekly': return `Weekly Financial Report`;
      case 'monthly': return `Monthly Financial Report`;
      case 'yearly': return `Annual Financial Report`;
      case 'custom': return `Custom Period Financial Report`;
      default: return `Financial Report`;
    }
  };

  const getDateRangeText = (type: ReportType): string => {
    switch (type) {
      case 'daily':
        return selectedDate ? format(selectedDate, 'PPP') : '';
      case 'weekly':
        if (selectedDate) {
          const day = selectedDate.getDay();
          const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
          const startDate = new Date(selectedDate);
          startDate.setDate(diff);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          return `${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`;
        }
        return '';
      case 'monthly':
        return selectedDate ? format(selectedDate, 'MMMM yyyy') : '';
      case 'yearly':
        return selectedDate ? format(selectedDate, 'yyyy') : '';
      case 'custom':
        if (fromDate && toDate) {
          return `${format(fromDate, 'PPP')} to ${format(toDate, 'PPP')}`;
        }
        return '';
      default:
        return '';
    }
  };

  const generateFilename = (type: ReportType): string => {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    let periodText = '';
    
    switch (type) {
      case 'daily':
        periodText = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
        break;
      case 'weekly':
        if (selectedDate) {
          const day = selectedDate.getDay();
          const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
          const startDate = new Date(selectedDate);
          startDate.setDate(diff);
          periodText = `Week_${format(startDate, 'yyyy-MM-dd')}`;
        }
        break;
      case 'monthly':
        periodText = selectedDate ? format(selectedDate, 'yyyy-MM') : '';
        break;
      case 'yearly':
        periodText = selectedDate ? format(selectedDate, 'yyyy') : '';
        break;
      case 'custom':
        if (fromDate && toDate) {
          periodText = `${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`;
        }
        break;
    }
    
    return `Financial_Report_${periodText}_${timestamp}.pdf`;
  };

  const isDateDisabled = (date: Date) => {
    if (reportType === 'daily') {
      return !availableDates.includes(format(date, 'yyyy-MM-dd'));
    }
    return false;
  };

  return (
    <div className="w-full mx-auto mt-6 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Download Reports</h2>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="block w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Date Selection for non-custom reports */}
            {reportType !== 'custom' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Date</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex justify-between items-center w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {selectedDate ? (
                        reportType === 'monthly' ? (
                          format(selectedDate, 'MMMM yyyy')
                        ) : reportType === 'yearly' ? (
                          format(selectedDate, 'yyyy')
                        ) : (
                          format(selectedDate, 'PPP')
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDatePickerOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                          setIsDatePickerOpen(false);
                        }}
                        inline
                        filterDate={reportType === 'daily' ? isDateDisabled : undefined}
                        showMonthYearPicker={reportType === 'monthly'}
                        showYearPicker={reportType === 'yearly'}
                        dateFormat={
                          reportType === 'monthly' 
                            ? "MMMM yyyy" 
                            : reportType === 'yearly' 
                              ? "yyyy" 
                              : "PP"
                        }
                        calendarStartDay={1}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Date Range Selection */}
            {reportType === 'custom' && (
              <div className="space-y-4 col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">From Date</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFromDatePickerOpen(!isFromDatePickerOpen)}
                      className="flex justify-between items-center w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isFromDatePickerOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                        <DatePicker
                          selected={fromDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setFromDate(date);
                              // If toDate is before fromDate, update toDate
                              if (toDate && date > toDate) {
                                setToDate(date);
                              }
                            }
                            setIsFromDatePickerOpen(false);
                          }}
                          inline
                          selectsStart
                          startDate={fromDate}
                          endDate={toDate}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">To Date</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsToDatePickerOpen(!isToDatePickerOpen)}
                      className="flex justify-between items-center w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isToDatePickerOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                        <DatePicker
                          selected={toDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setToDate(date);
                            }
                            setIsToDatePickerOpen(false);
                          }}
                          inline
                          selectsEnd
                          startDate={fromDate}
                          endDate={toDate}
                          minDate={fromDate || undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date range preview */}
          {reportType && (reportType !== 'custom' ? selectedDate : (fromDate && toDate)) && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-md mt-2 sm:mt-4">
              <h3 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-gray-700">Report Preview</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">{getReportTitle(reportType)}</span><br />
                <span>{getDateRangeText(reportType)}</span>
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={
                isLoading || 
                (reportType !== 'custom' && !selectedDate) || 
                (reportType === 'custom' && (!fromDate || !toDate))
              }
              className={`
                w-full px-4 py-2 text-white font-medium rounded-md shadow-sm
                ${isLoading ? 'bg-black cursor-not-allowed' : 'bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Report
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;