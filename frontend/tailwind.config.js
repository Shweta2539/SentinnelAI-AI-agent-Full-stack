/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05080D",
          900: "#0A0F17",
          800: "#101827",
          700: "#182236",
          600: "#232F47",
        },
        border: {
          DEFAULT: "#1E293B",
          light: "#2A3752",
        },
        signal: {
          DEFAULT: "#2DD4C8",
          dim: "#1B8F86",
          bright: "#5EEAE0",
        },
        alert: {
          critical: "#FF4D5E",
          high: "#FF8A3D",
          medium: "#F5C244",
          low: "#4DA3FF",
          none: "#3C4A63",
        },
        ink: {
          DEFAULT: "#E6ECF5",
          muted: "#8A96AC",
          faint: "#5A6786",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45,212,200,0.15), 0 0 24px -4px rgba(45,212,200,0.35)",
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(45,212,200,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,200,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "80%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scan: "scan 4s linear infinite",
        pulseRing: "pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        fadeUp: "fadeUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
