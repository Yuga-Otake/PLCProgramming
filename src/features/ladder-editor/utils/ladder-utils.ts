import { LadderElementType } from '../components/ladder-elements';

// 基本インターフェース
export interface LadderElement {
  id: string;
  type: LadderElementType;
  variable: string;
  position: { x: number; y: number };
  selected?: boolean;
}

export interface LadderRung {
  id: string;
  elements: LadderElement[];
  height: number;
}

export interface ToolboxElement {
  type: LadderElementType;
  label: string;
  icon: string;
  category: string;
}

// ツールボックス要素定義
export const TOOLBOX_ELEMENTS: ToolboxElement[] = [
  { type: LadderElementType.NO_CONTACT, label: 'A接点', icon: '|—|', category: '基本' },
  { type: LadderElementType.NC_CONTACT, label: 'B接点', icon: '|/|', category: '基本' },
  { type: LadderElementType.OUTPUT_COIL, label: '出力', icon: '(○)', category: '基本' },
  { type: LadderElementType.SET_COIL, label: 'セット', icon: '(S)', category: '基本' },
  { type: LadderElementType.RESET_COIL, label: 'リセット', icon: '(R)', category: '基本' },
  { type: LadderElementType.TIMER_BLOCK, label: 'タイマー', icon: 'TON', category: 'FB' },
  { type: LadderElementType.COUNTER_BLOCK, label: 'カウンタ', icon: 'CTU', category: 'FB' },
  { type: LadderElementType.WIRE_HORIZONTAL, label: '水平線', icon: '——', category: '配線' },
  { type: LadderElementType.WIRE_VERTICAL, label: '垂直線', icon: '|', category: '配線' },
  { type: LadderElementType.WIRE_JUNCTION, label: '接続点', icon: '┼', category: '配線' }
];

// デフォルト変数名を取得
export function getDefaultVariable(elementType: LadderElementType): string {
  switch (elementType) {
    case LadderElementType.NO_CONTACT:
    case LadderElementType.NC_CONTACT:
      return 'X001';
    case LadderElementType.OUTPUT_COIL:
    case LadderElementType.SET_COIL:
    case LadderElementType.RESET_COIL:
      return 'Y001';
    case LadderElementType.TIMER_BLOCK:
      return 'T001';
    case LadderElementType.COUNTER_BLOCK:
      return 'C001';
    case LadderElementType.WIRE_HORIZONTAL:
    case LadderElementType.WIRE_VERTICAL:
    case LadderElementType.WIRE_JUNCTION:
      return 'WIRE';
    default:
      return 'VAR';
  }
}

// ツールボックス要素をカテゴリ別にグループ化
export function groupToolboxElementsByCategory(elements: ToolboxElement[]): Record<string, ToolboxElement[]> {
  return elements.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolboxElement[]>);
}

// 変数テーブルデータを生成
export function generateVariableTable(rungs: LadderRung[]): Array<{
  variable: string;
  type: string;
  count: number;
  locations: string[];
}> {
  const variables: Record<string, { type: string, count: number, locations: string[] }> = {};
  
  rungs.forEach((rung, rungIndex) => {
    rung.elements.forEach((element, elementIndex) => {
      if (element.variable && element.variable !== 'WIRE') {
        if (!variables[element.variable]) {
          variables[element.variable] = {
            type: element.type,
            count: 0,
            locations: []
          };
        }
        variables[element.variable].count++;
        variables[element.variable].locations.push(`R${rungIndex + 1}:${elementIndex + 1}`);
      }
    });
  });

  return Object.entries(variables).map(([variable, data]) => ({
    variable,
    type: data.type,
    count: data.count,
    locations: data.locations
  }));
}

// 候補フィルタリング
export function filterSuggestions(elements: ToolboxElement[], searchFilter: string): ToolboxElement[] {
  if (!searchFilter) return elements;
  
  return elements.filter(suggestion => 
    suggestion.label.toLowerCase().includes(searchFilter) ||
    suggestion.icon.toLowerCase().includes(searchFilter) ||
    suggestion.category.toLowerCase().includes(searchFilter)
  );
}

// 並列回路を検出（修正版）
export function detectParallelPaths(rung: LadderRung): Array<{
  startX: number;
  endX: number;
  paths: LadderElement[][];
}> {
  const junctions = rung.elements.filter(el => el.type === LadderElementType.WIRE_JUNCTION);
  const parallelSections: Array<{
    startX: number;
    endX: number;
    paths: LadderElement[][];
  }> = [];

  if (junctions.length < 2) return parallelSections;

  // ジャンクションをX座標でソート
  const sortedJunctions = [...junctions].sort((a, b) => a.position.x - b.position.x);

  for (let i = 0; i < sortedJunctions.length - 1; i++) {
    const startJunction = sortedJunctions[i];
    const endJunction = sortedJunctions[i + 1];

    // この区間の要素を取得（ジャンクション、配線要素を除く実際の論理要素のみ）
    const sectionElements = rung.elements.filter(el => 
      el.position.x >= startJunction.position.x && 
      el.position.x <= endJunction.position.x &&
      el.type !== LadderElementType.WIRE_JUNCTION &&
      el.type !== LadderElementType.WIRE_HORIZONTAL &&
      el.type !== LadderElementType.WIRE_VERTICAL &&
      (isInputElement(el.type) || isOutputElement(el.type))
    );

    // Y座標でグループ化してパスを作成
    const pathsByY: Record<number, LadderElement[]> = {};
    sectionElements.forEach(el => {
      if (!pathsByY[el.position.y]) pathsByY[el.position.y] = [];
      pathsByY[el.position.y].push(el);
    });

    // 複数のパスがある場合のみ追加
    const paths = Object.values(pathsByY).map(path => 
      path.sort((a, b) => a.position.x - b.position.x)
    );

    if (paths.length > 1) {
      parallelSections.push({
        startX: startJunction.position.x,
        endX: endJunction.position.x,
        paths: paths
      });
    }
  }

  return parallelSections;
}

// ST言語変換機能（論理構造解析版）
export function convertToSTLanguage(rungs: LadderRung[]): string {
  let stCode = '// Generated ST Code from Ladder Logic\n\n';
  
  rungs.forEach((rung, index) => {
    stCode += generateSTComment(rung, index);
    stCode += '\n';
    
    const logicExpression = analyzeRungLogic(rung);
    
    if (logicExpression) {
      const outputElements = rung.elements.filter(el => isOutputElement(el.type));
      
      outputElements.forEach(output => {
        const outputExpression = convertElementToST(output, false);
        if (outputExpression) {
          const optimizedExpression = optimizeLogicExpression(logicExpression);
          stCode += `${outputExpression} := ${optimizedExpression};\n`;
        }
      });
    }
    
    stCode += '\n';
  });
  
  return stCode;
}

// ラング全体の論理構造を解析（新機能）
function analyzeRungLogic(rung: LadderRung): string {
  console.log('=== ラング論理解析開始 ===');
  console.log('ラング要素:', rung.elements.map(el => ({ 
    type: el.type, 
    variable: el.variable, 
    position: el.position 
  })));
  
  // 入力要素をX座標でソート
  const inputElements = rung.elements
    .filter(el => isInputElement(el.type))
    .sort((a, b) => a.position.x - b.position.x);
  
  console.log('入力要素:', inputElements.map(el => ({ 
    variable: el.variable, 
    type: el.type, 
    position: el.position 
  })));
  
  if (inputElements.length === 0) return '';
  
  // 接続関係を解析（ジャンクションと配線を考慮）
  const wireJunctions = rung.elements.filter(el => el.type === LadderElementType.WIRE_JUNCTION);
  const wireHorizontals = rung.elements.filter(el => el.type === LadderElementType.WIRE_HORIZONTAL);
  const wireVerticals = rung.elements.filter(el => el.type === LadderElementType.WIRE_VERTICAL);
  
  console.log('配線要素:', {
    junctions: wireJunctions.length,
    horizontals: wireHorizontals.length,
    verticals: wireVerticals.length
  });
  
  // 並列回路の検出（ジャンクション基準）
  if (wireJunctions.length >= 2) {
    // ジャンクションがある場合の並列回路解析
    return analyzeParallelCircuit(rung, inputElements, wireJunctions);
  } else {
    // ジャンクションがない場合は直列回路
    return analyzeSeriesCircuit(inputElements);
  }
}

// 並列回路の解析
function analyzeParallelCircuit(rung: LadderRung, inputElements: LadderElement[], junctions: LadderElement[]): string {
  console.log('並列回路解析中...');
  
  // ジャンクションをX座標でソート
  const sortedJunctions = [...junctions].sort((a, b) => a.position.x - b.position.x);
  console.log('ソート済みジャンクション:', sortedJunctions.map(j => j.position));
  
  if (sortedJunctions.length < 2) {
    return analyzeSeriesCircuit(inputElements);
  }
  
  const sections: string[] = [];
  
  // 最初のジャンクション以前の要素（直列部分）
  const beforeFirstJunction = inputElements.filter(el => 
    el.position.x < sortedJunctions[0].position.x
  );
  
  if (beforeFirstJunction.length > 0) {
    const seriesExpressions = beforeFirstJunction.map(el => convertElementToST(el, false));
    sections.push(...seriesExpressions);
  }
  
  // ジャンクション間の並列部分
  for (let i = 0; i < sortedJunctions.length - 1; i++) {
    const startX = sortedJunctions[i].position.x;
    const endX = sortedJunctions[i + 1].position.x;
    
    // この区間の入力要素をY座標でグループ化
    const sectionElements = inputElements.filter(el => 
      el.position.x > startX && el.position.x < endX
    );
    
    console.log(`ジャンクション区間 ${i + 1} (X: ${startX} - ${endX}):`, 
      sectionElements.map(el => ({ variable: el.variable, position: el.position }))
    );
    
    if (sectionElements.length > 0) {
      // Y座標でグループ化（並列パス）
      const pathsByY: Record<number, LadderElement[]> = {};
      sectionElements.forEach(el => {
        if (!pathsByY[el.position.y]) pathsByY[el.position.y] = [];
        pathsByY[el.position.y].push(el);
      });
      
      const paths = Object.values(pathsByY).map(path => 
        path.sort((a, b) => a.position.x - b.position.x)
      );
      
      console.log('並列パス:', paths.map(path => 
        path.map(el => el.variable)
      ));
      
      if (paths.length === 1) {
        // 単一パス（直列）
        const pathExpressions = paths[0].map(el => convertElementToST(el, false));
        sections.push(pathExpressions.join(' AND '));
      } else {
        // 複数パス（並列）
        const pathExpressions = paths.map(path => {
          const pathST = path.map(el => convertElementToST(el, false));
          return pathST.length > 1 ? `(${pathST.join(' AND ')})` : pathST[0];
        });
        sections.push(`(${pathExpressions.join(' OR ')})`);
      }
    }
  }
  
  // 最後のジャンクション以降の要素（直列部分）
  const afterLastJunction = inputElements.filter(el => 
    el.position.x > sortedJunctions[sortedJunctions.length - 1].position.x
  );
  
  if (afterLastJunction.length > 0) {
    const seriesExpressions = afterLastJunction.map(el => convertElementToST(el, false));
    sections.push(...seriesExpressions);
  }
  
  console.log('最終セクション:', sections);
  
  // 全セクションをANDで結合
  if (sections.length === 0) return '';
  if (sections.length === 1) return sections[0];
  
  return sections.join(' AND ');
}

// 直列回路の解析
function analyzeSeriesCircuit(inputElements: LadderElement[]): string {
  console.log('直列回路解析中...');
  const expressions = inputElements.map(el => convertElementToST(el, false));
  console.log('直列式:', expressions);
  
  if (expressions.length === 0) return '';
  if (expressions.length === 1) return expressions[0];
  
  return expressions.join(' AND ');
}

// 要素をST言語に変換（優先順位対応版）
function convertElementToST(element: LadderElement, requireParentheses: boolean = false): string {
  let expression = '';
  
  switch (element.type) {
    case LadderElementType.NO_CONTACT:
      expression = element.variable;
      break;
    case LadderElementType.NC_CONTACT:
      expression = `NOT ${element.variable}`;
      // NOT演算子は括弧で囲むべき場合がある
      if (requireParentheses) {
        expression = `(${expression})`;
      }
      break;
    case LadderElementType.OUTPUT_COIL:
      expression = element.variable;
      break;
    case LadderElementType.SET_COIL:
      expression = `SET(${element.variable})`;
      break;
    case LadderElementType.RESET_COIL:
      expression = `RESET(${element.variable})`;
      break;
    case LadderElementType.TIMER_BLOCK:
      expression = `${element.variable}(IN := TRUE, PT := T#1S)`;
      break;
    case LadderElementType.COUNTER_BLOCK:
      expression = `${element.variable}(CU := TRUE, PV := 10)`;
      break;
    default:
      return '';
  }
  
  return expression;
}

// 複雑な論理式の最適化
function optimizeLogicExpression(expression: string): string {
  // 不要な括弧を削除
  expression = expression.replace(/^\(([^()]+)\)$/, '$1');
  
  // 連続する括弧を最適化
  expression = expression.replace(/\(\(([^()]+)\)\)/g, '($1)');
  
  // NOT演算子の最適化
  expression = expression.replace(/NOT\s+NOT\s+/g, '');
  
  return expression;
}

// ST言語のコメント生成
function generateSTComment(rung: LadderRung, rungIndex: number): string {
  const inputCount = rung.elements.filter(el => isInputElement(el.type)).length;
  const outputCount = rung.elements.filter(el => isOutputElement(el.type)).length;
  const junctionCount = rung.elements.filter(el => el.type === LadderElementType.WIRE_JUNCTION).length;
  
  let comment = `// Rung ${rungIndex + 1}`;
  
  if (junctionCount > 0) {
    comment += ` (Parallel Circuit: ${inputCount} inputs, ${outputCount} outputs, ${junctionCount} junctions)`;
  } else {
    comment += ` (Series Circuit: ${inputCount} inputs, ${outputCount} outputs)`;
  }
  
  return comment;
}

// 入力要素かどうか判定
function isInputElement(type: LadderElementType): boolean {
  return [
    LadderElementType.NO_CONTACT,
    LadderElementType.NC_CONTACT
  ].includes(type);
}

// 出力要素かどうか判定
function isOutputElement(type: LadderElementType): boolean {
  return [
    LadderElementType.OUTPUT_COIL,
    LadderElementType.SET_COIL,
    LadderElementType.RESET_COIL
  ].includes(type);
}

// シミュレーション状態管理
export interface SimulationState {
  isRunning: boolean;
  variables: Record<string, boolean>;
  timers: Record<string, { current: number; preset: number; done: boolean }>;
  counters: Record<string, { current: number; preset: number; done: boolean }>;
}

export class LadderSimulator {
  private state: SimulationState;
  private rungs: LadderRung[];
  private intervalId: NodeJS.Timeout | null = null;

  constructor(rungs: LadderRung[]) {
    this.rungs = rungs;
    this.state = {
      isRunning: false,
      variables: {},
      timers: {},
      counters: {}
    };
    this.initializeVariables();
  }

  private initializeVariables(): void {
    this.rungs.forEach(rung => {
      rung.elements.forEach(element => {
        if (element.variable && element.variable !== 'WIRE') {
          switch (element.type) {
            case LadderElementType.NO_CONTACT:
            case LadderElementType.NC_CONTACT:
            case LadderElementType.OUTPUT_COIL:
            case LadderElementType.SET_COIL:
            case LadderElementType.RESET_COIL:
              this.state.variables[element.variable] = false;
              break;
            case LadderElementType.TIMER_BLOCK:
              this.state.timers[element.variable] = {
                current: 0,
                preset: 1000, // 1秒
                done: false
              };
              break;
            case LadderElementType.COUNTER_BLOCK:
              this.state.counters[element.variable] = {
                current: 0,
                preset: 10,
                done: false
              };
              break;
          }
        }
      });
    });
  }

  public start(): void {
    if (this.state.isRunning) return;
    
    this.state.isRunning = true;
    this.intervalId = setInterval(() => {
      this.scan();
    }, 100); // 100ms スキャンサイクル
  }

  public stop(): void {
    if (!this.state.isRunning) return;
    
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setVariable(variable: string, value: boolean): void {
    this.state.variables[variable] = value;
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  private scan(): void {
    // タイマー処理
    Object.keys(this.state.timers).forEach(timerVar => {
      const timer = this.state.timers[timerVar];
      if (this.state.variables[timerVar + '_EN']) {
        timer.current += 100;
        timer.done = timer.current >= timer.preset;
        this.state.variables[timerVar + '_Q'] = timer.done;
      } else {
        timer.current = 0;
        timer.done = false;
        this.state.variables[timerVar + '_Q'] = false;
      }
    });

    // カウンター処理
    Object.keys(this.state.counters).forEach(counterVar => {
      const counter = this.state.counters[counterVar];
      if (this.state.variables[counterVar + '_CU']) {
        counter.current++;
        counter.done = counter.current >= counter.preset;
        this.state.variables[counterVar + '_Q'] = counter.done;
      }
      
      if (this.state.variables[counterVar + '_R']) {
        counter.current = 0;
        counter.done = false;
        this.state.variables[counterVar + '_Q'] = false;
      }
    });

    // ラング実行
    this.rungs.forEach(rung => {
      this.executeRung(rung);
    });
  }

  private executeRung(rung: LadderRung): void {
    // 新しい論理構造解析を使用
    const inputElements = rung.elements
      .filter(el => isInputElement(el.type))
      .sort((a, b) => a.position.x - b.position.x);
    
    const outputElements = rung.elements
      .filter(el => isOutputElement(el.type));
    
    if (inputElements.length === 0) {
      // 入力がない場合、出力はfalse
      outputElements.forEach(output => {
        this.applyOutput(output, false);
      });
      return;
    }
    
    // 接続関係を解析（ST変換と同じロジック）
    const wireJunctions = rung.elements.filter(el => el.type === LadderElementType.WIRE_JUNCTION);
    
    let finalResult: boolean;
    
    if (wireJunctions.length >= 2) {
      // 並列回路の実行
      finalResult = this.executeParallelCircuit(rung, inputElements, wireJunctions);
    } else {
      // 直列回路の実行
      finalResult = this.executeSeriesCircuit(inputElements);
    }
    
    // 出力要素に結果を適用
    outputElements.forEach(output => {
      this.applyOutput(output, finalResult);
    });
  }

  // 並列回路の実行
  private executeParallelCircuit(rung: LadderRung, inputElements: LadderElement[], junctions: LadderElement[]): boolean {
    // ジャンクションをX座標でソート
    const sortedJunctions = [...junctions].sort((a, b) => a.position.x - b.position.x);
    
    if (sortedJunctions.length < 2) {
      return this.executeSeriesCircuit(inputElements);
    }
    
    const sectionResults: boolean[] = [];
    
    // 最初のジャンクション以前の要素（直列部分）
    const beforeFirstJunction = inputElements.filter(el => 
      el.position.x < sortedJunctions[0].position.x
    );
    
    if (beforeFirstJunction.length > 0) {
      const seriesResult = beforeFirstJunction.every(el => this.evaluateElement(el));
      sectionResults.push(seriesResult);
    }
    
    // ジャンクション間の並列部分
    for (let i = 0; i < sortedJunctions.length - 1; i++) {
      const startX = sortedJunctions[i].position.x;
      const endX = sortedJunctions[i + 1].position.x;
      
      // この区間の入力要素をY座標でグループ化
      const sectionElements = inputElements.filter(el => 
        el.position.x > startX && el.position.x < endX
      );
      
      if (sectionElements.length > 0) {
        // Y座標でグループ化（並列パス）
        const pathsByY: Record<number, LadderElement[]> = {};
        sectionElements.forEach(el => {
          if (!pathsByY[el.position.y]) pathsByY[el.position.y] = [];
          pathsByY[el.position.y].push(el);
        });
        
        const paths = Object.values(pathsByY).map(path => 
          path.sort((a, b) => a.position.x - b.position.x)
        );
        
        if (paths.length === 1) {
          // 単一パス（直列）
          const pathResult = paths[0].every(el => this.evaluateElement(el));
          sectionResults.push(pathResult);
        } else {
          // 複数パス（並列） - ORロジック
          const pathResults = paths.map(path => 
            path.every(el => this.evaluateElement(el))
          );
          const parallelResult = pathResults.some(result => result);
          sectionResults.push(parallelResult);
        }
      }
    }
    
    // 最後のジャンクション以降の要素（直列部分）
    const afterLastJunction = inputElements.filter(el => 
      el.position.x > sortedJunctions[sortedJunctions.length - 1].position.x
    );
    
    if (afterLastJunction.length > 0) {
      const seriesResult = afterLastJunction.every(el => this.evaluateElement(el));
      sectionResults.push(seriesResult);
    }
    
    // 全セクションをANDで結合
    return sectionResults.every(result => result);
  }

  // 直列回路の実行
  private executeSeriesCircuit(inputElements: LadderElement[]): boolean {
    return inputElements.every(el => this.evaluateElement(el));
  }

  private evaluateElement(element: LadderElement): boolean {
    switch (element.type) {
      case LadderElementType.NO_CONTACT:
        return this.state.variables[element.variable] || false;
      case LadderElementType.NC_CONTACT:
        return !this.state.variables[element.variable];
      case LadderElementType.TIMER_BLOCK:
        return this.state.variables[element.variable + '_Q'] || false;
      case LadderElementType.COUNTER_BLOCK:
        return this.state.variables[element.variable + '_Q'] || false;
      default:
        return true;
    }
  }

  private applyOutput(element: LadderElement, condition: boolean): void {
    switch (element.type) {
      case LadderElementType.OUTPUT_COIL:
        this.state.variables[element.variable] = condition;
        break;
      case LadderElementType.SET_COIL:
        if (condition) {
          this.state.variables[element.variable] = true;
        }
        break;
      case LadderElementType.RESET_COIL:
        if (condition) {
          this.state.variables[element.variable] = false;
        }
        break;
      case LadderElementType.TIMER_BLOCK:
        this.state.variables[element.variable + '_EN'] = condition;
        break;
      case LadderElementType.COUNTER_BLOCK:
        this.state.variables[element.variable + '_CU'] = condition;
        break;
    }
  }
} 