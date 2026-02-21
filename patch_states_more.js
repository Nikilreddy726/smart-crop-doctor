const fs = require('fs');
const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const additionalStates = {
    en: {
        "Arunachal Pradesh": "Arunachal Pradesh",
        "Assam": "Assam",
        "Chhattisgarh": "Chhattisgarh",
        "Goa": "Goa",
        "Himachal Pradesh": "Himachal Pradesh",
        "Jharkhand": "Jharkhand",
        "Manipur": "Manipur",
        "Meghalaya": "Meghalaya",
        "Mizoram": "Mizoram",
        "Nagaland": "Nagaland",
        "Sikkim": "Sikkim",
        "Tripura": "Tripura",
        "Uttarakhand": "Uttarakhand",
        "Jammu and Kashmir": "Jammu and Kashmir",
        "Ladakh": "Ladakh"
    },
    hi: {
        "Arunachal Pradesh": "अरुणाचल प्रदेश",
        "Assam": "असम",
        "Chhattisgarh": "छत्तीसगढ़",
        "Goa": "गोवा",
        "Himachal Pradesh": "हिमाचल प्रदेश",
        "Jharkhand": "झारखंड",
        "Manipur": "मणिपुर",
        "Meghalaya": "मेघालय",
        "Mizoram": "मिज़ोरम",
        "Nagaland": "नागालैंड",
        "Sikkim": "सिक्किम",
        "Tripura": "त्रिपुरा",
        "Uttarakhand": "उत्तराखंड",
        "Jammu and Kashmir": "जम्मू और कश्मीर",
        "Ladakh": "लद्दाख"
    },
    te: {
        "Arunachal Pradesh": "అరుణాచల్ ప్రదేశ్",
        "Assam": "అస్సాం",
        "Chhattisgarh": "ఛత్తీస్‌గఢ్",
        "Goa": "గోవా",
        "Himachal Pradesh": "హిమాచల్ ప్రదేశ్",
        "Jharkhand": "జార్ఖండ్",
        "Manipur": "మణిపూర్",
        "Meghalaya": "మేఘాలయ",
        "Mizoram": "మిజోరాం",
        "Nagaland": "నాగాలాండ్",
        "Sikkim": "సిక్కిం",
        "Tripura": "త్రిపుర",
        "Uttarakhand": "ఉత్తరాఖండ్",
        "Jammu and Kashmir": "జమ్మూ & కాశ్మీర్",
        "Ladakh": "లడఖ్"
    },
    kn: {
        "Arunachal Pradesh": "ಅರುಣಾಚಲ ಪ್ರದೇಶ",
        "Assam": "ಅಸ್ಸಾಂ",
        "Chhattisgarh": "ಛತ್ತೀಸ್‌ಗಢ",
        "Goa": "ಗೋವಾ",
        "Himachal Pradesh": "ಹಿಮಾಚಲ ಪ್ರದೇಶ",
        "Jharkhand": "ಜಾರ್ಖಂಡ್",
        "Manipur": "ಮಣಿಪುರ",
        "Meghalaya": "ಮೇಘಾಲಯ",
        "Mizoram": "ಮಿಜೋರಾಂ",
        "Nagaland": "ನಾಗಾಲ್ಯಾಂಡ್",
        "Sikkim": "ಸಿಕ್ಕಿಂ",
        "Tripura": "ತ್ರಿಪುರಾ",
        "Uttarakhand": "ಉತ್ತರಾಖಂಡ",
        "Jammu and Kashmir": "ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ",
        "Ladakh": "ಲಡಾಖ್"
    },
    ta: {
        "Arunachal Pradesh": "அருணாச்சல பிரதேசம்",
        "Assam": "அஸ்ஸாம்",
        "Chhattisgarh": "சத்தீஸ்கர்",
        "Goa": "கோவா",
        "Himachal Pradesh": "இமாச்சல பிரதேசம்",
        "Jharkhand": "ஜார்கண்ட்",
        "Manipur": "மணிப்பூர்",
        "Meghalaya": "மேகாலயா",
        "Mizoram": "மிசோரம்",
        "Nagaland": "நாகாலாந்து",
        "Sikkim": "சிக்கிம்",
        "Tripura": "திரிபுரா",
        "Uttarakhand": "உத்தரகாண்ட்",
        "Jammu and Kashmir": "ஜம்மு மற்றும் காஷ்மீர்",
        "Ladakh": "லடாக்"
    },
    ml: {
        "Arunachal Pradesh": "അരുണാചൽ പ്രദേശ്",
        "Assam": "അസ്സം",
        "Chhattisgarh": "ഛത്തീസ്ഗഡ്",
        "Goa": "ഗോവ",
        "Himachal Pradesh": "ഹിമാചൽ പ്രദേശ്",
        "Jharkhand": "ജാർഖണ്ഡ്",
        "Manipur": "മണിപ്പൂർ",
        "Meghalaya": "മേഘാലയ",
        "Mizoram": "മിസോറാം",
        "Nagaland": "നാഗാലാൻഡ്",
        "Sikkim": "സിക്കിം",
        "Tripura": "ത്രിപുര",
        "Uttarakhand": "ഉത്തരാഖണ്ഡ്",
        "Jammu and Kashmir": "ജമ്മു കശ്മീർ",
        "Ladakh": "ലഡാക്ക്"
    }
};

const langs = ['en', 'hi', 'te', 'kn', 'ta', 'ml'];

for (const lang of langs) {
    const startStr = `const ${lang} = {`;
    const startIndex = content.indexOf(startStr);

    if (startIndex !== -1) {
        let insertStr = '';
        for (const [key, val] of Object.entries(additionalStates[lang])) {
            const safeKey = `"${key}":`;
            // Avoid adding duplicate if it exists already
            if (!content.substring(startIndex, startIndex + 6000).includes(safeKey)) {
                insertStr += `\n    ${safeKey} "${val}",`;
            }
        }
        content = content.slice(0, startIndex + startStr.length) + insertStr + content.slice(startIndex + startStr.length);
    }
}

fs.writeFileSync(file, content);
console.log('Rest of the UI states patched successfully!');
