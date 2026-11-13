import mongoose from 'mongoose';
import Separation from '../models/separationModel.js';
import Employee from '../models/employeeModel.js';
import Company from '../models/companyModel.js';
import Notification from '../models/notificationModel.js';

/**
 * Helper to resolve company ID strictly
 */
const resolveCompanyId = async (req) => {
  const headerId = req.headers['x-company-id'] || req.query.companyId || req.body?.companyId;
  if (headerId) {
    const isObjectId = mongoose.isValidObjectId(headerId);
    const comp = await Company.findOne({
      $or: [
        { companyId: headerId },
        ...(isObjectId ? [{ _id: headerId }] : [])
      ]
    }).select('companyId _id name').lean();
    if (comp) return comp.companyId || String(comp._id);
    return headerId;
  }

  if (req.user?.companyId) return req.user.companyId;

  // Fallback to active default company
  const defaultComp = await Company.findOne({ status: 'Active' }).sort({ isDefault: -1, createdAt: 1 }).lean();
  return defaultComp?.companyId || 'RRS8392014SEC';
};

/**
 * @desc    Get all separation / FnF records for active company
 * @route   GET /api/separation
 * @access  Private
 */
export const getSeparations = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { status, from, to, reason, search } = req.query;

    const query = { companyId };

    // Status filter
    if (status) {
      if (status === 'pending') {
        query.settlementStatus = { $nin: ['Settled / Disbursed', 'Cancelled'] };
      } else if (status === 'finalized') {
        query.settlementStatus = 'Settled / Disbursed';
      } else if (status !== 'All') {
        query.settlementStatus = status;
      }
    }

    // Reason filter
    if (reason && reason !== 'All') {
      query.separationReason = reason;
    }

    // Date range filter
    if (from || to) {
      const dateFilter = {};
      if (from) dateFilter.$gte = from;
      if (to) dateFilter.$lte = to;
      query.lastWorkingDay = dateFilter;
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { employeeName: regex },
        { employeeCode: regex },
        { settlementId: regex },
        { designation: regex },
        { client: regex }
      ];
    }

    const records = await Separation.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      companyId,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('[SeparationController] Error in getSeparations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch separation records'
    });
  }
};

/**
 * @desc    Get separation analytics & exit trends for active company
 * @route   GET /api/separation/analytics
 * @access  Private
 */
export const getSeparationAnalytics = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { from, to } = req.query;

    const fromDateStr = from || '2026-08-03';
    const toDateStr = to || '2026-11-11';
    const fromDate = new Date(`${fromDateStr}T00:00:00`);
    const toDate = new Date(`${toDateStr}T23:59:59`);

    const records = await Separation.find({
      companyId,
      settlementStatus: { $ne: 'Cancelled' }
    }).lean();

    const inRangeRecords = records.filter((r) => {
      const exitDate = r.lastWorkingDay || r.resignationDate || (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '');
      if (!exitDate) return false;
      const d = new Date(exitDate.length === 10 ? `${exitDate}T12:00:00` : exitDate);
      return d >= fromDate && d <= toDate;
    });

    const totalExits = inRangeRecords.length;

    // Average Tenure
    const totalTenureYears = inRangeRecords.reduce((sum, r) => sum + (Number(r.tenureYears) || 0), 0);
    const avgTenure = totalExits > 0 ? (totalTenureYears / totalExits).toFixed(1) : 0;
    const avgTenurePct = Math.min(100, Math.round(((Number(avgTenure) || 0) / 10) * 100));

    // Pre-Confirmation (Tenure < 6 months / 0.5 years)
    const preConfirmationCount = inRangeRecords.filter((r) => (Number(r.tenureYears) || 0) < 0.5).length;
    const preConfirmationPct = totalExits > 0 ? Math.round((preConfirmationCount / totalExits) * 100) : 0;

    // Retention Attempts
    const retainedCount = inRangeRecords.filter((r) => r.isRetained === true).length;
    const exitedCount = totalExits - retainedCount;
    const retentionAttemptsPct = totalExits > 0 ? Math.round((retainedCount / totalExits) * 100) : 0;

    // Tenure Breakdown Buckets
    const tenureBuckets = {
      below6Months: inRangeRecords.filter((r) => (Number(r.tenureYears) || 0) < 0.5).length,
      months6To24: inRangeRecords.filter((r) => {
        const t = Number(r.tenureYears) || 0;
        return t >= 0.5 && t < 2;
      }).length,
      years2To5: inRangeRecords.filter((r) => {
        const t = Number(r.tenureYears) || 0;
        return t >= 2 && t < 5;
      }).length,
      above5Years: inRangeRecords.filter((r) => (Number(r.tenureYears) || 0) >= 5).length
    };

    // Top Exit Reasons
    const reasonMap = {};
    inRangeRecords.forEach((r) => {
      const reason = r.separationReason || r.exitType || 'Personal Reasons';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });

    const topExitReasons = Object.entries(reasonMap)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalExits > 0 ? Math.round((count / totalExits) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Generate Date-wise Timeline intervals
    const dateWisePoints = [];
    const startMs = fromDate.getTime();
    const endMs = toDate.getTime();
    const totalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
    const stepDays = Math.max(1, Math.ceil(totalDays / 25));

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + stepDays)) {
      const dStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(' ', '-');
      
      const windowEnd = new Date(d);
      windowEnd.setDate(windowEnd.getDate() + stepDays);

      const count = inRangeRecords.filter((r) => {
        const ed = r.lastWorkingDay || r.resignationDate;
        if (!ed) return false;
        const recDate = new Date(`${ed.slice(0, 10)}T12:00:00`);
        return recDate >= d && recDate < windowEnd;
      }).length;

      dateWisePoints.push({
        dateStr: dStr,
        label,
        count
      });
    }

    return res.status(200).json({
      success: true,
      companyId,
      analytics: {
        totalExits,
        avgTenure,
        avgTenurePct,
        preConfirmationCount,
        preConfirmationPct,
        retentionAttemptsPct,
        retainedCount,
        exitedCount,
        tenureBuckets,
        topExitReasons,
        dateWisePoints
      }
    });
  } catch (error) {
    console.error('[SeparationController] Error in getSeparationAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate separation analytics'
    });
  }
};

/**
 * @desc    Initiate new employee separation
 * @route   POST /api/separation
 * @access  Private
 */
export const createSeparation = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const {
      employeeId,
      employeeCode,
      employeeName,
      exitType = 'Resignation',
      resignationDate,
      lastWorkingDay,
      separationReason,
      noticePeriodRequiredDays = 30,
      tryingToRetain = false,
      remarks = ''
    } = req.body;

    if (!employeeId || !resignationDate || !lastWorkingDay || !separationReason) {
      return res.status(400).json({
        success: false,
        message: 'Employee, resignation date, last working day, and reason for separation are required.'
      });
    }

    // Look up employee to extract joiningDate, salary, and site location
    const emp = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null },
        { employeeId: employeeId },
        { employeeCode: employeeCode || employeeId }
      ]
    });

    const empJoiningDate = emp?.joiningDate || req.body.dateOfJoining || '';
    let tenureYears = 1.0;
    if (empJoiningDate) {
      try {
        const d1 = new Date(empJoiningDate);
        const d2 = new Date(lastWorkingDay);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          tenureYears = Math.max(0.1, Number(((d2 - d1) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));
        }
      } catch (_) { }
    }

    // Calculate served notice days
    let noticeServedDays = 0;
    try {
      const rd = new Date(resignationDate);
      const ld = new Date(lastWorkingDay);
      if (!isNaN(rd.getTime()) && !isNaN(ld.getTime())) {
        noticeServedDays = Math.max(0, Math.round((ld - rd) / (1000 * 60 * 60 * 24)));
      }
    } catch (_) { }

    const noticeShortfallDays = Math.max(0, noticePeriodRequiredDays - noticeServedDays);

    // Generate unique sequential settlement ID
    const count = await Separation.countDocuments({ companyId });
    const year = new Date().getFullYear();
    const settlementId = `SEP-${year}-${String(count + 1).padStart(3, '0')}`;

    const grossSalary = emp?.grossSalary || Number(req.body.monthlyGrossSalary) || 25000;
    const basicSalary = emp?.basic || Number(req.body.basicSalary) || Math.round(grossSalary * 0.5);
    const perDayWage = Number((grossSalary / 26).toFixed(2));

    const newSeparation = new Separation({
      companyId,
      settlementId,
      employeeId: emp?.employeeId || emp?._id || employeeId,
      employeeCode: emp?.employeeCode || employeeCode || 'EMP',
      employeeName: emp?.name || employeeName,
      avatar: emp?.profilePhoto || null,
      designation: emp?.designation || req.body.designation || 'Staff Member',
      department: emp?.department || req.body.department || 'Security',
      client: emp?.clientName || emp?.companyName || req.body.client || 'Corporate Client',
      site: emp?.siteLocation || emp?.site || req.body.site || 'Main Site',
      dateOfJoining: empJoiningDate,
      exitType,
      resignationDate,
      lastWorkingDay,
      separationReason,
      noticePeriodRequiredDays,
      noticePeriodServedDays: noticeServedDays,
      noticeShortfallDays,
      monthlyGrossSalary: grossSalary,
      basicSalary,
      perDayWage,
      tenureYears,
      tryingToRetain,
      remarks,
      settlementStatus: 'Pending Clearance',
      createdBy: req.user?.email || 'admin',
      clearances: req.body.clearances || {
        hr: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Awaiting clearance checklist' },
        operations: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Awaiting site handover' },
        accounts: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Pending ledger verification' },
        admin: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Locker & biometric access' },
        inventory: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Kit inspection pending' },
        client: { status: 'Pending', clearedBy: 'Pending Assignment', clearedDate: '—', remarks: 'Client sign-off pending' }
      },
      approvalWorkflow: req.body.approvalWorkflow || {
        currentStage: 'hr_review',
        isFullyApproved: false,
        stages: {
          hr_review: { status: 'Pending', approver: 'HR Manager', date: '—' },
          ops_review: { status: 'Pending', approver: 'Operations Head', date: '—' },
          accounts_review: { status: 'Pending', approver: 'Accounts Head', date: '—' },
          final_approval: { status: 'Pending', approver: 'Managing Director', date: '—' }
        }
      }
    });

    await newSeparation.save();

    // Update Employee record status
    if (emp) {
      emp.employeeStatus = 'In Separation';
      emp.exitDate = lastWorkingDay;
      emp.exitReason = separationReason;
      await emp.save();
    }

    // Create system notification for HR & Management
    try {
      await Notification.create({
        companyId,
        adminEmail: req.user?.email || '',
        recipientRole: 'admin',
        recipientId: 'admin',
        type: 'general',
        title: `Separation Initiated: ${newSeparation.employeeName}`,
        message: `${newSeparation.employeeName} (${newSeparation.employeeCode}) has initiated exit (${separationReason}). Last working day: ${lastWorkingDay}. Clearance checklist is now active.`,
        employeeId: String(newSeparation.employeeId),
        employeeName: newSeparation.employeeName,
        targetModule: 'payroll',
        targetUrl: '/admin/payroll?tab=fnf',
        priority: 'important'
      });
    } catch (_) { }

    return res.status(201).json({
      success: true,
      message: `Separation record ${settlementId} initiated successfully for ${newSeparation.employeeName}.`,
      data: newSeparation
    });
  } catch (error) {
    console.error('[SeparationController] Error creating separation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate separation'
    });
  }
};

/**
 * @desc    Update separation record (Clearances, Approvals, Dues, Retention)
 * @route   PUT /api/separation/:id
 * @access  Private
 */
export const updateSeparation = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { id } = req.params;

    const separation = await Separation.findOne({
      _id: id,
      companyId
    });

    if (!separation) {
      return res.status(404).json({
        success: false,
        message: 'Separation record not found for this company'
      });
    }

    // Merge updates
    const allowedFields = [
      'clearances',
      'attendance',
      'salaryDues',
      'deductions',
      'statutoryBenefits',
      'finalSettlement',
      'approvalWorkflow',
      'payment',
      'documents',
      'settlementStatus',
      'remarks',
      'tryingToRetain',
      'isRetained',
      'retentionRemarks',
      'lastWorkingDay',
      'resignationDate',
      'separationReason',
      'exitType'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        separation[field] = req.body[field];
      }
    });

    await separation.save();

    return res.status(200).json({
      success: true,
      message: 'Separation record updated successfully.',
      data: separation
    });
  } catch (error) {
    console.error('[SeparationController] Error updating separation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update separation record'
    });
  }
};

/**
 * @desc    Finalize employee separation & execute complete exit
 * @route   POST /api/separation/:id/finalize
 * @access  Private
 */
export const finalizeSeparation = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { id } = req.params;

    const separation = await Separation.findOne({
      _id: id,
      companyId
    });

    if (!separation) {
      return res.status(404).json({
        success: false,
        message: 'Separation record not found'
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // Update Separation record
    separation.settlementStatus = 'Settled / Disbursed';
    if (!separation.payment) separation.payment = {};
    separation.payment.status = 'Disbursed';
    separation.payment.paymentDate = req.body.paymentDate || todayStr;
    if (req.body.utrNo) separation.payment.utrNo = req.body.utrNo;
    if (req.body.mode) separation.payment.mode = req.body.mode;

    if (separation.approvalWorkflow) {
      separation.approvalWorkflow.isFullyApproved = true;
      separation.approvalWorkflow.currentStage = 'completed';
    }

    await separation.save();

    // Update Employee record in database: EXITED / INACTIVE
    const emp = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(separation.employeeId) ? separation.employeeId : null },
        { employeeId: separation.employeeId },
        { employeeCode: separation.employeeCode }
      ]
    });

    if (emp) {
      emp.status = 'Inactive';
      emp.employeeStatus = 'Separated';
      emp.exitDate = separation.lastWorkingDay || todayStr;
      emp.exitReason = separation.separationReason;
      emp.exitDateReason = `${separation.exitType}: ${separation.separationReason}`;
      await emp.save();
    }

    // System notification
    try {
      await Notification.create({
        companyId,
        recipientRole: 'admin',
        recipientId: 'admin',
        type: 'general',
        title: `Exit Finalized: ${separation.employeeName}`,
        message: `Employee ${separation.employeeName} (${separation.employeeCode}) has been officially separated. Settlement ${separation.settlementId} marked settled & disbursed.`,
        employeeId: String(separation.employeeId),
        employeeName: separation.employeeName,
        targetModule: 'payroll',
        targetUrl: '/admin/payroll/finalized-exits',
        priority: 'normal'
      });
    } catch (_) { }

    return res.status(200).json({
      success: true,
      message: `Employee ${separation.employeeName} successfully separated and settlement finalized.`,
      data: separation
    });
  } catch (error) {
    console.error('[SeparationController] Error finalizing separation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to finalize separation'
    });
  }
};

/**
 * @desc    Rehire / Reactivate separated employee
 * @route   POST /api/separation/:id/rehire
 * @access  Private
 */
export const rehireSeparatedEmployee = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { id } = req.params;
    const { rehireDate } = req.body;

    const separation = await Separation.findOne({ _id: id, companyId });
    if (!separation) {
      return res.status(404).json({ success: false, message: 'Separation record not found' });
    }

    separation.isRehired = true;
    separation.rehireDate = rehireDate || new Date().toISOString().slice(0, 10);
    await separation.save();

    // Re-activate Employee record
    const emp = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(separation.employeeId) ? separation.employeeId : null },
        { employeeId: separation.employeeId },
        { employeeCode: separation.employeeCode }
      ]
    });

    if (emp) {
      emp.status = 'Active';
      emp.employeeStatus = 'Active';
      emp.exitDate = '';
      emp.exitReason = '';
      emp.joiningDate = rehireDate || emp.joiningDate;
      await emp.save();
    }

    return res.status(200).json({
      success: true,
      message: `Employee ${separation.employeeName} rehired and reactivated successfully.`,
      data: separation
    });
  } catch (error) {
    console.error('[SeparationController] Error rehiring employee:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to rehire employee'
    });
  }
};

/**
 * @desc    Cancel separation request
 * @route   DELETE /api/separation/:id
 * @access  Private
 */
export const cancelSeparation = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { id } = req.params;

    const separation = await Separation.findOne({ _id: id, companyId });
    if (!separation) {
      return res.status(404).json({ success: false, message: 'Separation record not found' });
    }

    // Revert employee status if still In Separation
    const emp = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(separation.employeeId) ? separation.employeeId : null },
        { employeeId: separation.employeeId },
        { employeeCode: separation.employeeCode }
      ]
    });

    if (emp && emp.employeeStatus === 'In Separation') {
      emp.status = 'Active';
      emp.employeeStatus = 'Active';
      emp.exitDate = '';
      emp.exitReason = '';
      await emp.save();
    }

    await Separation.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: `Separation request ${separation.settlementId} cancelled successfully.`
    });
  } catch (error) {
    console.error('[SeparationController] Error cancelling separation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel separation'
    });
  }
};

