'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// SFC固有の型定義
export interface SFCStep {
  id: string;
  name: string;
  position: { x: number; y: number };
  isInitial: boolean;
  actions: SFCAction[];
  selected?: boolean;
}

export interface SFCTransition {
  id: string;
  name: string;
  condition: string;
  position: { x: number; y: number };
  fromStepId: string;
  toStepId: string;
  selected?: boolean;
}

export interface SFCAction {
  id: string;
  name: string;
  qualifier: ActionQualifier;
  code: string;
}

export enum ActionQualifier {
  NONE = 'N',      // Non-stored
  SET = 'S',       // Set (stored)
  RESET = 'R',     // Reset
  PULSE = 'P',     // Pulse
  STORED = 'L',    // Time limited
  DELAYED = 'D',   // Time delayed
  DELAYED_SET = 'DS', // Delayed set
  DELAYED_RESET = 'DR', // Delayed reset
  STORED_DELAYED = 'SL', // Stored and time limited
  PULSE_DELAYED = 'PD', // Pulse (delayed)
}

export interface SFCDiagram {
  id: string;
  name: string;
  steps: SFCStep[];
  transitions: SFCTransition[];
}

interface SFCEditorProps {
  onCodeChange?: (sfcCode: string) => void;
}

export function SFCEditor({ onCodeChange }: SFCEditorProps): JSX.Element {
  // 状態管理
  const [diagram, setDiagram] = useState<SFCDiagram>({
    id: uuidv4(),
    name: 'MainSFC',
    steps: [
      {
        id: uuidv4(),
        name: 'S001',
        position: { x: 300, y: 100 },
        isInitial: true,
        actions: []
      }
    ],
    transitions: []
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<{ type: 'step' | 'transition', elementId?: string } | null>(null);
  const [connectionMode, setConnectionMode] = useState<{ active: boolean, fromStepId?: string }>({ active: false });
  const [_editingElement, _setEditingElement] = useState<{ type: 'step' | 'transition', id: string } | null>(null);
  
  // ツールボックス要素
  const [_showStepProperties, _setShowStepProperties] = useState(false);
  const [_showTransitionProperties, _setShowTransitionProperties] = useState(false);
  const [_showActionEditor, _setShowActionEditor] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // ST言語変換
  const convertToST = useCallback((): string => {
    let stCode = '// Generated SFC Code\n\n';
    stCode += `// SFC Diagram: ${diagram.name}\n\n`;

    // ステップ変数宣言
    stCode += '// Step Variables\n';
    diagram.steps.forEach(step => {
      stCode += `${step.name}_X : BOOL := ${step.isInitial ? 'TRUE' : 'FALSE'}; // Step ${step.name}\n`;
    });

    stCode += '\n// Transition Variables\n';
    diagram.transitions.forEach(transition => {
      stCode += `${transition.name}_T : BOOL; // Transition ${transition.name}\n`;
    });

    stCode += '\n// SFC Logic\n';
    diagram.transitions.forEach(transition => {
      const fromStep = diagram.steps.find(s => s.id === transition.fromStepId);
      const toStep = diagram.steps.find(s => s.id === transition.toStepId);
      
      if (fromStep && toStep) {
        stCode += `// Transition from ${fromStep.name} to ${toStep.name}\n`;
        stCode += `${transition.name}_T := ${fromStep.name}_X AND (${transition.condition});\n`;
        stCode += `IF ${transition.name}_T THEN\n`;
        stCode += `    ${fromStep.name}_X := FALSE;\n`;
        stCode += `    ${toStep.name}_X := TRUE;\n`;
        stCode += `END_IF;\n\n`;
      }
    });

    // アクション処理
    diagram.steps.forEach(step => {
      if (step.actions.length > 0) {
        stCode += `// Actions for Step ${step.name}\n`;
        stCode += `IF ${step.name}_X THEN\n`;
        step.actions.forEach(action => {
          stCode += `    // Action ${action.name} (${action.qualifier})\n`;
          stCode += `    ${action.code}\n`;
        });
        stCode += `END_IF;\n\n`;
      }
    });

    return stCode;
  }, [diagram]);

  // ST言語変換効果
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(convertToST());
    }
  }, [diagram, onCodeChange, convertToST]);

  // ステップ追加
  const addStep = useCallback((position: { x: number; y: number }) => {
    const newStep: SFCStep = {
      id: uuidv4(),
      name: `S${String(diagram.steps.length + 1).padStart(3, '0')}`,
      position,
      isInitial: false,
      actions: []
    };

    setDiagram(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  }, [diagram.steps.length]);

  // トランジション追加
  const addTransition = useCallback((fromStepId: string, toStepId: string) => {
    const fromStep = diagram.steps.find(s => s.id === fromStepId);
    const toStep = diagram.steps.find(s => s.id === toStepId);
    
    if (!fromStep || !toStep) return;

    const midX = (fromStep.position.x + toStep.position.x) / 2;
    const midY = (fromStep.position.y + toStep.position.y) / 2;

    const newTransition: SFCTransition = {
      id: uuidv4(),
      name: `T${String(diagram.transitions.length + 1).padStart(3, '0')}`,
      condition: 'TRUE',
      position: { x: midX, y: midY },
      fromStepId,
      toStepId
    };

    setDiagram(prev => ({
      ...prev,
      transitions: [...prev.transitions, newTransition]
    }));
  }, [diagram]);

  // アクション追加
  const addAction = useCallback((stepId: string) => {
    const newAction: SFCAction = {
      id: uuidv4(),
      name: `A${String(Math.random()).substring(2, 5)}`,
      qualifier: ActionQualifier.NONE,
      code: '// Action code here'
    };

    setDiagram(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, actions: [...step.actions, newAction] }
          : step
      )
    }));
  }, []);

  // キャンバスクリック処理
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (draggedElement?.type === 'step') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        addStep({ x, y });
        setDraggedElement(null);
      }
    }
    setSelectedElement(null);
  }, [draggedElement, addStep]);

  // ステップクリック処理
  const handleStepClick = useCallback((stepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (connectionMode.active && connectionMode.fromStepId && connectionMode.fromStepId !== stepId) {
      addTransition(connectionMode.fromStepId, stepId);
      setConnectionMode({ active: false });
    } else {
      setSelectedElement(stepId);
      setConnectionMode({ active: false });
    }
  }, [connectionMode, addTransition]);

  // 接続モード開始
  const startConnectionMode = useCallback((stepId: string) => {
    setConnectionMode({ active: true, fromStepId: stepId });
  }, []);

  return (
    <div className="sfc-editor h-full flex">
      {/* ツールボックス */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SFC ツールボックス</h3>
        
        {/* ステップツール */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">要素</h4>
          <div className="space-y-2">
            <button
              onClick={() => setDraggedElement({ type: 'step' })}
              className={`w-full p-3 border rounded-lg text-left ${
                draggedElement?.type === 'step' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 border-2 border-gray-400 rounded mr-3 flex items-center justify-center">
                  S
                </div>
                ステップ
              </div>
            </button>
          </div>
        </div>

        {/* 選択された要素のプロパティ */}
        {selectedElement && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">プロパティ</h4>
            {(() => {
              const step = diagram.steps.find(s => s.id === selectedElement);
              const transition = diagram.transitions.find(t => t.id === selectedElement);
              
              if (step) {
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        ステップ名
                      </label>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => {
                          setDiagram(prev => ({
                            ...prev,
                            steps: prev.steps.map(s => 
                              s.id === selectedElement ? { ...s, name: e.target.value } : s
                            )
                          }));
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={step.isInitial}
                          onChange={(e) => {
                            setDiagram(prev => ({
                              ...prev,
                              steps: prev.steps.map(s => 
                                s.id === selectedElement 
                                  ? { ...s, isInitial: e.target.checked }
                                  : { ...s, isInitial: false } // 他を初期ステップから外す
                              )
                            }));
                          }}
                          className="mr-2"
                        />
                        <span className="text-xs">初期ステップ</span>
                      </label>
                    </div>

                    <div>
                      <button
                        onClick={() => addAction(step.id)}
                        className="w-full px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        アクション追加
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={() => startConnectionMode(step.id)}
                        className="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        接続モード
                      </button>
                    </div>

                    {/* アクション一覧 */}
                    {step.actions.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          アクション ({step.actions.length})
                        </label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {step.actions.map(action => (
                            <div key={action.id} className="p-2 bg-white border rounded text-xs">
                              <div className="font-medium">{action.name}</div>
                              <div className="text-gray-500">{action.qualifier}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (transition) {
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        遷移名
                      </label>
                      <input
                        type="text"
                        value={transition.name}
                        onChange={(e) => {
                          setDiagram(prev => ({
                            ...prev,
                            transitions: prev.transitions.map(t => 
                              t.id === selectedElement ? { ...t, name: e.target.value } : t
                            )
                          }));
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        条件
                      </label>
                      <textarea
                        value={transition.condition}
                        onChange={(e) => {
                          setDiagram(prev => ({
                            ...prev,
                            transitions: prev.transitions.map(t => 
                              t.id === selectedElement ? { ...t, condition: e.target.value } : t
                            )
                          }));
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded h-16 resize-none"
                        placeholder="例: X001 AND NOT Y002"
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}
      </div>

      {/* メインキャンバス */}
      <div className="flex-1 relative overflow-hidden">
        {/* ツールバー */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-2 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">SFC エディタ</span>
              <span className="text-xs text-gray-500">
                ステップ: {diagram.steps.length} | 遷移: {diagram.transitions.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {connectionMode.active && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  接続モード: 接続先を選択
                </span>
              )}
              <button 
                onClick={() => setConnectionMode({ active: false })}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ESC
              </button>
            </div>
          </div>
        </div>

        {/* キャンバス */}
        <div
          ref={canvasRef}
          className="w-full h-full pt-12 bg-white cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {/* 遷移線描画 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {diagram.transitions.map(transition => {
              const fromStep = diagram.steps.find(s => s.id === transition.fromStepId);
              const toStep = diagram.steps.find(s => s.id === transition.toStepId);
              
              if (!fromStep || !toStep) return null;

              const x1 = fromStep.position.x + 40;
              const y1 = fromStep.position.y + 60;
              const x2 = toStep.position.x + 40;
              const y2 = toStep.position.y;

              return (
                <g key={transition.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#4B5563"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  {/* 遷移条件テキスト */}
                  <foreignObject
                    x={(x1 + x2) / 2 - 30}
                    y={(y1 + y2) / 2 - 10}
                    width="60"
                    height="20"
                  >
                    <div
                      className={`text-xs bg-white border rounded px-1 text-center cursor-pointer ${
                        selectedElement === transition.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(transition.id);
                      }}
                    >
                      {transition.name}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            
            {/* 矢印マーカー */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#4B5563"
                />
              </marker>
            </defs>
          </svg>

          {/* ステップ描画 */}
          {diagram.steps.map(step => (
            <div
              key={step.id}
              className={`absolute w-20 h-12 border-2 rounded flex items-center justify-center cursor-pointer transition-all
                ${step.isInitial ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-white'}
                ${selectedElement === step.id ? 'border-blue-500 bg-blue-50' : ''}
                ${connectionMode.active && connectionMode.fromStepId === step.id ? 'border-yellow-500 bg-yellow-50' : ''}
                hover:border-blue-400`}
              style={{ 
                left: step.position.x, 
                top: step.position.y,
                zIndex: 2
              }}
              onClick={(e) => handleStepClick(step.id, e)}
            >
              <div className="text-center">
                <div className="text-xs font-medium">{step.name}</div>
                {step.actions.length > 0 && (
                  <div className="text-xs text-gray-500">A×{step.actions.length}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 