import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Calendar, X, Loader2, Trash2 } from 'lucide-react';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EditSessionDialogProps {
  session: {
    id: string;
    title: string;
    description?: string;
    scheduled_start: string;
    scheduled_end: string;
    max_participants?: number;
    group_id?: string;
    status?: string;
    is_public?: boolean | null;
  };
  onSessionUpdated?: () => void;
  trigger?: React.ReactNode;
}

export const EditSessionDialog = ({ session, onSessionUpdated, trigger }: EditSessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    groupId: '',
    scheduledStart: '',
    scheduledEnd: '',
    maxParticipants: 20,
    status: 'scheduled',
    isPublic: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to convert date to local datetime string for input
  const formatForDateTimeInput = (dateString: string) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to convert datetime-local input to ISO string
  const formatForDatabase = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toISOString();
  };

  // Load user's groups when dialog opens
  const loadGroups = async () => {
    if (!user) return;
    try {
      const userGroups = await StudyGroupsService.getUserGroups();
      setGroups(userGroups.map(group => ({
        id: group.id,
        name: group.name,
        subject: group.subject
      })));
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };

  // Populate form data when session changes or dialog opens
  useEffect(() => {
    if (session && open) {
      setFormData({
        title: session.title || '',
        description: session.description || '',
        groupId: session.group_id || 'none',
        scheduledStart: session.scheduled_start ? formatForDateTimeInput(session.scheduled_start) : '',
        scheduledEnd: session.scheduled_end ? formatForDateTimeInput(session.scheduled_end) : '',
        maxParticipants: session.max_participants || 20,
        status: session.status || 'scheduled',
        isPublic: session.is_public ?? false
      });
      loadGroups();
    }
  }, [session, open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDateTimePickerOpen) {
      return;
    }
    setOpen(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.scheduledStart || !formData.scheduledEnd) return;

    setLoading(true);
    try {
      await StudySessionsService.updateSession(session.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        group_id: formData.groupId === 'none' ? null : formData.groupId || null,
        scheduled_start: formatForDatabase(formData.scheduledStart),
        scheduled_end: formatForDatabase(formData.scheduledEnd),
        max_participants: formData.maxParticipants,
        status: formData.status as any,
        is_public: formData.isPublic
      });

      toast({
        title: "Success",
        description: "Study session updated successfully!",
      });

      setOpen(false);
      onSessionUpdated?.();
    } catch (error: any) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update study session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this study session?')) return;

    setLoading(true);
    try {
      await StudySessionsService.deleteSession(session.id);

      toast({
        title: "Success",
        description: "Study session deleted successfully!",
      });

      setOpen(false);
      onSessionUpdated?.();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete study session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const currentDateTime = localNow.toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button type="button" className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
            <Edit size={14} />
            Edit
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Calendar size={18} />
            </div>
            Edit Study Session
          </DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1.5">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">
              Session title <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title..."
              required
              disabled={loading}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will you be studying?"
              rows={3}
              disabled={loading}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-brand focus-visible:border-brand text-sm leading-relaxed resize-y font-normal"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground">Study Group (Optional)</Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              disabled={loading}
            >
              <SelectTrigger className="bg-muted/40 border-border text-foreground rounded-lg h-10 focus:ring-brand text-sm font-semibold">
                <SelectValue placeholder="Select a group or leave blank for solo session" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="none">No group (solo session)</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} {group.subject && `(${group.subject})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="scheduledStart" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Start time <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <DateTimeInput
                id="scheduledStart"
                value={formData.scheduledStart}
                onChange={(v) => setFormData(prev => ({ ...prev, scheduledStart: v }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                min={currentDateTime}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="scheduledEnd" className="text-sm font-semibold text-foreground">
                End time <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <DateTimeInput
                id="scheduledEnd"
                value={formData.scheduledEnd}
                onChange={(v) => setFormData(prev => ({ ...prev, scheduledEnd: v }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                min={formData.scheduledStart || currentDateTime}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="maxParticipants" className="text-sm font-semibold text-foreground">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="50"
              value={formData.maxParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 20 }))}
              disabled={loading}
              className="bg-muted/60 border-border text-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              disabled={loading}
            >
              <SelectTrigger className="bg-muted/60 border-border text-foreground rounded-lg h-10 focus:ring-brand text-sm font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border">
            <Label htmlFor="isPublic" className="text-sm font-semibold text-foreground cursor-pointer">
              Public session (visible to everyone)
            </Label>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              disabled={loading}
            />
          </div>
          
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 h-10 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 size={15} />
              Delete Session
            </button>
            
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.scheduledStart || !formData.scheduledEnd}
                className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
              >
                {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                {loading ? 'Updating...' : 'Update Session'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
