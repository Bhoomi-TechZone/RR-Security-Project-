import React from 'react';
import { Shield, ShieldCheck, Users, Settings2, UserCheck, ShieldAlert } from 'lucide-react';
import styles from './RoleSummaryCards.module.css';

function RoleSummaryCards({ roles = [], users = [], onCardClick, activeFilter }) {
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.status === 'Active').length;
  const customRoles = roles.filter(r => r.type === 'custom').length;
  const assignedUsers = users.filter(u => u.status === 'Active').length;

  const cards = [
    {
      id: 'all',
      title: 'Total Roles',
      value: totalRoles,
      subtext: `${roles.filter(r => r.type === 'system').length} system, ${customRoles} custom`,
      icon: Shield,
      tone: 'primary',
      filterType: 'all'
    },
    {
      id: 'active',
      title: 'Active Roles',
      value: activeRoles,
      subtext: `${totalRoles - activeRoles} inactive roles`,
      icon: ShieldCheck,
      tone: 'success',
      filterType: 'active'
    },
    {
      id: 'users',
      title: 'Assigned Users',
      value: assignedUsers,
      subtext: `${users.length} total users in directory`,
      icon: Users,
      tone: 'info',
      filterType: 'users'
    },
    {
      id: 'custom',
      title: 'Custom Roles',
      value: customRoles,
      subtext: 'Configurable access profiles',
      icon: Settings2,
      tone: 'warning',
      filterType: 'custom'
    }
  ];

  return (
    <section className={styles.grid} aria-label="Role and permission summary metrics">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.filterType;

        return (
          <article
            key={card.id}
            className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
            onClick={() => onCardClick && onCardClick(card.filterType)}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick && onCardClick(card.filterType);
              }
            }}
          >
            <div className={styles.cardContent}>
              <span className={styles.title}>{card.title}</span>
              <strong className={styles.value}>{card.value}</strong>
              <span className={styles.subtext}>{card.subtext}</span>
            </div>
            <div className={`${styles.iconWrap} ${styles[card.tone]}`}>
              <Icon size={22} strokeWidth={2} />
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default RoleSummaryCards;
