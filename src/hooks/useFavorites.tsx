import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_favorite_courses')
      .select('course_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data.map(f => f.course_id));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(async (courseId: string) => {
    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      return false;
    }

    const { error } = await supabase
      .from('user_favorite_courses')
      .insert({ user_id: user.id, course_id: courseId });

    if (error) {
      if (error.code === '23505') {
        // Already exists
        return true;
      }
      console.error('Error adding favorite:', error);
      toast.error('Не удалось добавить в избранное');
      return false;
    }

    setFavorites(prev => [...prev, courseId]);
    toast.success('Добавлено в избранное');
    return true;
  }, [user]);

  const removeFavorite = useCallback(async (courseId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_favorite_courses')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error removing favorite:', error);
      toast.error('Не удалось удалить из избранного');
      return false;
    }

    setFavorites(prev => prev.filter(id => id !== courseId));
    toast.success('Удалено из избранного');
    return true;
  }, [user]);

  const toggleFavorite = useCallback(async (courseId: string) => {
    if (favorites.includes(courseId)) {
      return removeFavorite(courseId);
    } else {
      return addFavorite(courseId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((courseId: string) => {
    return favorites.includes(courseId);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
  };
}
