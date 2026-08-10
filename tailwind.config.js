/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#F2EFE6',
          dim: '#E8E3D3',
          line: '#DAD3BC',
        },
        ink: {
          950: '#0C1420',
          900: '#131C2E',
          800: '#1E2B42',
          700: '#2B3B57',
          500: '#5A6B85',
          300: '#9AA6B8',
        },
        brass: {
          50: '#FBF6EB',
          200: '#E7CE97',
          400: '#C7A052',
          500: '#A8823D',
          600: '#8C6A2E',
          700: '#6F5423',
        },
        estado: {
          disponible: '#2F6B4F',
          disponibleBg: '#E6EEE8',
          proceso: '#B9791E',
          procesoBg: '#F5EADB',
          vendido: '#9C3B2C',
          vendidoBg: '#F1E2DD',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(12,20,32,0.06), 0 8px 24px -12px rgba(12,20,32,0.18)',
        seal: 'inset 0 0 0 1px rgba(168,130,61,0.35)',
      },
      backgroundImage: {
        blueprint:
          'linear-gradient(rgba(19,28,46,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(19,28,46,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
      letterSpacing: {
        widest2: '0.18em',
      },
    },
  },
  plugins: [],
}