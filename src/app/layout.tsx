import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ErrorBoundary } from '@/shared/ui/error-boundary';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PLC Web Editor',
  description: 'Web-based PLC Editor for NJ/NX Series with ST/Ladder/SFC conversion',
  keywords: ['PLC', 'ST', 'Ladder', 'SFC', 'Editor'],
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
              <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center py-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <h1 className="text-2xl font-bold text-gray-900">
                          PLC Studio
                        </h1>
                      </div>
                    </div>
                    <nav>
                      {/* Navigation will be implemented here */}
                    </nav>
                  </div>
                </div>
              </header>
              
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
              
              <footer className="bg-gray-50 border-t">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500">
                      &copy; 2024 PLC Studio. All rights reserved.
                    </p>
                    <div className="flex space-x-4">
                      <span>Version 0.1.0</span>
                      <span>•</span>
                      <span className="text-gray-500">
                        ヘルプ
                      </span>
                    </div>
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