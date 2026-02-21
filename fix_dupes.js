const fs = require('fs');
const file = 'c:/Users/reddy/OneDrive/Desktop/crop/client/src/services/LanguageContext.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const seenKeysPerLang = {};
let currentLang = null;

const newLines = [];
let insideObject = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if entering a new lang
    const langMatch = line.match(/^const (en|hi|te|kn|ta|ml) = \{/);
    if (langMatch) {
        currentLang = langMatch[1];
        seenKeysPerLang[currentLang] = new Set();
        insideObject = true;
    }

    if (insideObject && line.startsWith('};')) {
        insideObject = false;
        currentLang = null;
    }

    let isDuplicate = false;
    if (currentLang && insideObject) {
        // match object keys either as bare words `key:` or strings `"key":`
        const keyMatch = line.match(/^\s*(?:\"([^\"]+)\"|([a-zA-Z0-9_]+))\s*:/);
        if (keyMatch && !line.includes('//')) {
            const key = keyMatch[1] || keyMatch[2];
            if (seenKeysPerLang[currentLang].has(key)) {
                isDuplicate = true;
            } else {
                seenKeysPerLang[currentLang].add(key);
            }
        }
    }

    if (!isDuplicate) {
        newLines.push(line);
    }
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('Duplicates removed.');
