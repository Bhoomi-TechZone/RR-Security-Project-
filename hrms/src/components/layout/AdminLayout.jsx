import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import styles from './AdminLayout.module.css';

/**
 * AdminLayout Component
 * Framework layout wrapping navigation sidebar, top header, and scrollable content.
 */
function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle sidebar action based on viewport size
  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Mock logout action
  const handleLogout = () => {
    navigate('/login');
  };

  // Automatically close mobile drawer when window resizes to desktop view
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
      {/* Sidebar Panel */}
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        isDrawerOpen={isDrawerOpen} 
        setIsDrawerOpen={setIsDrawerOpen}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div 
        className={[
          styles.mainContainer,
          isCollapsed ? styles.sidebarCollapsed : ''
        ].filter(Boolean).join(' ')}
      >
        {/* Header Panel */}
        <AdminHeader 
          onToggleSidebar={handleToggleSidebar} 
          onLogout={handleLogout}
        />

        {/* Dynamic Content Panel */}
        <main className={styles.content}>
          <div className={styles.wrapper}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
