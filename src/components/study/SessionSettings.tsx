import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { StandardDialogContent, ModalHeader, FormLabel, ModalFooter } from '@/components/ui/modal-primitives';

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
      <StandardDialogContent size="lg">
        <ModalHeader title="Session Settings" icon={<Settings size={18} />} onClose={() => onOpenChange(false)} />

        <div className="space-y-3.5 pt-1.5">
          <div className="space-y-1">
            <FormLabel htmlFor="work-duration" required>
              Work duration (minutes)
            </FormLabel>
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
            <FormLabel htmlFor="break-duration" required>
              Break duration (minutes)
            </FormLabel>
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
            <FormLabel htmlFor="long-break-duration" required>
              Long break duration (minutes)
            </FormLabel>
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
            <FormLabel htmlFor="session-goal" required>
              Daily session goal
            </FormLabel>
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

          <ModalFooter onCancel={() => onOpenChange(false)}>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold flex items-center justify-center transition-all duration-200"
            >
              <Save size={15} className="mr-2" />
              Save Settings
            </button>
          </ModalFooter>
        </div>
      </StandardDialogContent>
    </Dialog>
  );
};


