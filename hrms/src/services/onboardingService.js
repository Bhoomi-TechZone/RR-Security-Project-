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

export const onboardingService = {
  /**
   * Get all onboarding candidates strictly isolated to active company
   */
  async getOnboardingList(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.stage && params.stage !== 'all') query.append('stage', params.stage);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    const url = `${API_BASE_URL}/onboarding${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch onboarding candidates');
    return data.onboardingList || [];
  },

  /**
   * Get next available sequential onboarding ID (ONB-YYYY-XXX)
   */
  async getNextOnboardingId(companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/next-id`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get next onboarding ID');
    return data.nextId;
  },

  /**
   * Get onboarding record by ID
   */
  async getOnboardingById(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}`, {
      method: 'GET',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch onboarding record');
    return {
      ...(data.onboarding || {}),
      activeDocumentTypes: data.activeDocumentTypes || []
    };
  },

  /**
   * Create or transfer candidate into onboarding
   */
  async createOnboarding(payload, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ ...payload, companyId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create onboarding record');
    const record = data.onboarding || {};
    record._meta = {
      emailSent: data.emailSent,
      emailError: data.emailError,
      message: data.message
    };
    return record;
  },

  /**
   * Update onboarding details (documents, uniform, notes, etc.)
   */
  async updateOnboarding(id, payload, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}`, {
      method: 'PUT',
      headers: getHeaders(companyId),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update onboarding record');
    return {
      ...(data.onboarding || {}),
      activeDocumentTypes: data.activeDocumentTypes || []
    };
  },

  /**
   * Update onboarding stage
   */
  async updateStage(id, stage, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}/stage`, {
      method: 'PATCH',
      headers: getHeaders(companyId),
      body: JSON.stringify({ stage })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update stage');
    return {
      ...(data.onboarding || {}),
      activeDocumentTypes: data.activeDocumentTypes || []
    };
  },

  /**
   * Convert onboarding candidate to permanent employee in MongoDB
   */
  async convertToEmployee(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}/convert`, {
      method: 'POST',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to convert to employee');
    return data;
  },

  /**
   * Delete onboarding record
   */
  async deleteOnboarding(id, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}`, {
      method: 'DELETE',
      headers: getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete onboarding candidate');
    return data;
  },

  /**
   * Public: Get candidate onboarding details for self-onboarding portal
   */
  async getPublicOnboardingById(id) {
    const res = await fetch(`${API_BASE_URL}/onboarding/public/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to fetch public onboarding dossier');
      err.status = res.status;
      err.expired = Boolean(data.expired || res.status === 410);
      err.candidateName = data.candidateName;
      err.id = data.id;
      throw err;
    }
    return {
      ...(data.onboarding || {}),
      activeDocumentTypes: data.activeDocumentTypes || []
    };
  },

  /**
   * Public: Submit candidate self-onboarding documents and details
   */
  async submitPublicOnboarding(id, payload) {
    const res = await fetch(`${API_BASE_URL}/onboarding/public/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to submit onboarding dossier');
      err.status = res.status;
      err.expired = Boolean(data.expired || res.status === 410);
      throw err;
    }
    return data;
  },

  /**
   * Send or resend official onboarding invitation email with document verification link
   */
  async sendOnboardingInvite(id, email, companyId) {
    const res = await fetch(`${API_BASE_URL}/onboarding/${id}/send-invite`, {
      method: 'POST',
      headers: getHeaders(companyId),
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send onboarding invitation email');
    return data;
  }
};

export default onboardingService;

