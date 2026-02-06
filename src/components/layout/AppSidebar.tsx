import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, PenTool, Library, Clock, Star, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/assets/Logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const mainNav: NavItem[] = [
  { icon: Home, label: 'Главная', path: '/' },
  { icon: Search, label: 'Поиск', path: '/catalog' },
];

const projectsNav: NavSection = {
  title: 'Курсы',
  items: [
    { icon: Clock, label: 'Недавние', path: '/catalog?sort=recent' },
    { icon: BookOpen, label: 'Все курсы', path: '/catalog' },
    { icon: Star, label: 'Избранное', path: '/catalog?filter=starred' },
  ],
};

const resourcesNav: NavSection = {
  title: 'Ресурсы',
  items: [
    { icon: Sparkles, label: 'Исследовать', path: '/catalog' },
    { icon: Library, label: 'Словарь', path: '/dictionary' },
  ],
};

const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium",
      isActive 
        ? "bg-white/10 text-white" 
        : "text-white/60 hover:bg-white/5 hover:text-white/90"
    )}
  >
    <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
    {item.label}
  </button>
);

const NavSectionGroup: React.FC<{
  section: NavSection;
  currentPath: string;
  onNavigate: (path: string) => void;
}> = ({ section, currentPath, onNavigate }) => (
  <div className="mb-4">
    {section.title && (
      <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        {section.title}
      </div>
    )}
    <div className="space-y-0.5">
      {section.items.map(item => (
        <NavItemButton
          key={item.path + item.label}
          item={item}
          isActive={currentPath === item.path || currentPath.startsWith(item.path.split('?')[0] + '/')}
          onClick={() => onNavigate(item.path)}
        />
      ))}
    </div>
  </div>
);

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-[#0f0f10] flex flex-col h-screen fixed left-0 top-0 border-r border-white/5">
      {/* Logo & Workspace */}
      <div className="p-4 pb-2">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
        </div>
        
        {/* Workspace Selector */}
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
            {userInitials}
          </div>
          <span className="flex-1 text-left text-[13px] font-medium text-white truncate">
            {userName}'s Academy
          </span>
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {/* Primary Nav */}
        <div className="space-y-0.5 mb-6">
          {mainNav.map(item => (
            <NavItemButton
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* Projects Section */}
        <NavSectionGroup
          section={projectsNav}
          currentPath={location.pathname}
          onNavigate={navigate}
        />

        {/* Resources Section */}
        <NavSectionGroup
          section={resourcesNav}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
      </nav>

      {/* Bottom Cards */}
      <div className="p-3 space-y-2">
        {/* Create Course Card */}
        <button
          onClick={() => navigate('/workshop')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[13px] font-medium text-white">Мастерская</div>
            <div className="text-[11px] text-white/50">Создать курс</div>
          </div>
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white truncate">{userName}</div>
            <div className="text-[11px] text-white/40 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
