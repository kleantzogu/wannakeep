/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
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
  			}
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
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-8px)' },
  			},
  			pulse: {
  				'0%, 100%': { opacity: 0.7 },
  				'50%': { opacity: 1 },
  			},
  			ripple: {
  				to: { transform: 'scale(3)', opacity: 0 },
  			},
  			'bg-shift': {
  				'0%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  				'100%': { backgroundPosition: '0% 50%' },
  			},
  			ping: {
  				'0%': { transform: 'scale(1)', opacity: 1 },
  				'75%, 100%': { transform: 'scale(2)', opacity: 0 },
  			},
  			'spin-slow': {
  				to: { transform: 'rotate(360deg)' }
  			},
  			'fade-in': {
  				'0%': { opacity: 0, transform: 'translateY(10px)' },
  				'100%': { opacity: 1, transform: 'translateY(0)' }
  			},
  			'particle-out': {
  				'0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
  				'10%': { opacity: 1 },
  				'70%': { opacity: 0.5 },
  				'100%': { transform: 'scale(1.2) translateY(-20px)', opacity: 0 }
  			},
  			'scan-animation': {
  				'0%': { transform: 'translateX(0%)' },
  				'100%': { transform: 'translateX(100%)' }
  			},
  			'blink': {
  				'0%': { opacity: 0 },
  				'50%': { opacity: 1 },
  				'100%': { opacity: 0 }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			float: 'float 4s ease-in-out infinite',
  			pulse: 'pulse 2s ease-in-out infinite',
  			ripple: 'ripple 0.6s linear',
  			'bg-shift': 'bg-shift 3s ease infinite',
  			ping: 'ping 1.5s ease-in-out infinite',
  			'spin-slow': 'spin-slow 4s linear infinite',
  			'fade-in': 'fade-in 0.5s ease-out forwards',
  			'particle-out': 'particle-out 1.5s ease-out infinite',
  			'scan-animation': 'scan-animation 2s ease-in-out infinite',
  			'blink': 'blink 1.4s steps(2) infinite'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
}
