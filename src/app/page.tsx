import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues
const PLCEditor = dynamic(() => import('@/widgets/plc-editor/index'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">PLCエディタを読み込み中...</p>
      </div>
    </div>
  ),
});

export default function HomePage(): JSX.Element {
  return (
    <div className="h-full">
      <PLCEditor />
    </div>
  );
} 