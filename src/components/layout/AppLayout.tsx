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
    <div className="min-h-screen bg-[#0a0a0b]">
      <AppSidebar language={language} onLanguageChange={setLanguage} />
      <div className="ml-64">
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
