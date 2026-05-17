import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50:  '#f0fdf4',
                    100: '#DAEADB',
                    200: '#DAEADB',
                    300: '#7de8a9',
                    400: '#33c974',
                    500: '#005C2E',
                    600: '#004d26',
                    700: '#003d1e',
                    800: '#002d16',
                    900: '#001e0e',
                    950: '#000f07',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    raised: '#f9fafb',
                    overlay: '#f3f4f6',
                },
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            boxShadow: {
                'card':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                'card-lg': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
                'nav':     '0 -1px 0 0 rgb(0 0 0 / 0.06)',
            },
            animation: {
                'fade-in':  'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.25s ease-out',
            },
            keyframes: {
                fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
            },
        },
    },
    plugins: [forms],
};
