import { useRef, useState, useCallback } from 'react';

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 800;

interface EditorHistory {
  canUndo: boolean;
  canRedo: boolean;
  pushToHistory: (value: string) => void;
  undo: (onRestore: (value: string) => void) => void;
  redo: (onRestore: (value: string) => void) => void;
  resetHistory: (value: string) => void;
  isUndoRedo: () => boolean;
  debounceMs: number;
}

export function useEditorHistory(initialValue: string): EditorHistory {
  const historyRef = useRef<string[]>([initialValue]);
  const indexRef = useRef<number>(0);
  const isUndoRedoRef = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncState = () => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  };

  const pushToHistory = useCallback((value: string) => {
    if (isUndoRedoRef.current) return;
    const history = historyRef.current;
    if (history[indexRef.current] === value) return;

    const next = history.slice(0, indexRef.current + 1);
    next.push(value);
    if (next.length > MAX_HISTORY) next.shift();

    historyRef.current = next;
    indexRef.current = next.length - 1;
    syncState();
  }, []);

  const undo = useCallback((onRestore: (value: string) => void) => {
    if (indexRef.current <= 0) return;
    isUndoRedoRef.current = true;
    indexRef.current -= 1;
    onRestore(historyRef.current[indexRef.current]);
    syncState();
    setTimeout(() => { isUndoRedoRef.current = false; }, 50);
  }, []);

  const redo = useCallback((onRestore: (value: string) => void) => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    indexRef.current += 1;
    onRestore(historyRef.current[indexRef.current]);
    syncState();
    setTimeout(() => { isUndoRedoRef.current = false; }, 50);
  }, []);

  const resetHistory = useCallback((value: string) => {
    historyRef.current = [value];
    indexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    canUndo,
    canRedo,
    pushToHistory,
    undo,
    redo,
    resetHistory,
    isUndoRedo: () => isUndoRedoRef.current,
    debounceMs: DEBOUNCE_MS,
  };
}
