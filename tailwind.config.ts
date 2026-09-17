import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ocean: {
          50: "#eef8fb",
          100: "#d7eef4",
          200: "#aedfea",
          300: "#78c9db",
          400: "#3fabc4",
          500: "#1f8ba8",
          600: "#146f8a",
          700: "#135970",
          800: "#14495b",
          900: "#133d4d",
        },
        sand: {
          50: "#fdfbf6",
          100: "#f7f2e6",
          200: "#f0e6cd",
          300: "#e4d3a8",
          400: "#d4ba7c",
        },
        coral: {
          400: "#ff9472",
          500: "#ff7a52",
          600: "#f2603a",
        },
        seafoam: {
          400: "#7bd9c4",
          500: "#4fc2ab",
        },
      },
      boxShadow: {
        coastal: "0 1px 2px rgba(19, 61, 77, 0.06), 0 8px 24px rgba(19, 61, 77, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
};

export default config;
