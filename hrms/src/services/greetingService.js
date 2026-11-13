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

export const greetingService = {
  /**
   * Get dynamic greetings configuration and upcoming celebrations for active company
   */
  async getGreetings(companyId) {
    const res = await fetch(`${API_BASE_URL}/greetings`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch greetings configuration');
    return data;
  },

  /**
   * Save isolated greetings configuration for active company
   */
  async saveGreetings(config, companyId) {
    const res = await fetch(`${API_BASE_URL}/greetings`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save greetings configuration');
    return data;
  },

  /**
   * Trigger immediate dispatch check for today's celebrations
   */
  async triggerDispatch(force = false, companyId) {
    const res = await fetch(`${API_BASE_URL}/greetings/dispatch`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ force })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to trigger greetings dispatch');
    return data;
  }
};

export default greetingService;

