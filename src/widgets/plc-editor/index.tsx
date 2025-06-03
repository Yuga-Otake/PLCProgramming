'use client';

import { useState } from 'react';
import { PLCViewType } from '@/shared/types/plc';
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
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium text-gray-900">Structured Text エディタ</h2>
              <p className="text-sm text-gray-500">NJ/NX Series</p>
            </div>
            <div className="flex-1 p-4">
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
          </div>
        );
      default:
        return (
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
                実装準備中です。
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex space-x-1">
          {views.map((view) => (
            <button
              key={view.id}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === view.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentView(view.id)}
              title={view.label}
            >
              {view.name}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            保存
          </button>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            変換
          </button>
        </div>
      </div>

      {/* Editor Pane */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>
    </div>
  );
} 