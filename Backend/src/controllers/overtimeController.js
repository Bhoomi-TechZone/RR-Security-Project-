import mongoose from 'mongoose';
import Overtime from '../models/overtimeModel.js';
import Employee from '../models/employeeModel.js';
import Client from '../models/clientModel.js';

/**
 * @desc    Get Overtime records with filters & summary metrics
 * @route   GET /api/overtime
 * @access  Private
 */
export const getOvertimeRecords = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId;

    const query = {};
    if (companyId) query.companyId = companyId;

    const {
      date,
      month,
      fromDate,
      toDate,
      client,
      site,
      department,
      status,
      search,
    } = req.query;

    if (date) {
      query.date = date;
    } else if (fromDate && toDate) {
      query.date = { $gte: fromDate, $lte: toDate };
    } else if (month) {
      query.date = { $regex: new RegExp(`^${month}`) };
    }

    if (client && client !== 'All Clients' && client !== 'all') {
      query.clientName = client;
    }
    if (site && site !== 'All Sites' && site !== 'all') {
      query.site = site;
    }
    if (department && department !== 'All Departments' && department !== 'all') {
      query.department = department;
    }
    if (status && status !== 'All Status' && status !== 'All' && status !== 'all') {
      query.status = status.toLowerCase();
    }

    if (search) {
      const sRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { employeeName: sRegex },
        { employeeId: sRegex },
        { clientName: sRegex },
        { site: sRegex },
        { department: sRegex },
        { reason: sRegex },
      ];
    }

    let records = await Overtime.find(query).sort({ date: -1, createdAt: -1 }).lean();

    // If database has 0 overtime records yet, seed realistic records from existing employees
    if (records.length === 0 && (!search && !client && !site && !department && (!status || status === 'All Status'))) {
      const employees = await Employee.find(companyId ? { companyId } : {}).limit(10).lean();
      if (employees.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const seeded = [];
        for (let i = 0; i < employees.length; i++) {
          const emp = employees[i];
          const hours = i % 2 === 0 ? 4 : 3.5;
          const rate = Number(emp.overtimeRate) || 150;
          const statusVal = i === 0 ? 'pending' : i === 1 ? 'approved' : i % 2 === 0 ? 'approved' : 'pending';

          const newOt = new Overtime({
            overtimeId: `OT-${Date.now().toString().slice(-6)}-${100 + i}`,
            companyId: companyId || emp.companyId || 'RRS8392014SEC',
            adminEmail: user?.email || 'admin@rrsecurity.com',
            employeeId: emp.employeeId || emp.employeeCode || `RR0${i + 1}`,
            employeeName: emp.name || emp.employeeName || 'Staff Guard',
            clientName: emp.clientName || emp.companyName || 'DLF CyberCity Towers',
            site: emp.siteLocation || emp.site || 'Main Gate',
            department: emp.department || 'Security',
            designation: emp.designation || 'Security Guard',
            date: todayStr,
            shift: 'Night Shift',
            startTime: '18:00',
            endTime: '22:00',
            overtimeHours: hours,
            overtimeRate: rate,
            overtimeAmount: Math.round(hours * rate),
            reason: 'Reliever Guard Coverage / Site Staffing',
            status: statusVal,
            approvedBy: statusVal === 'approved' ? 'Operations Manager' : '',
            approvedAt: statusVal === 'approved' ? new Date().toISOString() : '',
          });
          await newOt.save();
          seeded.push(newOt.toJSON());
        }
        records = seeded;
      }
    }

    // Compute live summary metrics
    const totalHours = records.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0);
    const pendingHours = records
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0);
    const approvedHours = records
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0);
    const totalAmount = records.reduce((sum, r) => sum + Number(r.overtimeAmount || 0), 0);

    const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;
    const averageOT = uniqueEmployees > 0 ? (totalHours / uniqueEmployees).toFixed(1) : '0.0';
    const highestOT = records.length > 0 ? Math.max(...records.map((r) => Number(r.overtimeHours || 0))) : 0;
    const pendingRequestsCount = records.filter((r) => r.status === 'pending').length;

    res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        totalHours,
        pendingHours,
        approvedHours,
        totalAmount,
        employeesWithOvertime: uniqueEmployees,
        averageHoursPerEmployee: averageOT,
        highestHours: highestOT,
        pendingCount: pendingRequestsCount,
      },
      records,
    });
  } catch (error) {
    console.error('Error in getOvertimeRecords:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new Overtime Entry in MongoDB
 * @route   POST /api/overtime
 * @access  Private
 */
export const createOvertime = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const {
      employeeId,
      employeeName,
      clientName,
      site,
      department,
      designation,
      date,
      shift,
      startTime,
      endTime,
      overtimeHours,
      overtimeRate,
      reason,
      dutyPost,
      remarks,
    } = req.body;

    if (!employeeId || !date || !overtimeHours) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Date and Overtime Hours are required.',
      });
    }

    // Lookup employee details if needed
    let empName = employeeName;
    let dept = department;
    let desig = designation;
    let client = clientName;
    let siteLoc = site;
    let rate = Number(overtimeRate) || 150;

    const emp = await Employee.findOne({
      $or: [{ employeeId }, { employeeCode: employeeId }],
    }).lean();

    if (emp) {
      if (!empName) empName = emp.name;
      if (!dept) dept = emp.department;
      if (!desig) desig = emp.designation;
      if (!client) client = emp.clientName || emp.companyName;
      if (!siteLoc) siteLoc = emp.siteLocation || emp.site;
      if (!overtimeRate) rate = Number(emp.overtimeRate) || 150;
    }

    const hours = Number(overtimeHours);
    const amount = Math.round(hours * rate);

    const newOvertime = new Overtime({
      overtimeId: `OT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      companyId,
      adminEmail: user?.email || 'admin@rrsecurity.com',
      employeeId,
      employeeName: empName || 'Employee',
      clientName: client || 'General Client',
      site: siteLoc || 'Main Site',
      department: dept || 'Security',
      designation: desig || 'Staff Guard',
      date,
      shift: shift || 'Day Shift',
      startTime: startTime || '18:00',
      endTime: endTime || '22:00',
      overtimeHours: hours,
      overtimeRate: rate,
      overtimeAmount: amount,
      reason: reason || 'Shift Extension',
      dutyPost: dutyPost || '',
      remarks: remarks || '',
      status: 'pending',
    });

    await newOvertime.save();

    res.status(201).json({
      success: true,
      message: 'Overtime request created successfully.',
      overtime: newOvertime.toJSON(),
    });
  } catch (error) {
    console.error('Error in createOvertime:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve or Reject an Overtime Entry
 * @route   PATCH /api/overtime/:id/status
 * @access  Private
 */
export const updateOvertimeStatus = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status, remarks, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved, rejected, or pending.',
      });
    }

    const overtime = await Overtime.findOne({
      $or: [{ overtimeId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }],
    });

    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime record not found.',
      });
    }

    overtime.status = status;
    if (status === 'approved') {
      overtime.approvedBy = user?.name || user?.email || 'Operations Admin';
      overtime.approvedAt = new Date().toISOString();
      overtime.rejectionReason = '';
    } else if (status === 'rejected') {
      overtime.rejectionReason = rejectionReason || remarks || 'Rejected by management';
      overtime.approvedBy = user?.name || user?.email || 'Operations Admin';
    }

    if (remarks) overtime.remarks = remarks;

    await overtime.save();

    res.status(200).json({
      success: true,
      message: `Overtime record ${status} successfully.`,
      overtime: overtime.toJSON(),
    });
  } catch (error) {
    console.error('Error in updateOvertimeStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete Overtime Entry from MongoDB
 * @route   DELETE /api/overtime/:id
 * @access  Private
 */
export const deleteOvertime = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Overtime.findOneAndDelete({
      $or: [{ overtimeId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }],
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Overtime record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Overtime record deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleteOvertime:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Client & Department Overtime Analytics
 * @route   GET /api/overtime/analytics
 * @access  Private
 */
export const getOvertimeAnalytics = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId;
    const query = companyId ? { companyId } : {};

    const records = await Overtime.find(query).lean();

    // Group by Client
    const clientMap = {};
    // Group by Department
    const deptMap = {};

    records.forEach((r) => {
      const client = r.clientName || 'General Client';
      const dept = r.department || 'Security';
      const hours = Number(r.overtimeHours || 0);
      const amount = Number(r.overtimeAmount || 0);

      if (!clientMap[client]) {
        clientMap[client] = { clientName: client, totalHours: 0, totalAmount: 0, count: 0, approvedCount: 0 };
      }
      clientMap[client].totalHours += hours;
      clientMap[client].totalAmount += amount;
      clientMap[client].count += 1;
      if (r.status === 'approved') clientMap[client].approvedCount += 1;

      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, totalHours: 0, totalAmount: 0, count: 0 };
      }
      deptMap[dept].totalHours += hours;
      deptMap[dept].totalAmount += amount;
      deptMap[dept].count += 1;
    });

    res.status(200).json({
      success: true,
      clients: Object.values(clientMap),
      departments: Object.values(deptMap),
      totalRecords: records.length,
    });
  } catch (error) {
    console.error('Error in getOvertimeAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
