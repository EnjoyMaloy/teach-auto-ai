import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}
const navItems: NavItem[] = [{
  icon: Home,
  label: 'Главная',
  path: '/'
}, {
  icon: BookOpen,
  label: 'Каталог',
  path: '/catalog'
}, {
  icon: PenTool,
  label: 'Мастерская авторов',
  path: '/workshop'
}];
const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border bg-[#f7f7f8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary">
            <span className="text-primary-foreground text-xl font-bold">А</span>
          </div>
          <span className="text-sidebar-foreground text-xl font-bold">Open Academy</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 bg-[#f7f7f8]">
        <ul className="space-y-1">
          {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return <li key={item.path}>
                <button onClick={() => navigate(item.path)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>;
        })}
        </ul>
      </nav>

    </aside>;
};
export default AppSidebar;