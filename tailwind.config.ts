import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#CC0202",
          foreground: "#FFFFFF",
        },
        cream: "#F0EDE6",
      },
      boxShadow: {
        premium: "0 24px 80px -32px rgb(15 23 42 / 0.38)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
