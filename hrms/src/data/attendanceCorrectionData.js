// NovaSpark HRMS — Mock Attendance Correction Request Data
// These represent submitted correction requests pending admin review

export const mockCorrectionRequests = [
  {
    id: 'CORR001',
    attendanceId: 10,
    employeeId: 'EMP010',
    employeeName: 'Sunita Mehta',
    initials: 'SM',
    companyName: 'Apex Industrial Security',
    site: 'Factory Gate',
    date: '2026-08-22',
    originalCheckIn: null,
    originalCheckOut: '18:04',
    originalStatus: 'pendingCorrection',
    requestedCheckIn: '09:05',
    requestedCheckOut: '18:04',
    reason: 'Check-in was not captured on the device due to a system glitch at the factory gate. Physically present from 09:05 AM.',
    submittedAt: '2026-08-22T14:32:00',
    submittedBy: 'Sunita Mehta',
    status: 'pendingCorrection'
  },
  {
    id: 'CORR002',
    attendanceId: 26,
    employeeId: 'EMP003',
    employeeName: 'Raj Kumar',
    initials: 'RJ',
    companyName: 'NovaTech Facilities Ltd.',
    site: 'Office Building',
    date: '2026-08-21',
    originalCheckIn: null,
    originalCheckOut: null,
    originalStatus: 'absent',
    requestedCheckIn: '08:55',
    requestedCheckOut: '17:55',
    reason: 'Attendance was marked absent by mistake. I was present the entire day. Supervisor can confirm.',
    submittedAt: '2026-08-22T09:10:00',
    submittedBy: 'Raj Kumar',
    status: 'pendingCorrection'
  },
  {
    id: 'CORR003',
    attendanceId: 27,
    employeeId: 'EMP019',
    employeeName: 'Pankaj Joshi',
    initials: 'PJ',
    companyName: 'NovaTech Facilities Ltd.',
    site: 'Hospital Block',
    date: '2026-08-21',
    originalCheckIn: null,
    originalCheckOut: null,
    originalStatus: 'absent',
    requestedCheckIn: '09:00',
    requestedCheckOut: '13:00',
    reason: 'I was present for half day on 21 Aug. Had a medical appointment in the afternoon. Please update to Half Day.',
    submittedAt: '2026-08-22T11:00:00',
    submittedBy: 'Pankaj Joshi',
    status: 'pendingCorrection'
  },
  {
    id: 'CORR004',
    attendanceId: 28,
    employeeId: 'EMP012',
    employeeName: 'Anjali Rao',
    initials: 'AR',
    companyName: 'NovaTech Facilities Ltd.',
    site: 'Office Building',
    date: '2026-08-20',
    originalCheckIn: '10:30',
    originalCheckOut: '18:00',
    originalStatus: 'late',
    requestedCheckIn: '09:00',
    requestedCheckOut: '18:00',
    reason: 'Check-in time was recorded incorrectly. System issue was reported on this date. I arrived at 9:00 AM.',
    submittedAt: '2026-08-22T10:45:00',
    submittedBy: 'Anjali Rao',
    status: 'pendingCorrection'
  },
  {
    id: 'CORR005',
    attendanceId: 29,
    employeeId: 'EMP006',
    employeeName: 'Kavita Patel',
    initials: 'KP',
    companyName: 'SecureShield India Pvt. Ltd.',
    site: 'Main Gate',
    date: '2026-08-19',
    originalCheckIn: '08:58',
    originalCheckOut: '16:52',
    originalStatus: 'earlyOut',
    requestedCheckIn: '08:58',
    requestedCheckOut: '18:00',
    reason: 'Checkout was registered early due to a badge scanner error. I worked until 6 PM and supervisor signed off.',
    submittedAt: '2026-08-22T08:55:00',
    submittedBy: 'Kavita Patel',
    status: 'pendingCorrection'
  }
];

export const formatCorrectionDateTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
