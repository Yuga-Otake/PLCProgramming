/**
 * 統一コード生成ユーティリティ
 * 各PLCエディタ間でのコード変換を統一管理
 */

import { ConversionOptions } from '../../types/editor';

// 基本的なコードフォーマッター
export class CodeFormatter {
  private indentSize: number;
  private useSpaces: boolean;

  constructor(indentSize = 2, useSpaces = true) {
    this.indentSize = indentSize;
    this.useSpaces = useSpaces;
  }

  indent(level: number): string {
    const char = this.useSpaces ? ' ' : '\t';
    const size = this.useSpaces ? this.indentSize : 1;
    return char.repeat(level * size);
  }

  formatBlock(lines: string[], indentLevel = 0): string {
    return lines
      .map(line => line.trim() ? this.indent(indentLevel) + line.trim() : '')
      .join('\n');
  }

  addHeader(targetLanguage: string, sourceLanguage?: string): string {
    const timestamp = new Date().toISOString();
    return [
      `// Generated ${targetLanguage} Code`,
      sourceLanguage ? `// Converted from ${sourceLanguage}` : '',
      `// Generated on: ${timestamp}`,
      '',
    ].filter(Boolean).join('\n');
  }

  addLineComment(text: string): string {
    return `// ${text}`;
  }
}

// 変数宣言生成器
export class VariableDeclarationGenerator {
  static generateSTDeclarations(variables: Array<{name: string, type: string, initialValue?: string}>): string {
    if (variables.length === 0) return '';

    const lines = ['VAR'];
    
    variables.forEach(variable => {
      const initialValuePart = variable.initialValue ? ` := ${variable.initialValue}` : '';
      lines.push(`    ${variable.name} : ${variable.type}${initialValuePart};`);
    });
    
    lines.push('END_VAR', '');
    
    return lines.join('\n');
  }

  static extractVariablesFromCode(code: string): Array<{name: string, type: string}> {
    const variables: Array<{name: string, type: string}> = [];
    const lines = code.split('\n');

    lines.forEach(line => {
      const match = line.match(/^\s*(\w+)\s*:\s*(\w+)(?:\s*:=.*)?;/);
      if (match) {
        variables.push({
          name: match[1],
          type: match[2]
        });
      }
    });

    return variables;
  }
}

// メインコード生成器
export class PLCCodeGenerator {
  private formatter: CodeFormatter;
  private options: ConversionOptions;

  constructor(options: ConversionOptions) {
    this.formatter = new CodeFormatter();
    this.options = options;
  }

  // ラダー図からSTコードへの変換
  convertLadderToST(rungs: Array<{elements: Array<{type: string, variable: string, position: {x: number, y: number}}>}>): string {
    let code = this.formatter.addHeader('ST', 'Ladder Diagram');
    
    const variables = this.extractVariablesFromLadder(rungs);
    if (variables.length > 0) {
      code += VariableDeclarationGenerator.generateSTDeclarations(variables);
    }

    rungs.forEach((rung, index) => {
      code += this.convertRungToST(rung, index + 1);
    });

    return this.options.formatOutput ? this.formatCode(code) : code;
  }

  private extractVariablesFromLadder(rungs: Array<{elements: Array<{type: string, variable: string}>}>): Array<{name: string, type: string}> {
    const variableSet = new Set<string>();
    const variables: Array<{name: string, type: string}> = [];

    rungs.forEach(rung => {
      rung.elements.forEach(element => {
        if (element.variable && element.variable !== 'WIRE' && !variableSet.has(element.variable)) {
          variableSet.add(element.variable);
          
          let type = 'BOOL';
          if (element.variable.startsWith('T')) type = 'TON';
          if (element.variable.startsWith('C')) type = 'CTU';
          
          variables.push({
            name: element.variable,
            type
          });
        }
      });
    });

    return variables;
  }

  private convertRungToST(rung: {elements: Array<{type: string, variable: string, position: {x: number, y: number}}>}, rungNumber: number): string {
    let code = this.formatter.addLineComment(`Rung ${rungNumber}`) + '\n';
    
    const sortedElements = [...rung.elements].sort((a, b) => a.position.x - b.position.x);
    const inputs: string[] = [];
    const outputs: string[] = [];
    
    sortedElements.forEach(element => {
      switch (element.type) {
        case 'NO_CONTACT':
          inputs.push(element.variable);
          break;
        case 'NC_CONTACT':
          inputs.push(`NOT ${element.variable}`);
          break;
        case 'OUTPUT_COIL':
        case 'SET_COIL':
        case 'RESET_COIL':
          outputs.push(element.variable);
          break;
      }
    });

    if (inputs.length > 0 && outputs.length > 0) {
      const condition = inputs.join(' AND ');
      outputs.forEach(output => {
        code += `${output} := ${condition};\n`;
      });
    }

    return code + '\n';
  }

  private formatCode(code: string): string {
    return code
      .replace(/;\s*\n/g, ';\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\s+$/gm, '')
      .trim();
  }
}

// エクスポート用のファクトリ関数
export function createCodeGenerator(options: ConversionOptions): PLCCodeGenerator {
  return new PLCCodeGenerator(options);
} 