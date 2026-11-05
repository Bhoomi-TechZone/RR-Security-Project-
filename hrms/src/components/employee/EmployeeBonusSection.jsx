import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Printer,
  CheckCircle2,
  CalendarCheck,
  Percent,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { getStoredBonus } from '../../data/bonusData';
import styles from './EmployeeBonusSection.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function EmployeeBonusSection({ employee = {} }) {
  const employeeName = employee.name || employee.employeeName || 'Rajeshwar Dayal Singh';
  const employeeCode = employee.employeeCode || employee.code || 'RR-SEC-0104';

  const [records] = useState(() => getStoredBonus());
  const myRecord = records.find(
    (r) => r.employeeCode === employeeCode || r.employeeName?.toLowerCase() === employeeName.toLowerCase()
  ) || {
    batchId: 'BON-FY26-001',
    financialYear: 'FY 2026-2027',
    formCSerialNo: 'FC-2026-081',
    workedDays: 298,
    standardYearDays: 300,
    monthlyBasic: 19500,
    calculationWageMonthly: 7000,
    annualCalculationBase: 83440,
    bonusPercent: 8.33,
    grossBonus: 6951,
    interimAdvance: 2000,
    netBonusPayable: 4951,
    status: 'Disbursed & Settled',
    paymentMode: 'NEFT Transfer',
    utrNumber: 'SBIN202610229841',
    disbursedDate: '2026-10-22',
    clientName: 'DLF CyberCity Tech Park',
    designation: 'Senior Security Supervisor'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* 4-KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Annual Bonus Allocation</div>
          <div className={styles.cardVal} style={{ color: '#2563eb' }}>{formatINR(myRecord.grossBonus)}</div>
          <div className={styles.cardSub}>Gross calculated statutory bonus</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Net Bonus Credited</div>
          <div className={styles.cardVal} style={{ color: '#16a34a' }}>{formatINR(myRecord.netBonusPayable)}</div>
          <div className={styles.cardSub}>After ₹{myRecord.interimAdvance} festive advance</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Days Worked in Year</div>
          <div className={styles.cardVal}>{myRecord.workedDays} / {myRecord.standardYearDays} d</div>
          <div className={styles.cardSub}>100% attendance prorated</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardLabel}>Declared Bonus Rate</div>
          <div className={styles.cardVal} style={{ color: '#7c3aed' }}>{myRecord.bonusPercent}%</div>
          <div className={styles.cardSub}>Statutory Act 1965 rate</div>
        </div>
      </div>

      {/* Statutory Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyText}>
          <ShieldCheck size={20} color="#7c3aed" style={{ flexShrink: 0 }} />
          <div>
            <strong>Payment of Bonus Act, 1965 Statement:</strong> As per statutory compliance, bonus is computed on your monthly wage capped at <code>₹7,000/month</code>. Formula: <code>(Worked Days / 300) × Annual Base × Bonus Rate%</code>. Form C Register compliant.
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#ffffff', color: '#6d28d9', border: '1px solid #c4b5fd' }}>
          Form C Audited
        </span>
      </div>

      {/* Form C Printable Statement Card */}
      <div className={styles.statementCard}>
        <div className={styles.statementHeader}>
          <div>
            <h3 className={styles.statementTitle}>Form C — Employee Bonus Register Statement</h3>
            <p className={styles.statementSub}>
              Official statutory statement under Rule 4(c) of Payment of Bonus Rules, 1975 for {myRecord.financialYear}.
            </p>
          </div>

          <button
            type="button"
            className={styles.btnPrint}
            onClick={handlePrint}
          >
            <Printer size={15} />
            <span>Print Form C</span>
          </button>
        </div>

        <div className={styles.statementBody}>
          <div className={styles.voucherPrintBox}>
            <div className={styles.voucherHeader}>
              <h4 className={styles.voucherTitle}>FORM C — BONUS RECORD</h4>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 3 }}>
                [See Rule 4(c) of Payment of Bonus Rules, 1975]
              </div>
            </div>

            <div className={styles.voucherGrid}>
              <div><strong>Employee:</strong> {employeeName}</div>
              <div><strong>Code:</strong> {employeeCode}</div>
              <div><strong>Unit / Client:</strong> {myRecord.clientName}</div>
              <div><strong>Designation:</strong> {myRecord.designation}</div>
              <div><strong>Accounting Cycle:</strong> {myRecord.financialYear}</div>
              <div><strong>Form C S.No:</strong> {myRecord.formCSerialNo}</div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', padding: '5px 8px', borderLeft: '3px solid #7c3aed', margin: '12px 0 6px' }}>
              Statutory Calculation & Payment Details
            </div>

            <div className={styles.voucherRow}>
              <span>Actual Days Worked:</span>
              <strong>{myRecord.workedDays} Days</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Monthly Basic Wage (+DA):</span>
              <span>{formatINR(myRecord.monthlyBasic)}</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Statutory Calculation Base (Capped at ₹7,000 u/s 12):</span>
              <strong style={{ color: '#2563eb' }}>{formatINR(myRecord.calculationWageMonthly)} / month</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Prorated Annual Calculation Wage Base:</span>
              <span>{formatINR(myRecord.annualCalculationBase)}</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Statutory Bonus Percentage:</span>
              <strong>{myRecord.bonusPercent}%</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Gross Bonus Payable:</span>
              <strong>{formatINR(myRecord.grossBonus)}</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Less: Interim / Festive Advance Adjusted:</span>
              <span style={{ color: '#dc2626' }}>
                {myRecord.interimAdvance > 0 ? `- ${formatINR(myRecord.interimAdvance)}` : 'Nil'}
              </span>
            </div>
            <div className={styles.voucherTotalRow}>
              <span>Net Bonus Credited / Payable:</span>
              <span style={{ color: '#16a34a' }}>{formatINR(myRecord.netBonusPayable)}</span>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', padding: '5px 8px', borderLeft: '3px solid #7c3aed', margin: '14px 0 6px' }}>
              Payment Disbursement Audit
            </div>

            <div className={styles.voucherRow}>
              <span>Status:</span>
              <strong style={{ color: '#16a34a' }}>{myRecord.status}</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Payment Mode:</span>
              <span>{myRecord.paymentMode}</span>
            </div>
            <div className={styles.voucherRow}>
              <span>Bank UTR Reference:</span>
              <strong style={{ color: '#2563eb' }}>{myRecord.utrNumber}</strong>
            </div>
            <div className={styles.voucherRow}>
              <span>Disbursement Date:</span>
              <span>{myRecord.disbursedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

