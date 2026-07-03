import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReflectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, notes: string) => Promise<void>;
  loading?: boolean;
}

export const ReflectionDialog = ({ isOpen, onClose, onSubmit, loading = false }: ReflectionDialogProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your focus level before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(rating, notes);
      toast({
        title: "Reflection Saved",
        description: "Great job completing your study session!",
      });
      setRating(0);
      setNotes('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save reflection",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async () => {
    try {
      await onSubmit(0, 'Skipped reflection');
      toast({
        title: "Session Finished",
        description: "Great job completing your study session!",
      });
      setRating(0);
      setNotes('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to finish session",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-0 shadow-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            🎉 Session Complete!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
            Take a moment to reflect on your learning and focus level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col items-center space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              How focused were you?
            </Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isStarred = (hoverRating || rating) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 duration-150"
                  >
                    <Star
                      size={32}
                      className={`${
                        isStarred
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      } transition-colors duration-150`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                {rating === 1 && "Very Distracted 🥱"}
                {rating === 2 && "Somewhat Focused 🫤"}
                {rating === 3 && "Focused 🙂"}
                {rating === 4 && "Highly Productive 🚀"}
                {rating === 5 && "Flow State Master 🧠"}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Reflections / Accomplishments
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you achieve? Any obstacles you overcame?"
              rows={4}
              className="resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Saving...' : 'Submit Reflection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
