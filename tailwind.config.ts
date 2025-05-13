import type { Config } from "tailwindcss";

export default {
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
			padding: '2rem',
			screens: {
				'2xl': '1200px'
			}
		},
		fontFamily: {
			sans: ['Inter', 'sans-serif'],
			heading: ['Poppins', 'sans-serif'],
			accent: ['Caveat', 'cursive'],
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Teen theme colors
				'theme-peach': '#FFAB91',     // Soft Peach
				'theme-teal': '#4DB6AC',      // Calm Teal
				'theme-orange': '#FFB83D',    // Sunny Orange
				'theme-lavender': '#B39DDB',  // Subtle Lavender
				'theme-navy': '#1A1A3D',      // Deep Navy
				'theme-gray': '#F5F5F5',      // Light Gray
				
				// Theme semantic colors (for backward compatibility)
				'theme-primary': '#F5F5F5',   // Light Gray as primary background
				'theme-secondary': '#FFFFFF', // White as secondary background
				'theme-accent': '#4DB6AC',    // Teal as accent
				'theme-button': '#4DB6AC',    // Teal as primary button
				'theme-text': '#1A1A3D',      // Navy as text
				'theme-text-secondary': '#666666', // Secondary text
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'scale-up': {
					from: {
						transform: 'scale(1)'
					},
					to: {
						transform: 'scale(1.05)'
					}
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(77, 182, 172, 0.2)'
					},
					'50%': {
						boxShadow: '0 0 15px rgba(77, 182, 172, 0.4)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'scale-glow': 'scale-up 0.2s ease-out forwards, glow 1.5s ease-in-out infinite'
			},
			spacing: {
				'section': '80px', // Updated section padding for teen theme
			},
			fontSize: {
				'h1': '42px',
				'h2': '32px',
				'h3': '24px',
				'h4': '20px',
				'body': '16px',
				'small': '14px',
				'accent': '20px',
			},
			fontWeight: {
				'normal': '400',
				'medium': '500',
				'bold': '700',
			},
			boxShadow: {
				'card': '0 4px 15px rgba(0, 0, 0, 0.05)',
				'hover': '0 10px 25px rgba(77, 182, 172, 0.15)',
			},
			backgroundImage: {
				'gradient-peach-lavender': 'linear-gradient(to right, #FFAB91, #B39DDB)',
				'gradient-teal-navy': 'linear-gradient(to bottom, #4DB6AC, #1A1A3D)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
