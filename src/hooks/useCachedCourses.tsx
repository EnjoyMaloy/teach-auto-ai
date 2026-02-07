import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Lightweight course type for lists (no slides data)
export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  authorId: string;
  isPublished: boolean;
  category?: string;
  lessonsCount: number;
  estimatedMinutes: number;
  updatedAt: Date;
}

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  userCourses: (userId: string) => [...courseKeys.all, 'user', userId] as const,
  published: () => [...courseKeys.all, 'published'] as const,
  favorites: (userId: string) => [...courseKeys.all, 'favorites', userId] as const,
};

// Fetch user's own courses (lightweight - for Dashboard)
const fetchUserCourses = async (userId: string): Promise<CourseListItem[]> => {
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
      lessons(id)
    `)
    .eq('author_id', userId)
    .order('updated_at', { ascending: false });

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

// Fetch published courses (for Catalog)
const fetchPublishedCourses = async (): Promise<CourseListItem[]> => {
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
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .order('published_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    coverImage: c.cover_image || undefined,
    authorId: c.author_id,
    isPublished: true,
    category: c.category || undefined,
    lessonsCount: c.lessons?.length || 0,
    estimatedMinutes: c.estimated_minutes || 0,
    updatedAt: new Date(c.updated_at),
  }));
};

// Hook for user's own courses
export const useUserCourses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: courseKeys.userCourses(user?.id || ''),
    queryFn: () => fetchUserCourses(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          author_id: user.id,
          title,
          description: '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.userCourses(user?.id || '') });
    },
    onError: () => {
      toast.error('Ошибка создания курса');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.userCourses(user?.id || '') });
    },
    onError: () => {
      toast.error('Ошибка удаления курса');
    },
  });

  return {
    courses: query.data || [],
    isLoading: query.isLoading,
    createCourse: createMutation.mutateAsync,
    deleteCourse: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

// Hook for published courses (Catalog)
export const usePublishedCourses = () => {
  const query = useQuery({
    queryKey: courseKeys.published(),
    queryFn: fetchPublishedCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    courses: query.data || [],
    isLoading: query.isLoading,
  };
};
