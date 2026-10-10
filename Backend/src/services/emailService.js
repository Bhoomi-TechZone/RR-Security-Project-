import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Company from '../models/companyModel.js';
dotenv.config();

/**
 * Configure Nodemailer Transporter
 * Dynamically loads SMTP settings from MongoDB Company Preferences if available,
 * falling back to process.env credentials.
 */
export const createTransporter = async (companyId = null, customConfig = null) => {
  let host = process.env.SMTP_HOST || 'smtp.gmail.com';
  let port = Number(process.env.SMTP_PORT) || 465;
  let secure = port === 465;
  let user = (process.env.EMAIL || '').trim();
  let pass = (process.env.PASSWORD || '').replace(/\s+/g, '');

  if (customConfig && customConfig.smtpUsername && customConfig.smtpPassword && !customConfig.smtpPassword.includes('•')) {
    user = customConfig.smtpUsername.trim();
    pass = customConfig.smtpPassword.replace(/\s+/g, '');
    host = customConfig.smtpHost || host;
    port = Number(customConfig.smtpPort) || port;
    secure = port === 465 || customConfig.encryption === 'SSL';
  } else if (companyId) {
    try {
      const company = await Company.findOne({
        $or: [{ companyId }, { _id: companyId.match(/^[0-9a-fA-F]{24}$/) ? companyId : null }]
      }).lean();

      const emailConfig = company?.preferences?.emailConfig;
      if (emailConfig && emailConfig.smtpUsername && emailConfig.smtpPassword && !emailConfig.smtpPassword.includes('•')) {
        user = emailConfig.smtpUsername.trim();
        pass = emailConfig.smtpPassword.replace(/\s+/g, '');
        host = emailConfig.smtpHost || host;
        port = Number(emailConfig.smtpPort) || port;
        secure = port === 465 || emailConfig.encryption === 'SSL';
      }
    } catch (err) {
      console.warn('[EmailService] Could not fetch DB email preferences:', err.message);
    }
  }

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set them in Email Preferences or .env');
  }

  const isGmail = host.toLowerCase().includes('gmail');

  return nodemailer.createTransport({
    ...(isGmail ? { service: 'gmail' } : {}),
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
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

export default {
  generateLicenseExpiryEmailTemplate,
  generateLicenseExpiryPlainTextTemplate,
  sendLicenseExpiryEmailAlert,
  generateEmployeeWelcomeEmailTemplate,
  generateEmployeeWelcomePlainTextTemplate,
  sendEmployeeWelcomeEmail,
  generateClientWelcomeEmailTemplate,
  generateClientWelcomePlainTextTemplate,
  sendClientWelcomeEmail
};
