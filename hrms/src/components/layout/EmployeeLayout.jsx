import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import EmployeeHeader from './EmployeeHeader';
import EmployeeSidebar from './EmployeeSidebar';
import styles from './EmployeeLayout.module.css';

function EmployeeLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    try {
      return localStorage.getItem('novaspark_employee_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsDrawerOpen((open) => !open);
      return;
    }

    setIsCollapsed((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem('novaspark_employee_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => navigate('/login');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.layout}>
      <EmployeeSidebar
        isCollapsed={isCollapsed}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        onLogout={handleLogout}
      />

      <div className={`${styles.mainContainer} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
        <EmployeeHeader onToggleSidebar={handleToggleSidebar} onLogout={handleLogout} />
        <main className={styles.content}>
          <div className={styles.wrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
