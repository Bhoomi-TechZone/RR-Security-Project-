import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class PayrollService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Get dynamic payroll records from MongoDB for a given month
   */
  async getPayrollRecords(companyId, month) {
    const res = await fetch(`${API_BASE_URL}/payroll?month=${month}&companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch payroll records');
    }
    return data;
  }

  /**
   * Run / calculate and persist payroll in MongoDB
   */
  async runPayroll(companyId, month, records = []) {
    const res = await fetch(`${API_BASE_URL}/payroll/run`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        month,
        records,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to run payroll calculation');
    }
    return data;
  }

  /**
   * Approve payroll run in MongoDB
   */
  async approvePayroll(companyId, month, action = 'approve', remarks = '') {
    const res = await fetch(`${API_BASE_URL}/payroll/approve`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        month,
        action,
        remarks,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to approve payroll');
    }
    return data;
  }

  /**
   * Generate Salary Slips in MongoDB
   */
  async generateSalarySlips(companyId, month) {
    const res = await fetch(`${API_BASE_URL}/payroll/generate-slips`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        month,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to generate salary slips');
    }
    return data;
  }

  /**
   * Get Salary Slips from MongoDB
   */
  async getSalarySlips(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/payroll/salary-slips?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch salary slips');
    }
    return data.slips || [];
  }

  /**
   * Get Rate Revisions from MongoDB
   */
  async getRateRevisions(companyId) {
    const res = await fetch(`${API_BASE_URL}/payroll/rate-revisions?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch rate revisions');
    }
    return data.revisions || [];
  }

  /**
   * Save / Create Rate Revision in MongoDB
   */
  async saveRateRevision(companyId, revisionData) {
    const res = await fetch(`${API_BASE_URL}/payroll/rate-revisions`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...revisionData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save rate revision');
    }
    return data;
  }

  /**
   * Delete Rate Revision from MongoDB
   */
  async deleteRateRevision(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/payroll/rate-revisions/${id}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete rate revision');
    }
    return data;
  }

  /**
   * Get Arrears from MongoDB
   */
  async getArrears(companyId) {
    const res = await fetch(`${API_BASE_URL}/payroll/arrears?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch arrears');
    }
    return data.arrears || [];
  }

  /**
   * Save Arrear Record in MongoDB
   */
  async saveArrear(companyId, arrearData) {
    const res = await fetch(`${API_BASE_URL}/payroll/arrears`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...arrearData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save arrear record');
    }
    return data;
  }

  /**
   * Delete Arrear from MongoDB
   */
  async deleteArrear(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/payroll/arrears/${id}?companyId=${companyId || ''}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete arrear record');
    }
    return data;
  }
}

export const payrollService = new PayrollService();
export default payrollService;
