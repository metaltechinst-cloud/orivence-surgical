/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        orivence: {
          ice: "#E0FBFC",
          pale: "#C2DFE3",
          bluegray: "#9DB4C0",
          slate: "#5C6B73",
          deep: "#253237",
        },
        background: {
          light: "#E0FBFC",
          dark: "#253237",
        },
        surface: {
          light: "#ffffff",
          dark: "#C2DFE3",
        },
        primary: {
          DEFAULT: "#253237",
          dark: "#9DB4C0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "clinical-gradient": "linear-gradient(135deg, #E0FBFC 0%, #ffffff 50%, #C2DFE3 100%)",
      },
      boxShadow: {
        "luxury-sm": "0 2px 8px -1px rgba(37, 50, 55, 0.06)",
        "luxury-md": "0 8px 30px rgba(37, 50, 55, 0.08)",
        "luxury-lg": "0 20px 50px rgba(37, 50, 55, 0.12)",
        "glass-light": "0 8px 32px 0 rgba(194, 223, 227, 0.25)",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "float-medium": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        }
      },
    },
  },
  plugins: [],
};
