import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Clock,
  Star,
  Compass,
  Library,
  ChevronRight,
  FileText,
  Settings,
  LogOut,
  ChevronsUpDown,
  Check,
  Search,
  HelpCircle,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pavelAvatar from '@/assets/pavel-avatar.jpg';
import Logo from '@/assets/Logo.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';

interface RecentCourse {
  id: string;
  title: string;
}

interface AppSidebarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

// Workspace type
interface Workspace {
  id: string;
  name: string;
  logo: string;
  plan: string;
}

// Workspace data
const workspacesList: Workspace[] = [
  { id: '1', name: "Pavel's Academy", logo: pavelAvatar, plan: 'Pro' },
];

// Nav items
const overviewItems = [
  { label: 'Главная', icon: Home, href: '/' },
];

const resourceItems = [
  { label: 'Исследовать', icon: Compass, href: '/catalog' },
  { label: 'Словарь', icon: Library, href: '/dictionary', disabled: true, badge: 'скоро' },
];

const footerItems = [
  { label: 'Помощь', icon: HelpCircle, href: '#' },
  { label: 'Настройки', icon: Settings, href: '#' },
];

// Workspace Switcher Component
const WorkspaceSwitcher = ({
  workspaces,
  activeWorkspace,
}: {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
}) => {
  const [selected, setSelected] = useState(activeWorkspace);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={selected.logo} alt={selected.name} />
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                  {selected.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selected.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {selected.plan} Plan
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setSelected(workspace)}
                className="gap-2 p-2"
              >
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarImage src={workspace.logo} />
                  <AvatarFallback className="rounded-md">
                    {workspace.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {workspace.name}
                {workspace.id === selected.id && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

// Search Component
const SearchForm = () => {
  return (
    <form>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="search"
            placeholder="Поиск курсов..."
            className="pl-8"
          />
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
};

// Nav User Component
const NavUser = ({ 
  user, 
  onSignOut,
  onDesignSystem,
  isAdmin,
}: { 
  user: { name: string; email: string; avatar: string };
  onSignOut: () => void;
  onDesignSystem?: () => void;
  isAdmin?: boolean;
}) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && onDesignSystem && (
              <>
                <DropdownMenuItem onClick={onDesignSystem}>
                  <Palette className="mr-2 size-4" />
                  Дизайн-система
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 size-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({ language, onLanguageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [recentOpen, setRecentOpen] = useState(true);

  const userName = 'Pavel';
  const userEmail = user?.email || 'pavel@academy.com';

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

  const isActive = (path: string) => location.pathname === path;
  const isEditorRoute = (courseId: string) => location.pathname === `/editor/${courseId}`;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={Logo} alt="Academy" className="h-6" />
        </div>
        
        {/* Workspace Switcher */}
        <WorkspaceSwitcher
          workspaces={workspacesList}
          activeWorkspace={workspacesList[0]}
        />
        
        {/* Search */}
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel>Обзор</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    onClick={() => navigate(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Courses */}
        <SidebarGroup>
          <SidebarGroupLabel>Мои курсы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Recent Courses - Collapsible */}
              <Collapsible
                open={recentOpen}
                onOpenChange={setRecentOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Недавние">
                      <Clock />
                      <span>Недавние</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {recentCourses.length > 0 ? (
                        recentCourses.map((course) => (
                          <SidebarMenuSubItem key={course.id}>
                            <SidebarMenuSubButton
                              isActive={isEditorRoute(course.id)}
                              onClick={() => navigate(`/editor/${course.id}`)}
                            >
                              <FileText className="size-3.5" />
                              <span className="truncate">{course.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="px-2 py-1.5 text-xs text-muted-foreground">
                            Нет недавних курсов
                          </span>
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
                  onClick={() => navigate('/workshop')}
                  tooltip="Все курсы"
                >
                  <BookOpen />
                  <span>Все курсы</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Favorites */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/favorites')}
                  onClick={() => navigate('/favorites')}
                  tooltip="Избранное"
                >
                  <Star />
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
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    onClick={() => !item.disabled && navigate(item.href)}
                    tooltip={item.label}
                    disabled={item.disabled}
                    className={cn(item.disabled && 'opacity-50 cursor-not-allowed')}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: userName,
            email: userEmail,
            avatar: pavelAvatar,
          }}
          onSignOut={handleSignOut}
          onDesignSystem={() => navigate('/design-system')}
          isAdmin={isAdmin}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
