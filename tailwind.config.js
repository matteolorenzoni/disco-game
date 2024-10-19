/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  future: {
    hoverOnlyWhenSupported: true
  },
  safelist: [
    {
      pattern: /bg-(primary|secondary|amber)-(500|600|700)/,
      variants: ['hover', 'active']
    },
    {
      pattern: /border-(primary|secondary|rose|amber)-(500|600|700)/,
      variants: ['hover', 'active', 'focus']
    },
    {
      pattern: /text-(primary|secondary|rose)-(200|500|600|700)/,
      variants: ['hover', 'active', 'peer-focus', 'focus']
    },
    {
      pattern: /caret-(primary|secondary)-(500)/,
      variants: ['focus']
    }
  ],
  theme: {
    extend: {
      fontSize: {
        xxs: ['0.625rem', { lineHeight: '0.75rem' }]
      },
      colors: {
        // Definizioni personalizzate dei colori
        'neutral-50': '#fbfcfe',
        'neutral-100': '#f0f4f8',
        'neutral-200': '#dde7ee',
        'neutral-300': '#cdd7e1',
        'neutral-400': '#9fa6ad',
        'neutral-500': '#636b74',
        'neutral-600': '#555e68',
        'neutral-700': '#32383e',
        'neutral-800': '#171a1c',
        'neutral-900': '#0b0d0e',
        'primary-50': '#f2ebf5',
        'primary-100': '#e0d2e7',
        'primary-200': '#c1a6cf',
        'primary-300': '#9f7ab5',
        'primary-400': '#875f9f',
        'primary-500': '#7B4B92',
        'primary-600': '#6b3e7e',
        'primary-700': '#59336a',
        'primary-800': '#472755',
        'primary-900': '#2e1a39',
        'secondary-50': '#e0f4f8',
        'secondary-100': '#b3e0e9',
        'secondary-200': '#80c3d0',
        'secondary-300': '#4DA6B5',
        'secondary-400': '#4B928E',
        'secondary-500': '#4A758D',
        'secondary-600': '#3C5E70',
        'secondary-700': '#2E4852',
        'secondary-800': '#1F3234',
        'secondary-900': '#111B1E',

        background: '#000000',
        'on-background': '#f0f4f8', // neutral-100

        surface: '#0b0d0e', // neutral-900
        'on-surface': '#dde7ee', // neutral-200

        'field-color': '#dde7ee', // neutral-200
        'field-background': '#0b0d0e', // fv-neutral-900
        'field-border': '#32383e', // fv-neutral-700
        'field-label-color': '#f0f4f8', // fv-neutral-100
        'field-icon-color': '#636b74', // fv-neutral-500

        'card-background': '#0b0d0e', // fv-neutral-900
        'card-border': '#32383e99' // fv-neutral-700, 60%
      }
    }
  },
  darkMode: 'class',
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.flex-center': {
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center'
        }
      };
      addUtilities(newUtilities);
    }
  ]
};
