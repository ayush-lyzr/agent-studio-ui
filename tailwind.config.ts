import { fontSize } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        mobile: "340px",
        "large-screen": "1920px",
      },
    },
    fontSize: {
      xxs: "0.6rem",
      ...fontSize,
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        link: "hsl(var(--link))",
        "gradient-pink": "hsl(var(--gradient-pink))",
        "gradient-purple": "hsl(var(--gradient-purple))",
        "gradient-blue": "hsl(var(--gradient-blue))",
        "gradient-cyan": "hsl(var(--gradient-cyan))",
        "gradient-teal": "hsl(var(--gradient-teal))",
        "gradient-green": "hsl(var(--gradient-green))",
        "gradient-lime": "hsl(var(--gradient-lime))",
        "gradient-yellow": "hsl(var(--gradient-yellow))",
        "gradient-orange": "hsl(var(--gradient-orange))",
        "gradient-red": "hsl(var(--gradient-red))",
        "gradient-violet": "hsl(var(--gradient-violet))",
        "gradient-indigo": "hsl(var(--gradient-indigo))",
        "gradient-pink-dark": "hsl(var(--gradient-pink-dark))",
        "gradient-purple-dark": "hsl(var(--gradient-purple-dark))",
        "gradient-blue-dark": "hsl(var(--gradient-blue-dark))",
        "gradient-cyan-dark": "hsl(var(--gradient-cyan-dark))",
        "gradient-teal-dark": "hsl(var(--gradient-teal-dark))",
        "gradient-green-dark": "hsl(var(--gradient-green-dark))",
        "gradient-lime-dark": "hsl(var(--gradient-lime-dark))",
        "gradient-yellow-dark": "hsl(var(--gradient-yellow-dark))",
        "gradient-orange-dark": "hsl(var(--gradient-orange-dark))",
        "gradient-red-dark": "hsl(var(--gradient-red-dark))",
        "gradient-violet-dark": "hsl(var(--gradient-violet-dark))",
        "gradient-indigo-dark": "hsl(var(--gradient-indigo-dark))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          background: "hsl(var(--warning-background))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          background: "hsl(var(--success-background))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        premium: {
          DEFAULT: "hsl(var(--premium-text))",
          background: "hsl(var(--premium-background))",
        },
        badge: {
          background: "hsl(var(--badge-background))",
        },
        eval: {
          yellow: "hsl(var(--badge-yellow))",
          "yellow-background": "hsl(var(--badge-yellow-background))",
          red: "hsl(var(--badge-red))",
          "red-background": "hsl(var(--badge-red-background))",
        },
        linkedin: "hsl(var(--linkedin))",
        twitter: "hsl(var(--twitter))",
        home: {
          emerald: "hsl(var(--home-emerald))",
          "emerald-background": "hsl(var(--home-emerald-background))",
          pink: "hsl(var(--home-pink))",
          "pink-background": "hsl(var(--home-pink-background))",
          blue: "hsl(var(--home-blue))",
          "blue-background": "hsl(var(--home-blue-background))",
          purple: "hsl(var(--home-purple))",
          "purple-background": "hsl(var(--home-purple-background))",
          yellow: "hsl(var(--home-yellow))",
          "yellow-background": "hsl(var(--home-yellow-background))",
        },
        agent: {
          blue: "hsl(var(--agent-card-blue))",
          "blue-background": "hsl(var(--agent-card-blue-background))",
          cyan: "hsl(var(--agent-card-cyan))",
          "cyan-background": "hsl(var(--agent-card-cyan-background))",
          violet: "hsl(var(--agent-card-violet))",
          "violet-background": "hsl(var(--agent-card-violet-background))",
          orange: "hsl(var(--agent-card-orange))",
          "orange-background": "hsl(var(--agent-card-orange-background))",
          slate: "hsl(var(--agent-card-slate))",
          "slate-background": "hsl(var(--agent-card-slate-background))",
          lime: "hsl(var(--agent-card-lime))",
          "lime-background": "hsl(var(--agent-card-lime-background))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        cat: {
          core: "hsl(var(--cat-core))",
          eval: "hsl(var(--cat-eval))",
          ux: "hsl(var(--cat-ux))",
          memory: "hsl(var(--cat-memory))",
          tools: "hsl(var(--cat-tools))",
          traces: "hsl(var(--cat-traces))",
          guardrails: "hsl(var(--cat-guardrails))",
          voice: "hsl(var(--cat-voice))",
          "core-light": "hsl(var(--cat-core-light))",
          "eval-light": "hsl(var(--cat-eval-light))",
          "ux-light": "hsl(var(--cat-ux-light))",
          "memory-light": "hsl(var(--cat-memory-light))",
          "tools-light": "hsl(var(--cat-tools-light))",
          "traces-light": "hsl(var(--cat-traces-light))",
          "guardrails-light": "hsl(var(--cat-guardrails-light))",
          "voice-light": "hsl(var(--cat-voice-light))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        carousel: {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(-50%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        carousel: "carousel 40s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
