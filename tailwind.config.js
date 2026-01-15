/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    theme: {
        extend: {
            colors: {
                // Semantic colors - use these for meaning
                accent: '#3b82f6',     // Blue - primary actions, links
                success: '#10b981',    // Emerald - positive states only
                warning: '#f59e0b',    // Amber - caution states
                danger: '#ef4444',     // Red - errors, risks

                // Surface colors
                surface: {
                    DEFAULT: '#1e293b', // slate-800
                    elevated: '#334155', // slate-700
                },

                // Border colors
                border: {
                    DEFAULT: 'rgba(255, 255, 255, 0.08)',
                    subtle: 'rgba(255, 255, 255, 0.05)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
            },
            // Spacing based on 4px grid
            spacing: {
                '4.5': '1.125rem', // 18px
                '13': '3.25rem',   // 52px
                '15': '3.75rem',   // 60px
            },
            // Consistent border radius
            borderRadius: {
                DEFAULT: '4px',
                'md': '6px',
                'lg': '8px',
                'xl': '12px',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in-up': 'slideInUp 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            // Timing for transitions
            transitionDuration: {
                '150': '150ms', // micro-interactions
                '200': '200ms', // state changes
                '250': '250ms', // modals/overlays
            },
        }
    },
    plugins: [],
}
