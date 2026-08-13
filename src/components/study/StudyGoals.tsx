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
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl flex flex-col h-full min-h-0">
      <CardHeader className="py-3 shrink-0 flex flex-row items-center justify-between border-b border-border/80">
        <CardTitle className="text-sm font-semibold flex items-center text-foreground">
          <Target size={16} className="mr-2 text-brand" />
          Today's Study Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex flex-col flex-1 min-h-0 justify-between">
        {/* Goals List */}
        <div className="flex-1 min-h-0 mb-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-xs text-muted-foreground">No goals set for this session.</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Use the input below to set a study goal.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-border/60 hover:bg-muted/80 transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={goal.completed}
                        onCheckedChange={(checked) =>
                          onToggleGoal?.(goal.id, !!checked)
                        }
                        className="h-4 w-4 border-border rounded text-brand focus:ring-brand"
                      />
                      <label
                        htmlFor={`goal-${goal.id}`}
                        className={`text-xs font-medium text-foreground truncate cursor-pointer select-none ${
                          goal.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {goal.title}
                      </label>
                    </div>
                    <Button
                      onClick={() => onDeleteGoal?.(goal.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-500/10 shrink-0"
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
        <form onSubmit={handleSubmit} className="flex space-x-2 shrink-0 border-t border-border/80 pt-2.5">
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
            className="h-7 text-xs bg-brand hover:bg-brand-hover text-primary-foreground font-semibold"
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
