import { Plus, Share, Save, X, Users, FilePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadMaterialPopup } from './UploadMaterialPopup';
import { MarkdownEditor } from './MarkdownEditor/index';
import { SharedNoteModal } from './SharedNoteModal';

export const NoteDialogs = (props: any) => {
  const {
    isCreateDialogOpen, setIsCreateDialogOpen, newNoteData, setNewNoteData, handleCreateNote, groups,
    editingNote, setEditingNote, setEditFormData, handleSaveEdit,
    viewDialogOpen, setViewDialogOpen, viewingNote,
    shareDialogOpen, setShareDialogOpen, setSharingNote, shareSelectedGroups, toggleShareGroupSelection, handleSaveShare,
    isUploadPopupOpen, setIsUploadPopupOpen, loadNotes
  } = props;

  return (
    <>
      <UploadMaterialPopup isOpen={isUploadPopupOpen} onClose={() => { setIsUploadPopupOpen(false); loadNotes(); }} />
      
      {/* Create Note */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
                <FilePlus size={18} />
              </div>
              Create New Note
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(false)}
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
              title="Close"
            >
              <X size={18} />
            </button>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] pt-1.5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Title <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  value={newNoteData.title}
                  onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Subject</Label>
                <Input
                  value={newNoteData.subject || ''}
                  onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Mathematics"
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Content</Label>
              <MarkdownEditor value={newNoteData.content || ''} onChange={(val) => setNewNoteData((prev: any) => ({ ...prev, content: val }))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-200 dark:border-slate-700/80 pt-4">
            <button
              type="button"
              onClick={() => { setIsCreateDialogOpen(false); setNewNoteData({ title: '', content: '', subject: '' }); }}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={!newNoteData.title.trim()}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200 inline-flex gap-1.5"
            >
              <Save className="h-4 w-4" /> Create Note
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared Note Modal for Edit / View */}
      <SharedNoteModal
        note={editingNote || viewingNote}
        isOpen={!!editingNote || viewDialogOpen}
        onClose={() => {
          setEditingNote(null);
          setViewDialogOpen(false);
        }}
        onSave={editingNote ? async (noteId, updates) => {
          setEditFormData((prev: any) => ({
            ...prev,
            title: updates.title,
            content: updates.content,
            subject: updates.subject
          }));
          await handleSaveEdit();
        } : undefined}
      />

      {/* Share Note */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
                <Share size={18} />
              </div>
              Share Note
            </DialogTitle>
            <button
              type="button"
              onClick={() => setShareDialogOpen(false)}
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
              title="Close"
            >
              <X size={18} />
            </button>
          </DialogHeader>
          <div className="space-y-4 pt-1.5">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400">No study groups available</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Select Groups</Label>
                <div className="border border-gray-200 dark:border-slate-700/80 rounded-xl p-3 space-y-2.5 max-h-64 overflow-y-auto bg-gray-100 dark:bg-[#12151e]">
                  {groups.map((group: any) => (
                    <div key={group.id} className="flex items-center space-x-2.5">
                      <Checkbox checked={shareSelectedGroups.includes(group.id)} onCheckedChange={() => toggleShareGroupSelection(group.id)} />
                      <label className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">{group.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => { setShareDialogOpen(false); setSharingNote(null); }}
                className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold flex items-center justify-center transition-all duration-200"
              >
                Save Sharing
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

