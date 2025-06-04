'use client';

import React from 'react';

// ラダー図要素の基本プロパティ
interface LadderElementProps {
  id: string;
  variable?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
}

// A接点（常時開接点）コンポーネント
export function NOContact({ id, variable = 'X001', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-16 h-8 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white hover:border-orange-500'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* 接点記号 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-0.5 bg-gray-600"></div>
        <div className="absolute w-2 h-4 border border-gray-600 bg-white"></div>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
    </div>
  );
}

// B接点（常時閉接点）コンポーネント  
export function NCContact({ id, variable = 'X002', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-16 h-8 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white hover:border-orange-500'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* 接点記号 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-0.5 bg-gray-600"></div>
        <div className="absolute w-2 h-4 border border-gray-600 bg-white"></div>
        {/* B接点の斜線 */}
        <div className="absolute w-3 h-0.5 bg-gray-600 transform rotate-45"></div>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
    </div>
  );
}

// 出力コイルコンポーネント
export function OutputCoil({ id, variable = 'Y001', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-16 h-8 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white hover:border-orange-500'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* コイル記号 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-0.5 bg-gray-600"></div>
        <div className="absolute w-6 h-6 border-2 border-gray-600 rounded-full bg-white"></div>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
    </div>
  );
}

// セットコイルコンポーネント
export function SetCoil({ id, variable = 'Y002', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-16 h-8 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white hover:border-orange-500'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* コイル記号 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-0.5 bg-gray-600"></div>
        <div className="absolute w-6 h-6 border-2 border-gray-600 rounded-full bg-white flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">S</span>
        </div>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
    </div>
  );
}

// リセットコイルコンポーネント
export function ResetCoil({ id, variable = 'Y003', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-16 h-8 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-600 bg-white hover:border-orange-500'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* コイル記号 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-8 h-0.5 bg-gray-600"></div>
        <div className="absolute w-6 h-6 border-2 border-gray-600 rounded-full bg-white flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">R</span>
        </div>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
    </div>
  );
}

// タイマーブロックコンポーネント
export function TimerBlock({ id, variable = 'T001', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-24 h-16 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-purple-600 bg-purple-50 hover:border-purple-700'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* タイマーブロック */}
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <span className="text-xs font-bold text-purple-700">TON</span>
        <span className="text-xs text-purple-600">PT:T#1s</span>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
      {/* 入出力端子 */}
      <div className="absolute -left-1 top-2 w-2 h-2 bg-purple-600 rounded-full"></div>
      <div className="absolute -right-1 top-2 w-2 h-2 bg-purple-600 rounded-full"></div>
    </div>
  );
}

// カウンターブロックコンポーネント
export function CounterBlock({ id, variable = 'C001', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-24 h-16 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-green-600 bg-green-50 hover:border-green-700'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* カウンターブロック */}
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <span className="text-xs font-bold text-green-700">CTU</span>
        <span className="text-xs text-green-600">PV:10</span>
      </div>
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
      {/* 入出力端子 */}
      <div className="absolute -left-1 top-2 w-2 h-2 bg-green-600 rounded-full"></div>
      <div className="absolute -right-1 top-2 w-2 h-2 bg-green-600 rounded-full"></div>
    </div>
  );
}

// カスタムFBブロックコンポーネント
interface CustomFBBlockProps extends LadderElementProps {
  fbName?: string;
  inputCount?: number;
  outputCount?: number;
}

export function CustomFBBlock({ 
  id, 
  variable = 'FB_INST', 
  selected, 
  onSelect, 
  onEdit,
  fbName = 'CustomFB',
  inputCount = 2,
  outputCount = 1
}: CustomFBBlockProps): JSX.Element {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-32 h-20 border-2 cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-indigo-600 bg-indigo-50 hover:border-indigo-700'
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* カスタムFBブロック */}
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <span className="text-xs font-bold text-indigo-700 truncate max-w-full">{fbName}</span>
        <span className="text-xs text-indigo-600">FB</span>
      </div>
      
      {/* 変数名 */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-700">
        {variable}
      </div>
      
      {/* 入力端子 */}
      {Array.from({ length: inputCount }).map((_, index) => (
        <div 
          key={`input-${index}`}
          className="absolute -left-1 w-2 h-2 bg-indigo-600 rounded-full"
          style={{ top: `${20 + (index * 15)}px` }}
        />
      ))}
      
      {/* 出力端子 */}
      {Array.from({ length: outputCount }).map((_, index) => (
        <div 
          key={`output-${index}`}
          className="absolute -right-1 w-2 h-2 bg-indigo-600 rounded-full"
          style={{ top: `${20 + (index * 15)}px` }}
        />
      ))}
    </div>
  );
}

// シンプルな水平配線
export function WireHorizontal({ id, variable: _variable = 'WIRE', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center w-16 h-8 cursor-pointer ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* 水平線 */}
      <div className="w-full h-0.5 bg-gray-600"></div>
      {/* ラベル */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-500">
        ——
      </div>
    </div>
  );
}

// シンプルな垂直配線
export function WireVertical({ id, variable: _variable = 'WIRE', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center w-16 h-8 cursor-pointer ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* 垂直線 */}
      <div className="w-0.5 h-full bg-gray-600"></div>
      {/* ラベル */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-500">
        |
      </div>
    </div>
  );
}

// シンプルな接続点（十字路）
export function WireJunction({ id, variable: _variable = 'NODE', selected, onSelect, onEdit }: LadderElementProps): JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center w-16 h-8 cursor-pointer ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
    >
      {/* 水平線 */}
      <div className="w-full h-0.5 bg-gray-600"></div>
      {/* 垂直線 */}
      <div className="absolute w-0.5 h-full bg-gray-600"></div>
      {/* 接続点 */}
      <div className="absolute w-2 h-2 bg-gray-600 rounded-full"></div>
      {/* ラベル */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-500">
        ┼
      </div>
    </div>
  );
}

// 水平線（配線）コンポーネント
export function HorizontalWire({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`h-0.5 bg-gray-600 ${className}`}></div>;
}

// 垂直線（配線）コンポーネント  
export function VerticalWire({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`w-0.5 bg-gray-600 ${className}`}></div>;
}

// 電源線コンポーネント
export function PowerRail({ height = 'auto' }: { height?: string }): JSX.Element {
  return (
    <div className={`w-1 bg-orange-600 ${height === 'auto' ? '' : height} mr-4 min-h-0`}>
      <div className="relative -left-2 top-0 text-xs font-bold text-orange-600">L1</div>
    </div>
  );
}

// ラダー図要素タイプの定義（シンプル版）
export enum LadderElementType {
  NO_CONTACT = 'NO_CONTACT',
  NC_CONTACT = 'NC_CONTACT',
  OUTPUT_COIL = 'OUTPUT_COIL',
  SET_COIL = 'SET_COIL',
  RESET_COIL = 'RESET_COIL',
  TIMER_BLOCK = 'TIMER_BLOCK',
  COUNTER_BLOCK = 'COUNTER_BLOCK',
  CUSTOM_FB_BLOCK = 'CUSTOM_FB_BLOCK',  // カスタムFBブロック追加
  // シンプルな配線要素
  WIRE_HORIZONTAL = 'WIRE_HORIZONTAL',
  WIRE_VERTICAL = 'WIRE_VERTICAL',
  WIRE_JUNCTION = 'WIRE_JUNCTION'
}

// 要素タイプからコンポーネントを取得するファクトリ関数
export function getLadderElement(type: LadderElementType, props: LadderElementProps): React.ReactElement | null {
  switch (type) {
    case LadderElementType.NO_CONTACT:
      return <NOContact {...props} />;
    case LadderElementType.NC_CONTACT:
      return <NCContact {...props} />;
    case LadderElementType.OUTPUT_COIL:
      return <OutputCoil {...props} />;
    case LadderElementType.SET_COIL:
      return <SetCoil {...props} />;
    case LadderElementType.RESET_COIL:
      return <ResetCoil {...props} />;
    case LadderElementType.TIMER_BLOCK:
      return <TimerBlock {...props} />;
    case LadderElementType.COUNTER_BLOCK:
      return <CounterBlock {...props} />;
    case LadderElementType.CUSTOM_FB_BLOCK:
      return <CustomFBBlock {...props} />;
    case LadderElementType.WIRE_HORIZONTAL:
      return <WireHorizontal {...props} />;
    case LadderElementType.WIRE_VERTICAL:
      return <WireVertical {...props} />;
    case LadderElementType.WIRE_JUNCTION:
      return <WireJunction {...props} />;
    default:
      return null;
  }
} 