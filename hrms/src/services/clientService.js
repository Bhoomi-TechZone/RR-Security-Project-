import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// High-speed client cache and in-flight request deduplicator
const clientsCache = new Map();
const inFlightRequests = new Map();

export const clientService = {
  clearCache(companyId) {
    if (companyId) {
      clientsCache.delete(companyId);
    } else {
      clientsCache.clear();
    }
  },

  /**
   * Fetch all clients for the active company profile (with in-memory cache and request deduplication)
   */
  async getClients(companyId, forceRefresh = false) {
    if (!companyId) return [];

    // Return cached list instantly if available
    if (!forceRefresh && clientsCache.has(companyId)) {
      return clientsCache.get(companyId);
    }

    // Reuse in-flight promise if an identical request is already active
    if (inFlightRequests.has(companyId)) {
      return inFlightRequests.get(companyId);
    }

    const fetchPromise = (async () => {
      try {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/clients?companyId=${companyId || ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': companyId || '',
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch clients');
        }

        const clients = data.clients || [];
        clientsCache.set(companyId, clients);
        return clients;
      } catch (error) {
        console.error('clientService.getClients error:', error);
        throw error;
      } finally {
        inFlightRequests.delete(companyId);
      }
    })();

    inFlightRequests.set(companyId, fetchPromise);
    return fetchPromise;
  },

  /**
   * Fetch single client details by ID or clientId
   */
  async getClientById(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch client details');
      }

      return data.client;
    } catch (error) {
      console.error('clientService.getClientById error:', error);
      throw error;
    }
  },

  /**
   * Get next sequential Client ID for company (e.g. CLI-001)
   */
  async getNextClientId(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/next-id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get next client ID');
      }

      return data.nextId || 'CLI-001';
    } catch (error) {
      console.error('clientService.getNextClientId error:', error);
      return 'CLI-001';
    }
  },

  /**
   * Create a new client associated with companyId
   */
  async createClient(companyId, clientData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ ...clientData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create client');
      }

      clientService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('clients-updated'));

      return data.client;
    } catch (error) {
      console.error('clientService.createClient error:', error);
      throw error;
    }
  },

  /**
   * Update an existing client
   */
  async updateClient(companyId, id, clientData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ ...clientData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client');
      }

      clientService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('clients-updated'));

      return data.client;
    } catch (error) {
      console.error('clientService.updateClient error:', error);
      throw error;
    }
  },

  /**
   * Toggle client status
   */
  async toggleClientStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ status, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client status');
      }

      clientService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('clients-updated'));

      return data.client;
    } catch (error) {
      console.error('clientService.toggleClientStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete client
   */
  async deleteClient(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete client');
      }

      clientService.clearCache(companyId);
      window.dispatchEvent(new CustomEvent('clients-updated'));

      return data;
    } catch (error) {
      console.error('clientService.deleteClient error:', error);
      throw error;
    }
  },
};

export default clientService;
