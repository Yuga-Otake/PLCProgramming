'use client';

import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Ladder-in-ST固有の型定義
export interface LadderInSTBlock {
  id: string;
  startLine: number;
  endLine: number;
  ladderLogic: string;
  stLogic: string;
}

export interface STCodeLine {
  lineNumber: number;
  content: string;
  isLadderBlock: boolean;
  blockId?: string;
}

interface LadderInSTEditorProps {
  onCodeChange?: (stCode: string) => void;
}

export function LadderInSTEditor({ onCodeChange }: LadderInSTEditorProps): JSX.Element {
  // 状態管理
  const [stCode, setSTCode] = useState<string>(`// Ladder-in-ST Program Example
// Omron NJ/NX Series PLC Programming

// 変数宣言
VAR
    StartButton : BOOL;    // スタートボタン入力
    StopButton : BOOL;     // ストップボタン入力
    Motor : BOOL;          // モーター出力
    Timer1 : TON;          // タイマー1
    Counter1 : CTU;        // カウンター1
    Sensor1 : BOOL;        // センサー1入力
END_VAR

// Ladder Logic Block 1 - Motor Control
(*<LADDER>
    |--[ StartButton ]--+--( Motor )--|
    |                   |             |
    |--[ Motor ]--------+             |
    |                                 |
    |--[/StopButton]------------------+
</LADDER>*)

// ST Code Block - Timer Logic
IF Motor THEN
    Timer1(IN := TRUE, PT := T#5S);
    IF Timer1.Q THEN
        // タイマー完了時の処理
        Counter1(CU := Sensor1, R := FALSE, PV := 10);
    END_IF;
ELSE
    Timer1(IN := FALSE, PT := T#5S);
END_IF;

// Ladder Logic Block 2 - Safety Logic  
(*<LADDER>
    |--[ Sensor1 ]--[Timer1.Q]--( Counter1.CU )--|
</LADDER>*)

// Final Output Logic
IF Counter1.Q THEN
    Motor := FALSE;  // カウンター完了でモーター停止
END_IF;`);

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [_showLadderEditor, _setShowLadderEditor] = useState(false);
  const [ladderBlocks, setLadderBlocks] = useState<LadderInSTBlock[]>([]);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // コード解析：ラダーブロックを検出
  const parseLadderBlocks = useCallback((code: string): LadderInSTBlock[] => {
    const lines = code.split('\n');
    const blocks: LadderInSTBlock[] = [];
    let currentBlock: Partial<LadderInSTBlock> | null = null;

    lines.forEach((line, index) => {
      if (line.includes('(*<LADDER>')) {
        currentBlock = {
          id: uuidv4(),
          startLine: index,
          ladderLogic: '',
          stLogic: ''
        };
      } else if (line.includes('</LADDER>*)') && currentBlock) {
        currentBlock.endLine = index;
        blocks.push(currentBlock as LadderInSTBlock);
        currentBlock = null;
      } else if (currentBlock) {
        currentBlock.ladderLogic += line + '\n';
      }
    });

    return blocks;
  }, []);

  // ラダーブロック変換
  const convertLadderBlockToST = useCallback((ladderLogic: string): string => {
    // シンプルなラダー→ST変換
    let stCode = '';
    const lines = ladderLogic.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.includes('|--[') && line.includes(']--')) {
        // 接点を検出
        const contactMatch = line.match(/\|--\[\s*([^[\]]+)\s*\]--/g);
        const outputMatch = line.match(/--\(\s*([^()]+)\s*\)--/);

        if (contactMatch && outputMatch) {
          const contacts = contactMatch.map(contact => {
            const varMatch = contact.match(/\[\s*([^[\]]+)\s*\]/);
            if (varMatch) {
              const variable = varMatch[1];
              return variable.startsWith('/') ? `NOT ${variable.substring(1)}` : variable;
            }
            return '';
          }).filter(Boolean);

          const outputVar = outputMatch[1];
          
          if (contacts.length > 0) {
            stCode += `${outputVar} := ${contacts.join(' AND ')};\n`;
          }
        }
      }
    });

    return stCode;
  }, []);

  // ST言語効果
  React.useEffect(() => {
    const blocks = parseLadderBlocks(stCode);
    setLadderBlocks(blocks);
    
    if (onCodeChange) {
      // ラダーブロックをSTコードに変換して統合
      let convertedCode = stCode;
      blocks.forEach(block => {
        const stLogic = convertLadderBlockToST(block.ladderLogic);
        const blockComment = `// Converted from Ladder Block ${block.id}\n${stLogic}`;
        convertedCode = convertedCode.replace(
          `(*<LADDER>\n${block.ladderLogic}</LADDER>*)`,
          blockComment
        );
      });
      onCodeChange(convertedCode);
    }
  }, [stCode, onCodeChange, parseLadderBlocks, convertLadderBlockToST]);

  // ラダーブロック挿入
  const insertLadderBlock = useCallback(() => {
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const beforeCursor = stCode.substring(0, cursorPosition);
    const afterCursor = stCode.substring(cursorPosition);
    
    const ladderTemplate = `
// Ladder Logic Block
(*<LADDER>
    |--[ INPUT1 ]--( OUTPUT1 )--|
</LADDER>*)
`;
    
    setSTCode(beforeCursor + ladderTemplate + afterCursor);
  }, [stCode]);

  // 行番号付きコード表示
  const renderCodeWithLineNumbers = useCallback(() => {
    const lines = stCode.split('\n');
    const blocks = parseLadderBlocks(stCode);
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isLadderBlock = blocks.some(block => 
        index >= block.startLine && index <= block.endLine!
      );
      
      return (
        <div
          key={index}
          className={`flex text-sm font-mono ${
            selectedLine === lineNumber ? 'bg-blue-100' : ''
          } ${isLadderBlock ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
          onClick={() => setSelectedLine(lineNumber)}
        >
          <div className="w-12 text-right pr-2 text-gray-500 bg-gray-50 border-r">
            {lineNumber}
          </div>
          <div className="flex-1 px-2 py-0.5">
            {isLadderBlock ? (
              <div className="text-orange-700">
                <span className="text-orange-500 text-xs">[LD] </span>
                {line}
              </div>
            ) : (
              <div className="text-gray-800">{line}</div>
            )}
          </div>
        </div>
      );
    });
  }, [stCode, selectedLine, parseLadderBlocks]);

  return (
    <div className="ladder-in-st-editor h-full flex">
      {/* ツールバー */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">LD-ST ツール</h3>
        
        {/* 挿入ツール */}
        <div className="space-y-3">
          <button
            onClick={insertLadderBlock}
            className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            🔧 ラダーブロック挿入
          </button>
          
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">ラダーブロック ({ladderBlocks.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {ladderBlocks.map((block, index) => (
                <div key={block.id} className="p-2 bg-white border rounded text-xs">
                  <div className="font-medium text-orange-700">Block {index + 1}</div>
                  <div className="text-gray-500">
                    Lines {block.startLine + 1}-{block.endLine! + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">サンプルテンプレート</h4>
            <div className="space-y-1">
              <button
                onClick={() => {
                  const template = `
// Motor Start/Stop Logic
(*<LADDER>
    |--[ StartBtn ]--+--( Motor )--|
    |               |             |
    |--[ Motor ]----+             |
    |                             |
    |--[/StopBtn]------------------+
</LADDER>*)`;
                  setSTCode(stCode + template);
                }}
                className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                モーター制御
              </button>
              
              <button
                onClick={() => {
                  const template = `
// Safety Interlock
(*<LADDER>
    |--[ SafetyDoor ]--[ EmergencyStop ]--( SafetyOK )--|
</LADDER>*)`;
                  setSTCode(stCode + template);
                }}
                className="w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                安全インターロック
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインエディタ */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">Ladder-in-ST エディタ</h3>
              <span className="text-sm text-gray-500">Omron NJ/NX Series</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                LDブロック: {ladderBlocks.length} | 行: {stCode.split('\n').length}
              </span>
              <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                ✓ 構文チェック
              </button>
            </div>
          </div>
        </div>

        {/* コードエディタ */}
        <div className="flex-1 flex">
          {/* 左側: 行番号付きプレビュー */}
          <div className="w-1/2 border-r border-gray-200 overflow-auto">
            <div className="bg-gray-50 p-2 border-b text-xs font-medium text-gray-700">
              プレビュー (LDブロック強調表示)
            </div>
            <div className="text-sm font-mono">
              {renderCodeWithLineNumbers()}
            </div>
          </div>

          {/* 右側: テキストエディタ */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-50 p-2 border-b text-xs font-medium text-gray-700">
              ソースコード編集
            </div>
            <textarea
              ref={editorRef}
              value={stCode}
              onChange={(e) => setSTCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm resize-none border-none outline-none"
              placeholder="Ladder-in-ST コードを入力してください..."
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* ステータスバー */}
        <div className="bg-gray-50 border-t border-gray-200 p-2 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>選択行: {selectedLine || 'なし'}</span>
            <span>合計行数: {stCode.split('\n').length}</span>
            <span className="text-orange-600">● LD-ST混在モード</span>
          </div>
          <div>
            <span>最後の更新: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}