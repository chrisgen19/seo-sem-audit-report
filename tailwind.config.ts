import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EBF2FA",
          100: "#D6E4F0",
          500: "#2980B9",
          700: "#1A5276",
          900: "#1F4E79",
        },
      },
    },
  },
  plugins: [],
};

export default config;
