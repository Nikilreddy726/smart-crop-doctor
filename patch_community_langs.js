const fs = require('fs');

const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const additions = {
    en: {
        diseaseReport: "Disease Report",
        discussion: "Discussion",
        farmTip: "Farm Tip",
        successStory: "Success Story",
        needHelp: "Need Help",
        allPosts: "All Posts",
        tips: "Tips",
        success: "Success",
        help: "Help",
        communityTitle2: "Crop Community",
        communitySubtitleTagline: "Connect · Learn · Share with Indian Farmers",
        newPostContent: "New Post",
        trending: "Trending:",
        searchCommunity: "Search posts, crops, farmers...",
        loadingCommunity: "Loading Community...",
        confirmDeleteExt: "Delete this post?",
        createNewPost: "Create New Post",
        shareExperience: "Share your farming experience, ask a question, or report a disease...",
        addTags: "Add Tags",
        postToCommunity: "Post to Community",
        posting: "Posting...",
        postComment: "Post",
        justNow: "Just now",
        ago: "ago",
        mins: "m",
        hrs: "h"
    },
    hi: {
        diseaseReport: "रोग रिपोर्ट",
        discussion: "चर्चा",
        farmTip: "कृषि टिप",
        successStory: "सफलता की कहानी",
        needHelp: "मदद चाहिए",
        allPosts: "सभी पोस्ट",
        tips: "टिप्स",
        success: "सफलता",
        help: "मदद",
        communityTitle2: "फसल समुदाय",
        communitySubtitleTagline: "भारतीय किसानों के साथ जुड़ें · सीखें · साझा करें",
        newPostContent: "नई पोस्ट",
        trending: "ट्रेंडिंग:",
        searchCommunity: "पोस्ट, फसलें, किसान खोजें...",
        loadingCommunity: "समुदाय लोड हो रहा है...",
        confirmDeleteExt: "क्या आप इस पोस्ट को हटाना चाहते हैं?",
        createNewPost: "नई पोस्ट बनाएं",
        shareExperience: "अपना कृषि अनुभव साझा करें, प्रश्न पूछें, या रोग की रिपोर्ट करें...",
        addTags: "टैग जोड़ें",
        postToCommunity: "समुदाय में पोस्ट करें",
        posting: "पोस्ट किया जा रहा है...",
        postComment: "कमेंट करें",
        justNow: "अभी-अभी",
        ago: "पहले",
        mins: "मिनट",
        hrs: "घंटे"
    },
    te: {
        diseaseReport: "వ్యాధి నివేదిక",
        discussion: "చర్చ",
        farmTip: "వ్యవసాయ చిట్కా",
        successStory: "విజయ గాథ",
        needHelp: "సహాయం కావాలి",
        allPosts: "అన్ని పోస్ట్‌లు",
        tips: "చిట్కాలు",
        success: "విజయం",
        help: "సహాయం",
        communityTitle2: "పంట సంఘం",
        communitySubtitleTagline: "భారతీయ రైతులతో కనెక్ట్ అవ్వండి · నేర్చుకోండి · భాగస్వామ్యం చేయండి",
        newPostContent: "కొత్త పోస్ట్",
        trending: "ట్రెండింగ్:",
        searchCommunity: "పోస్ట్‌లు, పంటలు, రైతులను శోధించండి...",
        loadingCommunity: "సంఘం లోడ్ అవుతోంది...",
        confirmDeleteExt: "ఈ పోస్ట్‌ను తొలగించాలా?",
        createNewPost: "కొత్త పోస్ట్‌ను సృష్టించండి",
        shareExperience: "మీ వ్యవసాయ అనుభవాన్ని పంచుకోండి, ప్రశ్న అడగండి లేదా వ్యాధిని నివేదించండి...",
        addTags: "ట్యాగ్‌లను జోడించండి",
        postToCommunity: "సంఘానికి పోస్ట్ చేయండి",
        posting: "పోస్ట్ చేయబడుతోంది...",
        postComment: "పోస్ట్",
        justNow: "ఇప్పుడే",
        ago: "క్రితం",
        mins: "నిమి",
        hrs: "గం"
    },
    kn: {
        diseaseReport: "ರೋಗ ವರದಿ",
        discussion: "ಚರ್ಚೆ",
        farmTip: "ಕೃಷಿ ಸಲಹೆ",
        successStory: "ಯಶಸ್ಸಿನ ಕಥೆ",
        needHelp: "ಸಹಾಯ ಬೇಕು",
        allPosts: "ಎಲ್ಲಾ ಪೋಸ್ಟ್‌ಗಳು",
        tips: "ಸಲಹೆಗಳು",
        success: "ಯಶಸ್ಸು",
        help: "ಸಹಾಯ",
        communityTitle2: "ಬೆಳೆ ಸಮುದಾಯ",
        communitySubtitleTagline: "ಭಾರತೀಯ ರೈತರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ · ಕಲಿಯಿರಿ · ಹಂಚಿಕೊಳ್ಳಿ",
        newPostContent: "ಹೊಸ ಪೋಸ್ಟ್",
        trending: "ಟ್ರೆಂಡಿಂಗ್:",
        searchCommunity: "ಪೋಸ್ಟ್‌ಗಳು, ಬೆಳೆಗಳು, ರೈತರನ್ನು ಹುಡುಕಿ...",
        loadingCommunity: "ಸಮುದಾಯ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        confirmDeleteExt: "ಈ ಪೋಸ್ಟ್ ಅಳಿಸಬೇಕೆ?",
        createNewPost: "ಹೊಸ ಪೋಸ್ಟ್ ರಚಿಸಿ",
        shareExperience: "ನಿಮ್ಮ ಕೃಷಿ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ, ಪ್ರಶ್ನೆ ಕೇಳಿ, ಅಥವಾ ರೋಗ ವರದಿ ಮಾಡಿ...",
        addTags: "ಟ್ಯಾಗ್‌ಗಳನ್ನು ಸೇರಿಸಿ",
        postToCommunity: "ಸಮುದಾಯಕ್ಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ",
        posting: "ಪೋಸ್ಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        postComment: "ಪೋಸ್ಟ್",
        justNow: "ಈಗ ತಾನೇ",
        ago: "ಹಿಂದೆ",
        mins: "ನಿ",
        hrs: "ಗಂ"
    },
    ta: {
        diseaseReport: "நோய் அறிக்கை",
        discussion: "விவாதம்",
        farmTip: "விவசாய குறிப்பு",
        successStory: "வெற்றிக் கதை",
        needHelp: "உதவி தேவை",
        allPosts: "அனைத்து பதிவுகள்",
        tips: "குறிப்புகள்",
        success: "வெற்றி",
        help: "உதவி",
        communityTitle2: "பயிர் சமூகம்",
        communitySubtitleTagline: "இந்திய விவசாயிகளுடன் இணையுங்கள் · கற்றுக்கொள்ளுங்கள் · பகிருங்கள்",
        newPostContent: "புதிய பதிவு",
        trending: "போக்கு:",
        searchCommunity: "பதிவுகள், பயிர்கள், விவசாயிகளை தேடுங்கள்...",
        loadingCommunity: "சமூகம் ஏற்றப்படுகிறது...",
        confirmDeleteExt: "இந்த பதிவை நீக்க வேண்டுமா?",
        createNewPost: "புதிய பதிவை உருவாக்கு",
        shareExperience: "உங்கள் விவசாய அனுபவத்தை பகிர்ந்து கொள்ளுங்கள், கேள்வி கேளுங்கள்...",
        addTags: "குறிச்சொற்களைச் சேர்",
        postToCommunity: "சமூகத்தில் பதிவு செய்",
        posting: "பதிவிடப்படுகிறது...",
        postComment: "பதிவு",
        justNow: "இப்போது",
        ago: "முன்பு",
        mins: "நிமி",
        hrs: "மணி"
    },
    ml: {
        diseaseReport: "രോഗ റിപ്പോർട്ട്",
        discussion: "ചർച്ച",
        farmTip: "കൃഷി ടിപ്പ്",
        successStory: "വിജയഗാഥ",
        needHelp: "സഹായം ആവശ്യമുണ്ട്",
        allPosts: "എല്ലാ പോസ്റ്റുകളും",
        tips: "നുറുങ്ങുകൾ",
        success: "വിജയം",
        help: "സഹായം",
        communityTitle2: "വിള സമൂഹം",
        communitySubtitleTagline: "ഇന്ത്യൻ കർഷകരുമായി ബന്ധപ്പെടുക · പഠിക്കുക · പങ്കിടുക",
        newPostContent: "പുതിയ പോസ്റ്റ്",
        trending: "ട്രെൻഡിംഗ്:",
        searchCommunity: "പോസ്റ്റുകൾ, വിളകൾ, കർഷകർ എന്നിവ തിരയുക...",
        loadingCommunity: "കമ്മ്യൂണിറ്റി ലോഡ് ചെയ്യുന്നു...",
        confirmDeleteExt: "ഈ പോസ്റ്റ് ഇല്ലാതാക്കണോ?",
        createNewPost: "പുതിയ പോസ്റ്റ് സൃഷ്ടിക്കുക",
        shareExperience: "നിങ്ങളുടെ കാർഷിക അനുഭവം പങ്കിടുക, ചോദ്യം ചോദിക്കുക...",
        addTags: "ടാഗുകൾ ചേർക്കുക",
        postToCommunity: "കമ്മ്യൂണിറ്റിയിൽ പോസ്റ്റ് ചെയ്യുക",
        posting: "പോസ്റ്റ് ചെയ്യുന്നു...",
        postComment: "പോസ്റ്റ്",
        justNow: "ഇപ്പൊൾ",
        ago: "മുമ്പ്",
        mins: "മിനിറ്റ്",
        hrs: "മണിക്കൂർ"
    }
};

const langs = ['en', 'hi', 'te', 'kn', 'ta', 'ml'];

for (const lang of langs) {
    const startStr = `const ${lang} = {`;
    const startIndex = content.indexOf(startStr);

    if (startIndex !== -1) {
        let insertStr = '';
        for (const [key, val] of Object.entries(additions[lang])) {
            // Check broadly if key exists in this lang's block
            const block = content.substring(startIndex, startIndex + 3000);
            if (!block.includes(`    ${key}:`)) {
                insertStr += `\n    ${key}: "${val}",`;
            }
        }
        content = content.slice(0, startIndex + startStr.length) + insertStr + content.slice(startIndex + startStr.length);
    }
}

fs.writeFileSync(file, content);
console.log('Community translations patched successfully');
