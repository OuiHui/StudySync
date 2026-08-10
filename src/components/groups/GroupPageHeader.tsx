import { ArrowLeft, Settings, Crown, UserMinus, UserCheck, Users, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, PanelRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { isValidImageUrl } from '@/lib/utils';

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Users, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap
  };
  return iconMap[iconName] || Users;
};

const renderGroupIcon = (iconValue: string, size: number = 24, className: string = "text-white") => {
  if (isValidImageUrl(iconValue)) {
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
  const adminMember = members.find((m: any) => m.id === group.created_by || m.role === 'admin');

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack} 
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg px-3 py-1.5 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Groups
      </Button>

      <div className="bg-card text-card-foreground border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className={`w-14 h-14 ${group.color || 'bg-purple-600'} rounded-xl flex items-center justify-center shrink-0 shadow-inner`}>
              {renderGroupIcon(group.icon || 'Users', 28, "text-white")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{group.name}</h1>
                {user?.id === group.created_by && (
                  <span title="You are the creator of this group">
                    <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 shrink-0" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {group.subject && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {group.subject}
                  </span>
                )}
                {adminMember && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span>Admin:</span>
                    <button
                      onClick={() => openProfile(adminMember.id)}
                      className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer focus:outline-none"
                    >
                      <Crown className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      {adminMember.name}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2.5 max-w-2xl leading-relaxed">
                {group.description ? group.description : (
                  <span className="italic text-gray-500 dark:text-gray-400">No description provided for this study group.</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
            <div className="flex items-center space-x-2 flex-wrap">
              {group.is_public !== false ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 dark:bg-green-950/80 text-emerald-600 dark:text-green-400 border border-emerald-500/20 dark:border-green-800/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Public
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-800/50 flex items-center gap-1.5">
                  <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                  Private
                </span>
              )}
              {group.max_members && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
                  isFull 
                    ? 'bg-red-500/10 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-800/50' 
                    : 'bg-blue-500/10 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-800/50'
                }`}>
                  <Users size={12} />
                  {members.length} / {group.max_members}
                </span>
              )}
              {(enrolled || user?.id === group.created_by) && (
                <Button
                  onClick={onChatToggle}
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ${
                    chatOpen ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-900' : ''
                  }`}
                  title={chatOpen ? "Close Chat Panel" : "Open Chat Panel"}
                >
                  <PanelRight size={18} />
                </Button>
              )}
              {group.user_role === 'admin' && (
                <Button
                  onClick={onSettingsOpen}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Group Settings"
                >
                  <Settings size={18} />
                </Button>
              )}
              {user?.id !== group.created_by && (
                enrolled ? (
                  <Button onClick={onLeaveGroup} variant="outline" size="sm" className="border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    Leave Group
                  </Button>
                ) : (
                  group.is_public !== false ? (
                    <Button 
                      onClick={onJoinGroup} 
                      disabled={!!isFull}
                      size="sm" 
                      className={isFull 
                        ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border border-gray-200 dark:border-zinc-700 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800" 
                        : "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      }
                    >
                      {isFull ? 'Group Full' : 'Join Group'}
                    </Button>
                  ) : (
                    <Button 
                      disabled
                      size="sm" 
                      className="bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border border-gray-200 dark:border-zinc-700 cursor-not-allowed"
                    >
                      Invite Required
                    </Button>
                  )
                )
              )}
            </div>
            
            {/* Overlapping member avatars */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Members:</span>
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 4).map((member, index) => {
                  const initials = member.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                  const bgColors = ['bg-purple-600', 'bg-blue-600', 'bg-red-600', 'bg-emerald-600'];
                  return member.avatar && isValidImageUrl(member.avatar) ? (
                    <button
                      key={member.id}
                      onClick={() => openProfile(member.id)}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 focus:outline-none hover:scale-110 hover:z-10 transition-transform cursor-pointer"
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
                      className={`inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-xs font-semibold text-white focus:outline-none hover:scale-110 hover:z-10 transition-transform cursor-pointer ${
                        bgColors[index % bgColors.length]
                      }`}
                      title={member.name}
                    >
                      {initials}
                    </button>
                  );
                })}
                {members.length > 4 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400 select-none">
                    +{members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

