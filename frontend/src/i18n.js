import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';
import { getPreferredLanguage, setPreferredLanguage } from './utils/languagePreference';

const resources = {
    en: { translation: enTranslation },
    fr: { translation: frTranslation }
};

const savedLng = getPreferredLanguage();

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLng || 'fr',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // not needed for react
        }
    })
    .then(() => {
        setPreferredLanguage(i18n.language);
    });

i18n.on('languageChanged', (lng) => {
    setPreferredLanguage(lng);
});

export default i18n;
