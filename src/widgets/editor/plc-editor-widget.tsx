'use client';

import React, { useState, useCallback } from 'react';
import { PLCViewType, PLCASTNode } from '@/shared/types/plc';
import { parseCodeToAST, convertASTToView } from '@/shared/lib/ast/converter';
import { STCodeEditor } from '@/features/st-editor/components/st-code-editor';
import { ASTViewer } from '@/features/ast-viewer/components/ast-viewer';
import { LadderEditor } from '../../features/ladder-editor/components/ladder-editor';

export function PLCEditorWidget(): JSX.Element {
  const [activeView, setActiveView] = useState<PLCViewType>(PLCViewType.ST);
  const [currentAST, setCurrentAST] = useState<PLCASTNode | null>(null);
  const [showAST, setShowAST] = useState(false);
  const [code, setCode] = useState('');

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    
    // 自動でASTを更新
    if (newCode.trim()) {
      try {
        const result = parseCodeToAST(newCode, PLCViewType.ST);
        if (result.success && result.ast) {
          setCurrentAST(result.ast);
        } else {
          // エラーがある場合はAST更新を停止
          // setCurrentAST(null);
        }
      } catch (error) {
        console.warn('AST parse error:', error);
      }
    } else {
      setCurrentAST(null);
    }
  }, []);

  const handleViewConvert = useCallback((targetView: PLCViewType) => {
    if (!currentAST) return;
    
    try {
      const result = convertASTToView(currentAST, targetView);
      if (result.success) {
        setActiveView(targetView);
        // TODO: Update corresponding view with converted representation
        console.log(`Converted to ${targetView}:`, result.sourceCode);
      }
    } catch (error) {
      console.error('View conversion error:', error);
    }
  }, [currentAST]);

  const views = [
    { type: PLCViewType.ST, label: 'ST', color: 'blue' },
    { type: PLCViewType.LD, label: 'LD', color: 'orange' },
    { type: PLCViewType.SFC, label: 'SFC', color: 'purple' },
    { type: PLCViewType.LADDER_IN_ST, label: 'LD-ST', color: 'green' },
  ];

  const getViewColorClasses = (color: string, isActive: boolean) => {
    const baseColors = {
      blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      green: isActive ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
    };
    return baseColors[color as keyof typeof baseColors] || baseColors.blue;
  };

  const renderActiveEditor = () => {
    switch (activeView) {
      case PLCViewType.ST:
        return (
          <STCodeEditor
            initialValue={code}
            onChange={handleCodeChange}
            onConvert={handleViewConvert}
          />
        );
      case PLCViewType.LD:
        console.log('Rendering LadderEditor...');
        return (
          <div>
            <div style={{ background: 'red', color: 'white', padding: '10px' }}>
              DEBUG: LadderEditor をロード中...
            </div>
            <LadderEditor
              onCodeChange={(ladderCode: string) => {
                // TODO: Convert ladder diagram to AST
                console.log('Ladder code changed:', ladderCode);
              }}
            />
          </div>
        );
      case PLCViewType.SFC:
        return (
          <div className="flex items-center justify-center h-full bg-purple-50">
            <div className="text-center text-purple-600">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium">SFCエディタ</h3>
              <p className="text-sm text-purple-500 mt-2">開発中 - Phase 4で実装予定</p>
            </div>
          </div>
        );
      case PLCViewType.LADDER_IN_ST:
        return (
          <div className="flex items-center justify-center h-full bg-green-50">
            <div className="text-center text-green-600">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium">LD-STエディタ</h3>
              <p className="text-sm text-green-500 mt-2">開発中 - Phase 5で実装予定</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with view tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex space-x-1">
          {views.map((view) => (
            <button
              key={view.type}
              onClick={() => setActiveView(view.type)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${getViewColorClasses(
                view.color,
                activeView === view.type
              )}`}
            >
              {view.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AST表示ボタンはSTとLDの場合のみ表示 */}
          {(activeView === PLCViewType.ST || activeView === PLCViewType.LD) && (
            <button
              onClick={() => setShowAST(!showAST)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                showAST 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAST ? 'AST非表示' : 'AST表示'}
            </button>
          )}
          
          {currentAST && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>AST生成済み</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main editor area */}
        <div className={`${showAST && activeView === PLCViewType.ST ? 'w-2/3' : 'w-full'} ${showAST && activeView === PLCViewType.ST ? 'border-r border-gray-200' : ''}`}>
          {renderActiveEditor()}
        </div>

        {/* AST Viewer - STモードでのみ表示 */}
        {showAST && activeView === PLCViewType.ST && (
          <div className="w-1/3 bg-gray-50">
            <ASTViewer ast={currentAST} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>表示モード: {activeView}</span>
            {activeView === PLCViewType.ST && <span>コード行数: {code.split('\n').length}</span>}
            {currentAST && <span>AST: 有効</span>}
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Omron PLC Studio Beta v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
} 