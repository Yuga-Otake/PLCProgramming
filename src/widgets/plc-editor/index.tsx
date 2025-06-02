'use client';

import { useState } from 'react';
import { PLCViewType } from '@/shared/types/plc';
import { EditorLayout, ToolbarButton, StatusIndicator } from '@/shared';
import { LadderEditor } from '../../features/ladder-editor/components/ladder-editor';
import { SFCEditor } from '../../features/sfc-editor/components/sfc-editor';
import { LadderInSTEditor } from '../../features/ladder-in-st-editor/components/ladder-in-st-editor';

export default function PLCEditor(): JSX.Element {
  const [currentView, setCurrentView] = useState<PLCViewType>(PLCViewType.ST);
  const [generatedSTCode, setGeneratedSTCode] = useState<string>('// Structured Text Code\n// ラダー図から生成されたSTコードがここに表示されます\n\n// LDタブでラダー図を作成してください');

  const views = [
    { id: PLCViewType.ST, name: 'ST', label: 'Structured Text' },
    { id: PLCViewType.LD, name: 'LD', label: 'Ladder Diagram' },
    { id: PLCViewType.SFC, name: 'SFC', label: 'Sequential Function Chart' },
    { id: PLCViewType.LADDER_IN_ST, name: 'LD-ST', label: 'Ladder in ST' },
  ];

  // ラダーエディタからSTコード更新を受け取る
  const handleCodeChange = (stCode: string) => {
    setGeneratedSTCode(stCode);
  };

  const renderEditor = () => {
    switch (currentView) {
      case PLCViewType.LD:
        return <LadderEditor onCodeChange={handleCodeChange} />;
      case PLCViewType.SFC:
        return <SFCEditor onCodeChange={handleCodeChange} />;
      case PLCViewType.LADDER_IN_ST:
        return <LadderInSTEditor onCodeChange={handleCodeChange} />;
      case PLCViewType.ST:
        return (
          <EditorLayout
            title="Structured Text エディタ"
            subtitle="Omron NJ/NX Series"
            sidebar={
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">プロジェクト</h2>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    新しいプログラムを作成するか、既存のファイルを開いてください。
                  </div>
                  <ToolbarButton variant="primary" size="md">
                    新規プログラム作成
                  </ToolbarButton>
                  <ToolbarButton variant="secondary" size="md">
                    ファイルを開く
                  </ToolbarButton>
                </div>
              </div>
            }
            toolbar={
              <>
                <ToolbarButton
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSTCode);
                    alert('STコードをクリップボードにコピーしました！');
                  }}
                >
                  📋 コピー
                </ToolbarButton>
                <ToolbarButton variant="success">
                  ✓ 構文チェック
                </ToolbarButton>
              </>
            }
            statusBar={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  <span>行: {generatedSTCode.split('\n').length}</span>
                  <span>文字数: {generatedSTCode.length}</span>
                  <StatusIndicator status="ready" text="準備完了" />
                </div>
                <div>
                  <span>
                    ラダー図からの自動生成: {generatedSTCode.includes('Generated ST Code') ? '有効' : '手動編集'}
                  </span>
                </div>
              </div>
            }
          >
            <div className="p-4 h-full">
              <div className="h-full border border-gray-300 rounded-lg overflow-hidden">
                <textarea
                  value={generatedSTCode}
                  onChange={(e) => setGeneratedSTCode(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm resize-none border-none outline-none"
                  placeholder="Structured Text コードを入力してください..."
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>
          </EditorLayout>
        );
      default:
        return (
          <EditorLayout
            title={`${currentView} エディタ`}
            subtitle={views.find(v => v.id === currentView)?.label || ''}
            sidebar={
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ツール</h2>
                <div className="text-sm text-gray-600">実装準備中...</div>
              </div>
            }
          >
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentView} エディタ
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {views.find(v => v.id === currentView)?.label} 編集モード
                </p>
                <p className="text-xs text-gray-500">
                  実装準備中です。AST変換エンジンとビューレンダリングを構築中...
                </p>
              </div>
            </div>
          </EditorLayout>
        );
    }
  };

  return (
    <div className="plc-editor-container">
      {/* Main Content */}
      <div className="plc-main-content">
        {/* Toolbar */}
        <div className="plc-toolbar">
          <div className="flex space-x-1">
            {views.map((view) => (
              <button
                key={view.id}
                className={`plc-tab ${
                  currentView === view.id ? 'plc-tab-active' : ''
                }`}
                onClick={() => setCurrentView(view.id)}
                title={view.label}
              >
                {view.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <ToolbarButton variant="secondary">保存</ToolbarButton>
            <ToolbarButton variant="primary">変換</ToolbarButton>
          </div>
        </div>

        {/* Editor Pane */}
        <div className="plc-editor-pane">
          {renderEditor()}
        </div>
      </div>
    </div>
  );
} 