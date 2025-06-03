/**
 * File I/O Manager for PLC Web Editor
 * Handles saving, loading, and exporting PLC programs
 */

import { PLCViewType, type PLCASTNode } from '@/shared/types/plc';

export interface PLCFile {
  readonly id: string;
  readonly name: string;
  readonly type: PLCFileType;
  readonly content: string;
  readonly metadata: PLCFileMetadata;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}

export interface PLCFileMetadata {
  readonly version: string;
  readonly author?: string;
  readonly description?: string;
  readonly language: PLCViewType;
  readonly checksum: string;
  readonly originalSize: number;
  readonly compressedSize?: number;
}

export enum PLCFileType {
  ST = 'st',           // Structured Text
  LD = 'ld',           // Ladder Diagram (HTML/JSON hybrid)
  SFC = 'sfc',         // Sequential Function Chart
  LD_ST = 'ld-st',     // Ladder in ST
  PROJECT = 'plc-proj', // Complete project (ZIP)
  HTML_EXPORT = 'html', // HTML export with embedded graphics
}

export interface ExportOptions {
  readonly includeComments: boolean;
  readonly includeMetadata: boolean;
  readonly includeGraphics: boolean;
  readonly format: 'pretty' | 'minified';
  readonly encoding: 'utf-8' | 'ascii';
}

export interface ImportResult {
  readonly success: boolean;
  readonly files: PLCFile[];
  readonly errors: FileError[];
  readonly warnings: FileWarning[];
}

export interface FileError {
  readonly id: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
  readonly line?: number;
  readonly column?: number;
}

export interface FileWarning {
  readonly id: string;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * PLC File Manager
 * Central class for all file operations
 */
export class PLCFileManager {
  private static instance: PLCFileManager;
  private fileCache: Map<string, PLCFile> = new Map();

  public static getInstance(): PLCFileManager {
    if (!PLCFileManager.instance) {
      PLCFileManager.instance = new PLCFileManager();
    }
    return PLCFileManager.instance;
  }

  /**
   * Save content as a specific file type
   */
  public async saveFile(
    content: string,
    filename: string,
    type: PLCFileType,
    language: PLCViewType,
    options: Partial<ExportOptions> = {}
  ): Promise<PLCFile> {
    const defaultOptions: ExportOptions = {
      includeComments: true,
      includeMetadata: true,
      includeGraphics: true,
      format: 'pretty',
      encoding: 'utf-8',
      ...options,
    };

    // Generate file metadata
    const metadata: PLCFileMetadata = {
      version: '1.0',
      language,
      checksum: this.generateChecksum(content),
      originalSize: content.length,
      compressedSize: undefined, // TODO: Implement compression
    };

    // Process content based on type and options
    const processedContent = this.processContent(content, type, defaultOptions);

    const plcFile: PLCFile = {
      id: this.generateFileId(),
      name: filename,
      type,
      content: processedContent,
      metadata,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    // Cache the file
    this.fileCache.set(plcFile.id, plcFile);

    // Trigger browser download
    await this.downloadFile(plcFile, defaultOptions);

    return plcFile;
  }

  /**
   * Load file from user input
   */
  public async loadFile(file: File): Promise<ImportResult> {
    try {
      const content = await this.readFileContent(file);
      const fileType = this.detectFileType(file.name, content);
      const language = this.detectLanguage(content);

      const plcFile: PLCFile = {
        id: this.generateFileId(),
        name: file.name,
        type: fileType,
        content,
        metadata: {
          version: '1.0',
          language,
          checksum: this.generateChecksum(content),
          originalSize: content.length,
        },
        createdAt: new Date(file.lastModified || Date.now()),
        modifiedAt: new Date(),
      };

      // Validate file content
      const validationResult = this.validateFileContent(plcFile);
      if (!validationResult.isValid) {
        return {
          success: false,
          files: [],
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        };
      }

      // Cache the file
      this.fileCache.set(plcFile.id, plcFile);

      return {
        success: true,
        files: [plcFile],
        errors: [],
        warnings: validationResult.warnings,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        errors: [
          {
            id: this.generateFileId(),
            message: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Export project as ZIP file
   */
  public async exportProject(
    files: PLCFile[],
    projectName: string,
    options: Partial<ExportOptions> = {}
  ): Promise<Blob> {
    // TODO: Implement actual ZIP creation
    // For now, create a simple text bundle

    const defaultOptions: ExportOptions = {
      includeComments: true,
      includeMetadata: true,
      includeGraphics: true,
      format: 'pretty',
      encoding: 'utf-8',
      ...options,
    };

    let bundleContent = `// PLC Project: ${projectName}\n`;
    bundleContent += `// Created: ${new Date().toISOString()}\n`;
    bundleContent += `// Files: ${files.length}\n\n`;

    for (const file of files) {
      bundleContent += `// ==========================================\n`;
      bundleContent += `// File: ${file.name} (${file.type})\n`;
      bundleContent += `// Language: ${file.metadata.language}\n`;
      bundleContent += `// Modified: ${file.modifiedAt.toISOString()}\n`;
      bundleContent += `// ==========================================\n\n`;
      bundleContent += file.content;
      bundleContent += '\n\n';
    }

    return new Blob([bundleContent], { type: 'text/plain' });
  }

  /**
   * Get cached file by ID
   */
  public getFile(id: string): PLCFile | undefined {
    return this.fileCache.get(id);
  }

  /**
   * Get all cached files
   */
  public getAllFiles(): PLCFile[] {
    return Array.from(this.fileCache.values());
  }

  /**
   * Clear file cache
   */
  public clearCache(): void {
    this.fileCache.clear();
  }

  // Private helper methods

  private processContent(
    content: string,
    type: PLCFileType,
    options: ExportOptions
  ): string {
    let processed = content;

    // Add metadata header if requested
    if (options.includeMetadata) {
      processed = this.addMetadataHeader(processed, type);
    }

    // Format content
    if (options.format === 'pretty') {
      processed = this.prettifyContent(processed, type);
    } else {
      processed = this.minifyContent(processed, type);
    }

    return processed;
  }

  private addMetadataHeader(content: string, type: PLCFileType): string {
    const header = [
      `// PLC Web Editor File`,
      `// Type: ${type}`,
      `// Generated: ${new Date().toISOString()}`,
      `// Version: 1.0`,
      ``,
    ].join('\n');

    return header + content;
  }

  private prettifyContent(content: string, type: PLCFileType): string {
    // Basic prettification based on file type
    switch (type) {
      case PLCFileType.ST:
        return this.prettifySTContent(content);
      case PLCFileType.LD:
        return this.prettifyLDContent(content);
      default:
        return content;
    }
  }

  private prettifySTContent(content: string): string {
    // Basic ST code formatting
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        if (line.startsWith('VAR') || line.startsWith('END_VAR') || 
            line.startsWith('PROGRAM') || line.startsWith('END_PROGRAM')) {
          return line;
        }
        if (line.startsWith('//')) {
          return line;
        }
        return '  ' + line; // Indent statements
      })
      .join('\n');
  }

  private prettifyLDContent(content: string): string {
    // Basic LD content formatting
    return content;
  }

  private minifyContent(content: string, type: PLCFileType): string {
    // Remove unnecessary whitespace and comments
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('//'))
      .join('\n');
  }

  private async downloadFile(file: PLCFile, options: ExportOptions): Promise<void> {
    const blob = new Blob([file.content], { 
      type: this.getMimeType(file.type),
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.getFileName(file.name, file.type);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private detectFileType(filename: string, content: string): PLCFileType {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'st': return PLCFileType.ST;
      case 'ld': return PLCFileType.LD;
      case 'sfc': return PLCFileType.SFC;
      case 'html': return PLCFileType.HTML_EXPORT;
      case 'plc-proj': return PLCFileType.PROJECT;
      default:
        // Try to detect from content
        if (content.includes('PROGRAM') && content.includes('END_PROGRAM')) {
          return PLCFileType.ST;
        }
        if (content.includes('// ラダー図') || content.includes('Rung')) {
          return PLCFileType.LD;
        }
        return PLCFileType.ST; // Default fallback
    }
  }

  private detectLanguage(content: string): PLCViewType {
    if (content.includes('PROGRAM') && content.includes('VAR')) {
      return PLCViewType.ST;
    }
    if (content.includes('// ラダー図') || content.includes('Rung')) {
      return PLCViewType.LD;
    }
    if (content.includes('STEP') || content.includes('TRANSITION')) {
      return PLCViewType.SFC;
    }
    return PLCViewType.ST; // Default
  }

  private validateFileContent(file: PLCFile): {
    isValid: boolean;
    errors: FileError[];
    warnings: FileWarning[];
  } {
    const errors: FileError[] = [];
    const warnings: FileWarning[] = [];

    // Basic validation
    if (file.content.length === 0) {
      errors.push({
        id: this.generateFileId(),
        message: 'File is empty',
        severity: 'error',
      });
    }

    // Size validation
    if (file.content.length > 1024 * 1024) { // 1MB limit
      warnings.push({
        id: this.generateFileId(),
        message: 'File is larger than 1MB, performance may be affected',
        suggestion: 'Consider splitting large programs into smaller modules',
      });
    }

    // Content-specific validation
    if (file.type === PLCFileType.ST) {
      if (!file.content.includes('PROGRAM')) {
        warnings.push({
          id: this.generateFileId(),
          message: 'ST file does not contain PROGRAM declaration',
          suggestion: 'Add PROGRAM declaration for better compatibility',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private generateChecksum(content: string): string {
    // Simple hash function (in production, use crypto.subtle)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getMimeType(type: PLCFileType): string {
    switch (type) {
      case PLCFileType.ST:
      case PLCFileType.LD:
      case PLCFileType.SFC:
      case PLCFileType.LD_ST:
        return 'text/plain';
      case PLCFileType.HTML_EXPORT:
        return 'text/html';
      case PLCFileType.PROJECT:
        return 'application/zip';
      default:
        return 'text/plain';
    }
  }

  private getFileName(baseName: string, type: PLCFileType): string {
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.${type}`;
  }
}

// Utility functions
export const saveSTFile = async (content: string, filename: string): Promise<PLCFile> => {
  const manager = PLCFileManager.getInstance();
  return manager.saveFile(content, filename, PLCFileType.ST, PLCViewType.ST);
};

export const saveLDFile = async (content: string, filename: string): Promise<PLCFile> => {
  const manager = PLCFileManager.getInstance();
  return manager.saveFile(content, filename, PLCFileType.LD, PLCViewType.LD);
};

export const loadPLCFile = async (file: File): Promise<ImportResult> => {
  const manager = PLCFileManager.getInstance();
  return manager.loadFile(file);
};

export const exportProjectBundle = async (
  files: PLCFile[],
  projectName: string
): Promise<void> => {
  const manager = PLCFileManager.getInstance();
  const bundle = await manager.exportProject(files, projectName);
  
  // Download the bundle
  const url = URL.createObjectURL(bundle);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.plc-proj`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}; 