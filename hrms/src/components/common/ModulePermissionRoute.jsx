import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';
import styles from './ModulePermissionRoute.module.css';

/**
 * ModulePermissionRoute Component
 * Wraps page elements to ensure only authorized users with 'view' permission for the module can view it.
 */
function ModulePermissionRoute({ moduleKey, moduleTitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isAdmin, userRole } = usePermissions();

  if (isAdmin || !moduleKey || hasPermission(moduleKey, 'view')) {
    return <>{children}</>;
  }

  const dashboardPath = location.pathname.startsWith('/user') ? '/user/dashboard' : '/admin/dashboard';

  return (
    <div className={styles.restrictedContainer}>
      <div className={styles.restrictedCard}>
        <div className={styles.iconCircle}>
          <ShieldAlert size={36} className={styles.alertIcon} />
        </div>
        
        <div className={styles.badge}>
          <Lock size={12} />
          <span>Access Restricted</span>
        </div>

        <h2 className={styles.title}>Module Permission Required</h2>
        <p className={styles.description}>
          Your assigned role (<strong>{userRole}</strong>) does not currently have permission to access the{' '}
          <strong>{moduleTitle || moduleKey}</strong> module.
        </p>

        <p className={styles.subtext}>
          Please contact your System Administrator to request access to this module.
        </p>

        <div className={styles.actions}>
          <button 
            type="button" 
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          
          <button 
            type="button" 
            className={styles.primaryBtn}
            onClick={() => navigate(dashboardPath)}
          >
            <LayoutDashboard size={16} />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModulePermissionRoute;
