/**
 * エディタ共通設定
 * 全PLCエディタで使用される設定値を一元管理
 */

export const EDITOR_CONFIG = {
  // グリッド設定
  grid: {
    size: 20,
    snapEnabled: true,
    visible: true,
    color: '#e5e7eb',
  },

  // キャンバス設定
  canvas: {
    background: '#ffffff',
    minZoom: 0.1,
    maxZoom: 3.0,
    defaultZoom: 1.0,
  },

  // 要素サイズ
  elements: {
    ladder: {
      contactWidth: 64,
      contactHeight: 32,
      coilDiameter: 24,
      blockWidth: 96,
      blockHeight: 64,
    },
    sfc: {
      stepWidth: 80,
      stepHeight: 48,
      transitionWidth: 60,
      transitionHeight: 20,
    },
  },

  // カラーテーマ
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    border: '#d1d5db',
    background: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
  },

  // アニメーション設定
  animation: {
    duration: 200,
    easing: 'ease-in-out',
    simulation: {
      cycleTime: 100, // ms
      highlightDuration: 500,
    },
  },

  // ツールボックス設定
  toolbox: {
    width: 256,
    itemHeight: 40,
    categorySpacing: 16,
  },

  // プロパティパネル設定
  properties: {
    width: 320,
    labelWidth: 100,
    inputHeight: 32,
  },

  // キーボードショートカット
  shortcuts: {
    delete: 'Delete',
    copy: 'Ctrl+C',
    paste: 'Ctrl+V',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    selectAll: 'Ctrl+A',
    save: 'Ctrl+S',
    escape: 'Escape',
  },

  // 検証設定
  validation: {
    maxVariableLength: 32,
    maxCommentLength: 256,
    allowedVariableChars: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    reservedWords: [
      'IF', 'THEN', 'ELSE', 'END_IF',
      'WHILE', 'END_WHILE',
      'FOR', 'TO', 'BY', 'END_FOR',
      'CASE', 'OF', 'END_CASE',
      'VAR', 'END_VAR',
      'FUNCTION', 'END_FUNCTION',
      'PROGRAM', 'END_PROGRAM',
    ],
  },

  // ファイル設定
  files: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['.st', '.ld', '.sfc', '.fbd'],
    autoSaveInterval: 30000, // 30秒
  },

  // デバッグ設定
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    showElementIds: false,
    showPositions: false,
    logStateChanges: false,
  },
} as const;

// 型安全なアクセス用のヘルパー関数
export function getEditorConfig<T extends keyof typeof EDITOR_CONFIG>(
  category: T
): typeof EDITOR_CONFIG[T] {
  return EDITOR_CONFIG[category];
}

// 設定の動的更新（開発用）
export function updateEditorConfig(
  category: keyof typeof EDITOR_CONFIG,
  updates: Partial<any>
): void {
  if (EDITOR_CONFIG.debug.enabled) {
    Object.assign(EDITOR_CONFIG[category], updates);
    console.log(`Editor config updated: ${category}`, updates);
  }
}

// PLC固有設定
export const PLC_CONFIG = {
  // NJ/NX series specific settings
  supportedSeries: ['NJ', 'NX'],
  maxVariableLength: 32,
  maxProgramBlocks: 1024,
  supportedDataTypes: [
    'BOOL', 'SINT', 'USINT', 'INT', 'UINT', 
    'DINT', 'UDINT', 'LINT', 'ULINT',
    'REAL', 'LREAL', 'TIME', 'STRING'
  ],
  supportedLanguages: ['ST', 'LD', 'SFC', 'FBD'],
  hardware: {
    maxInputs: 2048,
    maxOutputs: 2048,
    maxMemory: '32MB',
    executionCycle: '0.1ms'
  }
}; 