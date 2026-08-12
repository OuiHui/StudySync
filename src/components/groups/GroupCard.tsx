import { useState, useEffect } from 'react';
import { Users, Crown, Settings, BookOpen, MessageSquare, Calendar, Globe, Lock, ArrowRight, Calculator, Atom, Code, Music, Camera, Heart, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isValidImageUrl } from '@/lib/utils';

interface GroupCardProps {
  group: any;
  isMyGroupPage: boolean;
  currentUserId?: string;
  onClick: () => void;
  openGroupSettings?: (group: any) => void;
  openChat?: (groupName: string, groupId: string) => void;
  onJoinGroup?: () => void;
}

export const GroupCard = ({
  group,
  isMyGroupPage,
  currentUserId,
  onClick,
  openGroupSettings,
  openChat,
  onJoinGroup
}: GroupCardProps) => {
  const [isUnread, setIsUnread] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const requested = localStorage.getItem(`studysync_group_request_${group.id}`) === 'true';
    setHasRequested(requested);
  }, [group.id]);

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinGroup) {
      onJoinGroup();
    }
  };

  const handleRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to request an invite");
        return;
      }
      
      const { error } = await supabase
        .from('group_invitations' as any)
        .insert({
          group_id: group.id,
          invited_user_id: group.created_by, // Send to group creator
          invited_by_id: session.user.id,    // Requester is current user
          status: 'pending',
          is_request: true
        });

      if (error) {
        if (error.message.includes('unique')) {
          toast.info("You have already requested to join this group.");
          localStorage.setItem(`studysync_group_request_${group.id}`, 'true');
          setHasRequested(true);
          return;
        }
        throw error;
      }

      localStorage.setItem(`studysync_group_request_${group.id}`, 'true');
      setHasRequested(true);
      toast.success("Join request sent to the group administrator!");
    } catch (err: any) {
      console.error("Error requesting group invite:", err);
      toast.error(err.message || "Failed to send join request");
    }
  };

  const groupCreatorId = group.created_by;
  const userRole = group.user_role || group.role;
  const isCreator = currentUserId && groupCreatorId && currentUserId === groupCreatorId;
  const isAdminRole = userRole === 'admin';
  const isAdmin = isCreator || isAdminRole;

  // Unread status logic
  useEffect(() => {
    if (isMyGroupPage && group.latest_message) {
      const lastReadId = localStorage.getItem(`studysync_chat_last_read_${group.id}`);
      const hasNewMessage = lastReadId !== group.latest_message.id;
      const isNotSentByCurrentUser = group.latest_message.sender_id !== currentUserId;
      setIsUnread(hasNewMessage && isNotSentByCurrentUser);
    } else {
      setIsUnread(false);
    }
  }, [group.latest_message, group.id, isMyGroupPage, currentUserId]);

  // Helper function to get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Users, BookOpen, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap
    };
    return iconMap[iconName] || BookOpen;
  };

  // Helper function to render group icon
  const renderGroupIcon = (iconValue: string, size: number = 20, className: string = "text-white") => {
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

  // Maps group color to customized premium dark/light mode background and text colors
  const getThemeColors = (colorStr: string) => {
    const color = (colorStr || '').toLowerCase();
    if (color.includes('purple')) {
      return {
        bg: 'bg-purple-500/15 dark:bg-purple-950/50 border border-purple-500/25 dark:border-purple-800/40',
        text: 'text-purple-600 dark:text-purple-300 font-semibold'
      };
    }
    if (color.includes('blue') || color.includes('indigo') || color.includes('cyan')) {
      return {
        bg: 'bg-blue-500/15 dark:bg-blue-950/50 border border-blue-500/25 dark:border-blue-800/40',
        text: 'text-blue-600 dark:text-blue-300 font-semibold'
      };
    }
    if (color.includes('green') || color.includes('emerald') || color.includes('teal')) {
      return {
        bg: 'bg-emerald-500/15 dark:bg-emerald-950/50 border border-emerald-500/25 dark:border-emerald-800/40',
        text: 'text-emerald-600 dark:text-emerald-300 font-semibold'
      };
    }
    if (color.includes('red') || color.includes('rose') || color.includes('pink')) {
      return {
        bg: 'bg-rose-500/15 dark:bg-rose-950/50 border border-rose-500/25 dark:border-rose-800/40',
        text: 'text-rose-600 dark:text-rose-300 font-semibold'
      };
    }
    if (color.includes('orange') || color.includes('amber') || color.includes('yellow')) {
      return {
        bg: 'bg-amber-500/15 dark:bg-amber-950/50 border border-amber-500/25 dark:border-amber-800/40',
        text: 'text-amber-600 dark:text-amber-300 font-semibold'
      };
    }
    return {
      bg: 'bg-zinc-500/15 dark:bg-zinc-950/50 border border-zinc-500/25 dark:border-zinc-800/40',
      text: 'text-zinc-600 dark:text-zinc-300 font-semibold'
    };
  };

  const themeColors = getThemeColors(group.color);
  const latestMessageText = group.latest_message ? group.latest_message.content : 'No recent activity';

  return (
    <div
      className="group/card bg-card text-card-foreground border-2 border-border/90 rounded-2xl p-5 shadow-lg shadow-black/30 hover:shadow-2xl hover:border-brand/60 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
      onClick={onClick}
    >
      <div>
        {/* Top Icon and Type row */}
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs ${themeColors.bg}`}>
            {renderGroupIcon(group.icon, 20, themeColors.text)}
          </div>
          {group.is_public ? (
            <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-2xs">
              <Globe size={13} />
              <span>Public</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-2xs">
              <Lock size={13} />
              <span>Private</span>
            </span>
          )}
        </div>

        {/* Title and Settings row */}
        <div className="flex items-center justify-between gap-3 mt-4 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 
              className="text-lg font-bold text-foreground group-hover/card:text-brand transition-colors leading-snug truncate"
              title={group.name}
            >
              {group.name}
            </h3>
            {isCreator && (
              <Crown size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          {isMyGroupPage && isAdmin && openGroupSettings && (
            <button
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                openGroupSettings(group);
              }}
              title="Group Settings"
            >
              <Settings size={15} />
            </button>
          )}
        </div>

        {/* Category Subject */}
        {group.subject && (
          <p 
            className="text-xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wider truncate"
            title={group.subject}
          >
            {group.subject}
          </p>
        )}

        {/* Description */}
        <p 
          className="text-sm italic text-muted-foreground/90 mt-3 line-clamp-2 leading-relaxed break-words"
          title={group.description || 'No description available'}
        >
          {group.description || 'No description available'}
        </p>
      </div>

      <div>
        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-5 font-medium">
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <Users size={14} className="text-muted-foreground" />
            <span className="text-foreground">{group.members} {group.members === 1 ? 'member' : 'members'}</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-foreground">{group.sessions ?? 0} {group.sessions === 1 ? 'session' : 'sessions'}</span>
          </span>
          <span className="truncate flex-shrink-0 text-muted-foreground" title={`Admin: ${group.admin || 'Admin'}`}>
            Admin: <span className="font-bold text-foreground">{group.admin || 'Admin'}</span>
          </span>
        </div>

        {/* Chat Activity Row (My Groups only) */}
        {isMyGroupPage && (
          <>
            <hr className="border-border/80 my-4" />
            <div
              className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors group/chat min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                if (openChat) openChat(group.name, group.id);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={16} className="text-muted-foreground group-hover/chat:text-brand transition-colors flex-shrink-0" />
                <span 
                  className="text-xs truncate font-normal leading-none max-w-[180px] sm:max-w-[200px] lg:max-w-[220px]"
                  title={latestMessageText}
                >
                  {latestMessageText}
                </span>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse flex-shrink-0" title="Unread message" />
                )}
              </div>
              <ArrowRight size={14} className="group-hover/chat:translate-x-1 transition-transform flex-shrink-0 text-muted-foreground group-hover/chat:text-brand" />
            </div>
          </>
        )}
        {/* Actions Row (Browse mode only) */}
        {!isMyGroupPage && (
          <>
            <hr className="border-border/80 my-4" />
            <div className="flex items-center justify-end">
              {group.is_public ? (
                <button
                  className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  onClick={handleJoin}
                >
                  <ArrowRight size={14} />
                  Join Group
                </button>
              ) : (
                <button
                  className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    hasRequested 
                      ? 'bg-muted border border-border text-muted-foreground cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm'
                  }`}
                  disabled={hasRequested}
                  onClick={handleRequest}
                >
                  <Lock size={12} />
                  {hasRequested ? 'Request Pending' : 'Request Invite'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
