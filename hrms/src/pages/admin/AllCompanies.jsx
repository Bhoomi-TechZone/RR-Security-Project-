import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, RefreshCw, CheckCircle2, Shield,
  MapPin, Phone, Mail, Edit3, Trash2, Power, PowerOff, ExternalLink,
  Copy, Check, LayoutGrid, List, AlertTriangle, Landmark, ShieldCheck,
  MoreVertical, Eye, KeyRound, Image as ImageIcon
} from 'lucide-react';
import styles from './AllCompanies.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import AddCompanyProfileModal from '../../components/company/AddCompanyProfileModal';
import EditCompanyModal from '../../components/company/EditCompanyModal';
import ViewCompanyDetailsModal from '../../components/company/ViewCompanyDetailsModal';
import CompanyCredentialsModal from '../../components/company/CompanyCredentialsModal';
import BrandLogoModal from '../../components/company/BrandLogoModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';

function AllCompanies() {
  const navigate = useNavigate();
  const { companies, activeCompany, updateCompanyProfile, deleteCompanyProfile, refreshFromBackend } = useCompany();
  const { currentUser, isAdmin } = usePermissions();

  // RR Security Super Admin validation
  const isRRSecurity = Boolean(
    currentUser && (
      (currentUser.email && (
        currentUser.email.toLowerCase() === 'rrsecurity@gmail.com' ||
        currentUser.email.toLowerCase() === 'admin@rrsecurity.com' ||
        currentUser.email.toLowerCase().includes('rrsecurity')
      )) ||
      (currentUser.name && currentUser.name.toLowerCase().includes('rr security')) ||
      (currentUser.username && currentUser.username.toLowerCase().includes('rrsecurity')) ||
      (isAdmin && (
        activeCompany?.code === 'RRS' ||
        activeCompany?.companyId === 'RRS8392014SEC' ||
        activeCompany?.isDefault ||
        activeCompany?.name?.toLowerCase().includes('rr security')
      ))
    )
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingDetailsCompany, setViewingDetailsCompany] = useState(null);
  const [viewingCredentialsCompany, setViewingCredentialsCompany] = useState(null);
  const [isBrandLogoModalOpen, setIsBrandLogoModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    company: null,
    loading: false
  });
  const [statusConfirm, setStatusConfirm] = useState({
    isOpen: false,
    company: null,
    targetStatus: 'Inactive',
    loading: false
  });

  // Close any open dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleCloseDropdown = () => setOpenDropdownId(null);
    window.addEventListener('click', handleCloseDropdown);
    return () => window.removeEventListener('click', handleCloseDropdown);
  }, []);

  // Toast feedback state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromBackend();
      showToast('Company profiles refreshed successfully', 'success');
    } catch {
      showToast('Failed to refresh companies from server', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Company ID copied: ${id}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatusClick = (e, comp) => {
    e.stopPropagation();
    if (comp.isDefault || comp.companyId === 'RRS8392014SEC') {
      showToast('Primary Master Company (RR Security) cannot be deactivated', 'error');
      return;
    }
    const isInactive = comp.status === 'Inactive';
    const nextStatus = isInactive ? 'Active' : 'Inactive';
    setStatusConfirm({
      isOpen: true,
      company: comp,
      targetStatus: nextStatus,
      loading: false
    });
  };

  const confirmToggleStatus = async () => {
    const comp = statusConfirm.company;
    if (!comp) return;
    const nextStatus = statusConfirm.targetStatus;

    setStatusConfirm(prev => ({ ...prev, loading: true }));
    try {
      await updateCompanyProfile(comp.companyId || comp.id, { status: nextStatus });
      showToast(
        nextStatus === 'Inactive'
          ? `Company "${comp.name}" deactivated. Admin, employee & client login access is now suspended.`
          : `Company "${comp.name}" activated successfully! Login access restored.`,
        nextStatus === 'Inactive' ? 'info' : 'success'
      );
      setStatusConfirm({ isOpen: false, company: null, targetStatus: 'Inactive', loading: false });
    } catch (err) {
      showToast(err.message || 'Failed to update company status', 'error');
      setStatusConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteClick = (e, comp) => {
    e.stopPropagation();
    if (comp.isDefault || comp.companyId === 'RRS8392014SEC') {
      showToast('Primary Master Company (RR Security) cannot be deleted', 'error');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      company: comp,
      loading: false
    });
  };

  const confirmDelete = async () => {
    const comp = deleteConfirm.company;
    if (!comp) return;

    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await deleteCompanyProfile(comp.companyId || comp.id);
      showToast(`Company profile "${comp.name}" removed successfully`, 'success');
      setDeleteConfirm({ isOpen: false, company: null, loading: false });
    } catch (err) {
      showToast(err.message || 'Failed to delete company profile', 'error');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered companies list
  const filteredCompanies = useMemo(() => {
    return (companies || []).filter(comp => {
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && comp.status !== 'Inactive') ||
        (statusFilter === 'inactive' && comp.status === 'Inactive');

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        comp.name?.toLowerCase().includes(term) ||
        comp.code?.toLowerCase().includes(term) ||
        comp.companyId?.toLowerCase().includes(term) ||
        comp.city?.toLowerCase().includes(term) ||
        comp.state?.toLowerCase().includes(term) ||
        comp.email?.toLowerCase().includes(term) ||
        comp.gstin?.toLowerCase().includes(term) ||
        comp.pan?.toLowerCase().includes(term);

      return matchStatus && matchSearch;
    });
  }, [companies, statusFilter, searchTerm]);

  // Statistics calculation
  const totalCount = (companies || []).length;
  const activeCount = (companies || []).filter(c => c.status !== 'Inactive').length;
  const inactiveCount = (companies || []).filter(c => c.status === 'Inactive').length;
  const primaryComp = (companies || []).find(c => c.isDefault || c.companyId === 'RRS8392014SEC') || companies?.[0];

  // If not RR security user, show access restricted screen
  if (!isRRSecurity) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.emptyState} style={{ marginTop: '60px' }}>
            <div className={styles.emptyIconWrap} style={{ background: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 className={styles.emptyTitle}>Restricted Access</h2>
            <p className={styles.emptyText}>
              The All Company Management module is exclusively reserved for RR Security Master Administration.
            </p>
            <button
              className={styles.addBtn}
              onClick={() => navigate('/admin/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <button className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </button>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/company-setup')}>
            Organization
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>All Company</span>
        </nav>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <div className={styles.titleIconWrap}>
                <Building2 size={24} />
              </div>
              <h1 className={styles.title}>All Company Profiles</h1>
              <span className={styles.superAdminBadge}>
                <ShieldCheck size={14} />
                RR Security Master Admin
              </span>
            </div>
            <p className={styles.description}>
              Central multi-company directory. RR Security is the master company that creates another company and provisions its admin credentials. Added companies log in independently to access their isolated workspace.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh company profiles from database"
            >
              <RefreshCw size={15} className={isRefreshing ? styles.spinning : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {isRRSecurity && (
              <button
                type="button"
                className={styles.brandLogoBtn}
                onClick={() => setIsBrandLogoModalOpen(true)}
                title="Change master brand logo displayed on sidebar header across all companies"
              >
                <ImageIcon size={16} />
                <span>Brand Logo</span>
              </button>
            )}

            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add New Company</span>
            </button>
          </div>
        </header>

        {/* KPI Stats Grid */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Building2 size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{totalCount}</span>
              <span className={styles.statLabel}>Registered Companies</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{activeCount}</span>
              <span className={styles.statLabel}>Active Companies</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {inactiveCount}
              </span>
              <span className={styles.statLabel}>Inactive Companies</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: '#faf5ff', color: '#9333ea' }}>
              <Shield size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue} title={primaryComp?.name || 'RR Security'}>
                {primaryComp?.code || 'RRS'}
              </span>
              <span className={styles.statLabel}>Master Entity (RR Security)</span>
            </div>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search companies by name, code, ID, city, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.statusTabs}>
              <button
                type="button"
                className={`${styles.statusTabBtn} ${statusFilter === 'all' ? styles.statusTabActive : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                className={`${styles.statusTabBtn} ${statusFilter === 'active' ? styles.statusTabActive : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                className={`${styles.statusTabBtn} ${statusFilter === 'inactive' ? styles.statusTabActive : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive ({inactiveCount})
              </button>
            </div>

            <div className={styles.viewModeToggle}>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid cards view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Company Content: Grid or Table */}
        {filteredCompanies.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <Building2 size={32} />
            </div>
            <h3 className={styles.emptyTitle}>No Company Profiles Found</h3>
            <p className={styles.emptyText}>
              {searchTerm || statusFilter !== 'all'
                ? 'No companies match your current search or status filter. Try clearing the filters.'
                : 'Get started by creating your first company profile workspace.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                className={styles.refreshBtn}
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              >
                Clear Filters
              </button>
            ) : (
              <button
                className={styles.addBtn}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add Company Profile</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.companyGrid}>
            {filteredCompanies.map((comp) => {
              const compId = comp.companyId || comp.id;
              const isActiveWorkspace = activeCompany?.companyId === compId || activeCompany?.id === compId;
              const isDefaultCompany = Boolean(comp.isDefault || compId === 'RRS8392014SEC');

              return (
                <div
                  key={compId}
                  className={`${styles.companyCard} ${isActiveWorkspace ? styles.companyCardActive : ''}`}
                >
                  <div className={styles.cardTopHeader}>
                    <div className={styles.companyIdentity}>
                      <div className={styles.logoAvatar}>
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.name} className={styles.logoImg} />
                        ) : (
                          comp.code ? comp.code.substring(0, 3) : (comp.name || 'CO').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className={styles.companyNameBlock}>
                        <div className={styles.companyNameRow}>
                          <h3 className={styles.companyName} title={comp.name}>
                            {comp.name}
                          </h3>
                          {isDefaultCompany && (
                            <span className={styles.masterPill}>Master Entity</span>
                          )}
                        </div>
                        <div className={styles.companyCode}>
                          Code: <strong>{comp.code || 'N/A'}</strong> • {comp.industry || 'Security & Facilities'}
                        </div>
                      </div>
                    </div>

                    {isDefaultCompany ? (
                      <span className={styles.activeWorkspaceBadge}>
                        <ShieldCheck size={13} />
                        Master Entity
                      </span>
                    ) : (
                      <span
                        className={styles.statutoryChip}
                        style={{
                          background: comp.status === 'Inactive' ? '#fee2e2' : '#f0fdf4',
                          color: comp.status === 'Inactive' ? '#b91c1c' : '#15803d',
                          borderColor: comp.status === 'Inactive' ? '#fecaca' : '#bbf7d0',
                          fontWeight: 600
                        }}
                      >
                        {comp.status || 'Active'}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.companyIdRow}>
                      <span className={styles.companyIdLabel}>Company ID</span>
                      <div className={styles.companyIdValueWrap}>
                        <span className={styles.companyIdValue}>{compId}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={(e) => handleCopyId(e, compId)}
                          title="Copy Company ID"
                        >
                          {copiedId === compId ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.contactList}>
                      {(comp.adminEmail || comp.email) && (
                        <div className={styles.contactItem} style={{ color: '#1d4ed8', fontWeight: 600 }} title="Admin Login Email">
                          <ShieldCheck size={14} color="#2563eb" />
                          <span>Admin Login: {comp.adminEmail || comp.email}</span>
                        </div>
                      )}
                      {comp.email && comp.adminEmail && comp.email !== comp.adminEmail && (
                        <div className={styles.contactItem} title="Official Company Email">
                          <Mail size={14} />
                          <span>{comp.email}</span>
                        </div>
                      )}
                      {comp.phone && (
                        <div className={styles.contactItem}>
                          <Phone size={14} />
                          <span>{comp.phone}</span>
                        </div>
                      )}
                      {(comp.city || comp.state) && (
                        <div className={styles.contactItem}>
                          <MapPin size={14} />
                          <span>{[comp.city, comp.state, comp.pinCode].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.statutoryChips}>
                      {comp.gstin && (
                        <span className={styles.statutoryChip} title="GSTIN Number">
                          <span className={styles.statutoryKey}>GST:</span>{comp.gstin}
                        </span>
                      )}
                      {comp.pan && (
                        <span className={styles.statutoryChip} title="PAN Card Number">
                          <span className={styles.statutoryKey}>PAN:</span>{comp.pan}
                        </span>
                      )}
                      {comp.employerPfCode && (
                        <span className={styles.statutoryChip} title="PF Establishment Code">
                          <span className={styles.statutoryKey}>PF:</span>{comp.employerPfCode}
                        </span>
                      )}
                      {comp.employerEsiCode && (
                        <span className={styles.statutoryChip} title="ESI Employer Code">
                          <span className={styles.statutoryKey}>ESI:</span>{comp.employerEsiCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions} style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Manage Company</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>

                    {isDefaultCompany ? (
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.actionIconBtnDisabled}`}
                        title="Primary Master entity cannot be deactivated"
                        disabled
                      >
                        <ShieldCheck size={15} />
                      </button>
                    ) : comp.status === 'Inactive' ? (
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.actionIconBtnActivate}`}
                        onClick={(e) => handleToggleStatusClick(e, comp)}
                        title="Activate Company (Restore login access for admin, employees & clients)"
                      >
                        <Power size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.actionIconBtnDeactivate}`}
                        onClick={(e) => handleToggleStatusClick(e, comp)}
                        title="Deactivate Company (Block login access for admin, employees & clients)"
                      >
                        <PowerOff size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.actionIconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(comp);
                      }}
                      title="Edit Company Profile"
                    >
                      <Edit3 size={15} />
                    </button>

                    {!isDefaultCompany && (
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                        onClick={(e) => handleDeleteClick(e, comp)}
                        title="Delete Company Profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    {/* Three-dot Action Menu (View Details & Credentials) */}
                    <div className={styles.threeDotWrap}>
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.threeDotBtn} ${openDropdownId === `grid-${compId}` ? styles.activeDotBtn : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === `grid-${compId}` ? null : `grid-${compId}`);
                        }}
                        title="More options"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {openDropdownId === `grid-${compId}` && (
                        <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenDropdownId(null);
                              setViewingDetailsCompany(comp);
                            }}
                          >
                            <Eye size={14} className={styles.dropdownIcon} />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenDropdownId(null);
                              setViewingCredentialsCompany(comp);
                            }}
                          >
                            <KeyRound size={14} className={styles.dropdownIcon} />
                            <span>Credentials</span>
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Company Profile</th>
                    <th className={styles.th}>Company ID & Code</th>
                    <th className={styles.th}>Contact Info</th>
                    <th className={styles.th}>Statutory IDs</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((comp) => {
                    const compId = comp.companyId || comp.id;
                    const isActiveWorkspace = activeCompany?.companyId === compId || activeCompany?.id === compId;
                    const isDefaultCompany = Boolean(comp.isDefault || compId === 'RRS8392014SEC');

                    return (
                      <tr
                        key={compId}
                        className={`${styles.tableRow} ${isActiveWorkspace ? styles.tableRowActive : ''}`}
                      >
                        <td className={styles.td}>
                          <div className={styles.companyIdentity}>
                            <div className={styles.logoAvatar} style={{ width: '38px', height: '38px', fontSize: '13px' }}>
                              {comp.logo ? (
                                <img src={comp.logo} alt={comp.name} className={styles.logoImg} />
                              ) : (
                                comp.code ? comp.code.substring(0, 3) : (comp.name || 'CO').substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: '#0f172a' }}>{comp.name}</strong>
                                {isDefaultCompany && (
                                  <span className={styles.masterPill}>Master</span>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {comp.industry || 'Security & Facilities'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px' }}>
                              {compId}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Prefix: <strong>{comp.code}</strong>
                            </span>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Login: {comp.adminEmail || comp.email || '—'}</span>
                            <span style={{ color: '#64748b' }}>{comp.phone || '—'}</span>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {comp.gstin && (
                              <span className={styles.statutoryChip}>GST: {comp.gstin}</span>
                            )}
                            {comp.pan && (
                              <span className={styles.statutoryChip}>PAN: {comp.pan}</span>
                            )}
                            {!comp.gstin && !comp.pan && <span style={{ color: '#94a3b8' }}>—</span>}
                          </div>
                        </td>

                        <td className={styles.td}>
                          {isDefaultCompany ? (
                            <span className={styles.activeWorkspaceBadge}>
                              <ShieldCheck size={13} />
                              Master Entity
                            </span>
                          ) : (
                            <span
                              className={styles.statutoryChip}
                              style={{
                                background: comp.status === 'Inactive' ? '#fee2e2' : '#f0fdf4',
                                color: comp.status === 'Inactive' ? '#b91c1c' : '#15803d',
                                borderColor: comp.status === 'Inactive' ? '#fecaca' : '#bbf7d0',
                                fontWeight: 600
                              }}
                            >
                              {comp.status || 'Active'}
                            </span>
                          )}
                        </td>

                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {isDefaultCompany ? (
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.actionIconBtnDisabled}`}
                                style={{ width: '32px', height: '32px' }}
                                title="Primary Master entity cannot be deactivated"
                                disabled
                              >
                                <ShieldCheck size={14} />
                              </button>
                            ) : comp.status === 'Inactive' ? (
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.actionIconBtnActivate}`}
                                style={{ width: '32px', height: '32px' }}
                                onClick={(e) => handleToggleStatusClick(e, comp)}
                                title="Activate Company (Restore login access for admin, employees & clients)"
                              >
                                <Power size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.actionIconBtnDeactivate}`}
                                style={{ width: '32px', height: '32px' }}
                                onClick={(e) => handleToggleStatusClick(e, comp)}
                                title="Deactivate Company (Block login access for admin, employees & clients)"
                              >
                                <PowerOff size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => setEditingCompany(comp)}
                              title="Edit Profile"
                            >
                              <Edit3 size={14} />
                            </button>
                            {!isDefaultCompany && (
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                                style={{ width: '32px', height: '32px' }}
                                onClick={(e) => handleDeleteClick(e, comp)}
                                title="Delete Company"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {/* Three-dot Action Menu (View Details & Credentials) */}
                            <div className={styles.threeDotWrap}>
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.threeDotBtn} ${openDropdownId === `table-${compId}` ? styles.activeDotBtn : ''}`}
                                style={{ width: '32px', height: '32px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === `table-${compId}` ? null : `table-${compId}`);
                                }}
                                title="More options"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {openDropdownId === `table-${compId}` && (
                                <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setViewingDetailsCompany(comp);
                                    }}
                                  >
                                    <Eye size={14} className={styles.dropdownIcon} />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setViewingCredentialsCompany(comp);
                                    }}
                                  >
                                    <KeyRound size={14} className={styles.dropdownIcon} />
                                    <span>Credentials</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Company Profile Modal */}
        <AddCompanyProfileModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newComp) => {
            showToast(`Company profile "${newComp.name}" created successfully!`, 'success');
          }}
        />

        {/* Edit Company Profile Modal */}
        <EditCompanyModal
          isOpen={Boolean(editingCompany)}
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={(updatedComp) => {
            showToast(`Company profile "${updatedComp?.name || editingCompany?.name}" updated successfully!`, 'success');
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Company Profile?"
          description={`Are you sure you want to delete "${deleteConfirm.company?.name}" (${deleteConfirm.company?.companyId || deleteConfirm.company?.id})? This will permanently remove its isolated workspace settings and configurations.`}
          confirmLabel="Delete Company"
          variant="danger"
          loading={deleteConfirm.loading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, company: null, loading: false })}
        />

        {/* Activate / Deactivate Status Confirmation Modal */}
        <ConfirmModal
          isOpen={statusConfirm.isOpen}
          title={
            statusConfirm.targetStatus === 'Inactive'
              ? `Deactivate ${statusConfirm.company?.name || 'Company'}?`
              : `Activate ${statusConfirm.company?.name || 'Company'}?`
          }
          description={
            statusConfirm.targetStatus === 'Inactive'
              ? `Are you sure you want to deactivate "${statusConfirm.company?.name}"? Its company administrator and all associated employees, clients, and portal users will NOT be able to log in to the system while deactivated.`
              : `Are you sure you want to activate "${statusConfirm.company?.name}"? This will restore platform access and allow the company admin, employees, and clients to log in normally.`
          }
          confirmLabel={statusConfirm.targetStatus === 'Inactive' ? 'Deactivate Company' : 'Activate Company'}
          variant={statusConfirm.targetStatus === 'Inactive' ? 'danger' : 'primary'}
          loading={statusConfirm.loading}
          onConfirm={confirmToggleStatus}
          onCancel={() => setStatusConfirm({ isOpen: false, company: null, targetStatus: 'Inactive', loading: false })}
        />

        {/* View Company Details Modal */}
        <ViewCompanyDetailsModal
          isOpen={Boolean(viewingDetailsCompany)}
          company={viewingDetailsCompany}
          onClose={() => setViewingDetailsCompany(null)}
        />

        {/* Company Admin Credentials & Notification Modal */}
        <CompanyCredentialsModal
          isOpen={Boolean(viewingCredentialsCompany)}
          company={viewingCredentialsCompany}
          onClose={() => setViewingCredentialsCompany(null)}
        />

        {/* Master Brand Logo Customization Modal */}
        <BrandLogoModal
          isOpen={isBrandLogoModalOpen}
          onClose={() => setIsBrandLogoModalOpen(false)}
          onSuccess={() => {
            showToast('Master brand logo updated successfully! Visible to all companies on sidebar header.', 'success');
          }}
        />

        {/* Toast Feedback */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      </div>
    </AdminLayout>
  );
}

export default AllCompanies;
