import mongoose from 'mongoose';
import Shift from '../models/shiftModel.js';
import ShiftRoster from '../models/shiftRosterModel.js';
import Employee from '../models/employeeModel.js';
import Client from '../models/clientModel.js';

// Default initial shift patterns to seed if company has none
const INITIAL_SHIFTS = [
  {
    name: 'Morning Shift',
    type: 'day',
    startTime: '06:00',
    endTime: '14:00',
    gracePeriod: 15,
    breakDuration: 30,
    color: '#3b82f6',
    description: 'Standard early morning security shift',
    status: 'active'
  },
  {
    name: 'General Day Shift',
    type: 'day',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriod: 15,
    breakDuration: 60,
    color: '#10b981',
    description: 'Standard business hours security coverage',
    status: 'active'
  },
  {
    name: 'Evening Shift',
    type: 'day',
    startTime: '14:00',
    endTime: '22:00',
    gracePeriod: 15,
    breakDuration: 30,
    color: '#8b5cf6',
    description: 'Afternoon to evening security monitoring',
    status: 'active'
  },
  {
    name: 'Night Patrol Shift',
    type: 'night',
    startTime: '22:00',
    endTime: '06:00',
    gracePeriod: 15,
    breakDuration: 45,
    color: '#6366f1',
    description: 'Overnight perimeter patrolling and surveillance',
    status: 'active'
  },
  {
    name: 'Rotational 12H Guard',
    type: 'rotational',
    startTime: '08:00',
    endTime: '20:00',
    gracePeriod: 15,
    breakDuration: 60,
    color: '#f59e0b',
    description: '12-hour rotating duty shift',
    status: 'active'
  }
];

/**
 * @desc    Get all shifts for the active company profile
 * @route   GET /api/shifts
 * @access  Private
 */
export const getShifts = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch shifts.'
      });
    }

    let shifts = await Shift.find({ companyId, adminEmail }).sort({ createdAt: 1 });

    // If company is brand new and has no shifts configured, auto-seed standard shift patterns
    if (shifts.length === 0) {
      const seedDocs = INITIAL_SHIFTS.map((s, idx) => ({
        ...s,
        shiftId: `SHF-${String(idx + 1).padStart(3, '0')}`,
        companyId,
        adminEmail
      }));
      try {
        shifts = await Shift.insertMany(seedDocs);
      } catch (seedErr) {
        console.warn('Shift auto-seed note:', seedErr.message);
        shifts = await Shift.find({ companyId, adminEmail });
      }
    }

    return res.status(200).json({
      success: true,
      count: shifts.length,
      shifts: shifts.map(s => s.toJSON())
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shifts.'
    });
  }
};

/**
 * @desc    Create a new shift
 * @route   POST /api/shifts
 * @access  Private (Admin)
 */
export const createShift = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Active Company ID is required to create a shift.'
      });
    }

    const {
      name,
      type,
      startTime,
      endTime,
      gracePeriod,
      breakDuration,
      color,
      description,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shift Name is required.'
      });
    }

    const existingShift = await Shift.findOne({
      companyId,
      adminEmail,
      name: name.trim()
    });

    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: `A shift named "${name.trim()}" already exists in this company.`
      });
    }

    const totalCount = await Shift.countDocuments({ companyId, adminEmail });
    const shiftId = `SHF-${String(totalCount + 1).padStart(3, '0')}`;

    const newShift = await Shift.create({
      shiftId,
      companyId,
      adminEmail,
      name: name.trim(),
      type: type || 'day',
      startTime: startTime || '',
      endTime: endTime || '',
      gracePeriod: Number(gracePeriod) || 15,
      breakDuration: Number(breakDuration) || 30,
      color: color || '#2563eb',
      description: description || '',
      status: status || 'active'
    });

    return res.status(201).json({
      success: true,
      message: `Shift "${newShift.name}" created successfully.`,
      shift: newShift.toJSON()
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shift.'
    });
  }
};

/**
 * @desc    Update a shift
 * @route   PUT /api/shifts/:id
 * @access  Private (Admin)
 */
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ _id: id }, { shiftId: id }];
    } else {
      query.shiftId = id;
    }
    if (companyId) query.companyId = companyId;

    const shift = await Shift.findOne(query);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found.'
      });
    }

    const fields = [
      'name', 'type', 'startTime', 'endTime', 'gracePeriod',
      'breakDuration', 'color', 'description', 'status'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        shift[field] = req.body[field];
      }
    });

    await shift.save();

    return res.status(200).json({
      success: true,
      message: `Shift "${shift.name}" updated successfully.`,
      shift: shift.toJSON()
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update shift.'
    });
  }
};

/**
 * @desc    Delete a shift
 * @route   DELETE /api/shifts/:id
 * @access  Private (Admin)
 */
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'];

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ _id: id }, { shiftId: id }];
    } else {
      query.shiftId = id;
    }
    if (companyId) query.companyId = companyId;

    const shift = await Shift.findOneAndDelete(query);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Shift "${shift.name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete shift.'
    });
  }
};

/**
 * @desc    Get shift roster for company with dynamic unassigned employee resolution
 * @route   GET /api/shifts/roster
 * @access  Private
 */
export const getShiftRoster = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch shift roster.'
      });
    }

    const { date, clientId, site, department, shiftId, shiftType, status, search } = req.query;

    const rosterFilter = { companyId, adminEmail };
    if (date) rosterFilter.date = date;
    if (clientId && clientId !== 'all') rosterFilter.clientId = clientId;
    if (site && site !== 'all') rosterFilter.site = site;
    if (department && department !== 'all') rosterFilter.department = department;
    if (shiftId && shiftId !== 'all') rosterFilter.shiftId = shiftId;
    if (shiftType && shiftType !== 'all') rosterFilter.shiftType = shiftType;
    if (status && status !== 'all' && status !== 'unassigned') rosterFilter.status = status;

    const assignedRosters = await ShiftRoster.find(rosterFilter).sort({ date: -1, employeeName: 1 });

    // Fetch all active company employees to dynamically identify unassigned employees
    const employees = await Employee.find({ companyId, adminEmail });

    // If viewing for a specific date or overall, synthesize unassigned employees
    const assignedEmpIds = new Set(assignedRosters.map(r => r.employeeId));
    const unassignedList = [];

    employees.forEach(emp => {
      const empId = emp.employeeId || emp.employeeCode || emp._id.toString();
      if (!assignedEmpIds.has(empId)) {
        unassignedList.push({
          id: `unassigned-${empId}`,
          employeeId: empId,
          employeeName: emp.name,
          initials: emp.name.substring(0, 2).toUpperCase(),
          clientId: emp.clientId || emp.companyId || '',
          clientName: emp.clientName || emp.companyName || '',
          site: emp.siteLocation || emp.site || 'Main Site',
          department: emp.department || 'Security',
          shiftId: null,
          shiftName: 'Unassigned',
          shiftType: null,
          startTime: null,
          endTime: null,
          date: date || new Date().toISOString().split('T')[0],
          status: 'unassigned'
        });
      }
    });

    let combined = [];
    if (status === 'unassigned') {
      combined = unassignedList;
    } else if (status === 'active' || status === 'inactive') {
      combined = assignedRosters.map(r => r.toJSON());
    } else {
      combined = [...assignedRosters.map(r => r.toJSON()), ...unassignedList];
    }

    // Apply search filter if present
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      combined = combined.filter(item =>
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        (item.employeeId && item.employeeId.toLowerCase().includes(q)) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.site && item.site.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: combined.length,
      assignedCount: assignedRosters.length,
      unassignedCount: unassignedList.length,
      roster: combined
    });
  } catch (error) {
    console.error('Error fetching shift roster:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shift roster.'
    });
  }
};

/**
 * @desc    Assign an employee to a shift for a date or date range
 * @route   POST /api/shifts/roster/assign
 * @access  Private (Admin)
 */
export const assignShift = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to assign shift.'
      });
    }

    const {
      employeeId,
      employeeName,
      initials,
      clientId,
      clientName,
      site,
      department,
      shiftId,
      startDate,
      endDate,
      date
    } = req.body;

    if (!employeeId || !shiftId) {
      return res.status(400).json({
        success: false,
        message: 'Employee and Shift selection are required.'
      });
    }

    // Look up employee and shift definitions
    const [employee, shift] = await Promise.all([
      Employee.findOne({
        companyId,
        adminEmail,
        $or: [
          { employeeId },
          { employeeCode: employeeId },
          ...(mongoose.isValidObjectId(employeeId) ? [{ _id: employeeId }] : [])
        ]
      }),
      Shift.findOne({
        companyId,
        adminEmail,
        $or: [
          { shiftId: String(shiftId) },
          { name: String(shiftId) },
          ...(mongoose.isValidObjectId(shiftId) ? [{ _id: shiftId }] : [])
        ]
      })
    ]);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Selected shift does not exist.'
      });
    }

    const resolvedEmpName = employee?.name || employeeName || 'Employee';
    const resolvedEmpId = employee?.employeeId || employeeId;
    const resolvedInitials = initials || resolvedEmpName.substring(0, 2).toUpperCase();
    const resolvedClient = employee?.clientName || employee?.companyName || clientName || '';
    const resolvedClientId = employee?.clientId || employee?.companyId || clientId || '';
    const resolvedSite = site || employee?.siteLocation || employee?.site || 'Main Site';
    const resolvedDept = department || employee?.department || 'Security';

    const start = startDate || date || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    // Generate dates between start and end inclusive
    const datesToAssign = [];
    let curr = new Date(start);
    const endObj = new Date(end);

    while (curr <= endObj) {
      datesToAssign.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const upsertPromises = datesToAssign.map(targetDate => {
      return ShiftRoster.findOneAndUpdate(
        {
          companyId,
          adminEmail,
          employeeId: resolvedEmpId,
          date: targetDate
        },
        {
          companyId,
          adminEmail,
          employeeId: resolvedEmpId,
          employeeName: resolvedEmpName,
          initials: resolvedInitials,
          clientId: resolvedClientId,
          clientName: resolvedClient,
          site: resolvedSite,
          department: resolvedDept,
          shiftId: shift.shiftId || shift._id.toString(),
          shiftName: shift.name,
          shiftType: shift.type,
          startTime: shift.startTime,
          endTime: shift.endTime,
          date: targetDate,
          startDate: start,
          endDate: end,
          status: 'active'
        },
        { upsert: true, new: true }
      );
    });

    const results = await Promise.all(upsertPromises);

    return res.status(200).json({
      success: true,
      message: `Employee "${resolvedEmpName}" assigned to ${shift.name} successfully (${datesToAssign.length} date${datesToAssign.length > 1 ? 's' : ''}).`,
      roster: results.map(r => r.toJSON())
    });
  } catch (error) {
    console.error('Error assigning shift:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign shift.'
    });
  }
};

/**
 * @desc    Change shift for an existing roster entry
 * @route   PUT /api/shifts/roster/:id/change
 * @access  Private (Admin)
 */
export const changeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const { shiftId, date } = req.body;

    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: 'New Shift ID is required.'
      });
    }

    const shift = await Shift.findOne({
      companyId,
      adminEmail,
      $or: [
        { shiftId: String(shiftId) },
        { name: String(shiftId) },
        ...(mongoose.isValidObjectId(shiftId) ? [{ _id: shiftId }] : [])
      ]
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Selected target shift not found.'
      });
    }

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.employeeId = id;
      if (date) query.date = date;
    }
    if (companyId) query.companyId = companyId;

    const roster = await ShiftRoster.findOne(query);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster assignment record not found.'
      });
    }

    roster.shiftId = shift.shiftId || shift._id.toString();
    roster.shiftName = shift.name;
    roster.shiftType = shift.type;
    roster.startTime = shift.startTime;
    roster.endTime = shift.endTime;
    if (date) roster.date = date;
    roster.status = 'active';

    await roster.save();

    return res.status(200).json({
      success: true,
      message: `Shift changed to "${shift.name}" successfully.`,
      roster: roster.toJSON()
    });
  } catch (error) {
    console.error('Error changing shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change shift.'
    });
  }
};

/**
 * @desc    Unassign an employee from a roster assignment
 * @route   DELETE /api/shifts/roster/:id
 * @access  Private (Admin)
 */
export const unassignEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'];
    const { date } = req.query;

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.employeeId = id;
      if (date) query.date = date;
    }
    if (companyId) query.companyId = companyId;

    const removed = await ShiftRoster.findOneAndDelete(query);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Roster assignment not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Employee "${removed.employeeName}" unassigned successfully.`
    });
  } catch (error) {
    console.error('Error unassigning employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unassign employee.'
    });
  }
};

/**
 * @desc    Get dynamic summary stats for shifts & workforce assignments
 * @route   GET /api/shifts/stats
 * @access  Private
 */
export const getShiftStats = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to calculate shift stats.'
      });
    }

    const todayDate = req.query.date || new Date().toISOString().split('T')[0];

    const [shifts, totalEmployees, assignedToday, clients] = await Promise.all([
      Shift.find({ companyId, adminEmail }),
      Employee.find({ companyId, adminEmail }),
      ShiftRoster.find({ companyId, adminEmail, date: todayDate }),
      Client.find({ companyId, adminEmail })
    ]);

    const totalShifts = shifts.length;
    const activeShifts = shifts.filter(s => s.status === 'active').length;
    const assignedEmpIds = new Set(assignedToday.map(r => r.employeeId));
    const employeesAssigned = assignedEmpIds.size;
    const totalEmpCount = totalEmployees.length;
    const unassignedEmployees = Math.max(0, totalEmpCount - employeesAssigned);

    const patternsByType = {
      day: shifts.filter(s => s.type === 'day').length,
      night: shifts.filter(s => s.type === 'night').length,
      rotational: shifts.filter(s => s.type === 'rotational').length
    };

    // Calculate site distribution
    const siteMap = {};
    assignedToday.forEach(r => {
      const site = r.site || 'Main Site';
      if (!siteMap[site]) {
        siteMap[site] = { site, day: 0, night: 0, rotational: 0 };
      }
      if (r.shiftType === 'day') siteMap[site].day++;
      else if (r.shiftType === 'night') siteMap[site].night++;
      else if (r.shiftType === 'rotational') siteMap[site].rotational++;
    });

    const siteDistribution = Object.values(siteMap);

    // Calculate client summary
    const clientMap = {};
    clients.forEach(c => {
      clientMap[c.name] = {
        name: c.name,
        employees: totalEmployees.filter(e => e.clientName === c.name || e.companyName === c.name).length,
        shifts: activeShifts
      };
    });

    const clientSummary = Object.values(clientMap);

    return res.status(200).json({
      success: true,
      stats: {
        totalShifts,
        activeShifts,
        employeesAssigned,
        unassignedEmployees,
        totalEmployees: totalEmpCount,
        patternsByType,
        siteDistribution,
        clientSummary
      }
    });
  } catch (error) {
    console.error('Error calculating shift stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate shift stats.'
    });
  }
};
