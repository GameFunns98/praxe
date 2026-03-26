import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        primary: '#0F766E',
        card: '#FFFFFF',
        border: '#E2E8F0'
      }
    }
  },
  plugins: []
} satisfies Config;
