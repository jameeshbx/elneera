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
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'sans-serif'],
        source: ['"Source Sans Pro"', 'sans-serif'],
        sans: ['var(--font-nunito)', 'sans-serif'], // Using Nunito as default sans font
      },
    },
  },
  plugins: [],
};

export default config;