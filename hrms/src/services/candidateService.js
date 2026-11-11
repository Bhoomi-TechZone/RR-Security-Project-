import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

export const candidateService = {
  /**
   * Get all candidates strictly isolated to active company
   */
  async getCandidates(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    const url = `${API_BASE_URL}/candidates${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch candidates');
    return data.candidates || [];
  },

  /**
   * Get next available sequential candidate ID for company
   */
  async getNextCandidateId(companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates/next-id`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get next candidate ID');
    return data.nextId;
  },

  /**
   * Get candidate details by ID isolated to company
   */
  async getCandidateById(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch candidate');
    return data.candidate;
  },

  /**
   * Register a new candidate for the active company
   */
  async createCandidate(candidateData, companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...candidateData, companyId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to register candidate');
    return data.candidate;
  },

  /**
   * Update candidate details
   */
  async updateCandidate(id, updateData, companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify(updateData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update candidate');
    return data.candidate;
  },

  /**
   * Update candidate status (applied -> selected -> moved_to_onboarding, etc.)
   */
  async updateCandidateStatus(id, status, companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(companyId),
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update candidate status');
    return data.candidate;
  },

  /**
   * Delete candidate
   */
  async deleteCandidate(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete candidate');
    return true;
  }
};

export default candidateService;

