import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Route to breadcrumb mapping
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/workshop': 'Tasks',
  '/catalog': 'Roadmap',
  '/favorites': 'Approvals',
  '/design-system': 'Design System',
};

const ProtectedLayout: React.FC = () => {
  const location = useLocation();
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'ru';
    }
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Get current page name from route
  const getCurrentPageName = () => {
    const path = location.pathname;

    // Check if it's an editor route
    if (path.startsWith('/editor/')) {
      return 'Editor';
    }

    return routeLabels[path] || 'Page';
  };

  const currentPage = getCurrentPageName();

  return (
    <SidebarProvider>
      <AppSidebar language={language} onLanguageChange={setLanguage} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Overview</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
