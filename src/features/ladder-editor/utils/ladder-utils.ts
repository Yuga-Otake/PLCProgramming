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

// 並列回路を検出
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

    // この区間の要素を取得
    const sectionElements = rung.elements.filter(el => 
      el.position.x > startJunction.position.x && 
      el.position.x < endJunction.position.x &&
      el.type !== LadderElementType.WIRE_JUNCTION
    );

    // Y座標でグループ化してパスを作成
    const pathsByY: Record<number, LadderElement[]> = {};
    sectionElements.forEach(el => {
      if (!pathsByY[el.position.y]) pathsByY[el.position.y] = [];
      pathsByY[el.position.y].push(el);
    });

    // 複数のパスがある場合のみ追加
    if (Object.keys(pathsByY).length > 1) {
      parallelSections.push({
        startX: startJunction.position.x,
        endX: endJunction.position.x,
        paths: Object.values(pathsByY).map(path => 
          path.sort((a, b) => a.position.x - b.position.x)
        )
      });
    }
  }

  return parallelSections;
}

// ST言語変換機能
export function convertToSTLanguage(rungs: LadderRung[]): string {
  let stCode = '// Generated ST Code from Ladder Logic\n\n';
  
  rungs.forEach((rung, index) => {
    stCode += `// Rung ${index + 1}\n`;
    
    const parallelPaths = detectParallelPaths(rung);
    
    if (parallelPaths.length > 0) {
      // 並列回路がある場合
      parallelPaths.forEach((section, sectionIndex) => {
        const pathConditions = section.paths.map(path => {
          return path.map(element => convertElementToST(element)).filter(Boolean).join(' AND ');
        }).filter(Boolean);
        
        if (pathConditions.length > 0) {
          stCode += `PARALLEL_${sectionIndex + 1} := ${pathConditions.join(' OR ')};\n`;
        }
      });
    } else {
      // 単純な直列回路
      const elements = rung.elements
        .filter(el => el.type !== LadderElementType.WIRE_HORIZONTAL && 
                     el.type !== LadderElementType.WIRE_VERTICAL &&
                     el.type !== LadderElementType.WIRE_JUNCTION)
        .sort((a, b) => a.position.x - b.position.x);
      
      const inputConditions: string[] = [];
      const outputs: string[] = [];
      
      elements.forEach(element => {
        const stExpression = convertElementToST(element);
        if (stExpression) {
          if (isInputElement(element.type)) {
            inputConditions.push(stExpression);
          } else if (isOutputElement(element.type)) {
            outputs.push(stExpression);
          }
        }
      });
      
      if (inputConditions.length > 0 && outputs.length > 0) {
        const condition = inputConditions.join(' AND ');
        outputs.forEach(output => {
          stCode += `${output} := ${condition};\n`;
        });
      }
    }
    
    stCode += '\n';
  });
  
  return stCode;
}

// 要素をST言語に変換
function convertElementToST(element: LadderElement): string {
  switch (element.type) {
    case LadderElementType.NO_CONTACT:
      return element.variable;
    case LadderElementType.NC_CONTACT:
      return `NOT ${element.variable}`;
    case LadderElementType.OUTPUT_COIL:
      return element.variable;
    case LadderElementType.SET_COIL:
      return `SET(${element.variable})`;
    case LadderElementType.RESET_COIL:
      return `RESET(${element.variable})`;
    case LadderElementType.TIMER_BLOCK:
      return `${element.variable}(IN := TRUE, PT := T#1S)`;
    case LadderElementType.COUNTER_BLOCK:
      return `${element.variable}(CU := TRUE, PV := 10)`;
    default:
      return '';
  }
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
    const parallelPaths = detectParallelPaths(rung);
    
    if (parallelPaths.length > 0) {
      // 並列回路処理
      parallelPaths.forEach(section => {
        const pathResults = section.paths.map(path => {
          return path.every(element => this.evaluateElement(element));
        });
        
        const anyPathTrue = pathResults.some(result => result);
        
        // 出力要素に結果を適用
        rung.elements
          .filter(el => isOutputElement(el.type))
          .forEach(output => {
            this.applyOutput(output, anyPathTrue);
          });
      });
    } else {
      // 直列回路処理
      const inputElements = rung.elements
        .filter(el => isInputElement(el.type))
        .sort((a, b) => a.position.x - b.position.x);
      
      const outputElements = rung.elements
        .filter(el => isOutputElement(el.type))
        .sort((a, b) => a.position.x - b.position.x);
      
      const allInputsTrue = inputElements.length === 0 || 
        inputElements.every(element => this.evaluateElement(element));
      
      outputElements.forEach(output => {
        this.applyOutput(output, allInputsTrue);
      });
    }
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