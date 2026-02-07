import React, { useState, useEffect } from 'react';
import AppSidebar from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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
    <div className="min-h-screen bg-[#0f0f10]">
      <AppSidebar language={language} onLanguageChange={setLanguage} />
      <main className="ml-64 min-h-screen">
        <div className="px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
