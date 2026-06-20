import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--color-cream-rgb) / <alpha-value>)",
        black: "rgb(var(--color-black-rgb) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal-rgb) / <alpha-value>)",
        gold: "rgb(var(--color-gold-rgb) / <alpha-value>)",
        "gold-dark": "rgb(var(--color-gold-dark-rgb) / <alpha-value>)",
        terracotta: "rgb(var(--color-terracotta-rgb) / <alpha-value>)",
        "gray-mid": "var(--color-gray-mid)",
        "gray-light": "var(--color-gray-light)",
        warm: {
          50: "#FDFCFB",
          100: "#F5F2ED",
          200: "#E8E4DE",
          300: "#D4CEC5",
          400: "#B0A89C",
          500: "#8C8276",
          600: "#6B6359",
          700: "#4A433C",
          800: "#332D28",
          900: "#1A1816",
        },
      },
      fontFamily: {
        serif: "var(--font-serif)",
        sans: "var(--font-sans)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        gold: "var(--shadow-gold)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      screens: {
        xs: "360px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
    },
  },
  plugins: [
    function ({ addVariant }: { addVariant: (name: string, def: string) => void }) {
      addVariant("hover-safe", "@media (hover: hover) and (pointer: fine) { &:hover }");
    },
  ],
};

export default config;
