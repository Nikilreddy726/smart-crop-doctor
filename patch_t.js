const fs = require('fs');
const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const tFunction = `    // Cache lowercase versions for case-insensitive matching
    const lowerKeysCache = React.useMemo(() => {
        const cache = {};
        for (const [l, dictionary] of Object.entries(translations)) {
            cache[l] = {};
            for (const [key, value] of Object.entries(dictionary)) {
                if (key && typeof key === 'string') {
                    cache[l][key.toLowerCase().trim()] = value;
                }
            }
        }
        return cache;
    }, [translations]);

    const t = (key) => {
        if (!key || typeof key !== 'string') return key;

        // Try exact match first
        if (translations[lang] && translations[lang][key]) return translations[lang][key];
        if (translations['en'] && translations['en'][key]) return translations['en'][key];

        // Try lowercase fallback
        const lowerKey = key.toLowerCase().trim();
        if (lowerKeysCache[lang] && lowerKeysCache[lang][lowerKey]) return lowerKeysCache[lang][lowerKey];
        if (lowerKeysCache['en'] && lowerKeysCache['en'][lowerKey]) return lowerKeysCache['en'][lowerKey];

        return key;
    };`;

let replaced = false;

// We match the old function and replace it
content = content.replace(/const t = \(key\) => \{\s*return translations\[lang\]\[key\] \|\| translations\['en'\]\[key\] \|\| key;\s*\};/m, () => {
    replaced = true;
    return tFunction;
});

if (replaced) {
    fs.writeFileSync(file, content);
    console.log('Successfully updated t() for case-insensitive fallback!');
} else {
    console.log('Could not find exact function block to replace.');
}
