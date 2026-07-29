/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6FA",    // page background
        ink: "#1F2430",       // primary text (dark navy)
        panel: "#FFFFFF",     // card / panel surface
        panel2: "#F3F5F9",    // raised / secondary surface
        line: "#E7EAF1",      // hairline borders
        muted: "#8A93A6",     // secondary text
        signal: "#FF7A45",    // warm signal accent (status/action)
        purple: "#7C6FE0",    // stat-card accent
        blue: "#3B82F6",      // stat-card accent
        mint: "#22C55E",      // positive / complete
        amber: "#F5B94D",     // pending / warning
        rose: "#EF4444",      // overdue / danger
        // Login page (NovuLabs auth card) palette
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b0764",
        },
        electric: {
          azure: "#1C73C9",
          sky: "#43B6F2",
          cyan: "#66E8FF",
          glow: "#55E6F8",
          bright: "#8EE9FF",
          highlight: "#A7F5FF",
          light: "#A7F5FF",
          ice: "#DDFBFF",
        },
        navy: {
          900: "#0A2440",
          800: "#123254",
          700: "#1C4A73",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        outfit: ["'Outfit'", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px 0 rgba(31,36,48,0.04), 0 1px 3px 0 rgba(31,36,48,0.06)",
      },
      animation: {
        wave: "wave 2s infinite",
        "code-cursor": "blink 1s step-end infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%, 60%": { transform: "rotate(14deg)" },
          "40%, 80%": { transform: "rotate(-8deg)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.03)" },
        },
      },
    },
  },
  plugins: [],
};
