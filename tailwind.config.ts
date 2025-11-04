import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#183F30",
      },
    },
    fontFamily: {
      raleway: ['var(--font-raleway)', 'sans-serif'],
      poppins: ['var(--font-poppins)', 'sans-serif'],
      nunito: ['Nunito', 'sans-serif'],
      source: ['"Source Sans Pro"', 'sans-serif'],
      sans: ['var(--font-inter)', 'Helvetica', 'Arial', 'sans-serif'],
    },
  },
  plugins: [],
};

export default config;