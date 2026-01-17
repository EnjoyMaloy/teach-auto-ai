import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Moon, Sun, Globe, LogOut, User, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
interface AppHeaderProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}
const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  onThemeChange,
  language,
  onLanguageChange
}) => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    toast.success('Вы вышли из аккаунта');
    navigate('/auth');
  };
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  return <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
      {/* Search */}
      <button 
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
        style={{ 
          backgroundColor: '#F7F7F8',
          color: '#8D8D8D'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid #EBE9EA';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid transparent';
        }}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Найти курс</span>
      </button>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
              {language === 'ru' ? 'RU' : 'EN'}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onLanguageChange('ru')}>
              🇷🇺 Русский
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLanguageChange('en')}>
              🇺🇸 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} className="text-muted-foreground hover:text-foreground">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Автор курсов</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Выход
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
};
export default AppHeader;