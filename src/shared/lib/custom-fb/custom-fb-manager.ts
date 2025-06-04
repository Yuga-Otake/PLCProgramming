/**
 * Custom Function Block Library Manager
 * カスタムファンクションブロックライブラリの管理
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CustomFunctionBlock,
  FBLibrary,
  FBLibraryManager,
  FBLibraryMetadata,
  FBCreationResult,
  FBCategory,
  FBError,
  FBWarning,
  STANDARD_FB_TEMPLATES,
  DEFAULT_FB_METADATA,
  DEFAULT_FB_SIMULATION,
  FBLanguage,
  FBComplexity
} from '../../types/custom-function-block';

export class CustomFBManager implements FBLibraryManager {
  private libraries: Map<string, FBLibrary> = new Map();
  private functionBlocks: Map<string, CustomFunctionBlock> = new Map();

  constructor() {
    this.initializeStandardLibrary();
  }

  // ライブラリ管理
  async createLibrary(name: string, metadata: Partial<FBLibraryMetadata>): Promise<FBLibrary> {
    const library: FBLibrary = {
      id: uuidv4(),
      name,
      version: '1.0.0',
      description: metadata.description || '',
      author: metadata.author || '',
      created: new Date(),
      modified: new Date(),
      functionBlocks: [],
      metadata: {
        ...metadata.icon && { icon: metadata.icon },
        ...metadata.website && { website: metadata.website },
        license: metadata.license || 'MIT',
        compatibility: metadata.compatibility || ['NJ', 'NX'],
        tags: metadata.tags || [],
        downloadCount: 0,
        rating: 0,
        ...metadata.description && { description: metadata.description },
        ...metadata.author && { author: metadata.author }
      }
    };

    this.libraries.set(library.id, library);
    return library;
  }

  async loadLibrary(path: string): Promise<FBLibrary> {
    // 実際の実装では、ファイルシステムからロード
    // ここではローカルストレージまたはIndexedDBを使用
    try {
      const data = localStorage.getItem(`fb-library-${path}`);
      if (!data) {
        throw new Error(`Library not found: ${path}`);
      }

      const library: FBLibrary = JSON.parse(data);
      this.libraries.set(library.id, library);
      
      // FBも個別に登録
      library.functionBlocks.forEach(fb => {
        this.functionBlocks.set(fb.id, fb);
      });

      return library;
    } catch (error) {
      throw new Error(`Failed to load library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveLibrary(library: FBLibrary, path: string): Promise<boolean> {
    try {
      const data = JSON.stringify(library, null, 2);
      localStorage.setItem(`fb-library-${path}`, data);
      
      // ライブラリ情報も更新
      this.libraries.set(library.id, {
        ...library,
        modified: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to save library:', error);
      return false;
    }
  }

  // FB管理
  async addFunctionBlock(libraryId: string, fb: CustomFunctionBlock): Promise<boolean> {
    const library = this.libraries.get(libraryId);
    if (!library) {
      return false;
    }

    const updatedLibrary: FBLibrary = {
      ...library,
      functionBlocks: [...library.functionBlocks, fb],
      modified: new Date()
    };

    this.libraries.set(libraryId, updatedLibrary);
    this.functionBlocks.set(fb.id, fb);

    return true;
  }

  async removeFunctionBlock(libraryId: string, fbId: string): Promise<boolean> {
    const library = this.libraries.get(libraryId);
    if (!library) {
      return false;
    }

    const updatedLibrary: FBLibrary = {
      ...library,
      functionBlocks: library.functionBlocks.filter(fb => fb.id !== fbId),
      modified: new Date()
    };

    this.libraries.set(libraryId, updatedLibrary);
    this.functionBlocks.delete(fbId);

    return true;
  }

  async updateFunctionBlock(libraryId: string, fb: CustomFunctionBlock): Promise<boolean> {
    const library = this.libraries.get(libraryId);
    if (!library) {
      return false;
    }

    const updatedLibrary: FBLibrary = {
      ...library,
      functionBlocks: library.functionBlocks.map(existing => 
        existing.id === fb.id ? { ...fb, modified: new Date() } : existing
      ),
      modified: new Date()
    };

    this.libraries.set(libraryId, updatedLibrary);
    this.functionBlocks.set(fb.id, { ...fb, modified: new Date() });

    return true;
  }

  // 検索・フィルタ
  searchFunctionBlocks(query: string, category?: FBCategory): CustomFunctionBlock[] {
    const allFBs = Array.from(this.functionBlocks.values());
    
    return allFBs.filter(fb => {
      const matchesQuery = query === '' || 
        fb.name.toLowerCase().includes(query.toLowerCase()) ||
        fb.description?.toLowerCase().includes(query.toLowerCase()) ||
        fb.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || fb.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  getFunctionBlocksByCategory(category: FBCategory): CustomFunctionBlock[] {
    return Array.from(this.functionBlocks.values())
      .filter(fb => fb.category === category);
  }

  // インポート・エクスポート
  async exportFunctionBlock(fbId: string, format: 'JSON' | 'XML' | 'PLCOpen'): Promise<string> {
    const fb = this.functionBlocks.get(fbId);
    if (!fb) {
      throw new Error(`Function block not found: ${fbId}`);
    }

    switch (format) {
      case 'JSON':
        return JSON.stringify(fb, null, 2);
      case 'XML':
        return this.convertToXML(fb);
      case 'PLCOpen':
        return this.convertToPLCOpen(fb);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async importFunctionBlock(data: string, format: 'JSON' | 'XML' | 'PLCOpen'): Promise<FBCreationResult> {
    try {
      let fb: CustomFunctionBlock;

      switch (format) {
        case 'JSON':
          fb = JSON.parse(data);
          break;
        case 'XML':
          fb = this.parseFromXML(data);
          break;
        case 'PLCOpen':
          fb = this.parseFromPLCOpen(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // バリデーション
      const validation = this.validateFunctionBlock(fb);
      if (!validation.success) {
        return validation;
      }

      // 新しいIDを生成（重複回避）
      fb = { ...fb, id: uuidv4(), created: new Date(), modified: new Date() };
      
      this.functionBlocks.set(fb.id, fb);

      return {
        success: true,
        functionBlock: fb,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        functionBlock: null,
        errors: [{
          id: uuidv4(),
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'ERROR'
        }],
        warnings: []
      };
    }
  }

  // ユーティリティメソッド
  getAllLibraries(): FBLibrary[] {
    return Array.from(this.libraries.values());
  }

  getLibrary(id: string): FBLibrary | undefined {
    return this.libraries.get(id);
  }

  getFunctionBlock(id: string): CustomFunctionBlock | undefined {
    return this.functionBlocks.get(id);
  }

  getAllFunctionBlocks(): CustomFunctionBlock[] {
    return Array.from(this.functionBlocks.values());
  }

  // FB作成ウィザード
  createFunctionBlockFromTemplate(templateName: string, customizations?: Partial<CustomFunctionBlock>): CustomFunctionBlock {
    const template = STANDARD_FB_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const now = new Date();
    const baseBlock: CustomFunctionBlock = {
      id: uuidv4(),
      name: template.name || templateName,
      version: '1.0.0',
      description: template.description || '',
      author: '',
      created: now,
      modified: now,
      category: template.category || FBCategory.CUSTOM,
      inputs: template.inputs || [],
      outputs: template.outputs || [],
      internalVariables: [],
      implementation: {
        language: FBLanguage.ST,
        sourceCode: `// ${template.name} implementation\n// TODO: Add implementation`,
        optimization: {
          level: 'BASIC',
          preferInline: false,
          optimizeMemory: true,
          optimizeSpeed: true
        }
      },
      simulation: {
        ...DEFAULT_FB_SIMULATION,
        simulationLogic: this.generateDefaultSimulationLogic(template.name || templateName)
      },
      metadata: {
        ...DEFAULT_FB_METADATA,
        complexity: FBComplexity.SIMPLE
      },
      ...customizations
    };

    // アイコンが存在する場合のみ追加
    if (template.icon) {
      (baseBlock as any).icon = template.icon;
    }

    return baseBlock;
  }

  // プライベートメソッド
  private initializeStandardLibrary(): void {
    // 標準ライブラリを初期化
    const standardLibrary: FBLibrary = {
      id: 'standard',
      name: 'Standard Function Blocks',
      version: '1.0.0',
      description: 'IEC 61131-3 Standard Function Blocks',
      author: 'System',
      created: new Date(),
      modified: new Date(),
      functionBlocks: [],
      metadata: {
        license: 'System',
        compatibility: ['NJ', 'NX'],
        tags: ['standard', 'iec61131-3'],
        downloadCount: 0,
        rating: 5
      }
    };

    this.libraries.set(standardLibrary.id, standardLibrary);

    // 標準FBを作成
    Object.keys(STANDARD_FB_TEMPLATES).forEach(templateName => {
      const fb = this.createFunctionBlockFromTemplate(templateName);
      this.functionBlocks.set(fb.id, fb);
      standardLibrary.functionBlocks.push(fb);
    });
  }

  private validateFunctionBlock(fb: CustomFunctionBlock): FBCreationResult {
    const errors: FBError[] = [];
    const warnings: FBWarning[] = [];

    // 必須フィールドチェック
    if (!fb.name) {
      errors.push({
        id: uuidv4(),
        message: 'Function block name is required',
        severity: 'ERROR'
      });
    }

    if (!fb.inputs && !fb.outputs) {
      warnings.push({
        id: uuidv4(),
        message: 'Function block has no inputs or outputs',
        suggestion: 'Add at least one input or output pin'
      });
    }

    // 実装チェック
    if (!fb.implementation.sourceCode.trim()) {
      warnings.push({
        id: uuidv4(),
        message: 'Function block has no implementation',
        suggestion: 'Add implementation code'
      });
    }

    return {
      success: errors.length === 0,
      functionBlock: fb,
      errors,
      warnings
    };
  }

  private convertToXML(fb: CustomFunctionBlock): string {
    // 簡易XML変換（実際の実装では適切なXMLライブラリを使用）
    return `<?xml version="1.0" encoding="UTF-8"?>
<FunctionBlock id="${fb.id}" name="${fb.name}" version="${fb.version}">
  <Description>${fb.description || ''}</Description>
  <Category>${fb.category}</Category>
  <!-- 詳細な実装は省略 -->
</FunctionBlock>`;
  }

  private parseFromXML(xml: string): CustomFunctionBlock {
    // 簡易XML解析（実際の実装では適切なXMLパーサーを使用）
    throw new Error('XML import not yet implemented');
  }

  private convertToPLCOpen(fb: CustomFunctionBlock): string {
    // PLCOpen XML形式への変換
    throw new Error('PLCOpen export not yet implemented');
  }

  private parseFromPLCOpen(xml: string): CustomFunctionBlock {
    // PLCOpen XML形式からの解析
    throw new Error('PLCOpen import not yet implemented');
  }

  private generateDefaultSimulationLogic(fbName: string): string {
    // デフォルトのシミュレーションロジックを生成
    switch (fbName) {
      case 'TOF':
        return `
function simulate(inputs, state, deltaTime) {
  if (!inputs.IN && state.timer > 0) {
    state.timer -= deltaTime;
    if (state.timer <= 0) {
      state.timer = 0;
      return { Q: false, ET: 0 };
    }
    return { Q: true, ET: inputs.PT - state.timer };
  } else if (inputs.IN) {
    state.timer = inputs.PT;
    return { Q: true, ET: 0 };
  }
  return { Q: false, ET: 0 };
}`;
      case 'TP':
        return `
function simulate(inputs, state, deltaTime) {
  if (inputs.IN && !state.triggered) {
    state.triggered = true;
    state.timer = inputs.PT;
  } else if (!inputs.IN) {
    state.triggered = false;
  }
  
  if (state.timer > 0) {
    state.timer -= deltaTime;
    return { Q: true, ET: inputs.PT - state.timer };
  }
  return { Q: false, ET: inputs.PT };
}`;
      case 'ADD':
        return `
function simulate(inputs) {
  return { OUT: inputs.IN1 + inputs.IN2 };
}`;
      default:
        return `
function simulate(inputs, state, deltaTime) {
  // Default simulation logic for ${fbName}
  return {};
}`;
    }
  }
}

// シングルトンインスタンス
export const customFBManager = new CustomFBManager(); 