import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudyGroupsService } from '@/services/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CreateSessionDialogProps {
  onSessionCreated?: () => void;
}

export const CreateSessionDialog = ({ onSessionCreated }: CreateSessionDialogProps) => {
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
    isPublic: false,
    subject: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's groups when dialog opens
  const loadGroups = async () => {
    if (!user) return;
    
    try {
      // Use the service layer instead of direct Supabase query to avoid RLS recursion
      const userGroups = await StudyGroupsService.getUserGroups();
      
      // Transform the data to the format expected by the dialog
      const transformedGroups = userGroups.map(group => ({
        id: group.id,
        name: group.name,
        subject: group.subject
      }));
      
      setGroups(transformedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      // Set empty array on error to prevent UI issues
      setGroups([]);
    }
  };

  // Helper function to convert datetime-local input to ISO string
  const formatForDatabase = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toISOString();
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing if datetime picker is open
    if (!newOpen && isDateTimePickerOpen) {
      return;
    }
    
    setOpen(newOpen);
    if (newOpen) {
      loadGroups();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.scheduledStart || !formData.scheduledEnd) return;

    setLoading(true);
    try {
      const basePayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        group_id: formData.groupId === 'none' ? null : formData.groupId || null,
        scheduled_start: formatForDatabase(formData.scheduledStart),
        scheduled_end: formatForDatabase(formData.scheduledEnd),
        max_participants: formData.maxParticipants,
        is_public: formData.isPublic,
        created_by: user.id,
        status: 'scheduled' as const
      };

      let session;
      let error;

      // Try inserting with the new fields first (subject, target_duration)
      const { data: mainData, error: mainError } = await supabase
        .from('study_sessions')
        .insert({
          ...basePayload,
          subject: formData.subject.trim() || null,
          target_duration: 25 * 60
        })
        .select()
        .single();

      if (mainError && (mainError.message?.includes('column') || mainError.code === 'PGRST204')) {
        console.warn('New database fields not supported. Retrying insert with fallback payload...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('study_sessions')
          .insert(basePayload)
          .select()
          .single();
        session = fallbackData;
        error = fallbackError;
      } else {
        session = mainData;
        error = mainError;
      }

      if (error) throw error;

      // Add creator as participant
      await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id,
          is_attending: true,
          role: 'host',
          status: 'active'
        });

      toast({
        title: "Success",
        description: "Study session created successfully!",
      });

      setFormData({
        title: '',
        description: '',
        groupId: '',
        scheduledStart: '',
        scheduledEnd: '',
        maxParticipants: 20,
        isPublic: false,
        subject: ''
      });
      
      setOpen(false);
      onSessionCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create study session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="bg-[#2a78d6] hover:bg-[#2268bc] text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm">
          <Plus size={16} />
          Create Session
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} />
            </div>
            Create Study Session
          </DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1.5">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Session title <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title..."
              required
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will you be studying?"
              rows={3}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Study Group (Optional)</Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              disabled={loading}
            >
              <SelectTrigger className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 focus:ring-[#2a78d6] text-sm font-semibold">
                <SelectValue placeholder="Select a group or leave blank for solo session" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1f2c] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-zinc-200">
                <SelectItem value="none">No group (solo session)</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} {group.subject && `(${group.subject})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subject" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Course (Optional)</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g. CS 2110"
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="scheduledStart" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Start time <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledStart: e.target.value }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                required
                disabled={loading}
                className="datetime-input bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="scheduledEnd" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                End time <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                required
                disabled={loading}
                className="datetime-input bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="maxParticipants" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="50"
              value={formData.maxParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 20 }))}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-gray-200 dark:border-slate-700/80">
            <Label htmlFor="isPublic" className="text-sm font-semibold text-gray-800 dark:text-zinc-200 cursor-pointer">
              Public session (visible to everyone)
            </Label>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              disabled={loading}
            />
          </div>
          
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.scheduledStart || !formData.scheduledEnd}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};