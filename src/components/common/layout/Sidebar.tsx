

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
  UserPlus,
  Calendar,
  MessageSquare
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
  const { globalTimer } = useGlobalTimer();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'study-session', label: 'Solo Study', icon: BookOpen },
    { id: 'available-sessions', label: 'Group Sessions', icon: Calendar },
    { id: 'groups', label: 'Study Groups', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isTabDisabled = (tabId: string) => {
    if (!globalTimer.isActive) return false;

    // Notes and Messages tabs are always enabled
    if (tabId === 'notes' || tabId === 'messages') return false;

    // Solo Study is enabled if the active timer is a solo study timer
    if (tabId === 'study-session' && !globalTimer.isGroupTimer) return false;

    // Group Sessions is enabled if the active timer is a group study timer
    if (tabId === 'available-sessions' && globalTimer.isGroupTimer) return false;

    return true;
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-card text-card-foreground shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'
      } z-40`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">StudySync</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Collaborative Learning</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={isOpen ? 'p-4' : 'p-2'}>
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
                  className={`w-full flex items-center py-2 rounded-lg text-left transition-colors ${isOpen ? 'px-3' : 'justify-center px-0'
                    } ${isDisabled
                      ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      : isActive
                        ? 'bg-[#2a78d6] text-white shadow-sm font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                  {isOpen && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - User Menu */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300 ${isOpen ? 'mx-4 p-3 w-[calc(100%-2rem)]' : 'mx-auto p-1 w-10 h-10 flex items-center justify-center'
          }`}>
          <div className={`flex items-center w-full ${isOpen ? 'justify-between' : 'justify-center'}`}>
            {isOpen && (
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
