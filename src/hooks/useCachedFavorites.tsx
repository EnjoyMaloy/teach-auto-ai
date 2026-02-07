import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { CourseListItem, courseKeys } from './useCachedCourses';

// Fetch favorite course IDs
const fetchFavoriteIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_favorite_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(f => f.course_id);
};

// Fetch favorite courses with details
const fetchFavoriteCourses = async (userId: string, favoriteIds: string[]): Promise<CourseListItem[]> => {
  if (favoriteIds.length === 0) return [];

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      cover_image,
      author_id,
      is_published,
      category,
      estimated_minutes,
      updated_at,
      lessons:published_lessons(id)
    `)
    .in('id', favoriteIds)
    .or(`is_published.eq.true,is_link_accessible.eq.true,author_id.eq.${userId}`);

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    coverImage: c.cover_image || undefined,
    authorId: c.author_id,
    isPublished: c.is_published || false,
    category: c.category || undefined,
    lessonsCount: c.lessons?.length || 0,
    estimatedMinutes: c.estimated_minutes || 0,
    updatedAt: new Date(c.updated_at),
  }));
};

// Query keys for favorites
export const favoriteKeys = {
  ids: (userId: string) => ['favorites', 'ids', userId] as const,
  courses: (userId: string) => ['favorites', 'courses', userId] as const,
};

export const useCachedFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for favorite IDs (lightweight, always fresh)
  const idsQuery = useQuery({
    queryKey: favoriteKeys.ids(user?.id || ''),
    queryFn: () => fetchFavoriteIds(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Query for favorite courses (depends on IDs)
  const coursesQuery = useQuery({
    queryKey: favoriteKeys.courses(user?.id || ''),
    queryFn: () => fetchFavoriteCourses(user!.id, idsQuery.data || []),
    enabled: !!user && idsQuery.isSuccess && (idsQuery.data?.length || 0) > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const addMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_favorite_courses')
        .insert({ user_id: user.id, course_id: courseId });

      if (error && error.code !== '23505') throw error;
    },
    onMutate: async (courseId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids(user?.id || '') });
      const previousIds = queryClient.getQueryData<string[]>(favoriteKeys.ids(user?.id || ''));
      
      queryClient.setQueryData<string[]>(
        favoriteKeys.ids(user?.id || ''),
        old => [...(old || []), courseId]
      );

      return { previousIds };
    },
    onError: (_, __, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(user?.id || ''), context.previousIds);
      }
      toast.error('Не удалось добавить в избранное');
    },
    onSuccess: () => {
      toast.success('Добавлено в избранное');
      queryClient.invalidateQueries({ queryKey: favoriteKeys.courses(user?.id || '') });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_favorite_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onMutate: async (courseId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids(user?.id || '') });
      const previousIds = queryClient.getQueryData<string[]>(favoriteKeys.ids(user?.id || ''));
      
      queryClient.setQueryData<string[]>(
        favoriteKeys.ids(user?.id || ''),
        old => (old || []).filter(id => id !== courseId)
      );

      return { previousIds };
    },
    onError: (_, __, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(user?.id || ''), context.previousIds);
      }
      toast.error('Не удалось удалить из избранного');
    },
    onSuccess: () => {
      toast.success('Удалено из избранного');
      queryClient.invalidateQueries({ queryKey: favoriteKeys.courses(user?.id || '') });
    },
  });

  const toggleFavorite = async (courseId: string) => {
    const favoriteIds = idsQuery.data || [];
    if (favoriteIds.includes(courseId)) {
      return removeMutation.mutateAsync(courseId);
    } else {
      return addMutation.mutateAsync(courseId);
    }
  };

  const isFavorite = (courseId: string) => {
    return (idsQuery.data || []).includes(courseId);
  };

  return {
    favoriteIds: idsQuery.data || [],
    favoriteCourses: coursesQuery.data || [],
    isLoading: idsQuery.isLoading,
    isLoadingCourses: coursesQuery.isLoading || idsQuery.isLoading,
    toggleFavorite,
    isFavorite,
  };
};
