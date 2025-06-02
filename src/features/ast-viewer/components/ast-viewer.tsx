'use client';

import React, { useState } from 'react';
import { PLCASTNode } from '@/shared/types/plc';

interface ASTViewerProps {
  ast: PLCASTNode | null;
  className?: string;
}

interface TreeNodeProps {
  node: PLCASTNode;
  depth?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function TreeNode({ node, depth = 0, isExpanded = true, onToggle }: TreeNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(isExpanded);
  const hasChildren = node && typeof node === 'object' && Object.keys(node).some(key => 
    Array.isArray((node as any)[key]) || (typeof (node as any)[key] === 'object' && (node as any)[key] !== null)
  );

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };

  const getNodeColor = (nodeType: string): string => {
    switch (nodeType) {
      case 'PROGRAM': return 'text-blue-600 bg-blue-50';
      case 'VARIABLE_DECLARATION': return 'text-green-600 bg-green-50';
      case 'ASSIGNMENT': return 'text-orange-600 bg-orange-50';
      case 'IF_STATEMENT': return 'text-purple-600 bg-purple-50';
      case 'FOR_LOOP': 
      case 'WHILE_LOOP': return 'text-indigo-600 bg-indigo-50';
      case 'EXPRESSION': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-green-700 font-mono">"{value}"</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-700 font-mono">{value}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-orange-700 font-mono">{value.toString()}</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500 italic">[]</span>;
      }
      return (
        <span className="text-gray-600">
          Array[{value.length}]
        </span>
      );
    }
    
    if (typeof value === 'object') {
      return <span className="text-gray-600">Object</span>;
    }
    
    return <span className="text-gray-500">{String(value)}</span>;
  };

  return (
    <div className="ast-node">
      <div 
        className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-gray-50 cursor-pointer`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={hasChildren ? handleToggle : undefined}
      >
        {hasChildren && (
          <svg 
            className={`h-3 w-3 transform transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        
        <span className={`px-2 py-1 rounded text-xs font-medium ${getNodeColor(node.type)}`}>
          {node.type}
        </span>
        
        {node.id && (
          <span className="text-xs text-gray-500 font-mono">
            id: {node.id.slice(0, 8)}...
          </span>
        )}
        
        {(node as any).name && (
          <span className="text-xs font-semibold text-gray-700">
            {(node as any).name}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="ml-4">
          {Object.entries(node).map(([key, value]) => {
            if (key === 'id' || key === 'type') return null;
            
            if (Array.isArray(value)) {
              return (
                <div key={key} className="mt-1">
                  <div className="text-xs font-medium text-gray-600 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
                    {key}: [{value.length}]
                  </div>
                  {value.map((item, index) => {
                    if (typeof item === 'object' && item && 'type' in item) {
                      return (
                        <TreeNode
                          key={`${key}-${index}`}
                          node={item as PLCASTNode}
                          depth={depth + 2}
                          isExpanded={false}
                        />
                      );
                    }
                    return (
                      <div 
                        key={`${key}-${index}`}
                        className="text-xs px-2 py-1"
                        style={{ paddingLeft: `${(depth + 2) * 20}px` }}
                      >
                        [{index}]: {renderValue(item)}
                      </div>
                    );
                  })}
                </div>
              );
            }
            
            if (typeof value === 'object' && value && 'type' in value) {
              return (
                <div key={key} className="mt-1">
                  <div className="text-xs font-medium text-gray-600 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
                    {key}:
                  </div>
                  <TreeNode
                    node={value as PLCASTNode}
                    depth={depth + 2}
                    isExpanded={false}
                  />
                </div>
              );
            }
            
            return (
              <div 
                key={key}
                className="text-xs px-2 py-1 flex items-center space-x-2"
                style={{ paddingLeft: `${(depth + 1) * 20}px` }}
              >
                <span className="font-medium text-gray-600">{key}:</span>
                {renderValue(value)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ASTViewer({ ast, className = '' }: ASTViewerProps): JSX.Element {
  const [jsonView, setJsonView] = useState(false);

  if (!ast) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">AST データがありません</p>
          <p className="text-xs text-gray-400 mt-1">コードを入力して変換してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-medium text-gray-900">AST ビューアー</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setJsonView(!jsonView)}
            className={`px-3 py-1 text-xs font-medium rounded ${
              jsonView
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {jsonView ? 'ツリー表示' : 'JSON表示'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {jsonView ? (
          <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(ast, null, 2)}
          </pre>
        ) : (
          <TreeNode node={ast} depth={0} isExpanded={true} />
        )}
      </div>
    </div>
  );
} 