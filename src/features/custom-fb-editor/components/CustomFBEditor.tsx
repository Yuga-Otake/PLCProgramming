'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  CustomFunctionBlock,
  FBPin,
  FBCategory,
  FBLanguage,
  FBComplexity,
  STANDARD_FB_TEMPLATES,
  DEFAULT_FB_METADATA,
  DEFAULT_FB_SIMULATION
} from '../../../shared/types/custom-function-block';
import { PLCDataType } from '../../../shared/types/plc';
import { customFBManager } from '../../../shared/lib/custom-fb/custom-fb-manager';

interface CustomFBEditorProps {
  fbId?: string;          // 編集時のFB ID
  templateName?: string;  // テンプレートからの作成時
  onSave?: (fb: CustomFunctionBlock) => void;
  onCancel?: () => void;
}

export const CustomFBEditor: React.FC<CustomFBEditorProps> = ({
  fbId,
  templateName,
  onSave,
  onCancel
}) => {
  // エディタ状態
  const [fb, setFb] = useState<CustomFunctionBlock | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'pins' | 'implementation' | 'simulation'>('basic');
  const [errors, setErrors] = useState<string[]>([]);
  const [isModified, setIsModified] = useState(false);

  // 初期化
  useEffect(() => {
    if (fbId) {
      // 既存FBの編集
      const existingFB = customFBManager.getFunctionBlock(fbId);
      if (existingFB) {
        setFb(existingFB);
      }
    } else if (templateName) {
      // テンプレートからの作成
      try {
        const newFB = customFBManager.createFunctionBlockFromTemplate(templateName);
        setFb(newFB);
        setIsModified(true);
      } catch (error) {
        setErrors([`テンプレート作成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    } else {
      // 新規作成
      setFb(createEmptyFB());
      setIsModified(true);
    }
  }, [fbId, templateName]);

  // 空のFBを作成
  const createEmptyFB = useCallback((): CustomFunctionBlock => {
    const now = new Date();
    return {
      id: uuidv4(),
      name: 'NewFB',
      version: '1.0.0',
      description: '',
      author: '',
      created: now,
      modified: now,
      category: FBCategory.CUSTOM,
      inputs: [],
      outputs: [],
      internalVariables: [],
      implementation: {
        language: FBLanguage.ST,
        sourceCode: '// FB implementation\n',
        optimization: {
          level: 'BASIC',
          preferInline: false,
          optimizeMemory: true,
          optimizeSpeed: true
        }
      },
      simulation: {
        ...DEFAULT_FB_SIMULATION,
        simulationLogic: 'function simulate(inputs, state, deltaTime) {\n  return {};\n}'
      },
      metadata: {
        ...DEFAULT_FB_METADATA,
        complexity: FBComplexity.SIMPLE
      }
    };
  }, []);

  // FB更新
  const updateFB = useCallback((updates: Partial<CustomFunctionBlock>) => {
    if (!fb) return;
    
    setFb(prev => prev ? { ...prev, ...updates, modified: new Date() } : null);
    setIsModified(true);
  }, [fb]);

  // ピン追加
  const addPin = useCallback((type: 'input' | 'output') => {
    if (!fb) return;

    const newPin: FBPin = {
      id: uuidv4(),
      name: type === 'input' ? `IN${fb.inputs.length + 1}` : `OUT${fb.outputs.length + 1}`,
      dataType: PLCDataType.BOOL,
      description: '',
      required: true,
      position: {
        side: type === 'input' ? 'LEFT' : 'RIGHT',
        index: type === 'input' ? fb.inputs.length : fb.outputs.length
      }
    };

    if (type === 'input') {
      updateFB({ inputs: [...fb.inputs, newPin] });
    } else {
      updateFB({ outputs: [...fb.outputs, newPin] });
    }
  }, [fb, updateFB]);

  // ピン削除
  const removePin = useCallback((pinId: string, type: 'input' | 'output') => {
    if (!fb) return;

    if (type === 'input') {
      updateFB({ inputs: fb.inputs.filter(pin => pin.id !== pinId) });
    } else {
      updateFB({ outputs: fb.outputs.filter(pin => pin.id !== pinId) });
    }
  }, [fb, updateFB]);

  // ピン更新
  const updatePin = useCallback((pinId: string, type: 'input' | 'output', updates: Partial<FBPin>) => {
    if (!fb) return;

    if (type === 'input') {
      updateFB({
        inputs: fb.inputs.map(pin => 
          pin.id === pinId ? { ...pin, ...updates } : pin
        )
      });
    } else {
      updateFB({
        outputs: fb.outputs.map(pin => 
          pin.id === pinId ? { ...pin, ...updates } : pin
        )
      });
    }
  }, [fb, updateFB]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!fb) return;

    try {
      setErrors([]);
      
      // バリデーション
      if (!fb.name.trim()) {
        setErrors(['FB名は必須です']);
        return;
      }

      // ライブラリに追加（新規の場合）
      if (!fbId) {
        const standardLibrary = customFBManager.getLibrary('standard');
        if (standardLibrary) {
          await customFBManager.addFunctionBlock(standardLibrary.id, fb);
        }
      }

      onSave?.(fb);
    } catch (error) {
      setErrors([`保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  }, [fb, fbId, onSave]);

  if (!fb) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {fbId ? 'FB編集' : 'FB作成'}: {fb.name}
          </h2>
          {isModified && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              未保存
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          {errors.map((error, index) => (
            <div key={index} className="text-red-700 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* タブ */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'basic', label: '基本情報' },
          { key: 'pins', label: 'ピン設定' },
          { key: 'implementation', label: '実装' },
          { key: 'simulation', label: 'シミュレーション' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'basic' && (
          <BasicInfoTab fb={fb} onUpdate={updateFB} />
        )}
        {activeTab === 'pins' && (
          <PinsTab 
            fb={fb} 
            onAddPin={addPin}
            onRemovePin={removePin}
            onUpdatePin={updatePin}
          />
        )}
        {activeTab === 'implementation' && (
          <ImplementationTab fb={fb} onUpdate={updateFB} />
        )}
        {activeTab === 'simulation' && (
          <SimulationTab fb={fb} onUpdate={updateFB} />
        )}
      </div>
    </div>
  );
};

// 基本情報タブ
const BasicInfoTab: React.FC<{
  fb: CustomFunctionBlock;
  onUpdate: (updates: Partial<CustomFunctionBlock>) => void;
}> = ({ fb, onUpdate }) => {
  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            FB名 *
          </label>
          <input
            type="text"
            value={fb.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="FB名を入力"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            バージョン
          </label>
          <input
            type="text"
            value={fb.version}
            onChange={(e) => onUpdate({ version: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          説明
        </label>
        <textarea
          value={fb.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="FBの説明を入力"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ
          </label>
          <select
            value={fb.category}
            onChange={(e) => onUpdate({ category: e.target.value as FBCategory })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(FBCategory).map(category => (
              <option key={category} value={category}>
                {getCategoryDisplayName(category)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            作成者
          </label>
          <input
            type="text"
            value={fb.author || ''}
            onChange={(e) => onUpdate({ author: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="作成者名"
          />
        </div>
      </div>
    </div>
  );
};

// ピン設定タブ
const PinsTab: React.FC<{
  fb: CustomFunctionBlock;
  onAddPin: (type: 'input' | 'output') => void;
  onRemovePin: (pinId: string, type: 'input' | 'output') => void;
  onUpdatePin: (pinId: string, type: 'input' | 'output', updates: Partial<FBPin>) => void;
}> = ({ fb, onAddPin, onRemovePin, onUpdatePin }) => {
  return (
    <div className="space-y-8">
      {/* 入力ピン */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">入力ピン</h3>
          <button
            onClick={() => onAddPin('input')}
            className="px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
          >
            + 追加
          </button>
        </div>
        
        <div className="space-y-3">
          {fb.inputs.map((pin) => (
            <PinEditor
              key={pin.id}
              pin={pin}
              type="input"
              onUpdate={(updates) => onUpdatePin(pin.id, 'input', updates)}
              onRemove={() => onRemovePin(pin.id, 'input')}
            />
          ))}
          {fb.inputs.length === 0 && (
            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded">
              入力ピンがありません
            </div>
          )}
        </div>
      </div>

      {/* 出力ピン */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">出力ピン</h3>
          <button
            onClick={() => onAddPin('output')}
            className="px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
          >
            + 追加
          </button>
        </div>
        
        <div className="space-y-3">
          {fb.outputs.map((pin) => (
            <PinEditor
              key={pin.id}
              pin={pin}
              type="output"
              onUpdate={(updates) => onUpdatePin(pin.id, 'output', updates)}
              onRemove={() => onRemovePin(pin.id, 'output')}
            />
          ))}
          {fb.outputs.length === 0 && (
            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded">
              出力ピンがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ピンエディタ
const PinEditor: React.FC<{
  pin: FBPin;
  type: 'input' | 'output';
  onUpdate: (updates: Partial<FBPin>) => void;
  onRemove: () => void;
}> = ({ pin, type, onUpdate, onRemove }) => {
  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <div className="grid grid-cols-6 gap-4 items-center">
        <div>
          <input
            type="text"
            value={pin.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="ピン名"
          />
        </div>
        
        <div>
          <select
            value={pin.dataType}
            onChange={(e) => onUpdate({ dataType: e.target.value as PLCDataType })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {Object.values(PLCDataType).map(dataType => (
              <option key={dataType} value={dataType}>
                {dataType}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-span-2">
          <input
            type="text"
            value={pin.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="説明"
          />
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={pin.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="mr-2"
            />
            必須
          </label>
        </div>
        
        <div>
          <button
            onClick={onRemove}
            className="px-2 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

// 実装タブ
const ImplementationTab: React.FC<{
  fb: CustomFunctionBlock;
  onUpdate: (updates: Partial<CustomFunctionBlock>) => void;
}> = ({ fb, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          実装言語
        </label>
        <select
          value={fb.implementation.language}
          onChange={(e) => onUpdate({
            implementation: {
              ...fb.implementation,
              language: e.target.value as FBLanguage
            }
          })}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(FBLanguage).map(lang => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ソースコード
        </label>
        <textarea
          value={fb.implementation.sourceCode}
          onChange={(e) => onUpdate({
            implementation: {
              ...fb.implementation,
              sourceCode: e.target.value
            }
          })}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="FB実装コードを入力..."
        />
      </div>
    </div>
  );
};

// シミュレーションタブ
const SimulationTab: React.FC<{
  fb: CustomFunctionBlock;
  onUpdate: (updates: Partial<CustomFunctionBlock>) => void;
}> = ({ fb, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          シミュレーションロジック (JavaScript)
        </label>
        <textarea
          value={fb.simulation.simulationLogic}
          onChange={(e) => onUpdate({
            simulation: {
              ...fb.simulation,
              simulationLogic: e.target.value
            }
          })}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="function simulate(inputs, state, deltaTime) {&#10;  return {};&#10;}"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            実行時間 (μs)
          </label>
          <input
            type="number"
            value={fb.simulation.executionTime}
            onChange={(e) => onUpdate({
              simulation: {
                ...fb.simulation,
                executionTime: parseInt(e.target.value) || 0
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メモリ使用量 (bytes)
          </label>
          <input
            type="number"
            value={fb.simulation.memoryUsage}
            onChange={(e) => onUpdate({
              simulation: {
                ...fb.simulation,
                memoryUsage: parseInt(e.target.value) || 0
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
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