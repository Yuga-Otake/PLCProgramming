'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CustomFBEditor } from '../features/custom-fb-editor/components/CustomFBEditor';
import { CustomFBLibraryBrowser } from '../features/custom-fb-editor/components/CustomFBLibraryBrowser';
import { CustomFunctionBlock } from '../shared/types/custom-function-block';

// PLCエディタを動的インポート（SSRを避けるため）
const PLCEditor = dynamic(() => import('../widgets/plc-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-900">PLCエディタを読み込み中...</p>
        <p className="mt-2 text-sm text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  ),
});

type MainEditorMode = 'plc-editor' | 'custom-fb-library' | 'custom-fb-editor';

export default function HomePage(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<MainEditorMode>('plc-editor');
  const [customFBEditorState, setCustomFBEditorState] = useState<{
    fbId?: string;
    templateName?: string;
  }>({});

  const handleCustomFBCreate = (templateName?: string) => {
    setCustomFBEditorState({
      ...(templateName && { templateName })
    });
    setActiveMode('custom-fb-editor');
  };

  const handleCustomFBEdit = (fbId: string) => {
    setCustomFBEditorState({ fbId });
    setActiveMode('custom-fb-editor');
  };

  const handleCustomFBSave = (fb: CustomFunctionBlock) => {
    console.log('FB saved:', fb.name);
    // ライブラリブラウザに戻る
    setActiveMode('custom-fb-library');
  };

  const handleCustomFBCancel = () => {
    // ライブラリブラウザに戻る
    setActiveMode('custom-fb-library');
  };

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      {/* メインヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PLC Web Editor</h1>
              <p className="text-sm text-gray-500">
                NJ/NX Series Programming Environment - Advanced PLC Development Studio
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                v0.2.1 Enhanced
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                🚀 Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* モード切替タブ */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-0">
            {[
              { 
                key: 'plc-editor', 
                label: 'PLCエディタ', 
                icon: '🖥️', 
                description: 'ST/LD/SFC統合エディタ' 
              },
              { 
                key: 'custom-fb-library', 
                label: 'FBライブラリ', 
                icon: '📚', 
                description: 'カスタムファンクションブロック管理' 
              },
              { 
                key: 'custom-fb-editor', 
                label: 'FB作成', 
                icon: '🛠️', 
                description: 'FB作成・編集',
                hidden: activeMode !== 'custom-fb-editor'
              }
            ].map((tab) => {
              if (tab.hidden) return null;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === 'custom-fb-library') {
                      setCustomFBEditorState({});
                    }
                    setActiveMode(tab.key as MainEditorMode);
                  }}
                  className={`group px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 relative ${
                    activeMode === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={tab.description}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {activeMode === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-md"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 h-full overflow-hidden">
        {activeMode === 'plc-editor' && (
          <div className="h-full">
            <PLCEditor />
          </div>
        )}
        
        {activeMode === 'custom-fb-library' && (
          <div className="h-full bg-white">
            <CustomFBLibraryBrowser
              mode="browser"
              onCreateFB={handleCustomFBCreate}
              onEditFB={handleCustomFBEdit}
            />
          </div>
        )}
        
        {activeMode === 'custom-fb-editor' && (
          <div className="h-full bg-white">
            <CustomFBEditor
              {...(customFBEditorState.fbId && { fbId: customFBEditorState.fbId })}
              {...(customFBEditorState.templateName && { templateName: customFBEditorState.templateName })}
              onSave={handleCustomFBSave}
              onCancel={handleCustomFBCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
} 