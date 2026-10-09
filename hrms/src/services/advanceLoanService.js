import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class AdvanceLoanService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || ''
    };
  }

  /**
   * Get all advance & loan requests from MongoDB
   */
  async getRequests(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.client && params.client !== 'All Clients') query.append('client', params.client);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/advances-loans?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch advance & loan requests');
    }
    return data.data || [];
  }

  /**
   * Get single request details
   */
  async getRequestById(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/${id}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch request details');
    }
    return data.data;
  }

  /**
   * Create new advance or loan request in MongoDB
   */
  async createRequest(companyId, requestData) {
    const res = await fetch(`${API_BASE_URL}/advances-loans`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...requestData
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create request');
    }
    return data.data;
  }

  /**
   * Update advance or loan request
   */
  async updateRequest(companyId, id, updateData) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(updateData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update request');
    }
    return data.data;
  }

  /**
   * Delete advance/loan request
   */
  async deleteRequest(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete request');
    }
    return data;
  }

  /**
   * Approve request
   */
  async approveRequest(companyId, id, payload = {}) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to approve request');
    }
    return data.data;
  }

  /**
   * Reject request
   */
  async rejectRequest(companyId, id, reason) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to reject request');
    }
    return data.data;
  }

  /**
   * Get deduction schedules
   */
  async getSchedules(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.client && params.client !== 'All Clients') query.append('client', params.client);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/advances-loans/schedules?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch deduction schedules');
    }
    return data.data || [];
  }

  /**
   * Get deduction history
   */
  async getHistory(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.client && params.client !== 'All Clients') query.append('client', params.client);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/advances-loans/history?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch deduction history');
    }
    return data.data || [];
  }

  /**
   * Get dynamic stats
   */
  async getStats(companyId) {
    const res = await fetch(`${API_BASE_URL}/advances-loans/stats`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch advance and loan statistics');
    }
    return data.data;
  }
}

export const advanceLoanService = new AdvanceLoanService();
export default advanceLoanService;
