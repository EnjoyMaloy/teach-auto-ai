import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

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
      <AppSidebar language={language} onLanguageChange={setLanguage} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
