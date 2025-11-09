import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#00d4ff',
        'electric-blue-light': '#3ae8ff',
        'electric-blue-dark': '#00a8cc',
        'magenta': '#ff00ff',
        'magenta-light': '#ff3aff',
        'magenta-dark': '#cc00cc',
        'vibrant-orange': '#ff6b35',
        'vibrant-orange-light': '#ff8c5a',
        'vibrant-orange-dark': '#e55a2b',
      },
      fontFamily: {
        'sans': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['Rubik', 'Poppins', 'sans-serif'],
      },
      animation: {
        'confetti-drop': 'confetti-drop 2s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'bounce-glow': 'bounce-glow 2s ease-in-out infinite',
        'rope-tension': 'rope-tension 1s ease-in-out infinite',
      },
      keyframes: {
        'confetti-drop': {
          '0%': { transform: 'translateY(-10vh) scale(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1', transform: 'translateY(0) scale(1) rotate(180deg)' },
          '100%': { transform: 'translateY(110vh) scale(0.4) rotate(720deg)', opacity: '0' },
        },
        'shimmer': {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'bounce-glow': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.1)' },
        },
        'rope-tension': {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.02)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
