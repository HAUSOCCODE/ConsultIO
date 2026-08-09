/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#fbf4f5",
          100: "#f5e6e8",
          200: "#ebcbd0",
          300: "#dca3ad",
          400: "#c87484",
          500: "#ad4a5e",
          600: "#8c293b",
          700: "#761f31",
          800: "#681827",
          900: "#4b101c",
        },
        gold: {
          50: "#fdf9ef",
          100: "#f8edcf",
          200: "#f0d99e",
          300: "#e5c36d",
          400: "#d7af54",
          500: "#be9135",
          600: "#9c7028",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(75,16,28,.10)",
        soft: "0 8px 30px rgba(15,23,42,.07)",
        glow: "0 18px 55px rgba(75,16,28,.18)",
      },
    },
  },
  plugins: [],
};
