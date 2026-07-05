import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SessionDetailsDialogProps {
  title?: string;
  subject?: string | null;
  hostName?: string;
  startTime?: string | null;
  sessionGoal?: number;
  workDuration?: number; // in seconds
  breakDuration?: number; // in seconds
  isGroupSession?: boolean;
}

export const SessionDetailsDialog = ({
  title = "Study Session",
  subject,
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
    // Calculate total minutes needed: goal * (work + break)
    const totalSeconds = sessionGoal * (workDuration + breakDuration);
    const end = new Date(start.getTime() + totalSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs flex items-center space-x-1">
          <Info size={14} />
          <span>Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900 border dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center">
            <Info className="mr-2 text-indigo-500" size={18} />
            Session Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="grid grid-cols-3 gap-2 border-b dark:border-gray-800 pb-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Title:</span>
            <span className="col-span-2 text-gray-900 dark:text-white font-medium">{title}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b dark:border-gray-800 pb-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Subject:</span>
            <span className="col-span-2">{subject || 'General'}</span>
          </div>

          {isGroupSession && (
            <div className="grid grid-cols-3 gap-2 border-b dark:border-gray-800 pb-2">
              <span className="font-semibold text-gray-500 dark:text-gray-400">Host:</span>
              <span className="col-span-2">{hostName || 'Anonymous'}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 border-b dark:border-gray-800 pb-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Start Time:</span>
            <span className="col-span-2">{formatTimeStr(startTime)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b dark:border-gray-800 pb-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Est. End:</span>
            <span className="col-span-2 font-semibold text-indigo-600 dark:text-indigo-400">
              {getEstimatedEndTime()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pb-1">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Config:</span>
            <span className="col-span-2">
              {sessionGoal} x {workDuration / 60}m focus / {breakDuration / 60}m break
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
