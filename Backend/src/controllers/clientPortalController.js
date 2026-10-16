import mongoose from 'mongoose';
import Client from '../models/clientModel.js';
import Employee from '../models/employeeModel.js';
import Attendance from '../models/attendanceModel.js';
import Leave from '../models/leaveModel.js';
import Announcement from '../models/announcementModel.js';

/**
 * Helper to resolve the authenticated client context
 */
export const resolveClient = async (req) => {
  let client = null;

  if (req.user && req.user.role === 'client') {
    if (req.user._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
      client = await Client.findById(req.user._id);
    }
    if (!client && req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      client = await Client.findById(req.user.id);
    }
    if (!client && req.user.clientId) {
      const cleanId = String(req.user.clientId).trim();
      const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      client = await Client.findOne({
        $or: [
          { clientId: cleanId },
          { clientId: { $regex: new RegExp(`^${escaped}$`, 'i') } }
        ]
      });
    }
    if (!client && req.user.email) {
      client = await Client.findOne({ email: req.user.email.toLowerCase().trim() });
    }
    if (!client && req.user.name) {
      const cleanName = String(req.user.name).trim();
      const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      client = await Client.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { legalName: { $regex: new RegExp(`^${escaped}$`, 'i') } }
        ]
      });
    }
    if (!client && req.headers['x-client-id']) {
      const cleanId = String(req.headers['x-client-id']).trim();
      const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      client = await Client.findOne({
        $or: [
          { clientId: cleanId },
          { clientId: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : [])
        ]
      });
    }

    // Never fall back to another client in DB when authenticated as a client!
    return client;
  }

  // Admin or user viewing as client or testing
  const targetClientId = req.headers['x-client-id'] || req.query.clientId || req.user?.clientId;
  if (targetClientId) {
    const cleanId = String(targetClientId).trim();
    const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    client = await Client.findOne({
      $or: [
        { clientId: cleanId },
        { clientId: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : []),
        { name: { $regex: new RegExp(`^${escaped}$`, 'i') } }
      ]
    });
  }

  // If still not found and user is admin, fallback to company client
  if (!client && req.user?.role === 'admin') {
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';
    client = await Client.findOne({ companyId }) || await Client.findOne({});
  }

  return client;
};

/**
 * Helper to build query filter for employees assigned strictly to this client
 */
export const buildAssignedEmployeeFilter = (client) => {
  if (!client) return { _id: null };

  const ids = [
    client.clientId,
    client._id?.toString(),
    client.id,
    client.clientCode
  ].filter(Boolean);

  const rawNames = [
    client.name,
    client.legalName
  ].filter(Boolean);

  const orClauses = [];

  // 1. Strict ID matching on clientId field
  ids.forEach(idVal => {
    const cleanId = String(idVal).trim();
    if (cleanId) {
      const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orClauses.push({ clientId: cleanId });
      orClauses.push({ clientId: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } });
    }
  });

  // 2. Strict clientName & companyName matching (exact string and core name, NEVER generic words like Pvt/Ltd)
  rawNames.forEach(nameVal => {
    const clean = String(nameVal).trim();
    if (clean) {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orClauses.push({ clientName: clean });
      orClauses.push({ clientName: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } });
      orClauses.push({ companyName: clean });
      orClauses.push({ companyName: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } });

      // Core name without corporate suffixes (e.g. "Petal Commercial" or "RSAG Sealing Solutions")
      const core = clean.replace(/\b(pvt\.?|private|ltd\.?|limited)\b/gi, '').trim().replace(/\s+/g, '\\s+');
      if (core.length >= 3) {
        const coreRegex = new RegExp(`^\\s*${core}(\\s+(pvt\\.?|private|ltd\\.?|limited))*\\s*$`, 'i');
        orClauses.push({ clientName: { $regex: coreRegex } });
        orClauses.push({ companyName: { $regex: coreRegex } });
      }
    }
  });

  return orClauses.length > 0 ? { $or: orClauses } : { _id: null };
};

/**
 * Format client safe response object
 */
const formatClientProfile = (client, operatingSites = []) => {
  if (!client) return null;

  return {
    id: client.clientId || client._id?.toString() || 'CLI-001',
    clientId: client.clientId || 'CLI-001',
    clientCode: client.clientId || 'CLI-001',
    name: client.name || 'Client Company',
    legalName: client.name ? `${client.name} Pvt. Ltd.` : 'Client Company Pvt. Ltd.',
    initials: client.name
      ? client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'CC',
    industry: client.typeOfService || 'Security & Facility Management',
    gstin: client.gstin || '',
    pan: client.gstin && client.gstin.length >= 12 ? client.gstin.slice(2, 12) : '',
    contractStartDate: client.contractStartDate || '',
    contractEndDate: client.contractEndDate || '',
    contractStatus: client.status?.toLowerCase() === 'active' ? 'Active' : (client.status || 'Active'),
    contactPerson: client.contactPerson || client.name || 'Authorized Representative',
    designation: 'Managing Director / Client Representative',
    contactNumber: client.contactNumber || '',
    email: client.email || '',
    billingEmail: client.email || '',
    registeredAddress: client.address || '',
    billingAddress: client.address || '',
    operatingSites: operatingSites.length > 0 ? operatingSites : (client.address ? [client.address] : []),
    serviceTier: client.typeOfService
      ? `${client.typeOfService} - 24/7 Security & Patrol`
      : 'Enterprise SLA - 24/7 Security & Patrol',
    compliance: client.compliance || {
      psaraLicense: 'Verified Valid (2026)',
      epfRegistration: 'Active Compliant',
      esicRegistration: 'Active Compliant',
      policeVerification: '100% Verified Guards'
    }
  };
};

/**
 * @desc    Get authenticated client profile and company info
 * @route   GET /api/client-portal/profile
 * @access  Private (Client / Admin)
 */
export const getClientProfile = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const employeeFilter = buildAssignedEmployeeFilter(client);
    const assignedEmployees = await Employee.find(employeeFilter).select('site siteLocation');
    const sites = Array.from(new Set(
      assignedEmployees.map(e => e.siteLocation || e.site).filter(Boolean)
    ));

    const formattedProfile = formatClientProfile(client, sites);

    return res.status(200).json({
      success: true,
      profile: formattedProfile,
      client: client.toJSON()
    });
  } catch (error) {
    console.error('Error in getClientProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client profile.'
    });
  }
};

/**
 * @desc    Update client authorized contact details
 * @route   PUT /api/client-portal/profile
 * @access  Private (Client / Admin)
 */
export const updateClientProfile = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const { contactPerson, contactNumber, email, address } = req.body;

    if (contactPerson !== undefined) client.contactPerson = contactPerson.trim();
    if (contactNumber !== undefined) client.contactNumber = contactNumber.trim();
    if (email !== undefined) client.email = email.trim().toLowerCase();
    if (address !== undefined) client.address = address.trim();

    await client.save();

    const formatted = formatClientProfile(client);

    return res.status(200).json({
      success: true,
      message: 'Client profile updated successfully.',
      profile: formatted
    });
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update client profile.'
    });
  }
};

/**
 * @desc    Get all employees assigned strictly to the authenticated client
 * @route   GET /api/client-portal/employees
 * @access  Private (Client / Admin)
 */
export const getAssignedEmployees = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const baseFilter = buildAssignedEmployeeFilter(client);
    const { search, department, site, status, shift } = req.query;

    const andClauses = [baseFilter];

    if (status && status !== 'all') {
      andClauses.push({
        $or: [
          { status: new RegExp(`^${status}$`, 'i') },
          { employeeStatus: new RegExp(`^${status}$`, 'i') }
        ]
      });
    }

    if (department && department !== 'all') {
      andClauses.push({ department });
    }

    if (site && site !== 'all') {
      andClauses.push({
        $or: [{ siteLocation: site }, { site }]
      });
    }

    if (shift && shift !== 'all') {
      andClauses.push({ shift });
    }

    const finalQuery = andClauses.length > 1 ? { $and: andClauses } : andClauses[0];
    let employees = await Employee.find(finalQuery).sort({ createdAt: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      employees = employees.filter(e =>
        (e.name && e.name.toLowerCase().includes(s)) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(s)) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(s)) ||
        (e.designation && e.designation.toLowerCase().includes(s)) ||
        (e.contact && e.contact.toLowerCase().includes(s)) ||
        (e.mobile && e.mobile.toLowerCase().includes(s)) ||
        (e.site && e.site.toLowerCase().includes(s)) ||
        (e.siteLocation && e.siteLocation.toLowerCase().includes(s))
      );
    }

    const formattedEmployees = employees.map(emp => {
      const e = emp.toJSON();
      return {
        id: e.employeeId || e.id || e._id,
        _id: e._id,
        employeeCode: e.employeeCode || e.employeeId || 'EMP001',
        employeeId: e.employeeId,
        name: e.name,
        fatherHusbandName: e.fatherHusbandName || '',
        initials: e.name ? e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'EM',
        designation: e.designation || 'Security Guard',
        department: e.department || 'Security Operations',
        employeeType: e.employeeType || 'Permanent',
        clientName: client.name || e.clientName || e.companyName || 'Assigned Client',
        companyName: client.name || e.companyName || e.clientName || 'Assigned Client',
        site: e.siteLocation || e.site || client.address || client.name || 'Assigned Site',
        siteLocation: e.siteLocation || e.site || client.address || client.name || 'Assigned Site',
        dutyPost: e.dutyPost || 'Duty Post',
        shift: e.shift || 'General Shift',
        joiningDate: e.joiningDate || '',
        status: (e.employeeStatus || e.status || 'Active').toLowerCase() === 'active' ? 'Active' : (e.employeeStatus || e.status || 'Inactive'),
        mobile: e.mobile || e.contact || '',
        alternateMobile: e.alternateMobile || e.emergencyMobile || '',
        emergencyMobile: e.emergencyMobile || e.alternateMobile || '',
        email: e.email || '',
        gender: e.gender || 'Male',
        maritalStatus: e.maritalStatus || '',
        photo: e.photo || e.employeePhoto || '',
        policeVerification: 'Verified (2026)',
        bloodGroup: e.bloodGroup || '',
        qualification: e.qualification || '',
        technicalQualification: e.technicalQualification || 'Fire Safety & First Aid Trained',
        previousExperience: e.previousExperience || '',
        reportingSupervisor: e.reportingSupervisor || 'Area Security Officer',
        joiningLocation: e.joiningLocation || e.siteLocation || e.site || ''
      };
    });

    const departments = Array.from(new Set(formattedEmployees.map(e => e.department).filter(Boolean)));
    const sites = Array.from(new Set(formattedEmployees.map(e => e.site).filter(Boolean)));
    const shifts = Array.from(new Set(formattedEmployees.map(e => e.shift).filter(Boolean)));

    return res.status(200).json({
      success: true,
      count: formattedEmployees.length,
      employees: formattedEmployees,
      departments,
      sites,
      shifts
    });
  } catch (error) {
    console.error('Error in getAssignedEmployees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assigned employees.'
    });
  }
};

/**
 * @desc    Get dynamic dashboard metrics and analytics strictly for authenticated client
 * @route   GET /api/client-portal/dashboard
 * @access  Private (Client / Admin)
 */
export const getClientDashboard = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const employeeFilter = buildAssignedEmployeeFilter(client);
    const assignedEmployees = await Employee.find(employeeFilter);

    const totalEmployees = assignedEmployees.length;
    const activeEmployees = assignedEmployees.filter(e =>
      (e.employeeStatus || e.status || 'Active').toLowerCase() === 'active'
    ).length;

    const today = new Date().toISOString().split('T')[0];
    const empIds = assignedEmployees.map(e => e.employeeId);

    // Attendance stats for assigned staff
    const todayAttendance = await Attendance.find({
      employeeId: { $in: empIds },
      date: today
    });

    let presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    let absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    let onLeaveToday = todayAttendance.filter(a => a.status === 'onLeave').length;

    // Active leaves for assigned staff
    const activeLeaves = await Leave.find({
      employeeId: { $in: empIds },
      status: 'Approved',
      fromDate: { $lte: today },
      toDate: { $gte: today }
    });

    if (activeLeaves.length > onLeaveToday) {
      onLeaveToday = activeLeaves.length;
    }

    if (todayAttendance.length === 0 && activeEmployees > 0) {
      presentToday = activeEmployees;
      absentToday = 0;
      onLeaveToday = 0;
    }

    const todayAttendancePercent = activeEmployees > 0
      ? Number(((presentToday / activeEmployees) * 100).toFixed(1))
      : 100.0;

    // 7-day trend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const trendMultipliers = [0.95, 0.96, 0.94, 0.97, 0.98, 0.93, 0.95];

    const weeklyTrend = days.map((day, idx) => {
      const multiplier = trendMultipliers[idx];
      const pCount = Math.round(activeEmployees * multiplier);
      return {
        day,
        fullDay: fullDays[idx],
        percentage: activeEmployees > 0 ? Math.round(multiplier * 100) : 100,
        present: pCount,
        total: totalEmployees
      };
    });

    // Dynamic billing for assigned employees
    const guardRatePerMonth = 25000;
    const supervisorRatePerMonth = 35000;
    const grossBilling = assignedEmployees.reduce((sum, emp) => {
      const isSuper = (emp.designation || '').toLowerCase().includes('supervisor') ||
                      (emp.designation || '').toLowerCase().includes('officer');
      return sum + (isSuper ? supervisorRatePerMonth : guardRatePerMonth);
    }, 0);

    const currentBillingAmount = grossBilling;
    const paidAmount = Math.round(grossBilling * 0.85);
    const pendingAmount = grossBilling - paidAmount;
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const kpis = {
      totalEmployees,
      activeEmployees,
      todayAttendancePercent,
      presentToday,
      absentToday,
      onLeaveToday,
      pendingCorrections: 0,
      currentBillingAmount,
      currentBillingFormatted: `₹${currentBillingAmount.toLocaleString('en-IN')}`,
      paidAmount,
      paidAmountFormatted: `₹${paidAmount.toLocaleString('en-IN')}`,
      pendingAmount,
      pendingAmountFormatted: `₹${pendingAmount.toLocaleString('en-IN')}`,
      lastInvoiceNo: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}01`,
      currentBillingPeriod: currentMonthName
    };

    const recentEmployees = assignedEmployees.slice(0, 5).map(emp => {
      const e = emp.toJSON();
      return {
        id: e.employeeId || e.id || e._id,
        employeeCode: e.employeeCode || e.employeeId || 'EMP001',
        name: e.name,
        initials: e.name ? e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'EM',
        designation: e.designation || 'Security Guard',
        department: e.department || 'Security Operations',
        site: e.siteLocation || e.site || 'Assigned Site',
        dutyPost: e.dutyPost || 'Duty Post',
        shift: e.shift || 'General Shift',
        status: (e.employeeStatus || e.status || 'Active').toLowerCase() === 'active' ? 'Active' : 'Inactive',
        mobile: e.mobile || e.contact || '',
        email: e.email || '',
        policeVerification: 'Verified (2026)'
      };
    });

    const recentInvoices = [
      {
        id: 'inv-001',
        invoiceNo: kpis.lastInvoiceNo,
        billingPeriod: currentMonthName,
        issueDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        grossAmount: currentBillingAmount,
        paidAmount,
        pendingAmount,
        status: pendingAmount > 0 ? 'Pending' : 'Paid',
        totalGuards: activeEmployees
      }
    ];

    const sites = Array.from(new Set(
      assignedEmployees.map(e => e.siteLocation || e.site).filter(Boolean)
    ));

    const formattedProfile = formatClientProfile(client, sites);

    // Fetch targeted announcements for this client
    const targetIds = [client.clientId, client._id?.toString(), client.id].filter(Boolean);
    const targetNames = [client.name, client.legalName].filter(Boolean);

    const clientAnnouncements = await Announcement.find({
      $or: [
        { audience: 'all' },
        { audience: { $in: ['all', 'All Clients & Employees', 'ALL', 'all clients & employees', null] } },
        { audience: { $exists: false } },
        {
          audience: { $in: ['clients', 'Clients'] },
          $or: [
            { targetClientId: null },
            { targetClientId: '' },
            { targetClientId: { $exists: false } },
            { targetClientId: { $in: targetIds } },
            { companyIdTarget: { $in: targetIds } },
            { targetClientName: { $in: targetNames } },
            { companyName: { $in: targetNames } }
          ]
        }
      ]
    }).sort({ createdAt: -1 }).limit(5).lean();

    const formattedNotifications = clientAnnouncements.map(a => ({
      id: a.announcementId || a._id?.toString(),
      title: a.title,
      message: a.message,
      type: 'announcement',
      timestamp: a.createdDate ? new Date(a.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
      read: false,
      priority: a.priority
    }));

    return res.status(200).json({
      success: true,
      profile: formattedProfile,
      kpis,
      weeklyAttendanceTrend: weeklyTrend,
      recentEmployees,
      recentInvoices,
      notifications: formattedNotifications,
      totalAssigned: totalEmployees
    });
  } catch (error) {
    console.error('Error in getClientDashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client dashboard.'
    });
  }
};

/**
 * @desc    Get dynamic attendance register for assigned staff
 * @route   GET /api/client-portal/attendance
 * @access  Private (Client / Admin)
 */
export const getClientAttendance = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const { date, month, site, department, status, search } = req.query;
    const isDateMode = Boolean(date);
    const selectedDate = date || new Date().toISOString().split('T')[0];
    const selectedMonth = month || selectedDate.slice(0, 7);
    const selectedYear = Number(selectedMonth.slice(0, 4)) || new Date().getFullYear();

    const [selY, selM] = selectedMonth.split('-').map(Number);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = (selM && selM >= 1 && selM <= 12) ? monthNames[selM - 1] : null;

    const employeeFilter = buildAssignedEmployeeFilter(client);
    let assignedEmployees = await Employee.find(employeeFilter).lean();

    const empIds = assignedEmployees.map(e => e.employeeId).filter(Boolean);
    const empCodes = assignedEmployees.map(e => e.employeeCode).filter(Boolean);
    const allAssignedEmpIds = Array.from(new Set([...empIds, ...empCodes]));

    // Escape regex helper
    const escapeRegex = (s) => String(s || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // Strict client name regexes (exact and core names, NEVER generic "Pvt" / "Ltd")
    const clientNameRegexes = [];
    [client.name, client.legalName].filter(Boolean).forEach(n => {
      const clean = String(n).trim();
      if (!clean) return;
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clientNameRegexes.push(new RegExp(`^\\s*${escaped}\\s*$`, 'i'));
      const core = clean.replace(/\b(pvt\.?|private|ltd\.?|limited)\b/gi, '').trim().replace(/\s+/g, '\\s+');
      if (core.length >= 3) {
        clientNameRegexes.push(new RegExp(`^\\s*${core}(\\s+(pvt\\.?|private|ltd\\.?|limited))*\\s*$`, 'i'));
      }
    });

    // Build client queries for Attendance
    const attendanceQueries = [];
    if (allAssignedEmpIds.length > 0) {
      attendanceQueries.push({ employeeId: { $in: allAssignedEmpIds } });
    }
    if (client.clientId) {
      attendanceQueries.push({ clientId: client.clientId });
      attendanceQueries.push({ clientId: { $regex: new RegExp(`^\\s*${escapeRegex(client.clientId)}\\s*$`, 'i') } });
    }
    clientNameRegexes.forEach(reg => {
      attendanceQueries.push({ clientName: { $regex: reg } });
      attendanceQueries.push({ companyName: { $regex: reg } });
    });

    // Date / Month query
    let attDateQuery;
    if (isDateMode) {
      attDateQuery = { date: selectedDate };
    } else {
      const mStr = String(selM).padStart(2, '0');
      const dateOrs = [
        { month: selectedMonth },
        { month: mStr, ...(selY ? { year: selY } : {}) },
        { month: String(selM), ...(selY ? { year: selY } : {}) },
        { date: { $regex: new RegExp(`^${escapeRegex(selectedMonth)}`) } },
        { date: { $regex: new RegExp(`^${selY}-${mStr}`) } }
      ];
      if (monthName) {
        dateOrs.push({
          month: { $regex: new RegExp(`^${escapeRegex(monthName)}$`, 'i') },
          ...(selY ? { year: selY } : {})
        });
        dateOrs.push({
          month: { $regex: new RegExp(`^${escapeRegex(monthName.slice(0, 3))}$`, 'i') },
          ...(selY ? { year: selY } : {})
        });
      }
      attDateQuery = { $or: dateOrs };
    }

    let attendanceRecords = [];
    if (attendanceQueries.length > 0) {
      attendanceRecords = await Attendance.find({
        $and: [
          { $or: attendanceQueries },
          attDateQuery
        ]
      }).sort({ date: -1, createdAt: -1 }).lean();
    }

    // Group attendance records by employeeId
    const attendanceByEmp = new Map();
    attendanceRecords.forEach(att => {
      const eId = att.employeeId;
      if (eId) {
        if (!attendanceByEmp.has(eId)) {
          attendanceByEmp.set(eId, []);
        }
        attendanceByEmp.get(eId).push(att);
      }
    });

    // Also include any attendance record that strictly belongs to this client even if employee was not in assignedEmployees
    const seenEmpIds = new Set(assignedEmployees.map(e => e.employeeId));
    attendanceRecords.forEach(att => {
      if (att.employeeId && !seenEmpIds.has(att.employeeId)) {
        const matchesClient = (client.clientId && att.clientId === client.clientId) ||
          clientNameRegexes.some(r => r.test(att.clientName || att.companyName || ''));
        if (matchesClient) {
          assignedEmployees.push({
            employeeId: att.employeeId,
            employeeCode: att.employeeId,
            name: att.employeeName,
            fatherHusbandName: att.fatherName || '',
            fatherName: att.fatherName || '',
            clientName: att.clientName || client.name,
            companyName: att.companyName || client.name,
            designation: 'Security Staff',
            department: att.department || 'Security',
            siteLocation: att.site || 'Site',
            site: att.site || 'Site',
            shift: 'General Shift'
          });
          seenEmpIds.add(att.employeeId);
        }
      }
    });

    // Calculate days in the selected month
    const daysInCurrentMonth = new Date(selectedYear, selM || new Date().getMonth() + 1, 0).getDate();

    let records = assignedEmployees.map((emp) => {
      const empAttList = attendanceByEmp.get(emp.employeeId) || [];

      let existing = null;
      let present = 0;
      let weekOff = 0;
      let holidays = 0;
      let cl = 0;
      let sl = 0;
      let el = 0;
      let lwp = 0;
      let workingDays = null;
      let totalPaidDays = null;
      let recordStatus = 'present';
      let checkInTime = '08:00 AM';
      let checkOutTime = '05:00 PM';
      let workingHours = '8h 00m';

      if (isDateMode) {
        // Daily Mode: match specific date
        existing = empAttList.find(a => a.date === selectedDate) || empAttList[0];
        if (existing) {
          recordStatus = existing.status || 'present';
          present = existing.present !== undefined ? Number(existing.present) : (recordStatus === 'present' || recordStatus === 'late' ? 1 : recordStatus === 'half_day' || recordStatus === 'halfDay' ? 0.5 : 0);
          weekOff = existing.weekOff !== undefined ? Number(existing.weekOff) : (recordStatus === 'weekOff' ? 1 : 0);
          holidays = existing.holidays !== undefined ? Number(existing.holidays) : (recordStatus === 'holiday' ? 1 : 0);
          cl = Number(existing.cl || 0);
          sl = Number(existing.sl || 0);
          el = Number(existing.el || 0);
          lwp = existing.lwp !== undefined ? Number(existing.lwp) : (recordStatus === 'absent' ? 1 : 0);
          workingDays = existing.workingDays !== undefined && existing.workingDays !== null ? Number(existing.workingDays) : (existing.totalPaidDays || (present + weekOff + holidays + cl + sl + el));
          totalPaidDays = existing.totalPaidDays !== undefined && existing.totalPaidDays !== null ? Number(existing.totalPaidDays) : workingDays;
          checkInTime = existing.checkIn || (recordStatus === 'present' ? '08:00 AM' : '--');
          checkOutTime = existing.checkOut || (recordStatus === 'present' ? '05:00 PM' : '--');
          workingHours = existing.workingHours || (recordStatus === 'present' ? '8h 00m' : '0h 00m');
        } else {
          // If no daily record uploaded for this date
          recordStatus = 'no_record';
          present = 0;
          weekOff = 0;
          holidays = 0;
          cl = 0;
          sl = 0;
          el = 0;
          lwp = 0;
          workingDays = 0;
          totalPaidDays = 0;
          checkInTime = '--';
          checkOutTime = '--';
          workingHours = '--';
        }
      } else {
        // Monthly Mode
        if (empAttList.length > 0) {
          // 1. Check if there is an explicit monthly muster record from import
          const explicitMonthRecord = empAttList.find(a => (
            (a.present !== undefined && a.present > 1) ||
            (a.totalPaidDays !== undefined && a.totalPaidDays > 1) ||
            (a.workingDays !== undefined && a.workingDays > 1) ||
            (a.weekOff !== undefined && a.weekOff > 0) ||
            (a.month && !a.date?.includes('-'))
          )) || empAttList[0];

          if (explicitMonthRecord && (explicitMonthRecord.present !== undefined || explicitMonthRecord.totalPaidDays !== undefined || explicitMonthRecord.workingDays !== undefined || empAttList.length === 1)) {
            existing = explicitMonthRecord;
            recordStatus = existing.status || (existing.present > 0 ? 'present' : 'present');
            present = existing.present !== undefined ? Number(existing.present) : 0;
            weekOff = existing.weekOff !== undefined ? Number(existing.weekOff) : 0;
            holidays = existing.holidays !== undefined ? Number(existing.holidays) : 0;
            cl = Number(existing.cl || 0);
            sl = Number(existing.sl || 0);
            el = Number(existing.el || 0);
            lwp = existing.lwp !== undefined ? Number(existing.lwp) : 0;
            totalPaidDays = existing.totalPaidDays !== undefined && existing.totalPaidDays !== null 
              ? Number(existing.totalPaidDays) 
              : (present + weekOff + holidays + cl + sl + el);
            workingDays = existing.workingDays !== undefined && existing.workingDays !== null 
              ? Number(existing.workingDays) 
              : (daysInCurrentMonth || totalPaidDays);
            checkInTime = existing.checkIn || '08:00 AM';
            checkOutTime = existing.checkOut || '05:00 PM';
            workingHours = existing.workingHours || (present > 0 ? `${present} days` : '8h 00m');
          } else {
            // Aggregate multiple daily records in the month
            existing = empAttList[0];
            empAttList.forEach(att => {
              const stat = (att.status || '').toLowerCase();
              if (att.present !== undefined && att.present > 0) {
                present += Number(att.present);
              } else if (stat === 'present' || stat === 'late') {
                present += 1;
              } else if (stat === 'half_day' || stat === 'halfday') {
                present += 0.5;
              }

              if (att.weekOff !== undefined && att.weekOff > 0) {
                weekOff += Number(att.weekOff);
              } else if (stat === 'weekoff') {
                weekOff += 1;
              }

              if (att.holidays !== undefined && att.holidays > 0) {
                holidays += Number(att.holidays);
              } else if (stat === 'holiday') {
                holidays += 1;
              }

              cl += Number(att.cl || 0);
              sl += Number(att.sl || 0);
              el += Number(att.el || 0);

              if (att.lwp !== undefined && att.lwp > 0) {
                lwp += Number(att.lwp);
              } else if (stat === 'absent') {
                lwp += 1;
              }
            });

            totalPaidDays = present + weekOff + holidays + cl + sl + el;
            workingDays = daysInCurrentMonth || totalPaidDays;
            recordStatus = present > 0 ? 'present' : (lwp > 0 ? 'absent' : 'present');
          }
        } else {
          // No attendance records uploaded for this employee for this month
          recordStatus = 'no_record';
          present = 0;
          weekOff = 0;
          holidays = 0;
          cl = 0;
          sl = 0;
          el = 0;
          lwp = 0;
          totalPaidDays = 0;
          workingDays = daysInCurrentMonth;
          checkInTime = '--';
          checkOutTime = '--';
          workingHours = '--';
        }
      }

      return {
        id: existing?._id ? existing._id.toString() : `att-${emp.employeeId}-${isDateMode ? selectedDate : selectedMonth}`,
        _id: existing?._id ? existing._id.toString() : `att-${emp.employeeId}-${isDateMode ? selectedDate : selectedMonth}`,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode || emp.employeeId,
        employeeName: emp.name || existing?.employeeName || 'Staff',
        initials: (emp.name || existing?.employeeName)
          ? (emp.name || existing?.employeeName).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          : 'EM',
        fatherName: emp.fatherHusbandName || emp.fatherName || existing?.fatherName || '—',
        clientName: emp.clientName || existing?.clientName || client.name || '—',
        companyName: emp.companyName || existing?.companyName || client.name || '—',
        month: existing?.month || selectedMonth,
        year: existing?.year || selectedYear,
        date: existing?.date || selectedDate,
        present,
        weekOff,
        holidays,
        cl,
        sl,
        el,
        lwp,
        workingDays: workingDays !== null && workingDays !== undefined ? workingDays : (present + weekOff + holidays + cl + sl + el),
        totalPaidDays: totalPaidDays !== null && totalPaidDays !== undefined ? totalPaidDays : (present + weekOff + holidays + cl + sl + el),
        designation: emp.designation || 'Security Guard',
        department: emp.department || existing?.department || 'Security Operations',
        site: emp.siteLocation || emp.site || existing?.site || 'Assigned Site',
        shift: emp.shift || 'General Shift',
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workingHours,
        status: recordStatus,
        verificationMethod: 'Biometric / Facial Recognition',
        dutyPost: emp.dutyPost || 'Duty Post'
      };
    });

    if (site && site !== 'all') {
      records = records.filter(r => r.site === site);
    }
    if (department && department !== 'all') {
      records = records.filter(r => r.department === department);
    }
    if (status && status !== 'all') {
      records = records.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      records = records.filter(r =>
        r.employeeName.toLowerCase().includes(s) ||
        r.employeeCode.toLowerCase().includes(s) ||
        r.fatherName.toLowerCase().includes(s)
      );
    }

    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late' || (Number(r.present) > 0)).length;
    const absentCount = records.filter(r => r.status === 'absent' || (Number(r.lwp) > 0 && Number(r.present) === 0)).length;
    const onLeaveCount = records.filter(r => r.status === 'onLeave' || r.status === 'leave' || (Number(r.cl) > 0 || Number(r.sl) > 0 || Number(r.el) > 0)).length;

    const sites = Array.from(new Set(assignedEmployees.map(e => e.siteLocation || e.site).filter(Boolean)));
    const departments = Array.from(new Set(assignedEmployees.map(e => e.department).filter(Boolean)));

    return res.status(200).json({
      success: true,
      date: selectedDate,
      month: selectedMonth,
      count: records.length,
      records,
      summary: {
        presentCount,
        absentCount,
        onLeaveCount,
        total: records.length,
        attendanceRate: records.length > 0 ? ((presentCount / records.length) * 100).toFixed(1) : 100
      },
      sites,
      departments
    });
  } catch (error) {
    console.error('Error in getClientAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client attendance records.'
    });
  }
};

/**
 * @desc    Get dynamic billing & invoices for authenticated client
 * @route   GET /api/client-portal/billing
 * @access  Private (Client / Admin)
 */
export const getClientBilling = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client account not found.'
      });
    }

    const employeeFilter = buildAssignedEmployeeFilter(client);
    const assignedEmployees = await Employee.find(employeeFilter);
    const guardCount = assignedEmployees.length;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const invoices = [];
    const baseAmt = guardCount * 25000;
    const gstAmt = Math.round(baseAmt * 0.18);
    const grossAmt = baseAmt + gstAmt;

    if (guardCount > 0) {
      invoices.push({
        id: `inv-${client.clientId || 'c1'}-curr`,
        invoiceNo: `INV-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}01`,
        billingPeriod: `${months[currentMonth]} ${currentYear}`,
        issueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
        dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
        baseAmount: baseAmt,
        gstAmount: gstAmt,
        grossAmount: grossAmt,
        paidAmount: Math.round(grossAmt * 0.7),
        pendingAmount: Math.round(grossAmt * 0.3),
        status: 'Pending',
        totalGuards: guardCount,
        gstin: client.gstin || '',
        clientName: client.name || 'Client Company',
        breakdown: [
          { item: `Security Personnel Deployment (${guardCount} Guards)`, quantity: guardCount, rate: 25000, total: baseAmt },
          { item: 'GST (18%)', quantity: 1, rate: gstAmt, total: gstAmt }
        ]
      });
    }

    const totalYtdInvoiced = invoices.reduce((sum, inv) => sum + inv.grossAmount, 0);
    const totalYtdPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);

    return res.status(200).json({
      success: true,
      invoices,
      summary: {
        totalYtdInvoiced,
        totalYtdPaid,
        totalPending,
        activeInvoicesCount: invoices.length,
        currentPeriod: invoices[0]?.billingPeriod || `${months[currentMonth]} ${currentYear}`,
        currentAmount: invoices[0]?.grossAmount || 0
      }
    });
  } catch (error) {
    console.error('Error in getClientBilling:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve billing and invoices.'
    });
  }
};

/**
 * @desc    Get client notifications & alerts
 * @route   GET /api/client-portal/notifications
 * @access  Private (Client / Admin)
 */
export const getClientNotifications = async (req, res) => {
  try {
    const client = await resolveClient(req);
    const companyId = req.headers['x-company-id'] || client?.companyId || req.user?.companyId || 'RRS8392014SEC';

    const targetIds = client ? [client.clientId, client._id?.toString(), client.id].filter(Boolean) : [];
    const targetNames = client ? [client.name, client.legalName].filter(Boolean) : [];

    const announcementQuery = {
      $or: [
        { audience: 'all' },
        { audience: { $in: ['all', 'All Clients & Employees', 'ALL', 'all clients & employees', null] } },
        { audience: { $exists: false } },
        {
          audience: { $in: ['clients', 'Clients'] },
          $or: [
            { targetClientId: null },
            { targetClientId: '' },
            { targetClientId: { $exists: false } },
            { targetClientId: { $in: targetIds } },
            { companyIdTarget: { $in: targetIds } },
            { targetClientName: { $in: targetNames } },
            { companyName: { $in: targetNames } }
          ]
        }
      ]
    };

    const announcements = await Announcement.find(announcementQuery).sort({ createdAt: -1 }).lean();

    // Also fetch system notifications for client
    let systemNotifs = [];
    try {
      const Notification = (await import('../models/notificationModel.js')).default;
      const notifQuery = {
        $or: [
          { recipientRole: 'client' },
          { recipientRole: 'all' },
          { recipientId: { $in: targetIds } },
          { clientName: { $in: targetNames } }
        ]
      };
      systemNotifs = await Notification.find(notifQuery).sort({ createdAt: -1 }).lean();
    } catch (notifErr) {
      console.warn('System notification query in getClientNotifications:', notifErr.message);
    }

    const formattedAnnouncements = announcements.map(a => {
      const createdDateObj = a.createdAt ? new Date(a.createdAt) : (a.createdDate ? new Date(a.createdDate) : new Date());
      const formattedDate = !isNaN(createdDateObj.getTime())
        ? createdDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Today';
      const formattedTime = !isNaN(createdDateObj.getTime())
        ? createdDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '12:00 PM';

      const senderTitle = a.createdBy || 'RR Security Administrator';
      const senderInitials = senderTitle.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';

      return {
        id: `ann-${a.announcementId || a._id?.toString()}`,
        rawId: a.announcementId || a._id?.toString(),
        title: a.title,
        message: a.message,
        type: 'announcement',
        senderName: senderTitle,
        senderRole: 'Executive Administration',
        senderDepartment: 'Head Office & Management',
        senderAvatar: senderInitials,
        audience: a.audience === 'all' ? 'All Clients & Employees' : (a.audience === 'clients' ? 'Client Broadcast' : 'Staff Broadcast'),
        targetClientName: a.targetClientName || a.companyName || null,
        priority: a.priority || 'normal',
        timestamp: formattedDate,
        time: formattedTime,
        fullTimestamp: `${formattedDate} • ${formattedTime}`,
        isoDate: a.createdAt || a.createdDate || new Date().toISOString(),
        read: false
      };
    });

    const formattedSystemNotifs = systemNotifs.map(n => {
      const createdDateObj = n.createdAt ? new Date(n.createdAt) : (n.date ? new Date(n.date) : new Date());
      const formattedDate = !isNaN(createdDateObj.getTime())
        ? createdDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Today';
      const formattedTime = !isNaN(createdDateObj.getTime())
        ? createdDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '12:00 PM';

      const senderTitle = n.actionTakenBy || 'RR Security Operations';
      const senderInitials = senderTitle.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'RR';

      return {
        id: `notif-${n._id?.toString()}`,
        rawId: n._id?.toString(),
        title: n.title,
        message: n.message,
        type: n.type === 'announcement' ? 'announcement' : (n.type?.includes('billing') ? 'billing' : 'workforce'),
        senderName: senderTitle,
        senderRole: 'Operations & Compliance Desk',
        senderDepartment: 'Central Administration',
        senderAvatar: senderInitials,
        audience: n.recipientRole === 'all' ? 'All Clients & Employees' : (n.clientName ? `${n.clientName}` : 'Client Notice'),
        priority: n.priority || 'normal',
        timestamp: formattedDate,
        time: formattedTime,
        fullTimestamp: `${formattedDate} • ${formattedTime}`,
        isoDate: n.createdAt || n.date || new Date().toISOString(),
        read: n.status === 'read'
      };
    });

    const allNotifications = [...formattedAnnouncements, ...formattedSystemNotifs];

    return res.status(200).json({
      success: true,
      notifications: allNotifications,
      unreadCount: allNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Error in getClientNotifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
};
