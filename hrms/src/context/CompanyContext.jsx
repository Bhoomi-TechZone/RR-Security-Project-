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
  employerPfCode: 'DLCPM0012345000',
  employerEsiCode: '31000123450000101',
  isDefault: true,
  status: 'Active',
  employeesCount: 1250,
  clientsCount: 14,
  monthlyPayroll: '₹ 2,45,80,000',
  attendanceToday: '1,421 / 1,531',
  activeShifts: 3
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function CompanyProvider({ children }) {
  // 1. All registered companies for the admin
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('novaspark_admin_companies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => {
            const cId = c.companyId || c.id || generateCompanyId(c.name);
            const storedLogo = localStorage.getItem(`novaspark_company_logo_${cId}`) ||
              (c.isDefault ? localStorage.getItem('novaspark_company_logo_preview') : null);
            return {
              ...c,
              companyId: cId,
              logo: c.logo || storedLogo || null
            };
          });
        }
      } catch (e) {
        // fallback
      }
    }
    const defLogo = localStorage.getItem(`novaspark_company_logo_${DEFAULT_PRIMARY_COMPANY.companyId}`) ||
      localStorage.getItem('novaspark_company_logo_preview') || null;
    return [{ ...DEFAULT_PRIMARY_COMPANY, logo: defLogo }];
  });

  // 2. Active company workspace is strictly locked to authenticated company
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    const user = authService.getCurrentUser();
    const isMasterRR = 
      !user || 
      user?.email?.toLowerCase() === 'rrsecurity@gmail.com' ||
      user?.email?.toLowerCase() === 'admin@rrsecurity.com' ||
      user?.email?.toLowerCase().includes('rrsecurity');

    if (isMasterRR) {
      localStorage.setItem('novaspark_active_company_id', DEFAULT_PRIMARY_COMPANY.companyId);
      return DEFAULT_PRIMARY_COMPANY.companyId;
    }
    const lockedId = user?.companyId || DEFAULT_PRIMARY_COMPANY.companyId;
    localStorage.setItem('novaspark_active_company_id', lockedId);
    return lockedId;
  });

  // Global Master Brand Logo (displayed on sidebar header across all companies)
  const [brandLogo, setBrandLogo] = useState(() => {
    return localStorage.getItem('novaspark_master_brand_logo') ||
      localStorage.getItem(`novaspark_company_logo_${DEFAULT_PRIMARY_COMPANY.companyId}`) ||
      localStorage.getItem('novaspark_company_logo_preview') ||
      null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('novaspark_admin_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('novaspark_active_company_id', activeCompanyId);
  }, [activeCompanyId]);

  // Listen for brand logo updates from any tab/component
  useEffect(() => {
    const handleLogoChange = (e) => {
      if (e.detail?.logo !== undefined) {
        setBrandLogo(e.detail.logo);
      }
    };
    window.addEventListener('master-brand-logo-changed', handleLogoChange);
    return () => window.removeEventListener('master-brand-logo-changed', handleLogoChange);
  }, []);

  // Listen for auth state changes to dynamically lock workspace to user's assigned company
  useEffect(() => {
    const handleAuthChange = (e) => {
      const user = e.detail || authService.getCurrentUser();
      const isMasterRR = 
        !user || 
        user?.email?.toLowerCase() === 'rrsecurity@gmail.com' ||
        user?.email?.toLowerCase() === 'admin@rrsecurity.com' ||
        user?.email?.toLowerCase().includes('rrsecurity');

      if (isMasterRR) {
        setActiveCompanyId(DEFAULT_PRIMARY_COMPANY.companyId);
        localStorage.setItem('novaspark_active_company_id', DEFAULT_PRIMARY_COMPANY.companyId);
      } else if (user?.companyId) {
        setActiveCompanyId(user.companyId);
        localStorage.setItem('novaspark_active_company_id', user.companyId);
      }
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  // Fetch companies and brand logo from backend API dynamically
  const refreshFromBackend = useCallback(async () => {
    const token = authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      // Fetch system brand logo (accessible to all companies)
      fetch(`${API_BASE_URL}/companies/brand-logo`, { headers })
        .then(res => res.json())
        .then(brandData => {
          if (brandData.success && brandData.brandLogo) {
            setBrandLogo(brandData.brandLogo);
            localStorage.setItem('novaspark_master_brand_logo', brandData.brandLogo);
          }
        })
        .catch(() => {});

      const res = await fetch(`${API_BASE_URL}/companies`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.companies && data.companies.length > 0) {
          const formatted = data.companies.map(c => ({
            ...c,
            companyId: c.companyId || c.id
          }));
          setCompanies(formatted);

          // If master company has logo, also sync as brand logo
          const master = formatted.find(c => c.isDefault || c.companyId === 'RRS8392014SEC');
          if (master?.logo) {
            setBrandLogo(master.logo);
            localStorage.setItem('novaspark_master_brand_logo', master.logo);
          }
          setActiveCompanyId(() => {
            const currentUser = authService.getCurrentUser();
            const isMasterRR = 
              !currentUser ||
              currentUser?.email?.toLowerCase() === 'rrsecurity@gmail.com' ||
              currentUser?.email?.toLowerCase() === 'admin@rrsecurity.com' ||
              currentUser?.email?.toLowerCase().includes('rrsecurity');

            if (isMasterRR) {
              localStorage.setItem('novaspark_active_company_id', DEFAULT_PRIMARY_COMPANY.companyId);
              return DEFAULT_PRIMARY_COMPANY.companyId;
            }
            if (currentUser?.companyId) {
              localStorage.setItem('novaspark_active_company_id', currentUser.companyId);
              return currentUser.companyId;
            }
            return DEFAULT_PRIMARY_COMPANY.companyId;
          });
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Active Company Object
  const activeCompany =
    companies.find(c => c.companyId === activeCompanyId || c.id === activeCompanyId) ||
    companies.find(c => c.companyId === DEFAULT_PRIMARY_COMPANY.companyId || c.isDefault) ||
    companies[0] ||
    DEFAULT_PRIMARY_COMPANY;

  /**
   * Workspace switching is completely disabled.
   * RR Security operates in its own master workspace; created companies operate strictly in their own workspace.
   */
  const switchCompany = () => {
    return;
  };

  /**
   * Add a new Company Profile (Creates isolated company workspace in MongoDB database)
   */
  const addCompanyProfile = async (companyData) => {
    const token = authService.getToken();
    let created = null;

    const uniqueId = generateCompanyId(companyData.name);
    const pass = companyData.adminPassword || companyData.password || companyData.adminInitialPassword || '';
    const payload = {
      ...companyData,
      companyId: uniqueId,
      adminInitialPassword: pass
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
          id: data.company.companyId || data.company.id || uniqueId,
          adminInitialPassword: data.company.adminInitialPassword || pass
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
        adminEmail: companyData.adminEmail || companyData.email || 'admin@domain.com',
        adminInitialPassword: pass,
        phone: companyData.phone || '',
        address: companyData.address || '',
        city: companyData.city || '',
        state: companyData.state || '',
        pinCode: companyData.pinCode || '',
        gstin: companyData.gstin || '',
        pan: companyData.pan || '',
        tan: companyData.tan || '',
        logo: companyData.logo || null,
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

    if (pass) {
      localStorage.setItem(`novaspark_company_password_${created.companyId || created.id}`, pass);
    }
    if (companyData.adminEmail) {
      localStorage.setItem(`novaspark_company_admin_email_${created.companyId || created.id}`, companyData.adminEmail);
    }

    if (companyData.logo) {
      localStorage.setItem(`novaspark_company_logo_${created.companyId || created.id}`, companyData.logo);
    }

    setCompanies(prev => [created, ...prev.filter(c => (c.companyId || c.id) !== (created.companyId || created.id))]);
    // Master RR Security workspace remains locked to DEFAULT_PRIMARY_COMPANY.companyId
    setActiveCompanyId(DEFAULT_PRIMARY_COMPANY.companyId);
    localStorage.setItem('novaspark_active_company_id', DEFAULT_PRIMARY_COMPANY.companyId);
    return created;
  };

  /**
   * Update existing company profile in MongoDB database
   */
  const updateCompanyProfile = async (companyId, updateData) => {
    const token = authService.getToken();
    let updated = null;

    if (updateData.logo) {
      localStorage.setItem(`novaspark_company_logo_${companyId}`, updateData.logo);
    } else if (updateData.logo === null) {
      localStorage.removeItem(`novaspark_company_logo_${companyId}`);
    }

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

  /**
   * Update Master Brand Logo across the platform (visible to all companies in sidebar header)
   */
  const updateMasterBrandLogo = async (logoUrlOrBase64) => {
    const token = authService.getToken();
    const cleanLogo = logoUrlOrBase64 ? logoUrlOrBase64.trim() : null;

    setBrandLogo(cleanLogo);
    if (cleanLogo) {
      localStorage.setItem('novaspark_master_brand_logo', cleanLogo);
      localStorage.setItem(`novaspark_company_logo_${DEFAULT_PRIMARY_COMPANY.companyId}`, cleanLogo);
    } else {
      localStorage.removeItem('novaspark_master_brand_logo');
      localStorage.removeItem(`novaspark_company_logo_${DEFAULT_PRIMARY_COMPANY.companyId}`);
    }

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/companies/brand-logo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ logo: cleanLogo })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to save brand logo to database.');
        }
      } catch (err) {
        console.error('Error saving brand logo to backend:', err);
        throw err;
      }
    }

    // Broadcast across windows/tabs/components
    window.dispatchEvent(new CustomEvent('master-brand-logo-changed', {
      detail: { logo: cleanLogo }
    }));

    return cleanLogo;
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanyId,
        brandLogo,
        updateMasterBrandLogo,
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
      brandLogo: null,
      updateMasterBrandLogo: async () => null,
      switchCompany: () => { },
      addCompanyProfile: async () => DEFAULT_PRIMARY_COMPANY,
      updateCompanyProfile: () => { },
      deleteCompanyProfile: () => { },
      refreshFromBackend: () => { }
    };
  }
  return context;
}
