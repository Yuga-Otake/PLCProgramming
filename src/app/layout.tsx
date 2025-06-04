import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ErrorBoundary } from '@/shared/ui/error-boundary';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PLC Web Editor - Advanced PLC Development Studio',
  description: 'Web-based PLC Editor for NJ/NX Series with ST/Ladder/SFC conversion and custom function blocks',
  keywords: ['PLC', 'ST', 'Ladder', 'SFC', 'Editor', 'Function Block', 'NJ', 'NX'],
  authors: [{ name: 'PLC Studio Team' }],
  robots: 'noindex, nofollow', // Prevent indexing in development
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased overflow-hidden`}>
        <ErrorBoundary>
          <Providers>
            <div className="h-screen w-screen flex flex-col">
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 