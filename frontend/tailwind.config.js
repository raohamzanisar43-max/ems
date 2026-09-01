/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // NovuLabs light theme (matches the Login/Dashboard/Attendance mockups).
        // Token *names* are kept stable so every existing page/component that
        // already references them (bg-panel, text-ink, text-muted, bg-signal,
        // text-mint/amber/rose, ...) picks up the new palette automatically.
        canvas: "#F6FAFE",     // page background
        ink: "#171C1F",        // primary text (on-surface)
        panel: "#FFFFFF",      // card / panel surface
        panel2: "#F0F4F8",     // raised / secondary surface
        line: "#DFE3E7",       // hairline borders
        muted: "#414752",      // secondary text (on-surface-variant)
        signal: "#005FB7",     // primary accent (buttons/links/active states)
        purple: "#7C6FE0",     // stat-card accent
        blue: "#3B82F6",       // stat-card accent / info
        mint: "#10B981",       // positive / present / complete
        amber: "#F59E0B",      // pending / late / warning
        rose: "#EF4444",       // absent / overdue / danger
        primary: "#00478C",    // darker primary, for hovers/gradients
        sidebar: "#001E3C",    // dark navy sidebar background
        // Login page (NovuLabs auth card) palette
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#c9dbff",
          500: "#005FB7",
          600: "#00478C",
          700: "#00366b",
          800: "#00274d",
          900: "#001b3c",
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
        display: ["'Hanken Grotesk'", "sans-serif"],
        body: ["'Hanken Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        outfit: ["'Hanken Grotesk'", "sans-serif"],
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
