/**
 * ST (Structured Text) Parser
 * Simplified parser for demonstration purposes
 */

import { STLexer } from './st-tokenizer';
import { v4 as uuidv4 } from 'uuid';
import type { 
  PLCASTNode, 
  STProgram
} from '@/shared/types/plc';
import { PLCNodeType, PLCDataType } from '@/shared/types/plc';

// Parse function that converts source code to AST
export function parseSTToAST(sourceCode: string): { success: boolean; ast?: PLCASTNode; errors: string[] } {
  try {
    // Tokenize using the ST lexer
    const lexResult = STLexer.tokenize(sourceCode);
    
    if (lexResult.errors.length > 0) {
      return {
        success: false,
        errors: lexResult.errors.map(err => `Lexical error: ${err.message}`)
      };
    }

    // Simple pattern matching for basic ST structures
    const ast = parseBasicSTStructure(sourceCode);
    
    return {
      success: true,
      ast,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Parser error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

// Basic structure parser using regex patterns
function parseBasicSTStructure(sourceCode: string): STProgram {
  // Extract program name
  const programMatch = sourceCode.match(/PROGRAM\s+(\w+)/i);
  const programName = programMatch ? programMatch[1] : 'UnknownProgram';
  
  // Extract variables from VAR section
  const variables = parseVariables(sourceCode);
  
  // Extract basic statements
  const statements = parseStatements(sourceCode);
  
  return {
    id: uuidv4(),
    type: PLCNodeType.PROGRAM,
    position: { line: 1, column: 1, offset: 0 },
    name: programName,
    variables,
    body: statements
  };
}

// Parse variable declarations
function parseVariables(sourceCode: string) {
  const variables: any[] = [];
  const varSection = sourceCode.match(/VAR([\s\S]*?)END_VAR/i);
  
  if (varSection) {
    const varDeclarations = varSection[1].split(';');
    
    for (const decl of varDeclarations) {
      const trimmed = decl.trim();
      if (!trimmed) continue;
      
      // Pattern: variableName : DataType (:= initialValue)?
      const match = trimmed.match(/(\w+)\s*:\s*(\w+)(?:\s*:=\s*(.+))?/i);
      
      if (match) {
        const [, name, dataType, initialValue] = match;
        
        variables.push({
          id: uuidv4(),
          type: PLCNodeType.VARIABLE_DECLARATION,
          position: { line: 0, column: 0, offset: 0 },
          name: name.trim(),
          dataType: mapDataType(dataType.trim()),
          initialValue: initialValue ? initialValue.trim() : undefined
        });
      }
    }
  }
  
  return variables;
}

// Parse basic statements
function parseStatements(sourceCode: string) {
  const statements: any[] = [];
  
  // Extract the main program body (between VAR sections and END_PROGRAM)
  let body = sourceCode;
  
  // Remove VAR section
  body = body.replace(/VAR[\s\S]*?END_VAR/gi, '');
  
  // Remove PROGRAM declaration and END_PROGRAM
  body = body.replace(/PROGRAM\s+\w+/gi, '');
  body = body.replace(/END_PROGRAM/gi, '');
  
  // Split by lines and parse each statement
  const lines = body.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('(*')) continue;
    
    // Parse assignment statements
    const assignMatch = line.match(/(\w+(?:\.\w+)*)\s*:=\s*(.+);?/);
    if (assignMatch) {
      const [, variable, expression] = assignMatch;
      
      statements.push({
        id: uuidv4(),
        type: PLCNodeType.ASSIGNMENT,
        position: { line: i + 1, column: 1, offset: 0 },
        variable: variable.trim(),
        expression: expression.replace(/;$/, '').trim()
      });
      continue;
    }
    
    // Parse IF statements (simplified)
    if (line.toUpperCase().startsWith('IF ')) {
      statements.push({
        id: uuidv4(),
        type: PLCNodeType.IF_STATEMENT,
        position: { line: i + 1, column: 1, offset: 0 },
        condition: line.replace(/^IF\s+/i, '').replace(/\s+THEN$/i, '').trim(),
        thenStatements: [], // TODO: parse nested statements
        elseStatements: []
      });
      continue;
    }
    
    // Parse function calls
    const funcCallMatch = line.match(/(\w+)\s*\([^)]*\)\s*;?/);
    if (funcCallMatch) {
      const [, functionName] = funcCallMatch;
      
      statements.push({
        id: uuidv4(),
        type: PLCNodeType.FUNCTION_BLOCK_CALL,
        position: { line: i + 1, column: 1, offset: 0 },
        functionName: functionName.trim(),
        arguments: [] // TODO: parse arguments
      });
    }
  }
  
  return statements;
}

// Map string data types to enum values
function mapDataType(dataType: string): PLCDataType {
  switch (dataType.toUpperCase()) {
    case 'BOOL': return PLCDataType.BOOL;
    case 'INT': return PLCDataType.INT;
    case 'DINT': return PLCDataType.DINT;
    case 'REAL': return PLCDataType.REAL;
    case 'STRING': return PLCDataType.STRING;
    case 'TIME': return PLCDataType.TIME;
    case 'DATE': return PLCDataType.DATE;
    default: return PLCDataType.STRING; // fallback
  }
} 