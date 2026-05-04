import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const fetchIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_favorite_articles')
    .select('article_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((r) => r.article_id);
};

export const useFavoriteArticles = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['favorite-articles', user?.id || ''];

  const idsQuery = useQuery({
    queryKey: key,
    queryFn: () => fetchIds(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const ids = new Set(idsQuery.data || []);

  const mutation = useMutation({
    mutationFn: async (articleId: string) => {
      if (!user) throw new Error('Not authenticated');
      if (ids.has(articleId)) {
        const { error } = await supabase
          .from('user_favorite_articles')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
        if (error) throw error;
        return { added: false };
      } else {
        const { error } = await supabase
          .from('user_favorite_articles')
          .insert({ user_id: user.id, article_id: articleId });
        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: key });
      toast.success(res.added ? 'Добавлено в избранное' : 'Удалено из избранного');
    },
    onError: () => toast.error('Не удалось обновить избранное'),
  });

  return {
    isFavorite: (id: string) => ids.has(id),
    toggleFavorite: (id: string) => mutation.mutate(id),
  };
};
