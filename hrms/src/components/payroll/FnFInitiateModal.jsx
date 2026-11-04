import React, { useState, useEffect } from 'react';
import { X, Calculator, IndianRupee, User, Calendar, ShieldAlert } from 'lucide-react';
import { SEPARATION_REASONS } from '../../data/fnfData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFInitiateModal({
  isOpen,
  onClose,
  employees = [],
  onSave
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [formData, setFormData] = useState({
    employeeCode: '',
    employeeName: '',
    designation: '',
    client: '',
    site: '',
    department: '',
    dateOfJoining: '',
    resignationDate: '',
    lastWorkingDay: '',
    separationReason: SEPARATION_REASONS[0],
    monthlyGrossSalary: 20000,
    perDayWage: 769.23,
    unpaidWorkDays: 15,
    unpaidSalary: 11538,
    leaveBalanceDays: 8,
    leaveEncashment: 6154,
    gratuityAmount: 0,
    bonusOrArrears: 0,
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticePayRecovery: 0,
    assetDamageRecovery: 0,
    loanAdvanceDeduction: 0,
    assetClearanceStatus: 'Cleared',
    managerClearanceStatus: 'Cleared',
    settlementStatus: 'Calculation Ready',
    paymentMode: 'Bank Transfer (NEFT)',
    remarks: ''
  });

  // When employee dropdown changes
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    if (!empId) return;

    const emp = employees.find((item) => (item.id || item.employeeId || item._id) === empId);
    if (emp) {
      const gross = Number(emp.grossSalary || emp.salary || emp.earnings?.totalGross || 22000);
      const perDay = Math.round((gross / 26) * 100) / 100;
      const unpDays = 15;
      const lvDays = 6;
      const unpSal = Math.round(unpDays * perDay);
      const lvEnc = Math.round(lvDays * perDay);

      setFormData((prev) => ({
        ...prev,
        employeeCode: emp.employeeCode || emp.code || emp.employeeId || 'RR-000',
        employeeName: emp.name || emp.employeeName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
        designation: emp.designation || emp.role || 'Security Guard',
        client: emp.clientName || emp.assignedClient || emp.client || 'Primary Client',
        site: emp.siteName || emp.assignedSite || 'Main Site',
        department: emp.department || 'Security Operations',
        dateOfJoining: emp.joiningDate || emp.dateOfJoining || '2023-01-01',
        monthlyGrossSalary: gross,
        perDayWage: perDay,
        unpaidWorkDays: unpDays,
        unpaidSalary: unpSal,
        leaveBalanceDays: lvDays,
        leaveEncashment: lvEnc,
        resignationDate: new Date().toISOString().slice(0, 10),
        lastWorkingDay: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalculate unpaid salary when unpaid days or gross salary changes
      if (field === 'unpaidWorkDays' || field === 'monthlyGrossSalary') {
        const perDay = Math.round((Number(updated.monthlyGrossSalary || 0) / 26) * 100) / 100;
        updated.perDayWage = perDay;
        updated.unpaidSalary = Math.round(Number(updated.unpaidWorkDays || 0) * perDay);
        updated.leaveEncashment = Math.round(Number(updated.leaveBalanceDays || 0) * perDay);
      }

      if (field === 'leaveBalanceDays') {
        updated.leaveEncashment = Math.round(Number(value || 0) * updated.perDayWage);
      }

      if (field === 'noticePeriodRequiredDays' || field === 'noticePeriodServedDays') {
        const shortfall = Math.max(0, Number(updated.noticePeriodRequiredDays || 0) - Number(updated.noticePeriodServedDays || 0));
        updated.noticePayRecovery = Math.round(shortfall * updated.perDayWage);
      }

      return updated;
    });
  };

  const totalEarnings =
    Number(formData.unpaidSalary || 0) +
    Number(formData.leaveEncashment || 0) +
    Number(formData.gratuityAmount || 0) +
    Number(formData.bonusOrArrears || 0);

  const totalDeductions =
    Number(formData.noticePayRecovery || 0) +
    Number(formData.assetDamageRecovery || 0) +
    Number(formData.loanAdvanceDeduction || 0);

  const netSettlementAmount = Math.max(0, totalEarnings - totalDeductions);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeName) {
      alert('Please select an employee.');
      return;
    }

    const newRecord = {
      id: `fnf-${Date.now()}`,
      settlementId: `FNF-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: selectedEmpId,
      ...formData,
      totalEarnings,
      totalDeductions,
      netSettlementAmount,
      settlementDate: ''
    };

    onSave(newRecord);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Initiate Full &amp; Final (FnF) Settlement
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Calculate separation dues, encashment, asset recovery and net final settlement
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 1. Employee Selection */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
              Select Separating Employee <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={handleEmployeeChange}
              required
              style={{
                width: '100%',
                height: 38,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                padding: '0 10px',
                fontSize: '13px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => {
                const idVal = emp.id || emp.employeeId || emp._id;
                const name = emp.name || emp.employeeName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() || idVal;
                const code = emp.employeeCode || emp.code || emp.employeeId || '';
                return (
                  <option key={idVal} value={idVal}>
                    {name} {code ? `(${code})` : ''} — {emp.designation || 'Staff'}
                  </option>
                );
              })}
            </select>

            {formData.employeeName && (
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                <span>Role: <strong>{formData.designation}</strong></span>
                <span>Client: <strong>{formData.client}</strong></span>
                <span>Gross: <strong>{formatINR(formData.monthlyGrossSalary)}/mo</strong></span>
                <span>Daily Wage: <strong>{formatINR(formData.perDayWage)}/day</strong></span>
              </div>
            )}
          </div>

          {/* 2. Separation Dates & Reason */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Resignation / Notice Date
              </label>
              <input
                type="date"
                value={formData.resignationDate}
                onChange={(e) => handleInputChange('resignationDate', e.target.value)}
                required
                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Last Working Day (LWD)
              </label>
              <input
                type="date"
                value={formData.lastWorkingDay}
                onChange={(e) => handleInputChange('lastWorkingDay', e.target.value)}
                required
                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Separation Reason
              </label>
              <select
                value={formData.separationReason}
                onChange={(e) => handleInputChange('separationReason', e.target.value)}
                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px' }}
              >
                {SEPARATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Accruals & Earnings Grid */}
          <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 8, padding: 14 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Earnings &amp; Final Accruals
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#166534', marginBottom: 3 }}>
                  Earned Unpaid Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={formData.unpaidWorkDays}
                  onChange={(e) => handleInputChange('unpaidWorkDays', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12.5px' }}
                />
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>{formatINR(formData.unpaidSalary)}</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#166534', marginBottom: 3 }}>
                  Leave Encashment (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leaveBalanceDays}
                  onChange={(e) => handleInputChange('leaveBalanceDays', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12.5px' }}
                />
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>{formatINR(formData.leaveEncashment)}</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#166534', marginBottom: 3 }}>
                  Gratuity Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.gratuityAmount}
                  onChange={(e) => handleInputChange('gratuityAmount', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#166534', marginBottom: 3 }}>
                  Bonus / Arrears (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bonusOrArrears}
                  onChange={(e) => handleInputChange('bonusOrArrears', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12.5px' }}
                />
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8, fontSize: '12.5px', fontWeight: 700, color: '#14532d' }}>
              Total Accruals: {formatINR(totalEarnings)}
            </div>
          </div>

          {/* 4. Deductions Grid */}
          <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: 14 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
              Deductions &amp; Recoveries
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#991b1b', marginBottom: 3 }}>
                  Notice Shortfall Pay (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.noticePayRecovery}
                  onChange={(e) => handleInputChange('noticePayRecovery', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#991b1b', marginBottom: 3 }}>
                  Asset Loss / Uniform Penalty (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.assetDamageRecovery}
                  onChange={(e) => handleInputChange('assetDamageRecovery', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#991b1b', marginBottom: 3 }}>
                  Outstanding Advance / Loan (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.loanAdvanceDeduction}
                  onChange={(e) => handleInputChange('loanAdvanceDeduction', Number(e.target.value))}
                  style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12.5px' }}
                />
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8, fontSize: '12.5px', fontWeight: 700, color: '#7f1d1d' }}>
              Total Deductions: {formatINR(totalDeductions)}
            </div>
          </div>

          {/* 5. Net Payable Live Calculation Card */}
          <div style={{
            background: '#ecfdf5',
            border: '2px dashed #059669',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Net Payable Settlement (Accruals - Deductions)
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#065f46', marginTop: 2 }}>
                {formatINR(netSettlementAmount)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={formData.assetClearanceStatus}
                onChange={(e) => handleInputChange('assetClearanceStatus', e.target.value)}
                style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
              >
                <option value="Cleared">Store: Cleared</option>
                <option value="Pending Return">Store: Pending Return</option>
              </select>
            </div>
          </div>

          {/* 6. Remarks */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Settlement Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="e.g. Guard post handover done, ID card returned, remaining ₹2,000 adjusted..."
              style={{ width: '100%', borderRadius: 6, border: '1px solid #cbd5e1', padding: '8px', fontSize: '12.5px' }}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Save &amp; Calculate Settlement
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

