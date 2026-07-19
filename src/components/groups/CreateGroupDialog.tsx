import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudyGroupsService } from '@/services/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, X, Loader2 } from 'lucide-react';
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
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Users size={18} />
            </div>
            Create Study Group
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-1.5">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Group name <span className="text-red-500 ml-0.5">*</span>
            </Label>
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
            <Label htmlFor="course" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Course</Label>
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
            <Label htmlFor="description" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Description</Label>
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
            <Label htmlFor="maxMembers" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Max Members</Label>
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
              <Label htmlFor="isPublic" className="text-sm font-semibold text-gray-800 dark:text-zinc-200 cursor-pointer">
                Public group
              </Label>
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
              disabled={loading || !formData.name.trim()}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};