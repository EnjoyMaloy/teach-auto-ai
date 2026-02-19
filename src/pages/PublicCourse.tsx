import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CoursePlayerV2 } from '@/components/runtime/CoursePlayerV2';

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
      };
    };
  }
}

const PublicCourse: React.FC = () => {
  const { courseId } = useParams();
  
  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand?.();
      tg.disableVerticalSwipes?.();
    }
    
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

  // Fullscreen player - skip map, go directly to first lesson
  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        height: '100dvh',
        width: '100dvw',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <CoursePlayerV2 
        courseId={courseId} 
        mode="published" 
        skipMap={false}
      />
    </div>
  );
};

export default PublicCourse;
