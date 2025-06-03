'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  NOContact, 
  NCContact, 
  OutputCoil, 
  SetCoil, 
  ResetCoil, 
  TimerBlock, 
  CounterBlock,
  WireHorizontal,
  WireVertical,
  WireJunction,
  PowerRail,
  LadderElementType,
  CustomFBBlock
} from './ladder-elements';
import { 
  LadderElement,
  LadderRung,
  getAllToolboxElements,
  groupToolboxElementsByCategory,
  getDefaultVariable,
  generateVariableTable,
  filterSuggestions,
  convertToSTLanguage,
  LadderSimulator,
  SimulationState
} from '../utils/ladder-utils';
import { v4 as uuidv4 } from 'uuid';

interface LadderEditorProps {
  onCodeChange?: (ladderCode: string) => void;
}

export function LadderEditor({ onCodeChange }: LadderEditorProps): JSX.Element {
  // 状態管理
  const [rungs, setRungs] = useState<LadderRung[]>([
    {
      id: uuidv4(),
      elements: [
        {
          id: uuidv4(),
          type: LadderElementType.NO_CONTACT,
          variable: 'X001',
          position: { x: 1, y: 0 }
        },
        {
          id: uuidv4(),
          type: LadderElementType.OUTPUT_COIL,
          variable: 'Y001',
          position: { x: 6, y: 0 }
        }
      ],
      height: 1
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [draggedElementType, setDraggedElementType] = useState<LadderElementType | null>(null);
  
  // インテリジェント入力機能
  const [activeCell, setActiveCell] = useState<{rungId: string, position: {x: number, y: number}} | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // 機能表示状態
  const [showVariableTable, setShowVariableTable] = useState(false);
  const [showSTCode, setShowSTCode] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  // シミュレーション
  const [simulator, setSimulator] = useState<LadderSimulator | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

  // メモ化された値
  const toolboxCategories = useMemo(() => 
    groupToolboxElementsByCategory(getAllToolboxElements()), 
    []
  );

  const variableTable = useMemo(() => 
    generateVariableTable(rungs), 
    [rungs]
  );

  const stCode = useMemo(() => 
    convertToSTLanguage(rungs), 
    [rungs]
  );

  const filteredSuggestions = useMemo(() => 
    filterSuggestions(getAllToolboxElements(), searchFilter), 
    [searchFilter]
  );

  // ST言語変換効果
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(stCode);
    }
  }, [simulator, rungs, onCodeChange]);

  // シミュレーションのセットアップ
  useEffect(() => {
    if (showSimulation && !simulator) {
      const newSimulator = new LadderSimulator(rungs);
      setSimulator(newSimulator);
      setSimulationState(newSimulator.getState());
    } else if (!showSimulation && simulator) {
      simulator.stop();
      setSimulator(null);
      setSimulationState(null);
    }
  }, [showSimulation, rungs, simulator]);

  // シミュレーション状態更新
  useEffect(() => {
    if (simulator && simulationState?.isRunning) {
      const interval = setInterval(() => {
        setSimulationState(simulator.getState());
      }, 100);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [simulator, simulationState?.isRunning]);

  // インテリジェント入力関数
  const resetIntelligentInput = useCallback(() => {
    setActiveCell(null);
    setSearchFilter('');
    setSelectedSuggestionIndex(0);
  }, []);

  // 要素挿入
  const insertElementAtActiveCell = useCallback((elementType: LadderElementType, customFBId?: string) => {
    if (!activeCell) return;

    const newElement: LadderElement = {
      id: uuidv4(),
      type: elementType,
      variable: getDefaultVariable(elementType, customFBId),
      position: activeCell.position,
      // カスタムFBの場合の追加プロパティ
      ...(elementType === LadderElementType.CUSTOM_FB_BLOCK && customFBId && {
        customFBId,
        fbInstanceName: getDefaultVariable(elementType, customFBId)
      })
    };

    setRungs(prevRungs => 
      prevRungs.map(rung =>
        rung.id === activeCell.rungId
          ? { ...rung, elements: [...rung.elements, newElement] }
          : rung
      )
    );

    resetIntelligentInput();
  }, [activeCell, resetIntelligentInput]);

  const navigateSuggestions = useCallback((reverse: boolean) => {
    if (filteredSuggestions.length > 0) {
      setSelectedSuggestionIndex(prev => 
        reverse 
          ? (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length
          : (prev + 1) % filteredSuggestions.length
      );
    }
  }, [filteredSuggestions]);

  const confirmSuggestion = useCallback(() => {
    if (filteredSuggestions.length > 0 && activeCell) {
      const selectedSuggestion = filteredSuggestions[selectedSuggestionIndex];
      
      // 要素を直接挿入（カスタムFBの場合はcustomFBIdも渡す）
      insertElementAtActiveCell(
        selectedSuggestion.type,
        selectedSuggestion.customFBId
      );
    }
  }, [filteredSuggestions, selectedSuggestionIndex, activeCell, insertElementAtActiveCell]);

  // 削除機能
  const handleDeleteElements = useCallback(() => {
    const elementsToDelete = selectedElements.size > 0 ? selectedElements : new Set([selectedElement!]);
    setRungs(prevRungs => 
      prevRungs.map(rung => ({
        ...rung,
        elements: rung.elements.filter(element => !elementsToDelete.has(element.id))
      }))
    );
    setSelectedElement(null);
    setSelectedElements(new Set());
  }, [selectedElement, selectedElements]);

  // 選択解除
  const handleClearSelection = useCallback(() => {
    setSelectedElement(null);
    setSelectedElements(new Set());
    setRungs(prevRungs => 
      prevRungs.map(rung => ({
        ...rung,
        elements: rung.elements.map(element => ({
          ...element,
          selected: false
        }))
      }))
    );
  }, []);

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // インテリジェント入力モード
    if (activeCell) {
      if (event.key === 'Escape') {
        event.preventDefault();
        resetIntelligentInput();
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        navigateSuggestions(event.shiftKey);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        confirmSuggestion();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        setSearchFilter(prev => prev.slice(0, -1));
        setSelectedSuggestionIndex(0);
        return;
      }

      if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        event.preventDefault();
        const newFilter = searchFilter + event.key.toLowerCase();
        setSearchFilter(newFilter);
        setSelectedSuggestionIndex(0);
        return;
      }
    } else {
      // 通常モード
      if (event.key === 'Delete' && (selectedElement || selectedElements.size > 0)) {
        event.preventDefault();
        handleDeleteElements();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        handleClearSelection();
        return;
      }

      // Ctrl+A で全選択
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        const allElements = rungs.flatMap(r => r.elements);
        setSelectedElements(new Set(allElements.map(e => e.id)));
        if (allElements.length > 0) {
          setSelectedElement(allElements[0].id);
        }
        return;
      }
    }
  }, [activeCell, searchFilter, selectedSuggestionIndex, selectedElement, selectedElements, rungs, resetIntelligentInput, navigateSuggestions, confirmSuggestion, handleDeleteElements, handleClearSelection]);

  // キーボードイベントリスナーを設定
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 要素選択ハンドラー（複数選択対応）
  const handleElementSelect = useCallback((elementId: string, ctrlKey = false) => {
    if (ctrlKey) {
      // Ctrl+クリックで複数選択
      setSelectedElements(prev => {
        const newSet = new Set(prev);
        if (newSet.has(elementId)) {
          newSet.delete(elementId);
          setSelectedElement(newSet.size > 0 ? Array.from(newSet)[0] : null);
        } else {
          newSet.add(elementId);
          setSelectedElement(elementId);
        }
        return newSet;
      });
    } else {
      // 通常の単一選択
      setSelectedElement(elementId);
      setSelectedElements(new Set([elementId]));
    }
    
    // 全ての要素の選択状態を更新
    setRungs(prevRungs => 
      prevRungs.map(rung => ({
        ...rung,
        elements: rung.elements.map(element => ({
          ...element,
          selected: (ctrlKey ? selectedElements.has(element.id) : false) || element.id === elementId
        }))
      }))
    );
  }, [selectedElements]);

  // 要素編集ハンドラー
  const handleElementEdit = useCallback((elementId: string) => {
    const newVariable = prompt('変数名を入力してください:');
    if (newVariable) {
      setRungs(prevRungs => 
        prevRungs.map(rung => ({
          ...rung,
          elements: rung.elements.map(element =>
            element.id === elementId 
              ? { ...element, variable: newVariable }
              : element
          )
        }))
      );
    }
  }, []);

  // 要素削除ハンドラー
  const handleElementDelete = useCallback((elementId: string) => {
    setRungs(prevRungs => 
      prevRungs.map(rung => ({
        ...rung,
        elements: rung.elements.filter(element => element.id !== elementId)
      }))
    );
    setSelectedElement(null);
  }, []);

  // セルクリックハンドラー
  const handleCellClick = useCallback((rungId: string, position: { x: number; y: number }) => {
    // 既に要素がある場合は何もしない
    const rung = rungs.find(r => r.id === rungId);
    const existingElement = rung?.elements.find(el => 
      el.position.x === position.x && el.position.y === position.y
    );
    
    if (existingElement) return;

    // インテリジェント入力モードを開始
    setActiveCell({ rungId, position });
    setSearchFilter('');
    setSelectedSuggestionIndex(0);
  }, [rungs]);

  // ドラッグ開始
  const handleDragStart = useCallback((elementType: LadderElementType) => {
    setDraggedElementType(elementType);
  }, []);

  // ドロップハンドラー
  const handleDrop = useCallback((rungId: string, position: { x: number; y: number }) => {
    if (!draggedElementType) return;

    const newElement: LadderElement = {
      id: uuidv4(),
      type: draggedElementType,
      variable: getDefaultVariable(draggedElementType),
      position
    };

    setRungs(prevRungs => 
      prevRungs.map(rung =>
        rung.id === rungId
          ? { ...rung, elements: [...rung.elements, newElement] }
          : rung
      )
    );

    setDraggedElementType(null);
  }, [draggedElementType]);

  // シミュレーション制御
  const handleStartSimulation = useCallback(() => {
    if (simulator) {
      simulator.start();
      setSimulationState(simulator.getState());
    }
  }, [simulator]);

  const handleStopSimulation = useCallback(() => {
    if (simulator) {
      simulator.stop();
      setSimulationState(simulator.getState());
    }
  }, [simulator]);

  const handleToggleVariable = useCallback((variable: string) => {
    if (simulator) {
      const currentState = simulator.getState();
      const currentValue = currentState.variables[variable] || false;
      simulator.setVariable(variable, !currentValue);
      setSimulationState(simulator.getState());
    }
  }, [simulator]);

  // 要素レンダリング
  const renderElement = useCallback((element: LadderElement) => {
    const isSelected = selectedElements.has(element.id);
    
    const handleElementSelect = (id: string) => {
      setSelectedElement(id);
      if (!selectedElements.has(id)) {
        setSelectedElements(new Set([id]));
      }
    };

    const handleElementEdit = (id: string) => {
      // 要素編集機能（将来実装）
      console.log('Edit element:', id);
    };

    const commonProps = {
      id: element.id,
      variable: element.variable,
      selected: isSelected,
      onSelect: handleElementSelect,
      onEdit: handleElementEdit
    };

    switch (element.type) {
      case LadderElementType.NO_CONTACT:
        return <NOContact {...commonProps} />;
      case LadderElementType.NC_CONTACT:
        return <NCContact {...commonProps} />;
      case LadderElementType.OUTPUT_COIL:
        return <OutputCoil {...commonProps} />;
      case LadderElementType.SET_COIL:
        return <SetCoil {...commonProps} />;
      case LadderElementType.RESET_COIL:
        return <ResetCoil {...commonProps} />;
      case LadderElementType.TIMER_BLOCK:
        return <TimerBlock {...commonProps} />;
      case LadderElementType.COUNTER_BLOCK:
        return <CounterBlock {...commonProps} />;
      case LadderElementType.CUSTOM_FB_BLOCK:
        // カスタムFBブロックの場合、追加のプロパティを渡す
        const customFBProps = {
          ...commonProps,
          fbName: element.fbInstanceName || element.variable || 'CustomFB',
          inputCount: 2,  // 動的に設定可能
          outputCount: 1  // 動的に設定可能
        };
        return <CustomFBBlock {...customFBProps} />;
      case LadderElementType.WIRE_HORIZONTAL:
        return <WireHorizontal {...commonProps} />;
      case LadderElementType.WIRE_VERTICAL:
        return <WireVertical {...commonProps} />;
      case LadderElementType.WIRE_JUNCTION:
        return <WireJunction {...commonProps} />;
      default:
        return <div className="w-16 h-8 bg-red-100 border border-red-400 text-red-700 text-xs flex items-center justify-center">Unknown</div>;
    }
  }, [selectedElements]);

  // 新しいラングを追加
  const addNewRung = useCallback(() => {
    const newRung: LadderRung = {
      id: uuidv4(),
      elements: [],
      height: 1
    };
    setRungs(prev => [...prev, newRung]);
  }, []);

  // ラング削除
  const deleteRung = useCallback((rungId: string) => {
    setRungs(prev => prev.filter(rung => rung.id !== rungId));
  }, []);

  // 並列分岐の追加
  const addParallelBranch = useCallback((rungId: string, startX: number) => {
    const rung = rungs.find(r => r.id === rungId);
    if (!rung) return;

    // 並列分岐の完全な配線を作成
    const newElements: LadderElement[] = [];

    // 開始ジャンクション
    newElements.push({
      id: uuidv4(),
      type: LadderElementType.WIRE_JUNCTION,
      variable: 'JUNCTION_START',
      position: { x: startX, y: 0 }
    });

    // 終了ジャンクション（3セル後）
    newElements.push({
      id: uuidv4(),
      type: LadderElementType.WIRE_JUNCTION,
      variable: 'JUNCTION_END',
      position: { x: startX + 3, y: 0 }
    });

    // 下段の水平接続線（並列路）
    for (let x = startX; x <= startX + 3; x++) {
      newElements.push({
        id: uuidv4(),
        type: LadderElementType.WIRE_HORIZONTAL,
        variable: 'WIRE_PARALLEL',
        position: { x, y: 1 }
      });
    }

    // 垂直接続線（開始点）
    newElements.push({
      id: uuidv4(),
      type: LadderElementType.WIRE_VERTICAL,
      variable: 'WIRE_VERTICAL_START',
      position: { x: startX, y: 0 }
    });

    // 垂直接続線（終了点）
    newElements.push({
      id: uuidv4(),
      type: LadderElementType.WIRE_VERTICAL,
      variable: 'WIRE_VERTICAL_END',
      position: { x: startX + 3, y: 0 }
    });

    setRungs(prevRungs => 
      prevRungs.map(r => 
        r.id === rungId 
          ? { 
              ...r, 
              elements: [...r.elements, ...newElements],
              height: Math.max(r.height, 2)
            }
          : r
      )
    );
  }, [rungs]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* ツールボックス */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">ツールボックス</h3>
        <div className="space-y-4">
          {Object.entries(toolboxCategories).map(([categoryName, tools]) => (
            <div key={categoryName}>
              <h4 className="text-xs font-medium text-gray-700 mb-2">{categoryName}</h4>
              <div className="space-y-1">
                {tools.map((tool) => (
                  <div
                    key={tool.type}
                    className="flex items-center space-x-2 p-2 border border-gray-300 rounded cursor-move hover:bg-gray-50 text-xs"
                    draggable
                    onDragStart={() => handleDragStart(tool.type)}
                  >
                    <span className="font-mono text-gray-600 w-8">{tool.icon}</span>
                    <span>{tool.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 space-y-2">
          <button
            onClick={addNewRung}
            className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            + 新しいラング
          </button>
          
          <button
            onClick={() => setShowVariableTable(!showVariableTable)}
            className={`w-full px-3 py-2 text-xs font-medium text-white rounded ${
              showVariableTable ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            📊 変数テーブル
          </button>

          <button
            onClick={() => setShowSTCode(!showSTCode)}
            className={`w-full px-3 py-2 text-xs font-medium text-white rounded ${
              showSTCode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            🔤 ST言語
          </button>

          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className={`w-full px-3 py-2 text-xs font-medium text-white rounded ${
              showSimulation ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            ⚡ シミュレーション
          </button>
        </div>

        {/* 削除操作 */}
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-medium text-gray-900">編集操作</h4>
          {selectedElements.size > 0 && (
            <button
              onClick={handleDeleteElements}
              className="w-full px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
              title="選択要素を削除 (Delete)"
            >
              🗑️ 削除 ({selectedElements.size}個)
            </button>
          )}
          <div className="text-xs text-gray-600 space-y-1">
            <div>Delete: 選択要素削除</div>
            <div>Ctrl+クリック: 複数選択</div>
            <div>Esc: 選択解除</div>
            <div>セルクリック: インテリジェント入力</div>
            <div>並列接続: ツールボックスから接続点を配置</div>
          </div>
        </div>
      </div>

      {/* ラダー図エディタエリア */}
      <div className="flex-1 p-2 overflow-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-2 h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">ラダー図プログラム（機能統合版）</h3>
            <span className="text-xs text-gray-500">
              {rungs.length} ラング, {rungs.reduce((total, rung) => total + rung.elements.length, 0)} 要素
              {selectedElements.size > 0 && ` | 選択中: ${selectedElements.size}個`}
              {simulationState?.isRunning && ` | シミュレーション実行中`}
            </span>
          </div>

          {/* ラダー図 */}
          <div className="relative overflow-auto">
            <PowerRail />
            
            <div className="ml-8 space-y-2">
              {rungs.map((rung, rungIndex) => (
                <div
                  key={rung.id}
                  className="relative border-l border-dashed border-gray-300 pl-4 bg-gray-50 p-2 rounded-lg"
                  style={{ minHeight: `${rung.height * 80 + 40}px` }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left - 16) / 88);
                    const y = Math.floor((e.clientY - rect.top - 16) / 80);
                    handleDrop(rung.id, { x: Math.max(0, x), y: Math.max(0, y) });
                  }}
                >
                  {/* ラング番号と削除ボタン */}
                  <div className="absolute -left-8 top-0 flex items-center space-x-2">
                    <div className="text-xs text-gray-500 font-mono">
                      R{String(rungIndex + 1).padStart(3, '0')}
                    </div>
                    <button
                      onClick={() => deleteRung(rung.id)}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                      title="ラング削除"
                    >
                      ×
                    </button>
                  </div>

                  {/* 並列分岐ボタン */}
                  <div className="absolute -top-2 right-2">
                    <button
                      onClick={() => addParallelBranch(rung.id, 2)}
                      className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                      title="並列分岐を追加"
                    >
                      ∥
                    </button>
                  </div>

                  {/* 拡張グリッド（画面幅に応じて列数を動的調整） */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                    {Array.from({ length: 12 * rung.height }, (_, index) => {
                      const colIndex = index % 12;
                      const rowIndex = Math.floor(index / 12);
                      
                      const element = rung.elements.find(el => 
                        el.position.x === colIndex && el.position.y === rowIndex
                      );
                      const isActiveCell = activeCell?.rungId === rung.id && 
                        activeCell?.position.x === colIndex && 
                        activeCell?.position.y === rowIndex;
                      
                      // 並列分岐の配線チェック
                      const hasHorizontalWire = colIndex < 11 && (
                        rowIndex === 0 || 
                        rung.elements.some(el => 
                          el.type === LadderElementType.WIRE_HORIZONTAL && 
                          el.position.x === colIndex && 
                          el.position.y === rowIndex
                        )
                      );
                      
                      const hasVerticalWire = rung.elements.some(el => 
                        el.type === LadderElementType.WIRE_VERTICAL && 
                        el.position.x === colIndex && 
                        el.position.y < rowIndex && 
                        el.position.y + 1 >= rowIndex
                      );
                      
                      const hasJunction = rung.elements.some(el => 
                        el.type === LadderElementType.WIRE_JUNCTION && 
                        el.position.x === colIndex && 
                        el.position.y === rowIndex
                      );
                      
                      return (
                        <div key={`${rung.id}-${colIndex}-${rowIndex}`} className="flex items-center justify-center h-20 relative">
                          {element ? (
                            <div className={`${simulationState && simulationState.variables[element.variable] ? 'ring-2 ring-yellow-400 bg-yellow-100' : ''}`}>
                              {renderElement(element)}
                            </div>
                          ) : (
                            <div 
                              className={`w-20 h-12 border border-dashed rounded cursor-pointer transition-colors relative flex items-center justify-center ${
                                isActiveCell 
                                  ? 'border-blue-500 bg-blue-100' 
                                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                              }`}
                              onClick={() => handleCellClick(rung.id, { x: colIndex, y: rowIndex })}
                            >
                              {/* メイン水平線（最上段または配線要素がある場合） */}
                              {hasHorizontalWire && (
                                <div className="w-full h-0.5 bg-gray-600"></div>
                              )}
                              
                              {/* 垂直配線（並列回路用） - より太く明確に */}
                              {hasVerticalWire && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-600"></div>
                              )}
                              
                              {/* 接続点（ジャンクション）の視覚的強調 */}
                              {hasJunction && (
                                <>
                                  <div className="absolute w-2 h-2 bg-gray-800 rounded-full"></div>
                                  <div className="absolute w-full h-0.5 bg-gray-600"></div>
                                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-600"></div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 電源線への接続線 */}
                  <div className="absolute left-0 top-10 w-4 h-0.5 bg-gray-600"></div>
                </div>
              ))}
            </div>

            {/* インテリジェント入力候補リスト */}
            {activeCell && (
              <div 
                className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 max-w-sm"
                style={{
                  left: `${(activeCell.position.x + 1) * 88 + 50}px`,
                  top: `${rungs.findIndex(r => r.id === activeCell.rungId) * 100 + 60}px`
                }}
              >
                <div className="mb-2 p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium text-gray-700 mb-1">要素を選択</div>
                  <div className="text-xs text-gray-500">
                    入力でフィルタ | Tab/Shift+Tabで切り替え | Enterで確定 | Escでキャンセル
                  </div>
                  {searchFilter && (
                    <div className="text-xs text-blue-600 mt-1">
                      フィルタ: "{searchFilter}"
                    </div>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.type + (suggestion.customFBId || '')}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                        index === selectedSuggestionIndex
                          ? 'bg-blue-100 border border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => insertElementAtActiveCell(suggestion.type, suggestion.customFBId)}
                    >
                      <span className="font-mono text-sm text-gray-600 w-8">{suggestion.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{suggestion.label}</div>
                        <div className="text-xs text-gray-500">{suggestion.category}</div>
                      </div>
                      {index === selectedSuggestionIndex && (
                        <div className="text-xs text-blue-600">Tab</div>
                      )}
                    </div>
                  ))}
                  
                  {filteredSuggestions.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      マッチする候補がありません
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* プロパティ・機能パネル */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-3">プロパティ・機能</h3>
        
        {selectedElement ? (
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700">要素ID</label>
              <div className="text-xs text-gray-500 font-mono">{selectedElement.slice(0, 8)}...</div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">タイプ</label>
              <div className="text-xs text-gray-900">
                {rungs
                  .flatMap(r => r.elements)
                  .find(e => e.id === selectedElement)?.type}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">変数</label>
              <div className="text-xs text-gray-900 font-mono">
                {rungs
                  .flatMap(r => r.elements)
                  .find(e => e.id === selectedElement)?.variable}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-6">
            要素を選択してプロパティを表示
          </div>
        )}

        {/* シミュレーションパネル */}
        {showSimulation && (
          <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded">
            <h4 className="text-xs font-medium text-orange-900 mb-2">⚡ シミュレーション</h4>
            
            <div className="flex space-x-2 mb-3">
              <button
                onClick={handleStartSimulation}
                disabled={simulationState?.isRunning}
                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                ▶ 開始
              </button>
              <button
                onClick={handleStopSimulation}
                disabled={!simulationState?.isRunning}
                className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                ⏹ 停止
              </button>
            </div>

            {/* デバッグ情報 */}
            <div className="mb-3 p-2 bg-gray-100 rounded text-xs">
              <div className="font-medium text-gray-700 mb-1">🔍 デバッグ情報</div>
              <div className="space-y-1 text-gray-600">
                <div>ラング数: {rungs.length}</div>
                {rungs.map((rung, index) => {
                  const inputElements = rung.elements.filter(el => 
                    el.type === LadderElementType.NO_CONTACT || 
                    el.type === LadderElementType.NC_CONTACT
                  );
                  const outputElements = rung.elements.filter(el => 
                    el.type === LadderElementType.OUTPUT_COIL ||
                    el.type === LadderElementType.SET_COIL ||
                    el.type === LadderElementType.RESET_COIL
                  );
                  const junctions = rung.elements.filter(el => 
                    el.type === LadderElementType.WIRE_JUNCTION
                  );
                  
                  return (
                    <div key={rung.id} className="border-l-2 border-blue-300 pl-2">
                      <div>R{index + 1}: 入力{inputElements.length}個, 出力{outputElements.length}個, 接続点{junctions.length}個</div>
                      <div className="text-xs text-gray-500">
                        入力: {inputElements.map(el => `${el.variable}(${el.position.x},${el.position.y})`).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        出力: {outputElements.map(el => `${el.variable}(${el.position.x},${el.position.y})`).join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {simulationState && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">入力変数</div>
                {Object.entries(simulationState.variables)
                  .filter(([variable]) => variable.startsWith('X'))
                  .map(([variable, value]) => (
                    <div key={variable} className="flex items-center justify-between">
                      <span className="text-xs font-mono">{variable}</span>
                      <button
                        onClick={() => handleToggleVariable(variable)}
                        className={`px-2 py-1 text-xs rounded ${
                          value ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                      >
                        {value ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                
                <div className="text-xs font-medium text-gray-700 mt-3">出力変数</div>
                {Object.entries(simulationState.variables)
                  .filter(([variable]) => variable.startsWith('Y'))
                  .map(([variable, value]) => (
                    <div key={variable} className="flex items-center justify-between">
                      <span className="text-xs font-mono">{variable}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        value ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {value ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ST言語表示 */}
        {showSTCode && (
          <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded">
            <h4 className="text-xs font-medium text-purple-900 mb-2">🔤 ST言語</h4>
            <pre className="text-xs text-purple-700 bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
              {stCode}
            </pre>
          </div>
        )}

        {/* 変数テーブル */}
        {showVariableTable && (
          <div className="mb-6 p-3 bg-gray-50 rounded border">
            <h4 className="text-xs font-medium text-gray-900 mb-2">📊 変数テーブル</h4>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1">変数</th>
                    <th className="text-left py-1">タイプ</th>
                    <th className="text-center py-1">数</th>
                  </tr>
                </thead>
                <tbody>
                  {variableTable.map((row, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-1 font-mono text-blue-600">{row.variable}</td>
                      <td className="py-1 text-gray-600">{row.type.replace('_', ' ')}</td>
                      <td className="py-1 text-center">{row.usageCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {variableTable.length === 0 && (
                <div className="text-center py-4 text-gray-500">変数なし</div>
              )}
            </div>
          </div>
        )}

        {/* プロジェクト統計 */}
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="text-xs font-medium text-gray-900 mb-2">プロジェクト統計</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>ラング数: {rungs.length}</div>
            <div>総要素数: {rungs.reduce((total, rung) => total + rung.elements.length, 0)}</div>
            <div>配線要素数: {rungs.reduce((total, rung) => 
              total + rung.elements.filter(e => 
                e.type === LadderElementType.WIRE_HORIZONTAL || 
                e.type === LadderElementType.WIRE_VERTICAL ||
                e.type === LadderElementType.WIRE_JUNCTION
              ).length, 0)}</div>
            <div>変数数: {variableTable.length}</div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-xs font-medium text-blue-900 mb-2">🎯 統合機能</h4>
          <div className="text-xs text-blue-600 space-y-1">
            <div>✅ 削除機能（Delete キー）</div>
            <div>✅ インテリジェント入力</div>
            <div>✅ 文字検索フィルタ</div>
            <div>✅ 変数テーブル表示</div>
            <div>✅ ST言語変換</div>
            <div>✅ リアルタイムシミュレーション</div>
            <div>✅ 複数選択（Ctrl+クリック）</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LadderEditor; 