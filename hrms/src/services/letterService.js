import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class LetterService {
  getHeaders(companyId) {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    };
  }

  /**
   * Get all letters with filters from MongoDB
   */
  async getLetters(companyId, params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.department && params.department !== 'All') query.append('department', params.department);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/letters?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch letter records');
    }
    return data;
  }

  /**
   * Get single letter by ID
   */
  async getLetterById(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/letters/${id}`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch letter');
    }
    return data.letter;
  }

  /**
   * Create a new Letter in MongoDB Atlas using template
   */
  async createLetter(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/letters`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify({
        ...payload,
        companyId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create letter');
    }
    return data.letter;
  }

  /**
   * Update letter details or status in MongoDB Atlas
   */
  async updateLetter(companyId, id, payload) {
    const res = await fetch(`${API_BASE_URL}/letters/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update letter');
    }
    return data.letter;
  }

  /**
   * Delete letter from MongoDB Atlas
   */
  async deleteLetter(companyId, id) {
    const res = await fetch(`${API_BASE_URL}/letters/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete letter');
    }
    return data;
  }

  /**
   * Get active letter templates for company
   */
  async getLetterTemplates(companyId) {
    const res = await fetch(`${API_BASE_URL}/letters/templates`, {
      method: 'GET',
      headers: this.getHeaders(companyId),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch letter templates');
    }
    return data.templates;
  }

  /**
   * Save letter template
   */
  async saveLetterTemplate(companyId, payload) {
    const res = await fetch(`${API_BASE_URL}/letters/templates`, {
      method: 'POST',
      headers: this.getHeaders(companyId),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save template');
    }
    return data.template;
  }
}

export default new LetterService();
