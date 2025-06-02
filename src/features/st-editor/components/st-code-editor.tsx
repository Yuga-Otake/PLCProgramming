'use client';

import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { PLCViewType } from '@/shared/types/plc';
import { parseCodeToAST } from '@/shared/lib/ast/converter';

interface STCodeEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onConvert?: (targetView: PLCViewType) => void;
  readOnly?: boolean;
}

export function STCodeEditor({ 
  initialValue = '', 
  onChange,
  onConvert,
  readOnly = false 
}: STCodeEditorProps): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // サンプルSTプログラム
  const sampleSTProgram = `PROGRAM Main
VAR
  counter : INT := 0;
  timer : TON;
  output : BOOL := FALSE;
END_VAR

// Simple counter program
timer(IN := TRUE, PT := T#1s);

IF timer.Q THEN
  counter := counter + 1;
  timer(IN := FALSE);
  
  IF counter >= 10 THEN
    output := TRUE;
    counter := 0;
  END_IF;
END_IF;

END_PROGRAM`;

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    const updatedValue = newValue || '';
    setValue(updatedValue);
    onChange?.(updatedValue);
    
    // リアルタイム構文チェック（簡易版）
    validateSyntax(updatedValue);
  }, [onChange]);

  const validateSyntax = useCallback(async (code: string) => {
    if (!code.trim()) {
      setErrors([]);
      return;
    }

    setIsValidating(true);
    try {
      const result = parseCodeToAST(code, PLCViewType.ST);
      if (!result.success) {
        setErrors(result.errors.map(err => err.message));
      } else {
        setErrors([]);
      }
    } catch (error) {
      setErrors([`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
    setIsValidating(false);
  }, []);

  const handleConvertTo = useCallback((targetView: PLCViewType) => {
    onConvert?.(targetView);
  }, [onConvert]);

  const loadSample = useCallback(() => {
    setValue(sampleSTProgram);
    onChange?.(sampleSTProgram);
    validateSyntax(sampleSTProgram);
  }, [onChange, sampleSTProgram, validateSyntax]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            ST Editor
          </span>
          {isValidating && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span>検証中...</span>
            </div>
          )}
          {errors.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-red-600">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.length} エラー</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadSample}
            className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            サンプル読込
          </button>
          <button
            onClick={() => handleConvertTo(PLCViewType.LD)}
            className="rounded bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
          >
            → LD変換
          </button>
          <button
            onClick={() => handleConvertTo(PLCViewType.SFC)}
            className="rounded bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
          >
            → SFC変換
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="pascal" // ST is similar to Pascal
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            readOnly,
            theme: 'vs',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            glyphMargin: true,
            renderLineHighlight: 'all',
          }}
          theme="vs"
        />
      </div>

      {/* Error Panel */}
      {errors.length > 0 && (
        <div className="border-t border-gray-200 bg-red-50 p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">構文エラー:</h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-xs text-red-700 font-mono">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 