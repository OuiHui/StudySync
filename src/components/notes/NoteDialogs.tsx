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
        <DialogContent className="max-w-4xl max-h-[90vh] w-full bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <FilePlus size={18} />
              </div>
              Create New Note
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(false)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] pt-1.5 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="note-title" className="text-sm font-semibold text-foreground">
                  Title <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="note-title"
                  value={newNoteData.title}
                  onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Subject</Label>
                <Input
                  value={newNoteData.subject || ''}
                  onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Mathematics"
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-foreground">Content</Label>
              <MarkdownEditor value={newNoteData.content || ''} onChange={(val) => setNewNoteData((prev: any) => ({ ...prev, content: val }))} minHeight="200px" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => { setIsCreateDialogOpen(false); setNewNoteData({ title: '', content: '', subject: '' }); }}
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={!newNoteData.title.trim()}
              className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200 inline-flex gap-1.5"
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
        <DialogContent className="max-w-md w-full bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Share size={18} />
              </div>
              Share Note
            </DialogTitle>
            <button
              type="button"
              onClick={() => setShareDialogOpen(false)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </DialogHeader>
          <div className="space-y-4 pt-1.5">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-semibold text-muted-foreground">No study groups available</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Select Groups</Label>
                <div className="border border-border rounded-xl p-3 space-y-2.5 max-h-64 overflow-y-auto bg-muted/40">
                  {groups.map((group: any) => (
                    <div key={group.id} className="flex items-center space-x-2.5">
                      <Checkbox checked={shareSelectedGroups.includes(group.id)} onCheckedChange={() => toggleShareGroupSelection(group.id)} />
                      <label className="text-sm font-semibold text-foreground cursor-pointer">{group.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => { setShareDialogOpen(false); setSharingNote(null); }}
                className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold flex items-center justify-center transition-all duration-200"
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

