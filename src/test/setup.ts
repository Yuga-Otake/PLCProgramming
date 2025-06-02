import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock for dom-to-image
vi.mock('dom-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

// Mock for WebSocket
global.WebSocket = vi.fn() as any;

// Mock for localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock for matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks();
}); 