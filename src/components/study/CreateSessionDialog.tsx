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
import { Calendar, Plus } from 'lucide-react';
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
    isPublic: false
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
      const { data: session, error } = await supabase
        .from('study_sessions')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          group_id: formData.groupId === 'none' ? null : formData.groupId || null,
          scheduled_start: formatForDatabase(formData.scheduledStart),
          scheduled_end: formatForDatabase(formData.scheduledEnd),
          max_participants: formData.maxParticipants,
          is_public: formData.isPublic,
          created_by: user.id,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id,
          is_attending: true
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
        isPublic: false
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

  // Get current date/time for min values in local timezone
  const now = new Date();
  const currentDateTime = now.toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white">
          <Plus size={16} className="mr-1" />
          Create Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar size={20} className="mr-2 text-foreground" />
            Create Study Session
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will you be studying?"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="groupId">Study Group (Optional)</Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group or leave blank for solo session" />
              </SelectTrigger>
              <SelectContent>
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
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Start Time *</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledStart: e.target.value }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                min={currentDateTime}
                required
                className="datetime-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">End Time *</Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                onFocus={() => setIsDateTimePickerOpen(true)}
                onBlur={() => setTimeout(() => setIsDateTimePickerOpen(false), 100)}
                min={formData.scheduledStart || currentDateTime}
                required
                className="datetime-input"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="50"
              value={formData.maxParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 20 }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="isPublic">Public session (visible to everyone)</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.scheduledStart || !formData.scheduledEnd}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};