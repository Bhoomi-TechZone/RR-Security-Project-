import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  UserCheck,
  HeartHandshake
} from 'lucide-react';
import { getStoredGratuity } from '../../data/gratuityData';
import styles from './EmployeeGratuitySection.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function EmployeeGratuitySection({ employee = {} }) {
  const employeeName = employee.name || employee.employeeName || 'Rajeshwar Dayal Singh';
  const employeeCode = employee.employeeCode || employee.code || 'RR-SEC-0104';

  const [records] = useState(() => getStoredGratuity());
  const myRecord = records.find(
    (r) => r.employeeCode === employeeCode || r.employeeName?.toLowerCase() === employeeName.toLowerCase()
  ) || {
    claimId: 'GRAT-2026-001',
    joiningDate: '2016-04-10',
    exitDate: '2026-04-15',
    tenureYears: 10,
    tenureMonths: 0,
    roundedYears: 10,
    isEligible: true,
    lastDrawnBasic: 24500,
    gratuityAmount: 141346,
    taxExemptAmount: 141346,
    netPayable: 141346,
    status: 'Disbursed & Settled',
    nomineeName: 'Sunita Devi',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    clientName: 'DLF CyberCity Tech Park',
    designation: 'Senior Security Supervisor'
  };

  const vestingProgressPercent = Math.min(100, Math.round((myRecord.tenureYears / 5) * 100));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* 4-KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Continuous Service</div>
          <div className={styles.cardVal} style={{ color: '#2563eb' }}>
            {myRecord.tenureYears}y {myRecord.tenureMonths}m
          </div>
          <div className={styles.cardSub}>Rounded to {myRecord.roundedYears} statutory years</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Vesting Eligibility</div>
          <div className={styles.cardVal} style={{ color: '#16a34a' }}>
            {myRecord.isEligible ? '100% Vested' : `${vestingProgressPercent}%`}
          </div>
          <div className={styles.cardSub}>5 years continuous service rule</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Accrued Gratuity</div>
          <div className={styles.cardVal} style={{ color: '#0f172a' }}>
            {formatINR(myRecord.gratuityAmount)}
          </div>
          <div className={styles.cardSub}>Formula: (15 × Basic × Yrs)/26</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Tax Exemption Status</div>
          <div className={styles.cardVal} style={{ color: '#7c3aed' }}>100% Tax-Free</div>
          <div className={styles.cardSub}>Exempt up to ₹20 Lakhs u/s 10(10)</div>
        </div>
      </div>

      {/* Statutory Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyText}>
          <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Payment of Gratuity Act, 1972 Compliance:</strong> Gratuity is payable on separation after completing <strong>5 years</strong> of continuous service (waived on death/disablement). Computed at <strong>15 days basic wages</strong> for each completed year.
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#ffffff', color: '#166534', border: '1px solid #86efac' }}>
          Form F Registered
        </span>
      </div>

      {/* 5-Year Vesting Progress Bar Card */}
      <div className={styles.tenureProgressCard}>
        <div className={styles.progressHeader}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Statutory 5-Year Continuous Service Tracker
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Service Joined: {myRecord.joiningDate}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: myRecord.isEligible ? '#16a34a' : '#2563eb' }}>
            {myRecord.isEligible ? '✓ Statutory Eligibility Achieved' : `${myRecord.tenureYears} / 5 Years`}
          </span>
        </div>

        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${vestingProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Form F Nomination Record Card */}
      <div className={styles.statementCard}>
        <div className={styles.statementHeader}>
          <div>
            <h3 className={styles.statementTitle}>Form F — Statutory Nomination & Gratuity Record</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              Registered nominee record under Rule 6(1) of Payment of Gratuity (Central) Rules, 1972.
            </p>
          </div>

          <button
            type="button"
            className={styles.btnPrint}
            onClick={handlePrint}
          >
            <Printer size={15} />
            <span>Print Statement</span>
          </button>
        </div>

        <div className={styles.statementBody}>
          <div className={styles.voucherPrintBox}>
            <div className={styles.voucherHeader}>
              <h4 className={styles.voucherTitle}>FORM F & GRATUITY RECORD</h4>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 3 }}>
                [Payment of Gratuity Act, 1972]
              </div>
            </div>

            <div className={styles.voucherGrid}>
              <div><strong>Employee:</strong> {employeeName}</div>
              <div><strong>Code:</strong> {employeeCode}</div>
              <div><strong>Unit:</strong> {myRecord.clientName}</div>
              <div><strong>Designation:</strong> {myRecord.designation}</div>
              <div><strong>Joining Date:</strong> {myRecord.joiningDate}</div>
              <div><strong>Status:</strong> {myRecord.status}</div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', padding: '5px 8px', borderLeft: '3px solid #2563eb', margin: '12px 0 6px' }}>
              Nominee Details (Form F on File)
            </div>

            <div className={styles.voucherRow}>
              <span>Registered Nominee Name:</span>
              <strong>{myRecord.nomineeName}</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Relationship with Employee:</span>
              <span>{myRecord.nomineeRelation}</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Nominee Share Percentage:</span>
              <strong style={{ color: '#16a34a' }}>{myRecord.nomineeSharePercent}%</strong>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', padding: '5px 8px', borderLeft: '3px solid #2563eb', margin: '14px 0 6px' }}>
              Gratuity Computation Breakdown
            </div>

            <div className={styles.voucherRow}>
              <span>Continuous Service Rendered:</span>
              <span>{myRecord.tenureYears} Years, {myRecord.tenureMonths} Months</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Completed Service Years (6-Month Rounding Rule):</span>
              <strong style={{ color: '#2563eb' }}>{myRecord.roundedYears} Years</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Last Drawn Basic Wage (+DA):</span>
              <span>{formatINR(myRecord.lastDrawnBasic)}</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Statutory Formula:</span>
              <code>(15 × {formatINR(myRecord.lastDrawnBasic)} × {myRecord.roundedYears}) / 26</code>
            </div>
            <div className={styles.voucherTotalRow}>
              <span>Accrued Gratuity Dues:</span>
              <span style={{ color: '#16a34a' }}>{formatINR(myRecord.gratuityAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

