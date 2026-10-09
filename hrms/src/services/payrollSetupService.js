import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class PayrollSetupService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || ''
    };
  }

  /**
   * Fetch all payroll setup configurations from MongoDB
   */
  async getPayrollSetup(companyId) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch payroll setup configuration');
    }
    return data.data;
  }

  // =================== PAY GROUPS ===================
  async createPayGroup(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/pay-groups`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ companyId, ...payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create pay group');
    return data.data;
  }

  async updatePayGroup(companyId, id, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/pay-groups/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update pay group');
    return data.data;
  }

  async deletePayGroup(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/pay-groups/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete pay group');
    return data;
  }

  // =================== PAY SCHEDULES ===================
  async createPaySchedule(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/schedules`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ companyId, ...payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create pay schedule');
    return data.data;
  }

  async updatePaySchedule(companyId, id, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/schedules/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update pay schedule');
    return data.data;
  }

  // =================== PAY CYCLES ===================
  async createPayCycle(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/cycles`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ companyId, ...payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create pay cycle');
    return data.data;
  }

  async updatePayCycle(companyId, id, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/cycles/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update pay cycle');
    return data.data;
  }

  // =================== PAY DAYS ===================
  async createPayDay(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/pay-days`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ companyId, ...payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create pay day rule');
    return data.data;
  }

  async updatePayDay(companyId, id, payload) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/pay-days/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update pay day rule');
    return data.data;
  }

  // =================== CALCULATION METHODS ===================
  async setDefaultCalculationMethod(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/payroll-setup/calculation-methods/${id}/default`, {
      method: 'PUT',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to set default calculation method');
    return data.data;
  }
}

export const payrollSetupService = new PayrollSetupService();
export default payrollSetupService;
