// NovaSpark HRMS — Client Services Master Data
export const DEFAULT_CLIENT_SERVICES = [
  {
    id: 'srv_1',
    name: 'Security Guard',
    code: 'SG',
    description: 'Trained static, patrolling, and gate management security guard personnel.',
    status: 'active'
  },
  {
    id: 'srv_2',
    name: 'Housekeeping',
    code: 'HK',
    description: 'Professional commercial facility cleaning, sanitation, and hygiene upkeep.',
    status: 'active'
  },
  {
    id: 'srv_3',
    name: 'Manufacturing Support',
    code: 'MFG',
    description: 'Industrial assembly line, machine operators, and factory floor workforce.',
    status: 'active'
  },
  {
    id: 'srv_4',
    name: 'Unarmed Security',
    code: 'US',
    description: 'Physical security monitoring, visitor management, and non-lethal patrol units.',
    status: 'active'
  },
  {
    id: 'srv_5',
    name: 'Armed Security',
    code: 'AS',
    description: 'Licensed PSO and armed security personnel for cash transit and high-risk security.',
    status: 'active'
  },
  {
    id: 'srv_6',
    name: 'Facility Management',
    code: 'FM',
    description: 'Comprehensive electrical, plumbing, HVAC, and building maintenance operations.',
    status: 'active'
  },
  {
    id: 'srv_7',
    name: 'Bouncer / Event Security',
    code: 'BNC',
    description: 'VIP protection, concert/event security, crowd control, and hospitality bouncers.',
    status: 'active'
  },
  {
    id: 'srv_8',
    name: 'Driver / Chauffeur',
    code: 'DRV',
    description: 'Corporate executive drivers, shuttle drivers, and heavy vehicle logistics staff.',
    status: 'active'
  }
];

export const getInitialClientServices = (companyId) => {
  const key = `novaspark_client_services_${companyId || 'comp_rr_security'}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem(key, JSON.stringify(DEFAULT_CLIENT_SERVICES));
  return DEFAULT_CLIENT_SERVICES;
};
