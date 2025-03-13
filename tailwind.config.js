/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/**/*.{js,jsx,ts,tsx}",
        "./index.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
            },
            colors: {
                minecraft: {
                    green: '#5AC424',
                    darkgreen: '#3A8F17',
                    dirt: '#8B5A2B',
                    stone: '#777777',
                    water: '#3498DB',
                },
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            boxShadow: {
                'neon': '0 0 5px theme(colors.green.400), 0 0 20px theme(colors.green.600)',
                'neon-lg': '0 0 10px theme(colors.green.400), 0 0 30px theme(colors.green.600), 0 0 50px theme(colors.green.800)',
            },
        },
    },
    plugins: [
        require('tailwindcss-textshadow'),
        function({ addUtilities }) {
            const newUtilities = {
                '.scrollbar-thin': {
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px',
                    },
                },
                '.scrollbar-thumb-gray-600': {
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#4B5563',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#6B7280',
                    },
                },
                '.scrollbar-track-gray-800': {
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#1F2937',
                    },
                },
            }
            addUtilities(newUtilities, ['responsive', 'hover'])
        },
    ],
}