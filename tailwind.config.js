/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Omron brand colors
        omron: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // PLC language specific colors
        plc: {
          st: '#10b981',      // Green for ST
          ld: '#f59e0b',      // Orange for Ladder
          sfc: '#8b5cf6',     // Purple for SFC
          mixed: '#6366f1',   // Indigo for mixed
        },
        // Status colors
        status: {
          error: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Note: Forms and typography plugins removed until dependencies available
  ],
  safelist: [
    // PLC language specific classes
    'text-plc-st',
    'text-plc-ld', 
    'text-plc-sfc',
    'text-plc-mixed',
    'bg-plc-st',
    'bg-plc-ld',
    'bg-plc-sfc', 
    'bg-plc-mixed',
    // Status classes
    'text-status-error',
    'text-status-warning',
    'text-status-success',
    'text-status-info',
    'bg-status-error',
    'bg-status-warning',
    'bg-status-success',
    'bg-status-info',
  ],
}; 