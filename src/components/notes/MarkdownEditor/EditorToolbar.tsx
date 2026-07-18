import React from 'react';
import {
  Bold, Italic, Underline, Link as LinkIcon,
  List, ListOrdered, Table, Layers,
  ChevronDown, Undo2, Redo2,
} from 'lucide-react';

interface EditorToolbarProps {
  currentBlockStyle: string;
  canUndo: boolean;
  canRedo: boolean;
  onCommand: (command: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const BTN = 'p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors';
const DISABLED_BTN = `${BTN} disabled:opacity-40 disabled:hover:bg-transparent`;
const SEPARATOR = 'h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1';

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
  <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
    {/* Block style selector */}
    <div className="relative mr-1">
      <select
        value={currentBlockStyle}
        onChange={(e) => onCommand(e.target.value)}
        className="appearance-none pr-7 pl-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
      >
        <option value="p">Normal Text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 pointer-events-none text-gray-500" />
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
