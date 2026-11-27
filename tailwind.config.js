/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#E8E4DD',
        signal: '#E63B2E',
        orange: {
          DEFAULT: '#E63B2E',
          accent: '#FF5722',
        },
        gyf: {
          sky: '#74A5D4',
          vibrant: '#239CEC',
          royal: '#0D6EFD',
          dark: '#0A1C2E',
          navy: '#071526',
        },
        offwhite: '#F5F3EE',
        ink: '#111111',
        inklight: '#2A2A2A',
        muted: '#6B6B6B',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
      fontWeight: {
        '600': '600',
        '700': '700',
      },
    },
  },
  plugins: [],
}
