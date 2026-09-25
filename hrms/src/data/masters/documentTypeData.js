// NovaSpark HRMS — Mock Document Type Master Data

export const mockDocumentTypes = [
  {
    id: 'doc-1',
    name: 'Aadhaar Card',
    code: 'DOC-AADHAAR',
    requiredType: 'required',
    expiryRequired: false,
    verificationRequired: true,
    description: 'Mandatory 12-digit Indian national identity proof and address verification',
    status: 'active'
  },
  {
    id: 'doc-2',
    name: 'PAN Card',
    code: 'DOC-PAN',
    requiredType: 'required',
    expiryRequired: false,
    verificationRequired: true,
    description: '10-character alphanumeric Permanent Account Number for TDS & statutory payouts',
    status: 'active'
  },
  {
    id: 'doc-3',
    name: 'Permanent Address Proof',
    code: 'DOC-ADDR',
    requiredType: 'optional',
    expiryRequired: false,
    verificationRequired: false,
    description: 'Electricity bill, voter card, or domicile certificate for background check',
    status: 'active'
  },
  {
    id: 'doc-4',
    name: 'Police Verification Certificate',
    code: 'DOC-PV',
    requiredType: 'required',
    expiryRequired: true,
    verificationRequired: true,
    description: 'Local police station verification certificate for guard security clearances',
    status: 'active'
  },
  {
    id: 'doc-5',
    name: 'Security Guard Training Certificate',
    code: 'DOC-TC',
    requiredType: 'optional',
    expiryRequired: true,
    verificationRequired: true,
    description: 'PSARA recognized security guard basic and refresher training certificate',
    status: 'active'
  },
  {
    id: 'doc-6',
    name: 'Gun / Arms Licence',
    code: 'DOC-AL',
    requiredType: 'optional',
    expiryRequired: true,
    verificationRequired: true,
    description: 'District Magistrate authorized weapon licence for armed gunmen posts',
    status: 'active'
  },
  {
    id: 'doc-7',
    name: 'Commercial Driving Licence (DL)',
    code: 'DOC-DL',
    requiredType: 'optional',
    expiryRequired: true,
    verificationRequired: true,
    description: 'Valid commercial transport license for drivers and mobile patrol units',
    status: 'active'
  },
  {
    id: 'doc-8',
    name: 'Prior Experience / Relieving Letter',
    code: 'DOC-EXP',
    requiredType: 'optional',
    expiryRequired: false,
    verificationRequired: false,
    description: 'Past employer work certificate or service record documentation',
    status: 'active'
  }
];
