import authService from './authService';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return `${window.location.origin}/api`;
    }
  }
  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

const getHeaders = (companyId) => {
  const token = authService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`
  };
  if (companyId) {
    headers['x-company-id'] = companyId;
  }
  return headers;
};

export const separationService = {
  /**
   * Get dynamic separation records for active company
   */
  async getSeparations(params = {}, companyId) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.reason && params.reason !== 'All') query.append('reason', params.reason);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/separation${queryString}`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch separation records');
    return data;
  },

  /**
   * Get dynamic separation analytics & exit trends for active company
   */
  async getAnalytics(from, to, companyId) {
    const query = new URLSearchParams();
    if (from) query.append('from', from);
    if (to) query.append('to', to);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/separation/analytics${queryString}`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch separation analytics');
    return data;
  },

  /**
   * Initiate new employee separation
   */
  async createSeparation(separationData, companyId) {
    const res = await fetch(`${API_BASE_URL}/separation`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify(separationData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to initiate separation');
    return data;
  },

  /**
   * Update separation details, checklist, approvals, or settlement
   */
  async updateSeparation(id, updateData, companyId) {
    const res = await fetch(`${API_BASE_URL}/separation/${id}`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update separation');
    return data;
  },

  /**
   * Finalize separation: execute exit, mark disbursed, and update employee status to Inactive/Separated
   */
  async finalizeSeparation(id, finalizeData = {}, companyId) {
    const res = await fetch(`${API_BASE_URL}/separation/${id}/finalize`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify(finalizeData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to finalize separation');
    return data;
  },

  /**
   * Rehire previously separated employee
   */
  async rehireEmployee(id, rehireDate, companyId) {
    const res = await fetch(`${API_BASE_URL}/separation/${id}/rehire`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ rehireDate })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to rehire employee');
    return data;
  },

  /**
   * Cancel separation record
   */
  async cancelSeparation(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/separation/${id}`, {
      method: 'DELETE',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to cancel separation');
    return data;
  }
};

export default separationService;

