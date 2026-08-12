
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CurrentSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  onEdit?: () => void;
}

export const CurrentSettings = ({ workDuration, breakDuration, longBreakDuration, onEdit }: CurrentSettingsProps) => {
  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground font-semibold">Timer Configuration</CardTitle>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Edit timer settings"
            >
              <Pencil size={15} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Work Duration</span>
            <span className="font-medium text-foreground">{workDuration / 60} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Break Duration</span>
            <span className="font-medium text-foreground">{breakDuration / 60} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Long Break</span>
            <span className="font-medium text-foreground">{longBreakDuration / 60} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
