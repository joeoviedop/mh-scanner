import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Libre Franklin", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // Brand colors
        brand: {
          pink: "#FF40CE",
          dark: "#06204E", 
          blue: "#0065FF",
          light: "#95E0FF",
        },
        
        // Color palette inspired by Stripe
        gray: {
          50: "#f8fafc",
          100: "#f2f6f9", 
          200: "#e8eef3",
          300: "#d5dee5",
          400: "#b8c5ce",
          500: "#97a6b2",
          600: "#768590",
          700: "#566471",
          800: "#35404a",
          900: "#1e293b",
          950: "#0f172a",
        },
        
        // Primary semantic colors (using brand colors)
        primary: {
          50: "#fef7ff",
          100: "#fceeff",
          200: "#f6dfff",
          300: "#eec8ff",
          400: "#e3acff",
          500: "#FF40CE",
          600: "#e91bb5",
          700: "#cc159e",
          800: "#b01284",
          900: "#910e6a",
          950: "#630647",
        },
        
        // Semantic colors
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        
        // Accent colors
        accent: {
          blue: {
            50: "#f0f9ff",
            100: "#e0f2fe",
            200: "#bae6fd",
            300: "#7dd3fc",
            400: "#38bdf8",
            500: "#0065FF",
            600: "#0284c7",
            700: "#0369a1",
            800: "#075985",
            900: "#0c4a6e",
          }
        },
      },
      
      // Modern spacing scale
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      
      // Border radius
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      
      // Animation durations
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
      },
      
      // Modern shadows
      boxShadow: {
        "stripe": "0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "stripe-lg": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "stripe-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "glow": "0 0 20px rgba(255, 64, 206, 0.1)",
        "glow-lg": "0 0 40px rgba(255, 64, 206, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;