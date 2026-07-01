
import { useState } from 'react';
import { 
  Home, 
  Timer, 
  Users, 
  BookOpen, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  FileText,
  BarChart3,
  Search,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onToggle }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { globalTimer } = useGlobalTimer();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'study-session', label: 'Solo Study', icon: BookOpen },
    { id: 'available-sessions', label: 'Group Sessions', icon: Users },
    { id: 'groups', label: 'My Groups', icon: Users },
    { id: 'browse-groups', label: 'Browse Groups', icon: Search },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'find-friends', label: 'Find Friends', icon: UserPlus },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isTabDisabled = (tabId: string) => {
    if (!globalTimer.isActive) return false;
    
    // Notes tab is always enabled
    if (tabId === 'notes') return false;
    
    // Solo Study is enabled if the active timer is a solo study timer
    if (tabId === 'study-session' && !globalTimer.isGroupTimer) return false;
    
    // Group Sessions is enabled if the active timer is a group study timer
    if (tabId === 'available-sessions' && globalTimer.isGroupTimer) return false;
    
    return true;
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } z-40`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">StudySync</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Collaborative Learning</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = isTabDisabled(item.id);
            
            return (
              <li key={item.id}>
                <button
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className={isCollapsed ? 'mx-auto' : 'mr-3'} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - User Menu */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-sm text-gray-600 dark:text-gray-300">Account</span>
            )}
            <UserMenu 
              onProfileClick={() => setActiveTab('profile')} 
              isProfileDisabled={isTabDisabled('profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
