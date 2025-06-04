'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { customFBManager } from '../../../shared/lib/custom-fb/custom-fb-manager';
import {
  CustomFunctionBlock,
  FBCategory,
  STANDARD_FB_TEMPLATES
} from '../../../shared/types/custom-function-block';

interface FBPaletteProps {
  onInsertFB: (fbCode: string) => void;
  onCreateNewFB: () => void;
}

export const FBPalette: React.FC<FBPaletteProps> = ({
  onInsertFB,
  onCreateNewFB
}) => {
  const [functionBlocks, setFunctionBlocks] = useState<CustomFunctionBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FBCategory | 'ALL' | 'TEMPLATES'>('ALL');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['custom', 'templates']));
  const [insertingFB, setInsertingFB] = useState<string | null>(null);
  const [lastInsertedFB, setLastInsertedFB] = useState<string | null>(null);

  // データ読み込み
  useEffect(() => {
    loadFunctionBlocks();
  }, []);

  const loadFunctionBlocks = () => {
    try {
      const fbs = customFBManager.getAllFunctionBlocks();
      setFunctionBlocks(fbs);
    } catch (error) {
      console.error('Failed to load function blocks:', error);
    }
  };

  // フィルタリングされたFBリスト
  const filteredFBs = useMemo(() => {
    let filtered = functionBlocks;

    // カテゴリフィルタ
    if (selectedCategory !== 'ALL' && selectedCategory !== 'TEMPLATES') {
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
  }, [functionBlocks, selectedCategory, searchQuery]);

  // テンプレートリスト
  const templates = useMemo(() => {
    if (selectedCategory !== 'ALL' && selectedCategory !== 'TEMPLATES') return [];
    
    const templateList = Object.keys(STANDARD_FB_TEMPLATES);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return templateList.filter(name => 
        name.toLowerCase().includes(query) ||
        STANDARD_FB_TEMPLATES[name].name?.toLowerCase().includes(query) ||
        STANDARD_FB_TEMPLATES[name].description?.toLowerCase().includes(query)
      );
    }
    return templateList;
  }, [selectedCategory, searchQuery]);

  // FB挿入用のSTコード生成
  const generateFBCallCode = (fb: CustomFunctionBlock): string => {
    const instanceName = `${fb.name.toLowerCase()}Instance`;
    const inputParams = fb.inputs.map(input => 
      `${input.name} := (* ${input.description || 'input value'} *)`
    ).join(', ');
    
    const outputAccess = fb.outputs.length > 0 ? 
      `\n// アウトプット: ${fb.outputs.map(output => `${instanceName}.${output.name}`).join(', ')}` : '';

    return `// ${fb.name} ファンクションブロック呼び出し
${instanceName} : ${fb.name};
${instanceName}(${inputParams});${outputAccess}`;
  };

  // テンプレートから挿入用のSTコード生成
  const generateTemplateCallCode = (templateName: string): string => {
    const template = STANDARD_FB_TEMPLATES[templateName];
    const instanceName = `${templateName.toLowerCase()}Instance`;
    
    return `// ${template.name || templateName} テンプレート呼び出し
${instanceName} : ${template.name || templateName};
${instanceName}(/* パラメータを設定してください */);`;
  };

  // FB挿入処理（フィードバック付き）
  const handleFBInsert = async (fbCode: string, fbName: string) => {
    setInsertingFB(fbName);
    
    try {
      await onInsertFB(fbCode);
      setLastInsertedFB(fbName);
      
      // 成功フィードバックを3秒間表示
      setTimeout(() => {
        setLastInsertedFB(null);
      }, 3000);
    } catch (error) {
      console.error('FB挿入エラー:', error);
    } finally {
      setInsertingFB(null);
    }
  };

  // セクションの展開/折りたたみ
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="p-3 border-b border-gray-300">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          🧩 ファンクションブロック
        </h3>
        
        {/* 成功フィードバック */}
        {lastInsertedFB && (
          <div className="mb-2 px-2 py-1 bg-green-100 border border-green-300 rounded text-xs text-green-800">
            ✅ {lastInsertedFB} を挿入しました
          </div>
        )}
        
        {/* 検索 */}
        <input
          type="text"
          placeholder="FB検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        
        {/* カテゴリフィルタ */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as FBCategory | 'ALL' | 'TEMPLATES')}
          className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">すべて</option>
          <option value="TEMPLATES">テンプレート</option>
          {Object.values(FBCategory).map(category => (
            <option key={category} value={category}>
              {getCategoryDisplayName(category)}
            </option>
          ))}
        </select>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {/* テンプレート */}
        {(selectedCategory === 'ALL' || selectedCategory === 'TEMPLATES') && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('templates')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
            >
              <span>📋 標準テンプレート ({templates.length})</span>
              <span>{expandedSections.has('templates') ? '−' : '+'}</span>
            </button>
            
            {expandedSections.has('templates') && (
              <div className="bg-white">
                {templates.map(templateName => {
                  const template = STANDARD_FB_TEMPLATES[templateName];
                  return (
                    <div key={templateName} className="p-2 border-b border-gray-100 hover:bg-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900">
                            {template.name || templateName}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {template.description || 'テンプレートファンクションブロック'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFBInsert(generateTemplateCallCode(templateName), template.name || templateName)}
                          disabled={insertingFB === (template.name || templateName)}
                          className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                            insertingFB === (template.name || templateName)
                              ? 'bg-blue-400 text-white cursor-not-allowed'
                              : lastInsertedFB === (template.name || templateName)
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {insertingFB === (template.name || templateName) ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-1">⚫</span>
                              挿入中...
                            </span>
                          ) : lastInsertedFB === (template.name || templateName) ? (
                            '✅ 完了'
                          ) : (
                            '挿入'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button
                  onClick={onCreateNewFB}
                  className="w-full p-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                >
                  + 新しいテンプレートから作成
                </button>
              </div>
            )}
          </div>
        )}

        {/* カスタムFB */}
        {(selectedCategory === 'ALL' || selectedCategory !== 'TEMPLATES') && (
          <div>
            <button
              onClick={() => toggleSection('custom')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
            >
              <span>🛠️ カスタムFB ({filteredFBs.length})</span>
              <span>{expandedSections.has('custom') ? '−' : '+'}</span>
            </button>
            
            {expandedSections.has('custom') && (
              <div className="bg-white">
                {filteredFBs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    {searchQuery || selectedCategory !== 'ALL' ? (
                      <p>検索条件に一致するFBがありません</p>
                    ) : (
                      <div>
                        <p className="mb-2">カスタムFBがありません</p>
                        <button
                          onClick={onCreateNewFB}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          最初のFBを作成
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredFBs.map(fb => (
                    <div key={fb.id} className="p-2 border-b border-gray-100 hover:bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900">
                            {fb.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {fb.description || 'カスタムファンクションブロック'}
                          </p>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                              {getCategoryDisplayName(fb.category)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {fb.inputs.length}入力/{fb.outputs.length}出力
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFBInsert(generateFBCallCode(fb), fb.name)}
                          disabled={insertingFB === fb.name}
                          className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                            insertingFB === fb.name
                              ? 'bg-green-400 text-white cursor-not-allowed'
                              : lastInsertedFB === fb.name
                              ? 'bg-green-700 text-white'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {insertingFB === fb.name ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-1">⚫</span>
                              挿入中...
                            </span>
                          ) : lastInsertedFB === fb.name ? (
                            '✅ 完了'
                          ) : (
                            '挿入'
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                <button
                  onClick={onCreateNewFB}
                  className="w-full p-2 text-xs text-green-600 hover:bg-green-50 border-t border-gray-200"
                >
                  + カスタムFBを作成
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-2 border-t border-gray-300 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          🔧 FBパレット v1.0
        </p>
      </div>
    </div>
  );
};

function getCategoryDisplayName(category: FBCategory): string {
  switch (category) {
    case FBCategory.TIMER: return 'タイマー';
    case FBCategory.COUNTER: return 'カウンター';
    case FBCategory.MATH: return '数学';
    case FBCategory.LOGIC: return 'ロジック';
    case FBCategory.COMMUNICATION: return '通信';
    case FBCategory.MOTION: return 'モーション';
    case FBCategory.SAFETY: return 'セーフティ';
    case FBCategory.CUSTOM: return 'カスタム';
    default: return category;
  }
} 