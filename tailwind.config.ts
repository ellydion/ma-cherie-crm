import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3F2A1F",
          light: "#FAF5ED",
          dark: "#2C1F17",
        },
        secondary: "#8D5F2E",
        accent: "#C8A77E",           // ← исправленный мягкий бежевый цвет
        "coffee-bg": "#FAF5ED",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;