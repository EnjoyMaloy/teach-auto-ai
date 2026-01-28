import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'creator';

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('creator'); // Default to creator
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          setRole('creator'); // No role found, default to creator
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('creator');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isAdmin: role === 'admin',
    isLoading,
  };
};
