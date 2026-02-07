import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Star,
  Compass,
  Library,
  ChevronRight,
  FileText,
  LogOut,
  ChevronsUpDown,
  Check,
  Search,
  Briefcase,
  Folder,
  Users,
  Clock3,
  BadgeCheck,
  Globe2,
  Sparkles,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pavelAvatar from '@/assets/pavel-avatar.jpg';
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-bold">{selected.name.charAt(0)}</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selected.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/50">
                  {selected.plan}
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
                <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-xs font-bold">{workspace.name.charAt(0)}</span>
                </div>
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
            placeholder="Search..."
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
                <span className="truncate text-xs text-sidebar-foreground/50">
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
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

// Collapsible Nav Item
const NavItemCollapsible = ({
  label,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={label}>
            <Icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({ language, onLanguageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);

  const userName = 'John Doe';
  const userEmail = user?.email || 'john@example.com';

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
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/')}
                  onClick={() => navigate('/')}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/workshop')}
                  onClick={() => navigate('/workshop')}
                  tooltip="Tasks"
                >
                  <BookOpen />
                  <span>Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/catalog')}
                  onClick={() => navigate('/catalog')}
                  tooltip="Roadmap"
                >
                  <Compass />
                  <span>Roadmap</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Active Projects - Collapsible */}
              <NavItemCollapsible label="Active Projects" icon={Briefcase} defaultOpen={false}>
                {recentCourses.length > 0 ? (
                  recentCourses.slice(0, 3).map((course) => (
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
                      No projects yet
                    </span>
                  </SidebarMenuSubItem>
                )}
              </NavItemCollapsible>

              {/* Archived - Collapsible */}
              <NavItemCollapsible label="Archived" icon={Folder} defaultOpen={false}>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton>
                    <FileText className="size-3.5" />
                    <span>2024 Archive</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton>
                    <FileText className="size-3.5" />
                    <span>2023 Archive</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </NavItemCollapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Team */}
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members">
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sprints">
                  <Clock3 />
                  <span>Sprints</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/favorites')}
                  onClick={() => navigate('/favorites')}
                  tooltip="Approvals"
                >
                  <BadgeCheck />
                  <span>Approvals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Reviews">
                  <Star />
                  <span>Reviews</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Integrations">
                  <Globe2 />
                  <span>Integrations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Automations">
                  <Sparkles />
                  <span>Automations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
