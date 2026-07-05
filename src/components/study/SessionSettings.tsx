import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Session Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-duration" className="text-gray-700 dark:text-gray-300">Work Duration (minutes)</Label>
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
              className="dark:bg-gray-950 dark:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break-duration" className="text-gray-700 dark:text-gray-300">Break Duration (minutes)</Label>
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
              className="dark:bg-gray-950 dark:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="long-break-duration" className="text-gray-700 dark:text-gray-300">Long Break Duration (minutes)</Label>
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
              className="dark:bg-gray-950 dark:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-goal" className="text-gray-700 dark:text-gray-300">Daily Session Goal</Label>
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
              className="dark:bg-gray-950 dark:border-gray-800"
            />
          </div>
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Save size={16} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
