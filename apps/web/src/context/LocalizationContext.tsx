'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'user-lang-preference';
const PREFERENCE_LOCK_KEY = 'user-lang-preference-locked';

export interface LocaleConfig {
  lang: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  currency: string;
}

export const REGIONAL_LOCALE_MAP: Record<string, LocaleConfig> = {
  IN: { lang: 'en', dir: 'ltr', locale: 'en-IN', currency: 'INR' }, // India
  FR: { lang: 'fr', dir: 'ltr', locale: 'fr-FR', currency: 'EUR' }, // France
  DE: { lang: 'de', dir: 'ltr', locale: 'de-DE', currency: 'EUR' }, // Germany
  ES: { lang: 'es', dir: 'ltr', locale: 'es-ES', currency: 'EUR' }, // Spain
  JP: { lang: 'ja', dir: 'ltr', locale: 'ja-JP', currency: 'JPY' }, // Japan
  BR: { lang: 'pt', dir: 'ltr', locale: 'pt-BR', currency: 'BRL' }, // Brazil
  SA: { lang: 'ar', dir: 'ltr', locale: 'ar-SA', currency: 'SAR' }, // Saudi Arabia (Force LTR layout)
  IL: { lang: 'he', dir: 'ltr', locale: 'he-IL', currency: 'ILS' }, // Israel (Force LTR layout)
};

export const SUPPORTED_LANGUAGES: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  fr: { label: 'Français', flag: '🇫🇷' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  es: { label: 'Español', flag: '🇪🇸' },
  ja: { label: '日本語', flag: '🇯🇵' },
  pt: { label: 'Português', flag: '🇧🇷' },
  ar: { label: 'العربية', flag: '🇸🇦' },
  he: { label: 'עברית', flag: '🇮🇱' },
  hi: { label: 'हिन्दी', flag: '🇮🇳' },
  or: { label: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
};

// Complete translation dictionaries
const TRANSLATION_BUNDLES: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome to DevKits',
    tagline: 'Fast, secure, offline-ready developer utilities.',
    changeLanguage: 'Change Language',
    home: 'Home',
    tools: 'Tools',
    theme: 'Theme',
    selectLanguage: 'Select Language',
    searchPlaceholder: 'Search tools, features...',
    clearFilters: 'Clear Filters',
    allTools: 'All Tools',
    converters: 'Converters & Parsers',
    formatters: 'Formatters & Viewers',
    generators: 'Generators',
    utilities: 'Calculators & Utilities',
    privacyNote: 'All processing is run client-side. Your inputs never leave your device.',
    suiteTitle: 'Developer Utility Suite',
    fastTitle: 'Blazing Fast',
    fastDesc: 'All operations run client-side in your browser with no network latency.',
    privacyTitle: 'Privacy First',
    privacyDesc: 'Your data never leaves your browser. No logging, no tracking, no ads.',
    offlineTitle: 'Offline Ready',
    offlineDesc: 'Works without internet. Fully installable as a PWA.',
    jsonTitle: 'JSON Viewer & Formatter',
    jsonDesc: 'Format, validate, query, and structure JSON trees.',
    jwtTitle: 'JWT Decoder & Encoder',
    jwtDesc: 'Decode token payloads, breakdown algos, and generate tokens.',
    epochTitle: 'Epoch & Unix Timestamp',
    epochDesc: 'Convert Unix epoch timestamps to human dates and calculate offsets.',
    yamlTitle: 'YAML ↔ JSON Converter',
    yamlDesc: 'Map complex YAML configurations to standard JSON structures.',
    uuidTitle: 'UUID/ULID Generator',
    uuidDesc: 'Generate batch cryptographic UUID, ULID, and NanoID keys.',
    cronTitle: 'Cron Expression Generator',
    cronDesc: 'Build and translate visual schedules into cron expressions.',
    calculatorTitle: 'Calculators',
    calculatorDesc: 'Calculate Loan EMI schedules, salary conversions, and age ranges.',
    currencyTitle: 'Currency Exchanger',
    currencyDesc: 'Convert currencies with live rates, sparkline charts, and custom rates.',
    unitTitle: 'Unit Converter',
    unitDesc: 'Convert measurements for length, weight, area, volume, and data.',
    colorTitle: 'Color Picker & Harmonizer',
    colorDesc: 'Pick colors, generate matching palette harmonies, and check WCAG contrast.',
    imageTitle: 'Image Compressor',
    imageDesc: 'Scale dimensions, compress files, and apply custom enhancement filters.',
    convertersTitle: 'Data Converters',
    convertersDesc: 'Parse CSV grids, XML configurations, Markdown pages, and export PDF.',
    encoderDecoderTitle: 'Encoder / Decoder',
    encoderDecoderDesc: 'Convert Base64, URL encoding, HTML entities, Hex, Binary, and Morse code.',
    recentActivity: 'Recent Activity',
    clearAll: 'Clear All',
    openTool: 'Open Tool',
    blog: 'Information Pulse',
    support: 'Support',
    privacyFeature1: 'Client-side processing',
    privacyFeature2: 'No data collection',
    privacyFeature3: 'No ads or tracking',
    privacyFeature4: 'Open Source',
    builtForDevs: 'Built for developers.',
    openSource: 'Open Source',
    allToolsPrivate: 'All Tools Private & Local',
    privacyEngineDesc: 'Data never leaves your device. DevKits uses Web Assembly and client-side scripts to guarantee privacy.',
    toolboxCount: 'Toolbox Count',
    storageState: 'Storage State',
    prodSandbox: 'Production Sandbox',
    utilitiesLabel: 'Utilities',
    ipIntelTitle: 'IP & Identity Intelligence',
    ipIntelDesc: 'Check current IP details, lookup geolocation and ISP records, and validate email/phone inputs.',
    speedTestTitle: 'Internet Speed Tester',
    speedTestDesc: 'Test your internet latency, jitter, download, and upload connection speeds with live animated speedometer dial.',
    fileConverterTitle: 'Client-Side File Converter',
    fileConverterDesc: 'Securely convert CSV, JSON, Markdown documents, and images locally in your browser.',
  },
  fr: {
    welcome: 'Bienvenue sur DevKits',
    tagline: 'Utilitaires de développement rapides, sécurisés et prêts pour le mode hors ligne.',
    changeLanguage: 'Changer de langue',
    home: 'Accueil',
    tools: 'Outils',
    theme: 'Thème',
    selectLanguage: 'Choisir la langue',
    searchPlaceholder: 'Rechercher des outils, fonctionnalités...',
    clearFilters: 'Effacer les filtres',
    allTools: 'Tous les outils',
    converters: 'Convertisseurs & Analyseurs',
    formatters: 'Formateurs & Visualiseurs',
    generators: 'Générateurs',
    utilities: 'Calculatrices & Utilitaires',
    privacyNote: 'Tous les traitements sont effectués côté client. Vos données ne quittent pas votre appareil.',
  },
  de: {
    welcome: 'Willkommen bei DevKits',
    tagline: 'Schnelle, sichere und offline-bereite Entwickler-Tools.',
    changeLanguage: 'Sprache ändern',
    home: 'Startseite',
    tools: 'Werkzeuge',
    theme: 'Design',
    selectLanguage: 'Sprache auswählen',
    searchPlaceholder: 'Werkzeuge, Funktionen suchen...',
    clearFilters: 'Filter löschen',
    allTools: 'Alle Werkzeuge',
    converters: 'Konverter & Parser',
    formatters: 'Formatierer & Betrachter',
    generators: 'Generatoren',
    utilities: 'Rechner & Dienstprogramme',
    privacyNote: 'Alle Berechnungen laufen clientseitig. Ihre Eingaben verlassen Ihr Gerät nicht.',
  },
  es: {
    welcome: 'Bienvenido a DevKits',
    tagline: 'Herramientas de desarrollo rápidas, seguras y sin conexión.',
    changeLanguage: 'Cambiar idioma',
    home: 'Inicio',
    tools: 'Herramientas',
    theme: 'Tema',
    selectLanguage: 'Seleccionar idioma',
    searchPlaceholder: 'Buscar herramientas, funciones...',
    clearFilters: 'Limpiar filtros',
    allTools: 'Todas las herramientas',
    converters: 'Convertidores y Analizadores',
    formatters: 'Formateadores y Visores',
    generators: 'Generadores',
    utilities: 'Calculadoras y Utilidades',
    privacyNote: 'Todo el procesamiento se realiza en el cliente. Sus datos no salen del navegador.',
  },
  ja: {
    welcome: 'DevKits へようこそ',
    tagline: '高速で安全、オフライン対応の開発者向けユーティリティスイート。',
    changeLanguage: '言語を変更',
    home: 'ホーム',
    tools: 'ツール',
    theme: 'テーマ',
    selectLanguage: '言語を選択',
    searchPlaceholder: 'ツール、機能を検索...',
    clearFilters: 'フィルターをクリア',
    allTools: 'すべてのツール',
    converters: 'コンバーターとパーサー',
    formatters: 'フォーマッタとビューア',
    generators: 'ジェネレータ',
    utilities: '電卓とユーティリティ',
    privacyNote: 'すべての処理はクライアント側で実行されます。入力データがデバイスから送信されることはありません。',
  },
  pt: {
    welcome: 'Bem-vindo ao DevKits',
    tagline: 'Utilitários de desenvolvedor rápidos, seguros e prontos para uso offline.',
    changeLanguage: 'Alterar idioma',
    home: 'Início',
    tools: 'Ferramentas',
    theme: 'Tema',
    selectLanguage: 'Selecionar idioma',
    searchPlaceholder: 'Buscar ferramentas, recursos...',
    clearFilters: 'Limpar filtros',
    allTools: 'Todas as ferramentas',
    converters: 'Conversores e Analisadores',
    formatters: 'Formatadores e Visualizadores',
    generators: 'Geradores',
    utilities: 'Calculadoras e Utilitários',
    privacyNote: 'Todo o processamento é feito localmente no cliente. Seus dados nunca saem do seu navegador.',
  },
  ar: {
    welcome: 'مرحباً بك في DevKits',
    tagline: 'أدوات تطوير سريعة، آمنة، وتعمل بدون اتصال بالإنترنت.',
    changeLanguage: 'تغيير اللغة',
    home: 'الرئيسية',
    tools: 'الأدوات',
    theme: 'المظهر',
    selectLanguage: 'اختر اللغة',
    searchPlaceholder: 'ابحث عن الأدوات، الميزات...',
    clearFilters: 'مسح التصفية',
    allTools: 'جميع الأدوات',
    converters: 'المحولات والمحللات',
    formatters: 'المنسقات والمستعرضات',
    generators: 'المولدات',
    utilities: 'الحاسبات والأدوات المساعدة',
    privacyNote: 'تتم جميع العمليات محلياً على جهازك. لا يتم إرسال بياناتك نهائياً إلى أي خادم خارجي.',
  },
  he: {
    welcome: 'ברוכים הבאים ל-DevKits',
    tagline: 'כלי פיתוח מהירים, מאובטחים וזמינים ללא חיבור לאינטרנט.',
    changeLanguage: 'שנה שפה',
    home: 'בית',
    tools: 'כלים',
    theme: 'עיצוב',
    selectLanguage: 'בחר שפה',
    searchPlaceholder: 'חיפוש כלים, תכונות...',
    clearFilters: 'נקה מסננים',
    allTools: 'כל הכלים',
    converters: 'ממירים ומנתחים',
    formatters: 'מעצבים וצופים',
    generators: 'מחוללים',
    utilities: 'מחשבונים ועזרים',
    privacyNote: 'כל העיבודים מתבצעים בדפדפן הלקוח. הנתונים שלך לעולם אינם עוזבים את המכשיר שלך.',
  },
  hi: {
    welcome: 'DevKits में आपका स्वागत है',
    tagline: 'तेज़, सुरक्षित, ऑफ़लाइन-तैयार डेवलपर उपयोगिताएँ।',
    changeLanguage: 'भाषा बदलें',
    home: 'होम',
    tools: 'उपकरण',
    theme: 'थीम',
    selectLanguage: 'भाषा चुनें',
    searchPlaceholder: 'उपकरण, सुविधाएँ खोजें...',
    clearFilters: 'फ़िल्टर साफ़ करें',
    allTools: 'सभी उपकरण',
    converters: 'कनवर्टर और पार्सर',
    formatters: 'फ़ॉर्मेटर और व्यूअर',
    generators: 'जेनरेटर',
    utilities: 'कैलकुलेटर और उपयोगिताएँ',
    privacyNote: 'सभी प्रोसेसिंग क्लाइंट-साइड चलती है। आपके इनपुट कभी भी आपके डिवाइस से बाहर नहीं जाते हैं।',
    suiteTitle: 'डेवलपर उपयोगिता सूट',
    fastTitle: 'बेहद तेज़',
    fastDesc: 'सभी प्रक्रियाएं आपके ब्राउज़र में बिना किसी देरी के चलती हैं।',
    privacyTitle: 'गोपनीयता पहले',
    privacyDesc: 'आपका डेटा कभी भी आपके डिवाइस से बाहर नहीं जाता है। कोई ट्रैकिंग नहीं।',
    offlineTitle: 'ऑफ़लाइन सक्षम',
    offlineDesc: 'बिना इंटरनेट के काम करता है। पूरी तरह से PWA के रूप में इंस्टॉल करने योग्य।',
    jsonTitle: 'JSON व्यूअर और फ़ॉर्मेटर',
    jsonDesc: 'JSON ट्री को फ़ॉर्मेट, सत्यापित, क्वेरी और व्यवस्थित करें।',
    jwtTitle: 'JWT डिकोडर और एनकोडर',
    jwtDesc: 'टोकन पेलोड डिकोड करें, एल्गोरिदम विश्लेषण करें, और टोकन बनाएं।',
    epochTitle: 'Epoch और यूनिक्स टाइमस्टैम्प',
    epochDesc: 'यूनिक्स एपॉक टाइमस्टैम्प को सामान्य तारीखों में बदलें और गणना करें।',
    yamlTitle: 'YAML ↔ JSON कनवर्टर',
    yamlDesc: 'जटिल YAML कॉन्फ़िगरेशन को मानक JSON संरचनाओं में बदलें।',
    uuidTitle: 'UUID/ULID जेनरेटर',
    uuidDesc: 'बैच क्रिप्टोग्राफ़िक UUID, ULID, और NanoID कुंजियाँ बनाएँ।',
    cronTitle: 'क्रॉन एक्सप्रेशन जेनरेटर',
    cronDesc: 'विज़ुअल शेड्यूल बनाएं और उन्हें क्रॉन एक्सप्रेशन में अनुवादित करें।',
    calculatorTitle: 'कैलकुलेटर',
    calculatorDesc: 'लोन ईएमआई शेड्यूल, वेतन रूपांतरण, और आयु सीमाओं की गणना करें।',
    currencyTitle: 'मुद्रा विनिमय',
    currencyDesc: 'लाइव दरों, स्पार्कलाइन चार्ट और कस्टम दरों के साथ मुद्राएं बदलें।',
    unitTitle: 'यूनिट कनवर्टर',
    unitDesc: 'लंबाई, वजन, क्षेत्र, आयतन और डेटा के मापों को परिवर्तित करें।',
    colorTitle: 'कलर पिकर और हार्मोनाइज़र',
    colorDesc: 'रंग चुनें, मिलान पैलेट बनाएं, और WCAG कंट्रास्ट जांचें।',
    imageTitle: 'इमेज कंप्रेसर',
    imageDesc: 'फ़ाइलों को कंप्रेस करें, आकार बदलें, और कस्टम फ़िल्टर लागू करें।',
    convertersTitle: 'डेटा और पीडीएफ कनवर्टर',
    convertersDesc: 'CSV ग्रिड, XML कॉन्फ़िगरेशन, मार्कडाउन पेजों को पार्स करें और PDF निर्यात करें।',
    recentActivity: 'हालिया गतिविधि',
    clearAll: 'सभी साफ़ करें',
    openTool: 'उपकरण खोलें',
    blog: 'देवपल्स',
    support: 'सपोर्ट',
    privacyFeature1: 'क्लाइंट-साइड प्रोसेसिंग',
    privacyFeature2: 'कोई डेटा संग्रह नहीं',
    privacyFeature3: 'कोई विज्ञापन या ट्रैकिंग नहीं',
    privacyFeature4: 'ओपन सोर्स',
    builtForDevs: 'डेवलपर्स के लिए निर्मित।',
    openSource: 'ओपन सोर्स',
    allToolsPrivate: 'सभी उपकरण निजी और स्थानीय',
    privacyEngineDesc: 'डेटा कभी भी आपके डिवाइस से बाहर नहीं जाता है। देवकिट्स गोपनीयता की गारंटी के लिए वेब असेंबली और क्लाइंट-साइड स्क्रिप्ट का उपयोग करता है।',
    toolboxCount: 'टूलबॉक्स संख्या',
    storageState: 'स्टोरेज स्थिति',
    prodSandbox: 'उत्पादन सैंडबॉक्स',
    utilitiesLabel: 'उपयोगिताएँ',
    ipIntelTitle: 'आईपी और पहचान इंटेलिजेंस',
    ipIntelDesc: 'वर्तमान आईपी विवरण जांचें, जियोलोकेशन और आईएसपी रिकॉर्ड खोजें, और ईमेल/फोन इनपुट सत्यापित करें।',
    speedTestTitle: 'इंटरनेट स्पीड टेस्टर',
    speedTestDesc: 'एनिमेटेड स्पीडोमीटर डायल के साथ अपने इंटरनेट लेटेंसी, जिटर, डाउनलोड और अपलोड स्पीड का परीक्षण करें।',
    fileConverterTitle: 'क्लाइंट-साइड फ़ाइल कनवर्टर',
    fileConverterDesc: 'अपने ब्राउज़र में सुरक्षित रूप से CSV, JSON, मार्कडाउन दस्तावेज़ और छवियों को स्थानीय रूप से परिवर्तित करें।',
  },
  or: {
    welcome: 'DevKits କୁ ସ୍ୱାଗତ',
    tagline: 'ଦ୍ରୁତ, ସୁରକ୍ଷିତ, ଅଫଲାଇନ-ପ୍ରସ୍ତୁତ ଡେଭଲପର୍ ଉପଯୋଗିତା।',
    changeLanguage: 'ଭାଷା ପରିବର୍ତ୍ତନ କରନ୍ତୁ',
    home: 'ହୋମ୍',
    tools: 'ଉପକରଣ',
    theme: 'ଥିମ୍',
    selectLanguage: 'ଭାଷା ଚୟନ କରନ୍ତୁ',
    searchPlaceholder: 'ଉପକରଣ, ବୈଶିଷ୍ଟ୍ୟ ଖୋଜନ୍ତୁ...',
    clearFilters: 'ଫିଲ୍ଟର୍ ସଫା କରନ୍ତୁ',
    allTools: 'ସମସ୍ତ ଉପକରଣ',
    converters: 'କନଭର୍ଟର ଏବଂ ପାର୍ସର',
    formatters: 'ଫର୍ମାଟର ଏବଂ ଭ୍ୟୁଅର୍',
    generators: 'ଜେନେରେଟର',
    utilities: 'କାଲକୁଲେଟର ଏବଂ ଉପଯୋଗିତା',
    privacyNote: 'ସମସ୍ତ ପ୍ରକ୍ରିୟାକରଣ କ୍ଲାଏଣ୍ଟ-ସାଇଡ୍ ରେ ଚାଲେ। ଆପଣଙ୍କର ଇନପୁଟ୍ କଦାପି ଆପଣଙ୍କର ଡିଭାଇସ୍ ବାହାରକୁ ଯାଏ ନାହିଁ।',
    suiteTitle: 'ଡେଭଲପର୍ ଉପଯୋଗିତା ସୁଇଟ୍',
    fastTitle: 'ଅତି ଶୀଘ୍ର',
    fastDesc: 'ସମସ୍ତ ପ୍ରକ୍ରିୟା ଆପଣଙ୍କ ବ୍ରାଉଜର୍ ରେ ବିନା କୌଣସି ବିଳମ୍ବରେ ଚାଲେ।',
    privacyTitle: 'ଗୋପନୀୟତା ପ୍ରଥମେ',
    privacyDesc: 'ଆପଣଙ୍କର ତଥ୍ୟ କଦାପି ଆପଣଙ୍କ ଡିଭାଇସ୍ ବାହାରକୁ ଯାଏ ନାହିଁ। କୌଣସି ଟ୍ରାକିଂ ନାହିଁ।',
    offlineTitle: 'ଅଫଲାଇନ୍ ସକ୍ଷମ',
    offlineDesc: 'ବିନା ଇଣ୍ଟରନେଟ୍ ରେ ମଧ୍ୟ କାମ କରେ। PWA ଭାବରେ ସଂସ୍ଥାପନ ଯୋଗ୍ୟ।',
    jsonTitle: 'JSON ଭ୍ୟୁଅର୍ ଏବଂ ଫର୍ମାଟର',
    jsonDesc: 'JSON ଟ୍ରି କୁ ଫର୍ମାଟ୍, ଯାଞ୍ଚ, କ୍ୱେରୀ ଏବଂ ବ୍ୟବସ୍ଥିତ କରନ୍ତୁ।',
    jwtTitle: 'JWT ଡିକୋଡର୍ ଏବଂ ଏନକୋଡର୍',
    jwtDesc: 'ଟୋକନ୍ ପେଲୋଡ୍ ଡିକୋଡ୍ କରନ୍ତୁ, ଆଲଗୋରିଦମ ବିଶ୍ଳେଷଣ କରନ୍ତୁ, ଏବଂ ଟୋକନ୍ ତିଆରି କରନ୍ତୁ।',
    epochTitle: 'Epoch ଏବଂ ୟୁନିକ୍ସ ଟାଇମଷ୍ଟାମ୍ପ',
    epochDesc: 'ୟୁନିକ୍ସ ଏପକ୍ ଟାଇମଷ୍ଟାମ୍ପକୁ ମାନବ ତାରିଖରେ ପରିଣତ କରନ୍ତୁ ଏବଂ ଗଣନା କରନ୍ତୁ।',
    yamlTitle: 'YAML ↔ JSON କନଭର୍ଟର',
    yamlDesc: 'ଜଟିଳ YAML କନଫିଗରେସନ୍ କୁ ମାନକ JSON ସଂରଚନାରେ ପରିଣତ କରନ୍ତୁ।',
    uuidTitle: 'UUID/ULID ଜେନେରେଟର',
    uuidDesc: 'କ୍ରିପ୍ଟୋଗ୍ରାଫିକ୍ UUID, ULID, ଏବଂ NanoID କି ପ୍ରସ୍ତୁତ କରନ୍ତୁ।',
    cronTitle: 'କ୍ରୋନ୍ ଏକ୍ସପ୍ରେସନ୍ ଜେନେରେଟର',
    cronDesc: 'ଭିଜୁଆଲ୍ ସିଡ୍ୟୁଲ୍ ପ୍ରସ୍ତୁତ କରନ୍ତୁ ଏବଂ କ୍ରୋନ୍ ଏକ୍ସପ୍ରେସନ୍ ରେ ଅନୁବାଦ କରନ୍ତୁ।',
    calculatorTitle: 'କାଲକୁଲେଟର',
    calculatorDesc: 'ଋଣ EMI ସିଡ୍ୟୁଲ୍, ଦରମା ରୂପାନ୍ତର, ଏବଂ ବୟସ ସୀମା ଗଣନା କରନ୍ତୁ।',
    currencyTitle: 'ମୁଦ୍ରା ବିନିମୟକାରୀ',
    currencyDesc: 'ଲାଇଭ୍ ହାର, ସ୍ପାର୍କଲାଇନ୍ ଚାର୍ଟ ଏବଂ କଷ୍ଟମ୍ ହାର ସହିତ ମୁଦ୍ରା ପରିବର୍ତ୍ତନ କରନ୍ତୁ।',
    unitTitle: 'ୟୁନିଟ୍ କନଭର୍ଟର',
    unitDesc: 'ଲମ୍ବ, ଓଜନ, କ୍ଷେତ୍ରଫଳ, ଆୟତନ ଏବଂ ଡାଟା ର ମାପକୁ ପରିବର୍ତ୍ତନ କରନ୍ତୁ।',
    colorTitle: 'କଲର୍ ପିକର୍ ଏବଂ ହାର୍ମୋନାଇଜର୍',
    colorDesc: 'ରଙ୍ଗ ବାଛନ୍ତୁ, ମେଳ ଖାଉଥିବା ପ୍ୟାଲେଟ୍ ପ୍ରସ୍ତୁତ କରନ୍ତୁ, ଏବଂ କଣ୍ଟ୍ରାଷ୍ଟ ଯାଞ୍ଚ କରନ୍ତୁ।',
    imageTitle: 'ଇମେଜ୍ କମ୍ପ୍ରେସର୍',
    imageDesc: 'ଫାଇଲ୍ ଗୁଡ଼ିକୁ ସଙ୍କୁଚିତ କରନ୍ତୁ, ଆକାର ବଦଳାନ୍ତୁ, ଏବଂ କଷ୍ଟମ୍ ଫିଲ୍ଟର୍ ପ୍ରୟୋଗ କରନ୍ତୁ।',
    convertersTitle: 'ଡାଟା ଏବଂ ପିଡିଏଫ୍ କନଭର୍ଟର',
    convertersDesc: 'CSV ଗ୍ରିଡ୍, XML କନଫିଗରେସନ୍, ମାର୍କଡାଉନ୍ ପେଜ୍ ପାର୍ସ କରନ୍ତୁ ଏବଂ PDF ରପ୍ତାନି କରନ୍ତୁ।',
    recentActivity: 'ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ',
    clearAll: 'ସମସ୍ତ ସଫା କରନ୍ତୁ',
    openTool: 'ଉପକରଣ ଖୋଲନ୍ତୁ',
    blog: 'ଦେଭ୍‌ପଲ୍ସ',
    support: 'ସପୋର୍ଟ',
    privacyFeature1: 'କ୍ଲାଏଣ୍ଟ-ସାଇଡ୍ ପ୍ରକ୍ରିୟାକରଣ',
    privacyFeature2: 'କୌଣସି ତଥ୍ୟ ସଂଗ୍ରହ ନାହିଁ',
    privacyFeature3: 'କୌଣସି ବିଜ୍ଞାପନ କିମ୍ବା ଟ୍ରାକିଂ ନାହିଁ',
    privacyFeature4: 'ଓପନ୍ ସୋର୍ସ',
    builtForDevs: 'ଡେଭଲପର୍ସ ମାନଙ୍କ ପାଇଁ ନିର୍ମିତ।',
    openSource: 'ଓପନ୍ ସୋର୍ସ',
    allToolsPrivate: 'ସମସ୍ତ ଉପକରଣ ବ୍ୟକ୍ତିଗତ ଏବଂ ସ୍ଥାନୀୟ',
    privacyEngineDesc: 'ତଥ୍ୟ କଦାପି ଆପଣଙ୍କ ଡିଭାଇସ୍ ବାହାରକୁ ଯାଏ ନାହିଁ। ଗୋପନୀୟତା ରକ୍ଷା ପାଇଁ ଦେଭ୍‌କିଟ୍ସ ୱେବ୍ ଆସେମ୍ବଲି ଏବଂ କ୍ଲାଏଣ୍ଟ-ସାଇଡ୍ ସ୍କ୍ରିପ୍ଟ ବ୍ୟବହାର କରେ।',
    toolboxCount: 'ଟୁଲ୍‌ବକ୍ସ ସଂଖ୍ୟା',
    storageState: 'ଷ୍ଟୋରେଜ୍ ସ୍ଥିତି',
    prodSandbox: 'ପ୍ରଡକ୍ସନ୍ ସ୍ୟାଣ୍ଡବକ୍ସ',
    utilitiesLabel: 'ଉପଯୋଗିତା',
    ipIntelTitle: 'ଆଇପି ଏବଂ ପରିଚୟ ଇଣ୍ଟେଲିଜେନ୍ସ',
    ipIntelDesc: 'ଆପଣଙ୍କର ଆଇପି ବିବରଣୀ ଯାଞ୍ଚ କରନ୍ତୁ, ଜିଓଲୋକେସନ୍ ଏବଂ ଆଇଏସପି ରେକର୍ଡ ଖୋଜନ୍ତୁ, ଏବଂ ଇମେଲ୍/ଫୋନ୍ ଯାଞ୍ଚ କରନ୍ତୁ।',
    speedTestTitle: 'ଇଣ୍ଟରନେଟ୍ ସ୍ପିଡ୍ ଟେଷ୍ଟର୍',
    speedTestDesc: 'ଏନିମେଟେଡ୍ ସ୍ପିଡୋମିଟର୍ ଡାଏଲ୍ ସହିତ ଆପଣଙ୍କର ଇଣ୍ଟରନେଟ୍ ଲେଟେନ୍ସି, ଜିଟର୍, ଡାଉନଲୋଡ୍ ଏବଂ ଅପଲୋଡ୍ ର ପରୀକ୍ଷା କରନ୍ତୁ।',
    fileConverterTitle: 'କ୍ଲାଏଣ୍ଟ-ସାଇଡ୍ ଫାଇଲ୍ କନଭର୍ଟର',
    fileConverterDesc: 'ଆପଣଙ୍କ ବ୍ରାଉଜର୍‌ରେ ସୁରକ୍ଷିତ ଭାବରେ CSV, JSON, ମାର୍କଡାଉନ୍ ଏବଂ ଇମେଜ୍ ଗୁଡ଼ିକୁ ସ୍ଥାନୀୟ ଭାବରେ ରୂପାନ୍ତର କରନ୍ତୁ।',
  },
};

interface LocalizationContextType {
  language: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  currency: string;
  loading: boolean;
  t: (key: string) => string;
  setLanguageManual: (lang: string) => void;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<string>('en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [locale, setLocale] = useState<string>('en-US');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(true);

  // Sync visual attributes
  useEffect(() => {
    if (!loading) {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, loading]);

  const applyLocaleSettings = (lang: string) => {
    setLanguage(lang);
    setDir('ltr');

    switch (lang) {
      case 'fr': setLocale('fr-FR'); setCurrency('EUR'); break;
      case 'de': setLocale('de-DE'); setCurrency('EUR'); break;
      case 'es': setLocale('es-ES'); setCurrency('EUR'); break;
      case 'ja': setLocale('ja-JP'); setCurrency('JPY'); break;
      case 'pt': setLocale('pt-BR'); setCurrency('BRL'); break;
      case 'ar': setLocale('ar-SA'); setCurrency('SAR'); break;
      case 'he': setLocale('he-IL'); setCurrency('ILS'); break;
      default: setLocale('en-US'); setCurrency('USD');
    }
  };

  const detectLanguage = async () => {
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY);
      const preferenceLocked = localStorage.getItem(PREFERENCE_LOCK_KEY);

      if (savedLanguage && preferenceLocked === 'true') {
        applyLocaleSettings(savedLanguage);
        setLoading(false);
        return;
      }

      // Check Geolocation permission state
      if ('geolocation' in navigator && 'permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'granted') {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Fetch country address details (keyless geocoding API)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`);
            if (res.ok) {
              const data = await res.json();
              const countryCode = data.address?.country_code?.toUpperCase();

              if (countryCode && REGIONAL_LOCALE_MAP[countryCode]) {
                const config = REGIONAL_LOCALE_MAP[countryCode];
                applyLocaleSettings(config.lang);
                localStorage.setItem(STORAGE_KEY, config.lang);
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Geolocation mapping error:', e);
        }
      }

      // Browser default languages fallback
      const browserLangs = navigator.languages || [navigator.language];
      for (const bLang of browserLangs) {
        const primaryCode = bLang.split('-')[0].toLowerCase();
        if (TRANSLATION_BUNDLES[primaryCode]) {
          applyLocaleSettings(primaryCode);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Persistence check fail:', err);
    }

    applyLocaleSettings('en');
    setLoading(false);
  };

  useEffect(() => {
    detectLanguage();
  }, []);

  const setLanguageManual = (lang: string) => {
    if (!TRANSLATION_BUNDLES[lang]) return;
    applyLocaleSettings(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(PREFERENCE_LOCK_KEY, 'true');
  };

  const t = (key: string): string => {
    const activeBundle = TRANSLATION_BUNDLES[language] || TRANSLATION_BUNDLES.en;
    const defaultBundle = TRANSLATION_BUNDLES.en;
    return activeBundle[key] || defaultBundle[key] || key;
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  return (
    <LocalizationContext.Provider
      value={{
        language,
        dir,
        locale,
        currency,
        loading,
        t,
        setLanguageManual,
        formatDate,
        formatCurrency,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocale must be nested inside a LocalizationProvider');
  }
  return context;
}
