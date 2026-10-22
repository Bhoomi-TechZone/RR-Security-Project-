import mongoose from 'mongoose';
import Transfer from '../models/transferModel.js';
import Employee from '../models/employeeModel.js';

/**
 * @desc    Get all employee transfer records for a company
 * @route   GET /api/transfers
 * @access  Private
 */
export const getTransfers = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId;
    const { employeeId, search, client, reason } = req.query;

    const query = {};
    if (companyId && companyId !== 'default' && companyId !== 'all') {
      query.$or = [{ companyId }, { companyId: 'RRS8392014SEC' }];
    }

    if (employeeId) {
      query.employeeId = { $regex: new RegExp(`^${employeeId.trim()}$`, 'i') };
    }

    if (client && client !== 'all') {
      const cRegex = new RegExp(client.trim(), 'i');
      query.$or = [{ toClient: cRegex }, { fromClient: cRegex }];
    }

    if (reason && reason !== 'all') {
      query.reason = { $regex: new RegExp(`^${reason.trim()}$`, 'i') };
    }

    if (search) {
      const sRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { employeeName: sRegex },
        { employeeId: sRegex },
        { transferId: sRegex },
        { toClient: sRegex },
        { fromClient: sRegex },
        { toSite: sRegex },
        { fromSite: sRegex },
      ];
    }

    const rawTransfers = await Transfer.find(query).sort({ effectiveDate: -1, createdAt: -1 });

    const transfers = rawTransfers.map((t) => {
      const json = t.toJSON();
      return {
        ...json,
        id: json.transferId || json.id,
        date: json.effectiveDate || json.date,
      };
    });

    return res.status(200).json({
      success: true,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transfer history from database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new employee transfer record & update employee site assignment
 * @route   POST /api/transfers
 * @access  Private (Admin / Manager)
 */
export const createTransfer = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const {
      employeeId,
      targetClientId,
      toClientId: reqToClientId,
      targetClientName,
      toClient: reqToClient,
      targetSite,
      toSite: reqToSite,
      effectiveDate,
      reason,
      remarks,
    } = req.body;

    const toClientId = targetClientId || reqToClientId || '';
    const toClient = (targetClientName || reqToClient || '').trim();
    const toSite = (targetSite || reqToSite || '').trim();

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    if (!toClient) {
      return res.status(400).json({ success: false, message: 'Target client company is required.' });
    }

    if (!toSite) {
      return res.status(400).json({ success: false, message: 'Target site location is required.' });
    }

    // 1. Locate Employee in database
    const empSearchQuery = {
      $or: [
        { employeeId: String(employeeId).trim() },
        { employeeCode: String(employeeId).trim() },
      ],
    };

    if (mongoose.isValidObjectId(employeeId)) {
      empSearchQuery.$or.push({ _id: employeeId });
    }

    let employee = await Employee.findOne({ companyId, ...empSearchQuery });
    if (!employee) {
      employee = await Employee.findOne(empSearchQuery);
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID "${employeeId}" not found in database.`,
      });
    }

    // 2. Capture Previous Assignment
    const fromClientId = employee.clientId || '';
    const fromClient = employee.clientName || employee.companyName || 'Not Assigned';
    const fromSite = employee.siteLocation || employee.site || employee.address || 'Headquarters';

    // 3. Generate Sequential Transfer Reference ID
    const effectiveCompanyId = employee.companyId || companyId;
    const totalCompanyTransfers = await Transfer.countDocuments({ companyId: effectiveCompanyId });
    const transferId = `TRF-${String(1001 + totalCompanyTransfers).padStart(4, '0')}`;

    // 4. Update Employee Master in Database
    employee.clientId = toClientId;
    employee.clientName = toClient;
    employee.companyName = toClient;
    employee.siteLocation = toSite;
    employee.site = toSite;
    await employee.save();

    // 5. Create Permanent Audit Transfer Log in Database
    const newTransfer = await Transfer.create({
      companyId: effectiveCompanyId,
      transferId,
      employeeId: employee.employeeId || employee.employeeCode,
      employeeMongoId: employee._id,
      employeeName: employee.name,
      designation: employee.designation || 'Staff',
      department: employee.department || 'General',
      fromClientId,
      fromClient,
      fromSite,
      toClientId,
      toClient,
      toSite,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      reason: reason || 'Project Reassignment',
      remarks: (remarks || '').trim() || 'Workforce deployment updated.',
      transferredBy: user?.name || user?.email || 'Administrator',
      status: 'Completed',
    });

    const formattedTransfer = {
      ...newTransfer.toJSON(),
      id: newTransfer.transferId,
      date: newTransfer.effectiveDate,
    };

    return res.status(201).json({
      success: true,
      message: `✓ Successfully transferred ${employee.name} to ${toClient} (${toSite})!`,
      transfer: formattedTransfer,
      employee: employee.toJSON(),
    });
  } catch (error) {
    console.error('Error creating employee transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record employee transfer in database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a transfer record from database
 * @route   DELETE /api/transfers/:id
 * @access  Private (Admin)
 */
export const deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transfer.findOneAndDelete({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { transferId: id }],
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transfer record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Transfer log deleted successfully from database.',
    });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transfer log.',
      error: error.message,
    });
  }
};
