import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AcademyLogo from './AcademyLogo';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const LayoutContent: React.FC = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  
  // Show logo only on Home page
  const isHomePage = location.pathname === '/';
  
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
      
      {/* Mobile header with sidebar trigger and conditionally centered logo */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-20 h-16 px-4 pt-2 flex items-center">
          {/* Sidebar trigger - left aligned */}
          <SidebarTrigger className="h-8 w-8 p-1.5" />
          
          {/* Centered logo - only on Home page */}
          {isHomePage && (
            <div className="flex-1 flex justify-center">
              <AcademyLogo className="h-7" />
            </div>
          )}
        </div>
      )}
      
      {/* Desktop sidebar trigger */}
      {!isMobile && (
        <div 
          className="fixed top-4 z-20 transition-all duration-200"
          style={{ 
            left: isCollapsed ? '1rem' : 'calc(var(--sidebar-width) + 1rem)'
          }}
        >
          <SidebarTrigger />
        </div>
      )}
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
