import Attendance from '../models/attendanceModel.js';
import AttendanceCorrection from '../models/attendanceCorrectionModel.js';
import Employee from '../models/employeeModel.js';



const escapeRegex = (s) => String(s || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * @desc    Get attendance records (filtered by date, client, site, dept, status) directly from MongoDB
 * @route   GET /api/attendance
 * @access  Private (Admin & Employee)
 */
export const getAttendanceRecords = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId;
    const {
      date,
      month,
      year,
      fromDate,
      toDate,
      clientName,
      companyName,
      site,
      department,
      status,
      search,
      employeeId,
    } = req.query;

    const query = {};
    if (companyId) {
      query.companyId = companyId;
    }

    // Strict Role-based security & isolation:
    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      const empName = user.name;

      const userConditions = [];
      if (empId) {
        userConditions.push({ employeeId: { $regex: new RegExp(`^${escapeRegex(empId)}$`, 'i') } });
      }
      if (empName) {
        userConditions.push({ employeeName: { $regex: new RegExp(`^${escapeRegex(empName)}$`, 'i') } });
      }
      if (user._id) {
        userConditions.push({ employeeId: user._id.toString() });
      }

      if (userConditions.length > 0) {
        query.$or = userConditions;
      }
    } else {
      // Admin / Manager query filtering
      if (employeeId) {
        query.employeeId = { $regex: new RegExp(`^${escapeRegex(employeeId)}$`, 'i') };
      }

      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i');
        query.$or = [
          { employeeName: { $regex: searchRegex } },
          { employeeId: { $regex: searchRegex } },
          { clientName: { $regex: searchRegex } },
          { site: { $regex: searchRegex } },
          { department: { $regex: searchRegex } },
        ];
      }
    }

    // Date / Month / Year / Range Filtering
    if (date) {
      query.date = date;
    } else if (fromDate && toDate) {
      query.date = { $gte: fromDate, $lte: toDate };
    } else if (month) {
      query.date = { $regex: new RegExp(`^${escapeRegex(month)}`) };
    } else if (year) {
      query.date = { $regex: new RegExp(`^${escapeRegex(year)}`) };
    }

    const clientFilter = clientName || companyName;
    if (clientFilter && clientFilter !== 'All Clients' && clientFilter !== 'all') {
      const clientRegex = new RegExp(escapeRegex(clientFilter), 'i');
      if (query.$or && user?.role !== 'employee') {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { clientName: { $regex: clientRegex } },
            { companyName: { $regex: clientRegex } },
          ],
        });
      } else {
        query.$or = [
          { clientName: { $regex: clientRegex } },
          { companyName: { $regex: clientRegex } },
        ];
      }
    }

    if (site && site !== 'All Sites' && site !== 'all') {
      query.site = { $regex: new RegExp(escapeRegex(site), 'i') };
    }

    if (department && department !== 'All Departments' && department !== 'all') {
      query.department = { $regex: new RegExp(escapeRegex(department), 'i') };
    }

    if (status && status !== 'All' && status !== 'All Statuses' && status !== 'all') {
      query.status = status.toLowerCase();
    }

    let records = await Attendance.find(query).sort({ date: -1, employeeId: 1 });

    // Fallback for employee if companyId was strictly filtered but records exist without matching companyId
    if (user?.role === 'employee' && records.length === 0 && companyId) {
      const fallbackQuery = { ...query };
      delete fallbackQuery.companyId;
      records = await Attendance.find(fallbackQuery).sort({ date: -1, employeeId: 1 });
    }

    // Auto-seed for queried date if database has employees and zero records for that specific date
    if (
      records.length === 0 &&
      date &&
      !search &&
      !clientFilter &&
      !site &&
      !department &&
      (!status || status === 'All' || status === 'All Statuses') &&
      (!user || user.role !== 'employee')
    ) {
      const employees = await Employee.find(companyId ? { companyId } : {}).limit(50).lean();
      if (employees.length > 0) {
        const seeded = [];
        for (let i = 0; i < employees.length; i++) {
          const emp = employees[i];
          const rawEmpId = emp.employeeId || emp.employeeCode || `EMP${String(i + 1).padStart(3, '0')}`;
          const rawEmpName = emp.name || emp.employeeName || `Security Guard ${i + 1}`;
          const rawFatherName = emp.fatherName || emp.fatherHusbandName || '';
          const client = emp.clientName || emp.companyName || 'RR Security & Facilities';
          const siteName = emp.siteLocation || emp.site || 'Main Gate';
          const dept = emp.department || 'Security';

          const stat =
            i % 14 === 0
              ? 'absent'
              : i % 9 === 0
              ? 'leave'
              : i % 6 === 0
              ? 'late'
              : i % 18 === 0
              ? 'half_day'
              : 'present';

          const checkInTime = stat === 'present' ? '08:00 AM' : stat === 'late' ? '08:45 AM' : stat === 'half_day' ? '01:00 PM' : null;
          const checkOutTime = (stat === 'present' || stat === 'late' || stat === 'half_day') ? '08:00 PM' : null;
          const hrs = stat === 'present' ? '12h 00m' : stat === 'late' ? '11h 15m' : stat === 'half_day' ? '7h 00m' : null;

          const newAtt = new Attendance({
            companyId: companyId || emp.companyId || 'RRS8392014SEC',
            adminEmail: user?.email || 'admin@rrsecurity.com',
            employeeId: rawEmpId,
            employeeName: rawEmpName,
            fatherName: rawFatherName,
            initials: rawEmpName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase() || 'EM',
            clientName: client,
            companyName: client,
            site: siteName,
            department: dept,
            date,
            month: date.slice(0, 7),
            year: Number(date.slice(0, 4)),
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workingHours: hrs,
            status: stat,
            lateMinutes: stat === 'late' ? 45 : 0,
            earlyOutMinutes: 0,
            present: stat === 'present' || stat === 'late' ? 1 : stat === 'half_day' ? 0.5 : 0,
            workingDays: 1,
            totalPaidDays: stat === 'present' || stat === 'late' ? 1 : stat === 'half_day' ? 0.5 : 0,
          });

          await newAtt.save();
          seeded.push(newAtt.toJSON());
        }
        records = seeded;
      }
    }

    // Calculate dynamic summary metrics
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const halfDayCount = records.filter((r) => r.status === 'half_day' || r.status === 'half-day').length;
    const leaveCount = records.filter((r) => r.status === 'leave' || r.status === 'on_leave' || r.status === 'on-leave').length;
    const lateCount = records.filter((r) => r.status === 'late' || Number(r.lateMinutes || 0) > 0).length;

    const summary = {
      total,
      presentCount,
      absentCount,
      halfDayCount,
      leaveCount,
      lateCount,
      presentPct: total > 0 ? Math.round((presentCount / total) * 100) : 0,
      absentPct: total > 0 ? Math.round((absentCount / total) * 100) : 0,
      halfDayPct: total > 0 ? Math.round((halfDayCount / total) * 100) : 0,
      leavePct: total > 0 ? Math.round((leaveCount / total) * 100) : 0,
      latePct: total > 0 ? Math.round((lateCount / total) * 100) : 0,
    };

    return res.status(200).json({
      success: true,
      count: records.length,
      summary,
      records: records.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r)),
    });
  } catch (error) {
    console.error('Error fetching attendance from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records from database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Import/bulk upsert attendance records into MongoDB Atlas
 * @route   POST /api/attendance/bulk-import
 * @access  Private (Admin)
 */
export const bulkImportAttendance = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user.companyId || 'RRS8392014SEC';
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
      const rawEmpId = (rec.employeeId || `EMP${String(i + 1).padStart(3, '0')}`).trim();
      const rawEmpName = (rec.employeeName || 'Employee').trim();
      const rawFatherName = (rec.fatherName || '').trim();

      // Look up corresponding employee in system to align employeeId, employeeName and fatherName
      const matchedEmp = await Employee.findOne({
        $or: [
          { employeeId: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } },
          { employeeCode: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } },
          { name: { $regex: new RegExp(`^${escapeRegex(rawEmpName)}$`, 'i') } },
        ],
      });

      const empId = matchedEmp?.employeeId || rawEmpId;
      const empName = matchedEmp?.name || rawEmpName;
      const fatherName = rawFatherName || matchedEmp?.fatherName || '';
      const targetCompanyId = matchedEmp?.companyId || companyId;
      const client = (rec.clientName || rec.companyName || matchedEmp?.clientName || 'RR Security').trim();
      const site = (rec.site || matchedEmp?.site || 'Main Site').trim();
      const department = (rec.department || matchedEmp?.department || 'Security').trim();

      const initials =
        rec.initials ||
        empName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() ||
        'EM';

      // Parse monthly attendance numbers if provided
      const present = rec.present !== undefined ? Number(rec.present) : (rec.status === 'present' ? 1 : 0);
      const weekOff = rec.weekOff !== undefined ? Number(rec.weekOff) : 0;
      const holidays = rec.holidays !== undefined ? Number(rec.holidays) : 0;
      const cl = rec.cl !== undefined ? Number(rec.cl) : 0;
      const sl = rec.sl !== undefined ? Number(rec.sl) : 0;
      const el = rec.el !== undefined ? Number(rec.el) : 0;
      const lwp = rec.lwp !== undefined ? Number(rec.lwp) : 0;
      const totalPaidDays = rec.totalPaidDays !== undefined ? Number(rec.totalPaidDays) : (present + weekOff + holidays + cl + sl + el);
      const workingDays = rec.workingDays !== undefined ? Number(rec.workingDays) : totalPaidDays;

      const month = String(rec.month || '').trim();
      const year = rec.year ? Number(rec.year) : (recordDate ? Number(recordDate.split('-')[0]) : new Date().getFullYear());

      // Upsert directly into MongoDB by companyId, employeeId, and date
      const updated = await Attendance.findOneAndUpdate(
        {
          companyId: targetCompanyId,
          employeeId: empId,
          date: recordDate,
        },
        {
          $set: {
            employeeName: empName,
            fatherName,
            initials,
            clientName: client,
            companyName: client,
            site,
            department,
            date: recordDate,
            month,
            year,
            present,
            weekOff,
            holidays,
            cl,
            sl,
            el,
            lwp,
            totalPaidDays,
            workingDays,
            checkIn: rec.checkIn || null,
            checkOut: rec.checkOut || null,
            workingHours: rec.workingHours || (present > 0 ? `${present} days` : null),
            status: rec.status || (present > 0 ? 'present' : 'present'),
            lateMinutes: rec.lateMinutes || (rec.status === 'late' ? 15 : 0),
            earlyOutMinutes: rec.earlyOutMinutes || 0,
            adminEmail,
            companyId: targetCompanyId,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      savedRecords.push(updated.toJSON());
    }

    return res.status(200).json({
      success: true,
      message: `Successfully stored ${savedRecords.length} attendance records directly in MongoDB database!`,
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    console.error('Error importing attendance bulk to database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import attendance records to database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save/update single attendance record in MongoDB
 * @route   POST /api/attendance
 * @access  Private (Admin)
 */
export const saveAttendanceRecord = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const {
      employeeId,
      employeeName,
      fatherName: reqFatherName,
      clientName,
      companyName,
      site,
      department,
      date,
      month,
      year,
      present,
      weekOff,
      holidays,
      cl,
      sl,
      el,
      lwp,
      totalPaidDays,
      workingDays,
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

    let computedHours = workingHours;
    if (!computedHours && checkIn && checkOut) {
      try {
        const parseMins = (t) => {
          const clean = String(t).trim().toUpperCase();
          const isPM = clean.includes('PM');
          const isAM = clean.includes('AM');
          const numbers = clean.replace(/[^0-9:]/g, '');
          let [h, m] = numbers.split(':').map(Number);
          if (isNaN(h)) return null;
          if (isNaN(m)) m = 0;
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;
          return h * 60 + m;
        };
        const inM = parseMins(checkIn);
        const outM = parseMins(checkOut);
        if (inM !== null && outM !== null && outM >= inM) {
          const diff = outM - inM;
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          computedHours = `${h}h ${String(m).padStart(2, '0')}m`;
        }
      } catch {
        // ignore
      }
    }

    const rawEmpId = String(employeeId).trim();
    const rawEmpName = String(employeeName || 'Employee').trim();
    const rawFatherName = String(reqFatherName || '').trim();

    const matchedEmp = await Employee.findOne({
      $or: [
        { employeeId: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } },
        { employeeCode: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } },
        { name: { $regex: new RegExp(`^${escapeRegex(rawEmpName)}$`, 'i') } },
      ],
    });

    const finalEmpId = matchedEmp?.employeeId || rawEmpId;
    const finalEmpName = matchedEmp?.name || rawEmpName;
    const finalFatherName = rawFatherName || matchedEmp?.fatherName || '';
    const finalCompanyId = matchedEmp?.companyId || companyId || 'RRS8392014SEC';

    const initials =
      (finalEmpName || 'EM')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const record = await Attendance.findOneAndUpdate(
      { companyId: finalCompanyId, employeeId: finalEmpId, date },
      {
        $set: {
          employeeName: finalEmpName,
          fatherName: finalFatherName,
          initials,
          clientName: clientName || companyName || matchedEmp?.clientName || 'RR Security',
          companyName: clientName || companyName || matchedEmp?.clientName || 'RR Security',
          site: site || matchedEmp?.site || 'Main Site',
          department: department || matchedEmp?.department || 'Security',
          date,
          month: month || '',
          year: year ? Number(year) : (date ? Number(date.split('-')[0]) : new Date().getFullYear()),
          present: present !== undefined ? Number(present) : (status === 'present' ? 1 : 0),
          weekOff: weekOff !== undefined ? Number(weekOff) : 0,
          holidays: holidays !== undefined ? Number(holidays) : 0,
          cl: cl !== undefined ? Number(cl) : 0,
          sl: sl !== undefined ? Number(sl) : 0,
          el: el !== undefined ? Number(el) : 0,
          lwp: lwp !== undefined ? Number(lwp) : 0,
          totalPaidDays: totalPaidDays !== undefined ? Number(totalPaidDays) : undefined,
          workingDays: workingDays !== undefined ? Number(workingDays) : undefined,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          workingHours: computedHours || (status === 'absent' || status === 'onLeave' ? null : '8h 00m'),
          status: status || 'present',
          lateMinutes: Number(lateMinutes) || 0,
          earlyOutMinutes: Number(earlyOutMinutes) || 0,
          adminEmail,
          companyId: finalCompanyId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance record stored in database successfully.',
      record: record.toJSON(),
    });
  } catch (error) {
    console.error('Error saving attendance record to database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save attendance record to database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete attendance record permanently from MongoDB
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin)
 */
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    let record = null;
    try {
      record = await Attendance.findById(id);
    } catch {
      record = await Attendance.findOne({ companyId, $or: [{ id }, { employeeId: id }] });
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found in database.',
      });
    }

    await Attendance.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: `Attendance record for ${record.employeeName || record.employeeId} (${record.date}) deleted successfully from database.`,
    });
  } catch (error) {
    console.error('Error deleting attendance record from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record.',
      error: error.message,
    });
  }
};


/**
 * @desc    Get all correction requests from MongoDB
 * @route   GET /api/attendance/corrections
 * @access  Private
 */
export const getCorrectionRequests = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    const corrections = await AttendanceCorrection.find({
      companyId,
      status: 'pendingCorrection',
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: corrections.length,
      corrections: corrections.map((c) => c.toJSON()),
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
    const companyId = req.headers['x-company-id'] || req.body.companyId;
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
        .map((n) => n[0])
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

    // Mark attendance record as pendingCorrection in MongoDB
    if (attendanceId) {
      await Attendance.findByIdAndUpdate(attendanceId, { status: 'pendingCorrection' }).catch(() => { });
    } else if (employeeId && date) {
      await Attendance.findOneAndUpdate(
        { companyId, employeeId, date },
        { status: 'pendingCorrection' }
      ).catch(() => { });
    }

    return res.status(201).json({
      success: true,
      message: 'Correction request submitted for review and stored in database.',
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

    let correction = null;
    try {
      correction = await AttendanceCorrection.findById(id);
    } catch {
      correction = await AttendanceCorrection.findOne({
        $or: [{ correctionId: id }, { id }],
      });
    }

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found in database.',
      });
    }

    if (action === 'approve') {
      correction.status = 'approved';
      await correction.save();

      // Calculate approximate working hours if in & out provided
      let workingHours = null;
      if (correction.requestedCheckIn && correction.requestedCheckOut) {
        try {
          const parseMins = (t) => {
            const clean = t.trim().toUpperCase();
            const isPM = clean.includes('PM');
            const isAM = clean.includes('AM');
            const [h, m] = clean.replace(/[^0-9:]/g, '').split(':').map(Number);
            let hours = h || 0;
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;
            return hours * 60 + (m || 0);
          };
          const totalMins = parseMins(correction.requestedCheckOut) - parseMins(correction.requestedCheckIn);
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
            workingHours: workingHours || '8h 00m',
            status: 'present',
            lateMinutes: 0,
            earlyOutMinutes: 0,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `Correction request approved for ${correction.employeeName}. Attendance updated in database.`,
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

