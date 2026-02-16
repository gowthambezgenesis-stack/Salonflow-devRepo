import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Tag, 
  Settings as SettingsIcon, 
  LogOut,
  Scissors,
  List
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  salonName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onLogout, salonName }) => {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'services', label: 'Services', icon: List },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm transition-colors duration-200">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        <div className="bg-pink-600 p-2 rounded-lg">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white text-lg">SalonFlow</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{salonName}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;