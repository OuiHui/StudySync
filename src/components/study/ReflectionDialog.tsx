import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles, X, Loader2 } from 'lucide-react';
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
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} />
            </div>
            Session Complete!
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1.5">
          <div className="flex flex-col items-center space-y-2 p-4 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-gray-200 dark:border-slate-700/80">
            <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              How focused were you? <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="flex space-x-1.5">
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
                      size={28}
                      className={`${isStarred
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 dark:text-slate-600'
                        } transition-colors duration-150`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <span className="text-xs font-semibold text-[#2a78d6]">
                {rating === 1 && "Very Distracted 🥱"}
                {rating === 2 && "Somewhat Focused 🫤"}
                {rating === 3 && "Focused 🙂"}
                {rating === 4 && "Highly Productive 🚀"}
                {rating === 5 && "Flow State Master 🧠"}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Reflections / Accomplishments
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you achieve? Any obstacles you overcame?"
              rows={3}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {loading ? 'Saving...' : 'Submit Reflection'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
