const fs = require('fs');
const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const stateAdditions = {
    en: {
        "Andhra Pradesh": "Andhra Pradesh",
        "Telangana": "Telangana",
        "Maharashtra": "Maharashtra",
        "Karnataka": "Karnataka",
        "Tamil Nadu": "Tamil Nadu",
        "Kerala": "Kerala",
        "Uttar Pradesh": "Uttar Pradesh",
        "Madhya Pradesh": "Madhya Pradesh",
        "Gujarat": "Gujarat",
        "Rajasthan": "Rajasthan",
        "Punjab": "Punjab",
        "Haryana": "Haryana",
        "West Bengal": "West Bengal",
        "Bihar": "Bihar",
        "Odisha": "Odisha"
    },
    hi: {
        "Andhra Pradesh": "आंध्र प्रदेश",
        "Telangana": "तेलंगाना",
        "Maharashtra": "महाराष्ट्र",
        "Karnataka": "कर्नाटक",
        "Tamil Nadu": "तमिलनाडु",
        "Kerala": "केरल",
        "Uttar Pradesh": "उत्तर प्रदेश",
        "Madhya Pradesh": "मध्य प्रदेश",
        "Gujarat": "गुजरात",
        "Rajasthan": "राजस्थान",
        "Punjab": "पंजाब",
        "Haryana": "हरियाणा",
        "West Bengal": "पश्चिम बंगाल",
        "Bihar": "बिहार",
        "Odisha": "ओडिशा"
    },
    te: {
        "Andhra Pradesh": "ఆంధ్రప్రదేశ్",
        "Telangana": "తెలంగాణ",
        "Maharashtra": "మహారాష్ట్ర",
        "Karnataka": "కర్ణాటక",
        "Tamil Nadu": "తమిళనాడు",
        "Kerala": "కేరళ",
        "Uttar Pradesh": "ఉత్తర ప్రదేశ్",
        "Madhya Pradesh": "మధ్య ప్రదేశ్",
        "Gujarat": "గుజరాత్",
        "Rajasthan": "రాజస్థాన్",
        "Punjab": "పంజాబ్",
        "Haryana": "హర్యానా",
        "West Bengal": "పశ్చిమ బెంగాల్",
        "Bihar": "బీహార్",
        "Odisha": "ఒడిశా"
    },
    kn: {
        "Andhra Pradesh": "ಆಂಧ್ರಪ್ರದೇಶ",
        "Telangana": "ತೆಲಂಗಾಣ",
        "Maharashtra": "ಮಹಾರಾಷ್ಟ್ರ",
        "Karnataka": "ಕರ್ನಾಟಕ",
        "Tamil Nadu": "ತಮಿಳುನಾಡು",
        "Kerala": "ಕೇರಳ",
        "Uttar Pradesh": "ಉತ್ತರ ಪ್ರದೇಶ",
        "Madhya Pradesh": "ಮಧ್ಯ ಪ್ರದೇಶ",
        "Gujarat": "ಗುಜರಾತ್",
        "Rajasthan": "ರಾಜಸ್ಥಾನ",
        "Punjab": "ಪಂಜಾಬ್",
        "Haryana": "ಹರಿಯಾಣ",
        "West Bengal": "ಪಶ್ಚಿಮ ಬಂಗಾಳ",
        "Bihar": "ಬಿಹಾರ",
        "Odisha": "ಒಡಿಶಾ"
    },
    ta: {
        "Andhra Pradesh": "ஆந்திரப் பிரதேசம்",
        "Telangana": "தெலுங்கானா",
        "Maharashtra": "மகாராஷ்டிரா",
        "Karnataka": "கர்நாடகா",
        "Tamil Nadu": "தமிழ்நாடு",
        "Kerala": "கேரளா",
        "Uttar Pradesh": "உத்தரப் பிரதேசம்",
        "Madhya Pradesh": "மத்தியப் பிரதேசம்",
        "Gujarat": "குஜராத்",
        "Rajasthan": "ராஜஸ்தான்",
        "Punjab": "பஞ்சாப்",
        "Haryana": "ஹரியானா",
        "West Bengal": "மேற்கு வங்கம்",
        "Bihar": "பீகார்",
        "Odisha": "ஒடிசா"
    },
    ml: {
        "Andhra Pradesh": "ആന്ധ്രാപ്രദേശ്",
        "Telangana": "തെലങ്കാന",
        "Maharashtra": "മഹാരാഷ്ട്ര",
        "Karnataka": "കർണാടക",
        "Tamil Nadu": "തമിഴ്‌നാട്",
        "Kerala": "കേരളം",
        "Uttar Pradesh": "ഉത്തർപ്രദേശ്",
        "Madhya Pradesh": "മധ്യപ്രദേശ്",
        "Gujarat": "ഗുജറാത്ത്",
        "Rajasthan": "രാജസ്ഥാൻ",
        "Punjab": "പഞ്ചാബ്",
        "Haryana": "ഹരിയാന",
        "West Bengal": "പശ്ചിമ ബംഗാൾ",
        "Bihar": "ബീഹാർ",
        "Odisha": "ഒഡീഷ"
    }
};

const langs = ['en', 'hi', 'te', 'kn', 'ta', 'ml'];

for (const lang of langs) {
    const startStr = `const ${lang} = {`;
    const startIndex = content.indexOf(startStr);

    if (startIndex !== -1) {
        let insertStr = '';
        for (const [key, val] of Object.entries(stateAdditions[lang])) {
            const safeKey = `"${key}":`;
            // Check if already in the block
            const block = content.substring(startIndex, startIndex + 4000);
            if (!block.includes(`    ${safeKey}`)) {
                insertStr += `\n    ${safeKey} "${val}",`;
            }
        }
        content = content.slice(0, startIndex + startStr.length) + insertStr + content.slice(startIndex + startStr.length);
    }
}

fs.writeFileSync(file, content);
console.log('States patched successfully!');
