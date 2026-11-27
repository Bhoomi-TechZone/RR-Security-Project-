import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const storageService = {
  /**
   * Upload a File object directly to Cloudflare R2 storage
   * @param {File} file - Native browser File instance
   * @param {string} folder - 'documents' | 'images' | 'salaryslips' | 'letters'
   * @param {string} companyId - Active company identifier
   * @returns {Promise<{ key: string, url: string, fileName: string, size: number, contentType: string }>}
   */
  async uploadFile(file, folder = 'documents', companyId = '') {
    try {
      const token = authService.getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (companyId) formData.append('companyId', companyId);

      const response = await fetch(`${API_BASE_URL}/storage/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-company-id': companyId || ''
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload file to Cloudflare R2');
      }

      return data.file;
    } catch (error) {
      console.error('storageService.uploadFile error:', error);
      throw error;
    }
  },

  /**
   * Upload Base64 Data URI directly to Cloudflare R2 storage
   * @param {string} base64Data - Raw or data: URI base64 string
   * @param {string} filename - Target filename e.g. 'avatar.png'
   * @param {string} folder - 'images' | 'documents' | 'salaryslips'
   * @param {string} companyId - Active company identifier
   * @returns {Promise<{ key: string, url: string, fileName: string, size: number, contentType: string }>}
   */
  async uploadBase64(base64Data, filename = 'file.png', folder = 'images', companyId = '') {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/storage/upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-company-id': companyId || ''
        },
        body: JSON.stringify({ base64Data, filename, folder, companyId })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload base64 to Cloudflare R2');
      }

      return data.file;
    } catch (error) {
      console.error('storageService.uploadBase64 error:', error);
      throw error;
    }
  },

  /**
   * Delete an object from Cloudflare R2 storage
   * @param {string} key - R2 object key
   */
  async deleteFile(key) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/storage/file/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      console.error('storageService.deleteFile error:', error);
      throw error;
    }
  }
};

export default storageService;
