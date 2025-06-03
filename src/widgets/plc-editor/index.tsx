'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PLCViewType } from '@/shared/types/plc';
import { LadderEditor } from '../../features/ladder-editor/components/ladder-editor';
import { SFCEditor } from '../../features/sfc-editor/components/sfc-editor';
import { LadderInSTEditor } from '../../features/ladder-in-st-editor/components/ladder-in-st-editor';
import { PLCASTConverter } from '@/shared/lib/ast/converter';

// 各ビューの状態を管理するインターフェース
interface ViewState {
  sourceCode: string;
  lastModified: number;
  hasChanges: boolean;
}

export default function PLCEditor(): JSX.Element {
  const [currentView, setCurrentView] = useState<PLCViewType>(PLCViewType.LD);
  
  // 各ビューの状態を個別管理
  const [viewStates, setViewStates] = useState<Record<PLCViewType, ViewState>>({
    [PLCViewType.ST]: {
      sourceCode: '// Structured Text Code\n// ラダー図から生成されたSTコードがここに表示されます\n\n// LDタブでラダー図を作成してください',
      lastModified: Date.now(),
      hasChanges: false
    },
    [PLCViewType.LD]: {
      sourceCode: '',
      lastModified: Date.now(),
      hasChanges: false
    },
    [PLCViewType.SFC]: {
      sourceCode: '',
      lastModified: Date.now(),
      hasChanges: false
    },
    [PLCViewType.LADDER_IN_ST]: {
      sourceCode: '',
      lastModified: Date.now(),
      hasChanges: false
    }
  });

  // 変換履歴と同期状態
  const [conversionHistory, setConversionHistory] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [lastConvertedView, setLastConvertedView] = useState<PLCViewType | null>(null);

  const views = [
    { id: PLCViewType.ST, name: 'ST', label: 'Structured Text', icon: '📝' },
    { id: PLCViewType.LD, name: 'LD', label: 'Ladder Diagram', icon: '🪜' },
    { id: PLCViewType.SFC, name: 'SFC', label: 'Sequential Function Chart', icon: '🔄' },
    { id: PLCViewType.LADDER_IN_ST, name: 'LD-ST', label: 'Ladder in ST', icon: '🔗' },
  ];

  // AST変換エンジンインスタンス
  const converter = useMemo(() => PLCASTConverter.getInstance(), []);

  // エディタからのコード変更を受け取る統一ハンドラー
  const handleCodeChange = useCallback((sourceCode: string, sourceView: PLCViewType) => {
    setViewStates((prev: Record<PLCViewType, ViewState>) => ({
      ...prev,
      [sourceView]: {
        sourceCode,
        lastModified: Date.now(),
        hasChanges: true
      }
    }));

    // 履歴に追加
    const historyEntry = `${new Date().toLocaleTimeString()} - ${sourceView} エディタで変更`;
    setConversionHistory((prev: string[]) => [historyEntry, ...prev.slice(0, 4)]);
  }, []);

  // ビュー固有のコード変更ハンドラー
  const handleLDCodeChange = useCallback((code: string) => {
    handleCodeChange(code, PLCViewType.LD);
  }, [handleCodeChange]);

  const handleSFCCodeChange = useCallback((code: string) => {
    handleCodeChange(code, PLCViewType.SFC);
  }, [handleCodeChange]);

  const handleLDSTCodeChange = useCallback((code: string) => {
    handleCodeChange(code, PLCViewType.LADDER_IN_ST);
  }, [handleCodeChange]);

  const handleSTCodeChange = useCallback((code: string) => {
    handleCodeChange(code, PLCViewType.ST);
  }, [handleCodeChange]);

  // タブ切替時の自動変換
  const handleViewChange = useCallback(async (newView: PLCViewType) => {
    if (newView === currentView) return;

    setIsConverting(true);
    
    try {
      // 現在のビューに変更があれば、他のビューに変換
      const currentState = viewStates[currentView];
      if (currentState.hasChanges && currentState.sourceCode.trim()) {
        
        // AST変換を実行
        const parseResult = converter.parseToAST(currentState.sourceCode, currentView);
        
        if (parseResult.success) {
          // 対象ビューに変換
          const convertResult = converter.convertToView(parseResult.ast, newView);
          
          if (convertResult.success) {
            setViewStates((prev: Record<PLCViewType, ViewState>) => ({
              ...prev,
              [newView]: {
                sourceCode: convertResult.sourceCode,
                lastModified: Date.now(),
                hasChanges: false
              }
            }));

            // 変換履歴に追加
            const historyEntry = `${new Date().toLocaleTimeString()} - ${currentView}→${newView} 自動変換完了`;
            setConversionHistory((prev: string[]) => [historyEntry, ...prev.slice(0, 4)]);
            setLastConvertedView(newView);
          }
        }
      }
    } catch (error) {
      console.error('変換エラー:', error);
      const historyEntry = `${new Date().toLocaleTimeString()} - ${currentView}→${newView} 変換失敗`;
      setConversionHistory((prev: string[]) => [historyEntry, ...prev.slice(0, 4)]);
    } finally {
      setIsConverting(false);
      setCurrentView(newView);
    }
  }, [currentView, viewStates, converter]);

  // 手動変換機能
  const handleManualConvert = useCallback(async () => {
    if (!viewStates[currentView].sourceCode.trim()) return;

    setIsConverting(true);
    
    try {
      const parseResult = converter.parseToAST(viewStates[currentView].sourceCode, currentView);
      
      if (parseResult.success) {
        // 全ビューに変換
        const promises = views
          .filter(view => view.id !== currentView)
          .map(async (view) => {
            const convertResult = converter.convertToView(parseResult.ast, view.id);
            return { viewId: view.id, result: convertResult };
          });

        const results = await Promise.all(promises);
        
        const updatedStates = { ...viewStates };
        let successCount = 0;
        
        results.forEach(({ viewId, result }) => {
          if (result.success) {
            updatedStates[viewId] = {
              sourceCode: result.sourceCode,
              lastModified: Date.now(),
              hasChanges: false
            };
            successCount++;
          }
        });

        setViewStates(updatedStates);
        
        const historyEntry = `${new Date().toLocaleTimeString()} - 手動一括変換: ${successCount}/${results.length} 成功`;
        setConversionHistory((prev: string[]) => [historyEntry, ...prev.slice(0, 4)]);
        
      }
    } catch (error) {
      console.error('一括変換エラー:', error);
      const historyEntry = `${new Date().toLocaleTimeString()} - 一括変換失敗`;
      setConversionHistory((prev: string[]) => [historyEntry, ...prev.slice(0, 4)]);
    } finally {
      setIsConverting(false);
    }
  }, [currentView, viewStates, converter, views]);

  const renderEditor = () => {
    const currentState = viewStates[currentView];
    
    switch (currentView) {
      case PLCViewType.LD:
        return (
          <div className="h-full bg-white">
            <LadderEditor onCodeChange={handleLDCodeChange} />
          </div>
        );
      case PLCViewType.SFC:
        return (
          <div className="h-full bg-white">
            <SFCEditor onCodeChange={handleSFCCodeChange} />
          </div>
        );
      case PLCViewType.LADDER_IN_ST:
        return (
          <div className="h-full bg-white">
            <LadderInSTEditor onCodeChange={handleLDSTCodeChange} />
          </div>
        );
      case PLCViewType.ST:
        return (
          <div className="h-full flex flex-col bg-white">
            {/* STエディタヘッダー */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Structured Text エディタ</h2>
                  <p className="text-sm text-gray-500">NJ/NX Series PLCプログラミング</p>
                  {lastConvertedView && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 {lastConvertedView}から自動変換されました
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(currentState.sourceCode);
                      alert('STコードをクリップボードにコピーしました！');
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📋 コピー
                  </button>
                  <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                    ✓ 構文チェック
                  </button>
                </div>
              </div>
            </div>

            {/* STコードエディタ */}
            <div className="flex-1 p-4">
              <div className="h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
                <textarea
                  value={currentState.sourceCode}
                  onChange={(e) => handleSTCodeChange(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm resize-none border-none outline-none"
                  placeholder="Structured Text コードを入力してください..."
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>

            {/* ステータスバー */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span>行: {currentState.sourceCode.split('\n').length}</span>
                  <span>文字数: {currentState.sourceCode.length}</span>
                  <span className={`${currentState.hasChanges ? 'text-orange-600' : 'text-green-600'}`}>
                    ● {currentState.hasChanges ? '未保存の変更' : '同期済み'}
                  </span>
                </div>
                <div>
                  <span>最終更新: {new Date(currentState.lastModified).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex h-full items-center justify-center text-gray-500 bg-white">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {views.find(v => v.id === currentView)?.icon || '⚙️'}
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentView} エディタ
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {views.find(v => v.id === currentView)?.label} 編集モード
              </p>
              <p className="text-xs text-gray-500">
                実装準備中です。他のエディタをお試しください。
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* メインヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PLC Web Editor</h1>
              <p className="text-sm text-gray-500">NJ/NX Series Programming Environment</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Beta v0.1.1
              </span>
              {isConverting && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full animate-pulse">
                  🔄 変換中...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーションタブ */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-0">
            {views.map((view) => {
              const hasChanges = viewStates[view.id].hasChanges;
              return (
                <button
                  key={view.id}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                    currentView === view.id 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleViewChange(view.id)}
                  title={view.label}
                >
                  <div className="flex items-center space-x-2">
                    <span>{view.icon}</span>
                    <span>{view.name}</span>
                    {hasChanges && (
                      <span className="w-2 h-2 bg-orange-400 rounded-full" title="未保存の変更があります"></span>
                    )}
                  </div>
                  {currentView === view.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 拡張ツールバー */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              現在のモード: <span className="font-medium">{views.find(v => v.id === currentView)?.label}</span>
            </span>
            {conversionHistory.length > 0 && (
              <div className="text-xs text-gray-500">
                最新: {conversionHistory[0]}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
              💾 保存
            </button>
            <button 
              onClick={handleManualConvert}
              disabled={isConverting || !viewStates[currentView].sourceCode.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 一括変換
            </button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              ▶️ 実行
            </button>
          </div>
        </div>
      </div>

      {/* メインエディタエリア */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>

      {/* 拡張フッター */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>PLC Web Editor</span>
            <span>•</span>
            <span>現在のビュー: {currentView}</span>
            <span>•</span>
            <span>最終更新: {new Date(viewStates[currentView].lastModified).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>NJ/NX Series Compatible</span>
            {conversionHistory.length > 0 && (
              <>
                <span>•</span>
                <span>変換履歴: {conversionHistory.length}件</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 