/**
 * ST (Structured Text) Tokenizer
 * IEC 61131-3 ST language tokenization
 */

import { createToken, Lexer } from 'chevrotain';

// Keywords
export const Program = createToken({ name: 'Program', pattern: /PROGRAM/i });
export const EndProgram = createToken({ name: 'EndProgram', pattern: /END_PROGRAM/i });
export const Var = createToken({ name: 'Var', pattern: /VAR/i });
export const EndVar = createToken({ name: 'EndVar', pattern: /END_VAR/i });
export const If = createToken({ name: 'If', pattern: /IF/i });
export const Then = createToken({ name: 'Then', pattern: /THEN/i });
export const Else = createToken({ name: 'Else', pattern: /ELSE/i });
export const ElsIf = createToken({ name: 'ElsIf', pattern: /ELSIF/i });
export const EndIf = createToken({ name: 'EndIf', pattern: /END_IF/i });
export const For = createToken({ name: 'For', pattern: /FOR/i });
export const To = createToken({ name: 'To', pattern: /TO/i });
export const By = createToken({ name: 'By', pattern: /BY/i });
export const Do = createToken({ name: 'Do', pattern: /DO/i });
export const EndFor = createToken({ name: 'EndFor', pattern: /END_FOR/i });
export const While = createToken({ name: 'While', pattern: /WHILE/i });
export const EndWhile = createToken({ name: 'EndWhile', pattern: /END_WHILE/i });
export const Repeat = createToken({ name: 'Repeat', pattern: /REPEAT/i });
export const Until = createToken({ name: 'Until', pattern: /UNTIL/i });
export const EndRepeat = createToken({ name: 'EndRepeat', pattern: /END_REPEAT/i });
export const Case = createToken({ name: 'Case', pattern: /CASE/i });
export const Of = createToken({ name: 'Of', pattern: /OF/i });
export const EndCase = createToken({ name: 'EndCase', pattern: /END_CASE/i });
// FunctionBlock must come before Function (longer match first)
export const FunctionBlock = createToken({ name: 'FunctionBlock', pattern: /FUNCTION_BLOCK/i });
export const EndFunctionBlock = createToken({ name: 'EndFunctionBlock', pattern: /END_FUNCTION_BLOCK/i });
export const Function = createToken({ name: 'Function', pattern: /FUNCTION/i });
export const EndFunction = createToken({ name: 'EndFunction', pattern: /END_FUNCTION/i });

// Data Types
export const Bool = createToken({ name: 'Bool', pattern: /BOOL/i });
export const Int = createToken({ name: 'Int', pattern: /INT/i });
export const Dint = createToken({ name: 'Dint', pattern: /DINT/i });
export const Real = createToken({ name: 'Real', pattern: /REAL/i });
export const String = createToken({ name: 'String', pattern: /STRING/i });
export const Time = createToken({ name: 'Time', pattern: /TIME/i });
export const Date = createToken({ name: 'Date', pattern: /DATE/i });

// Operators
export const Assign = createToken({ name: 'Assign', pattern: /:=/ });
export const Equal = createToken({ name: 'Equal', pattern: /=/ });
export const NotEqual = createToken({ name: 'NotEqual', pattern: /<>/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });
export const LessEqual = createToken({ name: 'LessEqual', pattern: /<=/ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const GreaterEqual = createToken({ name: 'GreaterEqual', pattern: />=/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const Mod = createToken({ name: 'Mod', pattern: /MOD/i });
export const And = createToken({ name: 'And', pattern: /AND/i });
export const Or = createToken({ name: 'Or', pattern: /OR/i });
export const Xor = createToken({ name: 'Xor', pattern: /XOR/i });
export const Not = createToken({ name: 'Not', pattern: /NOT/i });

// Literals
export const BooleanLiteral = createToken({ 
  name: 'BooleanLiteral', 
  pattern: /TRUE|FALSE/i 
});

export const IntegerLiteral = createToken({ 
  name: 'IntegerLiteral', 
  pattern: /\d+/ 
});

export const RealLiteral = createToken({ 
  name: 'RealLiteral', 
  pattern: /\d+\.\d+/ 
});

export const StringLiteral = createToken({ 
  name: 'StringLiteral', 
  pattern: /'[^']*'/ 
});

export const TimeLiteral = createToken({ 
  name: 'TimeLiteral', 
  pattern: /T#\d+[smhd]?/i 
});

// Identifiers
export const Identifier = createToken({ 
  name: 'Identifier', 
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ 
});

// Punctuation
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const LeftParen = createToken({ name: 'LeftParen', pattern: /\(/ });
export const RightParen = createToken({ name: 'RightParen', pattern: /\)/ });
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ });

// Comments
export const LineComment = createToken({ 
  name: 'LineComment', 
  pattern: /\/\/[^\r\n]*/, 
  group: Lexer.SKIPPED 
});

export const BlockComment = createToken({ 
  name: 'BlockComment', 
  pattern: /\(\*[\s\S]*?\*\)/, 
  group: Lexer.SKIPPED 
});

// Whitespace
export const WhiteSpace = createToken({ 
  name: 'WhiteSpace', 
  pattern: /\s+/, 
  group: Lexer.SKIPPED 
});

// Token array for lexer (order matters! Longer tokens must come first)
export const allTokens = [
  // Comments first (longest match)
  BlockComment,
  LineComment,
  
  // Keywords (longer keywords before shorter ones)
  Program, EndProgram,
  Var, EndVar,
  If, Then, Else, ElsIf, EndIf,
  For, To, By, Do, EndFor,
  While, EndWhile,
  Repeat, Until, EndRepeat,
  Case, Of, EndCase,
  // FunctionBlock must come before Function (longer match first)
  FunctionBlock, EndFunctionBlock,
  Function, EndFunction,
  
  // Data types
  Bool, Int, Dint, Real, String, Time, Date,
  
  // Boolean operators (before identifiers)
  And, Or, Xor, Not, Mod,
  
  // Multi-character operators (before single-character)
  Assign, NotEqual, LessEqual, GreaterEqual,
  
  // Single-character operators
  Equal, LessThan, GreaterThan,
  Plus, Minus, Multiply, Divide,
  
  // Literals
  BooleanLiteral,
  RealLiteral, // Before IntegerLiteral (longer match)
  IntegerLiteral,
  StringLiteral,
  TimeLiteral,
  
  // Identifiers (after keywords)
  Identifier,
  
  // Punctuation
  Semicolon, Colon, Comma, Dot,
  LeftParen, RightParen,
  LeftBracket, RightBracket,
  
  // Whitespace (last)
  WhiteSpace
];

// Create lexer instance
export const STLexer = new Lexer(allTokens); 