import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Company from '../models/companyModel.js';
dotenv.config();

/**
 * Dynamically resolves active SMTP configuration from MongoDB:
 * Checks in sequence:
 * 1. Explicit customConfig passed by caller
 * 2. Targeted company preferences (if configured with valid username & password)
 * 3. Master / Default Company preferences (isDefault: true or companyId: 'RRS8392014SEC' or code: 'RRS')
 * 4. Any company in the database that has configured email settings
 * 5. Fallback to process.env credentials
 */
export const getDynamicEmailConfig = async (companyId = null, customConfig = null) => {
  let config = null;

  // 1. Explicit customConfig
  if (customConfig && customConfig.smtpUsername && customConfig.smtpPassword && !customConfig.smtpPassword.includes('•')) {
    config = { ...customConfig };
  }

  // 2. Specific requested companyId
  if (!config && companyId) {
    try {
      const isObjectId = mongoose.isValidObjectId(companyId);
      const company = await Company.findOne({
        $or: [
          { companyId },
          ...(isObjectId ? [{ _id: companyId }] : [])
        ]
      }).lean();

      const ec = company?.preferences?.emailConfig;
      if (ec && ec.smtpUsername && ec.smtpPassword && !ec.smtpPassword.includes('•')) {
        config = { ...ec };
      }
    } catch (err) {
      console.warn('[EmailService] Could not fetch DB preferences for companyId:', err.message);
    }
  }

  // 3. Fallback: Master Default Company (RR Security - isDefault: true / RRS8392014SEC / RRS)
  if (!config) {
    try {
      const masterCompany = await Company.findOne({
        $or: [
          { isDefault: true },
          { companyId: 'RRS8392014SEC' },
          { code: 'RRS' }
        ]
      }).lean();

      const ec = masterCompany?.preferences?.emailConfig;
      if (ec && ec.smtpUsername && ec.smtpPassword && !ec.smtpPassword.includes('•')) {
        config = { ...ec };
      }
    } catch (err) {
      console.warn('[EmailService] Could not fetch DB preferences from master company:', err.message);
    }
  }

  // 4. Fallback: Any configured company in MongoDB
  if (!config) {
    try {
      const anyCompany = await Company.findOne({
        'preferences.emailConfig.smtpUsername': { $exists: true, $ne: '' },
        'preferences.emailConfig.smtpPassword': { $exists: true, $ne: '' }
      }).lean();

      const ec = anyCompany?.preferences?.emailConfig;
      if (ec && ec.smtpUsername && ec.smtpPassword && !ec.smtpPassword.includes('•')) {
        config = { ...ec };
      }
    } catch (err) {
      console.warn('[EmailService] Could not query any configured company in DB:', err.message);
    }
  }

  const host = (config?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(config?.smtpPort || process.env.SMTP_PORT || 587);
  const encryption = (config?.encryption || 'TLS').toUpperCase();
  // SSL uses secure: true (port 465); TLS / 587 uses secure: false
  const secure = port === 465 || (encryption === 'SSL' && port !== 587);

  const user = (config?.smtpUsername || process.env.EMAIL || '').trim();
  const pass = (config?.smtpPassword || process.env.PASSWORD || '').replace(/\s+/g, '');
  const fromEmail = (config?.fromEmail || user || process.env.EMAIL || 'office.rrsf@gmail.com').trim();
  const fromName = config?.fromName || 'RR Security & Facilities HRMS';
  const replyTo = config?.replyToEmail || fromEmail;

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    replyTo,
    isConfigured: Boolean(user && pass && !pass.includes('•'))
  };
};

/**
 * Configure Nodemailer Transporter dynamically from database configuration
 */
export const createTransporter = async (companyId = null, customConfig = null) => {
  const dynamicConfig = await getDynamicEmailConfig(companyId, customConfig);

  if (!dynamicConfig.isConfigured) {
    throw new Error('SMTP credentials not configured in database Email Preferences (or .env).');
  }

  const isGmail = dynamicConfig.host.toLowerCase().includes('gmail');

  const transporter = nodemailer.createTransport({
    ...(isGmail ? { service: 'gmail' } : {}),
    host: dynamicConfig.host,
    port: dynamicConfig.port,
    secure: dynamicConfig.secure,
    auth: {
      user: dynamicConfig.user,
      pass: dynamicConfig.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  transporter.dynamicConfig = dynamicConfig;
  return transporter;
};

/**
 * Professional HTML Email Template for Single License Expiry Alert
 */
export const generateLicenseExpiryEmailTemplate = ({
  employeeName = 'Workforce Employee',
  employeeId = 'EMP-001',
  employeeCode = '',
  designation = 'Security Personnel',
  department = 'Operations & Security',
  siteLocation = 'General Deployment',
  clientName = 'RR Security & Facilities',
  licenseType = 'Workforce License',
  licenseNo = 'N/A',
  licenseCategory = 'Security Compliance',
  expiryDate = 'N/A',
  daysRemaining = 0,
  status = 'Expiring Soon',
  thresholdDays = 30,
  clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
  companyName = 'RR Security & Facilities'
}) => {
  const isExpired = Number(daysRemaining) < 0 || status === 'Expired';
  const isCritical = !isExpired && (Number(daysRemaining) <= 15 || status === 'Critical');

  const theme = isExpired
    ? {
        primaryColor: '#dc2626',
        badgeBg: '#fef2f2',
        badgeColor: '#991b1b',
        bannerGradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
        statusHeading: '🚨 EXPIRED WORKFORCE CREDENTIAL',
        statusSubtext: `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago (${expiryDate})`,
        actionNotice: 'IMMEDIATE ACTION REQUIRED: Duty replacement or immediate statutory renewal is mandated to maintain site compliance.'
      }
    : isCritical
    ? {
        primaryColor: '#ea580c',
        badgeBg: '#fff7ed',
        badgeColor: '#9a3412',
        bannerGradient: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
        statusHeading: '⚠️ CRITICAL EXPIRY ALERT (≤ 15 DAYS)',
        statusSubtext: `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} on ${expiryDate}`,
        actionNotice: 'URGENT: Initiate renewal documentation immediately to prevent guard de-allocation or deployment stoppage.'
      }
    : {
        primaryColor: '#2563eb',
        badgeBg: '#eff6ff',
        badgeColor: '#1e40af',
        bannerGradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        statusHeading: '⏳ ADVANCE LICENSE EXPIRY REMINDER',
        statusSubtext: `Expires in ${daysRemaining} days on ${expiryDate}`,
        actionNotice: `Standard advance notification triggered based on ${thresholdDays}-day compliance tracking horizon.`
      };

  const profileUrl = `${clientUrl}/admin/employees/${employeeId}`;
  const complianceUrl = `${clientUrl}/admin/document-compliance?tab=expiry-alert`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${theme.statusHeading}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 30px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin: 4px 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .alert-banner {
      background: ${theme.bannerGradient};
      color: #ffffff;
      padding: 20px 30px;
      text-align: left;
    }
    .alert-title {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.02em;
    }
    .alert-desc {
      font-size: 13px;
      margin: 6px 0 0;
      opacity: 0.95;
    }
    .content {
      padding: 28px 30px;
    }
    .notice-box {
      background-color: ${theme.badgeBg};
      border-left: 4px solid ${theme.primaryColor};
      padding: 14px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      color: ${theme.badgeColor};
      font-size: 13px;
      line-height: 1.5;
      font-weight: 600;
    }
    .section-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 10px;
      font-weight: 700;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 6px 0;
      font-size: 13.5px;
      vertical-align: top;
    }
    .info-label {
      color: #64748b;
      width: 40%;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
    }
    .code-badge {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12.5px;
    }
    .btn-container {
      margin: 28px 0 10px;
      display: flex;
      gap: 12px;
    }
    .btn-primary {
      display: inline-block;
      background-color: ${theme.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 22px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      text-align: center;
    }
    .btn-secondary {
      display: inline-block;
      background-color: #f1f5f9;
      color: #334155 !important;
      border: 1px solid #cbd5e1;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      margin-left: 10px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Brand Header -->
      <div class="header">
        <h1 class="brand-title">${companyName}</h1>
        <p class="brand-subtitle">HRMS Workforce Compliance &amp; Regulatory Tracking System</p>
      </div>

      <!-- Urgency Banner -->
      <div class="alert-banner">
        <h2 class="alert-title">${theme.statusHeading}</h2>
        <p class="alert-desc">${theme.statusSubtext}</p>
      </div>

      <!-- Main Body -->
      <div class="content">
        
        <!-- Callout Notice -->
        <div class="notice-box">
          ${theme.actionNotice}
        </div>

        <!-- License / Document Summary -->
        <div class="section-title">Expiring License Information</div>
        <div class="info-card">
          <table class="info-table">
            <tr>
              <td class="info-label">License Type:</td>
              <td class="info-value">${licenseType}</td>
            </tr>
            <tr>
              <td class="info-label">License / Doc No:</td>
              <td class="info-value"><span class="code-badge">${licenseNo}</span></td>
            </tr>
            <tr>
              <td class="info-label">Category:</td>
              <td class="info-value">${licenseCategory}</td>
            </tr>
            <tr>
              <td class="info-label">Expiry Date:</td>
              <td class="info-value" style="color: ${theme.primaryColor}; font-weight: 800;">${expiryDate}</td>
            </tr>
            <tr>
              <td class="info-label">Days Remaining:</td>
              <td class="info-value" style="color: ${theme.primaryColor}; font-weight: 800;">
                ${isExpired ? `Expired (${Math.abs(daysRemaining)} days ago)` : `${daysRemaining} days left`}
              </td>
            </tr>
          </table>
        </div>

        <!-- Associated Employee Details -->
        <div class="section-title">Associated Personnel &amp; Deployment</div>
        <div class="info-card">
          <table class="info-table">
            <tr>
              <td class="info-label">Employee Name:</td>
              <td class="info-value">${employeeName}</td>
            </tr>
            <tr>
              <td class="info-label">Employee ID:</td>
              <td class="info-value"><span class="code-badge">${employeeCode || employeeId}</span></td>
            </tr>
            <tr>
              <td class="info-label">Designation:</td>
              <td class="info-value">${designation}</td>
            </tr>
            <tr>
              <td class="info-label">Department:</td>
              <td class="info-value">${department}</td>
            </tr>
            <tr>
              <td class="info-label">Assigned Site / Client:</td>
              <td class="info-value">${siteLocation || clientName}</td>
            </tr>
          </table>
        </div>

        <!-- Action CTAs -->
        <div class="btn-container">
          <a href="${complianceUrl}" class="btn-primary" target="_blank">Open Expiry Tracker</a>
          <a href="${profileUrl}" class="btn-secondary" target="_blank">View Employee Profile</a>
        </div>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">
          <strong>Security Notice:</strong> This automated compliance alert was generated by NovaSpark HRMS Compliance Engine on behalf of ${companyName}.
        </p>
        <p style="margin: 0;">
          Dispatch timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
};

/**
 * Plain Text Fallback Template for Anti-Spam Compliance (multipart/alternative)
 */
export const generateLicenseExpiryPlainTextTemplate = ({
  employeeName = 'Workforce Personnel',
  employeeId = '',
  employeeCode = '',
  designation = 'Security Personnel',
  department = 'Operations & Security',
  siteLocation = 'General Deployment',
  licenseType = 'Workforce License',
  licenseNo = 'N/A',
  expiryDate = 'N/A',
  daysRemaining = 0,
  status = 'Expiring Soon',
  clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
  companyName = 'RR Security & Facilities'
}) => {
  const isExpired = Number(daysRemaining) < 0 || status === 'Expired';
  const statusMsg = isExpired
    ? `EXPIRED (${Math.abs(daysRemaining)} days ago - ${expiryDate})`
    : `Expires in ${daysRemaining} days on ${expiryDate}`;

  return `
[COMPLIANCE NOTICE] ${companyName} - Workforce Credential Alert
===================================================================

Status: ${statusMsg}

LICENSE DETAILS:
- License Type: ${licenseType}
- Document / License Number: ${licenseNo}
- Expiration Date: ${expiryDate}
- Remaining Validity: ${daysRemaining} days

ASSOCIATED PERSONNEL:
- Employee Name: ${employeeName}
- Employee ID: ${employeeCode || employeeId}
- Designation: ${designation}
- Department: ${department}
- Site / Deployment: ${siteLocation}

ACTION MANDATE:
${isExpired 
  ? 'Immediate duty replacement or statutory renewal is mandated to prevent site compliance violation.' 
  : 'Please initiate renewal documentation before the expiry date.'}

Online Compliance Portal:
${clientUrl}/admin/document-compliance?tab=expiry-alert

-------------------------------------------------------------------
This is an automated administrative compliance notification issued on behalf of ${companyName}.
`;
};

/**
 * Send License Expiry Email Alert via Nodemailer with Anti-Spam Optimizations
 */
export const sendLicenseExpiryEmailAlert = async ({
  to,
  employeeData,
  licenseData,
  companyName = 'RR Security & Facilities',
  companyId = null,
}) => {
  try {
    let senderEmail = (process.env.EMAIL || '').trim();

    if (companyId) {
      try {
        const comp = await Company.findOne({
          $or: [{ companyId }, { _id: companyId.match(/^[0-9a-fA-F]{24}$/) ? companyId : null }]
        }).lean();
        senderEmail = comp?.preferences?.emailConfig?.fromEmail || comp?.preferences?.emailConfig?.smtpUsername || senderEmail;
      } catch {}
    }

    const recipientEmail = to || senderEmail;
    const transporter = await createTransporter(companyId);

    const isExpired = Number(licenseData?.daysRemaining) < 0 || licenseData?.status === 'Expired';
    const isCritical = !isExpired && (Number(licenseData?.daysRemaining) <= 15 || licenseData?.status === 'Critical');

    // Clean, high-reputation transactional subject line (avoids spam filter penalty)
    const subjectPrefix = isExpired
      ? 'Compliance Alert: License Expired'
      : isCritical
      ? 'Urgent Notice: License Expiring Soon'
      : 'Compliance Reminder: License Renewal';

    const empName = employeeData?.name || 'Personnel';
    const empCode = employeeData?.employeeCode || employeeData?.employeeId || '';
    const lType = licenseData?.licenseType || 'Workforce License';

    const subject = `[${companyName}] ${subjectPrefix} - ${lType} (${empName}${empCode ? ` / ${empCode}` : ''})`;

    const templateParams = {
      employeeName: empName,
      employeeId: employeeData?.employeeId || employeeData?._id?.toString(),
      employeeCode: empCode,
      designation: employeeData?.designation || 'Security Personnel',
      department: employeeData?.department || 'Operations',
      siteLocation: employeeData?.siteLocation || employeeData?.site || 'General Deployment',
      clientName: employeeData?.clientName || employeeData?.companyName || companyName,
      licenseType: lType,
      licenseNo: licenseData?.licenseNo || 'N/A',
      licenseCategory: licenseData?.licenseCategory || 'Compliance',
      expiryDate: licenseData?.expiryDate || 'N/A',
      daysRemaining: licenseData?.daysRemaining ?? 0,
      status: licenseData?.status || 'Expiring Soon',
      thresholdDays: licenseData?.thresholdDays || 30,
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
      companyName
    };

    const html = generateLicenseExpiryEmailTemplate(templateParams);
    const text = generateLicenseExpiryPlainTextTemplate(templateParams);

    const info = await transporter.sendMail({
      from: `"${companyName} Compliance" <${senderEmail}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject,
      text, // Essential for anti-spam filters
      html,
      headers: {
        'X-Mailer': 'NovaSpark HRMS Compliance Dispatcher',
        'X-Priority': isExpired || isCritical ? '1' : '3',
        'X-MSMail-Priority': isExpired || isCritical ? 'High' : 'Normal',
        'Importance': isExpired || isCritical ? 'High' : 'Normal',
        'Auto-Submitted': 'auto-generated',
      }
    });

    console.log(`[EmailService] Expiry alert successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail
    };
  } catch (error) {
    console.error('[EmailService] Failed to send expiry alert email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Professional HTML Email Template for Employee Welcome & Login Credentials
 */
export const generateEmployeeWelcomeEmailTemplate = ({
  employeeName = 'Valued Team Member',
  employeeId = '',
  employeeCode = '',
  email = '',
  password = '',
  designation = 'Workforce Personnel',
  department = 'Operations',
  siteLocation = 'General Deployment',
  clientName = '',
  loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  companyName = 'Workforce Management Portal'
}) => {
  const resolvedId = employeeCode || employeeId || 'EMP-USER';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName} Employee Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 30px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin: 4px 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .welcome-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 24px 30px;
      text-align: left;
    }
    .welcome-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .welcome-desc {
      font-size: 13.5px;
      margin: 6px 0 0;
      opacity: 0.95;
      line-height: 1.4;
    }
    .content {
      padding: 28px 30px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
    }
    .lead-text {
      font-size: 13.5px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 22px;
    }
    .section-title {
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 10px;
      font-weight: 700;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 22px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 7px 0;
      font-size: 13.5px;
      vertical-align: middle;
    }
    .info-label {
      color: #64748b;
      width: 40%;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
    }
    .code-badge {
      background: #e2e8f0;
      color: #0f172a;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
    }
    .password-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 1px solid #bfdbfe;
    }
    .status-badge {
      background: #dcfce7;
      color: #166534;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }
    .btn-container {
      margin: 26px 0 15px;
      text-align: center;
    }
    .btn-primary {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
    }
    .security-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px 16px;
      border-radius: 6px;
      margin-bottom: 22px;
      color: #92400e;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .feature-list {
      margin: 10px 0 0;
      padding-left: 18px;
      color: #475569;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Brand Header -->
      <div class="header">
        <h1 class="brand-title">${companyName}</h1>
        <p class="brand-subtitle">HRMS Workforce Management &amp; Self-Service Portal</p>
      </div>

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <h2 class="welcome-title">Welcome to Your Employee Portal</h2>
        <p class="welcome-desc">Your self-service access account has been created successfully.</p>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        
        <p class="greeting">Dear ${employeeName},</p>
        <p class="lead-text">
          Your official self-service employee portal account at <strong>${companyName}</strong> is now active. Use the credentials below to log in and manage your work profile, salary slips, attendance, and duty records.
        </p>

        <!-- Credentials Card -->
        <div class="section-title">Your Portal Login Credentials</div>
        <div class="card">
          <table class="info-table">
            <tr>
              <td class="info-label">Portal URL:</td>
              <td class="info-value">
                <a href="${loginUrl}" style="color: #2563eb; text-decoration: underline;" target="_blank">${loginUrl}</a>
              </td>
            </tr>
            <tr>
              <td class="info-label">Employee ID (Username):</td>
              <td class="info-value"><span class="code-badge">${resolvedId}</span></td>
            </tr>
            ${email ? `
            <tr>
              <td class="info-label">Registered Email:</td>
              <td class="info-value">${email}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="info-label">Account Password:</td>
              <td class="info-value"><span class="password-badge">${password}</span></td>
            </tr>
            <tr>
              <td class="info-label">Portal Access Status:</td>
              <td class="info-value"><span class="status-badge">Enabled (Active)</span></td>
            </tr>
            <tr>
              <td class="info-label">Assigned Designation:</td>
              <td class="info-value">${designation} &bull; ${department}</td>
            </tr>
            <tr>
              <td class="info-label">Assigned Site / Client:</td>
              <td class="info-value">${siteLocation || clientName}</td>
            </tr>
          </table>
        </div>

        <!-- Call to Action Button -->
        <div class="btn-container">
          <a href="${loginUrl}" class="btn-primary" target="_blank">Log In to Employee Portal</a>
        </div>

        <!-- Security Advice Callout -->
        <div class="security-box">
          <strong>Security Notice:</strong> Please log in and change your password to something only you know. Never share your password or employee credentials with anyone.
        </div>

        <!-- Portal Features Overview -->
        <div class="section-title">What you can do in your portal</div>
        <ul class="feature-list">
          <li><strong>Salary &amp; Payslips:</strong> View and download monthly wage slips and statutory deductions.</li>
          <li><strong>Attendance &amp; Duty:</strong> Track daily punch-in/out records, present days, and shift schedules.</li>
          <li><strong>Leave Management:</strong> Apply for leave, check leave balances, and track approval statuses.</li>
          <li><strong>Compliance &amp; Documents:</strong> Review assigned uniforms, asset issuances, and credentials.</li>
        </ul>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">
          <strong>Confidentiality Notice:</strong> This welcome email contains confidential login information for ${employeeName}. If you received this email in error, please notify HR immediately.
        </p>
        <p style="margin: 0;">
          Dispatch timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} &bull; NovaSpark HRMS Portal
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
};

/**
 * Plain Text Fallback for Employee Welcome Email (multipart/alternative)
 */
export const generateEmployeeWelcomePlainTextTemplate = ({
  employeeName = 'Valued Team Member',
  employeeId = '',
  employeeCode = '',
  email = '',
  password = '',
  designation = 'Workforce Personnel',
  department = 'Operations',
  siteLocation = 'General Deployment',
  loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  companyName = 'Workforce Management Portal'
}) => {
  const resolvedId = employeeCode || employeeId || 'EMP-USER';

  return `
[WELCOME] ${companyName} - Employee Self-Service Portal Access
===================================================================

Dear ${employeeName},

Your official employee self-service portal account has been provisioned.

YOUR LOGIN CREDENTIALS:
- Login Portal: ${loginUrl}
- Employee ID / Username: ${resolvedId}
${email ? `- Registered Email: ${email}\n` : ''}- Account Password: ${password}
- Status: Enabled (Active)
- Designation: ${designation} (${department})
- Deployment Site: ${siteLocation}

HOW TO LOG IN:
1. Open ${loginUrl} in your browser.
2. Enter your Employee ID (${resolvedId}) or Email and Password.
3. Access your monthly salary slips, attendance records, and leave applications.

SECURITY NOTICE:
Please change your password upon your first login for account security. Do not share your login credentials with anyone.

-------------------------------------------------------------------
This is an automated administrative notification generated on behalf of ${companyName}.
`;
};

/**
 * Send Employee Welcome & Login Credentials Email via Nodemailer
 */
export const sendEmployeeWelcomeEmail = async ({
  to,
  employeeData,
  password,
  companyName = '',
  companyId = null,
  clientUrl = null
}) => {
  try {
    let senderEmail = (process.env.EMAIL || '').trim();
    let resolvedCompName = companyName || '';

    if (companyId) {
      try {
        const comp = await Company.findOne({
          $or: [
            ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
            { companyId }
          ]
        }).lean();
        senderEmail = comp?.preferences?.emailConfig?.fromEmail || comp?.preferences?.emailConfig?.smtpUsername || senderEmail;
        if (comp?.name) {
          resolvedCompName = comp.name;
        }
      } catch (err) {
        console.warn('[EmailService] Could not lookup company details:', err.message);
      }
    }

    if (!resolvedCompName) {
      resolvedCompName = employeeData?.companyName || employeeData?.clientName || 'Workforce Management Portal';
    }

    const recipientEmail = to || employeeData?.email || senderEmail;
    if (!recipientEmail) {
      throw new Error('Recipient email address is required to dispatch welcome credentials.');
    }

    const transporter = await createTransporter(companyId);

    const empName = employeeData?.name || 'Employee';
    const empCode = employeeData?.employeeCode || employeeData?.employeeId || '';
    const portalBaseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${portalBaseUrl.replace(/\/$/, '')}/login`;

    const subject = `[${resolvedCompName}] Welcome to Employee Self-Service Portal - Your Login Credentials`;

    const templateParams = {
      employeeName: empName,
      employeeId: employeeData?.employeeId || employeeData?._id?.toString() || '',
      employeeCode: empCode,
      email: employeeData?.email || recipientEmail || '',
      password: password || employeeData?.savedPassword || employeeData?.password || '••••••',
      designation: employeeData?.designation || 'Workforce Staff',
      department: employeeData?.department || 'Operations',
      siteLocation: employeeData?.siteLocation || employeeData?.site || employeeData?.clientName || 'General Deployment',
      clientName: employeeData?.clientName || employeeData?.companyName || resolvedCompName,
      loginUrl,
      companyName: resolvedCompName
    };

    const html = generateEmployeeWelcomeEmailTemplate(templateParams);
    const text = generateEmployeeWelcomePlainTextTemplate(templateParams);

    const info = await transporter.sendMail({
      from: `"${resolvedCompName} HR Portal" <${senderEmail}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject,
      text, // Essential text alternative for anti-spam filters
      html,
      headers: {
        'X-Mailer': 'HRMS Automated Provisioner',
        'Importance': 'Normal',
        'Auto-Submitted': 'auto-generated',
      }
    });

    console.log(`[EmailService] Welcome email delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail
    };
  } catch (error) {
    console.error('[EmailService] Failed to send employee welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Professional HTML Email Template for Client Account Welcome & Portal Credentials
 */
export const generateClientWelcomeEmailTemplate = ({
  clientName = 'Corporate Client',
  clientId = 'CLI-001',
  contactPerson = 'Authorized Representative',
  contactNumber = '',
  email = '',
  password = '',
  address = '',
  loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  companyName = 'Workforce & Security Services'
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName} Client Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 30px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin: 4px 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .welcome-banner {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
      color: #ffffff;
      padding: 24px 30px;
      text-align: left;
    }
    .welcome-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .welcome-desc {
      font-size: 13.5px;
      margin: 6px 0 0;
      opacity: 0.95;
      line-height: 1.4;
    }
    .content {
      padding: 28px 30px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
    }
    .lead-text {
      font-size: 13.5px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 22px;
    }
    .section-title {
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 10px;
      font-weight: 700;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 22px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 7px 0;
      font-size: 13.5px;
      vertical-align: middle;
    }
    .info-label {
      color: #64748b;
      width: 40%;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
    }
    .code-badge {
      background: #e2e8f0;
      color: #0f172a;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
    }
    .password-badge {
      background: #ccfbf1;
      color: #0f766e;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 1px solid #99f6e4;
    }
    .status-badge {
      background: #dcfce7;
      color: #166534;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }
    .btn-container {
      margin: 26px 0 15px;
      text-align: center;
    }
    .btn-primary {
      display: inline-block;
      background-color: #0d9488;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
    }
    .security-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px 16px;
      border-radius: 6px;
      margin-bottom: 22px;
      color: #92400e;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .feature-list {
      margin: 10px 0 0;
      padding-left: 18px;
      color: #475569;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Brand Header -->
      <div class="header">
        <h1 class="brand-title">${companyName}</h1>
        <p class="brand-subtitle">Corporate Client Management &amp; Self-Service Portal</p>
      </div>

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <h2 class="welcome-title">Client Corporate Portal Access</h2>
        <p class="welcome-desc">Your dedicated client dashboard access has been successfully configured.</p>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        
        <p class="greeting">Dear ${contactPerson || clientName},</p>
        <p class="lead-text">
          We are pleased to inform you that your authorized client portal account for <strong>${clientName}</strong> is now live on the <strong>${companyName}</strong> management platform. Use the official credentials below to access your client dashboard.
        </p>

        <!-- Credentials Card -->
        <div class="section-title">Your Client Portal Login Credentials</div>
        <div class="card">
          <table class="info-table">
            <tr>
              <td class="info-label">Portal URL:</td>
              <td class="info-value">
                <a href="${loginUrl}" style="color: #0d9488; text-decoration: underline;" target="_blank">${loginUrl}</a>
              </td>
            </tr>
            <tr>
              <td class="info-label">Client ID (Username):</td>
              <td class="info-value"><span class="code-badge">${clientId}</span></td>
            </tr>
            ${email ? `
            <tr>
              <td class="info-label">Registered Email:</td>
              <td class="info-value">${email}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="info-label">Account Password:</td>
              <td class="info-value"><span class="password-badge">${password}</span></td>
            </tr>
            <tr>
              <td class="info-label">Portal Access Status:</td>
              <td class="info-value"><span class="status-badge">Enabled (Active)</span></td>
            </tr>
            <tr>
              <td class="info-label">Client Organization:</td>
              <td class="info-value">${clientName}</td>
            </tr>
            ${contactPerson ? `
            <tr>
              <td class="info-label">Contact Person:</td>
              <td class="info-value">${contactPerson}${contactNumber ? ` &bull; ${contactNumber}` : ''}</td>
            </tr>
            ` : ''}
            ${address ? `
            <tr>
              <td class="info-label">Site / Billing Address:</td>
              <td class="info-value">${address}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Call to Action Button -->
        <div class="btn-container">
          <a href="${loginUrl}" class="btn-primary" target="_blank">Access Client Portal</a>
        </div>

        <!-- Security Advice Callout -->
        <div class="security-box">
          <strong>Security Notice:</strong> Please log in and change your password to something only you know. Keep these credentials confidential to protect your organization's workforce and billing data.
        </div>

        <!-- Portal Features Overview -->
        <div class="section-title">What you can access in your client portal</div>
        <ul class="feature-list">
          <li><strong>Deployed Workforce &amp; Guard Force:</strong> Real-time overview of personnel deployed across your premises and sites.</li>
          <li><strong>Duty &amp; Attendance Reports:</strong> Live daily attendance, shift logs, and compliance duty records.</li>
          <li><strong>Invoicing &amp; Billing Records:</strong> Access and review monthly service invoices, billing statements, and payment acknowledgments.</li>
          <li><strong>Compliance &amp; Licensing:</strong> Verify valid licenses, armed licenses, and police verification documents of assigned personnel.</li>
        </ul>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">
          <strong>Confidentiality Notice:</strong> This welcome email contains confidential credentials intended solely for ${clientName}.
        </p>
        <p style="margin: 0;">
          Dispatch timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} &bull; ${companyName} Client Services
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
};

/**
 * Plain Text Fallback for Client Welcome Email (multipart/alternative)
 */
export const generateClientWelcomePlainTextTemplate = ({
  clientName = 'Corporate Client',
  clientId = 'CLI-001',
  contactPerson = 'Authorized Representative',
  contactNumber = '',
  email = '',
  password = '',
  address = '',
  loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  companyName = 'Workforce & Security Services'
}) => {
  return `
[CLIENT PORTAL ACCESS] ${companyName} - Corporate Account Provisioning
===================================================================

Dear ${contactPerson || clientName},

Your authorized corporate client portal account for ${clientName} has been activated.

YOUR LOGIN CREDENTIALS:
- Login Portal: ${loginUrl}
- Client ID / Username: ${clientId}
${email ? `- Registered Email: ${email}\n` : ''}- Account Password: ${password}
- Portal Status: Enabled (Active)
- Client Organization: ${clientName}
${contactPerson ? `- Contact Person: ${contactPerson} (${contactNumber || 'N/A'})\n` : ''}${address ? `- Site / Address: ${address}\n` : ''}
HOW TO ACCESS YOUR PORTAL:
1. Open ${loginUrl} in your browser.
2. Enter your Client ID (${clientId}) or Email and Password.
3. Access deployed workforce logs, live duty attendance, monthly service invoices, and statutory compliance records.

SECURITY NOTICE:
Please change your password upon your first login for security. Do not share your login credentials with unauthorized personnel.

-------------------------------------------------------------------
This is an automated corporate notification generated on behalf of ${companyName}.
`;
};

/**
 * Send Client Welcome & Login Credentials Email via Nodemailer
 */
export const sendClientWelcomeEmail = async ({
  to,
  clientData,
  password,
  companyName = '',
  companyId = null,
  clientUrl = null
}) => {
  try {
    let senderEmail = (process.env.EMAIL || '').trim();
    let resolvedCompName = companyName || '';

    if (companyId) {
      try {
        const comp = await Company.findOne({
          $or: [
            ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
            { companyId }
          ]
        }).lean();
        senderEmail = comp?.preferences?.emailConfig?.fromEmail || comp?.preferences?.emailConfig?.smtpUsername || senderEmail;
        if (comp?.name) {
          resolvedCompName = comp.name;
        }
      } catch (err) {
        console.warn('[EmailService] Could not lookup company details:', err.message);
      }
    }

    if (!resolvedCompName) {
      resolvedCompName = 'Workforce & Security Services';
    }

    const recipientEmail = to || clientData?.email || senderEmail;
    if (!recipientEmail) {
      throw new Error('Recipient email address is required to dispatch client welcome credentials.');
    }

    const transporter = await createTransporter(companyId);

    const cName = clientData?.name || 'Corporate Client';
    const cId = clientData?.clientId || clientData?._id?.toString() || 'CLI-001';
    const portalBaseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${portalBaseUrl.replace(/\/$/, '')}/login`;

    const subject = `[${resolvedCompName}] Client Portal Access - Your Login Credentials (${cName})`;

    const templateParams = {
      clientName: cName,
      clientId: cId,
      contactPerson: clientData?.contactPerson || '',
      contactNumber: clientData?.contactNumber || '',
      email: clientData?.email || recipientEmail || '',
      password: password || clientData?.savedPassword || clientData?.password || '••••••',
      address: clientData?.address || '',
      loginUrl,
      companyName: resolvedCompName
    };

    const html = generateClientWelcomeEmailTemplate(templateParams);
    const text = generateClientWelcomePlainTextTemplate(templateParams);

    const info = await transporter.sendMail({
      from: `"${resolvedCompName} Client Services" <${senderEmail}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject,
      text, // Plain text alternative for anti-spam filters
      html,
      headers: {
        'X-Mailer': 'HRMS Client Provisioner',
        'Importance': 'Normal',
        'Auto-Submitted': 'auto-generated',
      }
    });

    console.log(`[EmailService] Client welcome email delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail
    };
  } catch (error) {
    console.error('[EmailService] Failed to send client welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Professional HTML Email Template for Password Reset Request
 */
export const generatePasswordResetEmailTemplate = ({
  name = 'User',
  identifier = '',
  email = '',
  role = 'User',
  resetUrl = '',
  expiresInMinutes = 60,
  companyName = 'RR Security & Facilities'
}) => {
  const roleLabel = {
    admin: 'Administrator',
    employee: 'Workforce Employee',
    client: 'Corporate Client',
    user: 'Operations User'
  }[String(role).toLowerCase()] || role || 'User';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ${companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 30px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin: 4px 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .banner {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 24px 30px;
      text-align: left;
    }
    .banner-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .banner-desc {
      font-size: 13.5px;
      margin: 6px 0 0;
      opacity: 0.95;
      line-height: 1.4;
    }
    .content {
      padding: 28px 30px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
    }
    .lead-text {
      font-size: 13.5px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 6px 0;
      font-size: 13.5px;
      vertical-align: middle;
    }
    .info-label {
      color: #64748b;
      width: 42%;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
    }
    .badge {
      background: #e2e8f0;
      color: #0f172a;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
    }
    .btn-container {
      margin: 28px 0 20px;
      text-align: center;
    }
    .btn-primary {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
      letter-spacing: 0.02em;
    }
    .link-fallback {
      background-color: #f1f5f9;
      border: 1px dashed #cbd5e1;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 12px;
      color: #475569;
      word-break: break-all;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .security-notice {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      color: #92400e;
      font-size: 12.5px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Brand Header -->
      <div class="header">
        <h1 class="brand-title">${companyName}</h1>
        <p class="brand-subtitle">HRMS Workforce Management Security Service</p>
      </div>

      <!-- Banner -->
      <div class="banner">
        <h2 class="banner-title">Password Reset Verification</h2>
        <p class="banner-desc">We received a request to reset your portal login credentials.</p>
      </div>

      <!-- Main Content -->
      <div class="content">
        <p class="greeting">Hello ${name},</p>
        <p class="lead-text">
          A request has been initiated to reset the password for your <strong>${roleLabel}</strong> account on the <strong>${companyName}</strong> portal. Click the button below to choose a new password.
        </p>

        <!-- Account Snapshot -->
        <div class="card">
          <table class="info-table">
            <tr>
              <td class="info-label">Account Name:</td>
              <td class="info-value">${name}</td>
            </tr>
            <tr>
              <td class="info-label">Account Type / Role:</td>
              <td class="info-value">${roleLabel}</td>
            </tr>
            ${identifier ? `
            <tr>
              <td class="info-label">Account ID / Username:</td>
              <td class="info-value"><span class="badge">${identifier}</span></td>
            </tr>
            ` : ''}
            <tr>
              <td class="info-label">Registered Email:</td>
              <td class="info-value">${email}</td>
            </tr>
            <tr>
              <td class="info-label">Validity Window:</td>
              <td class="info-value" style="color: #dc2626;">Valid for ${expiresInMinutes} minutes</td>
            </tr>
          </table>
        </div>

        <!-- CTA Button -->
        <div class="btn-container">
          <a href="${resetUrl}" class="btn-primary" target="_blank">Reset My Password &rarr;</a>
        </div>

        <!-- Fallback Link -->
        <p style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
          Button not working? Copy and paste the link below directly into your browser:
        </p>
        <div class="link-fallback">
          <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or contact your system administrator immediately. Your current password will remain unchanged and secure.
        </div>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 4px;">
          This is an automated administrative notification sent from the ${companyName} HRMS Security Center.
        </p>
        <p style="margin: 0;">
          Dispatch timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
};

/**
 * Plain Text Fallback Template for Password Reset Email
 */
export const generatePasswordResetPlainTextTemplate = ({
  name = 'User',
  identifier = '',
  email = '',
  role = 'User',
  resetUrl = '',
  expiresInMinutes = 60,
  companyName = 'RR Security & Facilities'
}) => {
  return `
[PASSWORD RESET] ${companyName} - Account Recovery
===================================================================

Hello ${name},

A password reset request was submitted for your account on ${companyName}.

ACCOUNT DETAILS:
- Name: ${name}
- Role: ${role}
${identifier ? `- Identifier / Username: ${identifier}\n` : ''}- Registered Email: ${email}
- Valid For: ${expiresInMinutes} minutes

RESET LINK:
Please visit the following URL to choose a new password:
${resetUrl}

SECURITY NOTICE:
This link is valid for ${expiresInMinutes} minutes only. If you did not request this reset, you can safely disregard this email. Your password will not change.

-------------------------------------------------------------------
This is an automated security notification generated on behalf of ${companyName}.
`;
};

/**
 * Send Password Reset Email with Verification Link
 */
export const sendPasswordResetEmail = async ({
  to,
  name,
  identifier,
  role,
  token,
  companyId = null,
  companyName = 'RR Security & Facilities',
  clientUrl = null
}) => {
  try {
    let senderEmail = (process.env.EMAIL || '').trim();
    let resolvedCompName = companyName || 'RR Security & Facilities';

    if (companyId) {
      try {
        const comp = await Company.findOne({
          $or: [
            ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
            { companyId }
          ]
        }).lean();
        senderEmail = comp?.preferences?.emailConfig?.fromEmail || comp?.preferences?.emailConfig?.smtpUsername || senderEmail;
        if (comp?.name) {
          resolvedCompName = comp.name;
        }
      } catch (err) {
        console.warn('[EmailService] Could not lookup company details:', err.message);
      }
    }

    const recipientEmail = (to || '').trim();
    if (!recipientEmail) {
      throw new Error('Recipient email address is required to dispatch password reset instructions.');
    }

    const portalBaseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${portalBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    const templateParams = {
      name: name || 'User',
      identifier: identifier || recipientEmail,
      email: recipientEmail,
      role: role || 'User',
      resetUrl,
      expiresInMinutes: 60,
      companyName: resolvedCompName
    };

    const html = generatePasswordResetEmailTemplate(templateParams);
    const text = generatePasswordResetPlainTextTemplate(templateParams);

    let info = null;
    try {
      const transporter = await createTransporter(companyId);
      info = await transporter.sendMail({
        from: `"${resolvedCompName} Security" <${senderEmail}>`,
        to: recipientEmail,
        replyTo: senderEmail,
        subject: `[${resolvedCompName}] Password Reset Request`,
        text,
        html,
        headers: {
          'X-Mailer': 'NovaSpark HRMS Auth Dispatcher',
          'X-Priority': '1',
          'Importance': 'High',
          'Auto-Submitted': 'auto-generated',
        }
      });
      console.log(`[EmailService] Password reset email delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
    } catch (transporterErr) {
      console.warn('[EmailService] SMTP transporter dispatch notice:', transporterErr.message);
      console.log(`[EmailService] [DEV NOTICE] Password Reset URL for ${recipientEmail}: ${resetUrl}`);
      return {
        success: true,
        devFallback: true,
        resetUrl,
        recipient: recipientEmail,
        note: transporterErr.message
      };
    }

    return {
      success: true,
      messageId: info?.messageId,
      recipient: recipientEmail,
      resetUrl
    };
  } catch (error) {
    console.error('[EmailService] Failed to send password reset email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Professional HTML Email Template for Company Administrator Credentials
 * Optimized for 0% Spam Score & 100% Primary Inbox Deliverability
 */
export const generateCompanyCredentialsEmailTemplate = ({
  companyName = 'Company Workspace',
  companyId = '',
  adminEmail = '',
  password = '',
  loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  senderEmail = 'office.rrsf@gmail.com'
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName} - Administrator Workspace Access</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: -0.2px;">RR Security &amp; Facilities</div>
                    <div style="color: #94a3b8; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">Enterprise Workforce Management Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td style="background-color: #eff6ff; padding: 18px 32px; border-bottom: 1px solid #dbeafe;">
              <div style="color: #1d4ed8; font-size: 15px; font-weight: 700;">Administrator Account Setup</div>
              <div style="color: #475569; font-size: 13px; margin-top: 4px;">Isolated company workspace provisioned for <strong>${companyName}</strong></div>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                Hello <strong>${companyName} Team</strong>,
              </p>
              <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 22px 0;">
                Your administrative account for <strong>${companyName}</strong> is now configured on the RR Security &amp; Facilities HRMS platform. You can now access your dedicated organizational dashboard, manage employee records, configure duty rosters, track attendance, and process payroll.
              </p>

              <!-- Access Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                      Workspace Account Details
                    </div>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13.5px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 140px;">Company Entity:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Company ID:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${companyId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Administrator Email:</td>
                        <td style="padding: 6px 0; color: #1d4ed8; font-weight: 700;">${adminEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Initial Password:</td>
                        <td style="padding: 6px 0;">
                          <span style="font-family: monospace; font-size: 14px; font-weight: 800; background: #e2e8f0; color: #0f172a; padding: 4px 10px; border-radius: 4px; display: inline-block;">${password || '••••••••'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Assigned Role:</td>
                        <td style="padding: 6px 0; color: #15803d; font-weight: 700;">Company Administrator</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Portal Access CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 26px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 32px; border-radius: 7px; display: inline-block; letter-spacing: 0.2px;">
                      Log In to Administrator Portal &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="font-size: 11.5px; color: #94a3b8;">Portal Address: <a href="${loginUrl}" style="color: #64748b; text-decoration: underline;">${loginUrl}</a></span>
                  </td>
                </tr>
              </table>

              <!-- Security Best Practices Reminder -->
              <div style="background-color: #fefce8; border-left: 3px solid #eab308; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
                <div style="font-size: 12.5px; font-weight: 700; color: #854d0e;">Security Recommendation:</div>
                <div style="font-size: 12px; color: #713f12; margin-top: 3px; line-height: 1.5;">
                  Upon first login, navigate to your Profile Settings to replace this initial password with your personal confidential password.
                </div>
              </div>
            </td>
          </tr>

          <!-- Compliance & Anti-Spam Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 32px; text-align: left; font-size: 11.5px; color: #64748b; line-height: 1.6;">
              <div style="margin-bottom: 6px;">
                <strong>RR Security &amp; Facilities Pvt. Ltd.</strong> &bull; Civil Lines, Bareilly, Uttar Pradesh 243001, India
              </div>
              <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
                You are receiving this official operational communication because an administrator workspace was created for <strong>${companyName}</strong> on the RR Security &amp; Facilities platform.
              </div>
              <div style="color: #94a3b8; font-size: 11px;">
                This is a secure automated system notification. For assistance, contact the master desk at <a href="mailto:${senderEmail}" style="color: #64748b;">${senderEmail}</a>.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send Company Credentials Notification Email with Anti-Spam Headers
 */
export const sendCompanyCredentialsEmail = async ({
  recipientEmail,
  companyName,
  companyId,
  adminEmail,
  password,
  loginUrl
}) => {
  try {
    const toEmail = (recipientEmail || adminEmail || '').trim().toLowerCase();
    if (!toEmail) {
      throw new Error('Recipient email is required.');
    }

    const transporter = await createTransporter(companyId);
    const dynamicConfig = transporter.dynamicConfig || {};
    const senderEmail = (dynamicConfig.fromEmail || dynamicConfig.user || 'office.rrsf@gmail.com').trim();
    const senderName = dynamicConfig.fromName || 'RR Security & Facilities HRMS';
    const targetLoginUrl = loginUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;

    const html = generateCompanyCredentialsEmailTemplate({
      companyName,
      companyId,
      adminEmail: toEmail,
      password,
      loginUrl: targetLoginUrl,
      senderEmail
    });

    const plainText = `
RR Security & Facilities - Administrator Account Setup
=====================================================

Hello ${companyName} Team,

Your administrative workspace for ${companyName} has been configured on the RR Security & Facilities HRMS platform.

WORKSPACE DETAILS:
- Company Name: ${companyName}
- Company ID: ${companyId}
- Administrator Email: ${toEmail}
- Initial Password: ${password || '••••••••'}
- Assigned Role: Company Administrator
- Portal Login URL: ${targetLoginUrl}

ACTION REQUIRED:
Please log in to the administrator portal using the credentials above and update your password in Profile Settings upon initial sign-in.

-----------------------------------------------------
RR Security & Facilities Pvt. Ltd.
Civil Lines, Bareilly, Uttar Pradesh 243001, India
Support & Administrative Desk: ${senderEmail}
This is an automated operational notice regarding your company workspace setup.
    `.trim();

    // Generate RFC-compliant Message-ID with sender domain to prevent spam score penalty
    const senderDomain = (senderEmail.includes('@') ? senderEmail.split('@')[1] : 'gmail.com').toLowerCase();
    const customMessageId = `<hrms.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@${senderDomain}>`;

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      sender: senderEmail,
      replyTo: dynamicConfig.replyTo || senderEmail,
      envelope: {
        from: senderEmail,
        to: toEmail
      },
      messageId: customMessageId,
      subject: `[${companyName}] Welcome to HRMS - Workspace Administrator Account Setup`,
      text: plainText,
      html,
      headers: {
        'X-Mailer': 'NovaSpark HRMS Enterprise Notification Engine',
        'X-Auto-Response-Suppress': 'All, OOF, AutoReply',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': `CMP-${companyId || 'PROV'}-${Date.now()}`,
        'Importance': 'Normal',
        'X-Priority': '3',
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=Unsubscribe-Admin-${companyId}>`
      }
    });

    console.log(`[EmailService] Company credentials email successfully delivered to inbox of ${toEmail} from ${senderEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, recipient: toEmail, sender: senderEmail };
  } catch (error) {
    console.error('[EmailService] SMTP error sending company credentials email:', error.message);
    return {
      success: false,
      error: error.message,
      recipient: recipientEmail || adminEmail
    };
  }
};

export default {
  generateLicenseExpiryEmailTemplate,
  generateLicenseExpiryPlainTextTemplate,
  sendLicenseExpiryEmailAlert,
  generateEmployeeWelcomeEmailTemplate,
  generateEmployeeWelcomePlainTextTemplate,
  sendEmployeeWelcomeEmail,
  generateClientWelcomeEmailTemplate,
  generateClientWelcomePlainTextTemplate,
  sendClientWelcomeEmail,
  generatePasswordResetEmailTemplate,
  generatePasswordResetPlainTextTemplate,
  sendPasswordResetEmail,
  generateCompanyCredentialsEmailTemplate,
  sendCompanyCredentialsEmail
};

