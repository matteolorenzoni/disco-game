/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/tw-elements/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          0: '#FFFFFF', // Bianco
          100: '#E4D6F2', // 10%
          200: '#D1B3E4', // 20%
          300: '#B58ED6', // 30%
          400: '#9B6BBF', // 40%
          500: '#7766C6', // Colore di base
          600: '#5C39A2', // 60%
          700: '#4A2980', // 70%
          800: '#391B5B', // 80%
          900: '#28152E', // 90%
          1000: '#1A1A1A' // Grigio scuro
        },
        secondary: {
          0: '#FFFFFF', // Bianco
          100: '#F2E6FD', // 10%
          200: '#E6D9FB', // 20%
          300: '#D9C8F9', // 30%
          400: '#C9B5F7', // 40%
          500: '#E0DFFD', // Colore di base
          600: '#B5C6E4', // 60%
          700: '#A1B2D5', // 70%
          800: '#8E9BC7', // 80%
          900: '#7A85B8', // 90%
          1000: '#4A4A4A' // 100%
        },
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

// colors: {
//   primary: '#7766C6', // Colore principale per pulsanti e elementi attivi
//   'primary-hover': '#8A7CC3', // Colore hover leggermente più chiaro
//   'primary-active': '#46467A', // Colore per stato attivo
//   'primary-focus': '#6A6FAE', // Colore per stato di focus
//   secondary: '#FFC212', // Colore secondario per evidenziare elementi importanti
//   'secondary-hover': '#FFD54F', // Colore hover secondario leggermente più chiaro
//   'secondary-active': '#FFA000', // Colore per stato attivo secondario
//   'secondary-focus': '#FF9F00', // Colore per stato di focus secondario
//   background: '#E0DFFD', // Colore di sfondo principale dell'app
//   surface: '#E0DFFD', // Colore per superfici e contenuti
//   error: '#B00020', // Colore rosso per messaggi di errore
//   'on-primary': '#FFFFFF', // Testo bianco su sfondo primario
//   'on-secondary': '#000000', // Testo nero su sfondo secondario
//   'on-background': '#000000', // Testo nero su sfondo chiaro
//   'on-surface': '#000000', // Testo nero su superfici bianche
//   'on-error': '#FFFFFF' // Testo bianco su sfondo di errore
// }
