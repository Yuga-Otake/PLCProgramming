import { LadderElementType } from '../components/ladder-elements';
import { CustomFunctionBlock, FBCategory } from '../../../shared/types/custom-function-block';
import { customFBManager } from '../../../shared/lib/custom-fb/custom-fb-manager';

// 基本インターフェース
export interface LadderElement {
  id: string;
  type: LadderElementType;
  variable: string;
  position: { x: number; y: number };
  selected?: boolean;
  // カスタムFB機能用プロパティ
  customFBId?: string;      // カスタムFB ID
  fbInstanceName?: string;  // FBインスタンス名
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
  customFBId?: string;      // カスタムFB用プロパティ
  customFB?: CustomFunctionBlock; // カスタムFB定義
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

// カスタムFBのツールボックス要素を生成
export function getCustomFBToolboxElements(): ToolboxElement[] {
  try {
    const customFBs = customFBManager.getAllFunctionBlocks();
    return customFBs.map((fb: CustomFunctionBlock) => ({
      type: LadderElementType.CUSTOM_FB_BLOCK, // 新しい要素タイプ
      label: fb.name,
      icon: fb.icon || fb.name.substring(0, 3).toUpperCase(),
      category: getCategoryDisplayName(fb.category),
      customFBId: fb.id,
      customFB: fb
    }));
  } catch (error) {
    console.error('Failed to load custom FBs for toolbox:', error);
    return [];
  }
}

// 全ツールボックス要素を取得（標準 + カスタムFB）
export function getAllToolboxElements(): ToolboxElement[] {
  return [
    ...TOOLBOX_ELEMENTS,
    ...getCustomFBToolboxElements()
  ];
}

// ツールボックス要素をカテゴリ別にグループ化
export function groupToolboxElementsByCategory(elements: ToolboxElement[]): Record<string, ToolboxElement[]> {
  return elements.reduce((groups, element) => {
    const category = element.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(element);
    return groups;
  }, {} as Record<string, ToolboxElement[]>);
}

// デフォルト変数名を取得
export function getDefaultVariable(elementType: LadderElementType, customFBId?: string): string {
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
    case LadderElementType.CUSTOM_FB_BLOCK:
      if (customFBId) {
        const fb = customFBManager.getFunctionBlock(customFBId);
        return fb ? `${fb.name}_INST` : 'FB_INST';
      }
      return 'FB_INST';
    case LadderElementType.WIRE_HORIZONTAL:
    case LadderElementType.WIRE_VERTICAL:
    case LadderElementType.WIRE_JUNCTION:
      return 'WIRE';
    default:
      return 'VAR';
  }
}

// カテゴリ表示名を取得
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

// 検索フィルタリング
export function filterSuggestions(elements: ToolboxElement[], filter: string): ToolboxElement[] {
  if (!filter) return elements;
  
  const lowerFilter = filter.toLowerCase();
  return elements.filter(element =>
    element.label.toLowerCase().includes(lowerFilter) ||
    element.category.toLowerCase().includes(lowerFilter) ||
    element.icon.toLowerCase().includes(lowerFilter)
  );
}

// 変数テーブル生成
export function generateVariableTable(rungs: LadderRung[]): Array<{
  variable: string;
  type: string;
  usageCount: number;
  elements: string[];
}> {
  const variableMap = new Map<string, {
    type: string;
    usageCount: number;
    elements: string[];
  }>();

  rungs.forEach(rung => {
    rung.elements.forEach(element => {
      if (element.variable && element.variable !== 'WIRE') {
        const existing = variableMap.get(element.variable);
        const elementTypeStr = element.type.toString();
        
        if (existing) {
          existing.usageCount++;
          if (!existing.elements.includes(elementTypeStr)) {
            existing.elements.push(elementTypeStr);
          }
        } else {
          variableMap.set(element.variable, {
            type: getVariableType(element.variable),
            usageCount: 1,
            elements: [elementTypeStr]
          });
        }
      }
    });
  });

  return Array.from(variableMap.entries()).map(([variable, data]) => ({
    variable,
    ...data
  }));
}

// 変数タイプを推定
function getVariableType(variable: string): string {
  if (variable.startsWith('X')) return 'INPUT';
  if (variable.startsWith('Y')) return 'OUTPUT';
  if (variable.startsWith('M')) return 'MEMORY';
  if (variable.startsWith('T')) return 'TIMER';
  if (variable.startsWith('C')) return 'COUNTER';
  if (variable.endsWith('_INST')) return 'FB_INSTANCE';
  return 'UNKNOWN';
}

// ST言語変換
export function convertToSTLanguage(rungs: LadderRung[]): string {
  if (rungs.length === 0) return '';

  const stLines: string[] = [];
  stLines.push('PROGRAM MainProgram');
  stLines.push('VAR');
  
  // 変数宣言
  const variables = generateVariableTable(rungs);
  variables.forEach(variable => {
    if (variable.type !== 'UNKNOWN') {
      stLines.push(`  ${variable.variable} : ${variable.type};`);
    }
  });
  
  stLines.push('END_VAR');
  stLines.push('');
  
  // ラング処理
  rungs.forEach((rung, index) => {
    stLines.push(`// Rung ${index + 1}`);
    const rungCode = convertRungToST(rung);
    if (rungCode) {
      stLines.push(rungCode);
    }
    stLines.push('');
  });
  
  stLines.push('END_PROGRAM');
  
  return stLines.join('\n');
}

// 個別ラング変換
function convertRungToST(rung: LadderRung): string {
  // 簡単な変換ロジック（既存の実装を維持）
  const outputs = rung.elements.filter(el => 
    el.type === LadderElementType.OUTPUT_COIL ||
    el.type === LadderElementType.SET_COIL ||
    el.type === LadderElementType.RESET_COIL
  );
  
  const inputs = rung.elements.filter(el => 
    el.type === LadderElementType.NO_CONTACT ||
    el.type === LadderElementType.NC_CONTACT
  );
  
  if (outputs.length === 0 || inputs.length === 0) return '';
  
  const inputExpression = inputs.map(input => {
    const variable = input.variable;
    return input.type === LadderElementType.NC_CONTACT ? `NOT ${variable}` : variable;
  }).join(' AND ');
  
  return outputs.map(output => {
    const operator = output.type === LadderElementType.SET_COIL ? 'S' :
                    output.type === LadderElementType.RESET_COIL ? 'R' : ':=';
    return `${output.variable} ${operator} ${inputExpression};`;
  }).join('\n');
}

// シミュレーション関連（既存の実装を維持）
export interface SimulationState {
  isRunning: boolean;
  cycleTime: number;
  variables: Record<string, boolean>;
  timers: Record<string, { current: number; preset: number }>;
  counters: Record<string, { current: number; preset: number }>;
}

export class LadderSimulator {
  private state: SimulationState;
  private rungs: LadderRung[];
  private intervalId: number | null = null;

  constructor(rungs: LadderRung[]) {
    this.rungs = rungs;
    this.state = {
      isRunning: false,
      cycleTime: 10, // ms
      variables: {},
      timers: {},
      counters: {}
    };
  }

  start(): void {
    this.state.isRunning = true;
    this.intervalId = window.setInterval(() => {
      this.executeCycle();
    }, this.state.cycleTime);
  }

  stop(): void {
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  setVariable(variable: string, value: boolean): void {
    this.state.variables[variable] = value;
  }

  private executeCycle(): void {
    // 簡単なシミュレーションロジック
    this.rungs.forEach(rung => {
      this.executeRung(rung);
    });
  }

  private executeRung(rung: LadderRung): void {
    // 基本的なラング実行（既存ロジック）
    const outputs = rung.elements.filter(el => 
      el.type === LadderElementType.OUTPUT_COIL
    );
    
    const inputs = rung.elements.filter(el => 
      el.type === LadderElementType.NO_CONTACT ||
      el.type === LadderElementType.NC_CONTACT
    );
    
    if (outputs.length > 0 && inputs.length > 0) {
      const result = inputs.every(input => {
        const value = this.state.variables[input.variable] || false;
        return input.type === LadderElementType.NC_CONTACT ? !value : value;
      });
      
      outputs.forEach(output => {
        this.state.variables[output.variable] = result;
      });
    }
  }
} 