import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const employeeService = {
  /**
   * Fetch all employees for the active company profile
   */
  async getEmployees(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employees');
      }

      return Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('employeeService.getEmployees error:', error);
      return [];
    }
  },

  /**
   * Fetch single employee details by ID
   */
  async getEmployeeById(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employee details');
      }

      return data.employee || data;
    } catch (error) {
      console.error('employeeService.getEmployeeById error:', error);
      throw error;
    }
  },

  /**
   * Dispatch employee portal welcome email with login credentials
   */
  async sendCredentialsEmail(companyId, id, payload = {}) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/employees/${id}/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch credentials email');
      }

      return data;
    } catch (error) {
      console.error('employeeService.sendCredentialsEmail error:', error);
      throw error;
    }
  }
};

export default employeeService;
