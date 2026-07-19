import { BookOpen, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SessionDetailsDialogProps {
  title?: string;
  course?: string | null;
  hostName?: string;
  startTime?: string | null;
  sessionGoal?: number;
  workDuration?: number; // in seconds
  breakDuration?: number; // in seconds
  isGroupSession?: boolean;
}

export const SessionDetailsDialog = ({
  title = "Study Session",
  course,
  hostName,
  startTime,
  sessionGoal = 4,
  workDuration = 1500,
  breakDuration = 300,
  isGroupSession = false,
}: SessionDetailsDialogProps) => {
  const formatTimeStr = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const getEstimatedEndTime = () => {
    const start = startTime ? new Date(startTime) : new Date();
    const totalSeconds = sessionGoal * (workDuration + breakDuration);
    const end = new Date(start.getTime() + totalSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
          <BookOpen size={14} />
          <span>Details</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            Session Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2 text-sm text-gray-700 dark:text-zinc-300">
          <div className="grid grid-cols-3 gap-2 border-b border-gray-200 dark:border-slate-700/80 pb-2">
            <span className="font-semibold text-gray-500 dark:text-zinc-400">Title:</span>
            <span className="col-span-2 text-gray-900 dark:text-white font-semibold">{title}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-gray-200 dark:border-slate-700/80 pb-2">
            <span className="font-semibold text-gray-500 dark:text-zinc-400">Course:</span>
            <span className="col-span-2">{course || 'General'}</span>
          </div>

          {isGroupSession && (
            <div className="grid grid-cols-3 gap-2 border-b border-gray-200 dark:border-slate-700/80 pb-2">
              <span className="font-semibold text-gray-500 dark:text-zinc-400">Host:</span>
              <span className="col-span-2">{hostName || 'Anonymous'}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 border-b border-gray-200 dark:border-slate-700/80 pb-2">
            <span className="font-semibold text-gray-500 dark:text-zinc-400">Start Time:</span>
            <span className="col-span-2">{formatTimeStr(startTime)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-gray-200 dark:border-slate-700/80 pb-2">
            <span className="font-semibold text-gray-500 dark:text-zinc-400">Est. End:</span>
            <span className="col-span-2 font-semibold text-[#2a78d6]">
              {getEstimatedEndTime()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pb-1">
            <span className="font-semibold text-gray-500 dark:text-zinc-400">Config:</span>
            <span className="col-span-2 font-medium">
              {sessionGoal} x {workDuration / 60}m focus / {breakDuration / 60}m break
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

