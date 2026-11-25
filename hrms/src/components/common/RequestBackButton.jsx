import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './RequestBackButton.module.css';

/**
 * Renders a Back icon button ONLY when the user navigated to the page
 * from a Request Hub card (via location.state.fromRequestsHub === true).
 */
export default function RequestBackButton({ fallbackPath }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state?.fromRequestsHub) {
    return null;
  }

  const defaultBack = location.pathname.startsWith('/employee')
    ? '/employee/requests'
    : location.pathname.startsWith('/user')
    ? '/user/hr-management/requests'
    : '/admin/hr-management/requests';

  const target = location.state.backTo || fallbackPath || defaultBack;

  return (
    <button
      type="button"
      className={styles.backIconBtn}
      onClick={() => navigate(target)}
      title="Back to Requests"
      aria-label="Back to Requests"
    >
      <ArrowLeft size={18} strokeWidth={2.2} />
    </button>
  );
}
