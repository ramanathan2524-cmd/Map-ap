/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
      },
      colors: {
        bg:          "#0D1117",
        surface:     "#161B22",
        "surface-alt":"#1C2128",
        border:      "#30363D",
        accent:      "#F0A500",
        // Party colors
        ysrcp: "#1565C0",
        tdp:   "#FFD600",
        jsp:   "#E53935",
        inc:   "#00897B",
        bjp:   "#FF6D00",
      },
    },
  },
  plugins: [],
};
