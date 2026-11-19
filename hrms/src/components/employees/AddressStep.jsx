import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Copy, Check, HelpCircle, X, Save } from 'lucide-react';
import styles from './AddressStep.module.css';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

/**
 * Parses an address string or object into structured fields
 */
function parseAddress(addrString, structuredObj = null) {
  if (structuredObj && (structuredObj.addressLine1 || structuredObj.city || structuredObj.state)) {
    return {
      addressLine1: structuredObj.addressLine1 || '',
      addressLine2: structuredObj.addressLine2 || '',
      city: structuredObj.city || '',
      pincode: structuredObj.pincode || '',
      state: structuredObj.state || '',
      country: structuredObj.country || 'India'
    };
  }

  if (!addrString || typeof addrString !== 'string') {
    return {
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      state: '',
      country: 'India'
    };
  }

  const clean = addrString.trim();
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length >= 3) {
    const line1 = lines[0] || '';
    const line2 = lines.length > 4 ? lines[1] : '';

    // Find city & pincode line (e.g. "NEW DELHI - 110044" or contains 6 digit pin)
    const cityPinLine = lines.find(l => l.includes(' - ') || /\b\d{6}\b/.test(l)) || '';
    let city = '';
    let pincode = '';
    if (cityPinLine) {
      if (cityPinLine.includes(' - ')) {
        const parts = cityPinLine.split(' - ');
        city = parts[0]?.trim() || '';
        pincode = parts[1]?.trim() || '';
      } else {
        const pinMatch = cityPinLine.match(/\b\d{6}\b/);
        pincode = pinMatch ? pinMatch[0] : '';
        city = cityPinLine.replace(/\b\d{6}\b/, '').replace('-', '').trim();
      }
    }

    const state = lines.find(l => l !== line1 && l !== line2 && l !== cityPinLine && !l.toLowerCase().includes('india')) || '';
    const country = lines.find(l => l.toLowerCase().includes('india')) || 'India';

    return {
      addressLine1: line1,
      addressLine2: line2,
      city: city || (lines[2] && lines[2] !== cityPinLine ? lines[2] : ''),
      pincode: pincode,
      state: state || 'Delhi',
      country: country
    };
  }

  // Fallback comma-split
  const parts = clean.split(',').map(p => p.trim());
  const pinMatch = clean.match(/\b\d{6}\b/);
  return {
    addressLine1: parts[0] || '',
    addressLine2: parts[1] || '',
    city: parts[2] || '',
    pincode: pinMatch ? pinMatch[0] : '',
    state: parts[3] || 'Delhi',
    country: parts[4] || 'India'
  };
}

/**
 * Formats structured object into multi-line display address string
 */
function formatAddress(obj) {
  if (!obj) return '';
  const lines = [];
  if (obj.addressLine1) lines.push(obj.addressLine1);
  if (obj.addressLine2) lines.push(obj.addressLine2);
  const cityPin = [obj.city, obj.pincode].filter(Boolean).join(' - ');
  if (cityPin) lines.push(cityPin);
  if (obj.state) lines.push(obj.state);
  if (obj.country) lines.push(obj.country);
  return lines.join('\n');
}

/**
 * Returns array of address lines for crisp line-by-line rendering
 */
function getDisplayLines(addrText, obj) {
  if (obj && (obj.addressLine1 || obj.city)) {
    const formatted = formatAddress(obj);
    return formatted.split('\n').filter(Boolean);
  }
  if (!addrText || typeof addrText !== 'string') return [];
  if (addrText.includes('\n')) {
    return addrText.split('\n').map(l => l.trim()).filter(Boolean);
  }
  // If comma separated string, format it
  const parsed = parseAddress(addrText);
  const formatted = formatAddress(parsed);
  return formatted ? formatted.split('\n').filter(Boolean) : [addrText];
}

function AddressStep({ data, onChange }) {
  const [copiedType, setCopiedType] = useState(null); // 'present' | 'permanent' | null

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [addressType, setAddressType] = useState('Present'); // 'Present' | 'Permanent'
  const [formState, setFormState] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    state: '',
    country: 'India'
  });

  const presentLines = useMemo(() => {
    return getDisplayLines(data.presentAddress, data.presentAddressObj);
  }, [data.presentAddress, data.presentAddressObj]);

  const permanentLines = useMemo(() => {
    return getDisplayLines(data.permanentAddress, data.permanentAddressObj);
  }, [data.permanentAddress, data.permanentAddressObj]);

  const handleOpenAdd = () => {
    setModalMode('add');
    const defaultType = data.presentAddress ? 'Permanent' : 'Present';
    setAddressType(defaultType);
    setFormState({
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      state: '',
      country: 'India'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setModalMode('edit');
    const typeLabel = type === 'present' ? 'Present' : 'Permanent';
    setAddressType(typeLabel);
    const existing = type === 'present'
      ? parseAddress(data.presentAddress, data.presentAddressObj)
      : parseAddress(data.permanentAddress, data.permanentAddressObj);

    setFormState(existing);
    setIsModalOpen(true);
  };

  const handleAddressTypeChange = (newType) => {
    setAddressType(newType);
    if (modalMode === 'edit') {
      const existing = newType === 'Present'
        ? parseAddress(data.presentAddress, data.presentAddressObj)
        : parseAddress(data.permanentAddress, data.permanentAddressObj);
      setFormState(existing);
    }
  };

  const handleModalSave = (e) => {
    e?.preventDefault();
    const formatted = formatAddress(formState);

    if (addressType === 'Present') {
      const updated = {
        ...data,
        presentAddress: formatted,
        presentAddressObj: formState,
        address: formatted
      };
      if (data.sameAsPresentAddress) {
        updated.permanentAddress = formatted;
        updated.permanentAddressObj = formState;
      }
      onChange(updated);
    } else {
      onChange({
        ...data,
        permanentAddress: formatted,
        permanentAddressObj: formState
      });
    }

    setIsModalOpen(false);
  };

  const copyToClipboard = (text, lines, type) => {
    const content = text || lines.join('\n');
    if (!content) return;
    navigator.clipboard?.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const deleteAddress = (type) => {
    if (type === 'present') {
      onChange({
        ...data,
        presentAddress: '',
        presentAddressObj: null,
        address: ''
      });
    } else {
      onChange({
        ...data,
        permanentAddress: '',
        permanentAddressObj: null
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Addresses</h3>
          <p className={styles.headerSubtitle}>Keep record of employee's present and permanent address.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAdd}
            title="Add new address"
          >
            <Plus size={15} />
            <span>Add Address</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => {
              alert('Keep record of official address for PF/ESI statutory compliance and emergency contact verification.');
            }}
            title="View address help documentation"
          >
            <HelpCircle size={14} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. ADDRESS CARDS SECTION (MATCHING SCREENSHOT 3)
         ======================================================== */}
      <div className={styles.addressList}>
        {/* Present Address Card */}
        <div className={styles.addressCard}>
          <div className={styles.cardHeaderRow}>
            <h4 className={styles.cardTypeTitle}>Present</h4>
            <div className={styles.cardActionIcons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => handleOpenEdit('present')}
                title="Edit present address"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className={`${styles.actionIconBtn} ${copiedType === 'present' ? styles.actionIconBtnSuccess : ''}`}
                onClick={() => copyToClipboard(data.presentAddress, presentLines, 'present')}
                title="Copy present address"
              >
                {copiedType === 'present' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                className={styles.deleteIconBtn}
                onClick={() => deleteAddress('present')}
                title="Delete present address"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div>
            {presentLines.length > 0 ? (
              <div className={styles.addressLines}>
                {presentLines.map((line, idx) => (
                  <div key={idx} className={styles.addressLineItem}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyAddressText}>No present address added yet. Click edit to add.</p>
            )}
          </div>
        </div>

        {/* Permanent Address Card */}
        <div className={styles.addressCard}>
          <div className={styles.cardHeaderRow}>
            <h4 className={styles.cardTypeTitle}>Permanent</h4>
            <div className={styles.cardActionIcons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => handleOpenEdit('permanent')}
                title="Edit permanent address"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className={`${styles.actionIconBtn} ${copiedType === 'permanent' ? styles.actionIconBtnSuccess : ''}`}
                onClick={() => copyToClipboard(data.permanentAddress, permanentLines, 'permanent')}
                title="Copy permanent address"
              >
                {copiedType === 'permanent' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                className={styles.deleteIconBtn}
                onClick={() => deleteAddress('permanent')}
                title="Delete permanent address"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div>
            {permanentLines.length > 0 ? (
              <div className={styles.addressLines}>
                {permanentLines.map((line, idx) => (
                  <div key={idx} className={styles.addressLineItem}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyAddressText}>No permanent address added yet. Click edit to add.</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. ADD / UPDATE ADDRESS MODAL (MATCHING SCREENSHOT 1 & 2)
         ======================================================== */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === 'edit' ? 'Update Address' : 'Add Address'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleModalSave}>
              <div className={styles.modalBody}>
                {/* Row 1: Address Type */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-address-type" className={styles.modalLabel}>
                    <span>Address Type</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.modalControl}>
                    <select
                      id="modal-address-type"
                      className={styles.modalSelect}
                      value={addressType}
                      onChange={(e) => handleAddressTypeChange(e.target.value)}
                    >
                      <option value="Present">Present</option>
                      <option value="Permanent">Permanent</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Address Line 1 */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-addr-line1" className={styles.modalLabel}>
                    <span>Address Line 1</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.modalControl}>
                    <input
                      id="modal-addr-line1"
                      type="text"
                      className={styles.modalInput}
                      placeholder="Enter Address Line 1"
                      value={formState.addressLine1}
                      onChange={(e) => setFormState({ ...formState, addressLine1: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Row 3: Address Line 2 */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-addr-line2" className={styles.modalLabel}>
                    <span>Address Line 2</span>
                  </label>
                  <div className={styles.modalControl}>
                    <input
                      id="modal-addr-line2"
                      type="text"
                      className={styles.modalInput}
                      placeholder="Enter Address Line 2"
                      value={formState.addressLine2}
                      onChange={(e) => setFormState({ ...formState, addressLine2: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 4: City & Pincode (Two side-by-side inputs) */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-city" className={styles.modalLabel}>
                    <span>City & Pincode</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.modalControl}>
                    <div className={styles.cityPincodeRow}>
                      <input
                        id="modal-city"
                        type="text"
                        className={`${styles.modalInput} ${styles.cityInput}`}
                        placeholder="Enter City"
                        value={formState.city}
                        onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                        required
                      />
                      <input
                        id="modal-pincode"
                        type="text"
                        className={`${styles.modalInput} ${styles.pincodeInput}`}
                        placeholder="Enter Pincode"
                        value={formState.pincode}
                        onChange={(e) => setFormState({ ...formState, pincode: e.target.value })}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: State */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-state" className={styles.modalLabel}>
                    <span>State</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.modalControl}>
                    <select
                      id="modal-state"
                      className={styles.modalSelect}
                      value={formState.state}
                      onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                      required
                    >
                      <option value="">- Select -</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      {formState.state && !INDIAN_STATES.includes(formState.state) && (
                        <option value={formState.state}>{formState.state}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 6: Country */}
                <div className={styles.modalRow}>
                  <label htmlFor="modal-country" className={styles.modalLabel}>
                    <span>Country</span>
                  </label>
                  <div className={styles.modalControl}>
                    <input
                      id="modal-country"
                      type="text"
                      className={styles.modalInput}
                      placeholder="Enter Country"
                      value={formState.country || 'India'}
                      onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer with Blue Save button */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelLinkBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBlueBtn}
                >
                  <Save size={15} />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressStep;