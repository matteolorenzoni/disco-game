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
      pattern: /text-(primary|secondary|amber|rose)-(200|500|600|700)/,
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
        'neutral-150': '#e5edf3',
        'neutral-200': '#dde7ee',
        'neutral-250': '#d2dfe8',
        'neutral-300': '#cdd7e1',
        'neutral-350': '#b3c1cd',
        'neutral-400': '#9fa6ad',
        'neutral-450': '#8b939b',
        'neutral-500': '#636b74',
        'neutral-550': '#5a626b',
        'neutral-600': '#555e68',
        'neutral-650': '#484f59',
        'neutral-700': '#32383e',
        'neutral-750': '#2b3035',
        'neutral-800': '#171a1c',
        'neutral-850': '#121416',
        'neutral-900': '#0b0d0e',
        'neutral-950': '#070809',
        'primary-50': '#E3E3F0',
        'primary-100': '#BFBFD7',
        'primary-200': '#9A9ABE',
        'primary-300': '#7676A4',
        'primary-400': '#51518B',
        'primary-500': '#2D2D72',
        'primary-600': '#262661',
        'primary-700': '#1E1E51',
        'primary-800': '#171740',
        'primary-900': '#0F0F2F',
        'secondary-50': '#F8F8FC',
        'secondary-100': '#ECECF7',
        'secondary-200': '#E0E0F2',
        'secondary-300': '#D4D4EC',
        'secondary-400': '#C8C8E7',
        'secondary-500': '#BCBCE2',
        'secondary-600': '#9999BB',
        'secondary-700': '#767694',
        'secondary-800': '#52526D',
        'secondary-900': '#2F2F46',

        background: '#E0E0F2',
        'on-background': '#171740',

        surface: '#D4D4EC',
        'on-surface': '#1E1E51',

        'field-color': '#2D2D72',
        'field-background': '#F8F8FC',
        'field-border': '#BCBCE2',
        'field-label-color': '#2D2D72',
        'field-icon-color': '#BCBCE2',
        'focus-field': '#262661'

        // 'card-background': '#0b0d0e',
        // 'card-border': '#32383e99'
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
