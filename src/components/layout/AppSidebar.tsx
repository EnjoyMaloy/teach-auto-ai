import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/assets/Logo.svg';

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
      <div className="p-6 bg-[#f7f7f8]">
        <img src={Logo} alt="Academy" className="h-7" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 bg-[#f7f7f8]">
        <ul className="space-y-1">
          {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return <li key={item.path}>
                <button onClick={() => navigate(item.path)} style={{
              fontFamily: "'TT Commons', sans-serif"
            }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-[5px] transition-all duration-200 text-sm font-semibold", isActive ? "bg-[#a66cff] text-white hover:bg-[#924CFE]" : "text-[#464646] hover:bg-[#EBE9EA]")}>
                  <item.icon className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
                  {item.label}
                </button>
              </li>;
        })}
        </ul>
      </nav>

    </aside>;
};
export default AppSidebar;