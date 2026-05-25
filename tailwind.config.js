/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vapor: {
          dark: '#080112',
          deep: '#120424',
          purple: '#24063c',
          pink: '#ff007f',
          magenta: '#ff00aa',
          neonBlue: '#00f0ff',
          neonPurple: '#b026ff',
          yellow: '#ffeb3b',
          glowBlue: 'rgba(0, 240, 255, 0.4)',
          glowPink: 'rgba(255, 0, 127, 0.4)',
        }
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace'],
        orbitron: ['"Orbitron"', 'sans-serif'],
      },
      animation: {
        'grid-scroll': 'gridScroll 12s linear infinite',
        'flicker': 'flicker 0.2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 15s linear infinite',
        'spin-reverse-slow': 'spin-reverse 15s linear infinite',
        'sun-glow': 'sunGlow 4s ease-in-out infinite alternate',
      },
      keyframes: {
        gridScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(80px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.99' },
          '50%': { opacity: '0.96' },
        },
        'spin-reverse': {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 0, 127, 0.5), 0 0 20px rgba(255, 0, 127, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 0, 127, 0.8), 0 0 40px rgba(255, 0, 127, 0.5)' },
        },
        sunGlow: {
          'from': { filter: 'drop-shadow(0 0 20px #ff007f) drop-shadow(0 0 40px #ff00aa)' },
          'to': { filter: 'drop-shadow(0 0 35px #ff007f) drop-shadow(0 0 70px #ff00aa) drop-shadow(0 0 100px #ff00ff)' }
        }
      }
    },
  },
  plugins: [],
}
