import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const CompanyContext = createContext(null);

/**
 * Generate unique Company ID:
 * First 3 letters of first word + 7 unique random digits + first 3 letters of last word (or suffix)
 * E.g., "Quoder Service" -> "QUO0986934SER"
 * E.g., "RR Security" -> "RRS8392014SEC"
 */
export function generateCompanyId(companyName) {
  if (!companyName) return `CMP${Math.floor(1000000 + Math.random() * 9000000)}COR`;
  const words = companyName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const first3 = (words[0] || 'CMP').substring(0, 3).padEnd(3, 'X');
  const last3 = (words.length > 1 ? words[words.length - 1] : (words[0].length >= 6 ? words[0].slice(-3) : words[0])).substring(0, 3).padEnd(3, 'X');
  const random7 = Math.floor(1000000 + Math.random() * 9000000);
  return `${first3}${random7}${last3}`;
}

// Initial default primary company with formatted unique companyId
export const DEFAULT_PRIMARY_COMPANY = {
  id: 'RRS8392014SEC',
  companyId: 'RRS8392014SEC',
  name: 'RR Security',
  code: 'RRS',
  industry: 'Security & Facility Management',
  email: 'rrsecurity@gmail.com',
  phone: '+91 9876543210',
  address: 'Civil Lines, Bareilly, Uttar Pradesh 243001',
  city: 'Bareilly',
  state: 'Uttar Pradesh',
  pinCode: '243001',
  gstin: '09ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  tan: 'BLRA12345D',
  isDefault: true,
  status: 'Active',
  employeesCount: 1250,
  clientsCount: 14,
  monthlyPayroll: '₹ 2,45,80,000',
  attendanceToday: '1,421 / 1,531',
  activeShifts: 3
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

export function CompanyProvider({ children }) {
  // 1. All registered companies for the admin
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('novaspark_admin_companies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => ({
            ...c,
            companyId: c.companyId || c.id || generateCompanyId(c.name)
          }));
        }
      } catch (e) {
        // fallback
      }
    }
    return [DEFAULT_PRIMARY_COMPANY];
  });

  // 2. Active selected company
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    return localStorage.getItem('novaspark_active_company_id') || DEFAULT_PRIMARY_COMPANY.companyId;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('novaspark_admin_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('novaspark_active_company_id', activeCompanyId);
  }, [activeCompanyId]);

  // Fetch companies from backend API if user is authenticated
  const refreshFromBackend = useCallback(async () => {
    const token = authService.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.companies && data.companies.length > 0) {
          const formatted = data.companies.map(c => ({
            ...c,
            companyId: c.companyId || c.id
          }));
          setCompanies(formatted);
          if (!formatted.some(c => (c.companyId === activeCompanyId || c.id === activeCompanyId))) {
            setActiveCompanyId(formatted[0].companyId || formatted[0].id);
          }
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, [activeCompanyId]);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Active Company Object
  const activeCompany =
    companies.find(c => c.companyId === activeCompanyId || c.id === activeCompanyId) ||
    companies[0] ||
    DEFAULT_PRIMARY_COMPANY;

  /**
   * Switch Active Company Profile
   */
  const switchCompany = (companyId) => {
    const found = companies.find(c => c.companyId === companyId || c.id === companyId);
    if (found) {
      const targetId = found.companyId || found.id;
      setActiveCompanyId(targetId);
      window.dispatchEvent(new CustomEvent('company-profile-changed', { detail: found }));
    }
  };

  /**
   * Add a new Company Profile (Creates isolated company workspace in MongoDB database)
   */
  const addCompanyProfile = async (companyData) => {
    const token = authService.getToken();
    let created = null;

    const uniqueId = generateCompanyId(companyData.name);
    const payload = {
      ...companyData,
      companyId: uniqueId
    };

    if (token) {
      const res = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.company) {
        created = {
          ...data.company,
          companyId: data.company.companyId || uniqueId,
          id: data.company.companyId || data.company.id || uniqueId
        };
      } else {
        throw new Error(data.message || 'Failed to save company profile to database.');
      }
    } else {
      // Local fallback creation if no auth token
      created = {
        id: uniqueId,
        companyId: uniqueId,
        name: companyData.name,
        code: (companyData.code || companyData.name.substring(0, 3)).toUpperCase(),
        industry: companyData.industry || 'Security & Facility Management',
        email: companyData.email || 'company@domain.com',
        phone: companyData.phone || '',
        address: companyData.address || '',
        city: companyData.city || '',
        state: companyData.state || '',
        pinCode: companyData.pinCode || '',
        gstin: companyData.gstin || '',
        pan: companyData.pan || '',
        tan: companyData.tan || '',
        status: 'Active',
        isDefault: false,
        employeesCount: 0,
        clientsCount: 0,
        monthlyPayroll: '₹ 0',
        attendanceToday: '0 / 0',
        activeShifts: 0,
        createdAt: new Date().toISOString()
      };
    }

    setCompanies(prev => [created, ...prev.filter(c => (c.companyId || c.id) !== (created.companyId || created.id))]);
    setActiveCompanyId(created.companyId || created.id);
    window.dispatchEvent(new CustomEvent('company-profile-changed', { detail: created }));
    return created;
  };

  /**
   * Update existing company profile in MongoDB database
   */
  const updateCompanyProfile = async (companyId, updateData) => {
    const token = authService.getToken();
    let updated = null;

    if (token) {
      const res = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (res.ok && data.company) {
        updated = {
          ...data.company,
          companyId: data.company.companyId || companyId,
          id: data.company.companyId || data.company.id || companyId
        };
      } else {
        throw new Error(data.message || 'Failed to update company profile in database.');
      }
    }

    setCompanies(prev => {
      const merged = prev.map(c => ((c.companyId === companyId || c.id === companyId || c._id === companyId) ? { ...c, ...updateData, ...(updated || {}) } : c));
      const targetCompany = merged.find(c => c.companyId === companyId || c.id === companyId || c._id === companyId);
      if (targetCompany) {
        window.dispatchEvent(new CustomEvent('company-profile-changed', { detail: targetCompany }));
      }
      return merged;
    });
    return updated;
  };

  /**
   * Delete company profile from MongoDB database
   */
  const deleteCompanyProfile = async (companyId) => {
    const token = authService.getToken();

    if (token) {
      const res = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete company profile from database.');
      }
    }

    setCompanies(prev => {
      const remaining = prev.filter(c => c.companyId !== companyId && c.id !== companyId && c._id !== companyId);
      if (activeCompanyId === companyId && remaining.length > 0) {
        const nextActive = remaining[0].companyId || remaining[0].id;
        setActiveCompanyId(nextActive);
      }
      return remaining;
    });
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanyId,
        switchCompany,
        addCompanyProfile,
        updateCompanyProfile,
        deleteCompanyProfile,
        refreshFromBackend
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    return {
      companies: [DEFAULT_PRIMARY_COMPANY],
      activeCompany: DEFAULT_PRIMARY_COMPANY,
      activeCompanyId: DEFAULT_PRIMARY_COMPANY.companyId,
      switchCompany: () => { },
      addCompanyProfile: async () => DEFAULT_PRIMARY_COMPANY,
      updateCompanyProfile: () => { },
      deleteCompanyProfile: () => { },
      refreshFromBackend: () => { }
    };
  }
  return context;
}
