const fs = require('fs');
let code = fs.readFileSync('c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx', 'utf8');

const tFunction = `
    const lowerKeysCache = { en: {}, hi: {}, te: {}, kn: {}, ta: {}, ml: {} };
    for (const [l, dictionary] of Object.entries(translations)) {
        for (const [key, value] of Object.entries(dictionary)) {
            if (key && typeof key === 'string') {
                lowerKeysCache[l][key.toLowerCase().trim()] = value;
            }
        }
    }

    const t = (key, lang) => {
        if (!key || typeof key !== 'string') return key;
        if (translations[lang] && translations[lang][key]) return translations[lang][key];
        if (translations['en'] && translations['en'][key]) return translations['en'][key];
        const lowerKey = key.toLowerCase().trim();
        if (lowerKeysCache[lang] && lowerKeysCache[lang][lowerKey]) return lowerKeysCache[lang][lowerKey];
        if (lowerKeysCache['en'] && lowerKeysCache['en'][lowerKey]) return lowerKeysCache['en'][lowerKey];
        return key;
    };
`;

code = code.replace(/import .*/g, '').replace(/export .*/g, '').replace(/const LanguageContext.*/g, '') + '\n' + tFunction + '\n console.log("Ta Tamil Nadu:", t("Tamil Nadu", "ta")); console.log("Te Andhra Pradesh:", t("Andhra Pradesh", "te"));\n console.log("Missing state:", t("Odisha", "ta"));';
fs.writeFileSync('c:/Users/reddy/OneDrive/Desktop/crop/test_translations.js', code);
