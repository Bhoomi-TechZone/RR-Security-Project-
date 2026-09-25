// NovaSpark HRMS — Mock Shift Master Data
// Standard shift master configurations

export const mockShiftMaster = [
  {
    id: 'shift-1',
    name: 'Morning Shift',
    code: 'MORN',
    startTime: '06:00',
    endTime: '14:00',
    breakDuration: 30,
    description: 'First shift of the day for morning gate operations and perimeter checks',
    status: 'active'
  },
  {
    id: 'shift-2',
    name: 'Evening Shift',
    code: 'EVE',
    startTime: '14:00',
    endTime: '22:00',
    breakDuration: 30,
    description: 'Second shift covering peak evening visitors and closing activities',
    status: 'active'
  },
  {
    id: 'shift-3',
    name: 'Night Shift',
    code: 'NGT',
    startTime: '22:00',
    endTime: '06:00',
    breakDuration: 30,
    description: 'Overnight facility lockdown and night security patrol shift',
    status: 'active'
  },
  {
    id: 'shift-4',
    name: 'General Shift',
    code: 'GEN',
    startTime: '09:00',
    endTime: '18:00',
    breakDuration: 60,
    description: 'Regular office, administrative and operational day shift',
    status: 'active'
  },
  {
    id: 'shift-5',
    name: 'Relief Shift',
    code: 'RELIEF',
    startTime: '10:00',
    endTime: '19:00',
    breakDuration: 45,
    description: 'Operational relief shift during employee handovers or leaves',
    status: 'active'
  }
];
