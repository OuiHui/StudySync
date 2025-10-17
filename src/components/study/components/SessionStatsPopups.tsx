
import { useState } from 'react';
import { Calendar, BookOpen, Settings, Save, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const ScheduleSessionPopup = () => {
  const [sessionData, setSessionData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    description: ''
  });

  const handleSave = () => {
    console.log('Scheduling session:', sessionData);
    // Reset form
    setSessionData({
      title: '',
      date: '',
      time: '',
      duration: '60',
      description: ''
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
          <Calendar size={16} className="mr-2" />
          Schedule Next Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Study Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Title</Label>
            <Input
              id="session-title"
              placeholder="e.g., Advanced Calculus Review"
              value={sessionData.title}
              onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-time">Time</Label>
              <Input
                id="session-time"
                type="time"
                value={sessionData.time}
                onChange={(e) => setSessionData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-duration">Duration (minutes)</Label>
            <Input
              id="session-duration"
              type="number"
              min="15"
              max="480"
              value={sessionData.duration}
              onChange={(e) => setSessionData(prev => ({ ...prev, duration: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-description">Description</Label>
            <Textarea
              id="session-description"
              placeholder="Session topics and goals..."
              value={sessionData.description}
              onChange={(e) => setSessionData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save size={16} className="mr-2" />
            Schedule Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const StudyMaterialsPopup = () => {
  const [materials, setMaterials] = useState([
    { id: '1', name: 'Calculus Textbook - Chapter 7', type: 'PDF', size: '2.3 MB' },
    { id: '2', name: 'Practice Problems Set', type: 'PDF', size: '1.1 MB' },
    { id: '3', name: 'Formula Reference Sheet', type: 'PDF', size: '0.8 MB' }
  ]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <BookOpen size={16} className="mr-2" />
          Study Materials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Study Materials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button className="w-full" variant="outline">
            <Upload size={16} className="mr-2" />
            Upload New Material
          </Button>
          <div className="space-y-2">
            <Label>Available Materials</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-800 dark:text-white">{material.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{material.type} • {material.size}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SessionSettingsPopup = () => {
  const [settings, setSettings] = useState({
    autoBreaks: true,
    soundNotifications: true,
    breakDuration: '5',
    workDuration: '25',
    longBreakInterval: '4'
  });

  const handleSave = () => {
    console.log('Saving session settings:', settings);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <Settings size={16} className="mr-2" />
          Session Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work-duration">Work Duration (min)</Label>
              <Input
                id="work-duration"
                type="number"
                min="1"
                max="120"
                value={settings.workDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, workDuration: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Break Duration (min)</Label>
              <Input
                id="break-duration"
                type="number"
                min="1"
                max="30"
                value={settings.breakDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, breakDuration: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="long-break-interval">Long Break Interval (sessions)</Label>
            <Input
              id="long-break-interval"
              type="number"
              min="2"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, longBreakInterval: e.target.value }))}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-breaks">Automatic Breaks</Label>
              <input
                id="auto-breaks"
                type="checkbox"
                checked={settings.autoBreaks}
                onChange={(e) => setSettings(prev => ({ ...prev, autoBreaks: e.target.checked }))}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-notifications">Sound Notifications</Label>
              <input
                id="sound-notifications"
                type="checkbox"
                checked={settings.soundNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, soundNotifications: e.target.checked }))}
                className="rounded"
              />
            </div>
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
