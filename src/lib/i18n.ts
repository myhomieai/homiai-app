import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from '@/locales/en/items.json';
import translationHE from '@/locales/he/items.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      he: { translation: translationHE }
    },
    lng: 'he',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;