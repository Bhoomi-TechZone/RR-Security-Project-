// NovaSpark HRMS - Mock shift roster data.
// The generated records keep the demo compact while representing multiple sites, clients, shifts and dates.

import { mockEmployees } from './employeeData';
import { mockShiftPatterns, shiftSites } from './shiftData';

const rosterDates = ['2026-08-24', '2026-08-23', '2026-08-25'];

export const mockShiftRoster = Array.from({ length: 42 }, (_, index) => {
  const employee = mockEmployees[index % mockEmployees.length];
  const shift = mockShiftPatterns[index % 5];
  const date = rosterDates[index % rosterDates.length];
  const site = employee.site || shiftSites[index % shiftSites.length];

  return {
    id: index + 1,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    initials: employee.initials,
    clientId: employee.companyId,
    clientName: employee.companyName,
    site,
    department: employee.department,
    shiftId: shift.id,
    shiftName: shift.name,
    shiftType: shift.type,
    date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    status: index % 11 === 0 ? 'inactive' : 'active'
  };
});

export const mockUnassignedEmployees = mockEmployees.slice(12, 14).map((employee, index) => ({
  id: `unassigned-${index + 1}`,
  employeeId: employee.employeeId,
  employeeName: employee.name,
  initials: employee.initials,
  clientId: employee.companyId,
  clientName: employee.companyName,
  site: employee.site || shiftSites[index],
  department: employee.department,
  shiftId: null,
  shiftName: 'Unassigned',
  shiftType: null,
  date: '2026-08-24',
  startTime: null,
  endTime: null,
  status: 'unassigned'
}));
