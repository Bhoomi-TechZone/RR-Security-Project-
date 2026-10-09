import React, { useState, useEffect, useMemo } from 'react';
import {
  Shirt,
  Shield,
  Radio,
  CreditCard,
  Package,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Search,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  Info,
  Download,
  Printer,
  X,
  Lock,
  Calendar,
  Sparkles,
  Tag,
  Plus,
  Send,
  Loader2,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import styles from './MyAssetsUniform.module.css';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import preferenceService from '../../services/preferenceService';
import inventoryService from '../../services/inventoryService';

const STANDARD_SIZES = [
  'Free Size', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
  '28', '30', '32', '34', '36', '38',
  '6', '7', '8', '9', '10', '11',
  'Standard', 'N/A'
];

const REQUISITION_REASONS = [
  'New Joining Issue',
  'Damaged Item Replacement',
  'Worn Out / Torn Condition',
  'Size Mismatch / Fitting Adjustment',
  'Lost / Missing Equipment',
  'Additional Duty Set Requirement',
  'Transfer to New Client Site',
  'Seasonal Gear (Winter / Rain Jacket)',
  'Other Operational Requirement'
];

function getItemIcon(category, itemType) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('uniform') || cat.includes('cloth') || cat.includes('shirt') || cat.includes('trouser')) {
    return Shirt;
  }
  if (cat.includes('safe') || cat.includes('shield') || cat.includes('vest')) {
    return Shield;
  }
  if (cat.includes('radio') || cat.includes('walkie') || cat.includes('torch') || cat.includes('equipment')) {
    return Radio;
  }
  if (cat.includes('card') || cat.includes('id') || cat.includes('badge')) {
    return CreditCard;
  }
  return Package;
}

export default function MyAssetsUniform() {
  const { activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || {};
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';
  const employeeId = currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || currentUser?._id || '';
  const employeeName = currentUser?.name || currentUser?.fullName || currentUser?.employeeName || '';
  const employeeEmail = currentUser?.email || '';

  const [portalAccess, setPortalAccess] = useState({
    enabled: true,
    allowAssetsUniform: true
  });
  const [loading, setLoading] = useState(true);
  const [issuedItems, setIssuedItems] = useState([]);
  const [returnRecords, setReturnRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'uniform' | 'equipment' | 'requests' | 'returns'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Requisition Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requestType: 'uniform', // 'uniform' | 'asset'
    itemId: '',
    itemCode: '',
    itemName: '',
    category: 'Uniform',
    brand: '',
    size: '36',
    color: 'Navy Blue',
    quantity: 1,
    unit: 'Pcs',
    reason: 'New Joining Issue',
    urgency: 'Normal',
    notes: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // 1. Fetch Portal Access, Issued Items, Requests & Master Catalog
  const fetchData = async () => {
    try {
      setLoading(true);
      // Load company preferences to check if Assets/Uniform permission is granted
      const access = await preferenceService.getEmployeePortalAccess(companyId);
      if (access) {
        setPortalAccess(access);
      }

      // Load Issued items strictly for this employee
      let items = [];
      try {
        items = await inventoryService.getIssuedItems(companyId, { 
          employeeId,
          employeeName,
          employeeEmail
        });
      } catch (e) {
        console.warn('Could not load issued items from backend:', e);
      }

      // Extra safeguard: Only keep records assigned to this employee
      const myIssuedItems = (items || []).filter((item) => {
        const itemEmpId = String(item.employeeId || item.employeeCode || '').trim().toLowerCase();
        const curEmpId = String(employeeId || '').trim().toLowerCase();
        const curEmpCode = String(currentUser?.employeeCode || '').trim().toLowerCase();
        const itemEmpName = String(item.employeeName || '').trim().toLowerCase();
        const curEmpName = String(employeeName || '').trim().toLowerCase();
        const itemEmail = String(item.employeeEmail || item.email || '').trim().toLowerCase();
        const curEmail = String(employeeEmail || '').trim().toLowerCase();

        const matchId = (curEmpId && itemEmpId && (itemEmpId === curEmpId || itemEmpId === curEmpCode)) || false;
        const matchName = (curEmpName && itemEmpName && itemEmpName === curEmpName) || false;
        const matchEmail = (curEmail && itemEmail && itemEmail === curEmail) || false;

        return matchId || matchName || matchEmail;
      });

      // Load Return Records strictly for this employee
      let returns = [];
      try {
        returns = await inventoryService.getReturnRecords(companyId, { 
          employeeId,
          employeeName
        });
      } catch (e) {
        console.warn('Could not load returns from backend:', e);
      }

      // Load Employee's Requisition Requests
      let reqs = [];
      try {
        reqs = await inventoryService.getRequests(companyId, { 
          employeeId,
          employeeName
        });
      } catch (e) {
        console.warn('Could not load requests from backend:', e);
      }

      // Load Inventory Masters for selection dropdown in Requisition form
      let masters = [];
      try {
        masters = await inventoryService.getItems(companyId);
      } catch (e) {
        console.warn('Could not load master items from backend:', e);
      }

      setIssuedItems(myIssuedItems);
      setReturnRecords(returns || []);
      setRequests(reqs || []);
      setMasterItems(masters || []);
    } catch (err) {
      console.error('Error loading employee assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId, employeeId]);

  // Tab counts
  const uniformCount = useMemo(() => {
    return issuedItems.filter(
      (i) =>
        i.itemType === 'uniform' ||
        ['uniform', 'accessory', 'clothing'].includes((i.category || '').toLowerCase())
    ).length;
  }, [issuedItems]);

  const equipmentCount = useMemo(() => {
    return issuedItems.filter(
      (i) =>
        i.itemType !== 'uniform' &&
        !['uniform', 'accessory', 'clothing'].includes((i.category || '').toLowerCase())
    ).length;
  }, [issuedItems]);

  const requestsCount = useMemo(() => requests.length, [requests]);
  const returnCount = useMemo(() => returnRecords.length, [returnRecords]);

  // Dynamic Catalog Items for the chosen request type (Uniform vs Asset)
  const catalogItems = useMemo(() => {
    return masterItems.filter((m) => {
      const isUniform =
        m.itemType === 'uniform' ||
        ['uniform', 'accessory', 'clothing', 'apparel'].includes((m.category || '').toLowerCase());
      return formData.requestType === 'uniform' ? isUniform : !isUniform;
    });
  }, [masterItems, formData.requestType]);

  // Distinct Items by item name (no duplicate rows, clean catalog list)
  const distinctCatalogItems = useMemo(() => {
    const seen = new Set();
    const unique = [];
    for (const item of catalogItems) {
      const name = (item.itemName || '').trim();
      const lower = name.toLowerCase();
      if (name && !seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique;
  }, [catalogItems]);

  // Selected Master Item object from Admin Stock
  const selectedMasterItem = useMemo(() => {
    if (!formData.itemName) return null;
    return masterItems.find(
      (m) => (m.itemName || '').toLowerCase().trim() === formData.itemName.toLowerCase().trim()
    ) || null;
  }, [formData.itemName, masterItems]);

  // Dynamic Unit of Measurement options derived from Admin Master Catalog
  const availableUnits = useMemo(() => {
    const units = Array.from(new Set(catalogItems.map((m) => m.unit).filter(Boolean)));
    if (units.length > 0) {
      return units;
    }
    return formData.requestType === 'uniform' ? ['Pcs', 'Pair', 'Set', 'Kit', 'Box'] : ['Pcs', 'Set', 'Kit', 'Box', 'Nos'];
  }, [catalogItems, formData.requestType]);

  // Dynamic Sizes derived from Admin Master Catalog for selected item + Standard Sizes
  const availableSizes = useMemo(() => {
    if (formData.requestType !== 'uniform') return ['Standard', 'N/A'];

    // 1. Sizes configured by admin for items with this exact item name
    const matchingItems = masterItems.filter(
      (m) =>
        m.itemName &&
        formData.itemName &&
        m.itemName.toLowerCase().trim() === formData.itemName.toLowerCase().trim()
    );
    const itemSpecificSizes = Array.from(new Set(matchingItems.map((m) => m.size).filter(Boolean)));

    // 2. All sizes in admin uniform inventory
    const allUniformSizes = Array.from(
      new Set(
        masterItems
          .filter((m) => m.itemType === 'uniform' || (m.category || '').toLowerCase().includes('uniform'))
          .map((m) => m.size)
          .filter(Boolean)
      )
    );

    // Combine item-specific sizes, inventory sizes, then standard sizes without duplicates
    const combined = Array.from(
      new Set([...itemSpecificSizes, ...allUniformSizes, ...STANDARD_SIZES])
    );
    return combined;
  }, [masterItems, formData.itemName, formData.requestType]);

  // Dynamic Colours derived from Admin Master Catalog for selected item + Standard Colours
  const availableColors = useMemo(() => {
    if (formData.requestType !== 'uniform') return ['Standard / N/A'];

    // 1. Colours configured by admin for items with this exact item name
    const matchingItems = masterItems.filter(
      (m) =>
        m.itemName &&
        formData.itemName &&
        m.itemName.toLowerCase().trim() === formData.itemName.toLowerCase().trim()
    );
    const itemSpecificColors = Array.from(new Set(matchingItems.map((m) => m.color).filter(Boolean)));

    // 2. All colours in admin uniform inventory
    const allUniformColors = Array.from(
      new Set(
        masterItems
          .filter((m) => m.itemType === 'uniform' || (m.category || '').toLowerCase().includes('uniform'))
          .map((m) => m.color)
          .filter(Boolean)
      )
    );

    const standardColors = [
      'Navy Blue',
      'Khaki',
      'Black',
      'White',
      'Steel Grey',
      'High-Vis Orange',
      'Fluorescent Green',
      'Standard / N/A'
    ];

    return Array.from(new Set([...itemSpecificColors, ...allUniformColors, ...standardColors]));
  }, [masterItems, formData.itemName, formData.requestType]);

  // Handle Master Item Selection in Form by Name
  const handleItemSelect = (e) => {
    const selectedName = e.target.value;
    if (!selectedName) {
      setFormData((prev) => ({
        ...prev,
        itemId: '',
        itemCode: '',
        itemName: '',
        category: prev.requestType === 'uniform' ? 'Uniform' : 'Equipment',
        brand: '',
        size: prev.requestType === 'uniform' ? '36' : 'Standard',
        color: prev.requestType === 'uniform' ? 'Navy Blue' : 'Standard',
        unit: availableUnits[0] || 'Pcs'
      }));
      return;
    }

    const item = masterItems.find(
      (m) => (m.itemName || '').trim().toLowerCase() === selectedName.trim().toLowerCase()
    );
    if (item) {
      setFormData((prev) => ({
        ...prev,
        itemId: item.id || item.itemId || item._id || '',
        itemCode: item.itemCode || '',
        itemName: item.itemName || selectedName,
        category: item.category || (prev.requestType === 'uniform' ? 'Uniform' : 'Equipment'),
        brand: item.brand || '',
        size: item.size || (prev.requestType === 'uniform' ? '36' : 'Standard'),
        color: item.color || (prev.requestType === 'uniform' ? 'Navy Blue' : 'Standard'),
        unit: item.unit || availableUnits[0] || 'Pcs'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        itemName: selectedName
      }));
    }
  };

  // Submit Requisition Request
  const handleSubmitRequisition = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim()) {
      showToast('Please select or specify the uniform/asset item name.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        employeeId,
        employeeName,
        designation: currentUser.designation || currentUser.role || 'Security Guard',
        department: currentUser.department || 'Operations',
        clientName: currentUser.clientName || activeCompany?.name || 'Central Post',
        site: currentUser.site || currentUser.workLocation || 'Main Facility'
      };

      const res = await inventoryService.createRequest(companyId, payload);
      showToast(res.message || 'Uniform/Asset request submitted successfully!', 'success');
      setIsApplyModalOpen(false);
      
      // Reset form
      setFormData({
        requestType: 'uniform',
        itemId: '',
        itemCode: '',
        itemName: '',
        category: 'Uniform',
        brand: '',
        size: 'L',
        color: 'Navy Blue',
        quantity: 1,
        unit: 'Pcs',
        reason: 'New Joining Issue',
        urgency: 'Normal',
        notes: ''
      });

      // Refresh data and switch to requests tab
      await fetchData();
      setActiveTab('requests');
    } catch (err) {
      console.error('Failed to submit asset request:', err);
      showToast(err.message || 'Failed to submit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to cancel this requisition request?')) return;
    try {
      await inventoryService.deleteRequest(companyId, reqId);
      showToast('Requisition request cancelled.', 'info');
      setRequests((prev) => prev.filter((r) => r.id !== reqId && r.requestId !== reqId));
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'error');
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return issuedItems.filter((item) => {
      const isUniform =
        item.itemType === 'uniform' ||
        ['uniform', 'accessory', 'clothing'].includes((item.category || '').toLowerCase());

      if (activeTab === 'uniform' && !isUniform) return false;
      if (activeTab === 'equipment' && isUniform) return false;
      if (activeTab === 'returns' || activeTab === 'requests') return false;

      if (statusFilter !== 'all') {
        if (item.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.itemName || '').toLowerCase().includes(q);
        const matchesCode = (item.itemCode || '').toLowerCase().includes(q);
        const matchesBrand = (item.brand || '').toLowerCase().includes(q);
        const matchesSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchesIssueId = (item.issueId || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesBrand || matchesSerial || matchesIssueId;
      }

      return true;
    });
  }, [issuedItems, activeTab, statusFilter, searchQuery]);

  // If Assets/Uniform tab is disabled by Company Admin in Preferences
  if (!loading && (portalAccess.enabled === false || portalAccess.allowAssetsUniform === false)) {
    return (
      <div className={styles.container}>
        <div className={styles.disabledBanner}>
          <Lock size={48} className={styles.disabledIcon} />
          <h2 className={styles.disabledTitle}>Assets & Uniform Access Disabled</h2>
          <p className={styles.disabledDesc}>
            The Assets & Uniform self-service module is currently not enabled for employees by your
            organization administrator in Company Preferences. Please contact HR or Operations Desk
            for uniform queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header Section */}
      <div className={styles.headerSection}>
        <div>
          <div className={styles.eyebrow}>Employee Self-Service / Custody & Requisition</div>
          <h1 className={styles.title}>
            <Shirt size={28} className={styles.titleIcon} />
            My Assets & Uniforms
          </h1>
          <p className={styles.subtitle}>
            View assigned duty uniforms, protective equipment, apply for new items or replacements,
            and track admin approval & custody issuance status.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.applyActionBtn}
            onClick={() => setIsApplyModalOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Apply for Uniform / Asset</span>
          </button>
          
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => window.print()}
          >
            <Printer size={15} />
            <span>Print Custody Card</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Package size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Issued Items</span>
            <span className={styles.kpiValue}>{issuedItems.length}</span>
            <span className={styles.kpiMeta}>Active in your custody</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconIndigo}`}>
            <Shirt size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Uniforms & Apparel</span>
            <span className={styles.kpiValue}>{uniformCount}</span>
            <span className={styles.kpiMeta}>Shirts, trousers, caps & belts</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconAmber}`}>
            <FileText size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>My Requisitions</span>
            <span className={styles.kpiValue}>{requestsCount}</span>
            <span className={styles.kpiMeta}>
              {requests.filter((r) => r.status === 'Pending Review').length} Pending Review
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <RotateCcw size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Returned / Replaced</span>
            <span className={styles.kpiValue}>{returnCount}</span>
            <span className={styles.kpiMeta}>Cleared back to warehouse</span>
          </div>
        </div>
      </div>

      {/* Main Card with Tabs & Grid */}
      <div className={styles.mainCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.tabsGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Items</span>
              <span className={styles.tabCount}>{issuedItems.length}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'uniform' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('uniform')}
            >
              <Shirt size={14} />
              <span>Uniforms</span>
              <span className={styles.tabCount}>{uniformCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'equipment' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('equipment')}
            >
              <Shield size={14} />
              <span>Equipment & Kits</span>
              <span className={styles.tabCount}>{equipmentCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <FileText size={14} />
              <span>My Requests</span>
              <span className={styles.tabCount}>{requestsCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'returns' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <RotateCcw size={14} />
              <span>Return History</span>
              <span className={styles.tabCount}>{returnCount}</span>
            </button>
          </div>

          <div className={styles.filtersGroup}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search item, code, brand, serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab !== 'returns' && activeTab !== 'requests' && (
              <select
                className={styles.selectInput}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Issued">Issued</option>
                <option value="Active">Active</option>
                <option value="Returned">Returned</option>
              </select>
            )}
          </div>
        </div>

        {/* 1. MY REQUESTS TAB */}
        {activeTab === 'requests' ? (
          <div style={{ padding: '20px' }}>
            {requests.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FileText size={28} />
                </div>
                <h3 className={styles.emptyTitle}>No Requisition Requests Yet</h3>
                <p className={styles.emptyDesc}>
                  Need a new security uniform, jacket, flashlight, or replacement gear? Click "Apply for
                  Uniform / Asset" above to submit a requisition to Admin.
                </p>
                <button
                  type="button"
                  className={styles.applyActionBtn}
                  style={{ marginTop: '8px' }}
                  onClick={() => setIsApplyModalOpen(true)}
                >
                  <Plus size={15} /> Apply Now
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Request ID</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Item Name & Category</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Size / Qty</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Reason</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Urgency</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Request Date</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#475569', textAlign: 'right' }}>Action / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const isPending = req.status === 'Pending Review';
                      const isApproved = req.status === 'Approved';
                      const isAssigned = req.status === 'Assigned';
                      const isRejected = req.status === 'Rejected';

                      return (
                        <tr key={req.id || req._id || req.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace' }}>
                            {req.requestId}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <strong style={{ color: '#0f172a' }}>{req.itemName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {req.category} {req.brand ? `• ${req.brand}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {req.size || 'Free Size'} ({req.quantity} {req.unit || 'Pcs'})
                          </td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>
                            {req.reason}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className={
                                req.urgency === 'Urgent'
                                  ? styles.urgencyUrgent
                                  : req.urgency === 'High'
                                  ? styles.urgencyHigh
                                  : styles.urgencyNormal
                              }
                            >
                              {req.urgency || 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>
                            {req.requestDate || '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusBadge status={req.status || 'Pending Review'} />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {isPending ? (
                              <button
                                type="button"
                                className={styles.cancelActionBtn}
                                onClick={() => handleCancelRequest(req.id || req.requestId)}
                                title="Cancel this pending request"
                              >
                                <Trash2 size={13} /> Cancel
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {req.adminRemarks || (isAssigned ? 'Item Assigned' : isApproved ? 'Approved by Admin' : 'Closed')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'returns' ? (
          /* 2. RETURN HISTORY TAB */
          <div style={{ padding: '20px' }}>
            {returnRecords.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <RotateCcw size={28} />
                </div>
                <h3 className={styles.emptyTitle}>No Returned Assets Found</h3>
                <p className={styles.emptyDesc}>
                  You have not surrendered or returned any uniform or equipment items yet.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Return ID</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Item Name & Code</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Return Date</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Returned Condition</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Quantity</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnRecords.map((ret) => (
                      <tr key={ret.id || ret._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ret.returnId || 'RET-001'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <strong>{ret.itemName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{ret.itemCode}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{ret.returnDate || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={ret.condition || 'Good'} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>{ret.quantity || 1} {ret.unit || 'Pcs'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{ret.receivedBy || 'Logistics Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* 3. ISSUED ASSETS & UNIFORMS GRID */
          <>
            {filteredItems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Package size={28} />
                </div>
                <h3 className={styles.emptyTitle}>No Issued Items Match Filter</h3>
                <p className={styles.emptyDesc}>
                  Try clearing your search query or submit an application if you need uniform items.
                </p>
                <button
                  type="button"
                  className={styles.applyActionBtn}
                  style={{ marginTop: '8px' }}
                  onClick={() => setIsApplyModalOpen(true)}
                >
                  <Plus size={15} /> Apply for Uniform
                </button>
              </div>
            ) : (
              <div className={styles.assetsGrid}>
                {filteredItems.map((item) => {
                  const ItemIcon = getItemIcon(item.category, item.itemType);
                  return (
                    <div key={item.id || item._id || item.issueId} className={styles.assetCard}>
                      <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div className={styles.itemIconCircle}>
                            <ItemIcon size={20} />
                          </div>
                          <div className={styles.itemHeadInfo}>
                            <span className={styles.itemName}>{item.itemName}</span>
                            <span className={styles.itemCode}>
                              {item.itemCode} • {item.brand || 'NovaGear'}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={item.status || 'Issued'} />
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Quantity & Unit</span>
                          <span className={styles.detailValue}>
                            {item.quantity} {item.unit || 'Pcs'}
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Size / Color</span>
                          <span className={styles.detailValue}>
                            {item.size || 'Free Size'} {item.color ? `• ${item.color}` : ''}
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Issued Date</span>
                          <span className={styles.detailValue}>{item.issueDate || '—'}</span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Issued Condition</span>
                          <span className={styles.detailValue}>{item.condition || 'Brand New'}</span>
                        </div>

                        {item.serialNumber && (
                          <div className={styles.detailRow} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Serial Number / Tag</span>
                            <span className={styles.detailValue} style={{ fontFamily: 'monospace' }}>
                              {item.serialNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        <span>Issue ID: <strong>{item.issueId || 'ISS-2026'}</strong></span>
                        <button
                          type="button"
                          className={styles.viewDetailBtn}
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye size={14} />
                          <span>View Custody Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Uniform & Safety Care Policy Callout */}
      <div className={styles.policyCard}>
        <Info size={22} className={styles.policyIcon} />
        <div className={styles.policyContent}>
          <h4>Guard Uniform & Asset Custody Guidelines</h4>
          <p>
            Issued uniforms, badges, flashlights and tactical gear remain the property of the
            organization. Security personnel are responsible for the daily maintenance, cleanliness,
            and secure custody of all assigned assets.
          </p>
          <ul className={styles.policyList}>
            <li>Wear clean, pressed uniforms and official photo badge on duty at all times.</li>
            <li>Report damaged, lost, or malfunctioning equipment to your Site Supervisor immediately.</li>
            <li>Submit a Requisition Request whenever replacement or size exchange is needed.</li>
            <li>All issued equipment must be returned to HR/Logistics upon transfer or separation.</li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: APPLY FOR UNIFORM / ASSET REQUISITION FORM
          ========================================================================= */}
      {isApplyModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => !isSubmitting && setIsApplyModalOpen(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Plus size={18} style={{ color: '#2563eb', verticalAlign: 'middle', marginRight: 6 }} />
                Apply for Uniform / Asset Requisition
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                disabled={isSubmitting}
                onClick={() => setIsApplyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition}>
              <div className={styles.modalBody}>
                {/* 1. Request Type */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.formLabel}>
                      Requisition Category Type <span className={styles.requiredStar}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: formData.requestType === 'uniform' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.requestType === 'uniform' ? '#eff6ff' : '#ffffff',
                          color: formData.requestType === 'uniform' ? '#1d4ed8' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            requestType: 'uniform',
                            category: 'Uniform',
                            itemId: '',
                            itemCode: '',
                            itemName: '',
                            brand: '',
                            size: 'L',
                            color: 'Navy Blue',
                            unit: 'Pcs'
                          }));
                        }}
                      >
                        <Shirt size={18} />
                        <span>Uniform & Apparel</span>
                      </button>

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: formData.requestType === 'asset' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.requestType === 'asset' ? '#eff6ff' : '#ffffff',
                          color: formData.requestType === 'asset' ? '#1d4ed8' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            requestType: 'asset',
                            category: 'Equipment',
                            itemId: '',
                            itemCode: '',
                            itemName: '',
                            brand: '',
                            size: 'Standard',
                            color: 'Standard',
                            unit: 'Pcs'
                          }));
                        }}
                      >
                        <Shield size={18} />
                        <span>Asset & Equipment</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Select from Master Catalog added by Admin */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Select {formData.requestType === 'uniform' ? 'Uniform Item' : 'Asset Item'} (Added by Admin) <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    value={formData.itemName}
                    onChange={handleItemSelect}
                  >
                    <option value="">
                      -- Choose {formData.requestType === 'uniform' ? 'Uniform Item' : 'Asset Item'} --
                    </option>
                    {distinctCatalogItems.map((m) => (
                      <option key={m.itemName} value={m.itemName}>
                        {m.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Item Name & Category */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Item Name <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder={formData.requestType === 'uniform' ? 'e.g. Guard Shirt, Trousers, Peak Cap' : 'e.g. Torch, Walkie Talkie, Safety Vest, ID Card'}
                      value={formData.itemName}
                      required
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Category <span className={styles.requiredStar}>*</span>
                    </label>
                    {formData.requestType === 'uniform' ? (
                      <select
                        className={styles.formSelect}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Uniform">Uniform</option>
                        <option value="Accessory">Accessory</option>
                        <option value="Clothing">Clothing</option>
                      </select>
                    ) : (
                      <select
                        className={styles.formSelect}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Equipment">Equipment</option>
                        <option value="Safety Gear">Safety Gear</option>
                        <option value="ID Card">ID Card</option>
                        <option value="Security Kit">Security Kit</option>
                        <option value="Other">Other Asset</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* 4. UNIFORM ONLY: Size and Colour */}
                {formData.requestType === 'uniform' && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Size Required <span className={styles.requiredStar}>*</span>
                      </label>
                      <select
                        className={styles.formSelect}
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      >
                        {availableSizes.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Colour <span className={styles.requiredStar}>*</span>
                      </label>
                      <select
                        className={styles.formSelect}
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      >
                        {availableColors.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 5. Quantity & Unit of Measurement */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Quantity <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className={styles.formInput}
                      value={formData.quantity}
                      required
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Unit of Measurement <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.formSelect}
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Reason & Urgency Priority */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Reason for Requisition <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.formSelect}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    >
                      {REQUISITION_REASONS.map((rsn) => (
                        <option key={rsn} value={rsn}>{rsn}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Urgency Priority <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.formSelect}
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    >
                      <option value="Normal">Normal (Routine Cycle)</option>
                      <option value="High">High (Immediate Duty Deployment)</option>
                      <option value="Urgent">Urgent (Damaged / Lost Critical Gear)</option>
                    </select>
                  </div>
                </div>

                {/* 7. Notes & Measurements */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Additional Notes / Measurements / Details
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Provide additional details regarding replacement reasons, fitting requirements, or specific requests..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={isSubmitting}
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Requisition</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VIEW CUSTODY DETAILS MODAL
          ========================================================================= */}
      {selectedItem && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Asset & Uniform Custody Record</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div className={styles.itemIconCircle} style={{ width: '48px', height: '48px' }}>
                  {React.createElement(getItemIcon(selectedItem.category, selectedItem.itemType), { size: 24 })}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a' }}>
                    {selectedItem.itemName}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Code: <strong style={{ color: '#0f172a' }}>{selectedItem.itemCode}</strong> | Issue ID:{' '}
                    <strong>{selectedItem.issueId}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.modalGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Category</span>
                  <span className={styles.detailValue}>{selectedItem.category || 'Uniform'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Brand</span>
                  <span className={styles.detailValue}>{selectedItem.brand || 'NovaGear'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Size</span>
                  <span className={styles.detailValue}>{selectedItem.size || 'Standard'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Color</span>
                  <span className={styles.detailValue}>{selectedItem.color || 'Standard'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Quantity</span>
                  <span className={styles.detailValue}>{selectedItem.quantity} {selectedItem.unit || 'Pcs'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Issued Condition</span>
                  <span className={styles.detailValue}>{selectedItem.condition || 'Brand New'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Issued Date</span>
                  <span className={styles.detailValue}>{selectedItem.issueDate || '—'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Issued By</span>
                  <span className={styles.detailValue}>{selectedItem.issuedBy || 'Logistics Admin'}</span>
                </div>
                {selectedItem.serialNumber && (
                  <div className={styles.detailRow} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Asset Serial / RFID Tag</span>
                    <span className={styles.detailValue} style={{ fontFamily: 'monospace' }}>
                      {selectedItem.serialNumber}
                    </span>
                  </div>
                )}
                {selectedItem.remarks && (
                  <div className={styles.detailRow} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Issuance Remarks</span>
                    <span className={styles.detailValue}>{selectedItem.remarks}</span>
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569' }}>
                <strong>Digital Custody Status:</strong> Acknowledged & Signed by {employeeName}. Return due upon reassignment or separation clearance.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  showToast('Custody acknowledgment statement downloaded.', 'success');
                  setSelectedItem(null);
                }}
              >
                <Download size={14} />
                <span>Download Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
