import Attendance from '../models/attendanceModel.js';
import AttendanceCorrection from '../models/attendanceCorrectionModel.js';
import Employee from '../models/employeeModel.js';

/**
 * @desc    Get attendance records (filtered by date, client, site, dept, status)
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendanceRecords = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';
    const { date, month, clientName, site, department, status, search } = req.query;

    const query = {
      $or: [{ adminEmail }, { isDefault: true }],
      companyId,
    };

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: new RegExp(`^${month}`) };
    }

    if (clientName) {
      query.$or = [
        { clientName: { $regex: new RegExp(clientName, 'i') } },
        { companyName: { $regex: new RegExp(clientName, 'i') } },
      ];
    }

    if (site) {
      query.site = { $regex: new RegExp(site, 'i') };
    }

    if (department) {
      query.department = { $regex: new RegExp(department, 'i') };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { employeeName: { $regex: new RegExp(search, 'i') } },
        { employeeId: { $regex: new RegExp(search, 'i') } },
      ];
    }

    let records = await Attendance.find(query).sort({ date: -1, employeeId: 1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(r => r.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records.',
      error: error.message,
    });
  }
};

/**
 * @desc    Import/bulk upsert attendance records from Excel or CSV
 * @route   POST /api/attendance/bulk-import
 * @access  Private (Admin)
 */
export const bulkImportAttendance = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const { records, defaultDate } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendance records provided to import.',
      });
    }

    const savedRecords = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const recordDate = rec.date || defaultDate || new Date().toISOString().split('T')[0];
      const empId = (rec.employeeId || `EMP${String(i + 1).padStart(3, '0')}`).trim();
      const empName = (rec.employeeName || 'Employee').trim();
      const client = (rec.clientName || rec.companyName || '').trim();
      const site = (rec.site || 'Main Site').trim();
      const department = (rec.department || 'Security').trim();

      const initials =
        rec.initials ||
        empName
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() ||
        'EM';

      // Upsert by companyId, employeeId, and date
      const updated = await Attendance.findOneAndUpdate(
        {
          companyId,
          employeeId: empId,
          date: recordDate,
        },
        {
          $set: {
            employeeName: empName,
            initials,
            clientName: client,
            companyName: client,
            site,
            department,
            checkIn: rec.checkIn || null,
            checkOut: rec.checkOut || null,
            workingHours: rec.workingHours || null,
            status: rec.status || 'present',
            lateMinutes: rec.lateMinutes || (rec.status === 'late' ? 15 : 0),
            earlyOutMinutes: rec.earlyOutMinutes || 0,
            adminEmail,
            companyId,
          },
        },
        { upsert: true, new: true }
      );

      savedRecords.push(updated.toJSON());
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${savedRecords.length} attendance records into database!`,
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    console.error('Error importing attendance bulk:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import attendance records.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save/update single attendance record
 * @route   POST /api/attendance
 * @access  Private (Admin)
 */
export const saveAttendanceRecord = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const {
      employeeId,
      employeeName,
      clientName,
      companyName,
      site,
      department,
      date,
      checkIn,
      checkOut,
      workingHours,
      status,
      lateMinutes,
      earlyOutMinutes,
    } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Date are required.',
      });
    }

    const initials =
      (employeeName || 'EM')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const record = await Attendance.findOneAndUpdate(
      { companyId, employeeId, date },
      {
        $set: {
          employeeName: employeeName || 'Employee',
          initials,
          clientName: clientName || companyName || '',
          companyName: clientName || companyName || '',
          site: site || 'Main Site',
          department: department || 'Security',
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          workingHours: workingHours || null,
          status: status || 'present',
          lateMinutes: lateMinutes || 0,
          earlyOutMinutes: earlyOutMinutes || 0,
          adminEmail,
          companyId,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance record saved successfully.',
      record: record.toJSON(),
    });
  } catch (error) {
    console.error('Error saving attendance record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save attendance record.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all correction requests
 * @route   GET /api/attendance/corrections
 * @access  Private
 */
export const getCorrectionRequests = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';

    const corrections = await AttendanceCorrection.find({
      $or: [{ adminEmail }, { isDefault: true }],
      companyId,
      status: 'pendingCorrection',
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: corrections.length,
      corrections: corrections.map(c => c.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching correction requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve correction requests.',
    });
  }
};

/**
 * @desc    Submit a new correction request
 * @route   POST /api/attendance/corrections
 * @access  Private
 */
export const submitCorrectionRequest = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const {
      attendanceId,
      employeeId,
      employeeName,
      clientName,
      companyName,
      site,
      date,
      originalCheckIn,
      originalCheckOut,
      originalStatus,
      requestedCheckIn,
      requestedCheckOut,
      reason,
    } = req.body;

    const initials =
      (employeeName || 'EM')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const correction = await AttendanceCorrection.create({
      correctionId: `CORR${String(Date.now()).slice(-4)}`,
      attendanceId,
      employeeId,
      employeeName,
      initials,
      clientName: clientName || companyName || '',
      companyName: clientName || companyName || '',
      site: site || 'Main Site',
      date,
      originalCheckIn,
      originalCheckOut,
      originalStatus: originalStatus || 'present',
      requestedCheckIn,
      requestedCheckOut,
      reason,
      submittedBy: req.user.name || 'Admin',
      status: 'pendingCorrection',
      companyId,
      adminEmail,
    });

    // Mark attendance record as pendingCorrection
    if (attendanceId) {
      await Attendance.findByIdAndUpdate(attendanceId, { status: 'pendingCorrection' });
    }

    return res.status(201).json({
      success: true,
      message: 'Correction request submitted for review.',
      correction: correction.toJSON(),
    });
  } catch (error) {
    console.error('Error submitting correction request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit correction request.',
      error: error.message,
    });
  }
};

/**
 * @desc    Review (Approve/Reject) correction request
 * @route   PUT /api/attendance/corrections/:id
 * @access  Private (Admin)
 */
export const reviewCorrectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectReason } = req.body; // 'approve' or 'reject'

    const correction = await AttendanceCorrection.findById(id);
    if (!correction) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found.',
      });
    }

    if (action === 'approve') {
      correction.status = 'approved';
      await correction.save();

      // Calculate approximate working hours if in & out provided
      let workingHours = null;
      if (correction.requestedCheckIn && correction.requestedCheckOut) {
        try {
          const [inH, inM] = correction.requestedCheckIn.split(':').map(Number);
          const [outH, outM] = correction.requestedCheckOut.split(':').map(Number);
          const totalMins = outH * 60 + outM - (inH * 60 + inM);
          if (totalMins > 0) {
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            workingHours = `${h}h ${String(m).padStart(2, '0')}m`;
          }
        } catch {
          // ignore
        }
      }

      await Attendance.findOneAndUpdate(
        {
          companyId: correction.companyId,
          employeeId: correction.employeeId,
          date: correction.date,
        },
        {
          $set: {
            checkIn: correction.requestedCheckIn,
            checkOut: correction.requestedCheckOut,
            workingHours,
            status: 'present',
            lateMinutes: 0,
            earlyOutMinutes: 0,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `Correction request approved for ${correction.employeeName}. Attendance updated.`,
      });
    } else {
      correction.status = 'rejected';
      await correction.save();

      // Revert attendance status
      await Attendance.findOneAndUpdate(
        {
          companyId: correction.companyId,
          employeeId: correction.employeeId,
          date: correction.date,
        },
        {
          $set: {
            status: correction.originalStatus || 'present',
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `Correction request rejected for ${correction.employeeName}.`,
      });
    }
  } catch (error) {
    console.error('Error reviewing correction request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review correction request.',
      error: error.message,
    });
  }
};
