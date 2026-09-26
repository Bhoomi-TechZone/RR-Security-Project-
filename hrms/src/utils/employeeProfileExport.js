/**
 * Utility to generate and print/download a clean, professional Employee Profile Sheet
 */
export function downloadEmployeeProfile(employee, company) {
  if (!employee) return;

  const companyName = company?.name || employee?.companyName || 'RR Security';
  const companyAddress = company?.address || 'Civil Lines, Bareilly, Uttar Pradesh 243001';
  const companyPhone = company?.phone || '+91 9876543210';
  const companyEmail = company?.email || 'contact@company.com';
  const companyGstin = company?.gstin || '';

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    window.print();
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Employee Profile - ${employee.name} (${employee.employeeId})</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #f8fafc;
      padding: 24px;
      color: #0f172a;
    }
    .print-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #dbeafe;
      color: #1e40af;
      font-weight: 700;
      font-size: 13px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .profile-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 18px 24px;
      margin-bottom: 24px;
    }
    .hero-name {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .hero-meta {
      font-size: 14px;
      color: #475569;
      margin-top: 4px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4px solid #2563eb;
      padding-left: 8px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px 18px;
    }
    .field {
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
    }
    .field-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .field-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
    }
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    .salary-table th {
      background: #f8fafc;
      padding: 8px 12px;
      text-align: left;
      border: 1px solid #cbd5e1;
      font-size: 11px;
      color: #475569;
      text-transform: uppercase;
    }
    .salary-table td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      font-weight: 600;
    }
    .total-row {
      background: #f0fdf4;
      color: #166534;
      font-weight: 700;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #cbd5e1;
    }
    .sig-box {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 6px;
    }
    .sig-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .print-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-card">
    <div class="header">
      <div>
        <div class="company-title">${companyName}</div>
        <div class="company-subtitle">
          ${companyAddress}<br>
          Phone: ${companyPhone} | Email: ${companyEmail} ${companyGstin ? `| GSTIN: ${companyGstin}` : ''}
        </div>
      </div>
      <div>
        <span class="badge">Official Profile</span>
      </div>
    </div>

    <div class="profile-hero">
      <div>
        <div class="hero-name">${employee.name || '—'}</div>
        <div class="hero-meta">
          <strong>Employee ID:</strong> ${employee.employeeId || '—'} | 
          <strong>Designation:</strong> ${employee.designation || 'Security Guard'} | 
          <strong>Status:</strong> ${employee.status || 'Active'}
        </div>
      </div>
      <div>
        <div style="font-size: 12px; color: #64748b; text-align: right;">Joining Date</div>
        <div style="font-size: 14px; font-weight: 700; color: #1e3a8a;">${employee.joiningDate || '—'}</div>
      </div>
    </div>

    <!-- Personal Info -->
    <div class="section-title">Personal & Contact Details</div>
    <div class="grid-3">
      <div class="field">
        <div class="field-label">Father / Husband Name</div>
        <div class="field-value">${employee.fatherHusbandName || '—'} (${employee.fatherHusbandRelation || 'Father'})</div>
      </div>
      <div class="field">
        <div class="field-label">Date of Birth</div>
        <div class="field-value">${employee.dob || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender / Blood Group</div>
        <div class="field-value">${employee.gender || 'Male'} / ${employee.bloodGroup || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Mobile Number</div>
        <div class="field-value">${employee.contact || employee.mobile || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Emergency Contact</div>
        <div class="field-value">${employee.alternateMobile || employee.emergencyMobile || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Email Address</div>
        <div class="field-value">${employee.email || '—'}</div>
      </div>
    </div>

    <!-- Address -->
    <div class="section-title">Address Details</div>
    <div class="grid-2">
      <div class="field">
        <div class="field-label">Present Address</div>
        <div class="field-value">${employee.presentAddress || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Permanent Address</div>
        <div class="field-value">${employee.permanentAddress || '—'}</div>
      </div>
    </div>

    <!-- Employment Posting -->
    <div class="section-title">Deployment & Work Details</div>
    <div class="grid-3">
      <div class="field">
        <div class="field-label">Assigned Client / Company</div>
        <div class="field-value">${employee.clientName || employee.companyName || companyName}</div>
      </div>
      <div class="field">
        <div class="field-label">Deployment Site / Post</div>
        <div class="field-value">${employee.siteLocation || employee.site || 'Main Site'} / ${employee.dutyPost || 'Gate Duty'}</div>
      </div>
      <div class="field">
        <div class="field-label">Shift / Department</div>
        <div class="field-value">${employee.shift || 'General'} / ${employee.department || 'Security'}</div>
      </div>
    </div>

    <!-- Statutory & Banking -->
    <div class="section-title">Statutory & Bank Information</div>
    <div class="grid-3">
      <div class="field">
        <div class="field-label">Aadhaar Card No.</div>
        <div class="field-value">${employee.aadhaar || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">PAN Number</div>
        <div class="field-value">${employee.pan || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">UAN / PF Number</div>
        <div class="field-value">${employee.uan || '—'} / ${employee.pfNo || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Bank Name</div>
        <div class="field-value">${employee.bankName || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Account Number</div>
        <div class="field-value">${employee.accountNumber || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">IFSC Code / Branch</div>
        <div class="field-value">${employee.ifsc || '—'} (${employee.branchName || 'Main'})</div>
      </div>
    </div>

    <!-- Salary Structure -->
    <div class="section-title">Salary & Compensation Breakdown</div>
    <table class="salary-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Monthly (₹)</th>
          <th>Component</th>
          <th>Monthly (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Salary</td>
          <td>₹ ${(Number(employee.basic) || 0).toLocaleString('en-IN')}</td>
          <td>House Rent Allowance (HRA)</td>
          <td>₹ ${(Number(employee.hra) || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Variable DA (VDA)</td>
          <td>₹ ${(Number(employee.vda) || 0).toLocaleString('en-IN')}</td>
          <td>Conveyance Allowance</td>
          <td>₹ ${(Number(employee.conveyance) || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Special Allowance</td>
          <td>₹ ${(Number(employee.specialAllowance) || 0).toLocaleString('en-IN')}</td>
          <td>Other Allowances</td>
          <td>₹ ${(Number(employee.otherAllowance) || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2"><strong>GROSS SALARY PAYABLE</strong></td>
          <td colspan="2"><strong>₹ ${(Number(employee.grossSalary) || ((Number(employee.basic) || 0) + (Number(employee.hra) || 0) + (Number(employee.conveyance) || 0) + (Number(employee.otherAllowance) || 0) + (Number(employee.specialAllowance) || 0))).toLocaleString('en-IN')} / month</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="signature-area">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Employee Signature</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Authorized HR Signatory</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
