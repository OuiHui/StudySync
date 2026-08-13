
import { useState, useEffect } from 'react';
import { Upload, X, File, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotesService, StudyGroupsService } from '@/services/database';
import { Switch } from '@/components/ui/switch';

interface UploadMaterialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  groupId?: string;
}

export const UploadMaterialPopup = ({ isOpen, onClose, onUploadSuccess, groupId }: UploadMaterialPopupProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubjects, setCustomSubjects] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(groupId ? [groupId] : []);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (groupId) {
        setSelectedGroups([groupId]);
      }
      loadData();
    }
  }, [isOpen, groupId]);

  const loadData = async () => {
    try {
      const [subjects, groups] = await Promise.all([
        NotesService.getUserSubjects(),
        StudyGroupsService.getUserGroups()
      ]);
      setCustomSubjects(subjects);
      setUserGroups(groups);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    try {
      const newSubject = await NotesService.createSubject(newSubjectName);
      setCustomSubjects(prev => [...prev, newSubject]);
      setSubject((newSubject as any)?.name || newSubjectName);
      setNewSubjectName('');
      setShowNewSubject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    }
  };

  const toggleGroupSelection = (groupIdToToggle: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupIdToToggle) 
        ? prev.filter(id => id !== groupIdToToggle)
        : [...prev, groupIdToToggle]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!subject) {
      setError('Subject is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let fileUrl = null;
      let fileName = null;

      if (file) {
        const targetGroupId = selectedGroups.length > 0 ? selectedGroups[0] : groupId;
        const uploadResult = await NotesService.uploadFile(file, targetGroupId);
        if (uploadResult) {
          fileUrl = uploadResult.url;
          fileName = uploadResult.fileName;
        }
      }

      const note = await NotesService.createNote({
        title: title.trim(),
        content: description || '',
        subject: subject,
        permission_level: isPrivate ? 'private' : (groupId ? 'group' : 'public'),
        group_id: groupId,
        file_url: fileUrl,
        file_name: fileName
      } as any);

      const groupsToShare = selectedGroups.length > 0 ? selectedGroups : (groupId ? [groupId] : []);
      if (note && groupsToShare.length > 0) {
        await NotesService.shareNoteWithGroups(note.id, groupsToShare);
      }

      setTitle('');
      setDescription('');
      setSubject('');
      setIsPrivate(false);
      setFile(null);
      setSelectedGroups(groupId ? [groupId] : []);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Upload size={18} />
            </div>
            Upload Study Material
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1.5">
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <div className="space-y-1">
            <Label htmlFor="file" className="text-sm font-semibold text-foreground">File</Label>
            <div className="mt-1">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-primary-foreground hover:file:bg-brand-hover cursor-pointer transition-colors shadow-sm"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              />
              {file && (
                <div className="mt-2 flex items-center text-xs font-semibold text-foreground">
                  <File size={14} className="mr-1.5 text-brand" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">
              Title <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title..."
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the material..."
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-brand focus-visible:border-brand text-sm leading-relaxed resize-y font-normal"
              rows={3}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="subject" className="text-sm font-semibold text-foreground">
                Subject <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center"
              >
                <Plus size={13} className="mr-0.5" />
                New Subject
              </button>
            </div>
            
            {showNewSubject ? (
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter new subject name..."
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-9 focus-visible:ring-brand text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleCreateSubject}
                  className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubject(false);
                    setNewSubjectName('');
                  }}
                  className="bg-card hover:bg-muted text-foreground border border-border rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            
            <Select value={subject} onValueChange={(val) => setSubject(val)}>
              <SelectTrigger className="w-full h-10 px-3.5 bg-muted/40 border border-border text-foreground rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand transition-all">
                <SelectValue placeholder="Select a subject..." />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border text-card-foreground shadow-2xl backdrop-blur-md rounded-xl z-50">
                {customSubjects.length === 0 ? (
                  <SelectItem value="_empty" disabled className="text-muted-foreground text-xs italic">
                    Create a subject first using + New Subject
                  </SelectItem>
                ) : (
                  customSubjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.name}>
                      {subj.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Toggle Switch */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
            <div>
              <Label htmlFor="privacy" className="text-sm font-semibold text-foreground cursor-pointer">
                Private Note
              </Label>
              <p className="text-xs text-muted-foreground">
                Only visible to you
              </p>
            </div>
            <Switch
              id="privacy"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !subject}
              className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

