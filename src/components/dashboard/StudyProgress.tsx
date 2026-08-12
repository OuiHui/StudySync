import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, Check, X } from 'lucide-react';

export const StudyProgress = ({ stats }: { stats: UserStats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hoursGoal, setHoursGoal] = useState<number>(40);
  const [sessionsGoal, setSessionsGoal] = useState<number>(10);
  
  const [tempHoursGoal, setTempHoursGoal] = useState<number>(40);
  const [tempSessionsGoal, setTempSessionsGoal] = useState<number>(10);

  // Load goals from localStorage on mount
  useEffect(() => {
    const savedHours = localStorage.getItem('study_hours_goal');
    const savedSessions = localStorage.getItem('study_sessions_goal');
    if (savedHours) {
      const h = parseFloat(savedHours);
      if (!isNaN(h) && h > 0) {
        setHoursGoal(h);
        setTempHoursGoal(h);
      }
    }
    if (savedSessions) {
      const s = parseInt(savedSessions, 10);
      if (!isNaN(s) && s > 0) {
        setSessionsGoal(s);
        setTempSessionsGoal(s);
      }
    }
  }, []);

  const handleSave = () => {
    setHoursGoal(tempHoursGoal);
    setSessionsGoal(tempSessionsGoal);
    localStorage.setItem('study_hours_goal', tempHoursGoal.toString());
    localStorage.setItem('study_sessions_goal', tempSessionsGoal.toString());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempHoursGoal(hoursGoal);
    setTempSessionsGoal(sessionsGoal);
    setIsEditing(false);
  };

  // Safe parse of stats values
  const hoursValue = parseFloat((stats?.studyHoursThisWeek || '0').replace('h', '')) || 0;
  const sessionsValue = parseInt(stats?.sessionsThisWeek || '0', 10) || 0;

  // Percentage calculations
  const hoursPercent = Math.min((hoursValue / hoursGoal) * 100, 100);
  const sessionsPercent = Math.min((sessionsValue / sessionsGoal) * 100, 100);

  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-foreground text-lg font-semibold">Study Progress This Week</CardTitle>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-8 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <Check size={14} className="mr-1" /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X size={14} className="mr-1" /> Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings2 size={14} className="mr-1" /> Edit Goals
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Study Hours This Week</span>
              {isEditing ? (
                <div className="flex items-center space-x-1.5">
                  <span className="text-foreground font-medium">{hoursValue}</span>
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={tempHoursGoal}
                    onChange={(e) => setTempHoursGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 h-7 text-xs px-2 py-0 border-border bg-card text-foreground focus-visible:ring-1"
                  />
                  <span className="text-muted-foreground">hours</span>
                </div>
              ) : (
                <span className="text-foreground font-medium">
                  {hoursValue}/{hoursGoal} hours
                </span>
              )}
            </div>
            <div className="w-full bg-brand/20 border border-brand/10 rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="bg-brand h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${hoursPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Sessions Completed</span>
              {isEditing ? (
                <div className="flex items-center space-x-1.5">
                  <span className="text-foreground font-medium">{sessionsValue}</span>
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    min="1"
                    value={tempSessionsGoal}
                    onChange={(e) => setTempSessionsGoal(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-16 h-7 text-xs px-2 py-0 border-border bg-card text-foreground focus-visible:ring-1"
                  />
                  <span className="text-muted-foreground">sessions</span>
                </div>
              ) : (
                <span className="text-foreground font-medium">
                  {sessionsValue}/{sessionsGoal} sessions
                </span>
              )}
            </div>
            <div className="w-full bg-brand/20 border border-brand/10 rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="bg-brand-hover h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${sessionsPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
