
import { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SessionProgressProps {
  sessions: number;
  sessionGoal: number;
  onSessionGoalChange: (goal: number) => void;
}

export const SessionProgress = ({ sessions, sessionGoal, onSessionGoalChange }: SessionProgressProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(sessionGoal);

  const handleSave = () => {
    onSessionGoalChange(tempGoal);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempGoal(sessionGoal);
    setIsEditing(false);
  };

  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-foreground font-semibold">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand">{sessions}</div>
            <div className="text-sm text-muted-foreground">Sessions Completed</div>
          </div>
          <div className="w-full bg-brand/20 border border-brand/10 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((sessions / sessionGoal) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Goal:</span>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value) || 1)}
                  className="w-16 h-6 text-xs text-center"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">sessions</span>
                <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
                  <Check size={12} />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Goal: {sessionGoal} sessions</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-6 w-6 p-0">
                  <Edit3 size={12} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
