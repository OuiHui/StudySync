import { ArrowLeft, MessageSquare, Settings, Crown, UserMinus, UserCheck, Users, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Users, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap
  };
  return iconMap[iconName] || Users;
};

const renderGroupIcon = (iconValue: string, size: number = 24, className: string = "text-white") => {
  if (iconValue && (iconValue.startsWith('data:') || iconValue.startsWith('http'))) {
    return (
      <img 
        src={iconValue} 
        alt="Group icon" 
        className="object-cover rounded"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }
  const IconComponent = getIconComponent(iconValue);
  return <IconComponent size={size} className={className} />;
};

interface GroupPageHeaderProps {
  group: any;
  enrolled: boolean;
  onBack: () => void;
  onChatOpen: () => void;
  onSettingsOpen: () => void;
  onLeaveGroup: () => void;
  onJoinGroup: () => void;
}

export const GroupPageHeader = ({ 
  group, 
  enrolled, 
  onBack, 
  onChatOpen, 
  onSettingsOpen, 
  onLeaveGroup, 
  onJoinGroup 
}: GroupPageHeaderProps) => {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="dark:text-white dark:hover:bg-gray-700">
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div className={`w-12 h-12 ${group.color || 'bg-purple-500'} rounded-lg flex items-center justify-center`}>
          {renderGroupIcon(group.icon || 'Users', 24, "text-white")}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{group.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">{group.subject}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {user?.id === group.created_by ? (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Creator
          </span>
        ) : enrolled && (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm rounded-full">
            Enrolled
          </span>
        )}
        <Button onClick={onChatOpen} className="bg-blue-500 hover:bg-blue-600 text-white">
          <MessageSquare size={16} className="mr-1" />
          Group Chat
        </Button>
        {group.user_role === 'admin' && (
          <Button onClick={onSettingsOpen} variant="outline" className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
            <Settings size={16} className="mr-1" />
            Group Settings
          </Button>
        )}
        {user?.id !== group.created_by && (
          enrolled ? (
            <Button onClick={onLeaveGroup} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20">
              <UserMinus size={16} className="mr-1" />
              Leave Group
            </Button>
          ) : (
            <Button onClick={onJoinGroup} className="bg-green-500 hover:bg-green-600 text-white">
              <UserCheck size={16} className="mr-1" />
              Join Group
            </Button>
          )
        )}
      </div>
    </div>
  );
};
