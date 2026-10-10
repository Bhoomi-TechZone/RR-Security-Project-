import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

class ReportService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || '',
    };
  }

  /**
   * Get Reports Overview Statistics & Category Counts
   */
  async getOverview(companyId) {
    const res = await fetch(`${API_BASE_URL}/reports/overview?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch report overview');
    }
    return data;
  }

  /**
   * Get Filter Options (Companies, Departments, Designations, Employees)
   */
  async getFilterOptions(companyId) {
    const res = await fetch(`${API_BASE_URL}/reports/filter-options?companyId=${companyId || ''}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch filter options');
    }
    return data;
  }

  /**
   * Get Dynamic Payroll / Wage & Salary Register Report
   */
  async getPayrollReport(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.company && params.company !== 'All Companies') query.append('company', params.company);
    if (params.department && params.department !== 'All Departments') query.append('department', params.department);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reports/payroll?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch payroll wage register report');
    }
    return data;
  }

  /**
   * Get Dynamic Attendance Report
   */
  async getAttendanceReport(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.company && params.company !== 'All Companies') query.append('company', params.company);
    if (params.department && params.department !== 'All Departments') query.append('department', params.department);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reports/attendance?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch attendance report');
    }
    return data;
  }

  /**
   * Get Dynamic Company Billing Report
   */
  async getBillingReport(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.company && params.company !== 'All Companies') query.append('company', params.company);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reports/billing?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch billing report');
    }
    return data;
  }

  /**
   * Get Dynamic Employee Master Report
   */
  async getEmployeeMasterReport(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.company && params.company !== 'All Companies') query.append('company', params.company);
    if (params.department && params.department !== 'All Departments') query.append('department', params.department);
    if (params.employee && params.employee !== 'All Employees') query.append('employee', params.employee);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reports/employee-master?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch employee master report');
    }
    return data;
  }

  /**
   * Get Dynamic Inventory & Asset Report
   */
  async getInventoryReport(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All Categories') query.append('category', params.category);
    if (params.itemType && params.itemType !== 'All Types') query.append('itemType', params.itemType);
    if (params.status && params.status !== 'All Statuses') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/reports/inventory?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch inventory report');
    }
    return data;
  }
}

export const reportService = new ReportService();
export default reportService;
