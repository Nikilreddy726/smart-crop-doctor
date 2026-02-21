const fs = require('fs');
const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const missingMandiKeys = {
    hi: {
        loadingRecords: "रिकॉर्ड लोड हो रहे हैं...",
        noRecords: "आपकी खोज से मेल खाने वाला कोई रिकॉर्ड नहीं मिला",
        mandiTitle: "मंडी की कीमतें",
        mandiSubtitle: "भारत भर में रीयल-टाइम कृषि बाजार दरें",
        searchMandi: "बाजार या फसल खोजें...",
        refreshPrices: "कीमतें रीफ्रेश करें",
        all: "सभी",
        selectState: "राज्य चुनें",
        modalPrice: "औसत मूल्य",
        minPrice: "न्यूनतम",
        maxPrice: "अधिकतम",
        kgUnit: "किलो",
        advice: "कृत्रिम बुद्धिमत्ता सलाह",
        hold: "रोकें",
        sellNow: "अभी बेचें",
        trendRising: "कीमत बढ़ने की संभावना है ↑",
        trendFalling: "कीमत गिरने की संभावना है ↓",
        trendStable: "कीमत स्थिर रहने की संभावना है ↔",
        reasonRising: "बाजार में मांग बढ़ रही है, इसलिए अगले कुछ दिनों में कीमत बढ़ सकती है।",
        reasonFalling: "बाजार में आपूर्ति बढ़ रही है, इसलिए कीमत में गिरावट आ सकती है।",
        reasonStable: "बाजार की स्थिति स्थिर है। वर्तमान मूल्य लंबे समय तक बना रह सकता है।"
    },
    te: {
        mandiTitle: "మండి ధరలు",
        mandiSubtitle: "భారతదేశ వ్యాప్తంగా రియల్-టైమ్ వ్యవసాయ మార్కెట్ ధరలు",
        searchMandi: "మండి లేదా పంటను శోధించండి...",
        refreshPrices: "ధరలను రిఫ్రెష్ చేయండి",
        all: "అన్ని",
        selectState: "రాష్ట్రాన్ని ఎంచుకోండి",
        modalPrice: "సగటు ధర",
        minPrice: "కనిష్ట",
        maxPrice: "గరిష్ట",
        kgUnit: "కిలోలు",
        advice: "AI సలహా",
        hold: "ఆపండి",
        sellNow: "ఇప్పుడే అమ్మండి",
        trendRising: "ధరలు పెరిగే అవకాశం ఉంది ↑",
        trendFalling: "ధరలు తగ్గే అవకాశం ఉంది ↓",
        trendStable: "ధరలు స్థిరంగా ఉండే అవకాశం ఉంది ↔",
        reasonRising: "మార్కెట్లో డిమాండ్ పెరిగినందున రాబోయే రోజుల్లో ధర పెరగవచ్చు.",
        reasonFalling: "మార్కెట్లో సరఫరా పెరిగినందున ధర తగ్గవచ్చు.",
        reasonStable: "మార్కెట్ పరిస్థితులు స్థిరంగా ఉన్నాయి."
    },
    kn: {
        mandiTitle: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
        mandiSubtitle: "ಭಾರತದಾದ್ಯಂತ ರಿಯಲ್-ಟೈಮ್ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ದರಗಳು",
        searchMandi: "ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಬೆಳೆಯನ್ನು ಹುಡುಕಿ...",
        refreshPrices: "ಬೆಲೆಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
        all: "ಎಲ್ಲಾ",
        selectState: "ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        modalPrice: "ಸರಾಸರಿ ಬೆಲೆ",
        minPrice: "ಕನಿಷ್ಠ",
        maxPrice: "ಗರಿಷ್ಠ",
        kgUnit: "ಕೆಜಿ",
        advice: "AI ಸಲಹೆ",
        hold: "ತಡೆಹಿಡಿಯಿರಿ",
        sellNow: "ಈಗಲೇ ಮಾರಾಟ ಮಾಡಿ",
        trendRising: "ಬೆಲೆಗಳು ಹೆಚ್ಚಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ ↑",
        trendFalling: "ಬೆಲೆಗಳು ಕುಸಿಯುವ ಸಾಧ್ಯತೆಯಿದೆ ↓",
        trendStable: "ಬೆಲೆಗಳು ಸ್ಥಿರವಾಗಿರುವ ಸಾಧ್ಯತೆಯಿದೆ ↔",
        reasonRising: "ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಬೇಡಿಕೆ ಹೆಚ್ಚಾಗುತ್ತಿದೆ, ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಬೆಲೆಗಳು ಏರಬಹುದು.",
        reasonFalling: "ಪೂರೈಕೆ ಹೆಚ್ಚಾಗಿರುವುದರಿಂದ ಬೆಲೆ ಇಳಿಕೆಯಾಗಬಹುದು.",
        reasonStable: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಸ್ಥಿರವಾಗಿದೆ."
    },
    ta: {
        mandiTitle: "சந்தை விலை",
        mandiSubtitle: "இந்தியா முழுவதும் நிகழ்நேர விவசாய சந்தை விலைகள்",
        searchMandi: "சந்தை அல்லது பயிரைத் தேடுங்கள்...",
        refreshPrices: "விலைகளை புதுப்பிக்கவும்",
        all: "அனைத்தும்",
        selectState: "மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
        modalPrice: "சராசரி விலை",
        minPrice: "குறைந்தபட்சம்",
        maxPrice: "அதிகபட்சம்",
        kgUnit: "கிலோ",
        advice: "AI அறிவுரை",
        hold: "நிறுத்தவும்",
        sellNow: "இப்போதே விற்கவும்",
        trendRising: "விலை உயர வாய்ப்பு உள்ளது ↑",
        trendFalling: "விலை குறைய வாய்ப்பு உள்ளது ↓",
        trendStable: "விலை நிலையாக இருக்க வாய்ப்பு உள்ளது ↔",
        reasonRising: "சந்தையில் தேவை அதிகரித்துள்ளது, எனவே அடுத்த சில நாட்களில் விலைகள் உயரலாம்.",
        reasonFalling: "சந்தையில் விநியோகம் அதிகரித்துள்ளதால் விலை குறையலாம்.",
        reasonStable: "சந்தை நிலைமை நிலையானது. தற்போதைய விலை தொடரலாம்."
    },
    ml: {
        mandiTitle: "വിപണി വിലകൾ",
        mandiSubtitle: "ഇന്ത്യയിലുടനീളമുള്ള തത്സമയ കാർഷിക വിപണി നിരക്കുകൾ",
        searchMandi: "മാർക്കറ്റോ വിളയോ തിരയുക...",
        refreshPrices: "വിലകൾ പുതുക്കുക",
        all: "എല്ലാം",
        selectState: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക",
        modalPrice: "ശരാശരി വില",
        minPrice: "കുറഞ്ഞത്",
        maxPrice: "കൂടിയത്",
        kgUnit: "കിലോ",
        advice: "AI നിർദ്ദേശം",
        hold: "പിടിച്ചുവെക്കുക",
        sellNow: "ഇപ്പോൾ വിൽക്കുക",
        trendRising: "വിലകൾ വർദ്ധിക്കാൻ സാധ്യതയുണ്ട് ↑",
        trendFalling: "വിലകൾ കുറയാൻ സാധ്യതയുണ്ട് ↓",
        trendStable: "വിലകൾ സ്ഥിരമായി തുടരാൻ സാധ്യതയുണ്ട് ↔",
        reasonRising: "വിപണിയിൽ ഡിമാൻഡ് വർദ്ധിക്കുന്നതിനാൽ വരുന്ന ദിവസങ്ങളിൽ വില വർദ്ധിച്ചേക്കാം.",
        reasonFalling: "വിതരണം വർദ്ധിക്കുന്നതിനാൽ വില കുറഞ്ഞേക്കാം.",
        reasonStable: "വിപണി സാഹചര്യം സ്ഥിരമാണ്."
    }
};

const langs = ['hi', 'te', 'kn', 'ta', 'ml'];

for (const lang of langs) {
    const startStr = `const ${lang} = {`;
    const startIndex = content.indexOf(startStr);

    if (startIndex !== -1) {
        let insertStr = '';
        for (const [key, val] of Object.entries(missingMandiKeys[lang])) {
            const safeKey = `"${key}":`;
            // Check within next 6000 chars of language block
            const block = content.substring(startIndex, startIndex + 6000);
            if (!block.includes(safeKey)) {
                insertStr += `\n    ${safeKey} "${val}",`;
            }
        }
        content = content.slice(0, startIndex + startStr.length) + insertStr + content.slice(startIndex + startStr.length);
    }
}

fs.writeFileSync(file, content);
console.log('Mandi missing UI items patched successfully!');
