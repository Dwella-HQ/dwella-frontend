/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Satoshi",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          main: "var(--brand-main)",
          "main-bg": "var(--brand-main-bg)",
          secondary: "var(--brand-secondary)",
          "light-bg": "var(--brand-light-bg)",
          black: "var(--brand-black)",
          white: "var(--brand-white)",
          ash: "var(--brand-ash)",
          "success-bg": "var(--brand-success-bg)",
          "success-text": "var(--brand-success-text)",
          "failed-bg": "var(--brand-failed-bg)",
          "failed-text": "var(--brand-failed-text)",
          "pending-bg": "var(--brand-pending-bg)",
          "pending-text": "var(--brand-pending-text)",
          "border-light": "var(--brand-border-light)",
          "border-dark": "var(--brand-border-dark)",
          green: "var(--brand-green)",
          "green-50": "#00c9500d",
          "green-100": "#00c9501a",
          "green-200": "#00c95033",
          "green-600": "#00c950",
          "green-700": "#00b045",
        },
      },
    },
  },
  plugins: [],
};
