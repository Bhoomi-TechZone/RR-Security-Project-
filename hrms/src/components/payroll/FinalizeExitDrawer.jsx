import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import letterService from '../../services/letterService';
import {
  LETTER_TYPES,
  getTemplateConfig,
  renderLetterBody
} from '../../data/letterManagementData';
import styles from './FinalizeExitDrawer.module.css';

export default function FinalizeExitDrawer({
  isOpen,
  onClose,
  record,
  onFinalize
}) {
  const { activeCompany, activeCompanyId } = useCompany();
  const [selectedLetters, setSelectedLetters] = useState({});
  const [sendEmail, setSendEmail] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load any custom templates configured in Letter Management
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadTpls() {
      try {
        const res = await letterService.getLetterTemplates(activeCompanyId);
        if (isMounted && Array.isArray(res)) {
          setCustomTemplates(res);
        }
      } catch (_) {
        // Offline / fallback: standard LETTER_TYPES remain available
      }
    }
    loadTpls();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeCompanyId]);

  // Build available HRMS letters list (standard LETTER_TYPES + any additional DB templates)
  const availableLetters = useMemo(() => {
    const base = [...LETTER_TYPES];
    (customTemplates || []).forEach((tpl) => {
      const id = tpl.id || tpl.letterType || tpl.templateName;
      const name = tpl.templateName || tpl.name || tpl.title;
      if (id && name && !base.some((b) => b.id === id || b.name.toLowerCase() === name.toLowerCase())) {
        base.push({
          id,
          name,
          code: tpl.code || 'DOC'
        });
      }
    });
    return base;
  }, [customTemplates]);

  // Reset toggles whenever drawer opens for a record
  useEffect(() => {
    if (!isOpen || !record) return;
    const initial = {};
    availableLetters.forEach((lt) => {
      initial[lt.id] = false;
    });
    setSelectedLetters(initial);
    setSendEmail(false);
    setIsProcessing(false);
  }, [isOpen, record, availableLetters]);

  if (!isOpen || !record) return null;

  const toggleLetter = (id) => {
    setSelectedLetters((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleConfirmFinalize = async () => {
    setIsProcessing(true);

    const chosenIds = Object.entries(selectedLetters)
      .filter(([, checked]) => Boolean(checked))
      .map(([id]) => id);

    const chosenLetterObjects = availableLetters.filter((lt) => chosenIds.includes(lt.id));

    // Attempt to generate & save chosen letters in Letter Management (non-blocking)
    if (chosenLetterObjects.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const companyId = activeCompany?.companyId || activeCompany?.id || activeCompanyId || 'RRS8392014SEC';

      await Promise.allSettled(
        chosenLetterObjects.map((lt) => {
          const tplCfg = getTemplateConfig(lt.id);
          const rawBody = tplCfg?.body || `Official ${lt.name} issued for {{employeeName}} ({{employeeCode}}).`;
          const netAmt = Number(record.finalSettlement?.netPayable ?? record.netSettlementAmount ?? 0);

          const content = renderLetterBody(
            rawBody,
            {
              name: record.employeeName,
              employeeCode: record.employeeCode,
              designation: record.designation,
              department: record.department,
              siteLocation: record.site,
              joiningDate: record.dateOfJoining,
              lastWorkingDate: record.lastWorkingDay
            },
            activeCompany,
            {
              issueDate: today,
              joiningDate: record.dateOfJoining,
              lastWorkingDate: record.lastWorkingDay,
              settlementAmount: `₹${netAmt.toLocaleString('en-IN')}`
            }
          );

          return letterService.createLetter(companyId, {
            refNo: `NS/${lt.code || 'DOC'}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
            letterType: lt.id,
            templateName: lt.name,
            employeeId: record.employeeId || record.employeeCode,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            designation: record.designation || 'Staff Member',
            department: record.department || 'General',
            location: record.site || 'Head Office',
            issueDate: today,
            joiningDate: record.dateOfJoining || '',
            lastWorkingDate: record.lastWorkingDay || '',
            settlementAmount: `₹${netAmt.toLocaleString('en-IN')}`,
            status: sendEmail ? 'Sent' : 'Issued',
            subject: `${lt.name} - ${record.employeeName} (${record.employeeCode})`,
            headerTitle: lt.name.toUpperCase(),
            content
          });
        })
      );
    }

    if (onFinalize) {
      onFinalize(record, {
        selectedLetters: chosenLetterObjects.map((l) => l.name),
        sendEmail
      });
    }
    setIsProcessing(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Finalize Exit</h2>
            <span className={styles.empSub}>
              {record.employeeName} ({record.employeeCode})
            </span>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h3 className={styles.sectionHeading}>Separation Finalization Overview</h3>

          <div className={styles.infoList}>
            <p className={styles.infoPara}>
              Verify that all applicable dues such as pending salary, bonus, gratuity, leave encashment, and responsibility transfers have been processed prior to completion.
            </p>
            <p className={styles.infoPara}>
              Turn on the HRMS letter templates below that you want to issue upon closing this separation (for instance, Experience Letter or Full &amp; Final Letter).
            </p>
            <p className={styles.infoPara}>
              Switch on the email option below to dispatch copies directly to the employee&apos;s email address on file.
            </p>
            <p className={styles.infoParaBold}>
              Issued letters and the Full &amp; Final Settlement statement are archived in Letter Management under the employee profile.
            </p>
          </div>

          {/* Select Letters to Generate */}
          <div className={styles.lettersBlock}>
            <label className={styles.blockLabel}>Select Letters to Issue</label>
            <div className={styles.lettersScrollBox}>
              {availableLetters.map((letter) => (
                <label key={letter.id} className={styles.letterItemRow}>
                  <span className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLetters[letter.id])}
                      onChange={() => toggleLetter(letter.id)}
                    />
                    <span className={styles.slider} />
                  </span>
                  <span className={styles.letterName}>{letter.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email Toggle */}
          <label className={styles.emailRow}>
            <span className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <span className={styles.slider} />
            </span>
            <span className={styles.emailLabel}>Send Letters via Email</span>
          </label>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelLinkBtn}
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>

          <button
            type="button"
            className={styles.finalizeBtn}
            onClick={handleConfirmFinalize}
            disabled={isProcessing}
          >
            <CheckCircle2 size={16} />
            <span>{isProcessing ? 'Finalizing...' : 'Finalize'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

