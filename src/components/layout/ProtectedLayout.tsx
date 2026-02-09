import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const LayoutContent: React.FC = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === 'collapsed';
  
  // On mobile, no offset needed (sidebar is overlay)
  const sidebarOffset = isMobile ? '0px' : (isCollapsed ? '0px' : 'var(--sidebar-width)');
  
  return (
    <>
      {/* Full-screen content layer - background fills entire screen */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          // Pass sidebar offset as CSS variable for pages to use for centering
          '--sidebar-offset': sidebarOffset,
        } as React.CSSProperties}
      >
        <Outlet />
      </div>
      
      {/* Sidebar trigger - positioned relative to sidebar */}
      <div 
        className="fixed top-4 z-20 transition-all duration-200"
        style={{ 
          left: isMobile ? '1rem' : (isCollapsed ? '1rem' : 'calc(var(--sidebar-width) + 1rem)')
        }}
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
