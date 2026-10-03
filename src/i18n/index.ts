import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';

type TranslationResource = typeof translationEN;

const namespaces = [
  'common',
  'popup',
  'customDelay',
  'recurringDelay',
  'settings',
  'manageTabs',
  'donation',
  'onboarding',
  'options',
] as const;

function buildResources(translation: TranslationResource) {
  return {
    translation,
    common: translation.common,
    popup: translation.popup,
    customDelay: translation.customDelay,
    recurringDelay: translation.recurringDelay,
    settings: translation.settings,
    manageTabs: translation.manageTabs,
    donation: translation.donation,
    onboarding: translation.onboarding,
    options: translation.options,
  };
}

const resources = { en: buildResources(translationEN) };

async function initI18n(): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation', ...namespaces],
    fallbackNS: ['translation', 'common'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
  });

  document.documentElement.lang = 'en';
}

void initI18n();

export default i18n;
