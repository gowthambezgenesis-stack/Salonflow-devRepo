import React from 'react';
import { SalonProfile } from '../types';
import { User, MapPin, Clock, Phone, LogOut, ChevronRight, Moon, Sun } from 'lucide-react';

interface SettingsViewProps {
  profile: SalonProfile;
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ profile, onLogout, isDarkMode, onToggleTheme }) => {
  const MenuItem = ({ icon: Icon, label, value, onClick }: { icon: any, label: string, value?: string, onClick?: () => void }) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-3 transition-colors duration-200 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
          {value && <p className="text-xs text-gray-500 dark:text-gray-400">{value}</p>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-2">Settings</h1>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 p-5 rounded-2xl text-white shadow-lg shadow-pink-200 dark:shadow-none mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-pink-100 text-sm">Partner Account</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-2 px-2">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Preferences</h3>
        <div 
          onClick={onToggleTheme}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-3 cursor-pointer transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
              {isDarkMode ? <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" /> : <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Appearance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isDarkMode ? 'bg-pink-600' : 'bg-gray-200'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      <div className="mb-2 px-2">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Business Details</h3>
        <MenuItem icon={MapPin} label="Location" value={profile.address.split(',')[0]} />
        <MenuItem icon={Clock} label="Business Hours" value={`${profile.open_time} - ${profile.close_time}`} />
        <MenuItem icon={Phone} label="Contact" value={profile.phone} />
      </div>

      <div className="px-2 mt-6">
        <button 
          onClick={onLogout}
          className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
        <p className="text-center text-gray-300 dark:text-gray-600 text-xs mt-4">SalonFlow v1.1.0</p>
      </div>
    </div>
  );
};

export default SettingsView;