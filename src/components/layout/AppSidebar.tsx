import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Compass,
  Crown,
  Folder,
  Globe,
  Home,
  LogOut,
  Moon,
  Settings,
  Star,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pavelAvatar from '@/assets/pavel-avatar.jpg';
import AcademyLogo from './AcademyLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RecentCourse {
  id: string;
  title: string;
}

interface AppSidebarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const { setOpenMobile, isMobile } = useSidebar();

  const userName = 'Pavel';
  const userEmail = user?.email || 'pavel@example.com';
  const isAdmin = user?.email === 'trupcgames@gmail.com' || user?.email === 'vazhenka.hello@gmail.com';

  // Fetch recent courses
  useEffect(() => {
    const fetchRecentCourses = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, updated_at')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentCourses(data.map((c) => ({ id: c.id, title: c.title })));
      }
    };

    fetchRecentCourses();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Вы вышли из аккаунта');
    navigate('/auth');
  };

  // Auto-close sidebar on navigation (mobile only)
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isEditorRoute = (courseId: string) => location.pathname === `/editor/${courseId}`;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const languages = [
    { code: 'ru' as const, label: 'Russian' },
    { code: 'en' as const, label: 'English' },
  ];

  // Extended languages for UI display (actual i18n only supports ru/en)
  const displayLanguages = [
    { code: 'ru', label: 'Russian' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <Sidebar variant="floating">
      {/* Header — Logo */}
      <SidebarHeader className="p-4">
        <AcademyLogo className="h-6" />
      </SidebarHeader>

      <SidebarContent>
        {/* Profile with Dropdown */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={pavelAvatar} alt={userName} />
                      <AvatarFallback className="rounded-lg">
                        {userName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  {/* Plan & Credits Block */}
                  <DropdownMenuItem
                    className="p-0 focus:bg-transparent"
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                      navigate('/pricing');
                    }}
                  >
                    <div className="w-full px-2 py-2">
                      <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-[hsl(265_60%_75%_/_0.15)] hover:bg-[hsl(265_60%_75%_/_0.25)] transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[hsl(265_60%_75%_/_0.25)]">
                          <Crown className="size-4 text-[hsl(265_60%_75%)]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[hsl(265_60%_75%)]">Creator Pro</div>
                          <div className="text-xs text-muted-foreground">Безлимитный тариф</div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                    <BadgeCheck className="mr-2 size-4" />
                    Аккаунт
                    <span className="ml-auto text-[10px] text-muted-foreground">Скоро</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                    <Bell className="mr-2 size-4" />
                    Уведомления
                    <span className="ml-auto text-[10px] text-muted-foreground">Скоро</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                    <Settings className="mr-2 size-4" />
                    Настройки
                    <span className="ml-auto text-[10px] text-muted-foreground">Скоро</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" />
                    Выход
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Home */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive('/')}
                onClick={() => handleNavigate('/')}
              >
                <Home className="size-4" />
                <span>Главная</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <SidebarGroupLabel>Мои курсы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Recent — Collapsible */}
              <Collapsible
                defaultOpen={recentCourses.some((c) => isEditorRoute(c.id))}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Clock className="size-4" />
                      <span>Недавние</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {recentCourses.length > 0 ? (
                        recentCourses.map((course) => (
                          <SidebarMenuSubItem key={course.id}>
                            <SidebarMenuSubButton
                              isActive={isEditorRoute(course.id)}
                              onClick={() => handleNavigate(`/editor/${course.id}`)}
                            >
                              {course.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <span className="text-muted-foreground">Нет курсов</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* All Courses */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/workshop')}
                  onClick={() => handleNavigate('/workshop')}
                >
                  <Folder className="size-4" />
                  <span>Все курсы</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Favorites */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/favorites')}
                  onClick={() => handleNavigate('/favorites')}
                >
                  <Star className="size-4" />
                  <span>Избранное</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel>Ресурсы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/catalog')}
                  onClick={() => handleNavigate('/catalog')}
                >
                  <Compass className="size-4" />
                  <span>Исследовать</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <Building2 className="size-4" />
                  <span>Академии</span>
                  <span className="ml-auto text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">скоро</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — Language & Theme */}
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3 text-muted-foreground hover:text-foreground gap-2"
              >
                <Globe className="size-4" />
                Язык
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              {displayLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => {
                    // Only ru/en are actually supported in i18n
                    if (lang.code === 'ru' || lang.code === 'en') {
                      setLanguage(lang.code);
                    }
                  }}
                  className={lang.code !== 'ru' && lang.code !== 'en' ? 'opacity-50' : ''}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9 text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </SidebarFooter>

      
    </Sidebar>
  );
};

export default AppSidebar;
