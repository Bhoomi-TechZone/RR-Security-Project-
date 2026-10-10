import * as XLSX from 'xlsx';

/**
 * Utility to export report datasets to formatted Excel (.xlsx) / CSV spreadsheets
 */
export const generateReportExcel = ({
  reportType = 'payroll',
  title = 'Wage & Salary Register',
  period = {},
  companyInfo = {},
  records = [],
  totals = {},
  format = 'xlsx',
}) => {
  const companyName = companyInfo.name || 'RR Security & Facilities';
  const monthLabel = period.monthLabel || period.month || 'Current Month';

  let exportData = [];

  if (reportType === 'payroll') {
    exportData = records.map((r, idx) => ({
      'Sr No': r.srNo || idx + 1,
      'Employee Name': r.name,
      'Emp ID': r.employeeId,
      'Designation': r.designation,
      'Department': r.department,
      'UAN No': r.uan || '-',
      'PF No': r.pfNo || '-',
      'ESI No': r.esiNo || '-',
      'Working Days (WD)': r.attendance?.wd || 30,
      'Present Days (PD)': r.attendance?.pd || 30,
      'Paid Days (TOT)': r.attendance?.tot || 30,
      'Basic Wage Rate': r.rateOfWages?.basic || 0,
      'HRA Wage Rate': r.rateOfWages?.hra || 0,
      'Total Wage Rate': r.rateOfWages?.total || 0,
      'Earned Basic': r.earnings?.basic || 0,
      'Earned HRA': r.earnings?.hra || 0,
      'Earned Special / OT': (r.earnings?.spAll || 0) + (r.earnings?.otPib || 0),
      'Gross Salary': r.grossSalary || 0,
      'PF Deduction': r.deductions?.pf || 0,
      'ESI Deduction': r.deductions?.esi || 0,
      'PT Deduction': r.deductions?.pt || 0,
      'TDS / IT': r.deductions?.it || 0,
      'Advance / Loans': (r.deductions?.advance || 0) + (r.deductions?.loan || 0),
      'Total Deductions': r.grossDeduct || 0,
      'Net Payable': r.netPayable || r.netPayableNumber || 0,
      'Bank Name': r.bankName || 'HDFC Bank',
      'Bank A/c No': r.bankAccountNo || '50100636547362',
      'IFSC Code': r.ifscCode || 'HDFC0000128',
    }));
  } else if (reportType === 'attendance') {
    exportData = records.map((r, idx) => ({
      'Sr No': r.srNo || idx + 1,
      'Employee Name': r.employeeName,
      'Emp ID': r.employeeId,
      'Company / Site': r.clientName,
      'Department': r.department,
      'Designation': r.designation,
      'Working Days': r.workingDays,
      'Present Days': r.presentDays,
      'Absent Days': r.absentDays,
      'Leave Days': r.leaveDays,
      'Attendance %': `${r.attendancePercentage}%`,
      'Status': r.status,
    }));
  } else if (reportType === 'billing') {
    exportData = records.map((r) => ({
      'Client / Company': r.companyName,
      'Deployed Guards': r.totalEmployees,
      'Billing Period': r.billingPeriod,
      'Total Man-Days': r.totalAttendance,
      'Overtime Amount': r.overtimeAmount,
      'Gross Billing': r.grossBilling,
      'Deductions / Taxes': r.deductions,
      'Net Billing': r.netBilling,
      'Status': r.status,
    }));
  } else if (reportType === 'employee') {
    exportData = records.map((r) => ({
      'Employee Name': r.name,
      'Emp ID': r.employeeId,
      'Father / Husband': r.fatherHusbandName || '-',
      'Company': r.companyName,
      'Department': r.department,
      'Designation': r.designation,
      'Joining Date': r.joiningDate,
      'Contact': r.contact,
      'Bank Name': r.bankName || 'Bank',
      'Bank A/c': r.accountNumber || '-',
      'UAN': r.uan || '-',
      'PF No': r.pfNo || '-',
      'Status': r.status,
    }));
  } else if (reportType === 'overtime') {
    exportData = records.map((r, idx) => ({
      'Sr No': idx + 1,
      'Employee Name': r.employeeName,
      'Emp ID': r.employeeId,
      'Client / Company': r.clientName,
      'Site': r.site || 'Main Site',
      'Department': r.department,
      'Date': r.date,
      'Overtime Hours': Number(r.overtimeHours || 0),
      'OT Rate (₹/hr)': Number(r.overtimeRate || 0),
      'OT Amount (₹)': Number(r.overtimeAmount || 0),
      'Status': (r.status || 'pending').toUpperCase(),
      'Reason': r.reason || '',
      'Approved By': r.approvedBy || '-',
    }));
  } else {
    exportData = records.map((r, idx) => ({
      'Sr No': r.srNo || idx + 1,
      'Item Name': r.item || r.itemName,
      'Brand': r.brand || '—',
      'Item Code': r.itemCode || r.itemId,
      'Item Type': r.itemType || 'ASSET',
      'Category': r.category,
      'Site / Location': r.client || r.location || 'Central Stock',
      'Unit Rate (₹)': r.unitRate || 0,
      'Total Stock': r.totalQuantity,
      'Available': r.available,
      'Issued': r.issued,
      'Damaged / Lost': r.damaged + (r.lost || 0),
      'Total Asset Valuation (₹)': r.totalValue || (r.totalQuantity * (r.unitRate || 0)),
      'Stock Status': r.status,
    }));
  }

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 30));

  const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${monthLabel.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  XLSX.writeFile(wb, fileName);
};
