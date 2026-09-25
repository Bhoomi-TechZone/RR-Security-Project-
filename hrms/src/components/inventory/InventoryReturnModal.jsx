import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle, ShieldAlert, User, Package, Calendar } from 'lucide-react';
import styles from './InventoryReturnModal.module.css';

export default function InventoryReturnModal({
  isOpen,
  issueRecord = null,
  issuedList = [],
  onClose,
  onSave
}) {
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [condition, setCondition] = useState('Good');
  const [returnDate, setReturnDate] = useState('2026-08-26');
  const [returnedBy, setReturnedBy] = useState('Store Admin (Vikas)');
  const [returnValue, setReturnValue] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (issueRecord) {
      setSelectedIssueId(issueRecord.id);
      const remaining = issueRecord.pendingQuantity ?? (issueRecord.quantity - (issueRecord.returnedQuantity || 0));
      setReturnQty(Math.max(1, remaining));
      setReturnValue(issueRecord.rate || 0);
    } else if (issuedList.length > 0) {
      const activeIssue = issuedList.find(
        (i) => (i.status === 'Issued' || i.status === 'Partially Returned') && (i.pendingQuantity > 0 || i.quantity > (i.returnedQuantity || 0))
      ) || issuedList[0];
      setSelectedIssueId(activeIssue.id);
      const remaining = activeIssue.pendingQuantity ?? (activeIssue.quantity - (activeIssue.returnedQuantity || 0));
      setReturnQty(Math.max(1, remaining));
      setReturnValue(activeIssue.rate || 0);
    }
    setErrors({});
  }, [issueRecord, issuedList, isOpen]);

  const currentIssue = useMemo(() => {
    return issuedList.find((i) => i.id === selectedIssueId) || issueRecord || null;
  }, [issuedList, selectedIssueId, issueRecord]);

  const pendingQty = useMemo(() => {
    if (!currentIssue) return 0;
    if (typeof currentIssue.pendingQuantity === 'number') return currentIssue.pendingQuantity;
    return Math.max(0, (currentIssue.quantity || 0) - (currentIssue.returnedQuantity || 0));
  }, [currentIssue]);

  const handleIssueSelect = (id) => {
    setSelectedIssueId(id);
    const iss = issuedList.find((i) => i.id === id);
    if (iss) {
      const remaining = iss.pendingQuantity ?? (iss.quantity - (iss.returnedQuantity || 0));
      setReturnQty(Math.max(1, remaining));
      setReturnValue(iss.rate || 0);
    }
  };

  const isExceeded = Number(returnQty || 0) > pendingQty;
  const isPartial = Number(returnQty || 0) < pendingQty;
  const totalReturnValue = useMemo(() => {
    return Number((Number(returnQty || 0) * Number(returnValue || 0)).toFixed(2));
  }, [returnQty, returnValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!currentIssue) nextErrors.issue = 'Please select an active issued item record.';
    if (Number(returnQty) <= 0) nextErrors.returnQty = 'Return quantity must be 1 or greater.';
    if (isExceeded) {
      nextErrors.returnQty = `Return quantity cannot exceed pending quantity (${pendingQty}).`;
    }
    if (!returnDate) nextErrors.returnDate = 'Return date is required.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      id: `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueId: currentIssue.id,
      employeeId: currentIssue.employeeId,
      employeeName: currentIssue.employeeName,
      initials: currentIssue.initials || (currentIssue.employeeName || 'EM').slice(0, 2).toUpperCase(),
      clientId: currentIssue.clientId || 'c001',
      clientName: currentIssue.clientName || 'ABC Security Services',
      site: currentIssue.site || 'Main Site',
      itemId: currentIssue.itemId,
      itemCode: currentIssue.itemCode || currentIssue.itemId,
      itemName: currentIssue.itemName,
      category: currentIssue.category,
      size: currentIssue.size || 'Free Size',
      returnedQuantity: Number(returnQty),
      condition,
      returnDate,
      returnValue: Number(returnValue),
      totalReturnValue,
      returnedBy,
      receivedBy: returnedBy,
      remarks: remarks || `Returned in ${condition} condition.`
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Uniform / Asset Return IN</h2>
              <p className={styles.subtitle}>Receive issued inventory items back and assess item condition</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Issue Selection if not direct */}
            {!issueRecord && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Select Issued Record <span className={styles.req}>*</span>
                </label>
                <select
                  className={`${styles.select} ${errors.issue ? styles.inputError : ''}`}
                  value={selectedIssueId}
                  onChange={(e) => handleIssueSelect(e.target.value)}
                >
                  <option value="">-- Choose Issued Record --</option>
                  {issuedList
                    .filter((i) => (i.pendingQuantity ?? (i.quantity - (i.returnedQuantity || 0))) > 0)
                    .map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        {iss.id} | {iss.employeeName} ({iss.employeeId}) — {iss.itemName} (Size {iss.size}, Pend: {iss.pendingQuantity ?? (iss.quantity - (iss.returnedQuantity || 0))})
                      </option>
                    ))}
                </select>
                {errors.issue && <span className={styles.errorText}>{errors.issue}</span>}
              </div>
            )}

            {/* Issued Item Summary Card */}
            {currentIssue && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <div className={styles.empBadge}>
                    <User size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {currentIssue.employeeName} ({currentIssue.employeeId})
                  </div>
                  <span className={styles.issueRefBadge}>Ref: {currentIssue.id}</span>
                </div>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span>Item:</span>
                    <strong>{currentIssue.itemName}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Category & Size:</span>
                    <strong>{currentIssue.category} • {currentIssue.size}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Issued Qty:</span>
                    <strong>{currentIssue.quantity}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Already Returned:</span>
                    <strong>{currentIssue.returnedQuantity || 0}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Pending Return:</span>
                    <strong style={{ color: '#ea580c' }}>{pendingQty}</strong>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Client / Site:</span>
                    <strong>{currentIssue.clientName || 'ABC'} — {currentIssue.site || 'Site A'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Return Details Grid */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Return Quantity <span className={styles.req}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={pendingQty || 1}
                  className={`${styles.input} ${errors.returnQty ? styles.inputError : ''}`}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
                {errors.returnQty ? (
                  <span className={styles.errorText}>{errors.returnQty}</span>
                ) : (
                  <span className={styles.helperText}>
                    {isPartial ? `⚠️ Partial return: ${pendingQty - Number(returnQty)} will remain pending.` : `✅ Complete return of remaining ${pendingQty} unit(s).`}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Item Condition <span className={styles.req}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="Good">Good (Restockable)</option>
                  <option value="New">New / Unused (Restockable)</option>
                  <option value="Damaged">Damaged (Do NOT add to stock)</option>
                  <option value="Lost">Lost (Mark as Lost Asset)</option>
                </select>
              </div>
            </div>

            {/* Stock Impact Warning Banner */}
            <div
              className={`${styles.conditionBanner} ${
                condition === 'Good' || condition === 'New'
                  ? styles.conditionBannerGood
                  : condition === 'Damaged'
                  ? styles.conditionBannerDamaged
                  : styles.conditionBannerLost
              }`}
            >
              {condition === 'Good' || condition === 'New' ? (
                <div className={styles.bannerRow}>
                  <CheckCircle size={18} color="#16a34a" />
                  <div>
                    <strong>Usable Stock Will Increase (+{returnQty})</strong>
                    <p>Item is in healthy condition and will be added back into available inventory stock.</p>
                  </div>
                </div>
              ) : condition === 'Damaged' ? (
                <div className={styles.bannerRow}>
                  <AlertTriangle size={18} color="#d97706" />
                  <div>
                    <strong>Damaged Asset (+{returnQty} Damaged Stock)</strong>
                    <p>Item is marked damaged. It will NOT be added to usable stock and is logged under damaged assets.</p>
                  </div>
                </div>
              ) : (
                <div className={styles.bannerRow}>
                  <ShieldAlert size={18} color="#dc2626" />
                  <div>
                    <strong>Lost Asset (+{returnQty} Lost)</strong>
                    <p>Item reported lost. It will NOT be added to stock and is recorded for penalty/clearance audit.</p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Return Date <span className={styles.req}>*</span>
                </label>
                <input
                  type="date"
                  className={`${styles.input} ${errors.returnDate ? styles.inputError : ''}`}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
                {errors.returnDate && <span className={styles.errorText}>{errors.returnDate}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Rate per Unit (₹)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={returnValue}
                  onChange={(e) => setReturnValue(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Received By</label>
                <input
                  type="text"
                  className={styles.input}
                  value={returnedBy}
                  onChange={(e) => setReturnedBy(e.target.value)}
                  placeholder="Receiver name"
                />
              </div>
            </div>

            <div className={styles.valCard}>
              <span className={styles.valLabel}>Total Assessed Return Value:</span>
              <span className={styles.valAmount}>₹{totalReturnValue.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Remarks / Inspection Notes</label>
              <textarea
                className={styles.textarea}
                placeholder="E.g. Returned after shift completion, minor collar wear, zipper functional..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit}>
              <RotateCcw size={15} /> Confirm Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
