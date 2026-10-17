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
  },

  /**
   * Bulk import employees from parsed spreadsheet records
   */
  async bulkImportEmployees(companyId, records, meta = {}) {
    const token = authService.getToken();
    try {
      const response = await fetch(`${API_BASE_URL}/employees/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({
          records,
          ...meta
        })
      });

      if (response.status === 404) {
        // Fallback for when backend process is running without hot-reload:
        console.warn('POST /employees/bulk-import returned 404, executing direct creation/update fallback...');
        let existingMap = new Map();
        try {
          const existingEmployees = await employeeService.getEmployees(companyId);
          (existingEmployees || []).forEach(e => {
            if (e.employeeId) existingMap.set(String(e.employeeId).trim().toLowerCase(), e);
            if (e.employeeCode) existingMap.set(String(e.employeeCode).trim().toLowerCase(), e);
          });
        } catch (_) {}

        const createdList = [];
        const updatedList = [];
        const errorList = [];

        for (let i = 0; i < records.length; i++) {
          const rec = records[i];
          const rawId = String(rec.employeeId || rec['EMPID'] || '').trim();
          let formattedEmpId = rawId;
          if (rawId && rawId.toLowerCase() !== 'auto-generate') {
            const match = rawId.match(/^([A-Za-z]+)?[-_/\s]*(\d+)$/);
            if (match) {
              const p = match[1] ? match[1].toUpperCase() : 'RR';
              const d = match[2].padStart(3, '0');
              formattedEmpId = `${p}-${d}`;
            }
          }

          const existingEmp = rawId ? (existingMap.get(rawId.toLowerCase()) || (formattedEmpId ? existingMap.get(formattedEmpId.toLowerCase()) : null)) : null;

          try {
            if (existingEmp) {
              const updateRes = await fetch(`${API_BASE_URL}/employees/${existingEmp._id || existingEmp.employeeId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token || ''}`,
                  'x-company-id': companyId || '',
                },
                body: JSON.stringify({
                  companyId,
                  employeeId: formattedEmpId,
                  employeeCode: formattedEmpId,
                  name: rec.name || rec['EMPLOYEE NAME'],
                  gender: rec.gender || rec['GENDER'] || existingEmp.gender || 'Male',
                  dob: rec.dob || rec['DOB'] || existingEmp.dob || '',
                  mobile: rec.mobile || rec['MOBILE'] || existingEmp.mobile || '',
                  contact: rec.mobile || rec['MOBILE'] || existingEmp.contact || '',
                  email: rec.email || rec['EMAIL'] || existingEmp.email || '',
                  department: rec.department || meta.defaultDepartment || existingEmp.department || 'Security',
                  designation: rec.designation || meta.defaultDesignation || existingEmp.designation || 'Security Guard',
                  clientId: rec.clientId || meta.defaultClientId || existingEmp.clientId || '',
                  clientName: rec.clientName || meta.defaultClientName || existingEmp.clientName || '',
                })
              });
              const updateData = await updateRes.json();
              if (updateRes.ok) {
                updatedList.push(updateData.employee || updateData);
              } else {
                errorList.push({ row: i + 1, error: updateData.message || 'Update failed' });
              }
            } else {
              const singleRes = await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token || ''}`,
                  'x-company-id': companyId || '',
                },
                body: JSON.stringify({
                  companyId,
                  name: rec.name || rec['EMPLOYEE NAME'],
                  employeeId: formattedEmpId,
                  employeeCode: formattedEmpId,
                  gender: rec.gender || rec['GENDER'] || 'Male',
                  dob: rec.dob || rec['DOB'] || '',
                  mobile: rec.mobile || rec['MOBILE'] || '',
                  contact: rec.mobile || rec['MOBILE'] || '',
                  email: rec.email || rec['EMAIL'] || '',
                  department: rec.department || meta.defaultDepartment || 'Security',
                  designation: rec.designation || meta.defaultDesignation || 'Security Guard',
                  clientId: rec.clientId || meta.defaultClientId || '',
                  clientName: rec.clientName || meta.defaultClientName || '',
                  status: 'Active',
                  employeeStatus: 'Active',
                  employeeType: 'Permanent',
                  joiningDate: new Date().toISOString().split('T')[0]
                })
              });
              const singleData = await singleRes.json();
              if (singleRes.ok) {
                createdList.push(singleData.employee || singleData);
              } else {
                errorList.push({ row: i + 1, error: singleData.message || 'Creation failed' });
              }
            }
          } catch (err) {
            errorList.push({ row: i + 1, error: err.message });
          }
        }
        return {
          success: true,
          message: `Processed ${records.length} records (${createdList.length} created, ${updatedList.length} updated${errorList.length ? `, ${errorList.length} failed` : ''})`,
          results: {
            total: records.length,
            created: createdList.length,
            updated: updatedList.length,
            failed: errorList.length,
            errors: errorList,
            importedEmployees: [...createdList, ...updatedList]
          }
        };
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to bulk import employees');
      }

      return data;
    } catch (error) {
      console.error('employeeService.bulkImportEmployees error:', error);
      throw error;
    }
  }
};

export default employeeService;
