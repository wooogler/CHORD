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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  safelist: [
    {
      pattern:
        /bg-(red|green|yellow|pink|purple|indigo|teal|stone|amber|orange|lime|emerald|cyan|sky|violet|fuchsia|rose)-200/,
    },
    {
      pattern:
        /text-(red|green|yellow|pink|purple|indigo|teal|stone|amber|orange|lime|emerald|cyan|sky|violet|fuchsia|rose)-600/,
    },
  ],
};
export default config;
