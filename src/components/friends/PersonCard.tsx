import {
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  UserPlus,
  UserCheck,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Person } from './types';
import { getAvatarColor } from './avatarUtils';
import { isValidImageUrl } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onAddFriend: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onViewProfile: (person: Person) => void;
  onMessage?: (id: string) => void;
}

export const PersonCard = ({ person, onAddFriend, onCancelRequest, onViewProfile, onMessage }: PersonCardProps) => {
  const avatarBg = getAvatarColor(person.name);

  const firstGroupItem = person.publicGroups[0];
  const firstGroupName = typeof firstGroupItem === 'string' ? firstGroupItem : firstGroupItem?.name;
  const extraGroups = person.publicGroups.length - 1;

  return (
    <div 
      onClick={() => onViewProfile(person)}
      className="flex flex-col rounded-2xl border-2 border-border/90 bg-card text-card-foreground shadow-lg shadow-black/30 hover:shadow-2xl hover:border-brand/60 hover:-translate-y-1 transition-all duration-200 cursor-pointer max-w-sm sm:max-w-[320px] w-full mx-auto group"
    >
      {/* Header: avatar + name/email + friends badge */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 relative">
        <div
          className={`w-11 h-11 rounded-full ${avatarBg} text-white flex items-center justify-center shrink-0 shadow-sm`}
        >
          {person.avatar && isValidImageUrl(person.avatar) ? (
            <img src={person.avatar} alt={person.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">{person.initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground truncate">{person.name}</h3>
            {person.status === 'friends' ? (
              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                <UserCheck size={9} />
                Friend
              </span>
            ) : person.status === 'pending' ? (
              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                <Clock size={9} />
                Pending
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{person.email}</p>
        </div>

        {/* Click indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-brand group-hover:translate-x-0.5 transition-all pl-2 shrink-0">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-foreground font-semibold">
          <span className="flex items-center gap-1">
            <BookOpen size={11} className="text-brand" />
            {person.major}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1">
            <GraduationCap size={11} className="text-brand" />
            {person.year}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <Users size={11} className="text-muted-foreground" />
          <span>{person.friendsCount} friends</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{person.groupsCount} groups</span>
        </div>

        {firstGroupName && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Users size={11} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{firstGroupName}</span>
            {extraGroups > 0 && (
              <span className="shrink-0 text-brand font-semibold ml-0.5">+{extraGroups} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-border/80 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-1 text-[11px] text-foreground font-semibold">
          <Clock size={11} className="text-brand" />
          {person.studyHours}h studied
        </div>

        {person.status === 'none' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddFriend(person.id);
            }}
            className="h-7 px-3 text-xs bg-brand hover:bg-brand-hover text-white shadow-sm font-semibold"
          >
            <UserPlus size={12} className="mr-1" />
            Add
          </Button>
        )}
        {person.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onCancelRequest(person.id);
            }}
            className="h-7 px-3 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold"
          >
            <Clock size={12} className="mr-1" />
            Pending
          </Button>
        )}
        {person.status === 'friends' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(person.id);
            }}
            className="h-7 px-3 text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 font-semibold"
          >
            <MessageSquare size={12} className="mr-1" />
            Message
          </Button>
        )}
      </div>
    </div>
  );
};
