import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

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
      {/* Full-screen content layer */}
      <div className="fixed inset-0 z-0">
        <Outlet />
      </div>
      
      {/* Sidebar overlay */}
      <div className="relative z-10">
        <AppSidebar language={language} onLanguageChange={setLanguage} />
      </div>
      
      {/* Sidebar trigger - fixed position */}
      <div className="fixed top-4 left-4 z-20">
        <SidebarTrigger className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 hover:bg-accent" />
      </div>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
