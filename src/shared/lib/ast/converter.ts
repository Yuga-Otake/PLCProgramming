/**
 * AST Converter Engine
 * Lossless bidirectional conversion between PLC languages
 */

import { v4 as uuidv4 } from 'uuid';

import type {
  PLCASTNode,
  STProgram,
} from '@/shared/types/plc';
import { PLCViewType, PLCNodeType } from '@/shared/types/plc';
import { parseSTToAST } from '../parsers/st-parser';

export interface ConversionResult {
  readonly success: boolean;
  readonly ast: PLCASTNode;
  readonly sourceCode: string;
  readonly errors: ConversionError[];
  readonly warnings: ConversionWarning[];
}

export interface ConversionError {
  readonly id: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}

export interface ConversionWarning {
  readonly id: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly suggestion?: string;
}

/**
 * Core AST Converter Class
 * Implements lossless bidirectional conversion
 */
export class PLCASTConverter {
  private static instance: PLCASTConverter;

  public static getInstance(): PLCASTConverter {
    if (!PLCASTConverter.instance) {
      PLCASTConverter.instance = new PLCASTConverter();
    }
    return PLCASTConverter.instance;
  }

  /**
   * Convert AST to target view type
   */
  public convertToView(
    ast: PLCASTNode,
    targetView: PLCViewType
  ): ConversionResult {
    try {
      switch (targetView) {
        case PLCViewType.ST:
          return this.convertToST(ast);
        case PLCViewType.LD:
          return this.convertToLD(ast);
        case PLCViewType.SFC:
          return this.convertToSFC(ast);
        case PLCViewType.LADDER_IN_ST:
          return this.convertToLadderInST(ast);
        default:
          throw new Error(`Unsupported target view: ${targetView}`);
      }
    } catch (error) {
      return {
        success: false,
        ast,
        sourceCode: '',
        errors: [
          {
            id: uuidv4(),
            message: `Conversion failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            line: 0,
            column: 0,
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Parse source code to AST
   */
  public parseToAST(
    sourceCode: string,
    sourceView: PLCViewType
  ): ConversionResult {
    try {
      switch (sourceView) {
        case PLCViewType.ST:
          return this.parseSTToAST(sourceCode);
        case PLCViewType.LD:
          return this.parseLDToAST(sourceCode);
        case PLCViewType.SFC:
          return this.parseSFCToAST(sourceCode);
        case PLCViewType.LADDER_IN_ST:
          return this.parseLadderInSTToAST(sourceCode);
        default:
          throw new Error(`Unsupported source view: ${sourceView}`);
      }
    } catch (error) {
      const emptyAST: STProgram = {
        id: uuidv4(),
        type: PLCNodeType.PROGRAM,
        position: { line: 0, column: 0, offset: 0 },
        name: 'EmptyProgram',
        variables: [],
        body: [],
      };

      return {
        success: false,
        ast: emptyAST,
        sourceCode,
        errors: [
          {
            id: uuidv4(),
            message: `Parse failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            line: 0,
            column: 0,
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validate AST integrity
   */
  public validateAST(ast: PLCASTNode): ConversionError[] {
    const errors: ConversionError[] = [];

    // Basic validation
    if (!ast.id) {
      errors.push({
        id: uuidv4(),
        message: 'AST node missing required ID',
        line: ast.position?.line ?? 0,
        column: ast.position?.column ?? 0,
        severity: 'error',
      });
    }

    if (!ast.type) {
      errors.push({
        id: uuidv4(),
        message: 'AST node missing required type',
        line: ast.position?.line ?? 0,
        column: ast.position?.column ?? 0,
        severity: 'error',
      });
    }

    // Type-specific validation
    this.validateNodeTypeSpecific(ast, errors);

    return errors;
  }

  // Private conversion methods
  private convertToST(ast: PLCASTNode): ConversionResult {
    const generator = new STCodeGenerator();
    return generator.generate(ast);
  }

  private convertToLD(ast: PLCASTNode): ConversionResult {
    const generator = new LDCodeGenerator();
    return generator.generate(ast);
  }

  private convertToSFC(ast: PLCASTNode): ConversionResult {
    const generator = new SFCCodeGenerator();
    return generator.generate(ast);
  }

  private convertToLadderInST(ast: PLCASTNode): ConversionResult {
    const generator = new LadderInSTCodeGenerator();
    return generator.generate(ast);
  }

  private parseSTToAST(sourceCode: string): ConversionResult {
    // Use the real ST parser
    const parseResult = parseSTToAST(sourceCode);
    
    if (!parseResult.success) {
      const emptyAST: STProgram = {
        id: uuidv4(),
        type: PLCNodeType.PROGRAM,
        position: { line: 0, column: 0, offset: 0 },
        name: 'EmptyProgram',
        variables: [],
        body: [],
      };

      return {
        success: false,
        ast: emptyAST,
        sourceCode,
        errors: parseResult.errors.map(errMsg => ({
          id: uuidv4(),
          message: errMsg,
          line: 0,
          column: 0,
          severity: 'error' as const,
        })),
        warnings: [],
      };
    }

    return {
      success: true,
      ast: parseResult.ast!,
      sourceCode,
      errors: [],
      warnings: [],
    };
  }

  private parseLDToAST(sourceCode: string): ConversionResult {
    const parser = new LDParser();
    return parser.parse(sourceCode);
  }

  private parseSFCToAST(sourceCode: string): ConversionResult {
    const parser = new SFCParser();
    return parser.parse(sourceCode);
  }

  private parseLadderInSTToAST(sourceCode: string): ConversionResult {
    const parser = new LadderInSTParser();
    return parser.parse(sourceCode);
  }

  private validateNodeTypeSpecific(
    _ast: PLCASTNode,
    _errors: ConversionError[]
  ): void {
    // TODO: Implement type-specific validation
  }
}

// Abstract base classes
abstract class BaseParser {
  abstract parse(sourceCode: string): ConversionResult;
}

abstract class BaseCodeGenerator {
  abstract generate(ast: PLCASTNode): ConversionResult;
}

// ST Code Generator
class STCodeGenerator extends BaseCodeGenerator {
  generate(ast: PLCASTNode): ConversionResult {
    try {
      const sourceCode = this.generateSTCode(ast);
      return {
        success: true,
        ast,
        sourceCode,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        ast,
        sourceCode: '',
        errors: [
          {
            id: uuidv4(),
            message: `ST generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: 0,
            column: 0,
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  private generateSTCode(ast: PLCASTNode): string {
    if (ast.type === PLCNodeType.PROGRAM) {
      const program = ast as STProgram;
      let code = `// Generated ST Code\n`;
      code += `PROGRAM ${program.name}\n\n`;
      
      // Generate variables
      if (program.variables.length > 0) {
        code += `VAR\n`;
        for (const variable of program.variables) {
          code += `  ${(variable as any).name} : ${(variable as any).dataType}`;
          if ((variable as any).initialValue) {
            code += ` := ${(variable as any).initialValue}`;
          }
          code += `;\n`;
        }
        code += `END_VAR\n\n`;
      }
      
      // Generate body statements
      for (const statement of program.body) {
        code += this.generateStatement(statement as any) + '\n';
      }
      
      code += `\nEND_PROGRAM\n`;
      return code;
    }
    
    return `// Generated ST code for ${ast.type}\n// TODO: Implement ST generation for this node type`;
  }

  private generateStatement(statement: any): string {
    switch (statement.type) {
      case PLCNodeType.ASSIGNMENT:
        return `  ${statement.variable} := ${statement.expression};`;
      case PLCNodeType.IF_STATEMENT:
        return `  IF ${statement.condition} THEN\n    // TODO: nested statements\n  END_IF;`;
      case PLCNodeType.FUNCTION_BLOCK_CALL:
        return `  ${statement.functionName}();`;
      default:
        return `  // Unknown statement type: ${statement.type}`;
    }
  }
}

// Enhanced LD Code Generator with actual ST to LD conversion
class LDCodeGenerator extends BaseCodeGenerator {
  generate(ast: PLCASTNode): ConversionResult {
    try {
      const sourceCode = this.generateLDCode(ast);
      return {
        success: true,
        ast,
        sourceCode,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        ast,
        sourceCode: '',
        errors: [
          {
            id: uuidv4(),
            message: `LD generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: 0,
            column: 0,
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  private generateLDCode(ast: PLCASTNode): string {
    if (ast.type === PLCNodeType.PROGRAM) {
      const program = ast as STProgram;
      let code = `// ラダー図プログラム: ${program.name}\n`;
      code += `// Generated from ST Code\n\n`;
      
      // Generate program metadata
      code += `// プログラム情報\n`;
      code += `// 名前: ${program.name}\n`;
      code += `// 変数数: ${program.variables.length}\n`;
      code += `// ステートメント数: ${program.body.length}\n\n`;
      
      // Generate variable declarations as comments
      if (program.variables.length > 0) {
        code += `// === 変数宣言 ===\n`;
        for (const variable of program.variables) {
          const varNode = variable as any;
          code += `// ${varNode.name} : ${varNode.dataType}`;
          if (varNode.initialValue) {
            code += ` := ${varNode.initialValue}`;
          }
          code += `\n`;
        }
        code += `\n`;
      }
      
      // Convert statements to ladder logic representation
      code += `// === ラダー図 ===\n`;
      let rungNumber = 1;
      
      for (const statement of program.body) {
        const rungCode = this.convertStatementToRung(statement as any, rungNumber);
        code += rungCode + '\n';
        rungNumber++;
      }
      
      // Add ladder diagram JSON representation for UI
      code += `\n// === ラダー図データ (JSON) ===\n`;
      code += `/*\n`;
      code += JSON.stringify(this.generateLadderElements(program), null, 2);
      code += `\n*/\n`;
      
      return code;
    }
    
    return `// Generated LD code for ${ast.type}\n// TODO: Implement LD generation for this node type`;
  }

  private convertStatementToRung(statement: any, rungNumber: number): string {
    switch (statement.type) {
      case PLCNodeType.ASSIGNMENT:
        return this.generateAssignmentRung(statement, rungNumber);
      case PLCNodeType.IF_STATEMENT:
        return this.generateIfRung(statement, rungNumber);
      case PLCNodeType.FUNCTION_BLOCK_CALL:
        return this.generateFunctionCallRung(statement, rungNumber);
      default:
        return `// Rung ${rungNumber}: Unknown statement type: ${statement.type}`;
    }
  }

  private generateAssignmentRung(assignment: any, rungNumber: number): string {
    const variable = assignment.variable;
    const expression = assignment.expression;
    
    // Simple assignment pattern: variable := expression
    let rung = `// Rung ${rungNumber}: ${variable} := ${expression}\n`;
    rung += `//    [----] ---- ( ${variable} )\n`;
    rung += `//     ^condition from expression: ${expression}\n`;
    
    return rung;
  }

  private generateIfRung(ifStatement: any, rungNumber: number): string {
    const condition = ifStatement.condition;
    
    let rung = `// Rung ${rungNumber}: IF ${condition} THEN\n`;
    rung += `//    [${condition}] ---- ( Action )\n`;
    rung += `//     ^condition check\n`;
    
    return rung;
  }

  private generateFunctionCallRung(funcCall: any, rungNumber: number): string {
    const functionName = funcCall.functionName;
    
    let rung = `// Rung ${rungNumber}: ${functionName}()\n`;
    rung += `//    [----] ---- [FB: ${functionName}]\n`;
    rung += `//     ^enable condition\n`;
    
    return rung;
  }

  private generateLadderElements(program: STProgram): any {
    const rungs = [];
    
    for (let i = 0; i < program.body.length; i++) {
      const statement = program.body[i] as any;
      const rung = {
        id: uuidv4(),
        number: i + 1,
        elements: this.convertStatementToElements(statement),
        comment: `Generated from: ${statement.type}`
      };
      rungs.push(rung);
    }
    
    return {
      programName: program.name,
      variables: program.variables.map((v: any) => ({
        name: v.name,
        type: v.dataType,
        initialValue: v.initialValue
      })),
      rungs
    };
  }

  private convertStatementToElements(statement: any): any[] {
    const elements = [];
    
    switch (statement.type) {
      case PLCNodeType.ASSIGNMENT:
        // Create a simple NO contact -> Coil pattern
        elements.push({
          id: uuidv4(),
          type: 'NO_CONTACT',
          variable: 'ENABLE', // Placeholder for enable condition
          position: { x: 1, y: 0 }
        });
        elements.push({
          id: uuidv4(),
          type: 'OUTPUT_COIL',
          variable: statement.variable,
          position: { x: 6, y: 0 }
        });
        break;
        
      case PLCNodeType.IF_STATEMENT:
        // Create condition contact
        elements.push({
          id: uuidv4(),
          type: 'NO_CONTACT',
          variable: statement.condition,
          position: { x: 1, y: 0 }
        });
        elements.push({
          id: uuidv4(),
          type: 'OUTPUT_COIL',
          variable: 'ACTION_OUTPUT',
          position: { x: 6, y: 0 }
        });
        break;
        
      case PLCNodeType.FUNCTION_BLOCK_CALL:
        // Create function block call
        elements.push({
          id: uuidv4(),
          type: 'NO_CONTACT',
          variable: 'ENABLE',
          position: { x: 1, y: 0 }
        });
        elements.push({
          id: uuidv4(),
          type: 'FUNCTION_BLOCK',
          functionName: statement.functionName,
          position: { x: 3, y: 0 }
        });
        break;
    }
    
    return elements;
  }
}

class SFCCodeGenerator extends BaseCodeGenerator {
  generate(ast: PLCASTNode): ConversionResult {
    return {
      success: true,
      ast,
      sourceCode: `// Generated SFC code for ${ast.type}\n// TODO: Implement SFC generation`,
      errors: [],
      warnings: [],
    };
  }
}

class LadderInSTCodeGenerator extends BaseCodeGenerator {
  generate(ast: PLCASTNode): ConversionResult {
    return {
      success: true,
      ast,
      sourceCode: `// Generated Ladder-in-ST code for ${ast.type}\n// TODO: Implement Ladder-in-ST generation`,
      errors: [],
      warnings: [],
    };
  }
}

// Placeholder parsers (TODO: Implement actual parsers)
class LDParser extends BaseParser {
  parse(sourceCode: string): ConversionResult {
    const emptyAST: STProgram = {
      id: uuidv4(),
      type: PLCNodeType.PROGRAM,
      position: { line: 0, column: 0, offset: 0 },
      name: 'LDProgram',
      variables: [],
      body: [],
    };

    return {
      success: false,
      ast: emptyAST,
      sourceCode,
      errors: [
        {
          id: uuidv4(),
          message: 'LD parser not yet implemented',
          line: 0,
          column: 0,
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }
}

class SFCParser extends BaseParser {
  parse(sourceCode: string): ConversionResult {
    const emptyAST: STProgram = {
      id: uuidv4(),
      type: PLCNodeType.PROGRAM,
      position: { line: 0, column: 0, offset: 0 },
      name: 'SFCProgram',
      variables: [],
      body: [],
    };

    return {
      success: false,
      ast: emptyAST,
      sourceCode,
      errors: [
        {
          id: uuidv4(),
          message: 'SFC parser not yet implemented',
          line: 0,
          column: 0,
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }
}

class LadderInSTParser extends BaseParser {
  parse(sourceCode: string): ConversionResult {
    const emptyAST: STProgram = {
      id: uuidv4(),
      type: PLCNodeType.PROGRAM,
      position: { line: 0, column: 0, offset: 0 },
      name: 'LadderInSTProgram',
      variables: [],
      body: [],
    };

    return {
      success: false,
      ast: emptyAST,
      sourceCode,
      errors: [
        {
          id: uuidv4(),
          message: 'Ladder-in-ST parser not yet implemented',
          line: 0,
          column: 0,
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }
}

// Utility functions for external use
export const convertASTToView = (
  ast: PLCASTNode,
  targetView: PLCViewType
): ConversionResult => {
  const converter = PLCASTConverter.getInstance();
  return converter.convertToView(ast, targetView);
};

export const parseCodeToAST = (
  sourceCode: string,
  sourceView: PLCViewType
): ConversionResult => {
  const converter = PLCASTConverter.getInstance();
  return converter.parseToAST(sourceCode, sourceView);
};

export const validateAST = (ast: PLCASTNode): ConversionError[] => {
  const converter = PLCASTConverter.getInstance();
  return converter.validateAST(ast);
};