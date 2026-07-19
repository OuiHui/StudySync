import { Plus, Edit, Share, BookOpen, Download, Save, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadMaterialPopup } from './UploadMaterialPopup';
import { MarkdownEditor } from './MarkdownEditor/index';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileViewer } from './FileViewer';
import { SharedNoteModal } from './SharedNoteModal';

export const NoteDialogs = (props: any) => {
  const {
    isCreateDialogOpen, setIsCreateDialogOpen, newNoteData, setNewNoteData, handleCreateNote, groups,
    editingNote, setEditingNote, editFormData, setEditFormData, handleSaveEdit, toggleGroupSelection,
    viewDialogOpen, setViewDialogOpen, viewingNote,
    shareDialogOpen, setShareDialogOpen, sharingNote, shareSelectedGroups, toggleShareGroupSelection, handleSaveShare,
    isUploadPopupOpen, setIsUploadPopupOpen, loadNotes
  } = props;

  return (
    <>
      <UploadMaterialPopup isOpen={isUploadPopupOpen} onClose={() => { setIsUploadPopupOpen(false); loadNotes(); }} />
      
      {/* Create Note */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newNoteData.title} onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newNoteData.subject || ''} onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, subject: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <MarkdownEditor value={newNoteData.content || ''} onChange={(val) => setNewNoteData((prev: any) => ({ ...prev, content: val }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setNewNoteData({ title: '', content: '', subject: '' }); }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleCreateNote} disabled={!newNoteData.title.trim()} className="bg-green-500 hover:bg-green-600 text-white"><Save className="h-4 w-4 mr-2" /> Create Note</Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Share className="h-5 w-5" /> Share Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {groups.length === 0 ? <div className="text-center py-8"><Users className="h-12 w-12 mx-auto mb-2 text-gray-400" /><p>No groups</p></div> : (
              <div className="space-y-2"><Label>Select Groups</Label><div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                {groups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox checked={shareSelectedGroups.includes(group.id)} onCheckedChange={() => toggleShareGroupSelection(group.id)} />
                    <label className="text-sm font-medium">{group.name}</label>
                  </div>
                ))}
              </div></div>
            )}
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => { setShareDialogOpen(false); setSharingNote(null); }}>Cancel</Button><Button onClick={handleSaveShare}>Save Sharing</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
