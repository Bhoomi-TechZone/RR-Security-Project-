import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import clientPortalService from '../services/clientPortalService';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);

  // Initialize client profile dynamically from active session
  const [clientCompany, setClientCompany] = useState(() => {
    const user = authService.getCurrentUser();
    const saved = localStorage.getItem('novaspark_active_client');
    if (saved && user) {
      try {
        const parsed = JSON.parse(saved);
        // Only reuse if matching currently logged in client
        if (
          parsed.id === user.id ||
          parsed.clientId === user.clientId ||
          parsed.name === user.name
        ) {
          return parsed;
        }
      } catch (e) {}
    }

    if (user && (user.role === 'client' || user.clientId)) {
      return {
        id: user.clientId || user.id || 'CLI-001',
        clientId: user.clientId || user.id || 'CLI-001',
        clientCode: user.clientId || user.id || 'CLI-001',
        name: user.name || 'Client Organization',
        legalName: user.name ? `${user.name} Pvt. Ltd.` : 'Client Organization Pvt. Ltd.',
        contactPerson: user.contactPerson || user.name || 'Authorized Representative',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        contractStatus: 'Active',
        registeredAddress: user.address || '',
        billingAddress: user.address || '',
        operatingSites: []
      };
    }

    return {
      id: 'CLI-001',
      clientId: 'CLI-001',
      clientCode: 'CLI-001',
      name: 'Client Organization',
      legalName: 'Client Organization Pvt. Ltd.',
      contactPerson: 'Authorized Representative',
      email: '',
      contactNumber: '',
      contractStatus: 'Active',
      registeredAddress: '',
      billingAddress: '',
      operatingSites: []
    };
  });

  const [clientUser, setClientUser] = useState(() => {
    const user = authService.getCurrentUser();
    const name = user?.contactPerson || user?.name || 'Client Representative';
    return {
      id: user?.id || 'usr-client',
      name: name,
      initials: name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CR',
      email: user?.email || '',
      designation: 'Client Representative',
      companyName: user?.name || 'Client Organization',
      clientId: user?.clientId || user?.id || 'CLI-001',
      role: 'Client'
    };
  });

  // Fetch live client profile from backend
  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await clientPortalService.getProfile();
      if (profile) {
        setClientCompany(profile);
        localStorage.setItem('novaspark_active_client', JSON.stringify(profile));

        const repName = profile.contactPerson || profile.name || 'Client Representative';
        setClientUser({
          id: profile.clientId || 'usr-client',
          name: repName,
          initials: repName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CR',
          email: profile.email || '',
          designation: profile.designation || 'Client Representative',
          companyName: profile.name || 'Client Organization',
          clientId: profile.clientId || 'CLI-001',
          role: 'Client'
        });
      }
    } catch (err) {
      console.warn('Could not refresh client profile from API:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (clientCompany) {
      localStorage.setItem('novaspark_active_client', JSON.stringify(clientCompany));
    }
  }, [clientCompany]);

  return (
    <ClientAuthContext.Provider
      value={{
        clientCompany,
        clientUser,
        clientId: clientCompany?.clientId || 'CLI-001',
        companyName: clientCompany?.name || 'Client Organization',
        loading,
        refreshProfile,
        setClientCompany
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    const user = authService.getCurrentUser();
    const name = user?.name || 'Client Organization';
    return {
      clientCompany: {
        id: user?.clientId || 'CLI-001',
        clientId: user?.clientId || 'CLI-001',
        clientCode: user?.clientId || 'CLI-001',
        name: name,
        legalName: `${name} Pvt. Ltd.`,
        contactPerson: user?.contactPerson || name,
        email: user?.email || '',
        contactNumber: '',
        contractStatus: 'Active',
        registeredAddress: '',
        billingAddress: '',
        operatingSites: []
      },
      clientUser: {
        id: 'usr-client',
        name: user?.contactPerson || name,
        initials: (user?.contactPerson || name)
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CR',
        email: user?.email || '',
        designation: 'Client Representative',
        companyName: name,
        clientId: user?.clientId || 'CLI-001',
        role: 'Client'
      },
      clientId: user?.clientId || 'CLI-001',
      companyName: name,
      loading: false,
      refreshProfile: () => {},
      setClientCompany: () => {}
    };
  }
  return context;
}
