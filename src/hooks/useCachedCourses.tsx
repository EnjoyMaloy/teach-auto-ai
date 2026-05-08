import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

// Lightweight course type for lists (no slides data)
export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  authorId: string;
  isPublished: boolean;
  isLinkAccessible?: boolean;
  category?: string;
  lessonsCount: number;
  estimatedMinutes: number;
  updatedAt: Date;
}

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  userCourses: (userId: string, teamId: string | null) => [...courseKeys.all, 'user', userId, teamId ?? 'personal'] as const,
  published: () => [...courseKeys.all, 'published'] as const,
  favorites: (userId: string) => [...courseKeys.all, 'favorites', userId] as const,
};

// Fetch courses for current workspace (personal => null team_id, team => team_id)
const fetchUserCourses = async (userId: string, teamId: string | null): Promise<CourseListItem[]> => {
  let query = supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      cover_image,
      author_id,
      team_id,
      is_published,
      is_link_accessible,
      category,
      estimated_minutes,
      updated_at,
      lessons(id)
    `)
    .order('updated_at', { ascending: false });

  if (teamId) {
    query = query.eq('team_id', teamId);
  } else {
    query = query.eq('author_id', userId).is('team_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    coverImage: c.cover_image || undefined,
    authorId: c.author_id,
    isPublished: c.is_published || false,
    isLinkAccessible: c.is_link_accessible || false,
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
  const { currentTeamId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: courseKeys.userCourses(user?.id || '', currentTeamId),
    queryFn: () => fetchUserCourses(user!.id, currentTeamId),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('courses')
        .insert({
          author_id: user.id,
          team_id: currentTeamId,
          title,
          description: '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.userCourses(user?.id || '', currentTeamId) });
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
      queryClient.invalidateQueries({ queryKey: courseKeys.userCourses(user?.id || '', currentTeamId) });
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
