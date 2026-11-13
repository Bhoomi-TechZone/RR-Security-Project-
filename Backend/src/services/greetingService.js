import Company from '../models/companyModel.js';
import Employee from '../models/employeeModel.js';
import Notification from '../models/notificationModel.js';
import { sendGreetingEmail } from './emailService.js';

export const DEFAULT_GREETINGS_CONFIG = {
  birthday: {
    enabled: true,
    subject: 'Happy Birthday {{first_name}}!',
    message: `Hello {{first_name}},

On your special day, we wish you a very Happy Birthday.
Have a wonderful day ahead!

HR Department
{{company_name}}`
  },
  workAnniversary: {
    enabled: true,
    subject: "You've completed {{work_years}} years with us, {{first_name}}!",
    message: `Hello {{first_name}},

Congratulations on completing {{work_years}} years with us.
We appreciate your dedication and hard work!

HR Department
{{company_name}}`
  }
};

/**
 * Universal Date Parser for standard date strings (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, ISO)
 */
export const parseDateParts = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // Match YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    return {
      day: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      year: parseInt(match[3], 10)
    };
  }

  // Fallback to JS Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    };
  }

  return null;
};

/**
 * Replace dynamic placeholders in subject and message
 */
export const renderTemplate = (template, data = {}) => {
  let str = String(template || '');
  const firstName = data.firstName || (data.fullName ? data.fullName.split(' ')[0] : 'Employee');
  const lastName = data.lastName || (data.fullName ? data.fullName.split(' ').slice(1).join(' ') : '');
  const workYears = data.workYears !== undefined ? String(data.workYears) : '1';
  const companyName = data.companyName || 'RR Security & Facilities';

  str = str.replace(/\{\{\s*(?:first_name|first\s+name)\s*\}\}/gi, firstName);
  str = str.replace(/\{\{\s*(?:last_name|last\s+name)\s*\}\}/gi, lastName);
  str = str.replace(/\{\{\s*(?:work_years|work\s+years|years)\s*\}\}/gi, workYears);
  str = str.replace(/\{\{\s*(?:company_name|company\s+name|company)\s*\}\}/gi, companyName);
  str = str.replace(/\{\{\s*(?:employee_name|employee\s+name|name)\s*\}\}/gi, data.fullName || firstName);
  return str;
};

/**
 * Get dynamic upcoming celebrations (birthdays and work anniversaries) for a company
 */
export const getUpcomingCelebrations = async (companyIds = [], daysAhead = 30) => {
  if (!Array.isArray(companyIds)) {
    companyIds = [companyIds].filter(Boolean);
  }

  const employees = await Employee.find({
    companyId: { $in: companyIds },
    status: { $regex: /^active$/i }
  })
    .select('_id employeeId employeeCode name dob joiningDate designation department')
    .lean();

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = [];

  for (const emp of employees) {
    const empName = emp.name || 'Employee';

    // 1. Birthday Check
    if (emp.dob) {
      const parsedDob = parseDateParts(emp.dob);
      if (parsedDob && parsedDob.month && parsedDob.day) {
        let bdayThisYear = new Date(currentYear, parsedDob.month - 1, parsedDob.day);
        if (bdayThisYear < todayMidnight) {
          bdayThisYear = new Date(currentYear + 1, parsedDob.month - 1, parsedDob.day);
        }

        const diffDays = Math.round((bdayThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= daysAhead) {
          let dateLabel = '';
          if (diffDays === 0) dateLabel = 'Today';
          else if (diffDays === 1) dateLabel = 'Tomorrow';
          else {
            dateLabel = bdayThisYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }

          upcoming.push({
            id: `bday-${emp._id}-${diffDays}`,
            name: empName,
            type: 'birthday',
            label: 'Birthday',
            date: dateLabel,
            diffDays,
            designation: emp.designation || 'Staff'
          });
        }
      }
    }

    // 2. Work Anniversary Check
    if (emp.joiningDate) {
      const parsedJoining = parseDateParts(emp.joiningDate);
      if (parsedJoining && parsedJoining.month && parsedJoining.day) {
        let annivThisYear = new Date(currentYear, parsedJoining.month - 1, parsedJoining.day);
        if (annivThisYear < todayMidnight) {
          annivThisYear = new Date(currentYear + 1, parsedJoining.month - 1, parsedJoining.day);
        }

        const diffDays = Math.round((annivThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        const milestoneYears = annivThisYear.getFullYear() - parsedJoining.year;

        if (diffDays >= 0 && diffDays <= daysAhead && milestoneYears >= 1) {
          let dateLabel = '';
          if (diffDays === 0) dateLabel = 'Today';
          else if (diffDays === 1) dateLabel = 'Tomorrow';
          else {
            dateLabel = annivThisYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          }

          upcoming.push({
            id: `anniv-${emp._id}-${diffDays}`,
            name: empName,
            type: 'work',
            label: `${milestoneYears} Yrs Work Anniv.`,
            date: dateLabel,
            diffDays,
            designation: emp.designation || 'Staff'
          });
        }
      }
    }
  }

  // Sort upcoming events by closest date
  upcoming.sort((a, b) => a.diffDays - b.diffDays);
  return upcoming;
};

/**
 * Dispatch greetings for a single company based on isolated saved preferences
 */
export const dispatchGreetingsForCompany = async (company, options = {}) => {
  if (!company) return { success: false, message: 'Invalid company record' };

  const companyId = company.companyId || String(company._id);
  const companyName = company.name || company.companyName || 'RR Security & Facilities';
  const adminEmail = company.adminEmail || '';

  const savedConfig = company.preferences?.greetingsConfig || {};
  const greetingsConfig = {
    birthday: {
      enabled: savedConfig.birthday?.enabled !== undefined
        ? Boolean(savedConfig.birthday.enabled)
        : DEFAULT_GREETINGS_CONFIG.birthday.enabled,
      subject: savedConfig.birthday?.subject !== undefined
        ? String(savedConfig.birthday.subject)
        : DEFAULT_GREETINGS_CONFIG.birthday.subject,
      message: savedConfig.birthday?.message !== undefined
        ? String(savedConfig.birthday.message)
        : DEFAULT_GREETINGS_CONFIG.birthday.message
    },
    workAnniversary: {
      enabled: savedConfig.workAnniversary?.enabled !== undefined
        ? Boolean(savedConfig.workAnniversary.enabled)
        : DEFAULT_GREETINGS_CONFIG.workAnniversary.enabled,
      subject: savedConfig.workAnniversary?.subject !== undefined
        ? String(savedConfig.workAnniversary.subject)
        : DEFAULT_GREETINGS_CONFIG.workAnniversary.subject,
      message: savedConfig.workAnniversary?.message !== undefined
        ? String(savedConfig.workAnniversary.message)
        : DEFAULT_GREETINGS_CONFIG.workAnniversary.message
    }
  };

  const history = Array.isArray(company.preferences?.greetingsHistory)
    ? [...company.preferences.greetingsHistory]
    : [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayIsoDate = `${currentYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

  const employees = await Employee.find({
    companyId,
    status: { $regex: /^active$/i }
  }).lean();

  let birthdaySentCount = 0;
  let anniversarySentCount = 0;
  let notificationsCreated = 0;

  for (const emp of employees) {
    const empIdStr = emp.employeeId || emp.employeeCode || String(emp._id);
    const fullName = emp.name || 'Team Member';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Team Member';
    const lastName = nameParts.slice(1).join(' ') || '';
    const allEmpIds = [emp.employeeId, emp.employeeCode, String(emp._id)].filter(Boolean);

    // ----------------------------------------------------
    // 1. Birthday Greetings Dispatch
    // ----------------------------------------------------
    if (greetingsConfig.birthday?.enabled && emp.dob) {
      const parsedDob = parseDateParts(emp.dob);
      if (parsedDob && parsedDob.month === todayMonth && parsedDob.day === todayDay) {
        const historyKeys = allEmpIds.map(id => `bday_${id}_${currentYear}`);
        const alreadyInHistory = history.some(h => historyKeys.includes(h.key) || (h.type === 'birthday' && allEmpIds.includes(h.employeeId) && h.year === currentYear));

        // Direct database check on Notification to guarantee 100% idempotency
        const existingNotif = await Notification.findOne({
          companyId,
          recipientRole: 'employee',
          type: 'birthday',
          $or: [
            { referenceId: { $in: allEmpIds.map(id => `greeting-bday-${id}-${currentYear}`) } },
            { employeeId: { $in: allEmpIds }, date: todayIsoDate },
            { recipientId: { $in: allEmpIds }, date: todayIsoDate }
          ]
        }).lean();

        // If ALREADY dispatched for this year/today, DO NOT SEND AGAIN!
        if (!alreadyInHistory && !existingNotif) {
          const renderedSubject = renderTemplate(greetingsConfig.birthday.subject, {
            firstName,
            lastName,
            fullName,
            companyName
          });

          const renderedMessage = renderTemplate(greetingsConfig.birthday.message, {
            firstName,
            lastName,
            fullName,
            companyName
          });

          // A) Dispatch Email to Employee (Sent only once!)
          if (emp.email) {
            try {
              await sendGreetingEmail({
                to: emp.email,
                employeeName: fullName,
                type: 'birthday',
                subject: renderedSubject,
                message: renderedMessage,
                companyName,
                companyId
              });
              birthdaySentCount++;
            } catch (mailErr) {
              console.warn(`[GreetingService] Error emailing birthday greeting to ${emp.email}:`, mailErr.message);
            }
          }

          // B) Push Notification to Employee's Panel (Only once!)
          try {
            await Notification.create({
              companyId,
              adminEmail,
              recipientRole: 'employee',
              recipientId: empIdStr,
              type: 'birthday',
              title: renderedSubject,
              message: renderedMessage,
              employeeId: empIdStr,
              employeeName: fullName,
              targetModule: 'employee-profile',
              targetUrl: '/employee/profile',
              referenceId: `greeting-bday-${empIdStr}-${currentYear}`,
              priority: 'normal',
              status: 'unread',
              date: todayIsoDate
            });
            notificationsCreated++;
          } catch (notifErr) {
            console.warn(`[GreetingService] Error pushing birthday notification to employee ${empIdStr}:`, notifErr.message);
          }

          // Record in history
          history.push({
            key: `bday_${empIdStr}_${currentYear}`,
            type: 'birthday',
            employeeId: empIdStr,
            employeeName: fullName,
            year: currentYear,
            date: todayIsoDate,
            sentAt: new Date()
          });
        }
      }
    }

    // ----------------------------------------------------
    // 2. Work Anniversary Greetings Dispatch
    // ----------------------------------------------------
    if (greetingsConfig.workAnniversary?.enabled && emp.joiningDate) {
      const parsedJoining = parseDateParts(emp.joiningDate);
      if (parsedJoining && parsedJoining.month === todayMonth && parsedJoining.day === todayDay) {
        const workYears = currentYear - parsedJoining.year;
        if (workYears >= 1) {
          const historyKeys = allEmpIds.map(id => `anniv_${id}_${currentYear}`);
          const alreadyInHistory = history.some(h => historyKeys.includes(h.key) || (h.type === 'workAnniversary' && allEmpIds.includes(h.employeeId) && h.year === currentYear));

          // Direct database check on Notification to guarantee 100% idempotency
          const existingNotif = await Notification.findOne({
            companyId,
            recipientRole: 'employee',
            type: 'work-anniversary',
            $or: [
              { referenceId: { $in: allEmpIds.map(id => `greeting-anniv-${id}-${currentYear}`) } },
              { employeeId: { $in: allEmpIds }, date: todayIsoDate },
              { recipientId: { $in: allEmpIds }, date: todayIsoDate }
            ]
          }).lean();

          // If ALREADY dispatched for this year/today, DO NOT SEND AGAIN!
          if (!alreadyInHistory && !existingNotif) {
            const renderedSubject = renderTemplate(greetingsConfig.workAnniversary.subject, {
              firstName,
              lastName,
              fullName,
              workYears,
              companyName
            });

            const renderedMessage = renderTemplate(greetingsConfig.workAnniversary.message, {
              firstName,
              lastName,
              fullName,
              workYears,
              companyName
            });

            // A) Dispatch Email to Employee (Sent only once!)
            if (emp.email) {
              try {
                await sendGreetingEmail({
                  to: emp.email,
                  employeeName: fullName,
                  type: 'workAnniversary',
                  subject: renderedSubject,
                  message: renderedMessage,
                  companyName,
                  workYears,
                  companyId
                });
                anniversarySentCount++;
              } catch (mailErr) {
                console.warn(`[GreetingService] Error emailing anniversary greeting to ${emp.email}:`, mailErr.message);
              }
            }

            // B) Push Notification to Employee's Panel (Only once!)
            try {
              await Notification.create({
                companyId,
                adminEmail,
                recipientRole: 'employee',
                recipientId: empIdStr,
                type: 'work-anniversary',
                title: renderedSubject,
                message: renderedMessage,
                employeeId: empIdStr,
                employeeName: fullName,
                targetModule: 'employee-profile',
                targetUrl: '/employee/profile',
                referenceId: `greeting-anniv-${empIdStr}-${currentYear}`,
                priority: 'normal',
                status: 'unread',
                date: todayIsoDate
              });
              notificationsCreated++;
            } catch (notifErr) {
              console.warn(`[GreetingService] Error pushing anniversary notification to employee ${empIdStr}:`, notifErr.message);
            }

            // Record in history
            history.push({
              key: `anniv_${empIdStr}_${currentYear}`,
              type: 'workAnniversary',
              employeeId: empIdStr,
              employeeName: fullName,
              workYears,
              year: currentYear,
              date: todayIsoDate,
              sentAt: new Date()
            });
          }
        }
      }
    }
  }

  // Keep history manageable (last 500 entries)
  const trimmedHistory = history.slice(-500);

  // Update company record atomically in MongoDB
  await Company.updateOne(
    { _id: company._id },
    {
      $set: {
        'preferences.greetingsHistory': trimmedHistory,
        'preferences.greetingsLastChecked': new Date()
      }
    }
  );

  return {
    success: true,
    companyId,
    companyName,
    birthdaySentCount,
    anniversarySentCount,
    notificationsCreated
  };
};

/**
 * Global Dispatch Engine: Iterates through all active companies and processes today's greetings
 */
export const dispatchAllCompaniesGreetings = async () => {
  try {
    const companies = await Company.find({ status: 'Active' });
    const results = [];

    for (const comp of companies) {
      try {
        const res = await dispatchGreetingsForCompany(comp);
        results.push(res);
      } catch (err) {
        console.warn(`[GreetingService] Error processing company ${comp.name || comp.companyId}:`, err.message);
      }
    }

    return {
      success: true,
      processedCompanies: results.length,
      details: results
    };
  } catch (error) {
    console.error('[GreetingService] Critical failure in dispatchAllCompaniesGreetings:', error);
    return { success: false, error: error.message };
  }
};

