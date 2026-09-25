// NovaSpark HRMS — Mock Client Master Data
import { mockCompanies } from '../companyData';

export const MANPOWER_SERVICE_OPTIONS = [
  'Security Guard Services',
  'Security Supervisor Services',
  'Armed Security Services',
  'Unarmed Security Services',
  'Security Officer Services',
  'Event Security Services',
  'Corporate Security Services',
  'Industrial Security Services',
  'Residential Security Services',
  'Mall & Retail Security',
  'Hospital Security Services',
  'School & College Security',
  'Bank & ATM Security',
  'Construction Site Security',
  'Warehouse & Logistics Security',
  'Parking Management',
  'Housekeeping Services',
  'Facility Management',
  'Reception / Front Desk Staff',
  'Driver / Transport Staff',
  'Skilled Manpower',
  'Semi-Skilled Manpower',
  'Unskilled Manpower',
  'Other Manpower Services'
];

export const getInitialClients = () => {
  return mockCompanies.map((c, idx) => ({
    id: c.id,
    name: c.name,
    code: c.code || `CLI-${String(idx + 1).padStart(3, '0')}`,
    contactPerson: c.contactPerson || 'N/A',
    contactNumber: c.contactNumber || '+91 98765 43210',
    email: c.email || `contact@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    address: c.address || 'Industrial Area',
    city: c.city || 'Bangalore',
    state: c.state || 'Karnataka',
    pinCode: c.pinCode || '560001',
    servicesRequired: c.servicesRequired || ['Security Guard Services', 'Security Supervisor Services'],
    employees: c.employees || 0,
    contractStartDate: c.contractStartDate || '2026-01-01',
    status: c.status || 'active'
  }));
};
