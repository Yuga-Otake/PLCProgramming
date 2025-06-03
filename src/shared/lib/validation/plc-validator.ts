/**
 * PLC Code Validator
 * Real-time syntax checking and validation for PLC programming languages
 */

import { PLCViewType, PLCNodeType, type PLCASTNode } from '@/shared/types/plc';

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly suggestions: ValidationSuggestion[];
  readonly score: number; // 0-100, code quality score
}

export interface ValidationError {
  readonly id: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly endLine?: number;
  readonly endColumn?: number;
  readonly severity: 'error' | 'critical';
  readonly code: string; // Error code like ST001, LD002, etc.
  readonly fix?: AutoFix;
}

export interface ValidationWarning {
  readonly id: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly code: string;
  readonly suggestion: string;
  readonly fix?: AutoFix;
}

export interface ValidationSuggestion {
  readonly id: string;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly improvement: string;
  readonly impact: 'low' | 'medium' | 'high';
}

export interface AutoFix {
  readonly type: 'replace' | 'insert' | 'delete';
  readonly range: TextRange;
  readonly newText: string;
  readonly description: string;
}

export interface TextRange {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/**
 * PLC Code Validator
 * Central validation engine for all PLC languages
 */
export class PLCValidator {
  private static instance: PLCValidator;

  public static getInstance(): PLCValidator {
    if (!PLCValidator.instance) {
      PLCValidator.instance = new PLCValidator();
    }
    return PLCValidator.instance;
  }

  /**
   * Validate PLC code in real-time
   */
  public async validateCode(
    sourceCode: string,
    language: PLCViewType,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const defaultOptions: ValidationOptions = {
      enableWarnings: true,
      enableSuggestions: true,
      enableAutoFix: true,
      strictMode: false,
      targetStandard: 'IEC61131-3',
      ...options,
    };

    try {
      switch (language) {
        case PLCViewType.ST:
          return await this.validateSTCode(sourceCode, defaultOptions);
        case PLCViewType.LD:
          return await this.validateLDCode(sourceCode, defaultOptions);
        case PLCViewType.SFC:
          return await this.validateSFCCode(sourceCode, defaultOptions);
        case PLCViewType.LADDER_IN_ST:
          return await this.validateLadderInSTCode(sourceCode, defaultOptions);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            id: this.generateId(),
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: 1,
            column: 1,
            severity: 'critical',
            code: 'VAL001',
          },
        ],
        warnings: [],
        suggestions: [],
        score: 0,
      };
    }
  }

  /**
   * Validate Structured Text code
   */
  private async validateSTCode(
    sourceCode: string,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    const lines = sourceCode.split('\n');

    // Basic syntax validation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for common syntax errors
      this.validateSTSyntax(line, lineNumber, errors, warnings);
      
      // Check for style and best practices
      if (options.enableWarnings) {
        this.validateSTStyle(line, lineNumber, warnings);
      }
      
      // Provide suggestions for improvement
      if (options.enableSuggestions) {
        this.suggestSTImprovements(line, lineNumber, suggestions);
      }
    }

    // Structural validation
    this.validateSTStructure(sourceCode, errors, warnings);

    // Variable validation
    this.validateSTVariables(sourceCode, errors, warnings);

    // Calculate quality score
    const score = this.calculateQualityScore(sourceCode, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate syntax for a single ST line
   */
  private validateSTSyntax(
    line: string,
    lineNumber: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('(*')) return;

    // Check for missing semicolons
    if (this.requiresSemicolon(trimmed) && !trimmed.endsWith(';')) {
      errors.push({
        id: this.generateId(),
        message: 'Missing semicolon at end of statement',
        line: lineNumber,
        column: line.length + 1,
        severity: 'error',
        code: 'ST001',
        fix: {
          type: 'insert',
          range: {
            startLine: lineNumber,
            startColumn: line.length + 1,
            endLine: lineNumber,
            endColumn: line.length + 1,
          },
          newText: ';',
          description: 'Add missing semicolon',
        },
      });
    }

    // Check for invalid assignment operators
    const invalidAssignment = trimmed.match(/\b\w+\s*=\s*[^=]/);
    if (invalidAssignment) {
      errors.push({
        id: this.generateId(),
        message: 'Use := for assignment instead of =',
        line: lineNumber,
        column: invalidAssignment.index! + 1,
        severity: 'error',
        code: 'ST002',
        fix: {
          type: 'replace',
          range: {
            startLine: lineNumber,
            startColumn: invalidAssignment.index! + invalidAssignment[0].indexOf('=') + 1,
            endLine: lineNumber,
            endColumn: invalidAssignment.index! + invalidAssignment[0].indexOf('=') + 2,
          },
          newText: ':=',
          description: 'Replace = with :=',
        },
      });
    }

    // Check for unmatched parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        id: this.generateId(),
        message: 'Unmatched parentheses',
        line: lineNumber,
        column: 1,
        severity: 'error',
        code: 'ST003',
      });
    }

    // Check for undefined keywords
    const keywords = ['PROGRAM', 'END_PROGRAM', 'VAR', 'END_VAR', 'IF', 'THEN', 'ELSE', 'END_IF', 'WHILE', 'DO', 'END_WHILE'];
    const words = trimmed.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 0 && cleanWord.toUpperCase() !== cleanWord && keywords.indexOf(cleanWord.toUpperCase()) !== -1) {
        warnings.push({
          id: this.generateId(),
          message: 'PLC keywords should be uppercase',
          line: lineNumber,
          column: line.indexOf(word) + 1,
          code: 'ST004',
          suggestion: `Use ${cleanWord.toUpperCase()} instead of ${word}`,
          fix: {
            type: 'replace',
            range: {
              startLine: lineNumber,
              startColumn: line.indexOf(word) + 1,
              endLine: lineNumber,
              endColumn: line.indexOf(word) + word.length + 1,
            },
            newText: cleanWord.toUpperCase(),
            description: 'Convert to uppercase',
          },
        });
      }
    }
  }

  /**
   * Validate ST code style
   */
  private validateSTStyle(
    line: string,
    lineNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const trimmed = line.trim();

    // Check line length
    if (line.length > 120) {
      warnings.push({
        id: this.generateId(),
        message: 'Line too long (>120 characters)',
        line: lineNumber,
        column: 121,
        code: 'ST100',
        suggestion: 'Consider breaking long lines for better readability',
      });
    }

    // Check for magic numbers
    const magicNumbers = trimmed.match(/\b\d{3,}\b/g);
    if (magicNumbers) {
      warnings.push({
        id: this.generateId(),
        message: 'Consider using named constants for magic numbers',
        line: lineNumber,
        column: 1,
        code: 'ST101',
        suggestion: 'Define constants for better maintainability',
      });
    }

    // Check for inconsistent spacing
    if (trimmed.includes(':=') && !trimmed.match(/\s:=\s/)) {
      warnings.push({
        id: this.generateId(),
        message: 'Inconsistent spacing around assignment operator',
        line: lineNumber,
        column: trimmed.indexOf(':=') + 1,
        code: 'ST102',
        suggestion: 'Use spaces around := operator',
      });
    }
  }

  /**
   * Suggest improvements for ST code
   */
  private suggestSTImprovements(
    line: string,
    lineNumber: number,
    suggestions: ValidationSuggestion[]
  ): void {
    const trimmed = line.trim();

    // Suggest using boolean literals
    if (trimmed.includes('= TRUE') || trimmed.includes('= FALSE')) {
      suggestions.push({
        id: this.generateId(),
        message: 'Consider direct boolean assignment',
        line: lineNumber,
        column: 1,
        improvement: 'Use variable := condition instead of variable := condition = TRUE',
        impact: 'low',
      });
    }

    // Suggest using structured data types
    if (trimmed.match(/\w+_\w+_\w+/)) {
      suggestions.push({
        id: this.generateId(),
        message: 'Consider using structured data types',
        line: lineNumber,
        column: 1,
        improvement: 'Group related variables into structures',
        impact: 'medium',
      });
    }
  }

  /**
   * Validate overall ST structure
   */
  private validateSTStructure(
    sourceCode: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for PROGRAM declaration
    if (!sourceCode.includes('PROGRAM')) {
      warnings.push({
        id: this.generateId(),
        message: 'Missing PROGRAM declaration',
        line: 1,
        column: 1,
        code: 'ST200',
        suggestion: 'Add PROGRAM declaration for better structure',
      });
    }

    // Check for balanced PROGRAM/END_PROGRAM
    const programCount = (sourceCode.match(/\bPROGRAM\b/g) || []).length;
    const endProgramCount = (sourceCode.match(/\bEND_PROGRAM\b/g) || []).length;
    if (programCount !== endProgramCount) {
      errors.push({
        id: this.generateId(),
        message: 'Unmatched PROGRAM/END_PROGRAM blocks',
        line: 1,
        column: 1,
        severity: 'error',
        code: 'ST201',
      });
    }

    // Check for VAR sections
    const varCount = (sourceCode.match(/\bVAR\b/g) || []).length;
    const endVarCount = (sourceCode.match(/\bEND_VAR\b/g) || []).length;
    if (varCount !== endVarCount) {
      errors.push({
        id: this.generateId(),
        message: 'Unmatched VAR/END_VAR blocks',
        line: 1,
        column: 1,
        severity: 'error',
        code: 'ST202',
      });
    }
  }

  /**
   * Validate ST variables
   */
  private validateSTVariables(
    sourceCode: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Extract variable declarations
    const varSections = sourceCode.match(/VAR([\s\S]*?)END_VAR/gi) || [];
    const declaredVars = new Set<string>();

    for (const section of varSections) {
      const declarations = section.replace(/VAR|END_VAR/gi, '').split(';');
      for (const decl of declarations) {
        const match = decl.trim().match(/(\w+)\s*:/);
        if (match) {
          declaredVars.add(match[1]);
        }
      }
    }

    // Find variable usage
    const lines = sourceCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip VAR sections and comments
      if (line.includes('VAR') || line.trim().startsWith('//')) continue;

      // Find variable assignments
      const assignments = line.match(/(\w+)\s*:=/g) || [];
      for (const assignment of assignments) {
        const varName = assignment.replace(/\s*:=/, '');
        if (!declaredVars.has(varName)) {
          errors.push({
            id: this.generateId(),
            message: `Undefined variable: ${varName}`,
            line: lineNumber,
            column: line.indexOf(varName) + 1,
            severity: 'error',
            code: 'ST300',
          });
        }
      }
    }
  }

  /**
   * Validate Ladder Diagram code
   */
  private async validateLDCode(
    sourceCode: string,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Basic LD validation
    if (!sourceCode.includes('Rung') && !sourceCode.includes('ラダー図')) {
      warnings.push({
        id: this.generateId(),
        message: 'No ladder diagram elements detected',
        line: 1,
        column: 1,
        code: 'LD001',
        suggestion: 'Add ladder diagram elements or switch to appropriate language',
      });
    }

    // Check for JSON structure if present
    const jsonMatch = sourceCode.match(/\/\*([\s\S]*?)\*\//);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[1]);
      } catch (error) {
        errors.push({
          id: this.generateId(),
          message: 'Invalid JSON structure in ladder diagram data',
          line: 1,
          column: 1,
          severity: 'error',
          code: 'LD002',
        });
      }
    }

    const score = this.calculateQualityScore(sourceCode, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate SFC code
   */
  private async validateSFCCode(
    sourceCode: string,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Basic SFC validation - placeholder
    if (sourceCode.trim().length === 0) {
      warnings.push({
        id: this.generateId(),
        message: 'Empty SFC code',
        line: 1,
        column: 1,
        code: 'SFC001',
        suggestion: 'Add SFC elements',
      });
    }

    const score = this.calculateQualityScore(sourceCode, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate Ladder-in-ST code
   */
  private async validateLadderInSTCode(
    sourceCode: string,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    // Hybrid validation - apply both ST and LD rules
    const stResult = await this.validateSTCode(sourceCode, options);
    const ldResult = await this.validateLDCode(sourceCode, options);

    return {
      isValid: stResult.isValid && ldResult.isValid,
      errors: [...stResult.errors, ...ldResult.errors],
      warnings: [...stResult.warnings, ...ldResult.warnings],
      suggestions: [...stResult.suggestions, ...ldResult.suggestions],
      score: Math.min(stResult.score, ldResult.score),
    };
  }

  /**
   * Calculate code quality score
   */
  private calculateQualityScore(
    sourceCode: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = 100;

    // Deduct points for errors
    score -= errors.length * 20;

    // Deduct points for warnings
    score -= warnings.length * 5;

    // Bonus for good practices
    if (sourceCode.includes('PROGRAM')) score += 5;
    if (sourceCode.includes('VAR')) score += 5;
    if (sourceCode.includes('//')) score += 2; // Has comments

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if line requires semicolon
   */
  private requiresSemicolon(line: string): boolean {
    const trimmed = line.trim();
    const noSemicolonKeywords = [
      'PROGRAM', 'END_PROGRAM', 'VAR', 'END_VAR', 
      'IF', 'THEN', 'ELSE', 'END_IF', 
      'WHILE', 'DO', 'END_WHILE', 'FOR', 'END_FOR'
    ];

    return !noSemicolonKeywords.some(keyword => 
      trimmed.toUpperCase().startsWith(keyword) || trimmed.toUpperCase().endsWith(keyword)
    ) && !trimmed.startsWith('//') && !trimmed.startsWith('(*') && trimmed.length > 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export interface ValidationOptions {
  enableWarnings?: boolean;
  enableSuggestions?: boolean;
  enableAutoFix?: boolean;
  strictMode?: boolean;
  targetStandard?: 'IEC61131-3' | 'Sysmac' | 'Custom';
}

// Utility functions
export const validatePLCCode = async (
  sourceCode: string,
  language: PLCViewType,
  options?: ValidationOptions
): Promise<ValidationResult> => {
  const validator = PLCValidator.getInstance();
  return validator.validateCode(sourceCode, language, options);
};

export const getValidationSummary = (result: ValidationResult): string => {
  const { errors, warnings, suggestions, score } = result;
  return `Score: ${score}/100 | Errors: ${errors.length} | Warnings: ${warnings.length} | Suggestions: ${suggestions.length}`;
}; 