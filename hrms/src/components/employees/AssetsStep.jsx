import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Package,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Loader2
} from 'lucide-react';
import styles from './AssetsStep.module.css';
import { useCompany } from '../../context/CompanyContext';
import inventoryService from '../../services/inventoryService';

/**
 * Format date to "16-Nov-2026"
 */
function formatDisplayDate(dateVal) {
  if (!dateVal) return 'Not Specified';
  if (dateVal === 'Not Specified') return 'Not Specified';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateVal;
  }
}

/**
 * Laptop Graphic matching the user's screenshot
 */
const LaptopGraphic = () => (
  <svg width="48" height="40" viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Screen outer frame */}
    <rect x="10" y="4" width="44" height="30" rx="3" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
    {/* Display screen with glowing blue gradient */}
    <rect x="13" y="7" width="38" height="24" rx="1.5" fill="url(#screenGrad)" />
    {/* Webcam dot */}
    <circle cx="32" cy="5.5" r="0.8" fill="#64748b" />
    {/* Base keyboard body */}
    <path
      d="M4 35C4 34.4477 4.44772 34 5 34H59C59.5523 34 60 34.4477 60 35L62 43C62 44.1046 61.1046 45 60 45H4C2.89543 45 2 44.1046 2 43L4 35Z"
      fill="#cbd5e1"
      stroke="#94a3b8"
      strokeWidth="1"
    />
    {/* Keyboard keys area */}
    <rect x="14" y="36.5" width="36" height="3.5" rx="0.5" fill="#94a3b8" opacity="0.5" />
    {/* Trackpad */}
    <rect x="27" y="41.5" width="10" height="2.5" rx="0.5" fill="#94a3b8" opacity="0.7" />
    <defs>
      <linearGradient id="screenGrad" x1="13" y1="7" x2="51" y2="31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" />
        <stop offset="0.5" stopColor="#0ea5e9" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Mobile / Tablet Graphic
 */
const MobileGraphic = () => (
  <svg width="44" height="40" viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="28" height="40" rx="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
    <rect x="11" y="8" width="22" height="30" rx="1.5" fill="url(#mobileGrad)" />
    <circle cx="22" cy="6" r="0.8" fill="#64748b" />
    <circle cx="22" cy="41" r="1.2" fill="#64748b" />
    <defs>
      <linearGradient id="mobileGrad" x1="11" y1="8" x2="33" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Generic Asset Graphic
 */
const GenericGraphic = () => (
  <div style={{
    width: 44,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    border: '1px solid #e2e8f0'
  }}>
    <Package size={22} />
  </div>
);

/**
 * Helper to identify and purge any dummy mock data from earlier templates
 */
const isDummyMock = (item) => {
  if (!item || typeof item !== 'object') return true;
  if (item.id === 'asset_1') return true;
  if (item.serialNumber === '467758586') return true;
  if (item.serialNumber === 'DEL01' && item.estValue === '1200' && item.id === 'asset_1') return true;
  if (item.assetName === 'DELL' && (item.serialNumber === '467758586' || item.estValue === '23000')) return true;
  return false;
};

export default function AssetsStep({ data, employee, onChange }) {
  const empCode = employee?.employeeCode || data?.employeeCode || data?._id || data?.id || '';
  const empId = employee?.employeeId || employee?.employeeCode || employee?._id || employee?.id || data?.employeeId || data?.employeeCode || data?._id || data?.id || empCode;
  const storageKey = `novaspark_assets_emp_${empCode}`;

  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || activeCompany?._id;

  const [assets, setAssets] = useState(() => {
    // 1. Check data.assets or employee.assets
    const fromProps = Array.isArray(data?.assets) && data.assets.length > 0
      ? data.assets
      : (Array.isArray(employee?.assets) && employee.assets.length > 0 ? employee.assets : []);
    const cleanProps = fromProps.filter((a) => !isDummyMock(a));
    if (cleanProps.length > 0) return cleanProps;

    // 2. Check localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleanLocal = parsed.filter((a) => !isDummyMock(a));
          return cleanLocal;
        }
      }
    } catch {
      // ignore
    }

    // Default: completely empty list! NO static assets!
    return [];
  });

  const [inventoryAssets, setInventoryAssets] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [formValues, setFormValues] = useState({
    inventoryItemId: '',
    itemCode: '',
    assetType: '',
    assetName: '',
    serialNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    warrantyExpires: '',
    notifyOnExpiry: true,
    estValue: '',
    remarks: ''
  });

  // Fetch Inventory Assets from backend (strictly from user's inventory)
  useEffect(() => {
    let isMounted = true;
    const fetchInventory = async () => {
      if (!companyId) return;
      try {
        setLoadingInventory(true);
        const fetchedItems = await inventoryService.getItems(companyId);
        if (!isMounted) return;
        if (Array.isArray(fetchedItems)) {
          const assetsOnly = fetchedItems.filter((i) => {
            if (i.itemType === 'asset') return true;
            if (i.itemType === 'uniform') return false;
            const cat = (i.category || '').toLowerCase();
            const code = (i.itemCode || i.itemId || '').toLowerCase();
            if (code.startsWith('uni-') || code.startsWith('acc-')) return false;
            return cat !== 'uniform' && cat !== 'accessory' && cat !== 'clothing';
          });
          setInventoryAssets(assetsOnly);
        }
      } catch (err) {
        console.warn('Inventory fetch error:', err);
      } finally {
        if (isMounted) setLoadingInventory(false);
      }
    };

    fetchInventory();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // Fetch real issued assets for this employee from inventory backend
  useEffect(() => {
    let isMounted = true;
    const fetchIssuedAssets = async () => {
      if (!companyId || !empId) return;
      try {
        const issuedItems = await inventoryService.getIssuedItems(companyId, {
          employeeId: empId,
          issueType: 'asset'
        });
        if (!isMounted) return;
        if (Array.isArray(issuedItems) && issuedItems.length > 0) {
          const mapped = issuedItems
            .filter((item) => item.status !== 'Returned')
            .map((item) => ({
              id: item._id || item.issueId || item.id,
              inventoryItemId: item.itemId,
              itemCode: item.itemCode,
              assetType: item.category || 'Equipment',
              assetName: item.itemName || item.brand || 'Asset',
              serialNumber: item.serialNumber || item.itemCode || '',
              issueDate: item.issueDate || '',
              warrantyExpires: item.warrantyExpires || item.expectedReturnDate || '',
              notifyOnExpiry: item.notifyOnExpiry !== false,
              estValue: String(item.totalAmount || item.rate || ''),
              remarks: item.remarks || ''
            }))
            .filter((a) => !isDummyMock(a));

          if (mapped.length > 0) {
            setAssets((prev) => {
              const existingIds = new Set(mapped.map((m) => m.id || m.serialNumber));
              const extras = prev.filter(
                (p) => !isDummyMock(p) && !existingIds.has(p.id) && (!p.serialNumber || !existingIds.has(p.serialNumber))
              );
              return [...mapped, ...extras];
            });
          }
        }
      } catch (err) {
        console.warn('[AssetsStep] Could not fetch remote issued assets:', err);
      }
    };

    fetchIssuedAssets();
    return () => {
      isMounted = false;
    };
  }, [companyId, empId]);

  // Extract unique categories strictly from the user's inventory assets
  const inventoryCategories = useMemo(() => {
    const cats = new Set();
    inventoryAssets.forEach((item) => {
      if (item.category && item.category.trim()) {
        cats.add(item.category.trim());
      }
    });
    // If inventory has categories, use them; otherwise default to Equipment
    if (cats.size > 0) return Array.from(cats);
    return ['Equipment'];
  }, [inventoryAssets]);

  // Filter inventory assets by the selected Asset Type (Category)
  const availableInventoryAssets = useMemo(() => {
    if (!formValues.assetType) return [];
    return inventoryAssets.filter(
      (item) => (item.category || '').toLowerCase() === formValues.assetType.toLowerCase()
    );
  }, [inventoryAssets, formValues.assetType]);

  // Save clean changes to localStorage
  useEffect(() => {
    try {
      const cleanAssets = assets.filter((a) => !isDummyMock(a));
      localStorage.setItem(storageKey, JSON.stringify(cleanAssets));
    } catch {
      // ignore
    }
  }, [assets, storageKey]);

  const handleOpenAdd = () => {
    setEditingAsset(null);

    setFormValues({
      inventoryItemId: '',
      itemCode: '',
      assetType: '', // By default '-- Select Asset type --' is selected
      assetName: '', // By default '-- Select Asset name --' is selected
      serialNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      warrantyExpires: '',
      notifyOnExpiry: true,
      estValue: '',
      remarks: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAsset(item);
    setFormValues({
      inventoryItemId: item.inventoryItemId || '',
      itemCode: item.itemCode || '',
      assetType: item.assetType || '',
      assetName: item.assetName || '',
      serialNumber: item.serialNumber || '',
      issueDate: item.issueDate || '',
      warrantyExpires: (item.warrantyExpires && item.warrantyExpires !== 'Not Specified') ? item.warrantyExpires : '',
      notifyOnExpiry: item.notifyOnExpiry !== undefined ? item.notifyOnExpiry : true,
      estValue: item.estValue || '',
      remarks: item.remarks || ''
    });
    setModalOpen(true);
  };

  // When user selects Asset Type (Category) from inventory
  const handleCategoryChange = (e) => {
    const chosenCat = e.target.value;

    setFormValues((prev) => ({
      ...prev,
      assetType: chosenCat,
      inventoryItemId: '',
      itemCode: '',
      assetName: '', // Keep '-- Select Asset name --' by default
      serialNumber: '',
      estValue: '',
      remarks: ''
    }));
  };

  // When user selects Asset Name from inventory items
  const handleSelectAssetItem = (e) => {
    const chosenVal = e.target.value;
    if (!chosenVal) {
      setFormValues((prev) => ({
        ...prev,
        inventoryItemId: '',
        itemCode: '',
        assetName: '',
        serialNumber: '',
        estValue: ''
      }));
      return;
    }

    const selectedItem = inventoryAssets.find(
      (i) =>
        String(i.id || i.itemId || i._id) === String(chosenVal) ||
        i.itemCode === chosenVal ||
        i.itemName === chosenVal
    );

    if (selectedItem) {
      setFormValues((prev) => ({
        ...prev,
        inventoryItemId: selectedItem.itemId || selectedItem.id || selectedItem._id || '',
        itemCode: selectedItem.itemCode || '',
        assetType: selectedItem.category || prev.assetType || 'Equipment',
        assetName: selectedItem.itemName || '',
        serialNumber: selectedItem.itemCode || selectedItem.serialNumber || prev.serialNumber || '',
        estValue: String(selectedItem.purchaseRate || selectedItem.rate || prev.estValue || ''),
        remarks: selectedItem.description || (selectedItem.billNumber ? `Bill: ${selectedItem.billNumber}` : prev.remarks || '')
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        assetName: chosenVal
      }));
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formValues.assetName.trim()) {
      alert('Please select or enter an Asset Name');
      return;
    }

    try {
      setIsSaving(true);
      const updatedAssetObj = {
        ...formValues,
        id: editingAsset ? editingAsset.id : `asset_${Date.now()}`
      };

      let updatedAssets;
      if (editingAsset) {
        // Update existing
        updatedAssets = assets.map((item) =>
          item.id === editingAsset.id ? updatedAssetObj : item
        );
      } else {
        // Create new
        updatedAssets = [updatedAssetObj, ...assets.filter((a) => !isDummyMock(a))];
      }

      setAssets(updatedAssets);

      // Notify parent form so changes are saved to employee
      if (typeof onChange === 'function') {
        onChange({
          ...data,
          assets: updatedAssets
        });
      }

      // Register issuance in backend inventory if companyId exists
      if (!editingAsset && companyId) {
        try {
          const empName = employee?.name || data?.name || 'Employee';
          await inventoryService.issueItems(companyId, [{
            issueType: 'asset',
            employeeId: empId,
            employeeName: empName,
            itemId: formValues.inventoryItemId || `ast_${Date.now()}`,
            itemCode: formValues.itemCode || formValues.serialNumber || 'AST',
            itemName: formValues.assetName,
            category: formValues.assetType || 'Equipment',
            brand: formValues.assetName,
            quantity: 1,
            rate: Number(formValues.estValue) || 0,
            totalAmount: Number(formValues.estValue) || 0,
            serialNumber: formValues.serialNumber || '',
            issueDate: formValues.issueDate,
            remarks: formValues.remarks || 'Assigned via Employee Edit',
            status: 'Issued'
          }]);
        } catch (issueErr) {
          console.warn('Backend inventory issue notice:', issueErr);
        }
      }

      setModalOpen(false);
      setEditingAsset(null);
    } catch (err) {
      console.error('Error saving asset:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const assetToDelete = assets.find((item) => item.id === id);
    const updated = assets.filter((item) => item.id !== id);
    setAssets(updated);
    if (typeof onChange === 'function') {
      onChange({
        ...data,
        assets: updated
      });
    }
    setDeleteTargetId(null);

    // Delete or mark returned in backend inventory
    if (companyId && assetToDelete) {
      try {
        await inventoryService.deleteIssuedItem(companyId, id);
      } catch (delErr) {
        console.warn('Backend delete issued item error:', delErr);
      }
    }
  };

  const renderGraphic = (type, name) => {
    const combined = `${type || ''} ${name || ''}`.toLowerCase();
    if (combined.includes('laptop') || combined.includes('computer') || combined.includes('macbook')) {
      return <LaptopGraphic />;
    }
    if (combined.includes('mobile') || combined.includes('phone') || combined.includes('tablet') || combined.includes('ipad')) {
      return <MobileGraphic />;
    }
    return <GenericGraphic />;
  };

  return (
    <div className={styles.container}>
      {/* Top Header Row matching screenshot */}
      <div className={styles.headerRow}>
        <div className={styles.titleCol}>
          <h2 className={styles.title}>Assets</h2>
          <p className={styles.subtitle}>View or manage assets issued to the employee.</p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenAdd}
        >
          <PlusCircle size={16} />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Assets Card List */}
      {assets.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={40} className={styles.emptyIcon} />
          <h4 className={styles.emptyTitle}>No Assets Assigned</h4>
          <p className={styles.emptySub}>
            This employee does not currently have any company-owned assets or equipment assigned.
          </p>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAdd}
          >
            <PlusCircle size={15} />
            <span>Assign New Asset</span>
          </button>
        </div>
      ) : (
        <div className={styles.assetsList}>
          {assets.map((asset) => (
            <div key={asset.id} className={styles.assetCard}>
              {/* Graphic */}
              <div className={styles.deviceGraphicWrap}>
                {renderGraphic(asset.assetType, asset.assetName)}
              </div>

              {/* Column 1: Type & Brand & Serial */}
              <div className={styles.assetCol1}>
                <span className={styles.categoryLabel}>{asset.assetType || 'Equipment'}</span>
                <span className={styles.assetName}>{asset.assetName}</span>
                <span className={styles.assetSerial}>
                  SN: {asset.serialNumber || 'N/A'}
                </span>
              </div>

              {/* Column 2: Issued Date & Warranty */}
              <div className={styles.assetCol2}>
                <span className={styles.infoLabel}>Issued On</span>
                <span className={styles.infoValBold}>
                  {formatDisplayDate(asset.issueDate)}
                </span>
                <span className={styles.infoSub}>
                  Warranty Expires: <strong>{formatDisplayDate(asset.warrantyExpires)}</strong>
                </span>
              </div>

              {/* Column 3: Estimated Value */}
              <div className={styles.assetCol3}>
                <span className={styles.infoLabel}>Est. Value</span>
                <span className={styles.infoValBold}>
                  {asset.estValue || '—'}
                </span>
              </div>

              {/* Column 4: Edit & Delete Action Buttons */}
              <div className={styles.assetActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => handleOpenEdit(asset)}
                  title="Edit Asset"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => setDeleteTargetId(asset.id)}
                  title="Delete Asset"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAsset ? 'Edit Asset' : 'Add Asset'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  {/* Field 1: Asset Type (Shows Category from Inventory Assets) */}
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className={styles.label}>Asset Type</label>
                      {loadingInventory && (
                        <span style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Loader2 size={11} className={styles.spinner} /> Syncing...
                        </span>
                      )}
                    </div>
                    <select
                      className={styles.select}
                      value={formValues.assetType}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="">Select Asset type</option>
                      {inventoryCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {/* Preserve existing category in edit mode if not present */}
                      {formValues.assetType && !inventoryCategories.includes(formValues.assetType) && (
                        <option value={formValues.assetType}>{formValues.assetType}</option>
                      )}
                    </select>
                  </div>

                  {/* Field 2: Asset Name (Shows Assets from Inventory under Selected Category) */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Asset Name *</label>
                    <select
                      className={styles.select}
                      value={formValues.inventoryItemId || formValues.assetName}
                      onChange={handleSelectAssetItem}
                      disabled={!formValues.assetType}
                      required
                    >
                      <option value="">
                        {formValues.assetType ? 'Select Asset name' : 'Select Asset type first'}
                      </option>
                      {availableInventoryAssets.map((item) => (
                        <option
                          key={item.id || item.itemId || item._id}
                          value={item.id || item.itemId || item._id}
                        >
                          {item.itemName}{item.brand ? ` — ${item.brand}` : ''} [Avail: {item.availableQuantity ?? 0}]
                        </option>
                      ))}
                      {/* Preserve existing asset name in edit mode */}
                      {formValues.assetName &&
                        !availableInventoryAssets.some(
                          (i) =>
                            i.itemName === formValues.assetName ||
                            String(i.id || i.itemId || i._id) === String(formValues.inventoryItemId)
                        ) && (
                          <option value={formValues.assetName}>{formValues.assetName}</option>
                        )}
                    </select>
                  </div>

                  {/* Field 3: Serial Number */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Serial Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. DEL01"
                      value={formValues.serialNumber}
                      onChange={(e) => setFormValues({ ...formValues, serialNumber: e.target.value })}
                    />
                  </div>

                  {/* Field 4: Date of Issue */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Date of Issue</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formValues.issueDate}
                      onChange={(e) => setFormValues({ ...formValues, issueDate: e.target.value })}
                    />
                  </div>

                  {/* Field 5: Estimated Value (₹) */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estimated Value (₹)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 1200"
                      value={formValues.estValue}
                      onChange={(e) => setFormValues({ ...formValues, estValue: e.target.value })}
                    />
                  </div>

                  {/* Field 6: Warranty Expiry */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Warranty Expiry</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formValues.warrantyExpires}
                      onChange={(e) => setFormValues({ ...formValues, warrantyExpires: e.target.value })}
                    />
                    <label className={styles.notifyToggleWrap}>
                      <span className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={formValues.notifyOnExpiry}
                          onChange={(e) => setFormValues({ ...formValues, notifyOnExpiry: e.target.checked })}
                        />
                        <span className={styles.slider} />
                      </span>
                      <span className={styles.toggleLabel}>Notify on Expiry</span>
                      <span className={styles.infoBadge} title="Send notification before warranty expires">i</span>
                    </label>
                  </div>

                  {/* Field 7: Remarks / Specifications */}
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.label}>Remarks / Specifications</label>
                    <textarea
                      rows={3}
                      className={styles.input}
                      placeholder="e.g. DELL Laptop, Charger issued..."
                      value={formValues.remarks}
                      onChange={(e) => setFormValues({ ...formValues, remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 size={14} className={styles.spinner} /> Assigning...
                    </span>
                  ) : (
                    editingAsset ? 'Update Asset' : 'Save Asset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteTargetId(null)}>
          <div className={styles.modalContent} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Delete</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13.5, color: '#334155' }}>
                Are you sure you want to remove this asset? This action will unassign and remove the asset record.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                style={{ backgroundColor: '#0f24e4ff' }}
                onClick={() => handleDelete(deleteTargetId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
