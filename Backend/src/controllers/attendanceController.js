import Attendance from '../models/attendanceModel.js';
import AttendanceCorrection from '../models/attendanceCorrectionModel.js';
import Employee from '../models/employeeModel.js';
import { resolveClient, buildAssignedEmployeeFilter } from './clientPortalController.js';

const escapeRegex = (s) => String(s || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * Distribute monthly muster counts into individual daily attendance records for each day of the month.
 */
export const generateDailyAttendanceForMonth = ({
  empId,
  empName,
  fatherName,
  initials,
  clientId,
  client,
  site,
  department,
  targetCompanyId,
  adminEmail,
  targetYear,
  targetMonthNum,
  present = 0,
  weekOff = 0,
  holidays = 0,
  cl = 0,
  sl = 0,
  el = 0,
  lwp = 0,
  checkIn,
  checkOut,
  workingHours,
}) => {
  const y = Number(targetYear) || new Date().getFullYear();
  const m = String(targetMonthNum).padStart(2, '0');
  const daysInMonth = new Date(y, Number(m), 0).getDate();
  const monthKey = `${y}-${m}`;

  // Build calendar days array for the month
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(y, Number(m) - 1, d);
    const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = `${y}-${m}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      dayOfWeek,
      status: null,
      leaveType: null,
    });
  }

  // Parse count numbers
  let remWO = Math.max(0, Number(weekOff) || 0);
  let remHol = Math.max(0, Number(holidays) || 0);
  let remCL = Math.max(0, Number(cl) || 0);
  let remSL = Math.max(0, Number(sl) || 0);
  let remEL = Math.max(0, Number(el) || 0);
  let remPresent = Math.max(0, Number(present) || 0);
  let remLWP = Math.max(0, Number(lwp) || 0);

  // 1. Allocate Week Offs (Priority 1: Sundays)
  if (remWO > 0) {
    for (const item of days) {
      if (item.dayOfWeek === 0 && !item.status && remWO > 0) {
        item.status = 'weekOff';
        remWO--;
      }
    }
  }
  // Allocate Week Offs (Priority 2: Saturdays)
  if (remWO > 0) {
    for (const item of days) {
      if (item.dayOfWeek === 6 && !item.status && remWO > 0) {
        item.status = 'weekOff';
        remWO--;
      }
    }
  }
  // Allocate any excess Week Offs to unassigned days
  if (remWO > 0) {
    for (const item of days) {
      if (!item.status && remWO > 0) {
        item.status = 'weekOff';
        remWO--;
      }
    }
  }

  // 2. Allocate Public Holidays
  if (remHol > 0) {
    for (const item of days) {
      if (!item.status && remHol > 0) {
        item.status = 'holiday';
        remHol--;
      }
    }
  }

  // 3. Allocate Leaves (Casual, Sick, Earned)
  if (remCL > 0) {
    for (const item of days) {
      if (!item.status && remCL > 0) {
        item.status = 'onLeave';
        item.leaveType = 'cl';
        remCL--;
      }
    }
  }
  if (remSL > 0) {
    for (const item of days) {
      if (!item.status && remSL > 0) {
        item.status = 'onLeave';
        item.leaveType = 'sl';
        remSL--;
      }
    }
  }
  if (remEL > 0) {
    for (const item of days) {
      if (!item.status && remEL > 0) {
        item.status = 'onLeave';
        item.leaveType = 'el';
        remEL--;
      }
    }
  }

  // 4. Allocate Presents
  if (remPresent > 0) {
    for (const item of days) {
      if (!item.status && remPresent > 0) {
        item.status = 'present';
        remPresent--;
      }
    }
  }

  // 5. Allocate LWP (Leave Without Pay / Unpaid)
  if (remLWP > 0) {
    for (const item of days) {
      if (!item.status && remLWP > 0) {
        item.status = 'absent';
        item.leaveType = 'lwp';
        remLWP--;
      }
    }
  }

  // 6. Any remaining unassigned days in the month
  for (const item of days) {
    if (!item.status) {
      if (remPresent > 0) {
        item.status = 'present';
        remPresent--;
      } else if (
        present > 0 &&
        Number(weekOff || 0) === 0 &&
        Number(holidays || 0) === 0 &&
        Number(cl || 0) === 0 &&
        Number(sl || 0) === 0 &&
        Number(el || 0) === 0 &&
        Number(lwp || 0) === 0
      ) {
        // Full month present upload (e.g. 30 presents in 30 days)
        item.status = 'present';
      } else {
        item.status = 'absent';
      }
    }
  }

  // Construct individual daily documents
  return days.map((item) => {
    const isPres = item.status === 'present';
    const isWO = item.status === 'weekOff';
    const isHol = item.status === 'holiday';
    const isLeave = item.status === 'onLeave';
    const isAbs = item.status === 'absent';

    return {
      companyId: targetCompanyId,
      employeeId: empId,
      employeeName: empName,
      fatherName: fatherName || '',
      initials: initials || 'EM',
      clientId: clientId || '',
      clientName: client,
      companyName: client,
      site: site || 'Main Site',
      department: department || 'Security',
      date: item.dateStr,
      month: monthKey,
      year: y,
      present: isPres ? 1 : 0,
      weekOff: isWO ? 1 : 0,
      holidays: isHol ? 1 : 0,
      cl: item.leaveType === 'cl' ? 1 : 0,
      sl: item.leaveType === 'sl' ? 1 : 0,
      el: item.leaveType === 'el' ? 1 : 0,
      lwp: item.leaveType === 'lwp' ? 1 : 0,
      totalPaidDays: (isPres || isWO || isHol || isLeave) ? 1 : 0,
      workingDays: 1,
      checkIn: isPres ? (checkIn || '09:00 AM') : null,
      checkOut: isPres ? (checkOut || '05:00 PM') : null,
      workingHours: isPres ? (workingHours || '8h 00m') : '-',
      status: item.status,
      lateMinutes: 0,
      earlyOutMinutes: 0,
      adminEmail: adminEmail || '',
    };
  });
};

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
    } else if (user && user.role === 'client') {
      const client = await resolveClient(req);
      if (client) {
        const empFilter = buildAssignedEmployeeFilter(client);
        const assignedEmps = await Employee.find(empFilter).select('employeeId employeeCode').lean();
        const empIds = Array.from(new Set(assignedEmps.map(e => e.employeeId).concat(assignedEmps.map(e => e.employeeCode)).filter(Boolean)));

        const clientConditions = [];
        if (empIds.length > 0) {
          clientConditions.push({ employeeId: { $in: empIds } });
        }
        if (client.clientId) {
          clientConditions.push({ clientId: client.clientId });
        }
        if (client.name) {
          const esc = escapeRegex(client.name);
          clientConditions.push({ clientName: { $regex: new RegExp(`^\\s*${esc}\\s*$`, 'i') } });
          clientConditions.push({ companyName: { $regex: new RegExp(`^\\s*${esc}\\s*$`, 'i') } });
        }

        if (clientConditions.length > 0) {
          query.$or = clientConditions;
        }
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
      const monthConditions = [{ date: { $regex: new RegExp(`^${escapeRegex(month)}`) } }];
      if (month.includes('-')) {
        const [y, m] = month.split('-');
        const monthNum = parseInt(m, 10);
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const mName = monthNames[monthNum - 1];
        if (mName) {
          monthConditions.push({ month: { $regex: new RegExp(mName, 'i') } });
          monthConditions.push({ date: { $regex: new RegExp(mName, 'i') } });
        }
        monthConditions.push({ month: { $regex: new RegExp(`^${escapeRegex(month)}`) } });
      } else {
        monthConditions.push({ month: { $regex: new RegExp(escapeRegex(month), 'i') } });
      }
      query.$or = query.$or ? [...query.$or, ...monthConditions] : monthConditions;
    } else if (year) {
      const yearConditions = [
        { date: { $regex: new RegExp(`^${escapeRegex(year)}`) } },
        { year: Number(year) }
      ];
      query.$or = query.$or ? [...query.$or, ...yearConditions] : yearConditions;
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

    // Auto-expand any monthly summary muster records in the queried month/date range into daily records
    let expandedAny = false;
    let targetMonthPrefix = null;
    if (date && typeof date === 'string' && date.includes('-')) {
      const parts = date.split('-');
      targetMonthPrefix = `${parts[0]}-${parts[1]}`;
    } else if (fromDate && typeof fromDate === 'string' && fromDate.includes('-')) {
      const parts = fromDate.split('-');
      targetMonthPrefix = `${parts[0]}-${parts[1]}`;
    } else if (month && typeof month === 'string') {
      if (month.includes('-')) {
        targetMonthPrefix = month.slice(0, 7);
      } else {
        const monthsMap = {
          january: '01', jan: '01',
          february: '02', feb: '02',
          march: '03', mar: '03',
          april: '04', apr: '04',
          may: '05',
          june: '06', jun: '06',
          july: '07', jul: '07',
          august: '08', aug: '08',
          september: '09', sept: '09', sep: '09',
          october: '10', oct: '10',
          november: '11', nov: '11',
          december: '12', dec: '12'
        };
        const mNum = monthsMap[month.toLowerCase()] || (parseInt(month, 10) ? String(month).padStart(2, '0') : null);
        const yNum = year || new Date().getFullYear();
        if (mNum) {
          targetMonthPrefix = `${yNum}-${mNum}`;
        }
      }
    }

    if (targetMonthPrefix) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const mIdx = parseInt(targetMonthPrefix.split('-')[1], 10) - 1;
      const engMonthName = (mIdx >= 0 && mIdx < 12) ? monthNames[mIdx] : '';

      const summaryQueryConditions = [
        { date: { $regex: new RegExp(`^${escapeRegex(targetMonthPrefix)}`) } },
        { month: { $regex: new RegExp(`^${escapeRegex(targetMonthPrefix)}`) } },
      ];
      if (engMonthName) {
        summaryQueryConditions.push({ month: { $regex: new RegExp(engMonthName, 'i') } });
      }

      const summaryRecords = await Attendance.find({
        ...(companyId ? { companyId } : {}),
        $and: [
          { $or: summaryQueryConditions },
          {
            $or: [
              { present: { $gt: 1 } },
              { workingDays: { $gt: 1 } },
            ],
          },
        ],
      }).lean();

      if (summaryRecords.length > 0) {
        const [tYear, tMonth] = targetMonthPrefix.split('-');
        for (const sRec of summaryRecords) {
          const dailyRecs = generateDailyAttendanceForMonth({
            empId: sRec.employeeId,
            empName: sRec.employeeName,
            fatherName: sRec.fatherName,
            initials: sRec.initials,
            clientId: sRec.clientId,
            client: sRec.clientName || sRec.companyName,
            site: sRec.site,
            department: sRec.department,
            targetCompanyId: sRec.companyId || companyId,
            adminEmail: sRec.adminEmail,
            targetYear: Number(tYear),
            targetMonthNum: tMonth,
            present: sRec.present,
            weekOff: sRec.weekOff,
            holidays: sRec.holidays,
            cl: sRec.cl,
            sl: sRec.sl,
            el: sRec.el,
            lwp: sRec.lwp,
            checkIn: sRec.checkIn,
            checkOut: sRec.checkOut,
            workingHours: sRec.workingHours,
          });

          if (sRec._id) {
            await Attendance.deleteOne({ _id: sRec._id });
          }

          const bulkOps = dailyRecs.map((dRec) => ({
            updateOne: {
              filter: {
                companyId: sRec.companyId || companyId,
                employeeId: sRec.employeeId,
                date: dRec.date,
              },
              update: { $set: dRec },
              upsert: true,
            },
          }));

          await Attendance.bulkWrite(bulkOps);
          expandedAny = true;
        }

        if (expandedAny) {
          records = await Attendance.find(query).sort({ date: -1, employeeId: 1 });
        }
      }
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

    // When querying by month or range, preserve all individual daily records for every employee so both daily, weekly, and monthly views display all days.

    // Calculate dynamic summary metrics
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const halfDayCount = records.filter((r) => r.status === 'half_day' || r.status === 'half-day' || r.status === 'halfDay').length;
    const leaveCount = records.filter((r) => r.status === 'leave' || r.status === 'on_leave' || r.status === 'on-leave' || r.status === 'onLeave').length;
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
    const { records, defaultDate, month: reqMonth, isMonthly, year: reqYear } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendance records provided to import.',
      });
    }

    const savedRecords = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rawEmpId = (rec.employeeId || `EMP${String(i + 1).padStart(3, '0')}`).trim();
      const rawEmpName = (rec.employeeName || 'Employee').trim();
      const rawFatherName = (rec.fatherName || '').trim();

      // Normalize employee ID (e.g. RR001 matches RR-001 or RR_001)
      const cleanEmpId = rawEmpId.replace(/[-_ ]/g, '');
      const flexIdRegex = cleanEmpId ? new RegExp(`^${cleanEmpId.split('').join('[-_ ]?')}$`, 'i') : null;
      const cleanEmpName = rawEmpName.trim();
      const flexNameRegex = new RegExp(`^${escapeRegex(cleanEmpName)}$`, 'i');

      const empSearchConditions = [
        { name: { $regex: flexNameRegex } },
      ];
      if (flexIdRegex) {
        empSearchConditions.push({ employeeId: { $regex: flexIdRegex } });
        empSearchConditions.push({ employeeCode: { $regex: flexIdRegex } });
      }
      empSearchConditions.push({ employeeId: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } });
      empSearchConditions.push({ employeeCode: { $regex: new RegExp(`^${escapeRegex(rawEmpId)}$`, 'i') } });

      const matchedEmp = await Employee.findOne({
        $or: empSearchConditions,
      });

      // Standardize employee code into system configured format (RR001, RR_001, RR 001 -> RR-001)
      let formattedEmpCode = matchedEmp?.employeeId || matchedEmp?.employeeCode || '';
      if (!formattedEmpCode) {
        const match = rawEmpId.match(/^([A-Za-z]+)?[-_/\s]*(\d+)$/);
        if (match) {
          const prefix = match[1] ? match[1].toUpperCase() : 'RR';
          const num = match[2].padStart(3, '0');
          formattedEmpCode = `${prefix}-${num}`;
        } else {
          formattedEmpCode = rawEmpId;
        }
      }

      const empId = formattedEmpCode;
      const empName = matchedEmp?.name || rawEmpName;
      const fatherName = rawFatherName || matchedEmp?.fatherName || matchedEmp?.fatherHusbandName || '';
      const targetCompanyId = matchedEmp?.companyId || companyId;
      const client = (rec.clientName || rec.companyName || matchedEmp?.clientName || 'RR Security').trim();
      const clientId = (rec.clientId || matchedEmp?.clientId || '').trim();
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

      // Determine month, year and standard format
      let targetYear = rec.year ? Number(rec.year) : (reqYear ? Number(reqYear) : new Date().getFullYear());
      let rawMonth = String(rec.month || reqMonth || defaultDate?.slice(0, 7) || '').trim();
      let targetMonthNum = '01';

      if (/^\d{4}-\d{1,2}$/.test(rawMonth)) {
        const [y, m] = rawMonth.split('-');
        targetYear = Number(y);
        targetMonthNum = String(m).padStart(2, '0');
      } else if (/^\d{1,2}$/.test(rawMonth)) {
        targetMonthNum = String(rawMonth).padStart(2, '0');
      } else if (rawMonth) {
        const monthsMap = {
          january: '01', jan: '01',
          february: '02', feb: '02',
          march: '03', mar: '03',
          april: '04', apr: '04',
          may: '05',
          june: '06', jun: '06',
          july: '07', jul: '07',
          august: '08', aug: '08',
          september: '09', sept: '09', sep: '09',
          october: '10', oct: '10',
          november: '11', nov: '11',
          december: '12', dec: '12'
        };
        targetMonthNum = monthsMap[rawMonth.toLowerCase()] || String(new Date().getMonth() + 1).padStart(2, '0');
      } else {
        targetMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
      }

      const monthKey = `${targetYear}-${targetMonthNum}`;
      const monthDateKey = `${targetYear}-${targetMonthNum}-01`;
      const recordDate = rec.date || defaultDate || monthDateKey;

      const daysInThisMonth = new Date(targetYear, Number(targetMonthNum), 0).getDate();
      const workingDays = (rec.workingDays !== undefined && Number(rec.workingDays) > 1)
        ? Number(rec.workingDays)
        : daysInThisMonth;

      const isMonthlyRecord = isMonthly || Boolean(reqMonth) || Boolean(rec.month) || (rec.workingDays && rec.workingDays > 1) || (rec.present && rec.present > 1);

      let updated;
      if (isMonthlyRecord) {
        // Generate daily attendance records for every day of the month as per presents, absent, leaves, holidays, weekOff
        const dailyRecords = generateDailyAttendanceForMonth({
          empId,
          empName,
          fatherName,
          initials,
          clientId,
          client,
          site,
          department,
          targetCompanyId,
          adminEmail,
          targetYear,
          targetMonthNum,
          present,
          weekOff,
          holidays,
          cl,
          sl,
          el,
          lwp,
          checkIn: rec.checkIn,
          checkOut: rec.checkOut,
          workingHours: rec.workingHours,
        });

        // Clean up previous records for this employee for this month
        await Attendance.deleteMany({
          date: { $regex: new RegExp(`^${monthKey}`) },
          $or: [
            { employeeId: empId },
            { employeeId: rawEmpId },
            ...(flexIdRegex ? [{ employeeId: { $regex: flexIdRegex } }] : []),
          ],
        });

        // Insert all individual daily records into MongoDB
        if (dailyRecords.length > 0) {
          const inserted = await Attendance.insertMany(dailyRecords, { ordered: false });
          savedRecords.push(...inserted.map((d) => (typeof d.toJSON === 'function' ? d.toJSON() : d)));
        }
      } else {
        // Daily attendance record import
        updated = await Attendance.findOneAndUpdate(
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
              clientId,
              clientName: client,
              companyName: client,
              site,
              department,
              date: recordDate,
              month: monthKey,
              year: targetYear,
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
      }

      if (updated) {
        savedRecords.push(typeof updated.toJSON === 'function' ? updated.toJSON() : updated);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported & consolidated ${savedRecords.length} attendance records directly in MongoDB Atlas!`,
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
          clientId: req.body.clientId || matchedEmp?.clientId || '',
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
          remarks: req.body.remarks !== undefined ? req.body.remarks : '',
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
    const { month, employeeId, deleteAllMonth } = req.query;

    const shouldDeleteAllMonth = deleteAllMonth === 'true' || deleteAllMonth === true;

    // 1. If deleteAllMonth is requested with month and employeeId
    if (shouldDeleteAllMonth && (month || employeeId)) {
      const targetEmpId = employeeId || id;
      const targetMonth = month || '';

      const cleanEmpId = String(targetEmpId).replace(/[-_ ]/g, '');
      const flexIdRegex = cleanEmpId ? new RegExp(`^${cleanEmpId.split('').join('[-_ ]?')}$`, 'i') : null;

      let monthRegex = null;
      if (targetMonth && /^\d{4}-\d{1,2}$/.test(targetMonth)) {
        monthRegex = new RegExp(`^${escapeRegex(targetMonth)}`);
      } else if (targetMonth) {
        const parts = String(targetMonth).trim().split(' ');
        const mName = parts[0];
        const yName = parts[1] || new Date().getFullYear();
        const monthsMap = {
          january: '01', jan: '01',
          february: '02', feb: '02',
          march: '03', mar: '03',
          april: '04', apr: '04',
          may: '05',
          june: '06', jun: '06',
          july: '07', jul: '07',
          august: '08', aug: '08',
          september: '09', sept: '09', sep: '09',
          october: '10', oct: '10',
          november: '11', nov: '11',
          december: '12', dec: '12'
        };
        const mNum = monthsMap[mName.toLowerCase()] || (parseInt(mName, 10) ? String(mName).padStart(2, '0') : null);
        if (mNum) {
          monthRegex = new RegExp(`^${yName}-${mNum}`);
        } else {
          monthRegex = new RegExp(`^${escapeRegex(targetMonth)}`);
        }
      }

      const conditions = [
        {
          $or: [
            { employeeId: targetEmpId },
            ...(flexIdRegex ? [{ employeeId: { $regex: flexIdRegex } }] : []),
          ],
        },
      ];

      if (monthRegex) {
        conditions.push({
          $or: [
            { date: { $regex: monthRegex } },
            { month: { $regex: monthRegex } },
            { month: new RegExp(escapeRegex(targetMonth), 'i') },
          ],
        });
      }

      const filter = {
        ...(companyId ? { companyId } : {}),
        $and: conditions,
      };

      const delResult = await Attendance.deleteMany(filter);

      return res.status(200).json({
        success: true,
        message: `Successfully deleted all ${delResult.deletedCount} daily attendance records for ${targetEmpId} (${targetMonth || 'month'}).`,
        deletedCount: delResult.deletedCount,
      });
    }

    // 2. Look up record by ID or employee ID
    let record = null;
    try {
      record = await Attendance.findById(id);
    } catch {
      record = await Attendance.findOne({
        ...(companyId ? { companyId } : {}),
        $or: [{ id }, { employeeId: id }],
      });
    }

    if (!record) {
      const cleanId = String(id).replace(/[-_ ]/g, '');
      const flexRegex = cleanId ? new RegExp(`^${cleanId.split('').join('[-_ ]?')}$`, 'i') : null;
      record = await Attendance.findOne({
        ...(companyId ? { companyId } : {}),
        $or: [
          { employeeId: id },
          ...(flexRegex ? [{ employeeId: { $regex: flexRegex } }] : []),
        ],
      });
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found in database.',
      });
    }

    // 3. If deleteAllMonth was requested without explicit month param, use the found record's month
    if (shouldDeleteAllMonth) {
      const recDate = record.date || '';
      const recMonth = record.month || (recDate.includes('-') ? recDate.slice(0, 7) : '');
      const recEmpId = record.employeeId;

      const cleanEmpId = String(recEmpId).replace(/[-_ ]/g, '');
      const flexIdRegex = cleanEmpId ? new RegExp(`^${cleanEmpId.split('').join('[-_ ]?')}$`, 'i') : null;

      const delResult = await Attendance.deleteMany({
        ...(companyId ? { companyId } : {}),
        $or: [
          { employeeId: recEmpId },
          ...(flexIdRegex ? [{ employeeId: { $regex: flexIdRegex } }] : []),
        ],
        $and: [
          {
            $or: [
              { date: { $regex: new RegExp(`^${escapeRegex(recMonth)}`) } },
              { month: { $regex: new RegExp(`^${escapeRegex(recMonth)}`) } },
              { month: new RegExp(escapeRegex(recMonth), 'i') },
            ],
          },
        ],
      });

      return res.status(200).json({
        success: true,
        message: `Successfully deleted all ${delResult.deletedCount} daily attendance records for ${record.employeeName || recEmpId} (${recMonth}).`,
        deletedCount: delResult.deletedCount,
      });
    }

    // 4. Default: single record deletion
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
 * @desc    Get all distinct months that have attendance records in MongoDB
 * @route   GET /api/attendance/months
 * @access  Private
 */
export const getAttendanceMonths = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const records = await Attendance.find(companyId ? { companyId } : {}).select('date month employeeId').lean();

    const monthMap = new Map();
    records.forEach((r) => {
      let m = '';
      if (r.month && /^\d{4}-\d{2}$/.test(r.month)) {
        m = r.month;
      } else if (r.date && /^\d{4}-\d{2}/.test(r.date)) {
        m = r.date.slice(0, 7);
      }
      if (m) {
        monthMap.set(m, (monthMap.get(m) || 0) + 1);
      }
    });

    const months = Array.from(monthMap.entries())
      .map(([month, count]) => {
        const [y, mNum] = month.split('-');
        const d = new Date(Number(y), Number(mNum) - 1, 1);
        const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        return {
          month,
          label,
          count,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    return res.status(200).json({
      success: true,
      months,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all correction requests
 * @route   GET /api/attendance/corrections
 * @access  Private
 */
export const getCorrectionRequests = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId || req.user?.companyId;
    const { status, employeeId } = req.query;

    const query = {};
    if (companyId) {
      query.companyId = companyId;
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const corrections = await AttendanceCorrection.find(query).sort({ createdAt: -1 });

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
    const adminEmail = (req.user?.adminEmail || req.user?.email || 'admin@rrsecurity.com').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || 'RRS8392014SEC';
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
      requestedStatus,
      category,
      reason,
    } = req.body;

    const empName = employeeName || req.user?.name || 'Employee';
    const initials =
      empName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const correction = await AttendanceCorrection.create({
      correctionId: `CORR${String(Date.now()).slice(-4)}`,
      attendanceId: attendanceId || `att_${Date.now()}`,
      employeeId: employeeId || req.user?.employeeId || req.user?.id,
      employeeName: empName,
      initials,
      clientName: clientName || companyName || req.user?.clientName || '',
      companyName: companyName || clientName || req.user?.companyName || '',
      site: site || req.user?.site || 'Main Site',
      date,
      originalCheckIn: originalCheckIn || 'Missing',
      originalCheckOut: originalCheckOut || 'Missing',
      originalStatus: originalStatus || 'present',
      requestedCheckIn,
      requestedCheckOut,
      requestedStatus: requestedStatus || 'Present',
      category: category || 'General',
      reason,
      submittedBy: req.user?.name || empName || 'Employee',
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
    const { action, rejectReason, adminRemarks } = req.body; // 'approve' or 'reject'

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

    correction.reviewedBy = req.user?.name || 'Admin';
    correction.reviewedAt = new Date().toISOString();

    if (action === 'approve') {
      correction.status = 'approved';
      correction.adminRemarks = adminRemarks || 'Approved by administrator';
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
            status: (correction.requestedStatus || 'present').toLowerCase().replace(/\s+/g, ''),
            lateMinutes: 0,
            earlyOutMinutes: 0,
          },
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Correction request approved for ${correction.employeeName}. Attendance updated in database.`,
        correction: correction.toJSON(),
      });
    } else {
      correction.status = 'rejected';
      correction.rejectReason = rejectReason || 'Correction request rejected by admin.';
      correction.adminRemarks = rejectReason || 'Rejected by administrator';
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
            status: (correction.originalStatus || 'present').toLowerCase().replace(/\s+/g, ''),
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `Correction request rejected for ${correction.employeeName}.`,
        correction: correction.toJSON(),
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

