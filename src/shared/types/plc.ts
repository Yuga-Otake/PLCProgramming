/**
 * NJ/NX PLC Language Types
 * Defines the core language structure for PLC programming
 */

// Base AST Node Types
export interface PLCASTNode {
  readonly id: string;
  readonly type: PLCNodeType;
  readonly position: Position;
  readonly metadata?: Record<string, unknown>;
}

export interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export enum PLCNodeType {
  // ST (Structured Text) Nodes
  PROGRAM = 'PROGRAM',
  FUNCTION_BLOCK = 'FUNCTION_BLOCK',
  FUNCTION = 'FUNCTION',
  VARIABLE_DECLARATION = 'VARIABLE_DECLARATION',
  ASSIGNMENT = 'ASSIGNMENT',
  IF_STATEMENT = 'IF_STATEMENT',
  FOR_LOOP = 'FOR_LOOP',
  WHILE_LOOP = 'WHILE_LOOP',
  EXPRESSION = 'EXPRESSION',
  
  // LD (Ladder Diagram) Nodes
  RUNG = 'RUNG',
  CONTACT = 'CONTACT',
  COIL = 'COIL',
  FUNCTION_BLOCK_CALL = 'FUNCTION_BLOCK_CALL',
  
  // SFC (Sequential Function Chart) Nodes
  STEP = 'STEP',
  TRANSITION = 'TRANSITION',
  ACTION = 'ACTION',
  
  // Common Nodes
  COMMENT = 'COMMENT',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL',
}

// ST Specific Types
export interface STProgram extends PLCASTNode {
  readonly type: PLCNodeType.PROGRAM;
  readonly name: string;
  readonly variables: VariableDeclaration[];
  readonly body: Statement[];
}

export interface VariableDeclaration extends PLCASTNode {
  readonly type: PLCNodeType.VARIABLE_DECLARATION;
  readonly name: string;
  readonly dataType: PLCDataType;
  readonly initialValue?: Expression;
  readonly attributes: VariableAttribute[];
}

export interface Statement extends PLCASTNode {
  // Base for all statements
}

export interface Expression extends PLCASTNode {
  readonly valueType: PLCDataType;
}

// LD Specific Types
export interface LDRung extends PLCASTNode {
  readonly type: PLCNodeType.RUNG;
  readonly elements: LDElement[];
  readonly comment?: string;
}

export interface LDElement extends PLCASTNode {
  readonly connections: Connection[];
}

export interface LDContact extends LDElement {
  readonly type: PLCNodeType.CONTACT;
  readonly variable: string;
  readonly contactType: ContactType;
}

export interface LDCoil extends LDElement {
  readonly type: PLCNodeType.COIL;
  readonly variable: string;
  readonly coilType: CoilType;
}

// SFC Specific Types
export interface SFCStep extends PLCASTNode {
  readonly type: PLCNodeType.STEP;
  readonly name: string;
  readonly actions: SFCAction[];
  readonly isInitial: boolean;
}

export interface SFCTransition extends PLCASTNode {
  readonly type: PLCNodeType.TRANSITION;
  readonly condition: Expression;
  readonly fromStep: string;
  readonly toStep: string;
}

export interface SFCAction extends PLCASTNode {
  readonly type: PLCNodeType.ACTION;
  readonly name: string;
  readonly qualifier: ActionQualifier;
  readonly body: Statement[];
}

// Enums and Supporting Types
export enum PLCDataType {
  BOOL = 'BOOL',
  BYTE = 'BYTE',
  WORD = 'WORD',
  DWORD = 'DWORD',
  LWORD = 'LWORD',
  SINT = 'SINT',
  INT = 'INT',
  DINT = 'DINT',
  LINT = 'LINT',
  USINT = 'USINT',
  UINT = 'UINT',
  UDINT = 'UDINT',
  ULINT = 'ULINT',
  REAL = 'REAL',
  LREAL = 'LREAL',
  STRING = 'STRING',
  TIME = 'TIME',
  DATE = 'DATE',
  TIME_OF_DAY = 'TIME_OF_DAY',
  DATE_AND_TIME = 'DATE_AND_TIME',
  ARRAY = 'ARRAY',
  STRUCT = 'STRUCT',
}

export enum VariableAttribute {
  VAR = 'VAR',
  VAR_INPUT = 'VAR_INPUT',
  VAR_OUTPUT = 'VAR_OUTPUT',
  VAR_IN_OUT = 'VAR_IN_OUT',
  VAR_GLOBAL = 'VAR_GLOBAL',
  VAR_EXTERNAL = 'VAR_EXTERNAL',
  CONSTANT = 'CONSTANT',
  RETAIN = 'RETAIN',
}

export enum ContactType {
  NORMALLY_OPEN = 'NO',
  NORMALLY_CLOSED = 'NC',
  POSITIVE_EDGE = 'P',
  NEGATIVE_EDGE = 'N',
}

export enum CoilType {
  NORMAL = 'NORMAL',
  SET = 'SET',
  RESET = 'RESET',
  POSITIVE_EDGE = 'P',
  NEGATIVE_EDGE = 'N',
}

export enum ActionQualifier {
  NONE = 'N',
  SET = 'S',
  RESET = 'R',
  PULSE = 'P',
  STORED = 'L',
  DELAYED = 'D',
  DELAYED_SET = 'DS',
  DELAYED_RESET = 'DR',
  STORED_DELAYED = 'SL',
  PULSE_DELAYED = 'PD',
}

export interface Connection {
  readonly from: string;
  readonly to: string;
  readonly type: 'POWER' | 'DATA';
}

// View Types
export enum PLCViewType {
  ST = 'ST',
  LD = 'LD',
  SFC = 'SFC',
  LADDER_IN_ST = 'LADDER_IN_ST',
}

// Project Types
export interface PLCProject {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly created: Date;
  readonly modified: Date;
  readonly programs: PLCProgram[];
  readonly globalVariables: VariableDeclaration[];
}

export interface PLCProgram {
  readonly id: string;
  readonly name: string;
  readonly language: PLCViewType;
  readonly ast: PLCASTNode;
  readonly sourceCode: string;
  readonly checksum: string;
} 