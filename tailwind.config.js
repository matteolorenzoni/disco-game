/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/tw-elements/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: '#7766C6' /* Colore principale usato per pulsanti, link e accenti principali */,
        'primary-light': '#A598E0' /* Colore chiaro usato per hover o stati disabilitati */,
        'primary-dark': '#4A387D' /* Colore scuro usato per hover o stati attivi */,
        secondary: '#A5D6A7' /* Uato per pulsanti secondari, accenti minori e elementi alternativi */,
        'secondary-light': '#C8E6C9 ' /* Colore chiaro usato per hover o stati disabilitati */,
        'secondary-dark': '#81C784 ' /* Colore scuro usato per hover o stati attivi */,
        background: '#E0DFFD' /* Colore di sfondo generale dell'applicazione */,
        surface: '#FFFFFF' /* Colore di sfondo per superfici come card, modali o sezioni separate */,
        error: '#B00020' /* Colore usato per indicare errori su pulsanti, testi o messaggi di errore */,
        'on-primary': '#FFFFFF' /* Colore del testo o delle icone sopra elementi con sfondo 'primary' */,
        'on-secondary': '#000000' /* Colore del testo o delle icone sopra elementi con sfondo 'secondary' */,
        'on-background': '#000000' /* Colore del testo o delle icone sopra lo sfondo 'background' */,
        'on-surface': '#000000' /* Colore del testo o delle icone sopra superfici 'surface' */,
        'on-error': '#FFFFFF' /* Colore del testo o delle icone sopra elementi con sfondo 'error' */
      }
    }
  },
  darkMode: 'class',
  plugins: [require('tw-elements/plugin.cjs')]
};
