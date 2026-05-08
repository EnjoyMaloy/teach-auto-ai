import React, { useState, useEffect, useCallback } from 'react';
import { PanelLeftClose } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  FileText,
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
import { useWorkspace } from '@/hooks/useWorkspace';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { courseKeys } from '@/hooks/useCachedCourses';
import { favoriteKeys } from '@/hooks/useCachedFavorites';
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
  SidebarTrigger,
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
  
  const { language, setLanguage } = useLanguage();
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const { setOpenMobile, isMobile } = useSidebar();
  const queryClient = useQueryClient();
  const { teams, currentTeamId, currentTeam, setCurrentTeamId } = useWorkspace();

  // Prefetch data on hover for instant page switches
  const prefetchWorkshop = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: courseKeys.userCourses(user.id, currentTeamId),
      queryFn: async () => {
        let q = supabase
          .from('courses')
          .select('id, title, description, cover_image, author_id, team_id, is_published, category, estimated_minutes, updated_at, lessons(id)')
          .order('updated_at', { ascending: false });
        if (currentTeamId) q = q.eq('team_id', currentTeamId);
        else q = q.eq('author_id', user.id).is('team_id', null);
        const { data } = await q;
        return (data || []).map((c: any) => ({
          id: c.id, title: c.title, description: c.description || '',
          coverImage: c.cover_image || undefined, authorId: c.author_id,
          isPublished: c.is_published || false, category: c.category || undefined,
          lessonsCount: c.lessons?.length || 0, estimatedMinutes: c.estimated_minutes || 0,
          updatedAt: new Date(c.updated_at),
        }));
      },
      staleTime: 1000 * 60 * 2,
    });
  }, [user, queryClient, currentTeamId]);

  const prefetchCatalog = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.published(),
      queryFn: async () => {
        const { data } = await supabase
          .from('courses')
          .select('id, title, description, cover_image, author_id, is_published, category, estimated_minutes, updated_at, lessons:published_lessons(id)')
          .eq('is_published', true)
          .order('published_at', { ascending: false });
        return (data || []).map((c: any) => ({
          id: c.id, title: c.title, description: c.description || '',
          coverImage: c.cover_image || undefined, authorId: c.author_id,
          isPublished: true, category: c.category || undefined,
          lessonsCount: c.lessons?.length || 0, estimatedMinutes: c.estimated_minutes || 0,
          updatedAt: new Date(c.updated_at),
        }));
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchFavorites = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: favoriteKeys.ids(user.id),
      queryFn: async () => {
        const { data } = await supabase
          .from('user_favorite_courses')
          .select('course_id')
          .eq('user_id', user.id);
        return (data || []).map((f: any) => f.course_id);
      },
      staleTime: 1000 * 60 * 2,
    });
  }, [user, queryClient]);

  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null }>({ name: null, avatar_url: null });
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const userName = profile.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userAvatarUrl = profile.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userEmail = user?.email || '';

  // Fetch recent courses
  useEffect(() => {
    const fetchRecentCourses = async () => {
      if (!user) return;
      let q = supabase
        .from('courses')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3);
      if (currentTeamId) q = q.eq('team_id', currentTeamId);
      else q = q.eq('author_id', user.id).is('team_id', null);
      const { data, error } = await q;
      if (!error && data) {
        setRecentCourses(data.map((c) => ({ id: c.id, title: c.title })));
      }
    };

    fetchRecentCourses();
  }, [user, currentTeamId]);

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
      <SidebarHeader className="px-4 pt-7 pb-4 flex flex-row items-center justify-between">
        <AcademyLogo className="h-4" />
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
                      {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                      <AvatarFallback className="rounded-lg">
                        {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
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

        {/* Workspace Switcher */}
        <SidebarGroup>
          <SidebarGroupLabel>Пространство</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <Users className="size-4" />
                      <span className="truncate">{currentTeam ? currentTeam.name : 'Личное пространство'}</span>
                      <ChevronsUpDown className="ml-auto size-3.5 opacity-60" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-56">
                    <DropdownMenuItem onClick={() => setCurrentTeamId(null)}>
                      <Home className="mr-2 size-4" />
                      <span>Личное пространство</span>
                      {!currentTeamId && <span className="ml-auto text-[10px] text-primary">●</span>}
                    </DropdownMenuItem>
                    {teams.length > 0 && <DropdownMenuSeparator />}
                    {teams.map((t) => (
                      <DropdownMenuItem key={t.id} onClick={() => setCurrentTeamId(t.id)}>
                        <Users className="mr-2 size-4" />
                        <span className="truncate">{t.name}</span>
                        {currentTeamId === t.id && <span className="ml-auto text-[10px] text-primary">●</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('/teams')}>
                      <Settings className="mr-2 size-4" />
                      <span>Управление командами</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <SidebarGroupLabel>{currentTeam ? 'Курсы команды' : 'Мои курсы'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Recent — Collapsible */}
              <Collapsible
                defaultOpen
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
                              className="truncate"
                            >
                              <span className="truncate">{course.title}</span>
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
                  onMouseEnter={prefetchWorkshop}
                >
                  <Folder className="size-4" />
                  <span>Все курсы</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Articles / Instructions */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/articles')}
                  onClick={() => handleNavigate('/articles')}
                >
                  <FileText className="size-4" />
                  <span>Инструкции</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Favorites — coming soon */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <Star className="size-4" />
                  <span>Избранное</span>
                  <span className="ml-auto text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">скоро</span>
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
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <Compass className="size-4" />
                  <span>Исследовать</span>
                  <span className="ml-auto text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">скоро</span>
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
          <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onMouseEnter={() => setLangOpen(true)}
                className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-[hsl(265,60%,75%)] data-[state=open]:text-[hsl(265,60%,75%)]"
              >
                <Globe style={{ width: '1.4375rem', height: '1.4375rem' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[120px]"
              onMouseEnter={() => setLangOpen(true)}
              onMouseLeave={() => setLangOpen(false)}
            >
              {displayLanguages.map((lang) => {
                const isAvailable = lang.code === 'ru';
                return (
                  <DropdownMenuItem
                    key={lang.code}
                    disabled={!isAvailable}
                    onClick={() => {
                      if (isAvailable) {
                        setLanguage(lang.code as 'ru' | 'en');
                      }
                    }}
                    className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <span>{lang.label}</span>
                    {!isAvailable && (
                      <span className="ml-auto text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">soon</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <SidebarTrigger className="!h-9 !w-9 rounded-md text-muted-foreground hover:bg-transparent hover:text-[hsl(265,60%,75%)] [&_svg]:!size-[1.4375rem]" />
        </div>
      </SidebarFooter>

      
    </Sidebar>
  );
};

export default AppSidebar;
