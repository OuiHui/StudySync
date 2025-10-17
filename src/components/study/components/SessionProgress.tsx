
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
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{sessions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Sessions Completed</div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
