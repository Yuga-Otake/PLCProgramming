'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
  errorId?: string | undefined;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorId: string; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Generate a simple error ID
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.setState({ errorId });
  }

  private handleRetry = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined as Error | undefined, 
      errorId: undefined as string | undefined 
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId || 'unknown'}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  errorId: string;
  retry: () => void;
}

function DefaultErrorFallback({ error, errorId, retry }: DefaultErrorFallbackProps): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              アプリケーションエラーが発生しました
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>
                予期しないエラーが発生しました。ページを再読み込みしてください。
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <details className="cursor-pointer">
            <summary className="text-sm text-gray-600 hover:text-gray-900">
              エラー詳細を表示
            </summary>
            <div className="mt-2 rounded-md bg-gray-100 p-3">
              <p className="text-xs font-mono text-gray-800">
                Error ID: {errorId}
              </p>
              <p className="mt-1 text-xs font-mono text-gray-800">
                {error.message}
              </p>
            </div>
          </details>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            onClick={retry}
          >
            再試行
          </button>
        </div>
      </div>
    </div>
  );
} 