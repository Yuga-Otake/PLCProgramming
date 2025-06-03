/**
 * 共有コンポーネント・ユーティリティ統一エクスポート
 * 全てのエディタから簡単にアクセスできるよう一元化
 */

// 型定義
export * from './types/plc';
export * from './types/editor';

// UIコンポーネント
export * from './ui/editor-layout';

// ユーティリティ
export * from './lib/utils/code-generator';
export * from './lib/hooks/use-editor-state';

// 設定
export * from './config/editor-config';

// 便利な再エクスポート
export {
  EditorLayout,
  ToolbarButton,
  StatusIndicator,
} from './ui/editor-layout';

export {
  CodeFormatter,
  VariableDeclarationGenerator,
  PLCCodeGenerator,
  createCodeGenerator,
} from './lib/utils/code-generator';

export {
  useEditorState,
} from './lib/hooks/use-editor-state';

export {
  EDITOR_CONFIG,
  LADDER_EDITOR_CONFIG,
  SFC_EDITOR_CONFIG,
  PLC_CONFIG,
} from './config/editor-config';

// 型のみの再エクスポート
export type {
  BaseEditorProps,
  Position,
  BaseElement,
  Variable,
  EditorState,
  ToolboxItem,
  EditorAction,
  ConversionOptions,
  BaseSimulationState,
  EditorContext,
} from './types/editor';

export type {
  PLCViewType,
} from './types/plc'; 