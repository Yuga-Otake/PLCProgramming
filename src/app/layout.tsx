import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ErrorBoundary } from '@/shared/ui/error-boundary';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Omron PLC Web Editor',
  description: 'Web-based PLC Editor for Omron NJ/NX Series with ST/Ladder/SFC conversion',
  keywords: ['PLC', 'Omron', 'ST', 'Ladder', 'SFC', 'Editor'],
  authors: [{ name: 'PLC Studio Team' }],
  robots: 'noindex, nofollow', // Prevent indexing in development
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <ErrorBoundary>
          <Providers>
            <div className="flex h-full flex-col">
              <header className="border-b border-gray-200 bg-white shadow-sm">
                <div className="flex h-16 items-center justify-between px-4">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Omron PLC Studio
                    </h1>
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      Beta
                    </span>
                  </div>
                  <nav>
                    {/* Navigation will be implemented here */}
                  </nav>
                </div>
              </header>
              
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
              
              <footer className="border-t border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    &copy; 2024 Omron PLC Studio. All rights reserved.
                  </div>
                  <div className="flex space-x-4">
                    <span>Version 0.1.0</span>
                    <span>•</span>
                    <span className="text-gray-500">
                      ヘルプ
                    </span>
                  </div>
                </div>
              </footer>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 