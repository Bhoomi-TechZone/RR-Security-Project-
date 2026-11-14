import Company from '../models/companyModel.js';
import Employee from '../models/employeeModel.js';
import Notification from '../models/notificationModel.js';
import Announcement from '../models/announcementModel.js';
import { sendGreetingEmail } from './emailService.js';

export const DEFAULT_GREETINGS_CONFIG = {
  birthday: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/8816/8816312.png',
    subject: 'Happy Birthday {{first_name}}!',
    message: `On your special day, we wish you a very Happy Birthday.
Have a wonderful day ahead!

HR Department
{{company_name}}`
  },
  workAnniversary: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3386/3386773.png',
    subject: "You've completed {{work_years}} years with us, {{first_name}}!",
    message: `Congratulations on completing {{work_years}} years with us.
We appreciate your dedication and hard work!

HR Department
{{company_name}}`
  },
  weddingAnniversary: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3656/3656860.png',
    subject: 'Happy Wedding Anniversary {{first_name}}!',
    message: `Wishing you and your partner a lifetime of love, joy, and togetherness!
Happy Wedding Anniversary!

HR Department
{{company_name}}`
  },
  newJoining: {
    enabled: false,
    sendCopyToManagers: false,
    postOnFeed: false,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    subject: 'Welcome to the team, {{first_name}}!',
    message: `A warm welcome to {{company_name}}!
We are thrilled to have you onboard and wish you tremendous success.

HR Department
{{company_name}}`
  }
};

/**
 * Universal Date Parser for standard date strings (YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, ISO, etc.)
 * Intelligently resolves day and month regardless of US or Indian date formatting.
 */
export const parseDateParts = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // 1. Match YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }

  // 2. Match DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, or MM-DD-YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[2], 10);
    const yr = parseInt(match[3], 10);

    // If second number > 12, it must be MM/DD/YYYY (e.g. 11/14/1999)
    if (n2 > 12 && n1 <= 12) {
      return { month: n1, day: n2, year: yr };
    }
    // If first number > 12, it must be DD/MM/YYYY (e.g. 14/11/1999)
    if (n1 > 12 && n2 <= 12) {
      return { day: n1, month: n2, year: yr };
    }
    // If both <= 12, standard JS Date handles MM/DD/YYYY (or fallback to DD/MM)
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    return { day: n1, month: n2, year: yr };
  }

  // 3. Fallback to JS Date
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

const escapeRegex = (string) => {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const designation = data.designation || '';
  const department = data.department || '';
  const managerName = data.managerName || data.reportingSupervisor || 'Manager';
  const spouseName = data.spouseName || '';

  str = str.replace(/\{\{\s*(?:first_name|first\s+name)\s*\}\}/gi, firstName);
  str = str.replace(/\{\{\s*(?:last_name|last\s+name)\s*\}\}/gi, lastName);
  str = str.replace(/\{\{\s*(?:work_years|work\s+years|years)\s*\}\}/gi, workYears);
  str = str.replace(/\{\{\s*(?:company_name|company\s+name|company)\s*\}\}/gi, companyName);
  str = str.replace(/\{\{\s*(?:employee_name|employee\s+name|name)\s*\}\}/gi, data.fullName || firstName);
  str = str.replace(/\{\{\s*(?:designation)\s*\}\}/gi, designation);
  str = str.replace(/\{\{\s*(?:department)\s*\}\}/gi, department);
  str = str.replace(/\{\{\s*(?:manager_name|manager)\s*\}\}/gi, managerName);
  str = str.replace(/\{\{\s*(?:spouse_name|spouse)\s*\}\}/gi, spouseName);
  return str;
};

/**
 * Dynamically resolves an employee's assigned reporting manager / supervisor
 */
export const findEmployeeManager = async (emp, targetCompanyIds = [], adminEmail = '') => {
  if (!emp) return null;
  const supervisor = (emp.reportingSupervisor || emp.reportingManager || '').trim();

  // 1. Direct email provided in reporting field
  if (supervisor && supervisor.includes('@')) {
    return {
      name: supervisor.split('@')[0],
      email: supervisor,
      employeeId: supervisor
    };
  }

  // 2. Query employee table for matching manager name or code
  if (supervisor) {
    try {
      const managerEmp = await Employee.findOne({
        companyId: { $in: targetCompanyIds },
        status: { $regex: /^active$/i },
        $or: [
          { name: { $regex: new RegExp(`^${escapeRegex(supervisor)}$`, 'i') } },
          { employeeId: supervisor },
          { employeeCode: supervisor }
        ]
      }).select('name email employeeId employeeCode mobile designation').lean();

      if (managerEmp) {
        return {
          name: managerEmp.name,
          email: managerEmp.email || '',
          employeeId: managerEmp.employeeId || managerEmp.employeeCode || String(managerEmp._id),
          designation: managerEmp.designation || 'Manager'
        };
      }
    } catch (_) {}
  }

  // 3. Departmental supervisor/manager fallback
  if (emp.department) {
    try {
      const deptManager = await Employee.findOne({
        companyId: { $in: targetCompanyIds },
        department: emp.department,
        status: { $regex: /^active$/i },
        designation: { $regex: /manager|supervisor|lead|incharge/i }
      }).select('name email employeeId employeeCode mobile designation').lean();

      if (deptManager && String(deptManager._id) !== String(emp._id)) {
        return {
          name: deptManager.name,
          email: deptManager.email || '',
          employeeId: deptManager.employeeId || deptManager.employeeCode || String(deptManager._id),
          designation: deptManager.designation || 'Supervisor'
        };
      }
    } catch (_) {}
  }

  // 4. Admin email fallback if company admin exists
  if (adminEmail) {
    return {
      name: 'HR Management',
      email: adminEmail,
      employeeId: 'admin'
    };
  }

  return null;
};

/**
 * Post celebration announcement to the organization feed
 */
export const postGreetingToFeed = async ({
  companyId,
  companyName,
  employeeId,
  employeeName,
  type,
  title,
  message,
  todayIsoDate,
  force = false
}) => {
  try {
    const feedKey = `feed-${type}-${employeeId}-${todayIsoDate}`;
    if (!force) {
      const existing = await Announcement.findOne({
        companyId,
        announcementId: feedKey
      }).lean();

      if (existing) return existing;
    }

    const newAnnouncement = await Announcement.create({
      announcementId: force ? `feed-${type}-${employeeId}-${todayIsoDate}-${Date.now()}` : feedKey,
      companyId,
      title,
      message,
      audience: 'all',
      companyName,
      employeeId,
      employeeName,
      priority: 'normal',
      status: 'published',
      createdBy: 'System Greeting Engine',
      createdDate: todayIsoDate
    });
    return newAnnouncement;
  } catch (err) {
    console.warn(`[GreetingService] Notice posting to organization feed for ${employeeName}:`, err.message);
    return null;
  }
};

/**
 * Get dynamic upcoming celebrations (birthdays, work anniversaries, wedding anniversaries, new joiners)
 */
export const getUpcomingCelebrations = async (companyIds = [], daysAhead = 30) => {
  if (!Array.isArray(companyIds)) {
    companyIds = [companyIds].filter(Boolean);
  }

  const employees = await Employee.find({
    companyId: { $in: companyIds },
    $or: [
      { status: { $regex: /^active$/i } },
      { employeeStatus: { $regex: /^active$/i } },
      { status: { $exists: false } }
    ]
  })
    .select('_id employeeId employeeCode name dob joiningDate weddingAnniversary marriageDate anniversaryDate designation department')
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
          let dateLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : bdayThisYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
          let dateLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : annivThisYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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

    // 3. Wedding Anniversary Check
    const weddingDate = emp.weddingAnniversary || emp.marriageDate || emp.anniversaryDate;
    if (weddingDate) {
      const parsedWedding = parseDateParts(weddingDate);
      if (parsedWedding && parsedWedding.month && parsedWedding.day) {
        let weddingThisYear = new Date(currentYear, parsedWedding.month - 1, parsedWedding.day);
        if (weddingThisYear < todayMidnight) {
          weddingThisYear = new Date(currentYear + 1, parsedWedding.month - 1, parsedWedding.day);
        }

        const diffDays = Math.round((weddingThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= daysAhead) {
          let dateLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : weddingThisYear.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          upcoming.push({
            id: `wed-${emp._id}-${diffDays}`,
            name: empName,
            type: 'wedding',
            label: 'Wedding Anniv.',
            date: dateLabel,
            diffDays,
            designation: emp.designation || 'Staff'
          });
        }
      }
    }

    // 4. New Joining Check (Joining in next 14 days or joined within last 7 days)
    if (emp.joiningDate) {
      const parsedJoining = parseDateParts(emp.joiningDate);
      if (parsedJoining && parsedJoining.year === currentYear) {
        const joinDate = new Date(parsedJoining.year, parsedJoining.month - 1, parsedJoining.day);
        const diffDays = Math.round((joinDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= -7 && diffDays <= 14) {
          let dateLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays === -1 ? 'Yesterday' : joinDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          upcoming.push({
            id: `newjoin-${emp._id}-${diffDays}`,
            name: empName,
            type: 'newJoining',
            label: 'New Joining',
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
  const companyMongoId = String(company._id);
  const targetCompanyIds = [company.companyId, companyMongoId].filter(Boolean);

  const companyName = company.name || company.companyName || 'RR Security & Facilities';
  const adminEmail = company.adminEmail || '';
  const force = Boolean(options.force);

  const savedConfig = company.preferences?.greetingsConfig || {};

  const sanitizeGreetingItem = (key) => {
    const saved = savedConfig[key] || {};
    const def = DEFAULT_GREETINGS_CONFIG[key] || {};
    return {
      enabled: saved.enabled !== undefined ? Boolean(saved.enabled) : def.enabled,
      sendCopyToManagers: saved.sendCopyToManagers !== undefined ? Boolean(saved.sendCopyToManagers) : def.sendCopyToManagers,
      postOnFeed: saved.postOnFeed !== undefined ? Boolean(saved.postOnFeed) : def.postOnFeed,
      sticker: saved.sticker || def.sticker || '',
      subject: saved.subject !== undefined ? String(saved.subject) : def.subject,
      message: saved.message !== undefined ? String(saved.message) : def.message
    };
  };

  const greetingsConfig = {
    birthday: sanitizeGreetingItem('birthday'),
    workAnniversary: sanitizeGreetingItem('workAnniversary'),
    weddingAnniversary: sanitizeGreetingItem('weddingAnniversary'),
    newJoining: sanitizeGreetingItem('newJoining')
  };

  const history = Array.isArray(company.preferences?.greetingsHistory)
    ? [...company.preferences.greetingsHistory]
    : [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayIsoDate = `${currentYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

  // Query employees matching any format of active company association
  const employees = await Employee.find({
    companyId: { $in: targetCompanyIds },
    $or: [
      { status: { $regex: /^active$/i } },
      { employeeStatus: { $regex: /^active$/i } },
      { status: { $exists: false } }
    ]
  }).lean();

  let birthdaySentCount = 0;
  let anniversarySentCount = 0;
  let weddingSentCount = 0;
  let newJoiningSentCount = 0;
  let managerCopiesSent = 0;
  let feedPostsCreated = 0;
  let notificationsCreated = 0;

  for (const emp of employees) {
    const empIdStr = emp.employeeId || emp.employeeCode || String(emp._id);
    const fullName = emp.name || 'Team Member';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Team Member';
    const lastName = nameParts.slice(1).join(' ') || '';
    const allEmpIds = [emp.employeeId, emp.employeeCode, String(emp._id)].filter(Boolean);

    // ====================================================
    // 1. Birthday Greetings Dispatch
    // ====================================================
    if (greetingsConfig.birthday.enabled && emp.dob) {
      const parsedDob = parseDateParts(emp.dob);
      if (parsedDob && parsedDob.month === todayMonth && parsedDob.day === todayDay) {
        const historyKeys = allEmpIds.map(id => `bday_${id}_${currentYear}`);
        const alreadyInHistory = !force && history.some(h => historyKeys.includes(h.key) || (h.type === 'birthday' && allEmpIds.includes(h.employeeId) && h.year === currentYear));

        const existingNotif = !force ? await Notification.findOne({
          companyId: { $in: targetCompanyIds },
          recipientRole: 'employee',
          type: 'birthday',
          $or: [
            { referenceId: { $in: allEmpIds.map(id => `greeting-bday-${id}-${currentYear}`) } },
            { employeeId: { $in: allEmpIds }, date: todayIsoDate },
            { recipientId: { $in: allEmpIds }, date: todayIsoDate }
          ]
        }).lean() : null;

        if (force || (!alreadyInHistory && !existingNotif)) {
          const renderedSubject = renderTemplate(greetingsConfig.birthday.subject, {
            firstName,
            lastName,
            fullName,
            companyName,
            designation: emp.designation,
            department: emp.department
          });

          const renderedMessage = renderTemplate(greetingsConfig.birthday.message, {
            firstName,
            lastName,
            fullName,
            companyName,
            designation: emp.designation,
            department: emp.department
          });

          // A) Dispatch Email to Employee
          if (emp.email) {
            try {
              const mailRes = await sendGreetingEmail({
                to: emp.email,
                employeeName: fullName,
                type: 'birthday',
                subject: renderedSubject,
                message: renderedMessage,
                companyName,
                companyId,
                sticker: greetingsConfig.birthday.sticker
              });
              if (mailRes && mailRes.success) {
                birthdaySentCount++;
              }
            } catch (mailErr) {
              console.warn(`[GreetingService] Error emailing birthday to ${emp.email}:`, mailErr.message);
            }
          }

          // B) Push Notification to Employee's Panel
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
              referenceId: force ? `greeting-bday-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-bday-${empIdStr}-${currentYear}`,
              priority: 'normal',
              status: 'unread',
              date: todayIsoDate
            });
            notificationsCreated++;
          } catch (notifErr) {
            console.warn(`[GreetingService] Error pushing birthday notification to ${empIdStr}:`, notifErr.message);
          }

          // C) Send Copy to Manager if enabled
          if (greetingsConfig.birthday.sendCopyToManagers) {
            try {
              const manager = await findEmployeeManager(emp, targetCompanyIds, adminEmail);
              if (manager) {
                if (manager.email) {
                  const mgrMailRes = await sendGreetingEmail({
                    to: manager.email,
                    employeeName: fullName,
                    type: 'birthday',
                    subject: `[Manager Copy] ${renderedSubject} - ${fullName}`,
                    message: `Celebration Alert for team member ${fullName}:\n\n${renderedMessage}`,
                    companyName,
                    companyId,
                    sticker: greetingsConfig.birthday.sticker,
                    isManagerCopy: true
                  });
                  if (mgrMailRes && mgrMailRes.success) {
                    managerCopiesSent++;
                  }
                }

                await Notification.create({
                  companyId,
                  adminEmail,
                  recipientRole: 'manager',
                  recipientId: manager.employeeId || manager.email || 'manager',
                  type: 'birthday',
                  title: `[Manager Copy] Birthday: ${fullName}`,
                  message: `Today is ${fullName}'s Birthday! Warm wishes were delivered automatically.`,
                  employeeId: empIdStr,
                  employeeName: fullName,
                  targetModule: 'employee-profile',
                  targetUrl: '/employee/profile',
                  referenceId: force ? `greeting-bday-mgr-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-bday-mgr-${empIdStr}-${currentYear}`,
                  priority: 'normal',
                  status: 'unread',
                  date: todayIsoDate
                });
                notificationsCreated++;
              }
            } catch (mgrErr) {
              console.warn(`[GreetingService] Notice sending manager copy for birthday of ${fullName}:`, mgrErr.message);
            }
          }

          // D) Post on Organization Feed if enabled
          if (greetingsConfig.birthday.postOnFeed) {
            const feedRes = await postGreetingToFeed({
              companyId,
              companyName,
              employeeId: empIdStr,
              employeeName: fullName,
              type: 'birthday',
              title: `🎂 Birthday Celebration: Happy Birthday ${fullName}!`,
              message: renderedMessage,
              todayIsoDate,
              force
            });
            if (feedRes) feedPostsCreated++;
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

    // ====================================================
    // 2. Work Anniversary Greetings Dispatch
    // ====================================================
    if (greetingsConfig.workAnniversary.enabled && emp.joiningDate) {
      const parsedJoining = parseDateParts(emp.joiningDate);
      if (parsedJoining && parsedJoining.month === todayMonth && parsedJoining.day === todayDay) {
        const workYears = currentYear - parsedJoining.year;
        if (workYears >= 1) {
          const historyKeys = allEmpIds.map(id => `anniv_${id}_${currentYear}`);
          const alreadyInHistory = !force && history.some(h => historyKeys.includes(h.key) || (h.type === 'workAnniversary' && allEmpIds.includes(h.employeeId) && h.year === currentYear));

          const existingNotif = !force ? await Notification.findOne({
            companyId: { $in: targetCompanyIds },
            recipientRole: 'employee',
            type: 'work-anniversary',
            $or: [
              { referenceId: { $in: allEmpIds.map(id => `greeting-anniv-${id}-${currentYear}`) } },
              { employeeId: { $in: allEmpIds }, date: todayIsoDate },
              { recipientId: { $in: allEmpIds }, date: todayIsoDate }
            ]
          }).lean() : null;

          if (force || (!alreadyInHistory && !existingNotif)) {
            const renderedSubject = renderTemplate(greetingsConfig.workAnniversary.subject, {
              firstName,
              lastName,
              fullName,
              workYears,
              companyName,
              designation: emp.designation,
              department: emp.department
            });

            const renderedMessage = renderTemplate(greetingsConfig.workAnniversary.message, {
              firstName,
              lastName,
              fullName,
              workYears,
              companyName,
              designation: emp.designation,
              department: emp.department
            });

            // A) Dispatch Email to Employee
            if (emp.email) {
              try {
                const mailRes = await sendGreetingEmail({
                  to: emp.email,
                  employeeName: fullName,
                  type: 'workAnniversary',
                  subject: renderedSubject,
                  message: renderedMessage,
                  companyName,
                  workYears,
                  companyId,
                  sticker: greetingsConfig.workAnniversary.sticker
                });
                if (mailRes && mailRes.success) {
                  anniversarySentCount++;
                }
              } catch (mailErr) {
                console.warn(`[GreetingService] Error emailing anniversary to ${emp.email}:`, mailErr.message);
              }
            }

            // B) Push Notification to Employee's Panel
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
                referenceId: force ? `greeting-anniv-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-anniv-${empIdStr}-${currentYear}`,
                priority: 'normal',
                status: 'unread',
                date: todayIsoDate
              });
              notificationsCreated++;
            } catch (notifErr) {
              console.warn(`[GreetingService] Error pushing anniversary notification to ${empIdStr}:`, notifErr.message);
            }

            // C) Send Copy to Manager if enabled
            if (greetingsConfig.workAnniversary.sendCopyToManagers) {
              try {
                const manager = await findEmployeeManager(emp, targetCompanyIds, adminEmail);
                if (manager) {
                  if (manager.email) {
                    const mgrMailRes = await sendGreetingEmail({
                      to: manager.email,
                      employeeName: fullName,
                      type: 'workAnniversary',
                      subject: `[Manager Copy] ${renderedSubject} - ${fullName}`,
                      message: `Celebration Alert: ${fullName} has completed ${workYears} years with ${companyName}!\n\n${renderedMessage}`,
                      companyName,
                      workYears,
                      companyId,
                      sticker: greetingsConfig.workAnniversary.sticker,
                      isManagerCopy: true
                    });
                    if (mgrMailRes && mgrMailRes.success) {
                      managerCopiesSent++;
                    }
                  }

                  await Notification.create({
                    companyId,
                    adminEmail,
                    recipientRole: 'manager',
                    recipientId: manager.employeeId || manager.email || 'manager',
                    type: 'work-anniversary',
                    title: `[Manager Copy] Work Anniversary: ${fullName} (${workYears} Yrs)`,
                    message: `${fullName} has completed ${workYears} year(s) of dedicated service with ${companyName}.`,
                    employeeId: empIdStr,
                    employeeName: fullName,
                    targetModule: 'employee-profile',
                    targetUrl: '/employee/profile',
                    referenceId: force ? `greeting-anniv-mgr-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-anniv-mgr-${empIdStr}-${currentYear}`,
                    priority: 'normal',
                    status: 'unread',
                    date: todayIsoDate
                  });
                  notificationsCreated++;
                }
              } catch (mgrErr) {
                console.warn(`[GreetingService] Notice sending manager copy for work anniversary of ${fullName}:`, mgrErr.message);
              }
            }

            // D) Post on Organization Feed if enabled
            if (greetingsConfig.workAnniversary.postOnFeed) {
              const feedRes = await postGreetingToFeed({
                companyId,
                companyName,
                employeeId: empIdStr,
                employeeName: fullName,
                type: 'workAnniversary',
                title: `🏆 Work Anniversary: Congratulations to ${fullName} on completing ${workYears} years with us!`,
                message: renderedMessage,
                todayIsoDate,
                force
              });
              if (feedRes) feedPostsCreated++;
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

    // ====================================================
    // 3. Wedding Anniversary Greetings Dispatch
    // ====================================================
    const weddingDate = emp.weddingAnniversary || emp.marriageDate || emp.anniversaryDate;
    if (greetingsConfig.weddingAnniversary.enabled && weddingDate) {
      const parsedWedding = parseDateParts(weddingDate);
      if (parsedWedding && parsedWedding.month === todayMonth && parsedWedding.day === todayDay) {
        const historyKeys = allEmpIds.map(id => `wed_${id}_${currentYear}`);
        const alreadyInHistory = !force && history.some(h => historyKeys.includes(h.key) || (h.type === 'weddingAnniversary' && allEmpIds.includes(h.employeeId) && h.year === currentYear));

        const existingNotif = !force ? await Notification.findOne({
          companyId: { $in: targetCompanyIds },
          recipientRole: 'employee',
          type: 'wedding-anniversary',
          $or: [
            { referenceId: { $in: allEmpIds.map(id => `greeting-wed-${id}-${currentYear}`) } },
            { employeeId: { $in: allEmpIds }, date: todayIsoDate },
            { recipientId: { $in: allEmpIds }, date: todayIsoDate }
          ]
        }).lean() : null;

        if (force || (!alreadyInHistory && !existingNotif)) {
          const renderedSubject = renderTemplate(greetingsConfig.weddingAnniversary.subject, {
            firstName,
            lastName,
            fullName,
            companyName,
            spouseName: emp.spouseName || 'partner',
            designation: emp.designation,
            department: emp.department
          });

          const renderedMessage = renderTemplate(greetingsConfig.weddingAnniversary.message, {
            firstName,
            lastName,
            fullName,
            companyName,
            spouseName: emp.spouseName || 'partner',
            designation: emp.designation,
            department: emp.department
          });

          // A) Dispatch Email to Employee
          if (emp.email) {
            try {
              const mailRes = await sendGreetingEmail({
                to: emp.email,
                employeeName: fullName,
                type: 'weddingAnniversary',
                subject: renderedSubject,
                message: renderedMessage,
                companyName,
                companyId,
                sticker: greetingsConfig.weddingAnniversary.sticker
              });
              if (mailRes && mailRes.success) {
                weddingSentCount++;
              }
            } catch (mailErr) {
              console.warn(`[GreetingService] Error emailing wedding anniversary to ${emp.email}:`, mailErr.message);
            }
          }

          // B) Push Notification to Employee's Panel
          try {
            await Notification.create({
              companyId,
              adminEmail,
              recipientRole: 'employee',
              recipientId: empIdStr,
              type: 'wedding-anniversary',
              title: renderedSubject,
              message: renderedMessage,
              employeeId: empIdStr,
              employeeName: fullName,
              targetModule: 'employee-profile',
              targetUrl: '/employee/profile',
              referenceId: force ? `greeting-wed-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-wed-${empIdStr}-${currentYear}`,
              priority: 'normal',
              status: 'unread',
              date: todayIsoDate
            });
            notificationsCreated++;
          } catch (notifErr) {
            console.warn(`[GreetingService] Error pushing wedding anniversary notification to ${empIdStr}:`, notifErr.message);
          }

          // C) Send Copy to Manager if enabled
          if (greetingsConfig.weddingAnniversary.sendCopyToManagers) {
            try {
              const manager = await findEmployeeManager(emp, targetCompanyIds, adminEmail);
              if (manager) {
                if (manager.email) {
                  const mgrMailRes = await sendGreetingEmail({
                    to: manager.email,
                    employeeName: fullName,
                    type: 'weddingAnniversary',
                    subject: `[Manager Copy] ${renderedSubject} - ${fullName}`,
                    message: `Celebration Alert: Today is ${fullName}'s Wedding Anniversary!\n\n${renderedMessage}`,
                    companyName,
                    companyId,
                    sticker: greetingsConfig.weddingAnniversary.sticker,
                    isManagerCopy: true
                  });
                  if (mgrMailRes && mgrMailRes.success) {
                    managerCopiesSent++;
                  }
                }

                await Notification.create({
                  companyId,
                  adminEmail,
                  recipientRole: 'manager',
                  recipientId: manager.employeeId || manager.email || 'manager',
                  type: 'wedding-anniversary',
                  title: `[Manager Copy] Wedding Anniversary: ${fullName}`,
                  message: `Today is ${fullName}'s Wedding Anniversary! Celebratory wishes were sent automatically.`,
                  employeeId: empIdStr,
                  employeeName: fullName,
                  targetModule: 'employee-profile',
                  targetUrl: '/employee/profile',
                  referenceId: force ? `greeting-wed-mgr-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-wed-mgr-${empIdStr}-${currentYear}`,
                  priority: 'normal',
                  status: 'unread',
                  date: todayIsoDate
                });
                notificationsCreated++;
              }
            } catch (mgrErr) {
              console.warn(`[GreetingService] Notice sending manager copy for wedding anniversary of ${fullName}:`, mgrErr.message);
            }
          }

          // D) Post on Organization Feed if enabled
          if (greetingsConfig.weddingAnniversary.postOnFeed) {
            const feedRes = await postGreetingToFeed({
              companyId,
              companyName,
              employeeId: empIdStr,
              employeeName: fullName,
              type: 'weddingAnniversary',
              title: `💐 Wedding Anniversary: Wishing ${fullName} a very Happy Wedding Anniversary!`,
              message: renderedMessage,
              todayIsoDate,
              force
            });
            if (feedRes) feedPostsCreated++;
          }

          // Record in history
          history.push({
            key: `wed_${empIdStr}_${currentYear}`,
            type: 'weddingAnniversary',
            employeeId: empIdStr,
            employeeName: fullName,
            year: currentYear,
            date: todayIsoDate,
            sentAt: new Date()
          });
        }
      }
    }

    // ====================================================
    // 4. New Joining Greetings Dispatch
    // ====================================================
    if (greetingsConfig.newJoining.enabled && emp.joiningDate) {
      const parsedJoining = parseDateParts(emp.joiningDate);
      if (parsedJoining && parsedJoining.year === currentYear && parsedJoining.month === todayMonth && parsedJoining.day === todayDay) {
        const historyKeys = allEmpIds.map(id => `newjoin_${id}_${currentYear}`);
        const alreadyInHistory = !force && history.some(h => historyKeys.includes(h.key) || (h.type === 'newJoining' && allEmpIds.includes(h.employeeId)));

        const existingNotif = !force ? await Notification.findOne({
          companyId: { $in: targetCompanyIds },
          recipientRole: 'employee',
          type: 'new-joining',
          $or: [
            { referenceId: { $in: allEmpIds.map(id => `greeting-newjoin-${id}-${currentYear}`) } },
            { employeeId: { $in: allEmpIds }, date: todayIsoDate },
            { recipientId: { $in: allEmpIds }, date: todayIsoDate }
          ]
        }).lean() : null;

        if (force || (!alreadyInHistory && !existingNotif)) {
          const renderedSubject = renderTemplate(greetingsConfig.newJoining.subject, {
            firstName,
            lastName,
            fullName,
            companyName,
            designation: emp.designation,
            department: emp.department
          });

          const renderedMessage = renderTemplate(greetingsConfig.newJoining.message, {
            firstName,
            lastName,
            fullName,
            companyName,
            designation: emp.designation,
            department: emp.department
          });

          // A) Dispatch Email to Employee
          if (emp.email) {
            try {
              const mailRes = await sendGreetingEmail({
                to: emp.email,
                employeeName: fullName,
                type: 'newJoining',
                subject: renderedSubject,
                message: renderedMessage,
                companyName,
                companyId,
                sticker: greetingsConfig.newJoining.sticker
              });
              if (mailRes && mailRes.success) {
                newJoiningSentCount++;
              }
            } catch (mailErr) {
              console.warn(`[GreetingService] Error emailing new joining greeting to ${emp.email}:`, mailErr.message);
            }
          }

          // B) Push Notification to Employee's Panel
          try {
            await Notification.create({
              companyId,
              adminEmail,
              recipientRole: 'employee',
              recipientId: empIdStr,
              type: 'new-joining',
              title: renderedSubject,
              message: renderedMessage,
              employeeId: empIdStr,
              employeeName: fullName,
              targetModule: 'employee-profile',
              targetUrl: '/employee/profile',
              referenceId: force ? `greeting-newjoin-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-newjoin-${empIdStr}-${currentYear}`,
              priority: 'normal',
              status: 'unread',
              date: todayIsoDate
            });
            notificationsCreated++;
          } catch (notifErr) {
            console.warn(`[GreetingService] Error pushing new joining notification to ${empIdStr}:`, notifErr.message);
          }

          // C) Send Copy to Manager if enabled
          if (greetingsConfig.newJoining.sendCopyToManagers) {
            try {
              const manager = await findEmployeeManager(emp, targetCompanyIds, adminEmail);
              if (manager) {
                if (manager.email) {
                  const mgrMailRes = await sendGreetingEmail({
                    to: manager.email,
                    employeeName: fullName,
                    type: 'newJoining',
                    subject: `[Manager Copy] New Team Member Alert: ${fullName}`,
                    message: `Please welcome our new team member ${fullName} (${emp.designation || 'Staff'}, ${emp.department || 'Operations'}) joining today!\n\n${renderedMessage}`,
                    companyName,
                    companyId,
                    sticker: greetingsConfig.newJoining.sticker,
                    isManagerCopy: true
                  });
                  if (mgrMailRes && mgrMailRes.success) {
                    managerCopiesSent++;
                  }
                }

                await Notification.create({
                  companyId,
                  adminEmail,
                  recipientRole: 'manager',
                  recipientId: manager.employeeId || manager.email || 'manager',
                  type: 'new-joining',
                  title: `[Manager Copy] New Joining: ${fullName}`,
                  message: `${fullName} has joined the team today as ${emp.designation || 'Staff'}.`,
                  employeeId: empIdStr,
                  employeeName: fullName,
                  targetModule: 'employee-profile',
                  targetUrl: '/employee/profile',
                  referenceId: force ? `greeting-newjoin-mgr-${empIdStr}-${currentYear}-${Date.now()}` : `greeting-newjoin-mgr-${empIdStr}-${currentYear}`,
                  priority: 'normal',
                  status: 'unread',
                  date: todayIsoDate
                });
                notificationsCreated++;
              }
            } catch (mgrErr) {
              console.warn(`[GreetingService] Notice sending manager copy for new joining of ${fullName}:`, mgrErr.message);
            }
          }

          // D) Post on Organization Feed if enabled
          if (greetingsConfig.newJoining.postOnFeed) {
            const feedRes = await postGreetingToFeed({
              companyId,
              companyName,
              employeeId: empIdStr,
              employeeName: fullName,
              type: 'newJoining',
              title: `🌟 Warm Welcome: Let's welcome ${fullName} to ${companyName}!`,
              message: renderedMessage,
              todayIsoDate,
              force
            });
            if (feedRes) feedPostsCreated++;
          }

          // Record in history
          history.push({
            key: `newjoin_${empIdStr}_${currentYear}`,
            type: 'newJoining',
            employeeId: empIdStr,
            employeeName: fullName,
            year: currentYear,
            date: todayIsoDate,
            sentAt: new Date()
          });
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
    weddingSentCount,
    newJoiningSentCount,
    managerCopiesSent,
    feedPostsCreated,
    notificationsCreated
  };
};

/**
 * Global Dispatch Engine: Iterates through all active companies and processes today's greetings
 */
export const dispatchAllCompaniesGreetings = async (options = {}) => {
  try {
    const companies = await Company.find({ status: 'Active' });
    const results = [];

    for (const comp of companies) {
      try {
        const res = await dispatchGreetingsForCompany(comp, options);
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
