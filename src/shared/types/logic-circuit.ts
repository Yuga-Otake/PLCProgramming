/**
 * Logic Circuit AST Types
 * 中間表現として使用する論理回路の抽象構文木定義
 * ラダー図 ↔ ST ↔ SFC 等の相互変換に使用
 */

import { PLCDataType } from './plc';

// ベース論理ノード
export interface LogicNode {
  readonly id: string;
  readonly type: LogicNodeType;
  readonly position?: LogicPosition;
  readonly metadata?: Record<string, unknown>;
}

// 論理ノードの種類
export enum LogicNodeType {
  // 論理演算子
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  
  // PLC要素
  CONTACT = 'CONTACT',           // 接点
  COIL = 'COIL',                // コイル
  TIMER = 'TIMER',              // タイマー
  COUNTER = 'COUNTER',          // カウンタ
  FUNCTION_BLOCK = 'FUNCTION_BLOCK', // ファンクションブロック
  
  // 特殊要素
  POWER_RAIL = 'POWER_RAIL',    // 電源レール
  JUNCTION = 'JUNCTION',        // ジャンクション（分岐点）
  WIRE = 'WIRE',               // 配線
  
  // 値
  VARIABLE = 'VARIABLE',        // 変数参照
  LITERAL = 'LITERAL',         // リテラル値
  
  // 複合要素
  CIRCUIT = 'CIRCUIT',         // 回路全体
  RUNG = 'RUNG',              // ラング
}

// 位置情報（レイアウト復元用）
export interface LogicPosition {
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
  readonly layer?: number;      // 重ね順
}

// 論理演算ノード
export interface LogicOperatorNode extends LogicNode {
  readonly type: LogicNodeType.AND | LogicNodeType.OR | LogicNodeType.NOT | LogicNodeType.XOR;
  readonly inputs: LogicNode[];
  readonly optimization?: OptimizationHint;
}

// PLC要素ノード
export interface ContactNode extends LogicNode {
  readonly type: LogicNodeType.CONTACT;
  readonly variable: string;
  readonly contactType: ContactType;
  readonly dataType: PLCDataType;
}

export interface CoilNode extends LogicNode {
  readonly type: LogicNodeType.COIL;
  readonly variable: string;
  readonly coilType: CoilType;
  readonly dataType: PLCDataType;
  readonly condition: LogicNode;  // 入力条件
}

export interface TimerNode extends LogicNode {
  readonly type: LogicNodeType.TIMER;
  readonly variable: string;
  readonly timerType: TimerType;
  readonly preset: LogicNode;     // プリセット値
  readonly enable: LogicNode;     // イネーブル条件
}

export interface CounterNode extends LogicNode {
  readonly type: LogicNodeType.COUNTER;
  readonly variable: string;
  readonly counterType: CounterType;
  readonly preset: LogicNode;     // プリセット値
  readonly countUp: LogicNode;    // カウントアップ条件
  readonly reset?: LogicNode;     // リセット条件
}

export interface FunctionBlockNode extends LogicNode {
  readonly type: LogicNodeType.FUNCTION_BLOCK;
  readonly name: string;
  readonly instance: string;
  readonly inputs: Record<string, LogicNode>;
  readonly outputs: string[];
}

// 特殊要素
export interface PowerRailNode extends LogicNode {
  readonly type: LogicNodeType.POWER_RAIL;
  readonly railType: 'LEFT' | 'RIGHT';
}

export interface JunctionNode extends LogicNode {
  readonly type: LogicNodeType.JUNCTION;
  readonly connections: string[];  // 接続先ノードID
}

export interface WireNode extends LogicNode {
  readonly type: LogicNodeType.WIRE;
  readonly from: string;          // 開始ノードID
  readonly to: string;            // 終了ノードID
  readonly wireType: 'HORIZONTAL' | 'VERTICAL' | 'CONNECTOR';
}

// 値ノード
export interface VariableNode extends LogicNode {
  readonly type: LogicNodeType.VARIABLE;
  readonly name: string;
  readonly dataType: PLCDataType;
  readonly scope: VariableScope;
}

export interface LiteralNode extends LogicNode {
  readonly type: LogicNodeType.LITERAL;
  readonly value: boolean | number | string;
  readonly dataType: PLCDataType;
}

// 複合要素
export interface CircuitNode extends LogicNode {
  readonly type: LogicNodeType.CIRCUIT;
  readonly name: string;
  readonly rungs: RungNode[];
  readonly variables: VariableNode[];
  readonly circuitMetadata: CircuitMetadata;  // プロパティ名を変更してmetadataとの衝突を回避
}

export interface RungNode extends LogicNode {
  readonly type: LogicNodeType.RUNG;
  readonly index: number;
  readonly elements: LogicNode[];
  readonly comment?: string;
  readonly inputCondition: LogicNode;   // 入力条件
  readonly outputActions: LogicNode[];  // 出力アクション
}

// 列挙型定義
export enum ContactType {
  NO = 'NO',                    // A接点（ノーマルオープン）
  NC = 'NC',                    // B接点（ノーマルクローズ）
  RISING_EDGE = 'RISING_EDGE',  // 立ち上がりエッジ
  FALLING_EDGE = 'FALLING_EDGE' // 立ち下がりエッジ
}

export enum CoilType {
  NORMAL = 'NORMAL',            // 通常コイル
  SET = 'SET',                  // セットコイル
  RESET = 'RESET',              // リセットコイル
  RISING_EDGE = 'RISING_EDGE',  // 立ち上がりエッジ
  FALLING_EDGE = 'FALLING_EDGE' // 立ち下がりエッジ
}

export enum TimerType {
  TON = 'TON',                  // タイマーオン
  TOF = 'TOF',                  // タイマーオフ
  TP = 'TP'                     // パルスタイマー
}

export enum CounterType {
  CTU = 'CTU',                  // アップカウンタ
  CTD = 'CTD',                  // ダウンカウンタ
  CTUD = 'CTUD'                 // アップ/ダウンカウンタ
}

export enum VariableScope {
  LOCAL = 'LOCAL',
  GLOBAL = 'GLOBAL',
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  IN_OUT = 'IN_OUT'
}

// 最適化ヒント
export interface OptimizationHint {
  readonly priority: number;      // 優先度（0-10）
  readonly preferredLayout: 'SERIES' | 'PARALLEL' | 'COMPACT';
  readonly avoidOptimization?: boolean;
}

// 回路メタデータ
export interface CircuitMetadata {
  readonly title: string;
  readonly description?: string;
  readonly author?: string;
  readonly version?: string;
  readonly created: Date;
  readonly modified: Date;
  readonly optimizationLevel: 'NONE' | 'BASIC' | 'AGGRESSIVE';
}

// 変換結果
export interface LogicConversionResult {
  readonly success: boolean;
  readonly circuit: CircuitNode | null;
  readonly errors: LogicError[];
  readonly warnings: LogicWarning[];
  readonly statistics: ConversionStatistics;
}

export interface LogicError {
  readonly id: string;
  readonly message: string;
  readonly nodeId?: string;
  readonly position?: LogicPosition;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
}

export interface LogicWarning {
  readonly id: string;
  readonly message: string;
  readonly nodeId?: string;
  readonly suggestion?: string;
}

export interface ConversionStatistics {
  readonly nodeCount: number;
  readonly complexityScore: number;
  readonly optimizationApplied: boolean;
  readonly conversionTime: number;
}

// ユーティリティ型
export type LogicNodeUnion = 
  | LogicOperatorNode
  | ContactNode
  | CoilNode
  | TimerNode
  | CounterNode
  | FunctionBlockNode
  | PowerRailNode
  | JunctionNode
  | WireNode
  | VariableNode
  | LiteralNode
  | CircuitNode
  | RungNode;

// 型ガード関数用の型
export interface LogicNodeTypeMap {
  [LogicNodeType.AND]: LogicOperatorNode;
  [LogicNodeType.OR]: LogicOperatorNode;
  [LogicNodeType.NOT]: LogicOperatorNode;
  [LogicNodeType.XOR]: LogicOperatorNode;
  [LogicNodeType.CONTACT]: ContactNode;
  [LogicNodeType.COIL]: CoilNode;
  [LogicNodeType.TIMER]: TimerNode;
  [LogicNodeType.COUNTER]: CounterNode;
  [LogicNodeType.FUNCTION_BLOCK]: FunctionBlockNode;
  [LogicNodeType.POWER_RAIL]: PowerRailNode;
  [LogicNodeType.JUNCTION]: JunctionNode;
  [LogicNodeType.WIRE]: WireNode;
  [LogicNodeType.VARIABLE]: VariableNode;
  [LogicNodeType.LITERAL]: LiteralNode;
  [LogicNodeType.CIRCUIT]: CircuitNode;
  [LogicNodeType.RUNG]: RungNode;
}

// 型ガード関数
export function isLogicOperator(node: LogicNode): node is LogicOperatorNode {
  return [LogicNodeType.AND, LogicNodeType.OR, LogicNodeType.NOT, LogicNodeType.XOR].includes(node.type);
}

export function isContact(node: LogicNode): node is ContactNode {
  return node.type === LogicNodeType.CONTACT;
}

export function isCoil(node: LogicNode): node is CoilNode {
  return node.type === LogicNodeType.COIL;
}

export function isTimer(node: LogicNode): node is TimerNode {
  return node.type === LogicNodeType.TIMER;
}

export function isCounter(node: LogicNode): node is CounterNode {
  return node.type === LogicNodeType.COUNTER;
}

export function isJunction(node: LogicNode): node is JunctionNode {
  return node.type === LogicNodeType.JUNCTION;
}

export function isWire(node: LogicNode): node is WireNode {
  return node.type === LogicNodeType.WIRE;
}

export function isVariable(node: LogicNode): node is VariableNode {
  return node.type === LogicNodeType.VARIABLE;
}

export function isLiteral(node: LogicNode): node is LiteralNode {
  return node.type === LogicNodeType.LITERAL;
}

export function isCircuit(node: LogicNode): node is CircuitNode {
  return node.type === LogicNodeType.CIRCUIT;
}

export function isRung(node: LogicNode): node is RungNode {
  return node.type === LogicNodeType.RUNG;
}

// AST操作ユーティリティ
export interface LogicASTUtils {
  // ノード作成
  createLogicOperator(type: LogicNodeType.AND | LogicNodeType.OR | LogicNodeType.NOT, inputs: LogicNode[]): LogicOperatorNode;
  createContact(variable: string, contactType: ContactType): ContactNode;
  createCoil(variable: string, coilType: CoilType, condition: LogicNode): CoilNode;
  createJunction(position: LogicPosition): JunctionNode;
  
  // ノード検索
  findNodeById(circuit: CircuitNode, id: string): LogicNode | null;
  findNodesByType<T extends LogicNodeType>(circuit: CircuitNode, type: T): LogicNodeTypeMap[T][];
  findVariableReferences(circuit: CircuitNode, variableName: string): (ContactNode | CoilNode)[];
  
  // AST変換
  optimizeCircuit(circuit: CircuitNode): CircuitNode;
  validateCircuit(circuit: CircuitNode): LogicError[];
  calculateComplexity(circuit: CircuitNode): number;
}

// コンスタント
export const LOGIC_CIRCUIT_AST_VERSION = '1.0.0';

export const DEFAULT_OPTIMIZATION_HINT: OptimizationHint = {
  priority: 5,
  preferredLayout: 'COMPACT',
  avoidOptimization: false
};

export const DEFAULT_CIRCUIT_METADATA: Omit<CircuitMetadata, 'created' | 'modified'> = {
  title: 'Untitled Circuit',
  description: '',
  author: '',
  version: '1.0.0',
  optimizationLevel: 'BASIC'
}; 