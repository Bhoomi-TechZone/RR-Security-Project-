import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

const getHeaders = (companyId) => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
    'x-company-id': companyId || ''
  };
};

export const shiftService = {
  // Get all configured shifts
  async getShifts(companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts`, {
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shifts');
    return data.shifts || [];
  },

  // Create new shift
  async createShift(shiftData, companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...shiftData, companyId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create shift');
    return data.shift;
  },

  // Update shift
  async updateShift(id, shiftData, companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...shiftData, companyId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update shift');
    return data.shift;
  },

  // Delete shift
  async deleteShift(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete shift');
    return data;
  },

  // Get roster with filters
  async getShiftRoster(params = {}, companyId) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val && val !== 'all') query.append(key, val);
    });

    const res = await fetch(`${API_BASE_URL}/shifts/roster?${query.toString()}`, {
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shift roster');
    return data;
  },

  // Assign employee to shift
  async assignShift(assignData, companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts/roster/assign`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...assignData, companyId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to assign shift');
    return data;
  },

  // Change shift
  async changeShift(id, changeData, companyId) {
    const res = await fetch(`${API_BASE_URL}/shifts/roster/${id}/change`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...changeData, companyId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to change shift');
    return data.roster;
  },

  // Unassign employee
  async unassignEmployee(id, date, companyId) {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE_URL}/shifts/roster/${id}${q}`, {
      method: 'DELETE',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to unassign employee');
    return data;
  },

  // Get dynamic shift stats
  async getShiftStats(date, companyId) {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE_URL}/shifts/stats${q}`, {
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shift stats');
    return data.stats;
  }
};
