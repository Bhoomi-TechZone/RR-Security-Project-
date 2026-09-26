import React from 'react';
import { 
  Landmark, Briefcase, Layers, Award, UserCheck, 
  MapPin, Shield, CalendarDays, CalendarOff, CalendarHeart, 
  DollarSign, FileCheck 
} from 'lucide-react';
import styles from './MastersTabs.module.css';

const TABS = [
  { id: 'banks', label: 'Banks', icon: Landmark },
  { id: 'clients', label: 'Clients', icon: Briefcase },
  { id: 'departments', label: 'Departments', icon: Layers },
  { id: 'designations', label: 'Designations', icon: Award },
  { id: 'employee-types', label: 'Employee Types', icon: UserCheck },
  { id: 'sites', label: 'Sites', icon: MapPin },
  { id: 'posts', label: 'Posts', icon: Shield },
  { id: 'shifts', label: 'Shifts', icon: CalendarDays },
  { id: 'leave-types', label: 'Leave Types', icon: CalendarOff },
  { id: 'holidays', label: 'Holidays', icon: CalendarHeart },
  { id: 'salary-components', label: 'Salary Components', icon: DollarSign },
  { id: 'document-types', label: 'Document Types', icon: FileCheck }
];

function MastersTabs({ activeTab, onTabChange, isFromOrgSettings }) {
  const displayTabs = TABS.filter(tab => tab.id === activeTab);

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabsList} role="tablist" aria-label="System Masters Tabs">
        {displayTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={true}
              className={`${styles.tabBtn} ${styles.tabActive}`}
              style={{ cursor: 'default' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MastersTabs;
