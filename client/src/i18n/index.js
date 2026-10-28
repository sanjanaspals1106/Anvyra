import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';

const KEY = 'anvyra.lang';
let saved = 'en';
try { saved = localStorage.getItem(KEY) || 'en'; } catch { /* storage blocked */ }

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, te: { translation: te } },
  lng: ['en', 'hi', 'te'].includes(saved) ? saved : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Remember the choice and set the page language (helps screen readers and fonts).
i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem(KEY, lng); } catch { /* storage blocked */ }
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
