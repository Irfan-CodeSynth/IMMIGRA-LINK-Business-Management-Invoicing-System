/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0B0F19",
          "navy-dark": "#05070D",
          "navy-light": "#1E2638",
          gold: "#7C3AED",
          "gold-light": "#A78BFA",
          "gold-dark": "#5B21B6",
          royal: "#6366F1",
          "royal-light": "#818CF8",
          purple: "#7C3AED",
          indigo: "#6366F1",
          violet: "#8B5CF6",
          bg: "#F8FAFC",
          surface: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
