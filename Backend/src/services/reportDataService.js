import mongoose from 'mongoose';
import Company from '../models/companyModel.js';
import Employee from '../models/employeeModel.js';
import Attendance from '../models/attendanceModel.js';
import { PayrollRun } from '../models/payrollModel.js';
import Client from '../models/clientModel.js';
import { resolveStatutoryConfig } from '../controllers/statutoryController.js';
import { computeEmployeePayrollCalculations } from './statutoryCalculationService.js';

export const getDaysInMonthString = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return 30;
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

export const getMonthLabel = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr || 'Current Month';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const isValidStatutoryCode = (val) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed !== '' &&
    trimmed !== '—' &&
    trimmed !== '-' &&
    trimmed !== 'null' &&
    trimmed !== 'undefined' &&
    trimmed !== 'N/A' &&
    trimmed !== 'NA'
  );
};

/**
 * Resolve Tenant Context:
 * Identifies the exact company for the request, builds candidate alias IDs,
 * and prevents falling back to default or other companies.
 */
export const resolveTenantContext = async (req) => {
  const user = req.user;
  const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId;
  const adminEmail = user?.email?.toLowerCase();

  const candidateIds = new Set();
  if (rawCompanyId && rawCompanyId !== 'undefined' && rawCompanyId !== 'null' && rawCompanyId !== 'All Companies') {
    candidateIds.add(String(rawCompanyId).trim());
  }

  let compDoc = null;
  const isObjId = (id) => (typeof mongoose !== 'undefined' && mongoose?.isValidObjectId)
    ? mongoose.isValidObjectId(id)
    : (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));

  // 1. If specific company identifier provided, find the exact company first
  if (candidateIds.size > 0) {
    const orConditions = [];
    for (const cid of candidateIds) {
      orConditions.push({ companyId: cid });
      orConditions.push({ code: cid });
      if (isObjId(cid)) orConditions.push({ _id: cid });
    }
    if (orConditions.length > 0) {
      compDoc = await Company.findOne({ $or: orConditions }).lean().catch(() => null);
    }
  }

  // 1b. If no specific company was found and adminEmail provided, find company by email
  if (!compDoc && adminEmail) {
    compDoc = await Company.findOne({
      $or: [{ email: adminEmail }, { adminEmail: adminEmail }]
    }).lean().catch(() => null);
  }

  // 2. Only if NO specific company was requested and no user email, fall back to default
  if (!compDoc && candidateIds.size === 0 && !adminEmail) {
    compDoc = await Company.findOne({ isDefault: true }).lean().catch(() => null);
    if (!compDoc) compDoc = await Company.findOne({}).sort({ updatedAt: -1 }).lean().catch(() => null);
  }

  if (compDoc) {
    if (compDoc.companyId) candidateIds.add(compDoc.companyId);
    if (compDoc._id) candidateIds.add(String(compDoc._id));
    if (compDoc.code) candidateIds.add(compDoc.code);
  }

  const resolvedCompanyIds = Array.from(candidateIds).filter(Boolean);
  const primaryCompanyId = compDoc?.companyId || (resolvedCompanyIds.length > 0 ? resolvedCompanyIds[0] : (rawCompanyId || ''));

  return {
    compDoc,
    resolvedCompanyIds,
    primaryCompanyId,
    adminEmail,
  };
};

/**
 * Resolve Company Branding:
 * Strictly returns the branding and statutory identifiers of THIS company.
 * Never leaks other companies' codes or names.
 */
export const resolveCompanyBranding = async (companyId, adminEmail = null) => {
  let compDoc = null;
  const candidateIds = new Set();
  if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== 'All Companies') {
    candidateIds.add(String(companyId).trim());
  }

  const isObjId = (id) => (typeof mongoose !== 'undefined' && mongoose?.isValidObjectId)
    ? mongoose.isValidObjectId(id)
    : (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));

  // Find specific company by candidate IDs first
  if (candidateIds.size > 0) {
    const orConditions = [];
    for (const cid of candidateIds) {
      orConditions.push({ companyId: cid });
      orConditions.push({ code: cid });
      if (isObjId(cid)) orConditions.push({ _id: cid });
    }
    if (orConditions.length > 0) {
      compDoc = await Company.findOne({ $or: orConditions }).lean().catch(() => null);
    }
  }

  // If not found and adminEmail provided, find company by email
  if (!compDoc && adminEmail) {
    compDoc = await Company.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { adminEmail: adminEmail.toLowerCase() }]
    }).lean().catch(() => null);
  }

  // Only fall back to default if no specific company was requested
  if (!compDoc && candidateIds.size === 0 && !adminEmail) {
    compDoc = await Company.findOne({ isDefault: true }).lean().catch(() => null);
    if (!compDoc) compDoc = await Company.findOne({}).sort({ updatedAt: -1 }).lean().catch(() => null);
  }

  const name = compDoc?.name || compDoc?.companyName || (candidateIds.size > 0 ? Array.from(candidateIds)[0] : 'RR Security & Facilities');
  const fullAddress = [
    compDoc?.address || compDoc?.registeredAddress,
    compDoc?.city,
    compDoc?.state,
    compDoc?.pinCode,
  ].filter(Boolean).join(', ');
  const address = fullAddress || compDoc?.address || compDoc?.registeredAddress || '';

  const pfCandidates = [
    compDoc?.employerPfCode,
    compDoc?.pfCode,
    compDoc?.pfNo,
    compDoc?.epfNo,
    compDoc?.compliance?.employerPfCode,
    compDoc?.compliance?.pfNo,
  ];
  const validPf = pfCandidates.find(isValidStatutoryCode) || compDoc?.employerPfCode || compDoc?.pfCode || '';

  const esiCandidates = [
    compDoc?.employerEsiCode,
    compDoc?.esiCode,
    compDoc?.esicNo,
    compDoc?.esiNo,
    compDoc?.compliance?.employerEsiCode,
    compDoc?.compliance?.esiNo,
  ];
  const validEsi = esiCandidates.find(isValidStatutoryCode) || compDoc?.employerEsiCode || compDoc?.esiCode || '';

  return {
    doc: compDoc,
    name,
    address,
    city: compDoc?.city || '',
    state: compDoc?.state || '',
    pinCode: compDoc?.pinCode || '',
    regdOffice: compDoc?.registeredAddress || address,
    phone: compDoc?.phone || compDoc?.contactNumber || '—',
    email: compDoc?.email || '—',
    website: compDoc?.website || '—',
    pfNo: validPf,
    esiNo: validEsi,
    employerPfCode: validPf,
    employerEsiCode: validEsi,
    pan: compDoc?.pan || '—',
    tan: compDoc?.tan || '—',
    gstin: compDoc?.gstin || '—',
    bankName: compDoc?.bankName || '—',
    bankBranch: compDoc?.bankBranch || compDoc?.branch || '—',
    accountNumber: compDoc?.bankAccountNo || compDoc?.accountNumber || '—',
    ifsc: compDoc?.ifscCode || compDoc?.ifsc || '—',
    registrationNo: compDoc?.registrationNo || compDoc?.companyId || '—',
    logo: compDoc?.logo || compDoc?.logoUrl || '',
  };
};

/**
 * Resolve Establishment / Client Info
 */
export const resolveEstablishmentInfo = async (companyParam, employeeList = [], companyId = null, resolvedCompanyIds = []) => {
  let clientDoc = null;
  const scopedCompanyIds = resolvedCompanyIds.length > 0 ? resolvedCompanyIds : (companyId ? [companyId] : []);
  const compFilter = scopedCompanyIds.length > 0 ? { companyId: { $in: scopedCompanyIds } } : {};

  if (companyParam && companyParam !== 'All Companies' && companyParam !== 'All Clients' && companyParam !== 'All Companies & Clients') {
    clientDoc = await Client.findOne({
      ...compFilter,
      $or: [
        { clientName: companyParam },
        { name: companyParam },
        { companyName: companyParam },
        { clientId: companyParam },
      ],
    }).lean().catch(() => null);
  }

  if (!clientDoc && Array.isArray(employeeList) && employeeList.length > 0) {
    const firstWithClient = employeeList.find((e) => e.clientName || e.site);
    const targetName = firstWithClient?.clientName || firstWithClient?.site;
    if (targetName) {
      clientDoc = await Client.findOne({
        ...compFilter,
        $or: [{ clientName: targetName }, { name: targetName }, { companyName: targetName }],
      }).lean().catch(() => null);
    }
  }

  if (!clientDoc && scopedCompanyIds.length > 0) {
    clientDoc = await Client.findOne(compFilter).lean().catch(() => null);
  }

  const name = clientDoc?.clientName || clientDoc?.name || (employeeList[0]?.clientName || employeeList[0]?.site) || 'All Clients';
  const address = clientDoc?.address || clientDoc?.siteAddress || clientDoc?.location || '';
  const principalEmployer = clientDoc?.principalEmployer || clientDoc?.contactPerson || name;
  const workLocation = address ? `${name}, ${address}` : name;

  return {
    clientDoc,
    name,
    address,
    principalEmployer,
    workLocation,
    pan: clientDoc?.pan || '—',
    gstin: clientDoc?.gstin || '—',
    pfCode: clientDoc?.compliance?.employerPfCode || clientDoc?.compliance?.pfNo || clientDoc?.pfNo || '',
    esiCode: clientDoc?.compliance?.employerEsiCode || clientDoc?.compliance?.esiNo || clientDoc?.esiNo || '',
  };
};

/**
 * Helper to fetch Attendance and PayrollRun records strictly for the tenant and month,
 * and calculate payroll/attendance metrics for every employee.
 */
export const resolveReportPayrollAndAttendance = async ({
  req,
  month,
  resolvedCompanyIds = [],
  primaryCompanyId = null,
  employees = [],
}) => {
  const compId = primaryCompanyId || (resolvedCompanyIds.length > 0 ? resolvedCompanyIds[0] : null);
  const statutoryRes = await resolveStatutoryConfig(compId, req.user?.email);
  const statutory = statutoryRes.config;
  const salaryComponentsMaster = statutoryRes.salaryComponents;

  const totalDaysInMonth = getDaysInMonthString(month);

  // 1. Fetch Attendance strictly scoped
  const attQuery = {
    date: { $regex: new RegExp(`^${month}`) },
  };
  if (resolvedCompanyIds.length > 0) {
    attQuery.companyId = { $in: resolvedCompanyIds };
  }
  const attendanceRecords = await Attendance.find(attQuery).lean();

  // 2. Fetch saved PayrollRun strictly scoped
  const prQuery = {
    $or: [{ month }, { period: month }],
  };
  if (resolvedCompanyIds.length > 0) {
    prQuery.companyId = { $in: resolvedCompanyIds };
  }
  const savedPayroll = await PayrollRun.findOne(prQuery).lean();
  const savedMap = new Map();
  if (savedPayroll?.records && Array.isArray(savedPayroll.records)) {
    savedPayroll.records.forEach((r) => {
      if (r.employeeId) savedMap.set(String(r.employeeId).toLowerCase(), r);
      if (r.employeeCode) savedMap.set(String(r.employeeCode).toLowerCase(), r);
      if (r._id) savedMap.set(String(r._id).toLowerCase(), r);
    });
  }

  // Pre-index attendance by employeeId
  const attMap = new Map();
  attendanceRecords.forEach((a) => {
    if (a.employeeId) {
      const key = String(a.employeeId).toLowerCase();
      if (!attMap.has(key)) attMap.set(key, []);
      attMap.get(key).push(a);
    }
    if (a.employeeCode) {
      const key = String(a.employeeCode).toLowerCase();
      if (!attMap.has(key)) attMap.set(key, []);
      attMap.get(key).push(a);
    }
  });

  const companyHasAnyAttendance = attendanceRecords.length > 0;

  const employeeDataMap = new Map();
  for (const emp of employees) {
    const empIdKey = String(emp.employeeId || emp.employeeCode || emp._id).toLowerCase();
    const saved = savedMap.get(empIdKey) ||
      (emp.employeeCode ? savedMap.get(String(emp.employeeCode).toLowerCase()) : null) ||
      (emp._id ? savedMap.get(String(emp._id).toLowerCase()) : null);

    const empAttList = attMap.get(empIdKey) ||
      (emp.employeeCode ? attMap.get(String(emp.employeeCode).toLowerCase()) : []) ||
      (emp._id ? attMap.get(String(emp._id).toLowerCase()) : []) ||
      [];

    let computed;
    if (saved) {
      computed = {
        presentDays: saved.presentDays ?? 0,
        paidDays: saved.paidDays ?? saved.presentDays ?? 0,
        workingDays: totalDaysInMonth,
        lopDays: saved.lopDays ?? Math.max(0, totalDaysInMonth - (saved.paidDays ?? saved.presentDays ?? 0)),
        earnings: saved.earnings || {},
        deductions: saved.deductions || {},
        netSalary: saved.netSalary ?? 0,
        totalGross: saved.earnings?.totalGross ?? saved.grossSalary ?? 0,
        employerContributions: saved.employerContributions || {},
        isFromSavedRun: true,
      };
    } else {
      const calc = computeEmployeePayrollCalculations({
        emp,
        attendanceList: empAttList,
        statutoryConfig: statutory,
        month,
        totalDaysInMonth,
        salaryComponentsMaster,
        overrides: companyHasAnyAttendance ? {} : {
          // If no attendance records have been entered for this entire company yet,
          // default to standard month for active employees
          paidDays: totalDaysInMonth,
          presentDays: totalDaysInMonth,
          hasAttendance: true,
        },
      });

      computed = {
        presentDays: calc.presentDays,
        paidDays: calc.paidDays,
        workingDays: totalDaysInMonth,
        lopDays: calc.lopDays,
        earnings: {
          basic: calc.earnings?.basic ?? 0,
          vda: calc.earnings?.vda ?? 0,
          hra: calc.earnings?.hra ?? 0,
          conveyance: calc.earnings?.conveyance ?? 0,
          specialAllowance: calc.earnings?.specialAllowance ?? 0,
          otherAllowance: calc.earnings?.otherAllowance ?? 0,
          overtime: calc.earnings?.overtime ?? calc.overtimePay ?? 0,
          totalGross: calc.earnings?.totalGross ?? calc.earnedGross ?? 0,
        },
        deductions: {
          pfEmployee: calc.deductions?.pfEmployee ?? calc.pf ?? 0,
          esiEmployee: calc.deductions?.esiEmployee ?? calc.esi ?? 0,
          pt: calc.deductions?.pt ?? 0,
          tds: calc.deductions?.tds ?? 0,
          lwf: calc.deductions?.lwf ?? 0,
          totalDeductions: calc.totalDeductions ?? 0,
        },
        netSalary: calc.netSalary,
        totalGross: calc.earnings?.totalGross ?? calc.earnedGross ?? 0,
        employerContributions: {
          pfEmployer: calc.deductions?.pfEmployer ?? 0,
          eps: calc.employerContributions?.eps ?? 0,
          edli: calc.employerContributions?.edli ?? 0,
          admin: calc.employerContributions?.admin ?? 0,
          esiEmployer: calc.deductions?.esiEmployer ?? 0,
        },
        isFromSavedRun: false,
      };
    }

    employeeDataMap.set(empIdKey, computed);
    if (emp.employeeCode) employeeDataMap.set(String(emp.employeeCode).toLowerCase(), computed);
    if (emp._id) employeeDataMap.set(String(emp._id).toLowerCase(), computed);
  }

  return {
    statutory,
    salaryComponentsMaster,
    attendanceRecords,
    savedPayroll,
    employeeDataMap,
    totalDaysInMonth,
  };
};
