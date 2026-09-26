import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './WorkLocations.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import LocationSummaryCards from '../../components/workLocations/LocationSummaryCards';
import LocationToolbar from '../../components/workLocations/LocationToolbar';
import LocationFilters from '../../components/workLocations/LocationFilters';
import LocationTable from '../../components/workLocations/LocationTable';
import LocationFormModal from '../../components/workLocations/LocationFormModal';
import LocationDetailsModal from '../../components/workLocations/LocationDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import workLocationService from '../../services/workLocationService';

const ITEMS_PER_PAGE = 8;

function WorkLocations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || 'comp_rr_security';

  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(() => {
    return Boolean(searchParams.get('type') || searchParams.get('status'));
  });
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    locationType: searchParams.get('type') || 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sync filters with URL query parameters
  useEffect(() => {
    const nextType = searchParams.get('type') || 'all';
    const nextStatus = searchParams.get('status') || 'all';
    setFilters({
      status: nextStatus,
      locationType: nextType,
    });
    if (nextType !== 'all' || nextStatus !== 'all') {
      setShowFilters(true);
    }
  }, [searchParams]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    location: null,
    actionType: null,
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch Work Locations from Backend API isolated by companyId
  const fetchLocations = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await workLocationService.getWorkLocations(companyId);
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load work locations from backend:', err);
      showToast('Could not load work locations. Check your connection or login session.', 'danger');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Reset pagination when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Filter locations
  const getFilteredLocations = () => {
    let filtered = locations;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (loc) =>
          loc.locationName?.toLowerCase().includes(term) ||
          loc.city?.toLowerCase().includes(term) ||
          loc.state?.toLowerCase().includes(term) ||
          loc.pinCode?.includes(term)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((loc) => loc.status === filters.status);
    }

    // Location type filter
    if (filters.locationType !== 'all') {
      filtered = filtered.filter((loc) => loc.locationType === filters.locationType);
    }

    return filtered;
  };

  const filteredLocations = getFilteredLocations();
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle Form Submit (Add / Edit)
  const handleFormSubmit = async (formData) => {
    try {
      if (editingLocation) {
        // Edit mode
        const updated = await workLocationService.updateWorkLocation(
          companyId,
          editingLocation.id || editingLocation.locationId,
          formData
        );
        setLocations((prev) =>
          prev.map((loc) => (loc.id === updated.id || loc.locationId === updated.id ? updated : loc))
        );
        showToast(`✓ Work location "${updated.locationName}" updated successfully.`, 'success');
      } else {
        // Add mode
        const created = await workLocationService.createWorkLocation(companyId, formData);
        setLocations((prev) => [created, ...prev]);
        showToast(`✓ Work location "${created.locationName}" created successfully.`, 'success');
      }

      setIsFormOpen(false);
      setEditingLocation(null);
    } catch (err) {
      console.error('Error submitting work location:', err);
      showToast(err.message || 'Failed to save work location.', 'danger');
    }
  };

  // Handle Actions (View / Edit / Deactivate / Activate)
  const handleAction = (actionType, location) => {
    if (actionType === 'view') {
      setSelectedLocation(location);
      setIsDetailsOpen(true);
    } else if (actionType === 'edit') {
      setEditingLocation(location);
      setIsFormOpen(true);
    } else if (actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        title: `Deactivate ${location.locationName}?`,
        description: 'Are you sure you want to deactivate this work location? It will be marked as inactive.',
        confirmLabel: 'Deactivate',
        variant: 'danger',
        location,
        actionType: 'deactivate',
      });
    } else if (actionType === 'activate') {
      setConfirmModal({
        isOpen: true,
        title: `Activate ${location.locationName}?`,
        description: 'Are you sure you want to activate this work location? It will be restored to active status.',
        confirmLabel: 'Activate',
        variant: 'primary',
        location,
        actionType: 'activate',
      });
    }
  };

  // Handle Confirm Action (Toggle Status)
  const handleConfirmAction = async () => {
    const { location, actionType } = confirmModal;
    if (!location) return;

    const newStatus = actionType === 'deactivate' ? 'inactive' : 'active';
    const locId = location.id || location.locationId;

    try {
      const updated = await workLocationService.toggleWorkLocationStatus(companyId, locId, newStatus);
      setLocations((prev) =>
        prev.map((loc) => (loc.id === updated.id || loc.locationId === updated.id ? updated : loc))
      );
      showToast(
        `✓ Location "${location.locationName}" ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully.`,
        'success'
      );
    } catch (err) {
      console.error('Error toggling location status:', err);
      showToast(err.message || `Failed to ${actionType} location.`, 'danger');
    } finally {
      setConfirmModal({
        isOpen: false,
        title: '',
        description: '',
        confirmLabel: '',
        variant: 'danger',
        location: null,
        actionType: null,
      });
    }
  };

  const handleFilterChange = (filterName, value) => {
    const nextFilters = { ...filters, [filterName]: value };
    setFilters(nextFilters);
    const params = {};
    if (nextFilters.locationType !== 'all') params.type = nextFilters.locationType;
    if (nextFilters.status !== 'all') params.status = nextFilters.status;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ status: 'all', locationType: 'all' });
    setSearchParams({});
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}

        {/* Form Modal */}
        <LocationFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLocation(null);
          }}
          onSubmit={handleFormSubmit}
          editingLocation={editingLocation}
        />

        {/* Details Modal */}
        <LocationDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedLocation(null);
          }}
          location={selectedLocation}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span 
            className={styles.crumbLink} 
            onClick={() => navigate('/admin/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span 
            className={styles.crumbLink} 
            onClick={handleResetFilters}
            style={{ 
              cursor: (filters.status !== 'all' || filters.locationType !== 'all') ? 'pointer' : 'default',
              color: (filters.status !== 'all' || filters.locationType !== 'all') ? 'var(--primary, #2563eb)' : 'inherit',
              fontWeight: (filters.status !== 'all' || filters.locationType !== 'all') ? 500 : 600
            }}
          >
            Work Locations
          </span>
          {(filters.locationType !== 'all' || filters.status !== 'all') && (
            <>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive} style={{ fontWeight: 600 }}>
                {filters.locationType === 'head-office' && 'Head Office'}
                {filters.locationType === 'branch' && 'Branches'}
                {filters.locationType === 'office' && 'Offices'}
                {filters.status === 'active' && 'Active Locations'}
                {filters.status === 'inactive' && 'Inactive Locations'}
              </span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Work Locations</h1>
            <p className={styles.description}>
              Manage offices, branches and work locations used across the HRMS for{' '}
              <strong>{activeCompany?.name || 'RR Security'}</strong>.
            </p>
          </div>
        </header>

        {/* Summary Cards */}
        <LocationSummaryCards locations={locations} />

        {/* Toolbar */}
        <LocationToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddNew={() => {
            setEditingLocation(null);
            setIsFormOpen(true);
          }}
          onFilterToggle={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
        />

        {/* Filters */}
        {showFilters && (
          <LocationFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Table */}
        <LocationTable
          locations={paginatedLocations}
          loading={loading}
          onAction={handleAction}
          onResetSearch={handleResetFilters}
        />

        {/* Pagination */}
        {!loading && filteredLocations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLocations.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="locations"
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default WorkLocations;
