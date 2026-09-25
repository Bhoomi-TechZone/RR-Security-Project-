import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ClientHeader from './ClientHeader';
import ClientSidebar from './ClientSidebar';
import styles from './ClientLayout.module.css';
import { ClientAuthProvider } from '../../context/ClientAuthContext';

function ClientLayoutContent() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsDrawerOpen((open) => !open);
      return;
    }
    setIsCollapsed((collapsed) => !collapsed);
  };

  const handleLogout = () => {
    navigate('/login');
  };

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
      <ClientSidebar
        isCollapsed={isCollapsed}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        onLogout={handleLogout}
      />

      <div
        className={`${styles.mainContainer} ${
          isCollapsed ? styles.sidebarCollapsed : ''
        }`}
      >
        <ClientHeader
          onToggleSidebar={handleToggleSidebar}
          onLogout={handleLogout}
        />

        <main className={styles.content}>
          <div className={styles.wrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function ClientLayout() {
  return (
    <ClientAuthProvider>
      <ClientLayoutContent />
    </ClientAuthProvider>
  );
}

export default ClientLayout;
