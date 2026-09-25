// NovaSpark HRMS — Payroll Utility Functions

export const formatRupee = (value, includeSymbol = true) => {
  const num = Number(value || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(num);
  return includeSymbol ? `₹${formatted}` : formatted;
};

export const formatRupeeWithDecimals = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Convert number to Indian currency in words
export const numberToIndianWords = (number) => {
  const num = Math.round(Number(number || 0));
  if (num === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunk = (n) => {
    let str = '';
    if (n >= 100) {
      str += `${units[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 20) {
      str += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) {
      str += `${units[n]} `;
    }
    return str.trim();
  };

  let remainder = num;
  let words = '';

  const crores = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  if (crores > 0) {
    words += `${convertChunk(crores)} Crore `;
  }

  const lakhs = Math.floor(remainder / 100000);
  remainder %= 100000;
  if (lakhs > 0) {
    words += `${convertChunk(lakhs)} Lakh `;
  }

  const thousands = Math.floor(remainder / 1000);
  remainder %= 1000;
  if (thousands > 0) {
    words += `${convertChunk(thousands)} Thousand `;
  }

  const hundreds = remainder;
  if (hundreds > 0) {
    words += `${convertChunk(hundreds)} `;
  }

  return `${words.trim()} Rupees Only`;
};
