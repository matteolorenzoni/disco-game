/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/tw-elements/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0EBFE', // 5%
          100: '#E0DFFD', // 10%
          200: '#C5BDF9', // 20%
          300: '#AB9BF5', // 30%
          400: '#9078F1', // 40%
          500: '#7766C6', // Colore di base
          600: '#614DA1', // 60%
          700: '#4A387D', // 70%
          800: '#35225A', // 80%
          900: '#211138', // 90%
          1000: '#12061B' // 100%
        },
        // secondary: {
        //   0: '#FFFFFF', // Bianco
        //   100: '#F2E6FD', // 10%
        //   200: '#E6D9FB', // 20%
        //   300: '#D9C8F9', // 30%
        //   400: '#C9B5F7', // 40%
        //   500: '#E0DFFD', // Colore di base
        //   600: '#B5C6E4', // 60%
        //   700: '#A1B2D5', // 70%
        //   800: '#8E9BC7', // 80%
        //   900: '#7A85B8', // 90%
        //   1000: '#4A4A4A' // 100%
        // },
        'on-primary': '#E0DFFD', // Testo bianco su sfondo primario
        'on-secondary': '#000000', // Testo nero su sfondo secondario
        'on-background': '#000000', // Testo nero su sfondo chiaro
        'on-surface': '#000000', // Testo nero su superfici bianche
        'on-error': '#FFFFFF' // Testo bianco su sfondo di errore
      }
    }
  },
  darkMode: 'class',
  plugins: [require('tw-elements/plugin.cjs')]
};
