/**
 * Custom Function Block Types
 * カスタムファンクションブロックの定義と管理
 */

import { PLCDataType } from './plc';
import { LogicNode, LogicNodeType, LogicPosition } from './logic-circuit';

// カスタムFBの定義
export interface CustomFunctionBlock {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly created: Date;
  readonly modified: Date;
  readonly category: FBCategory;
  readonly icon?: string;
  readonly inputs: FBPin[];
  readonly outputs: FBPin[];
  readonly internalVariables: FBVariable[];
  readonly implementation: FBImplementation;
  readonly simulation: FBSimulation;
  readonly metadata: FBMetadata;
}

// FB入出力ピン
export interface FBPin {
  readonly id: string;
  readonly name: string;
  readonly dataType: PLCDataType;
  readonly description?: string;
  readonly defaultValue?: string | number | boolean;
  readonly required: boolean;
  readonly position: FBPinPosition;
}

export interface FBPinPosition {
  readonly side: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
  readonly index: number;
}

// FB内部変数
export interface FBVariable {
  readonly id: string;
  readonly name: string;
  readonly dataType: PLCDataType;
  readonly initialValue?: string | number | boolean;
  readonly description?: string;
  readonly scope: 'INTERNAL' | 'TEMP';
}

// FB実装
export interface FBImplementation {
  readonly language: FBLanguage;
  readonly sourceCode: string;
  readonly ladderLogic?: FBLadderLogic;
  readonly stLogic?: string;
  readonly optimization: FBOptimization;
}

export interface FBOptimization {
  readonly level: 'NONE' | 'BASIC' | 'AGGRESSIVE';
  readonly preferInline: boolean;
  readonly optimizeMemory: boolean;
  readonly optimizeSpeed: boolean;
}

export interface FBLadderLogic {
  readonly rungs: FBRung[];
  readonly connections: FBConnection[];
}

export interface FBRung {
  readonly id: string;
  readonly elements: LogicNode[];
  readonly comment?: string;
}

export interface FBConnection {
  readonly from: string;
  readonly to: string;
  readonly fromPin: string;
  readonly toPin: string;
}

// FBシミュレーション
export interface FBSimulation {
  readonly executionTime: number;      // μs
  readonly memoryUsage: number;        // bytes
  readonly simulationLogic: string;    // JavaScript実行ロジック
  readonly testCases: FBTestCase[];
}

export interface FBTestCase {
  readonly id: string;
  readonly name: string;
  readonly inputs: Record<string, string | number | boolean>;
  readonly expectedOutputs: Record<string, string | number | boolean>;
  readonly description?: string;
}

// FBメタデータ
export interface FBMetadata {
  readonly tags: string[];
  readonly complexity: FBComplexity;
  readonly compatibility: string[];     // 対応PLCシリーズ
  readonly license: string;
  readonly dependencies: string[];      // 依存するFB
  readonly export: FBExportSettings;
}

export interface FBExportSettings {
  readonly allowExport: boolean;
  readonly encryptionLevel: 'NONE' | 'BASIC' | 'ADVANCED';
  readonly accessLevel: 'PUBLIC' | 'PROTECTED' | 'PRIVATE';
}

// 列挙型
export enum FBCategory {
  TIMING = 'TIMING',           // タイミング制御
  COUNTING = 'COUNTING',       // カウンタ
  MATH = 'MATH',              // 数学演算
  LOGIC = 'LOGIC',            // 論理演算
  COMPARISON = 'COMPARISON',   // 比較
  DATA_HANDLING = 'DATA_HANDLING', // データ処理
  COMMUNICATION = 'COMMUNICATION', // 通信
  MOTION = 'MOTION',          // モーション制御
  SAFETY = 'SAFETY',          // 安全機能
  CUSTOM = 'CUSTOM',          // カスタム
  USER_DEFINED = 'USER_DEFINED' // ユーザー定義
}

export enum FBLanguage {
  ST = 'ST',                  // Structured Text
  LD = 'LD',                  // Ladder Diagram
  MIXED = 'MIXED',            // ST + LD混合
  JAVASCRIPT = 'JAVASCRIPT'    // シミュレーション用
}

export enum FBComplexity {
  SIMPLE = 'SIMPLE',          // 1-10行
  MEDIUM = 'MEDIUM',          // 11-50行
  COMPLEX = 'COMPLEX',        // 51-200行
  ADVANCED = 'ADVANCED'       // 200行以上
}

// FBライブラリ管理
export interface FBLibrary {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly created: Date;
  readonly modified: Date;
  readonly functionBlocks: CustomFunctionBlock[];
  readonly metadata: FBLibraryMetadata;
}

export interface FBLibraryMetadata {
  readonly icon?: string;
  readonly website?: string;
  readonly license: string;
  readonly compatibility: string[];
  readonly tags: string[];
  readonly downloadCount?: number;
  readonly rating?: number;
  readonly description?: string;
  readonly author?: string;
}

// FBインスタンス（LogicNodeを拡張）
export interface FBInstance extends LogicNode {
  readonly type: LogicNodeType.FUNCTION_BLOCK;
  readonly fbId: string;                // CustomFunctionBlock.id
  readonly instanceName: string;
  readonly parameters: Record<string, string | number | boolean>;
  readonly connections: FBInstanceConnection[];
}

export interface FBInstanceConnection {
  readonly pinId: string;
  readonly connectedTo: string;         // 接続先ノードID
  readonly connectedPin?: string;       // 接続先ピン
}

// FB作成・編集結果
export interface FBCreationResult {
  readonly success: boolean;
  readonly functionBlock: CustomFunctionBlock | null;
  readonly errors: FBError[];
  readonly warnings: FBWarning[];
}

export interface FBError {
  readonly id: string;
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
  readonly suggestion?: string;
}

export interface FBWarning {
  readonly id: string;
  readonly message: string;
  readonly suggestion?: string;
}

// FBライブラリ操作
export interface FBLibraryManager {
  // ライブラリ管理
  createLibrary(name: string, metadata: Partial<FBLibraryMetadata>): Promise<FBLibrary>;
  loadLibrary(path: string): Promise<FBLibrary>;
  saveLibrary(library: FBLibrary, path: string): Promise<boolean>;
  
  // FB管理
  addFunctionBlock(libraryId: string, fb: CustomFunctionBlock): Promise<boolean>;
  removeFunctionBlock(libraryId: string, fbId: string): Promise<boolean>;
  updateFunctionBlock(libraryId: string, fb: CustomFunctionBlock): Promise<boolean>;
  
  // 検索・フィルタ
  searchFunctionBlocks(query: string, category?: FBCategory): CustomFunctionBlock[];
  getFunctionBlocksByCategory(category: FBCategory): CustomFunctionBlock[];
  
  // インポート・エクスポート
  exportFunctionBlock(fbId: string, format: 'JSON' | 'XML' | 'PLCOpen'): Promise<string>;
  importFunctionBlock(data: string, format: 'JSON' | 'XML' | 'PLCOpen'): Promise<FBCreationResult>;
}

// デフォルト値
export const DEFAULT_FB_METADATA: Omit<FBMetadata, 'complexity'> = {
  tags: [],
  compatibility: ['NJ', 'NX'],
  license: 'MIT',
  dependencies: [],
  export: {
    allowExport: true,
    encryptionLevel: 'NONE',
    accessLevel: 'PUBLIC'
  }
};

export const DEFAULT_FB_SIMULATION: Omit<FBSimulation, 'simulationLogic'> = {
  executionTime: 1,
  memoryUsage: 64,
  testCases: []
};

// 標準FBテンプレート
export const STANDARD_FB_TEMPLATES: Record<string, Partial<CustomFunctionBlock>> = {
  TOF: {
    name: 'TOF',
    description: 'Timer Off Delay',
    category: FBCategory.TIMING,
    inputs: [
      {
        id: 'in',
        name: 'IN',
        dataType: PLCDataType.BOOL,
        required: true,
        position: { side: 'LEFT', index: 0 }
      },
      {
        id: 'pt',
        name: 'PT',
        dataType: PLCDataType.TIME,
        required: true,
        position: { side: 'LEFT', index: 1 }
      }
    ],
    outputs: [
      {
        id: 'q',
        name: 'Q',
        dataType: PLCDataType.BOOL,
        required: true,
        position: { side: 'RIGHT', index: 0 }
      },
      {
        id: 'et',
        name: 'ET',
        dataType: PLCDataType.TIME,
        required: false,
        position: { side: 'RIGHT', index: 1 }
      }
    ]
  },
  
  TP: {
    name: 'TP',
    description: 'Timer Pulse',
    category: FBCategory.TIMING,
    inputs: [
      {
        id: 'in',
        name: 'IN',
        dataType: PLCDataType.BOOL,
        required: true,
        position: { side: 'LEFT', index: 0 }
      },
      {
        id: 'pt',
        name: 'PT',
        dataType: PLCDataType.TIME,
        required: true,
        position: { side: 'LEFT', index: 1 }
      }
    ],
    outputs: [
      {
        id: 'q',
        name: 'Q',
        dataType: PLCDataType.BOOL,
        required: true,
        position: { side: 'RIGHT', index: 0 }
      },
      {
        id: 'et',
        name: 'ET',
        dataType: PLCDataType.TIME,
        required: false,
        position: { side: 'RIGHT', index: 1 }
      }
    ]
  },
  
  ADD: {
    name: 'ADD',
    description: 'Addition',
    category: FBCategory.MATH,
    inputs: [
      {
        id: 'in1',
        name: 'IN1',
        dataType: PLCDataType.REAL,
        required: true,
        position: { side: 'LEFT', index: 0 }
      },
      {
        id: 'in2',
        name: 'IN2',
        dataType: PLCDataType.REAL,
        required: true,
        position: { side: 'LEFT', index: 1 }
      }
    ],
    outputs: [
      {
        id: 'out',
        name: 'OUT',
        dataType: PLCDataType.REAL,
        required: true,
        position: { side: 'RIGHT', index: 0 }
      }
    ]
  }
};

// 型ガード関数
export function isCustomFB(node: LogicNode): node is FBInstance {
  return node.type === LogicNodeType.FUNCTION_BLOCK;
}

export function isFBPin(obj: unknown): obj is FBPin {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'dataType' in obj;
} 