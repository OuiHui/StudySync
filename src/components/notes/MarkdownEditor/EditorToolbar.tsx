import React from 'react';
import {
  Bold, Italic, Underline, Link as LinkIcon,
  List, ListOrdered, Table, Layers,
  Undo2, Redo2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditorToolbarProps {
  currentBlockStyle: string;
  canUndo: boolean;
  canRedo: boolean;
  onCommand: (command: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const BTN = 'p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors';
const DISABLED_BTN = `${BTN} disabled:opacity-40 disabled:hover:bg-transparent`;
const SEPARATOR = 'h-4 w-px bg-border mx-1';

const cmd = (handler: (cmd: string) => void, command: string) =>
  (e: React.MouseEvent) => { e.preventDefault(); handler(command); };

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentBlockStyle,
  canUndo,
  canRedo,
  onCommand,
  onUndo,
  onRedo,
}) => (
  <div className="flex flex-wrap items-center gap-1 p-2 bg-card text-card-foreground border-b border-border">
    {/* Block style selector with smooth dropdown transition */}
    <div className="mr-1">
      <Select value={currentBlockStyle} onValueChange={(val) => onCommand(val)}>
        <SelectTrigger className="h-8 w-[130px] px-2.5 text-xs bg-card border border-border rounded-md hover:bg-muted text-foreground font-medium transition-all duration-200 focus:ring-1 focus:ring-brand">
          <SelectValue placeholder="Text type" />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground border border-border z-50">
          <SelectItem value="p" className="text-xs font-medium cursor-pointer">Normal Text</SelectItem>
          <SelectItem value="h1" className="text-xs font-bold cursor-pointer">Heading 1</SelectItem>
          <SelectItem value="h2" className="text-xs font-bold cursor-pointer">Heading 2</SelectItem>
          <SelectItem value="h3" className="text-xs font-bold cursor-pointer">Heading 3</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Undo / Redo */}
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onUndo(); }} disabled={!canUndo} title="Undo (Ctrl+Z)" className={DISABLED_BTN}>
      <Undo2 className="h-4 w-4" />
    </button>
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onRedo(); }} disabled={!canRedo} title="Redo (Ctrl+Y)" className={DISABLED_BTN}>
      <Redo2 className="h-4 w-4" />
    </button>

    <div className={SEPARATOR} />

    {/* Text formatting */}
    <button type="button" onMouseDown={cmd(onCommand, 'bold')} title="Bold" className={BTN}><Bold className="h-4 w-4" /></button>
    <button type="button" onMouseDown={cmd(onCommand, 'italic')} title="Italic" className={BTN}><Italic className="h-4 w-4" /></button>
    <button type="button" onMouseDown={cmd(onCommand, 'underline')} title="Underline" className={BTN}><Underline className="h-4 w-4" /></button>

    <div className={SEPARATOR} />

    {/* Inline / list */}
    <button type="button" onMouseDown={cmd(onCommand, 'link')} title="Add Link" className={BTN}><LinkIcon className="h-4 w-4" /></button>
    <button type="button" onMouseDown={cmd(onCommand, 'bullet')} title="Bullet List" className={BTN}><List className="h-4 w-4" /></button>
    <button type="button" onMouseDown={cmd(onCommand, 'number')} title="Numbered List" className={BTN}><ListOrdered className="h-4 w-4" /></button>

    <div className={SEPARATOR} />

    {/* Block inserts */}
    <button type="button" onMouseDown={cmd(onCommand, 'details')} title="Insert Details Accordion" className={BTN}><Layers className="h-4 w-4" /></button>
    <button type="button" onMouseDown={cmd(onCommand, 'table')} title="Insert Table" className={BTN}><Table className="h-4 w-4" /></button>
  </div>
);
