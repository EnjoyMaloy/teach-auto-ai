import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import AcademyLogo from './AcademyLogo';
import AnimatedBackground from './AnimatedBackground';

const LayoutContent: React.FC = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  const isHomePage = location.pathname === '/';
  
  // On mobile, no offset needed (sidebar is overlay)
  const sidebarOffset = isMobile ? '0px' : (isCollapsed ? '0px' : 'var(--sidebar-width)');
  
  return (
    <>
      {/* Persistent background - never unmounts during navigation */}
      <div className="fixed inset-0 z-0 bg-background dark:bg-[#0f0f12] pointer-events-none">
        <AnimatedBackground />
      </div>
      
      {/* Scrollable content layer - fixed but with overflow for scrolling */}
      <div 
        className="fixed inset-0 z-0 overflow-auto transition-[left] duration-200"
        style={{ 
          left: sidebarOffset,
          '--sidebar-offset': sidebarOffset,
        } as React.CSSProperties}
      >
        <Outlet />
      </div>
      
      {/* Mobile header - only on mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-4">
          <SidebarTrigger className="h-9 w-9 [&_svg]:size-5" />
          {isHomePage && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <AcademyLogo className="h-7" />
            </div>
          )}
          <div className="w-9" /> {/* Spacer for balance */}
        </div>
      )}
      
      {/* Desktop sidebar trigger - only when collapsed (anchored bottom-left, matches expanded footer) */}
      {!isMobile && isCollapsed && (
        <div 
          className="fixed bottom-4 z-20"
          style={{ left: '1rem' }}
        >
          <SidebarTrigger className="!h-9 !w-9 rounded-md text-muted-foreground hover:bg-transparent hover:text-[hsl(265,60%,75%)] [&_svg]:!size-[1.4375rem]" />
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
