import { Nunito } from "next/font/google";
import type { Config } from "tailwindcss";
 
const config: Config = {
  content: [
    "./pages/*/.{js,ts,jsx,tsx,mdx}",
    "./components/*/.{js,ts,jsx,tsx,mdx}",
    "./app/*/.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#183F30",
        
      },
    },
    fontFamily: {
      raleway: ['Raleway', 'sans-serif'],
      poppins: ['Poppins', 'sans-serif'],
      nunito: Nunito({ subsets: ["latin"] }).style.fontFamily,
      source: ['"Source Sans Pro"', 'sans-serif'],
      sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
    },
  },
  plugins: [],
};
 
export default config;