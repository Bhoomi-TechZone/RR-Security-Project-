import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class LeaveService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    };
  }

  /**
   * Get Leave Requests from MongoDB Atlas database
   */
  async getLeaveRequests(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.clientName) query.append('clientName', params.clientName);
    if (params.leaveType) query.append('leaveType', params.leaveType);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.employeeId) query.append('employeeId', params.employeeId);

    const res = await fetch(`${API_BASE_URL}/leaves?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch leave requests');
    }
    return data.leaves || [];
  }

  /**
   * Create a new Leave Request in MongoDB Atlas
   * When applied by Admin: status is directly Approved and synced to Attendance
   * When applied by Employee: status is Pending supervisor approval
   */
  async createLeaveRequest(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/leaves`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...payload,
        companyId: companyId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create leave request');
    }
    return data;
  }

  /**
   * Review Leave Request (Approve / Reject / Send Back)
   */
  async reviewLeaveRequest(companyId, leaveId, action, reason = '') {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/review`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ action, reason }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to review leave request');
    }
    return data;
  }

  /**
   * Cancel Leave Request
   */
  async cancelLeaveRequest(companyId, leaveId) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/cancel`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to cancel leave request');
    }
    return data;
  }

  /**
   * Update / Edit Leave Request in MongoDB Atlas
   */
  async updateLeaveRequest(companyId, leaveId, payload) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...payload,
        companyId: companyId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update leave request');
    }
    return data;
  }

  /**
   * Delete Leave Request permanently from MongoDB Atlas
   */
  async deleteLeaveRequest(companyId, leaveId) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete leave request');
    }
    return data;
  }


  /**
   * Get configured leave types from MongoDB Atlas
   */
  async getLeaveTypes(companyId) {
    const res = await fetch(`${API_BASE_URL}/leaves/types`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch leave types');
    }
    return data.types || [];
  }

  /**
   * Save / Update leave type in MongoDB Atlas
   */
  async saveLeaveType(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/leaves/types`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...payload,
        companyId: companyId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save leave type');
    }
    return data.type;
  }

  /**
   * Delete leave type from MongoDB Atlas
   */
  async deleteLeaveType(companyId, idOrCode) {
    const res = await fetch(`${API_BASE_URL}/leaves/types/${idOrCode}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete leave type');
    }
    return data;
  }

  /**
   * Get employee leave balances from MongoDB Atlas
   */
  async getEmployeeBalances(companyId) {
    const res = await fetch(`${API_BASE_URL}/leaves/balances`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch employee balances');
    }
    return data.balances || [];
  }

  /**
   * Assign leave policy and opening balances
   */
  async assignPolicy(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/leaves/balances/assign`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...payload,
        companyId: companyId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to assign policy');
    }
    return data.balance;
  }
}

export default new LeaveService();
