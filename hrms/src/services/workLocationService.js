import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// High-speed work location cache and in-flight request deduplicator
const locationsCache = new Map();
const inFlightRequests = new Map();

export const workLocationService = {
  clearCache(companyId) {
    if (companyId) {
      locationsCache.delete(companyId);
    } else {
      locationsCache.clear();
    }
  },

  /**
   * Fetch all work locations for the active company profile (with caching and deduplication)
   */
  async getWorkLocations(companyId, forceRefresh = false) {
    if (!companyId) return [];

    // Return cached list instantly if available
    if (!forceRefresh && locationsCache.has(companyId)) {
      return locationsCache.get(companyId);
    }

    // Reuse in-flight promise if an identical request is already active
    if (inFlightRequests.has(companyId)) {
      return inFlightRequests.get(companyId);
    }

    const fetchPromise = (async () => {
      try {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/work-locations?companyId=${companyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch work locations');
        }

        const locations = data.locations || [];
        locationsCache.set(companyId, locations);
        return locations;
      } catch (error) {
        console.error('workLocationService.getWorkLocations error:', error);
        throw error;
      } finally {
        inFlightRequests.delete(companyId);
      }
    })();

    inFlightRequests.set(companyId, fetchPromise);
    return fetchPromise;
  },

  /**
   * Create a new work location associated with companyId
   */
  async createWorkLocation(companyId, locationData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...locationData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create work location');
      }

      workLocationService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('locations-updated'));

      return data.location;
    } catch (error) {
      console.error('workLocationService.createWorkLocation error:', error);
      throw error;
    }
  },

  /**
   * Update an existing work location
   */
  async updateWorkLocation(companyId, id, locationData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...locationData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update work location');
      }

      workLocationService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('locations-updated'));

      return data.location;
    } catch (error) {
      console.error('workLocationService.updateWorkLocation error:', error);
      throw error;
    }
  },

  /**
   * Toggle active/inactive status
   */
  async toggleWorkLocationStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ status, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location status');
      }

      workLocationService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('locations-updated'));

      return data.location;
    } catch (error) {
      console.error('workLocationService.toggleWorkLocationStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete work location
   */
  async deleteWorkLocation(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete work location');
      }

      workLocationService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('locations-updated'));

      return data;
    } catch (error) {
      console.error('workLocationService.deleteWorkLocation error:', error);
      throw error;
    }
  },
};

export default workLocationService;
