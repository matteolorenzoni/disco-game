/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/tw-elements/js/**/*.js'],
  theme: {
    extend: {
      fontSize: {
        xxs: ['0.625rem', { lineHeight: '0.75rem' }]
      },
      colors: {
        primary: '#7B4B92' /* Colore principale usato per pulsanti, link e accenti principali */,
        'primary-light': '#9B6AB1' /* Colore chiaro usato per hover o stati disabilitati */,
        'primary-dark': '#5B3A7F' /* Colore scuro usato per hover o stati attivi */,
        secondary: '#4A758D' /* Uato per pulsanti secondari, accenti minori e elementi alternativi */,
        'secondary-light': '#A2C7D4 ' /* Colore chiaro usato per hover o stati disabilitati */,
        'secondary-dark': '#2F4858 ' /* Colore scuro usato per hover o stati attivi */,
        background: '#0D1B2A' /* Colore di sfondo generale dell'applicazione */,
        surface: '#1F2A44' /* Colore di sfondo per superfici come card, modali o sezioni separate */,
        error: '#D95B6D' /* Colore usato per indicare errori su pulsanti, testi o messaggi di errore */,
        'on-primary': '#FFFFFF' /* Colore del testo o delle icone sopra elementi con sfondo 'primary' */,
        'on-secondary': '#FFFFFF' /* Colore del testo o delle icone sopra elementi con sfondo 'secondary' */,
        'on-background': '#E4E4EB' /* Colore del testo o delle icone sopra lo sfondo 'background' */,
        'on-surface': '#E4E4EB' /* Colore del testo o delle icone sopra superfici 'surface' */,
        'on-error': '#FFFFFF' /* Colore del testo o delle icone sopra elementi con sfondo 'error' */
      }
    }
  },
  darkMode: 'class',
  plugins: [require('tw-elements/plugin.cjs')]
};

// background: #121212, #1C1C1E, #0D1B2A
