'use client';

import React from 'react';

interface EditorLayoutProps {
  title: string;
  subtitle?: string;
  sidebar: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  statusBar?: React.ReactNode;
}

export function EditorLayout({
  title,
  subtitle,
  sidebar,
  toolbar,
  children,
  rightPanel,
  statusBar
}: EditorLayoutProps): JSX.Element {
  return (
    <div className="h-full flex bg-gray-50">
      {/* サイドバー */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        {sidebar}
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {toolbar && (
              <div className="flex items-center space-x-2">
                {toolbar}
              </div>
            )}
          </div>
        </div>

        {/* エディタコンテンツ */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1">
            {children}
          </div>
          
          {/* 右パネル */}
          {rightPanel && (
            <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
              {rightPanel}
            </div>
          )}
        </div>

        {/* ステータスバー */}
        {statusBar && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex-shrink-0">
            {statusBar}
          </div>
        )}
      </div>
    </div>
  );
}

// ツールバーボタンコンポーネント
interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function ToolbarButton({
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'sm',
  children
}: ToolbarButtonProps): JSX.Element {
  const baseClasses = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`}
    >
      {children}
    </button>
  );
}

// ステータス表示コンポーネント
interface StatusIndicatorProps {
  status: 'ready' | 'running' | 'error' | 'warning';
  text: string;
}

export function StatusIndicator({ status, text }: StatusIndicatorProps): JSX.Element {
  const statusConfig = {
    ready: { color: 'text-green-600', icon: '●' },
    running: { color: 'text-blue-600', icon: '▶' },
    error: { color: 'text-red-600', icon: '✗' },
    warning: { color: 'text-orange-600', icon: '⚠' },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-1 text-xs ${config.color}`}>
      <span>{config.icon}</span>
      <span>{text}</span>
    </div>
  );
} 