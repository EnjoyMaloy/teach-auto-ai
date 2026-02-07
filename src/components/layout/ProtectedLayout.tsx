import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const LayoutContent: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  return (
    <>
      {/* Full-screen content layer */}
      <div className="fixed inset-0 z-0">
        <Outlet />
      </div>
      
      {/* Sidebar trigger - positioned relative to sidebar */}
      <div 
        className="fixed top-4 z-20 transition-all duration-200"
        style={{ left: isCollapsed ? '1rem' : 'calc(var(--sidebar-width) + 1rem)' }}
      >
        <SidebarTrigger />
      </div>
    </>
  );
};

const ProtectedLayout: React.FC = () => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'ru';
    }
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <SidebarProvider>
      {/* Sidebar overlay */}
      <div className="relative z-10">
        <AppSidebar language={language} onLanguageChange={setLanguage} />
      </div>
      
      <LayoutContent />
    </SidebarProvider>
  );
};

export default ProtectedLayout;
