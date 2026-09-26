import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AttendanceService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId || 'RRS8392014SEC',
    };
  }

  /**
   * Get attendance records from MongoDB
   */
  async getAttendanceRecords(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.month) query.append('month', params.month);
    if (params.clientName) query.append('clientName', params.clientName);
    if (params.site) query.append('site', params.site);
    if (params.department) query.append('department', params.department);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/attendance?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch attendance records');
    }
    return data.records || [];
  }

  /**
   * Bulk import attendance records into MongoDB
   */
  async bulkImportAttendance(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/attendance/bulk-import`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        records: payload.records,
        defaultDate: payload.date || payload.defaultDate,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to import attendance records');
    }
    return data;
  }

  /**
   * Save / update single attendance record
   */
  async saveAttendanceRecord(companyId, recordData) {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...recordData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save attendance record');
    }
    return data.record;
  }

  /**
   * Get correction requests
   */
  async getCorrectionRequests(companyId) {
    const res = await fetch(`${API_BASE_URL}/attendance/corrections`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch correction requests');
    }
    return data.corrections || [];
  }

  /**
   * Submit correction request
   */
  async submitCorrectionRequest(companyId, correctionData) {
    const res = await fetch(`${API_BASE_URL}/attendance/corrections`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId,
        ...correctionData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit correction request');
    }
    return data.correction;
  }

  /**
   * Review (approve / reject) correction request
   */
  async reviewCorrectionRequest(companyId, correctionId, action, rejectReason = '') {
    const res = await fetch(`${API_BASE_URL}/attendance/corrections/${correctionId}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        action,
        rejectReason,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to review correction request');
    }
    return data;
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
