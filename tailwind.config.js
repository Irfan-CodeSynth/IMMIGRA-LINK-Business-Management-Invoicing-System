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
          navy: "#06183D",
          "navy-dark": "#030D22",
          "navy-light": "#0B275E",
          gold: "#E8BD57",
          "gold-light": "#F5D485",
          "gold-dark": "#B88E28",
          royal: "#1254A0",
          "royal-light": "#1B6ED1",
          bg: "#F5F7FB",
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
