import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, PenTool, Library, Clock, Star, Compass, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface RecentCourse {
  id: string;
  title: string;
}

const mainNav: NavItem[] = [
  { icon: Home, label: 'Главная', path: '/' },
  { icon: Search, label: 'Поиск', path: '/catalog' },
];

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

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

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
        setRecentCourses(data.map(c => ({ id: c.id, title: c.title })));
      }
    };

    fetchRecentCourses();
  }, [user]);

  const isEditorRoute = (courseId: string) => location.pathname === `/editor/${courseId}`;

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

        {/* My Courses Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Мои курсы
          </div>
          
          {/* Recent - Collapsible */}
          <div className="space-y-0.5">
            <button
              onClick={() => setRecentExpanded(!recentExpanded)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium",
                "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <ChevronRight 
                className={cn(
                  "w-3 h-3 transition-transform duration-200",
                  recentExpanded && "rotate-90"
                )} 
              />
              <Clock className="w-4 h-4" />
              <span className="flex-1 text-left">Недавние</span>
            </button>
            
            {/* Recent Courses List */}
            {recentExpanded && (
              <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
                {recentCourses.length > 0 ? (
                  recentCourses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => navigate(`/editor/${course.id}`)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-150 text-[12px]",
                        isEditorRoute(course.id)
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80"
                      )}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{course.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[11px] text-white/30">
                    Нет недавних курсов
                  </div>
                )}
              </div>
            )}

            {/* All Courses */}
            <NavItemButton
              item={{ icon: BookOpen, label: 'Все курсы', path: '/workshop' }}
              isActive={location.pathname === '/workshop'}
              onClick={() => navigate('/workshop')}
            />

            {/* Starred */}
            <NavItemButton
              item={{ icon: Star, label: 'Избранное', path: '/workshop?filter=starred' }}
              isActive={location.pathname + location.search === '/workshop?filter=starred'}
              onClick={() => navigate('/workshop?filter=starred')}
            />
          </div>
        </div>

        {/* Resources Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Ресурсы
          </div>
          <div className="space-y-0.5">
            <NavItemButton
              item={{ icon: Compass, label: 'Исследовать', path: '/catalog' }}
              isActive={location.pathname === '/catalog'}
              onClick={() => navigate('/catalog')}
            />
            <NavItemButton
              item={{ icon: Library, label: 'Словарь', path: '/dictionary' }}
              isActive={location.pathname === '/dictionary'}
              onClick={() => navigate('/dictionary')}
            />
          </div>
        </div>
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
