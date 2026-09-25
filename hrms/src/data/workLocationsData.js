/**
 * Work Locations Data & Constants
 * Dynamic records are now queried directly from the Backend API isolated by companyId.
 */

export const mockWorkLocations = [];

export const LOCATION_TYPES = [
  { value: 'head-office', label: 'Head Office' },
  { value: 'branch', label: 'Branch' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'site', label: 'Site / Field' },
];

export const LOCATION_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
