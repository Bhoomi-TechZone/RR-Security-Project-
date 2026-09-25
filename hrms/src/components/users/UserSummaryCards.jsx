import React from 'react';
import { Users, UserCheck, UserX, ShieldCheck, AlertOctagon } from 'lucide-react';
import styles from './UserSummaryCards.module.css';

function UserSummaryCards({ users = [], roles = [], activeFilter = 'all', onCardClick }) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const inactiveUsers = users.filter(u => u.status === 'Inactive' || u.status === 'Suspended').length;
  
  // Count unique roles currently assigned to at least one user
  const assignedRoleIds = new Set(users.map(u => u.roleId));
  const assignedRolesCount = assignedRoleIds.size;

  const cards = [
    {
      id: 'all',
      title: 'Total Users',
      value: totalUsers,
      subtext: 'Registered HRMS login accounts',
      icon: Users,
      tone: 'primary',
      filterType: 'all'
    },
    {
      id: 'active',
      title: 'Active Users',
      value: activeUsers,
      subtext: 'Authorized login accounts',
      icon: UserCheck,
      tone: 'success',
      filterType: 'active'
    },
    {
      id: 'inactive',
      title: 'Inactive Users',
      value: inactiveUsers,
      subtext: `${users.filter(u => u.status === 'Suspended').length} suspended / disabled`,
      icon: UserX,
      tone: 'danger',
      filterType: 'inactive'
    },
    {
      id: 'roles',
      title: 'Assigned Roles',
      value: assignedRolesCount,
      subtext: `Across ${roles.length} total defined roles`,
      icon: ShieldCheck,
      tone: 'warning',
      filterType: 'roles'
    }
  ];

  return (
    <section className={styles.grid} aria-label="HRMS User management summary metrics">
      {cards.map(card => {
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

export default UserSummaryCards;
