import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class InventoryService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId
    };
  }

  /**
   * ==========================================
   * 1. INVENTORY MASTER ITEMS (UNIFORMS & ASSETS)
   * ==========================================
   */

  async getItems(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.itemType) query.append('itemType', params.itemType);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/inventory/items?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch inventory items');
    }
    return data.items || [];
  }

  async createItem(companyId, itemData) {
    const res = await fetch(`${API_BASE_URL}/inventory/items`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...itemData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create inventory item');
    }
    return data;
  }

  async updateItem(companyId, id, itemData) {
    const res = await fetch(`${API_BASE_URL}/inventory/items/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...itemData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update inventory item');
    }
    return data;
  }

  async deleteItem(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/inventory/items/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete inventory item');
    }
    return data;
  }

  async toggleItemStatus(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/inventory/items/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to toggle item status');
    }
    return data;
  }

  /**
   * ==========================================
   * 2. ISSUED INVENTORY ITEMS
   * ==========================================
   */

  async getIssuedItems(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.employeeName) query.append('employeeName', params.employeeName);
    if (params.employeeEmail) query.append('employeeEmail', params.employeeEmail);
    if (params.issueType) query.append('issueType', params.issueType);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/inventory/issued?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch issued items');
    }
    return data.issued || [];
  }

  async issueItems(companyId, itemsOrList) {
    const list = Array.isArray(itemsOrList) ? itemsOrList : [itemsOrList];
    const res = await fetch(`${API_BASE_URL}/inventory/issued`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        companyId: companyId,
        items: list
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to issue inventory items');
    }
    return data;
  }

  async updateIssuedItem(companyId, id, updateData) {
    const res = await fetch(`${API_BASE_URL}/inventory/issued/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...updateData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update issued record');
    }
    return data;
  }

  async deleteIssuedItem(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/inventory/issued/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete issued item');
    }
    return data;
  }

  /**
   * ==========================================
   * 3. RETURN HISTORY & CONDITION INSPECTION
   * ==========================================
   */

  async getReturnRecords(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.employeeName) query.append('employeeName', params.employeeName);
    if (params.condition) query.append('condition', params.condition);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/inventory/returns?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch return records');
    }
    return data.returns || [];
  }

  async processReturn(companyId, returnData) {
    const res = await fetch(`${API_BASE_URL}/inventory/returns`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...returnData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to process return');
    }
    return data;
  }

  /**
   * ==========================================
   * 4. STOCK MOVEMENTS & AUDIT LEDGER
   * ==========================================
   */

  async getMovements(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.itemId) query.append('itemId', params.itemId);
    if (params.movementType) query.append('movementType', params.movementType);

    const res = await fetch(`${API_BASE_URL}/inventory/movements?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch stock movements');
    }
    return data.movements || [];
  }

  /**
   * ==========================================
   * 5. EMPLOYEE EXIT ASSET CLEARANCES
   * ==========================================
   */

  async getClearances(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.clearanceStatus) query.append('clearanceStatus', params.clearanceStatus);

    const res = await fetch(`${API_BASE_URL}/inventory/clearances?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch clearance records');
    }
    return data.clearances || [];
  }

  async approveClearance(companyId, id, approvalData = {}) {
    const res = await fetch(`${API_BASE_URL}/inventory/clearances/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...approvalData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to approve clearance');
    }
    return data;
  }

  /**
   * ==========================================
   * 6. UNIFORM & ASSET REQUISITIONS / REQUESTS
   * ==========================================
   */

  async getRequests(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.employeeName) query.append('employeeName', params.employeeName);
    if (params.requestType) query.append('requestType', params.requestType);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/inventory/requests?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch inventory requests');
    }
    return data.requests || [];
  }

  async createRequest(companyId, requestData) {
    const res = await fetch(`${API_BASE_URL}/inventory/requests`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...requestData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit uniform/asset request');
    }
    return data;
  }

  async actionRequest(companyId, id, actionData) {
    const res = await fetch(`${API_BASE_URL}/inventory/requests/${id}/action`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...actionData,
        companyId: companyId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to action request');
    }
    return data;
  }

  async deleteRequest(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/inventory/requests/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete request');
    }
    return data;
  }

  /**
   * Fetch active employees for dynamic issue dropdown
   */
  async getEmployees(companyId) {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'GET',
        headers: this.getHeaders(companyId)
      });
      const data = await res.json();
      if (!res.ok) {
        return [];
      }
      return data.employees || [];
    } catch {
      return [];
    }
  }
}

export default new InventoryService();
