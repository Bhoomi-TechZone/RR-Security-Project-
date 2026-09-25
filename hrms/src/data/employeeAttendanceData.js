const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusForAugust = {
  1: 'Present', 2: 'Present', 3: 'Present', 4: 'Present', 5: 'Present',
  6: 'Present', 7: 'Present', 8: 'Present', 9: 'Present', 10: 'Present',
  11: 'Present', 12: 'Present', 13: 'Present', 14: 'Present', 15: 'Present',
  16: 'Present', 17: 'Present', 18: 'Present', 19: 'Present', 20: 'Leave',
  21: 'Leave', 22: 'Present', 23: 'Absent', 24: 'Present', 25: 'Present',
  26: 'Present', 27: 'Present', 28: 'Absent', 29: 'Present', 30: 'Present', 31: 'Leave'
};

const formatDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const buildRecords = (year, month, statuses = {}) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(year, month - 1, dayNumber);
    const status = statuses[dayNumber] || 'Present';
    const isUnavailable = status !== 'Present';

    return {
      id: `${year}-${month}-${dayNumber}`,
      date: formatDate(year, month, dayNumber),
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      status,
      checkIn: isUnavailable ? null : '09:12 AM',
      checkOut: isUnavailable ? null : '06:18 PM',
      workingHours: isUnavailable ? null : '09h 06m',
      shift: 'Day Shift'
    };
  });
};

export const employeeAttendanceData = {
  '2026-08': buildRecords(2026, 8, statusForAugust),
  '2026-07': buildRecords(2026, 7, { 4: 'Leave', 11: 'Absent', 18: 'Leave', 27: 'Absent' }),
  '2026-06': buildRecords(2026, 6, { 8: 'Leave', 17: 'Absent', 24: 'Leave' }),
  '2026-09': buildRecords(2026, 9, { 5: 'Leave', 12: 'Absent', 19: 'Leave', 26: 'Absent' })
};

export const employeeAttendanceMonths = [
  { key: '2026-08', label: 'August 2026', year: 2026, month: 8 },
  { key: '2026-07', label: 'July 2026', year: 2026, month: 7 },
  { key: '2026-06', label: 'June 2026', year: 2026, month: 6 }
];

export const getMonthLabel = (year, month) => `${monthNames[month - 1]} ${year}`;

export const getAttendanceSummary = (records) => {
  const present = records.filter((record) => record.status === 'Present').length;
  const absent = records.filter((record) => record.status === 'Absent').length;
  const leave = records.filter((record) => record.status === 'Leave').length;
  const workingDays = records.length;

  return {
    workingDays,
    present,
    absent,
    leave,
    attendanceRate: workingDays ? ((present / workingDays) * 100).toFixed(2) : '0.00'
  };
};
