import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudyGroupsService } from '@/services/database';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { StandardDialogContent, ModalHeader, FormLabel, ModalFooter } from '@/components/ui/modal-primitives';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateGroupDialogProps {
  onGroupCreated?: (newGroup?: any) => void;
}

export const CreateGroupDialog = ({ onGroupCreated }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    isPublic: true,
    maxMembers: 50
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setLoading(true);
    try {
      const group = await StudyGroupsService.createGroup({
        name: formData.name.trim(),
        subject: formData.subject.trim() || undefined,
        description: formData.description.trim() || undefined,
        is_public: formData.isPublic,
        max_members: formData.maxMembers
      });

      toast({
        title: "Success",
        description: "Study group created successfully!",
      });

      setFormData({
        name: '',
        subject: '',
        description: '',
        isPublic: true,
        maxMembers: 50
      });
      
      setOpen(false);
      onGroupCreated?.(group);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create study group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="bg-[#2a78d6] hover:bg-[#2268bc] text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm">
          <Plus size={16} />
          Create Group
        </button>
      </DialogTrigger>
      <StandardDialogContent size="lg">
        <ModalHeader title="Create Study Group" icon={<Users size={18} />} onClose={() => setOpen(false)} />

        <form onSubmit={handleSubmit} className="space-y-4 pt-1.5">
          <div className="space-y-1">
            <FormLabel htmlFor="name" required>Group name</FormLabel>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name..."
              required
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <FormLabel htmlFor="course">Course</FormLabel>
            <Input
              id="course"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g. CS 1331, MATH 1552..."
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the group..."
              rows={3}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
            />
          </div>
          
          <div className="space-y-1">
            <FormLabel htmlFor="maxMembers">Max Members</FormLabel>
            <Input
              id="maxMembers"
              type="number"
              min="2"
              max="100"
              value={formData.maxMembers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          {/* Who Can Join Switch */}
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-gray-200 dark:border-slate-700/80">
            <div>
              <FormLabel htmlFor="isPublic" className="cursor-pointer">
                Public group
              </FormLabel>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Anyone can search for and join this study group
              </p>
            </div>
            <Switch
              id="isPublic"
              aria-label="Public group"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
              disabled={loading}
            />
          </div>
          
          <ModalFooter onCancel={() => setOpen(false)}>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </ModalFooter>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
};
