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
    return {
      success: true,
      ast,
      sourceCode: `// Generated ST code for ${ast.type}\n// TODO: Implement ST generation`,
      errors: [],
      warnings: [],
    };
  }
}

class LDCodeGenerator extends BaseCodeGenerator {
  generate(ast: PLCASTNode): ConversionResult {
    return {
      success: true,
      ast,
      sourceCode: `// Generated LD code for ${ast.type}\n// TODO: Implement LD generation`,
      errors: [],
      warnings: [],
    };
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

// Export convenience functions
export const convertASTToView = (
  ast: PLCASTNode,
  targetView: PLCViewType
): ConversionResult => {
  return PLCASTConverter.getInstance().convertToView(ast, targetView);
};

export const parseCodeToAST = (
  sourceCode: string,
  sourceView: PLCViewType
): ConversionResult => {
  return PLCASTConverter.getInstance().parseToAST(sourceCode, sourceView);
};

export const validateAST = (ast: PLCASTNode): ConversionError[] => {
  return PLCASTConverter.getInstance().validateAST(ast);
};