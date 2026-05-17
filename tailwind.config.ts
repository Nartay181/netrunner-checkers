import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        matrix: "#00ff41",
        cyber: "#00f3ff",
        danger: "#ff003c",
        panel: "#090d0c"
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
        ]
      },
      boxShadow: {
        "matrix-soft": "0 0 20px rgba(0, 255, 65, 0.24)",
        "matrix-hard": "0 0 28px rgba(0, 255, 65, 0.48)",
        "cyber-soft": "0 0 24px rgba(0, 243, 255, 0.28)",
        "danger-soft": "0 0 24px rgba(255, 0, 60, 0.26)"
      },
      animation: {
        "scan-drift": "scan-drift 7s linear infinite",
        "glitch-pulse": "glitch-pulse 2.4s ease-in-out infinite"
      },
      keyframes: {
        "scan-drift": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        "glitch-pulse": {
          "0%, 100%": { opacity: "0.72" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
