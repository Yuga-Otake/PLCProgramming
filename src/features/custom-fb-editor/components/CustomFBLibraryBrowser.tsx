'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomFunctionBlock,
  FBLibrary,
  FBCategory,
  STANDARD_FB_TEMPLATES
} from '../../../shared/types/custom-function-block';
import { customFBManager } from '../../../shared/lib/custom-fb/custom-fb-manager';

interface CustomFBLibraryBrowserProps {
  onSelectFB?: (fb: CustomFunctionBlock) => void;
  onEditFB?: (fbId: string) => void;
  onCreateFB?: (templateName?: string) => void;
  selectedFBId?: string;
  mode?: 'browser' | 'selector';
}

export const CustomFBLibraryBrowser: React.FC<CustomFBLibraryBrowserProps> = ({
  onSelectFB,
  onEditFB,
  onCreateFB,
  selectedFBId,
  mode = 'browser'
}) => {
  const [libraries, setLibraries] = useState<FBLibrary[]>([]);
  const [functionBlocks, setFunctionBlocks] = useState<CustomFunctionBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FBCategory | 'ALL'>('ALL');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(true);

  // データ読み込み
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const loadedLibraries = customFBManager.getAllLibraries();
      const loadedFBs = customFBManager.getAllFunctionBlocks();
      
      setLibraries(loadedLibraries);
      setFunctionBlocks(loadedFBs);
    } catch (error) {
      console.error('Failed to load FB libraries:', error);
    }
  };

  // フィルタリングされたFBリスト
  const filteredFBs = useMemo(() => {
    let filtered = functionBlocks;

    // ライブラリフィルタ
    if (selectedLibrary) {
      const library = libraries.find(lib => lib.id === selectedLibrary);
      if (library) {
        filtered = library.functionBlocks;
      }
    }

    // カテゴリフィルタ
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(fb => fb.category === selectedCategory);
    }

    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fb =>
        fb.name.toLowerCase().includes(query) ||
        fb.description?.toLowerCase().includes(query) ||
        fb.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [functionBlocks, libraries, selectedLibrary, selectedCategory, searchQuery]);

  // テンプレートリスト
  const templates = useMemo(() => {
    if (!showTemplates) return [];
    return Object.keys(STANDARD_FB_TEMPLATES);
  }, [showTemplates]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            カスタムFBライブラリ
          </h2>
          {mode === 'browser' && (
            <div className="flex gap-2">
              <button
                onClick={() => onCreateFB?.()}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                新規作成
              </button>
            </div>
          )}
        </div>

        {/* 検索とフィルタ */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="FB名、説明、タグで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex gap-3">
            <select
              value={selectedLibrary}
              onChange={(e) => setSelectedLibrary(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべてのライブラリ</option>
              {libraries.map(library => (
                <option key={library.id} value={library.id}>
                  {library.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as FBCategory | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">すべてのカテゴリ</option>
              {Object.values(FBCategory).map(category => (
                <option key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTemplates}
                onChange={(e) => setShowTemplates(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">テンプレート表示</span>
            </label>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {/* テンプレート */}
          {showTemplates && templates.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                標準テンプレート
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(templateName => {
                  const template = STANDARD_FB_TEMPLATES[templateName];
                  return (
                    <TemplateCard
                      key={templateName}
                      templateName={templateName}
                      template={template}
                      onCreateFromTemplate={() => onCreateFB?.(templateName)}
                      mode={mode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* カスタムFB */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              カスタムファンクションブロック ({filteredFBs.length})
            </h3>
            
            {filteredFBs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || selectedCategory !== 'ALL' || selectedLibrary ? (
                  <p>検索条件に一致するFBが見つかりません</p>
                ) : (
                  <div>
                    <p className="mb-4">カスタムFBがありません</p>
                    {mode === 'browser' && (
                      <button
                        onClick={() => onCreateFB?.()}
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        最初のFBを作成
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFBs.map(fb => (
                  <FBCard
                    key={fb.id}
                    fb={fb}
                    isSelected={selectedFBId === fb.id}
                    onSelect={() => onSelectFB?.(fb)}
                    onEdit={() => onEditFB?.(fb.id)}
                    mode={mode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// テンプレートカード
const TemplateCard: React.FC<{
  templateName: string;
  template: Partial<CustomFunctionBlock>;
  onCreateFromTemplate: () => void;
  mode: 'browser' | 'selector';
}> = ({ templateName, template, onCreateFromTemplate, mode }) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 text-sm font-medium">T</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{template.name || templateName}</h4>
            <p className="text-xs text-green-600">{getCategoryDisplayName(template.category!)}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {template.description || 'IEC 61131-3 標準ファンクションブロック'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            入力: {template.inputs?.length || 0}
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            出力: {template.outputs?.length || 0}
          </span>
        </div>

        <button
          onClick={onCreateFromTemplate}
          className="px-3 py-1 text-sm text-green-600 hover:text-green-800 transition-colors"
        >
          作成
        </button>
      </div>
    </div>
  );
};

// FBカード
const FBCard: React.FC<{
  fb: CustomFunctionBlock;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  mode: 'browser' | 'selector';
}> = ({ fb, isSelected, onSelect, onEdit, mode }) => {
  return (
    <div
      className={`p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {fb.icon || fb.name.charAt(0)}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{fb.name}</h4>
            <p className="text-xs text-blue-600">{getCategoryDisplayName(fb.category)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">v{fb.version}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {fb.description || 'カスタムファンクションブロック'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            入力: {fb.inputs.length}
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            出力: {fb.outputs.length}
          </span>
        </div>

        {mode === 'browser' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            編集
          </button>
        )}
      </div>

      {/* タグ */}
      {fb.metadata.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {fb.metadata.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {fb.metadata.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{fb.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ヘルパー関数
function getCategoryDisplayName(category: FBCategory): string {
  const nameMap: Record<FBCategory, string> = {
    [FBCategory.TIMING]: 'タイミング',
    [FBCategory.COUNTING]: 'カウンタ',
    [FBCategory.MATH]: '演算',
    [FBCategory.LOGIC]: '論理',
    [FBCategory.COMPARISON]: '比較',
    [FBCategory.DATA_HANDLING]: 'データ処理',
    [FBCategory.COMMUNICATION]: '通信',
    [FBCategory.MOTION]: 'モーション',
    [FBCategory.SAFETY]: '安全',
    [FBCategory.CUSTOM]: 'カスタム',
    [FBCategory.USER_DEFINED]: 'ユーザー定義'
  };
  
  return nameMap[category] || 'その他';
} 