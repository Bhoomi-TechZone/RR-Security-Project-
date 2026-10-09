import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class StatutoryService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Get statutory configuration directly from MongoDB
   */
  async getStatutoryConfig(companyId) {
    const res = await fetch(`${API_BASE_URL}/statutory?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch statutory configuration');
    }
    return data.config;
  }

  /**
   * Update a specific module (pf, esi, pt, tds, bonus, gratuity, lwf) in MongoDB
   */
  async updateModule(companyId, moduleKey, moduleData) {
    const res = await fetch(`${API_BASE_URL}/statutory/${moduleKey}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...moduleData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to update ${moduleKey.toUpperCase()} settings`);
    }
    return data;
  }

  /**
   * Toggle a module's enabled status in MongoDB
   */
  async toggleModule(companyId, moduleKey, enabled) {
    const res = await fetch(`${API_BASE_URL}/statutory/toggle/${moduleKey}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        enabled,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to toggle ${moduleKey.toUpperCase()} status`);
    }
    return data;
  }

  /**
   * Save PT Slab in MongoDB
   */
  async savePTSlab(companyId, slabData) {
    const res = await fetch(`${API_BASE_URL}/statutory/pt-slabs`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...slabData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save PT Slab');
    }
    return data;
  }

  /**
   * Delete PT Slab from MongoDB
   */
  async deletePTSlab(companyId, slabId) {
    const res = await fetch(`${API_BASE_URL}/statutory/pt-slabs/${slabId}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete PT Slab');
    }
    return data;
  }

  /**
   * Save LWF Rule in MongoDB
   */
  async saveLWFRule(companyId, ruleData) {
    const res = await fetch(`${API_BASE_URL}/statutory/lwf-rules`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...ruleData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save LWF Rule');
    }
    return data;
  }

  /**
   * Delete LWF Rule from MongoDB
   */
  async deleteLWFRule(companyId, ruleId) {
    const res = await fetch(`${API_BASE_URL}/statutory/lwf-rules/${ruleId}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete LWF Rule');
    }
    return data;
  }
}

export const statutoryService = new StatutoryService();
export default statutoryService;
