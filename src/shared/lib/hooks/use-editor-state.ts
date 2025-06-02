'use client';

import { useState, useCallback, useRef } from 'react';
import { EditorState, EditorAction } from '../../types/editor';

interface UseEditorStateOptions {
  maxHistorySize?: number;
  onStateChange?: (state: EditorState) => void;
}

export function useEditorState(options: UseEditorStateOptions = {}) {
  const { maxHistorySize = 50, onStateChange } = options;
  
  // 基本状態
  const [state, setState] = useState<EditorState>({
    isModified: false,
    canUndo: false,
    canRedo: false,
    selectedElements: new Set<string>(),
    clipboard: null,
  });

  // 履歴管理
  const historyRef = useRef<EditorAction[]>([]);
  const historyIndexRef = useRef(-1);

  // 状態更新
  const updateState = useCallback((newState: Partial<EditorState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      onStateChange?.(updated);
      return updated;
    });
  }, [onStateChange]);

  // アクション実行
  const executeAction = useCallback((action: EditorAction) => {
    // 現在位置以降の履歴をクリア
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    // 新しいアクションを追加
    historyRef.current.push(action);
    historyIndexRef.current = historyRef.current.length - 1;

    // 履歴サイズ制限
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(-maxHistorySize);
      historyIndexRef.current = historyRef.current.length - 1;
    }

    // Undo/Redo状態を更新
    updateState({
      isModified: true,
      canUndo: historyRef.current.length > 0,
      canRedo: false,
    });
  }, [maxHistorySize, updateState]);

  // Undo機能
  const undo = useCallback(() => {
    if (historyIndexRef.current >= 0) {
      historyIndexRef.current--;
      updateState({
        canUndo: historyIndexRef.current >= 0,
        canRedo: true,
      });
      return historyRef.current[historyIndexRef.current + 1];
    }
    return null;
  }, [updateState]);

  // Redo機能
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      updateState({
        canUndo: true,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
      });
      return historyRef.current[historyIndexRef.current];
    }
    return null;
  }, [updateState]);

  // 要素選択管理
  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    setState(prev => {
      const newSelection = new Set(multiSelect ? prev.selectedElements : []);
      
      if (multiSelect && newSelection.has(elementId)) {
        newSelection.delete(elementId);
      } else {
        newSelection.add(elementId);
      }

      return {
        ...prev,
        selectedElements: newSelection,
      };
    });
  }, []);

  // 選択クリア
  const clearSelection = useCallback(() => {
    updateState({
      selectedElements: new Set<string>(),
    });
  }, [updateState]);

  // クリップボード操作
  const copyToClipboard = useCallback((data: unknown) => {
    updateState({
      clipboard: data,
    });
  }, [updateState]);

  // 変更状態リセット
  const markAsSaved = useCallback(() => {
    updateState({
      isModified: false,
    });
  }, [updateState]);

  // 履歴クリア
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
    updateState({
      canUndo: false,
      canRedo: false,
    });
  }, [updateState]);

  return {
    // 状態
    state,
    
    // アクション
    executeAction,
    undo,
    redo,
    
    // 選択管理
    selectElement,
    clearSelection,
    
    // クリップボード
    copyToClipboard,
    
    // その他
    markAsSaved,
    clearHistory,
  };
} 