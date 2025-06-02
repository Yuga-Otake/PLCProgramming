'use client';

import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <div>
      {/* TODO: Add global providers (State management, Theme, etc.) */}
      {children}
    </div>
  );
} 