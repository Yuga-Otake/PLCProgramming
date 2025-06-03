import { LadderElementType } from '../components/ladder-elements';

// 基本インターフェース
export interface LadderElement {
  id: string;
  type: LadderElementType;
  variable: string;
  position: { x: number; y: number };
  selected?: boolean;
  // 将来のカスタムFB機能用プロパティ（予約）
  customFBId?: string;      // カスタムFB ID
  fbParameters?: Record<string, string | number | boolean>; // FBパラメータ
}

export interface LadderRung {
  id: string;
  elements: LadderElement[];
  height: number;
}

export interface ToolboxElement {
  type: LadderElementType;
  label: string;
  icon: string;
  category: string;
  customFBId?: string;      // カスタムFB用プロパティ追加
}

// ツールボックス要素定義（既存を維持）
export const TOOLBOX_ELEMENTS: ToolboxElement[] = [
  { type: LadderElementType.NO_CONTACT, label: 'A接点', icon: '|—|', category: '基本' },
  { type: LadderElementType.NC_CONTACT, label: 'B接点', icon: '|/|', category: '基本' },
  { type: LadderElementType.OUTPUT_COIL, label: '出力', icon: '(○)', category: '基本' },
  { type: LadderElementType.SET_COIL, label: 'セット', icon: '(S)', category: '基本' },
  { type: LadderElementType.RESET_COIL, label: 'リセット', icon: '(R)', category: '基本' },
  { type: LadderElementType.TIMER_BLOCK, label: 'タイマー', icon: 'TON', category: 'FB' },
  { type: LadderElementType.COUNTER_BLOCK, label: 'カウンタ', icon: 'CTU', category: 'FB' },
  { type: LadderElementType.WIRE_HORIZONTAL, label: '水平線', icon: '——', category: '配線' },
  { type: LadderElementType.WIRE_VERTICAL, label: '垂直線', icon: '|', category: '配線' },
  { type: LadderElementType.WIRE_JUNCTION, label: '接続点', icon: '┼', category: '配線' }
];

// デフォルト変数名を取得
export function getDefaultVariable(elementType: LadderElementType): string {
  switch (elementType) {
    case LadderElementType.NO_CONTACT:
    case LadderElementType.NC_CONTACT:
      return 'X001';
    case LadderElementType.OUTPUT_COIL:
    case LadderElementType.SET_COIL:
    case LadderElementType.RESET_COIL:
      return 'Y001';
    case LadderElementType.TIMER_BLOCK:
      return 'T001';
    case LadderElementType.COUNTER_BLOCK:
      return 'C001';
    case LadderElementType.WIRE_HORIZONTAL:
    case LadderElementType.WIRE_VERTICAL:
    case LadderElementType.WIRE_JUNCTION:
      return 'WIRE';
    default:
      return 'VAR';
  }
}

export interface LadderSimulator {
  // ... (existing code)
} 