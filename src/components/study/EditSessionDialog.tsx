import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Calendar } from 'lucide-react';
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
    status: 'scheduled'
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to convert date to local datetime string for input
  const formatForDateTimeInput = (dateString: string) => {
    const date = new Date(dateString);
    // Get local timezone offset and adjust
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to convert datetime-local input to ISO string
  const formatForDatabase = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toISOString();
  };

  // Initialize form data when session prop changes
  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        description: session.description || '',
        groupId: session.group_id || 'none',
        scheduledStart: formatForDateTimeInput(session.scheduled_start),
        scheduledEnd: formatForDateTimeInput(session.scheduled_end),
        maxParticipants: session.max_participants || 20,
        status: session.status || 'scheduled'
      });
    }
  }, [session]);

  // Load user's groups when dialog opens
  const loadGroups = async () => {
    if (!user) return;
    
    try {
      const userGroups = await StudyGroupsService.getUserGroups();
      
      const transformedGroups = userGroups.map(group => ({
        id: group.id,
        name: group.name,
        subject: group.subject
      }));
      
      setGroups(transformedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
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
      await StudySessionsService.updateSession(session.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        group_id: formData.groupId === 'none' ? null : formData.groupId || null,
        scheduled_start: formatForDatabase(formData.scheduledStart),
        scheduled_end: formatForDatabase(formData.scheduledEnd),
        max_participants: formData.maxParticipants,
        status: formData.status as any
      });

      toast({
        title: "Success",
        description: "Study session updated successfully!",
      });
      
      setOpen(false);
      onSessionUpdated?.();
    } catch (error: any) {
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
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

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
      toast({
        title: "Error",
        description: error.message || "Failed to delete study session",
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
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar size={20} className="mr-2 text-foreground" />
            Edit Study Session
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
            <Label>Study Group (Optional)</Label>
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
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Session
            </Button>
            
            <div className="flex space-x-2">
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
                {loading ? 'Updating...' : 'Update Session'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
