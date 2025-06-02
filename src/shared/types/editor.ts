/**
 * 共通エディタ型定義
 * 全PLCエディタで使用される共通の型を定義
 */

// 基本的なエディタプロパティ
export interface BaseEditorProps {
  onCodeChange?: (code: string) => void;
  readonly?: boolean;
  className?: string;
}

// 位置情報
export interface Position {
  x: number;
  y: number;
}

// 基本要素インターフェース
export interface BaseElement {
  id: string;
  position: Position;
  selected?: boolean;
}

// 変数関連
export interface Variable {
  name: string;
  type: string;
  value?: unknown;
  description?: string;
}

// エディタ状態管理
export interface EditorState {
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedElements: Set<string>;
  clipboard?: unknown;
}

// ツールボックス要素
export interface ToolboxItem {
  id: string;
  type: string;
  label: string;
  icon: string;
  category: string;
  description?: string;
}

// エディタアクション
export interface EditorAction {
  type: string;
  payload?: unknown;
  timestamp: number;
}

// コード変換オプション
export interface ConversionOptions {
  target: 'ST' | 'LD' | 'SFC';
  includeComments: boolean;
  formatOutput: boolean;
  validateSyntax: boolean;
}

// シミュレーション状態（共通）
export interface BaseSimulationState {
  isRunning: boolean;
  cycleTime: number;
  totalCycles: number;
  variables: Record<string, boolean | number | string>;
  errors: string[];
}

// エディタコンテキスト
export interface EditorContext {
  project: {
    name: string;
    version: string;
    target: 'NJ' | 'NX';
  };
  settings: {
    theme: 'light' | 'dark';
    fontSize: number;
    showGrid: boolean;
    snapToGrid: boolean;
  };
  features: {
    simulation: boolean;
    autoSave: boolean;
    collaboration: boolean;
  };
} 