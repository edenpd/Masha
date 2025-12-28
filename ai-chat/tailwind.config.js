/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                'heebo': ['Heebo', 'sans-serif'],
                'rubik': ['Rubik', 'sans-serif'],
            },
            colors: {
                // Futuristic AI-themed color palette
                'neural': {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fc',
                    400: '#36aaf8',
                    500: '#0c8ce9',
                    600: '#006fc7',
                    700: '#0159a1',
                    800: '#064b85',
                    900: '#0b3f6e',
                    950: '#07284a',
                },
                'synapse': {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#d946ef',
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                    950: '#4a044e',
                },
                'matrix': {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
                'deep': {
                    900: '#0a0a1a',
                    800: '#0f0f2a',
                    700: '#14143a',
                    600: '#1a1a4a',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'gradient': 'gradient 8s linear infinite',
                'typing': 'typing 1.5s infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'neural-pulse': 'neuralPulse 2s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(12, 140, 233, 0.3)' },
                    '100%': { boxShadow: '0 0 40px rgba(217, 70, 239, 0.5)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                typing: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                neuralPulse: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
                    '50%': { transform: 'scale(1.1)', opacity: '1' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-pattern': 'linear-gradient(135deg, #0a0a1a 0%, #1a1a4a 50%, #14143a 100%)',
            },
        },
    },
    plugins: [],
}
