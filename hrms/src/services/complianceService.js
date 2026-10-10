import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ComplianceService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Get full compliance configuration from MongoDB
   */
  async getComplianceConfig(companyId) {
    const res = await fetch(`${API_BASE_URL}/compliance/config?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch compliance configuration');
    }
    return data.config;
  }

  /**
   * Save Global Expiry Alert settings to MongoDB
   */
  async updateExpiryConfig(companyId, expiryConfig) {
    const res = await fetch(`${API_BASE_URL}/compliance/expiry-config`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        expiryConfig,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save expiry alert settings');
    }
    return data;
  }

  /**
   * Add or update custom document-specific expiry rule in MongoDB
   */
  async saveExpiryRule(companyId, rule) {
    const res = await fetch(`${API_BASE_URL}/compliance/expiry-rules`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...rule,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save expiry rule');
    }
    return data;
  }

  /**
   * Delete custom expiry rule from MongoDB
   */
  async deleteExpiryRule(companyId, ruleId) {
    const res = await fetch(`${API_BASE_URL}/compliance/expiry-rules/${ruleId}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete expiry rule');
    }
    return data;
  }

  /**
   * Add or update verification rule in MongoDB
   */
  async saveVerificationRule(companyId, rule) {
    const res = await fetch(`${API_BASE_URL}/compliance/verification-rules`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...rule,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save verification rule');
    }
    return data;
  }

  /**
   * Delete verification rule from MongoDB
   */
  async deleteVerificationRule(companyId, ruleId) {
    const res = await fetch(`${API_BASE_URL}/compliance/verification-rules/${ruleId}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete verification rule');
    }
    return data;
  }

  /**
   * Save Police Verification PSARA compliance settings to MongoDB
   */
  async updatePoliceConfig(companyId, policeConfig) {
    const res = await fetch(`${API_BASE_URL}/compliance/police-config`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        policeConfig,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save police verification settings');
    }
    return data;
  }

  /**
   * Get Live Dynamic Workforce License & Credential Expiry Tracker from MongoDB
   */
  async getExpiryTracker(companyId) {
    const res = await fetch(`${API_BASE_URL}/compliance/expiry-tracker?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch license expiry tracker data');
    }
    return data;
  }

  /**
   * Dispatch instant compliance alert notification
   */
  async sendExpiryAlert(companyId, alertData) {
    const res = await fetch(`${API_BASE_URL}/compliance/send-alert`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...alertData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to dispatch alert notification');
    }
    return data;
  }
}

export default new ComplianceService();
