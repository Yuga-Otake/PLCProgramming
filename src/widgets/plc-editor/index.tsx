'use client';

import { useState } from 'react';
import { PLCViewType } from '@/shared/types/plc';
import { LadderEditor } from '../../features/ladder-editor/components/ladder-editor';
import { SFCEditor } from '../../features/sfc-editor/components/sfc-editor';
import { LadderInSTEditor } from '../../features/ladder-in-st-editor/components/ladder-in-st-editor';

export default function PLCEditor(): JSX.Element {
  const [currentView, setCurrentView] = useState<PLCViewType>(PLCViewType.LD);
  const [generatedSTCode, setGeneratedSTCode] = useState<string>('// Structured Text Code\n// ラダー図から生成されたSTコードがここに表示されます\n\n// LDタブでラダー図を作成してください');

  const views = [
    { id: PLCViewType.ST, name: 'ST', label: 'Structured Text', icon: '📝' },
    { id: PLCViewType.LD, name: 'LD', label: 'Ladder Diagram', icon: '🪜' },
    { id: PLCViewType.SFC, name: 'SFC', label: 'Sequential Function Chart', icon: '🔄' },
    { id: PLCViewType.LADDER_IN_ST, name: 'LD-ST', label: 'Ladder in ST', icon: '🔗' },
  ];

  // ラダーエディタからSTコード更新を受け取る
  const handleCodeChange = (stCode: string) => {
    setGeneratedSTCode(stCode);
  };

  const renderEditor = () => {
    switch (currentView) {
      case PLCViewType.LD:
        return (
          <div className="h-full bg-white">
            <LadderEditor onCodeChange={handleCodeChange} />
          </div>
        );
      case PLCViewType.SFC:
        return (
          <div className="h-full bg-white">
            <SFCEditor onCodeChange={handleCodeChange} />
          </div>
        );
      case PLCViewType.LADDER_IN_ST:
        return (
          <div className="h-full bg-white">
            <LadderInSTEditor onCodeChange={handleCodeChange} />
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
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSTCode);
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
                  value={generatedSTCode}
                  onChange={(e) => setGeneratedSTCode(e.target.value)}
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
                  <span>行: {generatedSTCode.split('\n').length}</span>
                  <span>文字数: {generatedSTCode.length}</span>
                  <span className="text-green-600">● 準備完了</span>
                </div>
                <div>
                  <span>ラダー図からの自動生成: {generatedSTCode.includes('Generated ST Code') ? '有効' : '手動編集'}</span>
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
                Beta v0.1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーションタブ */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-0">
            {views.map((view) => (
              <button
                key={view.id}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                  currentView === view.id 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setCurrentView(view.id)}
                title={view.label}
              >
                <div className="flex items-center space-x-2">
                  <span>{view.icon}</span>
                  <span>{view.name}</span>
                </div>
                {currentView === view.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ツールバー */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              現在のモード: <span className="font-medium">{views.find(v => v.id === currentView)?.label}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
              💾 保存
            </button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              🔄 変換
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

      {/* フッター */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>PLC Web Editor</span>
            <span>•</span>
            <span>現在のビュー: {currentView}</span>
            <span>•</span>
            <span>最終更新: {new Date().toLocaleTimeString()}</span>
          </div>
          <div>
            <span>NJ/NX Series Compatible</span>
          </div>
        </div>
      </div>
    </div>
  );
} 