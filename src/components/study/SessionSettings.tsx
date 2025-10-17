
import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SessionSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  onSettingsChange: (settings: { workDuration: number; breakDuration: number; longBreakDuration: number }) => void;
}

export const SessionSettings = ({ 
  workDuration, 
  breakDuration, 
  longBreakDuration, 
  onSettingsChange 
}: SessionSettingsProps) => {
  const [tempSettings, setTempSettings] = useState({
    workDuration: workDuration / 60,
    breakDuration: breakDuration / 60,
    longBreakDuration: longBreakDuration / 60,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSettingsChange({
      workDuration: tempSettings.workDuration * 60,
      breakDuration: tempSettings.breakDuration * 60,
      longBreakDuration: tempSettings.longBreakDuration * 60,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings size={16} className="mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-duration">Work Duration (minutes)</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break-duration">Break Duration (minutes)</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="long-break-duration">Long Break Duration (minutes)</Label>
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
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save size={16} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
