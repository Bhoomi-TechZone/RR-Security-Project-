import React from 'react';
import { ShieldCheck, HeartPulse, Landmark, FileText, Receipt, HelpCircle } from 'lucide-react';
import styles from './UpcomingReminders.module.css';
import { upcomingRemindersData } from '../../data/dashboardData';

const iconConfigMap = {
  pf: { icon: ShieldCheck, bg: '#eff6ff', color: '#2563eb' },
  esi: { icon: HeartPulse, bg: '#fef2f2', color: '#dc2626' },
  pt: { icon: Landmark, bg: '#fff7ed', color: '#ea580c' },
  tds: { icon: FileText, bg: '#f0fdf4', color: '#16a34a' },
  it: { icon: Receipt, bg: '#faf5ff', color: '#7c3aed' },
};

const urgencyClass = {
  medium: styles.tagRed,
  low: styles.tagAmber,
  safe: styles.tagGreen,
};

function UpcomingReminders({ data }) {
  const remindersList = data || upcomingRemindersData || [];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Alerts & Reminders</h3>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.viewAll}>
          View All →
        </a>
      </div>

      <div className={styles.list}>
        {remindersList.map((r) => {
          const config = iconConfigMap[r.id] || { icon: HelpCircle, bg: '#f1f5f9', color: '#64748b' };
          const Icon = config.icon;
          return (
            <div key={r.id} className={styles.item}>
              <div className={styles.iconWrap} style={{ backgroundColor: config.bg }}>
                <Icon size={16} color={config.color} strokeWidth={2} />
              </div>
              <div className={styles.meta}>
                <span className={styles.label}>{r.label}</span>
                <span className={styles.date}>{r.date}</span>
              </div>
              <span className={`${styles.tag} ${urgencyClass[r.urgency]}`}>
                In {r.daysLeft} Days
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UpcomingReminders;
