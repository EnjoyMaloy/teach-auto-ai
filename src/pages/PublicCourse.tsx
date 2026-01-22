import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimplePlayer } from '@/components/runtime/SimplePlayer';

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        isExpanded?: boolean;
        initData?: string;
        initDataUnsafe?: {
          start_param?: string;
        };
        requestFullscreen?: () => void;
        disableVerticalSwipes?: () => void;
      };
    };
  }
}

const PublicCourse: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Detect if running inside Telegram Mini App
  const isTelegram = !!window.Telegram?.WebApp;

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      
      // Expand to full height
      if (tg.expand) {
        tg.expand();
      }
      
      // Disable vertical swipes to prevent accidental closing
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
    }
    
    // Prevent overscroll on iOS
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  // Validate courseId
  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">ID курса не указан</p>
      </div>
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(courseId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Неверный формат ID курса</p>
      </div>
    );
  }

  // For Telegram: fullscreen with safe areas
  if (isTelegram) {
    return (
      <div 
        className="fixed inset-0 overflow-hidden tg-fullscreen tg-no-bounce"
        style={{ 
          background: 'var(--tg-theme-bg-color, white)',
          height: '100dvh',
          width: '100dvw',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <SimplePlayer 
          courseId={courseId} 
          onClose={() => navigate('/')} 
        />
      </div>
    );
  }

  // Mobile web: fullscreen
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{ 
          background: 'white',
          height: '100dvh',
          width: '100vw',
        }}
      >
        <SimplePlayer 
          courseId={courseId} 
          onClose={() => navigate('/')} 
        />
      </div>
    );
  }

  // Desktop: phone frame centered on screen
  return (
    <div className="fixed inset-0 bg-muted/80 flex items-center justify-center p-4">
      <div 
        className="h-[calc(100vh-80px)] w-[calc((100vh-80px)*9/16)] max-w-[420px] rounded-[2.5rem] overflow-hidden border-4 border-foreground/10 shadow-2xl bg-background"
      >
        <SimplePlayer 
          courseId={courseId} 
          onClose={() => navigate('/')} 
        />
      </div>
    </div>
  );
};

export default PublicCourse;
