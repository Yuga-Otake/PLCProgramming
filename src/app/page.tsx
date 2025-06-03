'use client';

import React, { useState } from 'react';
import { CustomFBEditor } from '../features/custom-fb-editor/components/CustomFBEditor';
import { CustomFBLibraryBrowser } from '../features/custom-fb-editor/components/CustomFBLibraryBrowser';
import { CustomFunctionBlock } from '../shared/types/custom-function-block';

type EditorType = 'ladder' | 'st' | 'sfc' | 'hybrid' | 'custom-fb' | 'fb-library';

// 仮のエディタコンポーネント
const PlaceholderEditor: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex items-center justify-center h-full bg-gray-50">
    <div className="text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default function HomePage() {
  const [activeEditor, setActiveEditor] = useState<EditorType>('ladder');
  const [customFBEditorState, setCustomFBEditorState] = useState<{
    mode: 'browser' | 'editor';
    fbId?: string;
    templateName?: string;
  }>({
    mode: 'browser'
  });

  const handleCustomFBCreate = (templateName?: string) => {
    setCustomFBEditorState({
      mode: 'editor',
      ...(templateName && { templateName })
    });
    setActiveEditor('custom-fb');
  };

  const handleCustomFBEdit = (fbId: string) => {
    setCustomFBEditorState({
      mode: 'editor',
      fbId
    });
    setActiveEditor('custom-fb');
  };

  const handleCustomFBSave = (fb: CustomFunctionBlock) => {
    console.log('FB saved:', fb.name);
    // ライブラリブラウザに戻る
    setCustomFBEditorState({ mode: 'browser' });
    setActiveEditor('fb-library');
  };

  const handleCustomFBCancel = () => {
    // ライブラリブラウザに戻る
    setCustomFBEditorState({ mode: 'browser' });
    setActiveEditor('fb-library');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                PLC Web Editor
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Web-based PLC Programming Environment
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'ladder', label: 'ラダー図エディタ', icon: '📊' },
              { key: 'st', label: 'STエディタ', icon: '📝' },
              { key: 'sfc', label: 'SFCエディタ', icon: '🔄' },
              { key: 'hybrid', label: 'ハイブリッド', icon: '🔗' },
              { key: 'fb-library', label: 'FBライブラリ', icon: '📚' },
              { key: 'custom-fb', label: 'FB作成', icon: '🛠️', 
                hidden: customFBEditorState.mode !== 'editor' }
            ].map((tab) => {
              if (tab.hidden) return null;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === 'fb-library') {
                      setCustomFBEditorState({ mode: 'browser' });
                    }
                    setActiveEditor(tab.key as EditorType);
                  }}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeEditor === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-[800px]">
            {activeEditor === 'ladder' && (
              <PlaceholderEditor 
                title="ラダー図エディタ" 
                description="既存のラダーエディタと統合予定"
              />
            )}
            {activeEditor === 'st' && (
              <PlaceholderEditor 
                title="STエディタ" 
                description="Structured Textエディタ"
              />
            )}
            {activeEditor === 'sfc' && (
              <PlaceholderEditor 
                title="SFCエディタ" 
                description="Sequential Function Chartエディタ"
              />
            )}
            {activeEditor === 'hybrid' && (
              <div className="flex h-full">
                <div className="w-1/2 border-r border-gray-200">
                  <PlaceholderEditor 
                    title="ラダー図エディタ" 
                    description="Ladder Diagram"
                  />
                </div>
                <div className="w-1/2">
                  <PlaceholderEditor 
                    title="STエディタ" 
                    description="Structured Text"
                  />
                </div>
              </div>
            )}
            {activeEditor === 'fb-library' && (
              <CustomFBLibraryBrowser
                mode="browser"
                onCreateFB={handleCustomFBCreate}
                onEditFB={handleCustomFBEdit}
              />
            )}
            {activeEditor === 'custom-fb' && customFBEditorState.mode === 'editor' && (
              <CustomFBEditor
                {...(customFBEditorState.fbId && { fbId: customFBEditorState.fbId })}
                {...(customFBEditorState.templateName && { templateName: customFBEditorState.templateName })}
                onSave={handleCustomFBSave}
                onCancel={handleCustomFBCancel}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 