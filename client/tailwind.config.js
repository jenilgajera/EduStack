/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          "50":"#eff6ff",
          "100":"#dbeafe",
          "200":"#bfdbfe",
          "300":"#93c5fd",
          "400":"#60a5fa",
          "500":"#3b82f6",
          "600":"#2563eb",
          "700":"#1d4ed8",
          "800":"#1e40af",
          "900":"#1e3a8a",
          "950":"#172554",
          DEFAULT: "#0D6EFD",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "#F0F1F3",
          foreground: "#020817"
        },
        accent: {
          DEFAULT: "#6D7074",
          foreground: "#020817"
        },
        background: "#FAFAFB",
        foreground: "#020817",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#020817"
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#020817"
        },
        muted: {
          DEFAULT: "#F0F1F3",
          foreground: "#6D7074"
        },
        destructive: {
          DEFAULT: "#FF4C4C",
          foreground: "#FFFFFF"
        },
        border: "#E0E0E0",
        input: "#E0E0E0",
        ring: "#0D6EFD",
        chart: {
          1: "#FF6F61",
          2: "#4CAF50",
          3: "#03A9F4",
          4: "#FFC107",
          5: "#8E44AD"
        },
        dark: {
          primary: {
            DEFAULT: "#0D6EFD",
            foreground: "#FFFFFF"
          },
          secondary: {
            DEFAULT: "#1E1E2C",
            foreground: "#FAFAFB"
          },
          accent: {
            DEFAULT: "#6D7074",
            foreground: "#FAFAFB"
          },
          background: "#020817",
          foreground: "#FAFAFB",
          card: {
            DEFAULT: "#121212",
            foreground: "#FAFAFB"
          },
          popover: {
            DEFAULT: "#121212",
            foreground: "#FAFAFB"
          },
          muted: {
            DEFAULT: "#1E1E2C",
            foreground: "#6D7074"
          },
          destructive: {
            DEFAULT: "#FF4C4C",
            foreground: "#FFFFFF"
          },
          border: "#3C3C3C",
          input: "#3C3C3C",
          ring: "#0D6EFD"
        }
      },
      fontFamily: {
        'body': [
          'Nunito Sans', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ],
        'sans': [
          'Nunito Sans', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ],
        inter: ['Inter', 'sans-serif']
      },
      borderRadius: {
        sm: '0.125rem'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      fontSize: {
        heading: '36px',
        body: '14px'
      },
      fontWeight: {
        heading: '700',
        body: '600'
      },
      animation: {
        "fade-in": "fadeIn 1s ease-in",
        "bounce-slow": "bounceSlow 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};