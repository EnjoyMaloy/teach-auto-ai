import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, ChevronDown, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AppHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  language,
  onLanguageChange
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(data?.role || null);
    };
    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'ru' ? 'Вы вышли из аккаунта' : 'You have been signed out');
    navigate('/auth');
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const isModerator = userRole === 'moderator' || userRole === 'admin';

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background my-0 py-[40px]">
      {/* Search */}
      <button className="flex items-center gap-2.5 rounded-[5px] transition-all border border-transparent hover:border-border py-[16px] bg-muted text-muted-foreground px-[90px]">
        <Search className="w-[18px] h-[18px]" />
        <span className="text-[15px]">{language === 'ru' ? 'Найти курс' : 'Find course'}</span>
      </button>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-[5px] border border-border bg-background hover:border-border/80 transition-all py-[10px] px-[16px]">
              <span className="text-[16px]">{language === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
              <span className="text-[14px] text-muted-foreground font-medium">{language === 'ru' ? 'RU' : 'EN'}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={() => onLanguageChange('ru')} className="gap-2">
              <span className="text-[16px]">🇷🇺</span>
              <span>Русский</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLanguageChange('en')} className="gap-2">
              <span className="text-[16px]">🇬🇧</span>
              <span>English</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20">
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="w-4 h-4" />
              {language === 'ru' ? 'Профиль' : 'Profile'}
            </DropdownMenuItem>
            {isModerator && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer text-purple-600 focus:text-purple-700"
                  onClick={() => navigate('/moderation')}
                >
                  <Shield className="w-4 h-4" />
                  {language === 'ru' ? 'Модерация' : 'Moderation'}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />
              {language === 'ru' ? 'Выход' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;