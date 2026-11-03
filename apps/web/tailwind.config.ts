import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: '#0B0F17',
        foreground: '#F8FAFC',
        surface: {
          DEFAULT: '#121824',
          elevated: '#1B2232',
          border: '#283248',
        },
        evolve: {
          DEFAULT: '#10B981',
          hover: '#059669',
          tint: 'rgba(16, 185, 129, 0.12)',
        },
        engage: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          tint: 'rgba(6, 182, 212, 0.12)',
        },
        scale: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          tint: 'rgba(245, 158, 11, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
