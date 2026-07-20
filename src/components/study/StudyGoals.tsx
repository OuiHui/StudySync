import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Plus, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface GoalItem {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  progress: number;
  completed: boolean;
}

interface StudyGoalsProps {
  goals: GoalItem[];
  loading?: boolean;
  isHost: boolean;
  onAddGoal?: (title: string, description?: string) => Promise<void>;
  onToggleGoal?: (goalId: string, completed: boolean) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
}

export const StudyGoals = ({
  goals,
  loading = false,
  isHost,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal
}: StudyGoalsProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      if (onAddGoal) {
        await onAddGoal(newTitle.trim());
        setNewTitle('');
      }
    } catch (err) {
      console.error('Failed to add goal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col h-full min-h-0">
      <CardHeader className="py-3 shrink-0 flex flex-row items-center justify-between border-b dark:border-gray-700/50">
        <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-white">
          <Target size={16} className="mr-2 text-indigo-500" />
          Today's Study Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex flex-col flex-1 min-h-0 justify-between">
        {/* Goals List */}
        <div className="flex-1 min-h-0 mb-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">No goals set for this session.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Use the input below to set a study goal.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-gray-700/20 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          onToggleGoal?.(goal.id, !!checked)
                        }
                        className="h-4 w-4 border-gray-300 dark:border-gray-600 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`goal-${goal.id}`}
                        className={`text-xs font-medium text-gray-700 dark:text-gray-300 truncate cursor-pointer select-none ${
                          goal.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}
                      >
                        {goal.title}
                      </label>
                    </div>
                    <Button
                      onClick={() => onDeleteGoal?.(goal.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Add Goal form */}
        <form onSubmit={handleSubmit} className="flex space-x-2 shrink-0 border-t dark:border-gray-700/50 pt-2.5">
          <Input
            placeholder="Add a new goal..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-7 text-xs flex-1"
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newTitle.trim()}
            className="h-7 text-xs bg-brand hover:bg-brand-hover text-white font-medium"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus size={12} />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
