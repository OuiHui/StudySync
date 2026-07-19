import { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SessionSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionGoal: number;
  onSettingsChange: (settings: { workDuration: number; breakDuration: number; longBreakDuration: number }) => void;
  onSessionGoalChange: (goal: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionSettings = ({ 
  workDuration, 
  breakDuration, 
  longBreakDuration, 
  sessionGoal,
  onSettingsChange,
  onSessionGoalChange,
  open,
  onOpenChange,
}: SessionSettingsProps) => {
  const [tempSettings, setTempSettings] = useState({
    workDuration: workDuration / 60,
    breakDuration: breakDuration / 60,
    longBreakDuration: longBreakDuration / 60,
    sessionGoal: sessionGoal,
  });

  useEffect(() => {
    setTempSettings({
      workDuration: workDuration / 60,
      breakDuration: breakDuration / 60,
      longBreakDuration: longBreakDuration / 60,
      sessionGoal: sessionGoal,
    });
  }, [workDuration, breakDuration, longBreakDuration, sessionGoal, open]);

  const handleSave = () => {
    onSettingsChange({
      workDuration: tempSettings.workDuration * 60,
      breakDuration: tempSettings.breakDuration * 60,
      longBreakDuration: tempSettings.longBreakDuration * 60,
    });
    onSessionGoalChange(tempSettings.sessionGoal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Settings size={18} />
            </div>
            Session Settings
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-3.5 pt-1.5">
          <div className="space-y-1">
            <Label htmlFor="work-duration" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Work duration (minutes) <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="work-duration"
              type="number"
              min="1"
              max="120"
              value={tempSettings.workDuration}
              onChange={(e) => setTempSettings(prev => ({ 
                ...prev, 
                workDuration: parseInt(e.target.value) || 25 
              }))}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="break-duration" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Break duration (minutes) <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="break-duration"
              type="number"
              min="1"
              max="30"
              value={tempSettings.breakDuration}
              onChange={(e) => setTempSettings(prev => ({ 
                ...prev, 
                breakDuration: parseInt(e.target.value) || 5 
              }))}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="long-break-duration" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Long break duration (minutes) <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="long-break-duration"
              type="number"
              min="1"
              max="60"
              value={tempSettings.longBreakDuration}
              onChange={(e) => setTempSettings(prev => ({ 
                ...prev, 
                longBreakDuration: parseInt(e.target.value) || 15 
              }))}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="session-goal" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Daily session goal <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="session-goal"
              type="number"
              min="1"
              max="24"
              value={tempSettings.sessionGoal}
              onChange={(e) => setTempSettings(prev => ({ 
                ...prev, 
                sessionGoal: parseInt(e.target.value) || 8 
              }))}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold flex items-center justify-center transition-all duration-200"
            >
              <Save size={15} className="mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

