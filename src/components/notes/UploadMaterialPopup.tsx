
import { useState, useEffect } from 'react';
import { Upload, X, File, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotesService, StudyGroupsService } from '@/services/database';
import { Checkbox } from '@/components/ui/checkbox';

interface UploadMaterialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const UploadMaterialPopup = ({ isOpen, onClose, onUploadSuccess }: UploadMaterialPopupProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('notes');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubjects, setCustomSubjects] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const categories = ['notes', 'flashcards', 'documents', 'study-guide'];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
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
        const targetGroupId = selectedGroups.length > 0 ? selectedGroups[0] : undefined;
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
        permission_level: isPrivate ? 'private' : 'public',
        file_url: fileUrl,
        file_name: fileName
      });

      if (note && selectedGroups.length > 0) {
        await NotesService.shareNoteWithGroups(note.id, selectedGroups);
      }

      setTitle('');
      setDescription('');
      setSubject('');
      setCategory('notes');
      setIsPrivate(false);
      setFile(null);
      setSelectedGroups([]);
      
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
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Upload size={18} />
            </div>
            Upload Study Material
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
            <Label htmlFor="file" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">File</Label>
            <div className="mt-1">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#2a78d6]/10 file:text-[#2a78d6] hover:file:bg-[#2a78d6]/20 cursor-pointer"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              />
              {file && (
                <div className="mt-2 flex items-center text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  <File size={14} className="mr-1.5 text-[#2a78d6]" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Title <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title..."
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the material..."
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
              rows={3}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="subject" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Subject <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="text-xs font-semibold text-[#2a78d6] hover:underline inline-flex items-center"
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
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-9 focus-visible:ring-[#2a78d6] text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleCreateSubject}
                  className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubject(false);
                    setNewSubjectName('');
                  }}
                  className="bg-white hover:bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg text-sm font-semibold focus:outline-none focus:border-[#2a78d6]"
              required
            >
              <option value="">Select a subject</option>
              {customSubjects.length === 0 ? (
                <option value="" disabled>Create a subject first using + New Subject</option>
              ) : (
                customSubjects.map(subj => (
                  <option key={subj.id} value={subj.name}>{subj.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg text-sm font-semibold focus:outline-none focus:border-[#2a78d6]"
            >
              <option value="notes">Notes</option>
              <option value="flashcards">Flashcards</option>
              <option value="documents">Documents</option>
              <option value="study-guide">Study Guide</option>
            </select>
          </div>

          {/* Privacy Toggle Switch */}
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-gray-200 dark:border-slate-700/80">
            <Label htmlFor="privacy" className="text-sm font-semibold text-gray-800 dark:text-zinc-200 cursor-pointer">
              Make this material private (only visible to you)
            </Label>
            <input
              id="privacy"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#2a78d6] focus:ring-[#2a78d6]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !subject}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
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

