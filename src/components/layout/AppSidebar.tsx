import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
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
  Star,
  Compass,
  Palette,
  type LucideIcon,
} from 'lucide-react';
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
  { id: '1', name: "Pavel's Academy", logo: Logo, plan: 'Pro' },
];

// NavItem type (from Sidebar9)
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  children?: { label: string; href: string; isActive?: boolean }[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Workspace Switcher Component (exact Sidebar9 structure)
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary">
                <img
                  src={selected.logo}
                  alt={selected.name}
                  className="size-6 text-primary-foreground invert dark:invert-0"
                />
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
                <div className="flex size-6 items-center justify-center rounded-sm bg-primary">
                  <img
                    src={workspace.logo}
                    alt={workspace.name}
                    className="size-4 invert dark:invert-0"
                  />
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

// Search Component (exact Sidebar9 structure)
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

// Nav User Component (exact Sidebar9 structure)
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

// NavMenuItem Component (exact Sidebar9 structure)
const NavMenuItem = ({ 
  item,
  onClick,
}: { 
  item: NavItem;
  onClick?: (href: string) => void;
}) => {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          isActive={item.isActive}
          onClick={() => onClick?.(item.href)}
        >
          <a href={item.href} onClick={(e) => { e.preventDefault(); onClick?.(item.href); }}>
            <Icon className="size-4" />
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={item.isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={item.isActive}>
            <Icon className="size-4" />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton 
                  asChild 
                  isActive={child.isActive}
                  onClick={() => onClick?.(child.href)}
                >
                  <a href={child.href} onClick={(e) => { e.preventDefault(); onClick?.(child.href); }}>
                    {child.label}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
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

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  // Build navigation groups with active course children
  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard, isActive: isActive('/') },
        { label: 'Tasks', href: '/workshop', icon: BookOpen, isActive: isActive('/workshop') },
        { label: 'Roadmap', href: '/catalog', icon: Compass, isActive: isActive('/catalog') },
      ],
    },
    {
      title: 'Projects',
      items: [
        { 
          label: 'Active Projects', 
          href: '#', 
          icon: Briefcase, 
          isActive: recentCourses.some(c => isEditorRoute(c.id)),
          children: recentCourses.length > 0 
            ? recentCourses.slice(0, 3).map((course) => ({
                label: course.title,
                href: `/editor/${course.id}`,
                isActive: isEditorRoute(course.id),
              }))
            : [{ label: 'No projects yet', href: '#', isActive: false }],
        },
        { 
          label: 'Archived', 
          href: '#', 
          icon: Folder,
          children: [
            { label: '2024 Archive', href: '#', isActive: false },
            { label: '2023 Archive', href: '#', isActive: false },
          ],
        },
      ],
    },
    {
      title: 'Team',
      items: [
        { label: 'Members', href: '#', icon: Users },
        { label: 'Sprints', href: '#', icon: Clock3 },
        { label: 'Approvals', href: '/favorites', icon: BadgeCheck, isActive: isActive('/favorites') },
        { label: 'Reviews', href: '#', icon: Star },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { label: 'Integrations', href: '#', icon: Globe2 },
        { label: 'Automations', href: '#', icon: Sparkles },
      ],
    },
  ];

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher
          workspaces={workspacesList}
          activeWorkspace={workspacesList[0]}
        />
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem 
                    key={item.label} 
                    item={item}
                    onClick={handleNavigate}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
