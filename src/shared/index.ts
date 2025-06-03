/**
 * 共有コンポーネント・ユーティリティ統一エクスポート
 * 全てのエディタから簡単にアクセスできるよう一元化
 */

// 型定義
export * from './types/plc';

// 設定
export * from './config/editor-config';

// 便利な再エクスポート
export {
  EDITOR_CONFIG,
  PLC_CONFIG,
} from './config/editor-config';

// 型のみの再エクスポート
export type {
  PLCViewType,
} from './types/plc'; 