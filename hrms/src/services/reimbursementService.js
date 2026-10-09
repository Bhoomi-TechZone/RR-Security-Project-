import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ReimbursementService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Get all claims from MongoDB
   */
  async getClaims(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params.department) query.append('department', params.department);
    if (params.site) query.append('site', params.site);
    if (params.expenseType) query.append('expenseType', params.expenseType);
    if (params.month) query.append('month', params.month);
    if (params.search) query.append('search', params.search);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reimbursements?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch reimbursement claims');
    }
    return data.claims || [];
  }

  /**
   * Create new claim in MongoDB
   */
  async createClaim(companyId, claimData) {
    const res = await fetch(`${API_BASE_URL}/reimbursements`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...claimData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create reimbursement claim');
    }
    return data.claim;
  }

  /**
   * Update claim in MongoDB
   */
  async updateClaim(companyId, id, claimData) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...claimData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update reimbursement claim');
    }
    return data.claim;
  }

  /**
   * Delete claim from MongoDB
   */
  async deleteClaim(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete reimbursement claim');
    }
    return data;
  }

  /**
   * Review claim (Approve / Reject / Send Back) in MongoDB
   */
  async reviewClaim(companyId, id, reviewData) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/${id}/review`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...reviewData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to review reimbursement claim');
    }
    return data.claim;
  }

  /**
   * Process payment in MongoDB
   */
  async processPayment(companyId, id, paymentData) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/${id}/pay`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...paymentData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to process payment');
    }
    return data.claim;
  }

  /**
   * Get expense types from MongoDB
   */
  async getExpenseTypes(companyId) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/expense-types?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch expense types');
    }
    return data.expenseTypes || [];
  }

  /**
   * Save expense type in MongoDB
   */
  async saveExpenseType(companyId, typeData) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/expense-types`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...typeData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save expense type');
    }
    return data.expenseType;
  }

  /**
   * Delete expense type in MongoDB
   */
  async deleteExpenseType(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/reimbursements/expense-types/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete expense type');
    }
    return data;
  }
}

export const reimbursementService = new ReimbursementService();
export default reimbursementService;
