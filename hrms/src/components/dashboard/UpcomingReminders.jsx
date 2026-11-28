import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, HeartPulse, Landmark, FileText, Receipt, HelpCircle,
  CalendarCheck, Cake, WalletCards, Clock, AlertTriangle
} from 'lucide-react';
import styles from './UpcomingReminders.module.css';

const iconConfigMap = {
  pf: { icon: ShieldCheck, bg: '#eff6ff', color: '#2563eb' },
  esi: { icon: HeartPulse, bg: '#fef2f2', color: '#dc2626' },
  pt: { icon: Landmark, bg: '#fff7ed', color: '#ea580c' },
  tds: { icon: FileText, bg: '#f0fdf4', color: '#16a34a' },
  it: { icon: Receipt, bg: '#faf5ff', color: '#7c3aed' },
  leave: { icon: CalendarCheck, bg: '#faf5ff', color: '#7c3aed' },
  'leave-alert': { icon: CalendarCheck, bg: '#faf5ff', color: '#7c3aed' },
  claim: { icon: Receipt, bg: '#ecfdf5', color: '#059669' },
  'claim-alert': { icon: Receipt, bg: '#ecfdf5', color: '#059669' },
  birthday: { icon: Cake, bg: '#fdf2f8', color: '#db2777' },
  'birthday-alert': { icon: Cake, bg: '#fdf2f8', color: '#db2777' },
  loan: { icon: WalletCards, bg: '#fffbeb', color: '#d97706' },
};

const urgencyClass = {
  medium: styles.tagRed,
  low: styles.tagAmber,
  safe: styles.tagGreen,
};

function UpcomingReminders({ data }) {
  const navigate = useNavigate();
  const remindersList = (Array.isArray(data) ? data : []).filter((r) => {
    const text = `${r?.id || ''} ${r?.type || ''} ${r?.label || ''}`.toLowerCase();
    return !text.includes('birthday') && !text.includes('anniversary');
  });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Alerts & Reminders</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/notifications?tab=notifications')}
          className={styles.viewAllBtn}
          title="View all notifications & compliance reminders"
        >
          View All →
        </button>
      </div>

      <div className={styles.list}>
        {remindersList.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={20} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No alerts or pending statutory reminders.</p>
          </div>
        ) : (
          <div
            className={styles.marqueeTrack}
            style={{ animationDuration: `${Math.max(10, remindersList.length * 3)}s` }}
          >
            {[...remindersList, ...remindersList].map((r, idx) => {
              const config = iconConfigMap[r.id] || iconConfigMap[r.type] || { icon: HelpCircle, bg: '#f1f5f9', color: '#64748b' };
              const Icon = config.icon;
              const displayTag = r.tagText || (r.daysLeft === 0 ? 'Today' : r.daysLeft === 1 ? 'In 1 Day' : `In ${r.daysLeft} Days`);
              const pillText =
                r.id === 'claim-alert' || r.id === 'leave-alert'
                  ? displayTag
                  : (r.date || displayTag);

              return (
                <div
                  key={`${r.id}-${idx}`}
                  className={`${styles.item} ${r.link ? styles.interactiveItem : ''}`}
                  onClick={() => r.link && navigate(r.link)}
                  role={r.link ? 'button' : undefined}
                  tabIndex={r.link ? 0 : undefined}
                  title={r.link ? `Go to ${r.label}` : r.label}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.rowIcon} style={{ color: config.color }} aria-hidden="true">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className={styles.label}>{r.label}</span>
                  </div>
                  <span className={styles.dateBadge}>
                    {pillText}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingReminders;
