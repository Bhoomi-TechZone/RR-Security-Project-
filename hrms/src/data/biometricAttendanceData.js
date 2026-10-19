// Biometric Devices & Attendance Data Service / Store

export const BIOMETRIC_DEVICES = [
  {
    id: 'DEV-BIO-01',
    name: 'Main Gate Terminal 01',
    model: 'ZKTeco SilkBio-101TC',
    ip: '192.168.1.101',
    port: 4370,
    serialNumber: 'ZK-SB101-99281',
    site: 'Main Gate',
    location: 'Security Cabin 1 - Pedestrian Ingress',
    status: 'online',
    lastPing: 'Just now',
    totalLogs: 1420,
    enrolledUsers: 84,
    capabilities: ['Face Recognition', 'SilkID Fingerprint', 'RFID Card'],
    firmware: 'Ver 8.0.4.2_Build2025',
    battery: '100% (AC Powered)'
  },
  {
    id: 'DEV-BIO-02',
    name: 'HQ 2nd Floor Face Station',
    model: 'eSSL MB20 Multi-Bio',
    ip: '192.168.1.102',
    port: 4370,
    serialNumber: 'ESSL-MB20-84729',
    site: 'HQ Tower',
    location: 'Corporate Reception Lobby',
    status: 'online',
    lastPing: '1 min ago',
    totalLogs: 982,
    enrolledUsers: 62,
    capabilities: ['AI Dual-Camera Face ID', 'Fingerprint', 'PIN'],
    firmware: 'Ver 6.2.1-eSSL',
    battery: '98% (UPS Backed)'
  },
  {
    id: 'DEV-BIO-03',
    name: 'Warehouse Ingress Biometric',
    model: 'Realtime T502 Heavy Duty',
    ip: '192.168.1.105',
    port: 4370,
    serialNumber: 'RT-T502-39281',
    site: 'Warehouse',
    location: 'Loading Bay 3 Access Gate',
    status: 'online',
    lastPing: '2 mins ago',
    totalLogs: 1250,
    enrolledUsers: 45,
    capabilities: ['Optical Fingerprint', 'RFID Smart Card'],
    firmware: 'Ver 4.19.8-RT',
    battery: '100% (AC Powered)'
  },
  {
    id: 'DEV-BIO-04',
    name: 'Hospital Block Emergency Gate',
    model: 'Matrix COSEC VEGA FAX',
    ip: '192.168.1.108',
    port: 4370,
    serialNumber: 'MTX-VEGA-55201',
    site: 'Hospital Block',
    location: 'Staff Entrance 2A',
    status: 'online',
    lastPing: 'Just now',
    totalLogs: 830,
    enrolledUsers: 58,
    capabilities: ['Face ID', 'Fingerprint', 'BLE Mobile Credential'],
    firmware: 'Ver 9.1.2-MTX',
    battery: '100% (Solar + AC)'
  },
  {
    id: 'DEV-BIO-05',
    name: 'Basement Parking Entry Reader',
    model: 'Hikvision DS-K1T671MF',
    ip: '192.168.1.112',
    port: 8000,
    serialNumber: 'HIK-671M-11204',
    site: 'Parking Area',
    location: 'Boom Barrier Access Cabin',
    status: 'online',
    lastPing: '3 mins ago',
    totalLogs: 610,
    enrolledUsers: 38,
    capabilities: ['Deep Learning Face Recognition', 'Mifare Card'],
    firmware: 'Ver 3.2.0-HIK',
    battery: '100% (AC Powered)'
  },
  {
    id: 'DEV-BIO-06',
    name: 'Facility & Maintenance Bay',
    model: 'BioMax SpeedFace V5L',
    ip: '192.168.1.119',
    port: 4370,
    serialNumber: 'BMX-SF5-00492',
    site: 'Office Building',
    location: 'Substation & Utility Door',
    status: 'syncing',
    lastPing: '5 mins ago',
    totalLogs: 412,
    enrolledUsers: 28,
    capabilities: ['Visible Light Face ID', 'Fingerprint', 'Palm Vein'],
    firmware: 'Ver 2.14.0',
    battery: '88% (Battery Backup)'
  }
];

export const BIOMETRIC_METHODS = [
  { value: 'all', label: 'All Methods' },
  { value: 'face', label: 'Face Recognition' },
  { value: 'fingerprint', label: 'Fingerprint' },
  { value: 'rfid', label: 'RFID / Smart Card' },
  { value: 'iris', label: 'Iris Scan' },
];

export const PUNCH_DIRECTIONS = [
  { value: 'all', label: 'All Directions' },
  { value: 'in', label: 'Check-In' },
  { value: 'out', label: 'Check-Out' },
  { value: 'break_out', label: 'Break Out' },
  { value: 'break_in', label: 'Break In' },
];

export const DEFAULT_BIOMETRIC_CLIENTS = [
  'Apex Security Corp',
  'Metro Transport Ltd',
  'Zenith Logistics Hub',
  'Apollo Healthcare Facility',
  'Nexus Corporate Parks'
];

export const DEFAULT_BIOMETRIC_DEPTS = [
  'Operations',
  'Security',
  'Administration',
  'HR',
  'Accounts',
  'Housekeeping',
  'Facility Management'
];

// Seed sample punch logs linked realistically to system employees
export const generateSamplePunchLogs = (baseDateStr) => {
  const dateStr = baseDateStr || new Date().toISOString().split('T')[0];

  const employees = [
    { id: 'EMP-001', name: 'Rajesh Kumar Verma', dept: 'Operations', clientName: 'Apex Security Corp', role: 'Operations Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-002', name: 'Vikram Singh Rathore', dept: 'Security', clientName: 'Apex Security Corp', role: 'Security Supervisor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-003', name: 'Amit Sharma', dept: 'Administration', clientName: 'Nexus Corporate Parks', role: 'Admin Officer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-004', name: 'Priya Sharma', dept: 'HR', clientName: 'Nexus Corporate Parks', role: 'HR Executive', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-005', name: 'Sunil Kumar Yadav', dept: 'Operations', clientName: 'Metro Transport Ltd', role: 'Site Executive', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-006', name: 'Kavita Patel', dept: 'Accounts', clientName: 'Metro Transport Ltd', role: 'Senior Accountant', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-007', name: 'Rohan Mehra', dept: 'Facility Management', clientName: 'Zenith Logistics Hub', role: 'Facility Officer', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-008', name: 'Manish Rawat', dept: 'Security', clientName: 'Zenith Logistics Hub', role: 'Armed Guard', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-009', name: 'Sneha Gupta', dept: 'HR', clientName: 'Apollo Healthcare Facility', role: 'Payroll Specialist', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-010', name: 'Deepak Joshi', dept: 'Housekeeping', clientName: 'Apollo Healthcare Facility', role: 'Housekeeping Lead', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-011', name: 'Pooja Tiwari', dept: 'Administration', clientName: 'Nexus Corporate Parks', role: 'Front Desk Coordinator', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces' },
    { id: 'EMP-012', name: 'Arunav Sengupta', dept: 'Operations', clientName: 'Apex Security Corp', role: 'Field Inspector', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces' },
  ];

  const timesIn = [
    '08:48:12 AM', '08:52:45 AM', '08:58:30 AM', '09:02:18 AM', 
    '09:05:52 AM', '09:12:05 AM', '09:18:40 AM', '09:25:11 AM',
    '08:40:02 AM', '08:59:15 AM', '09:04:33 AM', '09:32:10 AM'
  ];

  const timesOut = [
    '05:32:10 PM', '05:45:22 PM', '06:02:18 PM', '06:15:40 PM',
    '05:50:11 PM', '06:05:30 PM', '06:30:15 PM', '05:35:50 PM',
    '05:40:12 PM', '06:10:04 PM', '05:55:40 PM', '06:45:19 PM'
  ];

  const methods = ['face', 'fingerprint', 'face', 'rfid', 'fingerprint', 'face', 'fingerprint', 'rfid', 'face', 'fingerprint', 'face', 'face'];
  const devIdxs = [0, 1, 0, 1, 2, 0, 3, 4, 1, 2, 0, 3];

  const list = [];

  // Check-In logs
  employees.forEach((emp, i) => {
    const dev = BIOMETRIC_DEVICES[devIdxs[i] % BIOMETRIC_DEVICES.length];
    const isLate = timesIn[i].includes('09:1') || timesIn[i].includes('09:2') || timesIn[i].includes('09:3');
    list.push({
      logId: `PUNCH-${dateStr.replace(/-/g, '')}-IN-${String(i + 1).padStart(3, '0')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.dept,
      clientName: emp.clientName,
      role: emp.role,
      avatar: emp.avatar,
      punchDate: dateStr,
      punchTime: timesIn[i],
      direction: 'in',
      method: methods[i],
      matchScore: (96 + (i * 0.3) % 3.8).toFixed(1) + '%',
      deviceId: dev.id,
      deviceName: dev.name,
      deviceModel: dev.model,
      deviceIp: dev.ip,
      site: dev.site,
      location: dev.location,
      status: isLate ? 'late' : 'verified',
      syncStatus: 'synced',
      temperature: '36.5 °C (Normal)',
      maskDetected: true,
      rawPacket: {
        pin: emp.id,
        verifyMode: methods[i].toUpperCase(),
        time: `${dateStr} ${timesIn[i]}`,
        deviceSn: dev.serialNumber,
        algorithm: 'ZKFace 7.0 / BioID 3.2',
        inOutStatus: 0,
        workCode: 0,
      }
    });
  });

  // Check-Out logs
  employees.forEach((emp, i) => {
    const dev = BIOMETRIC_DEVICES[(devIdxs[i] + 1) % BIOMETRIC_DEVICES.length];
    list.push({
      logId: `PUNCH-${dateStr.replace(/-/g, '')}-OUT-${String(i + 1).padStart(3, '0')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.dept,
      clientName: emp.clientName,
      role: emp.role,
      avatar: emp.avatar,
      punchDate: dateStr,
      punchTime: timesOut[i],
      direction: 'out',
      method: methods[(i + 1) % methods.length],
      matchScore: (97 + (i * 0.2) % 2.9).toFixed(1) + '%',
      deviceId: dev.id,
      deviceName: dev.name,
      deviceModel: dev.model,
      deviceIp: dev.ip,
      site: dev.site,
      location: dev.location,
      status: 'verified',
      syncStatus: 'synced',
      temperature: '36.6 °C (Normal)',
      maskDetected: true,
      rawPacket: {
        pin: emp.id,
        verifyMode: methods[(i + 1) % methods.length].toUpperCase(),
        time: `${dateStr} ${timesOut[i]}`,
        deviceSn: dev.serialNumber,
        algorithm: 'ZKFace 7.0 / BioID 3.2',
        inOutStatus: 1,
        workCode: 0,
      }
    });
  });

  // Sort descending by time
  return list.sort((a, b) => b.punchTime.localeCompare(a.punchTime));
};

// Generate Weekly Biometric Records across Monday - Sunday
export const generateWeeklyBiometricSummary = (weekRange) => {
  const employees = [
    { id: 'EMP-001', name: 'Rajesh Kumar Verma', dept: 'Operations', clientName: 'Apex Security Corp', role: 'Operations Lead' },
    { id: 'EMP-002', name: 'Vikram Singh Rathore', dept: 'Security', clientName: 'Apex Security Corp', role: 'Security Supervisor' },
    { id: 'EMP-003', name: 'Amit Sharma', dept: 'Administration', clientName: 'Nexus Corporate Parks', role: 'Admin Officer' },
    { id: 'EMP-004', name: 'Priya Sharma', dept: 'HR', clientName: 'Nexus Corporate Parks', role: 'HR Executive' },
    { id: 'EMP-005', name: 'Sunil Kumar Yadav', dept: 'Operations', clientName: 'Metro Transport Ltd', role: 'Site Executive' },
    { id: 'EMP-006', name: 'Kavita Patel', dept: 'Accounts', clientName: 'Metro Transport Ltd', role: 'Senior Accountant' },
    { id: 'EMP-007', name: 'Rohan Mehra', dept: 'Facility Management', clientName: 'Zenith Logistics Hub', role: 'Facility Officer' },
    { id: 'EMP-008', name: 'Manish Rawat', dept: 'Security', clientName: 'Zenith Logistics Hub', role: 'Armed Guard' },
    { id: 'EMP-009', name: 'Sneha Gupta', dept: 'HR', clientName: 'Apollo Healthcare Facility', role: 'Payroll Specialist' },
    { id: 'EMP-010', name: 'Deepak Joshi', dept: 'Housekeeping', clientName: 'Apollo Healthcare Facility', role: 'Housekeeping Lead' },
  ];

  return employees.map((emp, idx) => {
    const days = [
      { day: 'Mon', in: '08:52 AM', out: '05:45 PM', hours: 8.8, method: 'Face ID', status: 'present' },
      { day: 'Tue', in: '08:58 AM', out: '06:02 PM', hours: 9.0, method: 'Fingerprint', status: 'present' },
      { day: 'Wed', in: idx === 2 ? '—' : '09:02 AM', out: idx === 2 ? '—' : '05:50 PM', hours: idx === 2 ? 0 : 8.8, method: 'Face ID', status: idx === 2 ? 'absent' : 'present' },
      { day: 'Thu', in: '08:50 AM', out: '06:15 PM', hours: 9.4, method: 'RFID Card', status: 'present' },
      { day: 'Fri', in: idx === 5 ? '09:40 AM' : '09:05 AM', out: '06:05 PM', hours: idx === 5 ? 8.4 : 9.0, method: 'Face ID', status: idx === 5 ? 'late' : 'present' },
      { day: 'Sat', in: idx % 2 === 0 ? '09:10 AM' : '—', out: idx % 2 === 0 ? '02:30 PM' : '—', hours: idx % 2 === 0 ? 5.3 : 0, method: 'Fingerprint', status: idx % 2 === 0 ? 'half_day' : 'off' },
      { day: 'Sun', in: '—', out: '—', hours: 0, method: '—', status: 'off' },
    ];

    const totalHours = days.reduce((sum, d) => sum + d.hours, 0);
    const totalPunches = days.filter(d => d.status !== 'off' && d.status !== 'absent').length * 2;
    const facePunches = days.filter(d => d.method === 'Face ID').length * 2;
    const fingerPunches = days.filter(d => d.method === 'Fingerprint').length * 2;

    return {
      ...emp,
      days,
      totalHours: totalHours.toFixed(1),
      totalPunches,
      primaryMethod: facePunches >= fingerPunches ? 'Face ID' : 'Fingerprint',
      punctuality: idx === 5 ? '88% (1 Late)' : '100% On-Time',
      status: totalHours >= 44 ? 'regular' : totalHours >= 38 ? 'standard' : 'short_hours'
    };
  });
};

// Generate Monthly Biometric Aggregate
export const generateMonthlyBiometricSummary = (monthStr) => {
  const employees = [
    { id: 'EMP-001', name: 'Rajesh Kumar Verma', dept: 'Operations', clientName: 'Apex Security Corp', role: 'Operations Lead' },
    { id: 'EMP-002', name: 'Vikram Singh Rathore', dept: 'Security', clientName: 'Apex Security Corp', role: 'Security Supervisor' },
    { id: 'EMP-003', name: 'Amit Sharma', dept: 'Administration', clientName: 'Nexus Corporate Parks', role: 'Admin Officer' },
    { id: 'EMP-004', name: 'Priya Sharma', dept: 'HR', clientName: 'Nexus Corporate Parks', role: 'HR Executive' },
    { id: 'EMP-005', name: 'Sunil Kumar Yadav', dept: 'Operations', clientName: 'Metro Transport Ltd', role: 'Site Executive' },
    { id: 'EMP-006', name: 'Kavita Patel', dept: 'Accounts', clientName: 'Metro Transport Ltd', role: 'Senior Accountant' },
    { id: 'EMP-007', name: 'Rohan Mehra', dept: 'Facility Management', clientName: 'Zenith Logistics Hub', role: 'Facility Officer' },
    { id: 'EMP-008', name: 'Manish Rawat', dept: 'Security', clientName: 'Zenith Logistics Hub', role: 'Armed Guard' },
    { id: 'EMP-009', name: 'Sneha Gupta', dept: 'HR', clientName: 'Apollo Healthcare Facility', role: 'Payroll Specialist' },
    { id: 'EMP-010', name: 'Deepak Joshi', dept: 'Housekeeping', clientName: 'Apollo Healthcare Facility', role: 'Housekeeping Lead' },
    { id: 'EMP-011', name: 'Pooja Tiwari', dept: 'Administration', clientName: 'Nexus Corporate Parks', role: 'Front Desk Coordinator' },
    { id: 'EMP-012', name: 'Arunav Sengupta', dept: 'Operations', clientName: 'Apex Security Corp', role: 'Field Inspector' },
  ];

  return employees.map((emp, i) => {
    const presentDays = 24 - (i % 3 === 0 ? 1 : 0);
    const lateDays = i === 5 || i === 8 ? 2 : i === 2 ? 1 : 0;
    const totalPunches = presentDays * 2 + (i % 2 === 0 ? 4 : 0);
    const avgCheckIn = i % 2 === 0 ? '08:56 AM' : '09:04 AM';
    const avgCheckOut = i % 2 === 0 ? '05:54 PM' : '06:12 PM';
    const totalWorkingHours = (presentDays * 8.6 + (i * 0.7)).toFixed(1);

    return {
      ...emp,
      month: monthStr,
      presentDays,
      totalWorkingDays: 25,
      attendanceRate: `${((presentDays / 25) * 100).toFixed(0)}%`,
      totalPunches,
      avgCheckIn,
      avgCheckOut,
      totalWorkingHours,
      lateDays,
      missedPunches: i === 2 ? 1 : 0,
      biometricAccuracy: '99.4%',
      preferredTerminal: BIOMETRIC_DEVICES[i % BIOMETRIC_DEVICES.length].name,
      primaryMethod: i % 2 === 0 ? 'Face ID' : 'Fingerprint'
    };
  });
};
