import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Short URL handler for Telegram Mini Apps
 * Accepts a short course ID (first 8 chars of UUID) and redirects to full course
 */
const ShortCourse: React.FC = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findCourse = async () => {
      if (!shortId) {
        setError('ID не указан');
        return;
      }

      try {
        // Query courses where ID starts with the short ID (cast UUID to text for LIKE)
        const { data, error: queryError } = await supabase
          .from('courses')
          .select('id, is_link_accessible, is_published')
          .filter('id::text', 'ilike', `${shortId}%`)
          .limit(1)
          .single();

        if (queryError || !data) {
          console.error('Course not found for shortId:', shortId);
          setError('Курс не найден');
          return;
        }

        // Redirect to full course URL
        navigate(`/course/${data.id}`, { replace: true });
      } catch (err) {
        console.error('Error finding course:', err);
        setError('Ошибка поиска курса');
      }
    };

    findCourse();
  }, [shortId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive">{error}</p>
        <p className="text-muted-foreground text-sm">shortId: {shortId}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Загрузка...</p>
    </div>
  );
};

export default ShortCourse;
