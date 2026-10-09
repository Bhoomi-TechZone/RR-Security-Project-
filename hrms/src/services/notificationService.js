import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class NotificationService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-company-id': companyId || ''
    };
  }

  /**
   * Get all notifications with filters
   */
  async getNotifications(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (companyId) query.append('companyId', companyId);

    const res = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }
    return data;
  }

  /**
   * Get real-time unread notification count
   */
  async getUnreadCount(companyId, employeeId) {
    try {
      const query = new URLSearchParams();
      if (companyId) query.append('companyId', companyId);
      if (employeeId) query.append('employeeId', employeeId);
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count?${query.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(companyId)
      });
      const data = await res.json();
      if (!res.ok) return 0;
      return data.unreadCount || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark notification as read');
    return data.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(companyId) {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark all notifications as read');
    return data;
  }

  /**
   * Update action status (approved / rejected)
   */
  async updateAction(companyId, id, actionStatus) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/action`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({ actionStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update notification action');
    return data.data;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete notification');
    return data;
  }

  /**
   * Clear read notifications
   */
  async clearReadNotifications(companyId) {
    const res = await fetch(`${API_BASE_URL}/notifications/clear-read`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to clear read notifications');
    return data;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
