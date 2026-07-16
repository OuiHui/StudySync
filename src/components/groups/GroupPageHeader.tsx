import { ArrowLeft, Settings, Crown, UserMinus, UserCheck, Users, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, PanelRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

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
  chatOpen: boolean;
  onChatToggle: () => void;
  onSettingsOpen: () => void;
  onLeaveGroup: () => void;
  onJoinGroup: () => void;
  members: any[];
}

export const GroupPageHeader = ({ 
  group, 
  enrolled, 
  onBack, 
  chatOpen,
  onChatToggle, 
  onSettingsOpen, 
  onLeaveGroup, 
  onJoinGroup,
  members
}: GroupPageHeaderProps) => {
  const { user } = useAuth();
  const { openProfile } = useUserProfileModal();

  const isFull = group.max_members && members.length >= group.max_members;

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft size={16} className="mr-1" />
        Back
      </Button>

      <div className="bg-[#141414] dark:bg-gray-900 border border-gray-800 p-6 rounded-xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 ${group.color || 'bg-purple-600'} rounded-lg flex items-center justify-center shrink-0`}>
              {renderGroupIcon(group.icon || 'Users', 24, "text-white")}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white">{group.name}</h1>
                {user?.id === group.created_by && <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
              </div>
              <p className="text-sm font-semibold text-green-500 mt-1">{group.subject}</p>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl">{group.description}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end justify-between md:self-stretch gap-4 shrink-0">
            <div className="flex items-center space-x-2">
              {group.is_public !== false ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-950/80 text-green-400 border border-green-800/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Public
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/50 flex items-center gap-1.5">
                  <Lock size={12} className="text-amber-400" />
                  Private
                </span>
              )}
              {group.max_members && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
                  isFull 
                    ? 'bg-red-950/80 text-red-400 border-red-800/50' 
                    : 'bg-blue-950/80 text-blue-400 border-blue-800/50'
                }`}>
                  <Users size={12} />
                  {members.length} / {group.max_members}
                </span>
              )}
              <Button
                onClick={onChatToggle}
                variant="outline"
                size="icon"
                className={`h-9 w-9 border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white ${
                  chatOpen ? 'border-blue-500 text-blue-400 bg-gray-900' : ''
                }`}
              >
                <PanelRight size={18} />
              </Button>
              {group.user_role === 'admin' && (
                <Button
                  onClick={onSettingsOpen}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white"
                >
                  <Settings size={18} />
                </Button>
              )}
              {user?.id !== group.created_by && (
                enrolled ? (
                  <Button onClick={onLeaveGroup} variant="outline" size="sm" className="border-red-800 hover:bg-red-950/20 text-red-400 hover:text-red-300">
                    Leave Group
                  </Button>
                ) : (
                  <Button 
                    onClick={onJoinGroup} 
                    disabled={!!isFull}
                    size="sm" 
                    className={isFull 
                      ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed hover:bg-zinc-800" 
                      : "bg-green-600 hover:bg-green-700 text-white"
                    }
                  >
                    {isFull ? 'Group Full' : 'Join Group'}
                  </Button>
                )
              )}
            </div>
            
            {/* Overlapping member avatars */}
            <div className="flex -space-x-2 overflow-hidden">
              {members.slice(0, 3).map((member, index) => {
                const initials = member.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);
                const bgColors = ['bg-purple-600', 'bg-blue-600', 'bg-red-600'];
                return member.avatar ? (
                  <button
                    key={member.id}
                    onClick={() => openProfile(member.id)}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-[#141414] focus:outline-none hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title={member.name}
                  >
                    <img
                      className="h-full w-full rounded-full object-cover"
                      src={member.avatar}
                      alt={member.name}
                    />
                  </button>
                ) : (
                  <button
                    key={member.id}
                    onClick={() => openProfile(member.id)}
                    className={`inline-block h-8 w-8 rounded-full ring-2 ring-[#141414] flex items-center justify-center text-xs font-semibold text-white focus:outline-none hover:scale-105 active:scale-95 transition-transform cursor-pointer ${
                      bgColors[index % bgColors.length]
                    }`}
                    title={member.name}
                  >
                    {initials}
                  </button>
                );
              })}
              {members.length > 3 && (
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#141414] bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-400 select-none">
                  +{members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
