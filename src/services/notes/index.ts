import { NotesQueries } from './queries';
import { NotesMutations } from './mutations';

export class NotesService {
  // Queries
  static getNotes = NotesQueries.getNotes;
  static getGroupNotes = NotesQueries.getGroupNotes;
  static getNote = NotesQueries.getNote;
  static getUserSubjects = NotesQueries.getUserSubjects;
  static getNoteSharedGroups = NotesQueries.getNoteSharedGroups;
  static getGroupSharedNotes = NotesQueries.getGroupSharedNotes;

  // Mutations
  static createNote = NotesMutations.createNote;
  static updateNote = NotesMutations.updateNote;
  static deleteNote = NotesMutations.deleteNote;
  static uploadFile = NotesMutations.uploadFile;
  static createSubject = NotesMutations.createSubject;
  static deleteSubject = NotesMutations.deleteSubject;
  static shareNoteWithGroups = NotesMutations.shareNoteWithGroups;
}
