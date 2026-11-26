import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Plane,
  Coins,
  Timer,
  CalendarClock,
  Landmark,
  Receipt,
  Calculator,
  Package,
  Shirt,
  FileSignature,
  MapPin,
  UserMinus,
  CalendarRange,
  CalendarCheck2,
  CreditCard,
  Clock4
} from 'lucide-react';
import { REQUEST_CATEGORIES, getStoredHubRequests } from '../../data/requestHubData';
import styles from './OpenRequests.module.css';

const CATEGORY_META = {
  'attendance-correction': { icon: RotateCcw, color: '#e11d48' },
  leaves: { icon: Plane, color: '#7c3aed' },
  'leave-encashment': { icon: Coins, color: '#0d9488' },
  overtime: { icon: Timer, color: '#0ea5e9' },
  'shift-change': { icon: CalendarClock, color: '#6366f1' },
  loans: { icon: Landmark, color: '#d97706' },
  reimbursement: { icon: Receipt, color: '#059669' },
  'it-declaration': { icon: Calculator, color: '#2563eb' },
  'asset-requisition': { icon: Package, color: '#16a34a' },
  uniform: { icon: Shirt, color: '#2563eb' },
  'letter-request': { icon: FileSignature, color: '#6b1d45' },
  'transfer-request': { icon: MapPin, color: '#0891b2' },
  resignation: { icon: UserMinus, color: '#dc2626' },
  'week-off-change': { icon: CalendarRange, color: '#4f46e5' },
  'comp-off': { icon: CalendarCheck2, color: '#16a34a' },
  'bank-change': { icon: CreditCard, color: '#9333ea' },
  'time-relaxation': { icon: Clock4, color: '#d97706' }
};

function OpenRequests({
  counts = null,
  openRequests = [],
  fallbackActivities = [],
  quickInsights = null,
  loading = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserPanel = location.pathname.startsWith('/user');
  const requestsHubPath = isUserPanel
    ? '/user/hr-management/requests'
    : '/admin/hr-management/requests';

  const [hubRequests, setHubRequests] = useState(() => getStoredHubRequests());

  useEffect(() => {
    const syncHub = () => setHubRequests(getStoredHubRequests());
    window.addEventListener('storage', syncHub);
    window.addEventListener('novaspark:hub-requests-updated', syncHub);
    return () => {
      window.removeEventListener('storage', syncHub);
      window.removeEventListener('novaspark:hub-requests-updated', syncHub);
    };
  }, []);

  // Compute live per-category pending counts (merges backend counts with Request Hub pending counts)
  const resolvedCounts = useMemo(() => {
    const hubCounts = {};
    hubRequests.forEach((req) => {
      if (req.status === 'Pending') {
        hubCounts[req.categoryId] = (hubCounts[req.categoryId] || 0) + 1;
      }
    });

    if (counts && typeof counts === 'object') {
      const merged = { ...hubCounts };
      Object.entries(counts).forEach(([key, val]) => {
        const num = Number(val) || 0;
        merged[key] = num > 0 ? num : (hubCounts[key] || 0);
      });
      return merged;
    }

    const derived = {
      ...hubCounts,
      leaves: Math.max(Number(quickInsights?.leaveRequests) || 0, hubCounts.leaves || 0),
    };

    const sourceList = Array.isArray(openRequests) && openRequests.length > 0
      ? openRequests
      : fallbackActivities;

    (sourceList || []).forEach((item) => {
      if (!item) return;
      const tag = String(item.tag || '').toLowerCase();
      if (item.type === 'employee' || ['approved', 'rejected', 'new joiner', 'assigned'].includes(tag)) {
        return;
      }
      if (item.type === 'reimbursement') derived.reimbursement += 1;
      else if (item.type === 'loan') derived.loans += 1;
      else if (item.type === 'asset') derived['asset-requisition'] += 1;
      else if (item.type === 'uniform') derived.uniform += 1;
      else if (item.type === 'inventory') {
        const msg = String(item.message || '').toLowerCase();
        if (msg.includes('shirt') || msg.includes('pant') || msg.includes('uniform') || msg.includes('shoe') || msg.includes('cap')) {
          derived.uniform += 1;
        } else {
          derived['asset-requisition'] += 1;
        }
      }
    });

    if (!derived.reimbursement && Number(quickInsights?.pendingClaims) > 0 && !derived.loans) {
      derived.reimbursement = Number(quickInsights.pendingClaims) || 0;
    }

    return derived;
  }, [counts, hubRequests, openRequests, fallbackActivities, quickInsights]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        </div>
        <div className={styles.list}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className={styles.skeletonRow}>
              <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              <div className={`${styles.skeleton} ${styles.skeletonBadge}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Open Requests</h3>
        <button
          type="button"
          onClick={() => navigate(requestsHubPath)}
          className={styles.viewAllBtn}
          title="Open Requests Hub"
        >
          View All →
        </button>
      </div>

      <div className={styles.list}>
        {REQUEST_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat.id] || { icon: FileSignature, color: '#64748b' };
          const Icon = meta.icon;
          const count = Number(resolvedCounts?.[cat.id]) || 0;

          return (
            <button
              key={cat.id}
              type="button"
              className={styles.row}
              onClick={() => navigate(`${requestsHubPath}/${cat.id}`)}
              title={cat.description}
            >
              <span className={styles.rowLeft}>
                <span className={styles.rowIcon} style={{ color: meta.color }} aria-hidden="true">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span className={styles.rowLabel}>{cat.title}</span>
              </span>
              <span className={count > 0 ? styles.countBadgeActive : styles.countBadgeZero}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default OpenRequests;
