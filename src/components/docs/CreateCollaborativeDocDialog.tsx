import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateCollaborativeDocDialogProps {
  onDocumentCreated?: () => void;
}

export const CreateCollaborativeDocDialog = ({ onDocumentCreated }: CreateCollaborativeDocDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'study-notes',
    isPrivate: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const documentTypes = [
    { value: 'study-notes', label: 'Study Notes' },
    { value: 'lab-report', label: 'Lab Report' },
    { value: 'essay', label: 'Essay' },
    { value: 'problem-set', label: 'Problem Set' },
    { value: 'research', label: 'Research Document' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setLoading(true);
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          title: formData.title.trim(),
          content: `# ${formData.title}\n\n${formData.description || 'Start collaborating on this document...'}`,
          subject: formData.type,
          created_by: user.id,
          permission_level: formData.isPrivate ? 'private' : 'public',
          is_collaborative: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collaborative document created successfully!",
      });

      setFormData({
        title: '',
        description: '',
        type: 'study-notes',
        isPrivate: false
      });
      
      setOpen(false);
      onDocumentCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create collaborative document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white">
          <Plus size={16} className="mr-1" />
          New Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText size={20} className="mr-2" />
            Create Collaborative Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter document title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Initial Content</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add some initial content or outline..."
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="isPrivate"
              type="checkbox"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isPrivate">Private document (invite-only collaboration)</Label>
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
              disabled={loading || !formData.title.trim()}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};