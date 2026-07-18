import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { useEditorHistory } from './useEditorHistory';
import { markdownToHtml, htmlToMarkdown } from './markdownUtils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  placeholder?: string;
  className?: string;
}

const EMPTY_EDITOR = '<p><br></p>';

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onCursorChange,
  placeholder = 'Write something...',
  className = '',
}) => {
  const [isRichText, setIsRichText] = useState(true);
  const [currentBlockStyle, setCurrentBlockStyle] = useState('p');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef('');
  const localValueRef = useRef(value);
  const lastRenderedValueRef = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastHistorySaveValueRef = useRef(value);

  const history = useEditorHistory(value);

  // --- Sync parent value → rich-text DOM ---
  useEffect(() => {
    if (!isRichText || !editorRef.current) return;
    if (
      value === lastRenderedValueRef.current ||
      (lastRenderedValueRef.current !== null && value === localValueRef.current)
    ) return;

    const html = markdownToHtml(value);
    editorRef.current.innerHTML = html || EMPTY_EDITOR;
    localValueRef.current = value;
    lastHtmlRef.current = html;
    lastRenderedValueRef.current = value;

    if (!history.isUndoRedo()) {
      history.resetHistory(value);
      lastHistorySaveValueRef.current = value;
    }
  }, [value, isRichText, history]);

  // --- Debounce-push typing to undo history ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== lastHistorySaveValueRef.current) {
        history.pushToHistory(value);
        lastHistorySaveValueRef.current = value;
      }
    }, history.debounceMs);
    return () => clearTimeout(timer);
  }, [value, history]);

  // --- Restore a value from undo/redo ---
  const restoreValue = useCallback((restored: string) => {
    localValueRef.current = restored;
    lastRenderedValueRef.current = restored;
    lastHistorySaveValueRef.current = restored;
    onChange(restored);

    if (isRichText && editorRef.current) {
      const html = markdownToHtml(restored);
      editorRef.current.innerHTML = html || EMPTY_EDITOR;
      lastHtmlRef.current = html;
      editorRef.current.focus();
    } else if (!isRichText && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRichText, onChange]);

  const handleUndo = useCallback(() => history.undo(restoreValue), [history, restoreValue]);
  const handleRedo = useCallback(() => history.redo(restoreValue), [history, restoreValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      handleRedo();
    }
  };

  // --- Selection tracking ---
  const getBlockStyleAtCursor = useCallback((): string => {
    if (!isRichText) return 'p';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'p';
    try {
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'p'].includes(tag)) return tag;
        }
        node = node.parentNode;
      }
    } catch { /* safe in non-DOM envs */ }
    return 'p';
  }, [isRichText]);

  const handleSelectionChange = useCallback(() => {
    if (isRichText && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range;
        }
      }
      setCurrentBlockStyle(getBlockStyleAtCursor());
    }

    if (!onCursorChange) return;

    if (isRichText && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        onCursorChange(preCaretRange.toString().length);
      }
    } else if (!isRichText && textareaRef.current) {
      onCursorChange(textareaRef.current.selectionStart);
    }
  }, [isRichText, onCursorChange, getBlockStyleAtCursor]);

  // --- Content change handlers ---
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastHtmlRef.current = html;
    const markdown = htmlToMarkdown(html);
    localValueRef.current = markdown;
    lastRenderedValueRef.current = markdown;
    onChange(markdown);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    localValueRef.current = val;
    lastRenderedValueRef.current = val;
    onChange(val);
  };

  // --- Mode switching ---
  const toggleEditorMode = () => {
    if (isRichText) {
      if (editorRef.current) {
        const markdown = htmlToMarkdown(editorRef.current.innerHTML);
        localValueRef.current = markdown;
        lastRenderedValueRef.current = markdown;
        onChange(markdown);
      }
      setIsRichText(false);
    } else {
      const html = markdownToHtml(value);
      setIsRichText(true);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html || EMPTY_EDITOR;
          lastHtmlRef.current = html;
          lastRenderedValueRef.current = value;
        }
      }, 0);
    }
  };

  // --- Toolbar command dispatch ---
  const handleCommand = (command: string) => {
    if (isRichText) {
      executeRichTextCommand(command);
    } else {
      executeMarkdownCommand(command);
    }
  };

  const executeRichTextCommand = (command: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }

    if (['h1', 'h2', 'h3', 'p'].includes(command)) {
      const tag = command.toUpperCase();
      try {
        document.execCommand('formatBlock', false, `<${tag}>`);
      } catch {
        try { document.execCommand('formatBlock', false, tag); } catch (err) {
          console.error('formatBlock failed:', err);
        }
      }
      setCurrentBlockStyle(command);
    } else if (command === 'bold') {
      document.execCommand('bold', false);
    } else if (command === 'italic') {
      document.execCommand('italic', false);
    } else if (command === 'underline') {
      document.execCommand('underline', false);
    } else if (command === 'bullet') {
      document.execCommand('insertUnorderedList', false);
    } else if (command === 'number') {
      document.execCommand('insertOrderedList', false);
    } else if (command === 'link') {
      const url = prompt('Enter the link URL:');
      if (url) document.execCommand('createLink', false, url);
    } else if (command === 'code') {
      insertRichTextNode(() => {
        const code = document.createElement('code');
        code.className = 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono';
        return code;
      });
    } else if (command === 'details') {
      insertRichTextNode((selectedText) => {
        const details = document.createElement('details');
        details.className = 'border rounded-md p-3 my-2 bg-gray-50 dark:bg-gray-900/30';
        const summary = document.createElement('summary');
        summary.className = 'cursor-pointer font-semibold text-sm select-none';
        summary.textContent = 'Summary (Click to expand)';
        const div = document.createElement('div');
        div.className = 'mt-2 text-sm text-gray-700 dark:text-gray-300';
        div.textContent = selectedText || 'Details content goes here...';
        details.append(summary, div);
        return details;
      }, true);
    } else if (command === 'table') {
      insertRichTextNode(() => {
        const table = document.createElement('table');
        table.className = 'border-collapse border border-gray-300 dark:border-gray-700 w-full my-4 text-sm';
        table.innerHTML = `
          <thead><tr>
            <th class="border border-gray-300 dark:border-gray-700 p-2 text-left bg-gray-50 dark:bg-gray-900/50">Header 1</th>
            <th class="border border-gray-300 dark:border-gray-700 p-2 text-left bg-gray-50 dark:bg-gray-900/50">Header 2</th>
          </tr></thead>
          <tbody><tr>
            <td class="border border-gray-300 dark:border-gray-700 p-2">Cell 1</td>
            <td class="border border-gray-300 dark:border-gray-700 p-2">Cell 2</td>
          </tr></tbody>`;
        return table;
      });
    }

    const html = editorRef.current.innerHTML;
    lastHtmlRef.current = html;
    const markdown = htmlToMarkdown(html);
    localValueRef.current = markdown;
    lastRenderedValueRef.current = markdown;
    onChange(markdown);
    history.pushToHistory(markdown);
    lastHistorySaveValueRef.current = markdown;
  };

  /** Inserts a DOM node at the current selection. If useSelectedText=true, the
   *  factory receives the selected text and is responsible for incorporating it. */
  const insertRichTextNode = (
    factory: (selectedText: string) => HTMLElement,
    useSelectedText = false,
  ) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    const node = factory(selectedText);
    if (!useSelectedText && selectedText) {
      node.textContent = selectedText;
    }
    range.deleteContents();
    range.insertNode(node);
  };

  const executeMarkdownCommand = (command: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const { selectionStart: start, selectionEnd: end, value: text } = textarea;
    const selected = text.substring(start, end);

    const result = buildMarkdownReplacement(command, selected);
    if (!result) return;

    const { replacement, offsetStart, offsetEnd } = result;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    localValueRef.current = newValue;
    lastRenderedValueRef.current = newValue;
    onChange(newValue);
    history.pushToHistory(newValue);
    lastHistorySaveValueRef.current = newValue;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
    }, 0);
  };

  const buildMarkdownReplacement = (
    command: string,
    selected: string,
  ): { replacement: string; offsetStart: number; offsetEnd: number } | null => {
    switch (command) {
      case 'bold': {
        const r = `**${selected || 'bold text'}**`;
        return { replacement: r, offsetStart: 2, offsetEnd: r.length - 2 };
      }
      case 'italic': {
        const r = `*${selected || 'italic text'}*`;
        return { replacement: r, offsetStart: 1, offsetEnd: r.length - 1 };
      }
      case 'underline': {
        const r = `<u>${selected || 'underlined text'}</u>`;
        return { replacement: r, offsetStart: 3, offsetEnd: r.length - 4 };
      }
      case 'link': {
        const url = prompt('Enter URL:');
        if (url === null) return null;
        const r = `[${selected || 'link text'}](${url})`;
        return { replacement: r, offsetStart: 1, offsetEnd: selected ? selected.length + 1 : 10 };
      }
      case 'bullet': {
        const r = selected ? selected.split('\n').map(l => `- ${l}`).join('\n') : '- item';
        return { replacement: r, offsetStart: 2, offsetEnd: r.length };
      }
      case 'number': {
        const r = selected
          ? selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
          : '1. item';
        return { replacement: r, offsetStart: 3, offsetEnd: r.length };
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'p': {
        const level = command === 'h1' ? 1 : command === 'h2' ? 2 : command === 'h3' ? 3 : 0;
        const prefix = level > 0 ? '#'.repeat(level) + ' ' : '';
        if (!selected) {
          const r = level > 0 ? `\n${prefix}Heading\n` : '';
          return { replacement: r, offsetStart: level > 0 ? prefix.length + 1 : 0, offsetEnd: r.length > 0 ? r.length - 1 : 0 };
        }
        const lines = selected.split('\n').map(l => l.replace(/^#+\s+/, ''));
        const r = lines.map(l => `${prefix}${l}`).join('\n');
        return { replacement: r, offsetStart: prefix.length, offsetEnd: r.length };
      }
      case 'details': {
        const r = `<details>\n<summary>${selected || 'Summary'}</summary>\n\nDetails content\n</details>`;
        return { replacement: r, offsetStart: 10, offsetEnd: selected ? 10 + selected.length : 17 };
      }
      case 'table': {
        const r = `\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`;
        return { replacement: r, offsetStart: r.length, offsetEnd: r.length };
      }
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${className}`}>
      <EditorToolbar
        currentBlockStyle={currentBlockStyle}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onCommand={handleCommand}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="relative flex-1 min-h-[300px] overflow-y-auto">
        {isRichText ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className="prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none overflow-y-auto"
            style={{ minHeight: '300px' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            placeholder={placeholder}
            className="w-full min-h-[300px] p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-0 focus:outline-none focus:ring-0 resize-y"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 select-none">
        <button
          type="button"
          onClick={toggleEditorMode}
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {isRichText ? 'Switch to plain text editing' : 'Switch to rich text editing'}
        </button>
        <span className="flex items-center gap-1 font-semibold border px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          Markdown Supported
        </span>
      </div>
    </div>
  );
};
