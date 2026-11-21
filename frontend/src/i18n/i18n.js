/**
 * AGRI SMART — i18n Setup
 * File: frontend/src/i18n/i18n.js
 *
 * Initialises react-i18next with support for:
 *   en  — English
 *   kn  — Kannada
 *   hi  — Hindi
 *   te  — Telugu
 *   ta  — Tamil
 *
 * Translations live in /src/translations/<lang>.json
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../translations/en.json'
import kn from '../translations/kn.json'
import hi from '../translations/hi.json'
import te from '../translations/te.json'
import ta from '../translations/ta.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
    },
    lng: localStorage.getItem('agrismart_lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'agrismart_lang',
    },
  })

export default i18n
