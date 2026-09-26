/**
 * Master Data & Configurations for Admin Number Series Module
 */

export const SEPARATOR_OPTIONS = [
  { label: 'Hyphen ( - )', value: '-' },
  { label: 'Slash ( / )', value: '/' },
  { label: 'Underscore ( _ )', value: '_' },
  { label: 'None ( EMP00001 )', value: '' }
];

export const YEAR_FORMAT_OPTIONS = [
  { label: 'None (No Year)', value: 'None' },
  { label: 'YYYY (e.g. 2026)', value: 'YYYY' },
  { label: 'YY (e.g. 26)', value: 'YY' }
];

export const MONTH_FORMAT_OPTIONS = [
  { label: 'None (No Month)', value: 'None' },
  { label: 'MM (e.g. 09 for Sept)', value: 'MM' }
];

export const PADDING_OPTIONS = [
  { label: '3 Digits (001)', value: 3 },
  { label: '4 Digits (0001)', value: 4 },
  { label: '5 Digits (00001)', value: 5 },
  { label: '6 Digits (000001)', value: 6 }
];

export const RESET_FREQUENCY_OPTIONS = [
  { label: 'Never (Continuous Sequence)', value: 'Never' },
  { label: 'Yearly (Resets on 1st Jan / Financial Year)', value: 'Yearly' },
  { label: 'Monthly (Resets on 1st of each month)', value: 'Monthly' }
];

/**
 * Generates formatted sequence string dynamically based on series rules
 */
export function generateSeriesPreview(series, overrideSeq = null) {
  if (!series) return '';
  let seqNum = overrideSeq !== null ? overrideSeq : (series.currentNumber !== undefined ? series.currentNumber : (series.startingNumber || 1));
  if (seqNum === 1042 && series.startingNumber && series.startingNumber !== 1042) {
    seqNum = series.startingNumber;
  }
  const padLen = Number(series.padding) || 3;
  const seqPadded = String(seqNum).padStart(padLen, '0');
  const sep = series.separator !== undefined ? series.separator : '-';

  const parts = [];

  // 1. Prefix
  if (series.prefix && series.prefix.trim()) {
    parts.push(series.prefix.trim());
  }

  // 2. Year
  const now = new Date();
  if (series.yearFormat === 'YYYY') {
    parts.push(String(now.getFullYear()));
  } else if (series.yearFormat === 'YY') {
    parts.push(String(now.getFullYear()).slice(-2));
  }

  // 3. Month
  if (series.monthFormat === 'MM') {
    const month = String(now.getMonth() + 1).padStart(2, '0');
    parts.push(month);
  }

  // 4. Sequence
  parts.push(seqPadded);

  return parts.join(sep);
}

export const mockNumberSeriesList = [
  {
    id: 'employee-code',
    name: 'Employee Code',
    code: 'SERIES-EMP',
    moduleTarget: 'Employee Management',
    prefix: 'EMP',
    startingNumber: 1,
    currentNumber: 1,
    lastUsedNumber: 0,
    padding: 3,
    separator: '-',
    yearFormat: 'None',
    monthFormat: 'None',
    resetFrequency: 'Never',
    description: 'Unique workforce identification number automatically assigned upon candidate onboard registration.',
    status: 'Active',
    lastUpdated: '2026-03-01 10:30 AM'
  },
  {
    id: 'salary-slip',
    name: 'Salary Slip No.',
    code: 'SERIES-SAL',
    moduleTarget: 'Payroll & Payslips',
    prefix: 'SAL',
    startingNumber: 1,
    currentNumber: 245,
    lastUsedNumber: 244,
    padding: 5,
    separator: '-',
    yearFormat: 'YYYY',
    monthFormat: 'MM',
    resetFrequency: 'Monthly',
    description: 'Monthly payroll disbursement voucher series generated during end-of-month pay run finalization.',
    status: 'Active',
    lastUpdated: '2026-03-02 08:45 AM'
  },
  {
    id: 'invoice',
    name: 'Invoice No.',
    code: 'SERIES-INV',
    moduleTarget: 'Client Billing',
    prefix: 'INV',
    startingNumber: 1,
    currentNumber: 88,
    lastUsedNumber: 87,
    padding: 5,
    separator: '-',
    yearFormat: 'YYYY',
    monthFormat: 'None',
    resetFrequency: 'Yearly',
    description: 'Manpower client billing invoice reference number for monthly duty muster billing statements.',
    status: 'Active',
    lastUpdated: '2026-02-28 05:15 PM'
  },
  {
    id: 'appointment-letter',
    name: 'Appointment Letter No.',
    code: 'SERIES-APT',
    moduleTarget: 'Offer & Onboarding',
    prefix: 'APT',
    startingNumber: 1,
    currentNumber: 312,
    lastUsedNumber: 311,
    padding: 5,
    separator: '-',
    yearFormat: 'YYYY',
    monthFormat: 'None',
    resetFrequency: 'Yearly',
    description: 'Official employment offer and appointment letter tracking number referenced in employment contracts.',
    status: 'Active',
    lastUpdated: '2026-02-27 04:20 PM'
  },
  {
    id: 'id-card',
    name: 'ID Card No.',
    code: 'SERIES-IDC',
    moduleTarget: 'Security Badges',
    prefix: 'ID',
    startingNumber: 1,
    currentNumber: 1205,
    lastUsedNumber: 1204,
    padding: 5,
    separator: '-',
    yearFormat: 'None',
    monthFormat: 'None',
    resetFrequency: 'Never',
    description: 'Physical badge and smart RFID identification card sequence printed on security photo credentials.',
    status: 'Active',
    lastUpdated: '2026-02-25 11:00 AM'
  },
  {
    id: 'full-final',
    name: 'Full & Final No. (F&F)',
    code: 'SERIES-FNF',
    moduleTarget: 'Exit & Settlement',
    prefix: 'FNF',
    startingNumber: 1,
    currentNumber: 64,
    lastUsedNumber: 63,
    padding: 5,
    separator: '-',
    yearFormat: 'YYYY',
    monthFormat: 'None',
    resetFrequency: 'Yearly',
    description: 'Full & Final exit settlement clearance statement voucher number issued upon employee relieving.',
    status: 'Active',
    lastUpdated: '2026-02-26 03:30 PM'
  }
];
