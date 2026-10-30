import mongoose from 'mongoose';
import Master from '../models/masterModel.js';
import Company from '../models/companyModel.js';
import Shift from '../models/shiftModel.js';
import LeaveType from '../models/leaveTypeModel.js';

/**
 * Format master output to maintain exact frontend component compatibility
 */
const formatMaster = (doc) => {
  const json = doc.toJSON ? doc.toJSON() : { ...doc };
  if (json.type === 'salary-components') {
    json.type = json.type_kind || json.metadata?.type || 'earning';
    json.masterCategory = 'salary-components';
    if (!json.shortName && json.code) {
      json.shortName = json.code;
    }
    if (!json.componentType) {
      json.componentType = json.type === 'deduction'
        ? (json.deductionType || 'Percent Based')
        : (json.metadata?.componentType || 'Paid Days');
    }
  }
  return json;
};

/**
 * Helper to resolve company ID aliases for company isolation
 */
const resolveCompanyIds = async (companyId, adminEmail) => {
  let companyIds = [companyId];
  try {
    const query = {
      $or: [
        { companyId },
        { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
      ]
    };
    if (adminEmail) query.adminEmail = adminEmail;

    const comp = await Company.findOne(query);
    if (comp) {
      companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
    }
  } catch {}
  return companyIds;
};

/**
 * @desc    Get all master records for a type with company isolation (NO AUTO-SEEDING)
 * @route   GET /api/masters?type=<type>&companyId=<companyId>
 * @access  Private
 */
export const getMasters = async (req, res) => {
  try {
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const type = req.query.type;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch master records.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = { companyId: { $in: companyIds } };
    if (type) {
      if (type === 'client-services' || type === 'clients') {
        query.type = { $in: ['client-services', 'clients'] };
      } else {
        query.type = type;
      }
    }

    // If fetching shifts, ensure any records in Shift collection are reflected in Master (batched)
    if (type === 'shifts' || !type) {
      try {
        const existingShifts = await Shift.find({ companyId: { $in: companyIds } }).lean();
        if (existingShifts.length > 0) {
          const shiftMasters = await Master.find({
            companyId: { $in: companyIds },
            type: 'shifts'
          }).select('name').lean();
          const existingNames = new Set(shiftMasters.map(m => m.name));
          const toInsert = existingShifts
            .filter(sh => !existingNames.has(sh.name))
            .map(sh => ({
              companyId: sh.companyId || companyId,
              adminEmail: sh.adminEmail || adminEmail || 'rrsecurity@gmail.com',
              type: 'shifts',
              name: sh.name,
              code: sh.shiftId || '',
              shiftType: sh.type || 'day',
              startTime: sh.startTime || '',
              endTime: sh.endTime || '',
              breakDuration: sh.breakDuration || 30,
              gracePeriod: sh.gracePeriod || 15,
              description: sh.description || '',
              status: sh.status || 'active'
            }));
          if (toInsert.length > 0) {
            await Master.insertMany(toInsert);
          }
        }
      } catch (syncErr) {
        console.warn('Sync shifts to Master error:', syncErr.message);
      }
    }

    // If fetching leave types, ensure any records in LeaveType collection are reflected in Master (batched)
    if (type === 'leave-types' || !type) {
      try {
        const existingLeaveTypes = await LeaveType.find({ companyId: { $in: companyIds } }).lean();
        if (existingLeaveTypes.length > 0) {
          const leaveMasters = await Master.find({
            companyId: { $in: companyIds },
            type: 'leave-types'
          }).select('code name').lean();
          const existingKeys = new Set(leaveMasters.flatMap(m => [m.code, m.name]).filter(Boolean));
          const toInsert = existingLeaveTypes
            .filter(lt => !existingKeys.has(lt.code) && !existingKeys.has(lt.name))
            .map(lt => ({
              companyId: lt.companyId || companyId,
              adminEmail: lt.adminEmail || adminEmail || 'rrsecurity@gmail.com',
              type: 'leave-types',
              name: lt.name,
              code: lt.code || '',
              paidType: (lt.category || 'Paid').toLowerCase(),
              annualQuota: Number(lt.quota) || 12,
              carryForward: Boolean(lt.carryForward),
              maxAccumulation: Number(lt.maxCarryForward) || 0,
              encashment: false,
              description: lt.description || '',
              status: (lt.status || 'Active').toLowerCase()
            }));
          if (toInsert.length > 0) {
            await Master.insertMany(toInsert);
          }
        }
      } catch (syncErr) {
        console.warn('Sync leave types to Master error:', syncErr.message);
      }
    }

    // Query purely from database, no auto-seeding
    const items = await Master.find(query).sort({ createdAt: 1 });
    const formatted = items.map(formatMaster);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching masters:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve master records.',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new master item in MongoDB
 * @route   POST /api/masters
 * @access  Private (Admin)
 */
export const createMaster = async (req, res) => {
  try {
    const adminEmail = req.user?.email?.toLowerCase() || 'rrsecurity@gmail.com';
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create a master record.'
      });
    }

    const {
      type,
      name,
      code,
      description,
      status,
      branches,
      branchList,
      employees,
      department,
      clientId,
      clientName,
      workLocationId,
      workLocationName,
      address,
      city,
      state,
      pinCode,
      contactPerson,
      contactNumber,
      minimumManpower,
      paidType,
      annualQuota,
      carryForward,
      maxAccumulation,
      encashment,
      date,
      holidayType,
      applicableLocation,
      shiftType,
      gracePeriod,
      startTime,
      endTime,
      breakDuration,
      calculationType,
      defaultValue,
      taxable,
      requiredType,
      expiryRequired,
      verificationRequired,
      metadata
    } = req.body;

    let rawType = req.body.masterCategory || req.query.type || type;
    let type_kind = req.body.type_kind;

    if (rawType === 'earning' || rawType === 'deduction' || type === 'earning' || type === 'deduction') {
      type_kind = (type === 'deduction' || rawType === 'deduction') ? 'deduction' : 'earning';
      rawType = 'salary-components';
    }

    let targetType = rawType === 'clients' ? 'client-services' : rawType;

    // Handle salary component type distinction
    if (targetType === 'salary-components') {
      type_kind = type_kind || req.body.type_kind || (type === 'deduction' ? 'deduction' : 'earning');
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    // Prevent duplicate records for the same category and company
    const existing = await Master.findOne({
      companyId: { $in: companyIds },
      type: targetType,
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A record with the name "${name.trim()}" already exists in this category.`
      });
    }

    const finalCode = code ? code.trim() : '';

    const newMaster = new Master({
      companyId,
      adminEmail,
      type: targetType,
      name: name.trim(),
      code: finalCode,
      description: description ? description.trim() : '',
      status: status || 'active',
      branches: Number(branches) || (Array.isArray(branchList) ? branchList.length : 0),
      branchList: Array.isArray(branchList)
        ? branchList.map(b => String(b).trim()).filter(Boolean)
        : (typeof branchList === 'string' && branchList ? branchList.split(',').map(b => b.trim()).filter(Boolean) : []),
      employees: Number(employees) || 0,
      department: department || '',
      clientId: clientId || '',
      clientName: clientName || '',
      workLocationId: workLocationId || '',
      workLocationName: workLocationName || '',
      address: address || '',
      city: city || '',
      state: state || '',
      pinCode: pinCode || '',
      contactPerson: contactPerson || '',
      contactNumber: contactNumber || '',
      minimumManpower: Number(minimumManpower) || 0,
      paidType: paidType || 'paid',
      annualQuota: Number(annualQuota) || 0,
      carryForward: Boolean(carryForward),
      maxAccumulation: Number(maxAccumulation) || 0,
      encashment: Boolean(encashment),
      date: date || '',
      holidayType: holidayType || 'national',
      applicableLocation: applicableLocation || 'All Locations',
      shiftType: shiftType || 'day',
      gracePeriod: Number(gracePeriod) || 15,
      startTime: startTime || '',
      endTime: endTime || '',
      breakDuration: Number(breakDuration) || 0,
      type_kind: type_kind || 'earning',
      shortName: (req.body.shortName || finalCode || '').trim(),
      componentType: req.body.componentType || (type_kind === 'deduction' ? (req.body.deductionType || 'Percent Based') : 'Paid Days'),
      deductionType: req.body.deductionType || '',
      excludeFromGrossSalary: Boolean(req.body.excludeFromGrossSalary),
      hideInCtcReports: Boolean(req.body.hideInCtcReports),
      notPayable: Boolean(req.body.notPayable),
      excludeHolidays: Boolean(req.body.excludeHolidays),
      excludeWeekoffs: Boolean(req.body.excludeWeekoffs),
      excludeFromCtc: Boolean(req.body.excludeFromCtc),
      paybackOnExit: Boolean(req.body.paybackOnExit),
      calculationType: calculationType || 'fixed',
      defaultValue: defaultValue || '',
      taxable: taxable || 'taxable',
      requiredType: requiredType || 'required',
      expiryRequired: Boolean(expiryRequired),
      verificationRequired: verificationRequired !== false,
      metadata: metadata || {}
    });

    const saved = await newMaster.save();

    // Two-way synchronization with Shift collection
    if (type === 'shifts') {
      try {
        const rawType = (shiftType || req.body.type || (name.toLowerCase().includes('night') ? 'night' : name.toLowerCase().includes('rotat') ? 'rotational' : 'day')).toLowerCase();
        const cleanType = ['day', 'night', 'rotational'].includes(rawType) ? rawType : 'day';
        const shiftCount = await Shift.countDocuments({ companyId, adminEmail });
        const shiftCode = code ? code.trim() : `SHF-${String(shiftCount + 1).padStart(3, '0')}`;

        await Shift.findOneAndUpdate(
          { companyId, adminEmail, name: name.trim() },
          {
            shiftId: shiftCode,
            companyId,
            adminEmail,
            name: name.trim(),
            type: cleanType,
            startTime: startTime || '',
            endTime: endTime || '',
            breakDuration: Number(breakDuration) || 30,
            gracePeriod: Number(gracePeriod) || 15,
            color: req.body.color || (cleanType === 'night' ? '#6366f1' : cleanType === 'rotational' ? '#f59e0b' : '#3b82f6'),
            description: description || '',
            status: (status || 'active').toLowerCase()
          },
          { upsert: true, new: true }
        );
      } catch (syncErr) {
        console.warn('Sync to Shift collection error:', syncErr.message);
      }
    }

    // Two-way synchronization with LeaveType collection
    if (type === 'leave-types') {
      try {
        const leaveCode = code ? code.trim().toUpperCase() : name.trim().slice(0, 3).toUpperCase();
        const isPaid = (paidType || 'paid').toLowerCase() === 'paid';
        await LeaveType.findOneAndUpdate(
          { companyId, code: leaveCode },
          {
            companyId,
            adminEmail,
            code: leaveCode,
            name: name.trim(),
            category: isPaid ? 'Paid' : 'Unpaid',
            quota: Number(annualQuota) || 12,
            accrual: 'Annual',
            carryForward: Boolean(carryForward),
            maxCarryForward: Number(maxAccumulation) || 0,
            description: description || '',
            status: (status || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive'
          },
          { upsert: true, new: true }
        );
      } catch (syncErr) {
        console.warn('Sync to LeaveType collection error:', syncErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `${name} created successfully.`,
      data: formatMaster(saved)
    });
  } catch (error) {
    console.error('Error creating master item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create master item.',
      error: error.message
    });
  }
};

/**
 * @desc    Update a master record in MongoDB
 * @route   PUT /api/masters/:id
 * @access  Private (Admin)
 */
export const updateMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to update a master record.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { id }
      ].filter(Boolean),
      companyId: { $in: companyIds }
    };

    const item = await Master.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Master item not found in this company.'
      });
    }

    const oldName = item.name;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;
    delete updates.companyId;

    if (updates.type === 'clients') {
      updates.type = 'client-services';
    }

    if (updates.type === 'earning' || updates.type === 'deduction' || item.type === 'salary-components') {
      if (updates.type === 'earning' || updates.type === 'deduction') {
        updates.type_kind = updates.type;
        delete updates.type;
      }
      if (updates.shortName && !updates.code) {
        updates.code = updates.shortName;
      }
      if (updates.code && !updates.shortName) {
        updates.shortName = updates.code;
      }
    }

    if (updates.branchList !== undefined) {
      updates.branchList = Array.isArray(updates.branchList)
        ? updates.branchList.map(b => String(b).trim()).filter(Boolean)
        : (typeof updates.branchList === 'string' && updates.branchList ? updates.branchList.split(',').map(b => b.trim()).filter(Boolean) : []);
      if (updates.branches === undefined) {
        updates.branches = updates.branchList.length;
      }
    }

    Object.assign(item, updates);
    const updated = await item.save();

    // Two-way synchronization with Shift collection
    if (item.type === 'shifts') {
      try {
        const rawType = (updates.shiftType || updates.type || (item.name.toLowerCase().includes('night') ? 'night' : item.name.toLowerCase().includes('rotat') ? 'rotational' : 'day')).toLowerCase();
        const cleanType = ['day', 'night', 'rotational'].includes(rawType) ? rawType : undefined;

        const shiftUpdates = {};
        if (updates.name) shiftUpdates.name = updates.name.trim();
        if (cleanType) shiftUpdates.type = cleanType;
        if (updates.startTime !== undefined) shiftUpdates.startTime = updates.startTime;
        if (updates.endTime !== undefined) shiftUpdates.endTime = updates.endTime;
        if (updates.gracePeriod !== undefined) shiftUpdates.gracePeriod = Number(updates.gracePeriod) || 15;
        if (updates.breakDuration !== undefined) shiftUpdates.breakDuration = Number(updates.breakDuration) || 30;
        if (updates.description !== undefined) shiftUpdates.description = updates.description;
        if (updates.status !== undefined) shiftUpdates.status = updates.status.toLowerCase();

        await Shift.findOneAndUpdate(
          {
            companyId: { $in: companyIds },
            $or: [{ name: oldName }, { name: item.name }, { shiftId: item.code }]
          },
          { $set: shiftUpdates }
        );
      } catch (syncErr) {
        console.warn('Sync shift update error:', syncErr.message);
      }
    }

    // Two-way synchronization with LeaveType collection
    if (item.type === 'leave-types') {
      try {
        const leaveUpdates = {};
        if (updates.name) leaveUpdates.name = updates.name.trim();
        if (updates.code) leaveUpdates.code = updates.code.trim().toUpperCase();
        if (updates.paidType) leaveUpdates.category = updates.paidType.toLowerCase() === 'paid' ? 'Paid' : 'Unpaid';
        if (updates.annualQuota !== undefined) leaveUpdates.quota = Number(updates.annualQuota) || 12;
        if (updates.carryForward !== undefined) leaveUpdates.carryForward = Boolean(updates.carryForward);
        if (updates.maxAccumulation !== undefined) leaveUpdates.maxCarryForward = Number(updates.maxAccumulation) || 0;
        if (updates.description !== undefined) leaveUpdates.description = updates.description;
        if (updates.status !== undefined) leaveUpdates.status = updates.status.toLowerCase() === 'active' ? 'Active' : 'Inactive';

        await LeaveType.findOneAndUpdate(
          {
            companyId: { $in: companyIds },
            $or: [{ name: oldName }, { name: item.name }, { code: item.code }]
          },
          { $set: leaveUpdates }
        );
      } catch (syncErr) {
        console.warn('Sync leave type update error:', syncErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${updated.name} updated successfully.`,
      data: formatMaster(updated)
    });
  } catch (error) {
    console.error('Error updating master item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update master item.',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle active / inactive status of a master record in MongoDB
 * @route   PATCH /api/masters/:id/status
 * @access  Private (Admin)
 */
export const toggleMasterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to change status.'
      });
    }

    const { status } = req.body;
    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { id }
      ].filter(Boolean),
      companyId: { $in: companyIds }
    };

    const item = await Master.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Master item not found in this company.'
      });
    }

    item.status = status || (item.status?.toLowerCase() === 'active' ? 'inactive' : 'active');
    const updated = await item.save();

    // Two-way synchronization with Shift collection
    if (item.type === 'shifts') {
      try {
        await Shift.findOneAndUpdate(
          {
            companyId: { $in: companyIds },
            $or: [{ name: item.name }, { shiftId: item.code }]
          },
          { $set: { status: item.status.toLowerCase() } }
        );
      } catch (syncErr) {}
    }

    // Two-way synchronization with LeaveType collection
    if (item.type === 'leave-types') {
      try {
        const mappedStatus = item.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive';
        await LeaveType.findOneAndUpdate(
          {
            companyId: { $in: companyIds },
            $or: [{ name: item.name }, { code: item.code }]
          },
          { $set: { status: mappedStatus } }
        );
      } catch (syncErr) {}
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${item.status}.`,
      data: formatMaster(updated)
    });
  } catch (error) {
    console.error('Error toggling master status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change status.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a master record from MongoDB
 * @route   DELETE /api/masters/:id
 * @access  Private (Admin)
 */
export const deleteMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to delete a master record.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { id }
      ].filter(Boolean),
      companyId: { $in: companyIds }
    };

    const item = await Master.findOneAndDelete(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Master item not found in this company.'
      });
    }

    // Two-way synchronization with Shift collection
    if (item.type === 'shifts') {
      try {
        await Shift.findOneAndDelete({
          companyId: { $in: companyIds },
          $or: [{ name: item.name }, { shiftId: item.code }]
        });
      } catch (syncErr) {}
    }

    // Two-way synchronization with LeaveType collection
    if (item.type === 'leave-types') {
      try {
        await LeaveType.findOneAndDelete({
          companyId: { $in: companyIds },
          $or: [{ name: item.name }, { code: item.code }]
        });
      } catch (syncErr) {}
    }

    return res.status(200).json({
      success: true,
      message: `${item.name} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting master item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete master item.',
      error: error.message
    });
  }
};
