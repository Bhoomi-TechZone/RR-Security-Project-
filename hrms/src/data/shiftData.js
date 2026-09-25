// NovaSpark HRMS - Mock shift configuration data.
// Replace with API calls when backend is ready.

export const mockShiftPatterns = [
  {
    id: 1,
    name: 'Morning Shift',
    type: 'day',
    startTime: '06:00',
    endTime: '14:00',
    gracePeriod: 15,
    breakDuration: 30,
    status: 'active',
    description: 'Morning security shift for main gate operations.'
  },
  {
    id: 2,
    name: 'Night Shift',
    type: 'night',
    startTime: '22:00',
    endTime: '06:00',
    gracePeriod: 15,
    breakDuration: 30,
    status: 'active',
    description: 'Night security and facility monitoring shift.'
  },
  {
    id: 3,
    name: 'General Shift',
    type: 'day',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriod: 15,
    breakDuration: 60,
    status: 'active',
    description: 'General office and administration shift.'
  },
  {
    id: 4,
    name: 'Evening Shift',
    type: 'day',
    startTime: '14:00',
    endTime: '22:00',
    gracePeriod: 15,
    breakDuration: 30,
    status: 'active',
    description: 'Evening operations and site support shift.'
  },
  {
    id: 5,
    name: 'Rotational Shift',
    type: 'rotational',
    startTime: null,
    endTime: null,
    gracePeriod: 15,
    breakDuration: 30,
    status: 'active',
    description: 'Rotational workforce schedule.'
  }
];

export const shiftSites = ['Main Gate', 'Warehouse', 'Office Building', 'Hospital Block', 'Parking Area'];
export const shiftDepartments = ['Security', 'Operations', 'Administration', 'HR', 'Accounts', 'Housekeeping'];
