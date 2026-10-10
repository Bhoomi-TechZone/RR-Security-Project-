import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

class OvertimeService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Fetch Overtime Records with query params (date, search, client, site, department, status, month)
   */
  async getOvertimeRecords(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.month) query.append('month', params.month);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.client && params.client !== 'All Clients') query.append('client', params.client);
    if (params.site && params.site !== 'All Sites') query.append('site', params.site);
    if (params.department && params.department !== 'All Departments') query.append('department', params.department);
    if (params.status && params.status !== 'All Status' && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/overtime?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch overtime records');
    }
    return data;
  }

  /**
   * Create a new Overtime Record in MongoDB
   */
  async createOvertime(companyId, overtimeData) {
    const res = await fetch(`${API_BASE_URL}/overtime`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ ...overtimeData, companyId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create overtime record');
    }
    return data;
  }

  /**
   * Update Overtime Status (Approve / Reject)
   */
  async updateOvertimeStatus(companyId, id, statusData) {
    const res = await fetch(`${API_BASE_URL}/overtime/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(statusData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update overtime status');
    }
    return data;
  }

  /**
   * Delete Overtime Record
   */
  async deleteOvertime(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/overtime/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete overtime record');
    }
    return data;
  }

  /**
   * Get Overtime Analytics (Client & Department Breakdowns)
   */
  async getOvertimeAnalytics(companyId) {
    const res = await fetch(`${API_BASE_URL}/overtime/analytics?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch overtime analytics');
    }
    return data;
  }
}

export default new OvertimeService();
