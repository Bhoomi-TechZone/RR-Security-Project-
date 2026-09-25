import React, { createContext, useContext, useState, useEffect } from 'react';
import { CLIENT_COMPANY_PROFILE } from '../data/clientPortalData';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  // Store currently authenticated client company in localStorage
  const [clientCompany, setClientCompany] = useState(() => {
    const saved = localStorage.getItem('novaspark_active_client');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return CLIENT_COMPANY_PROFILE;
  });

  const [clientUser] = useState({
    id: 'usr-client-001',
    name: 'Rahul Kumar',
    initials: 'RK',
    email: 'rahul.kumar@abcsecurity.in',
    designation: 'Client Representative',
    companyName: 'ABC Security Services',
    clientId: 'c001',
    role: 'Client'
  });

  useEffect(() => {
    localStorage.setItem('novaspark_active_client', JSON.stringify(clientCompany));
  }, [clientCompany]);

  return (
    <ClientAuthContext.Provider
      value={{
        clientCompany,
        clientUser,
        clientId: clientCompany.clientId || 'c001',
        companyName: clientCompany.name || 'ABC Security Services',
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
    return {
      clientCompany: CLIENT_COMPANY_PROFILE,
      clientUser: {
        id: 'usr-client-001',
        name: 'Rahul Kumar',
        initials: 'RK',
        email: 'rahul.kumar@abcsecurity.in',
        designation: 'Client Representative',
        companyName: 'ABC Security Services',
        clientId: 'c001',
        role: 'Client'
      },
      clientId: 'c001',
      companyName: 'ABC Security Services',
      setClientCompany: () => {}
    };
  }
  return context;
}
