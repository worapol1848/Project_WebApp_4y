const fs = require('fs');
const filePath = 'd:\\Web App 4y\\frontend\\src\\context\\LanguageContext.jsx';

let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// We will find the start and end of 'en' and 'th' blocks.
let currentLang = null;
let blocks = {
    en: { start: -1, end: -1, lines: [] },
    th: { start: -1, end: -1, lines: [] }
};

let i = 0;
while (i < lines.length) {
    const line = lines[i];
    if (line.match(/^\s*en:\s*\{\s*$/)) {
        currentLang = 'en';
        blocks.en.start = i + 1;
    } else if (line.match(/^\s*th:\s*\{\s*$/)) {
        currentLang = 'th';
        blocks.th.start = i + 1;
    } else if (currentLang && line.match(/^\s*},\s*$/)) {
        blocks[currentLang].end = i - 1;
        currentLang = null;
    }
    i++;
}

function deduplicateBlock(lang) {
    const start = blocks[lang].start;
    const end = blocks[lang].end;
    if (start === -1 || end === -1) return;

    // First pass: identify the *last* line index for each key
    const keyToLastLine = new Map();
    const lineToKey = new Map();

    for (let j = start; j <= end; j++) {
        const line = lines[j];
        // Match key: 'value', or key: "value", or key: `value`,
        // keys can be alphanumeric with underscores, or string literals like '2d'
        const match = line.match(/^\s*(['"]?)([a-zA-Z0-9_]+)\1\s*:/);
        if (match) {
            const key = match[2];
            keyToLastLine.set(key, j);
            lineToKey.set(j, key);
        }
    }

    // Second pass: nullify lines that are not the *last* line for their key
    for (let j = start; j <= end; j++) {
        if (lineToKey.has(j)) {
            const key = lineToKey.get(j);
            if (keyToLastLine.get(key) !== j) {
                // This is not the last occurrence, we should remove it.
                // Also remove preceding comment if it exists and belongs to this line.
                if (j > 0 && lines[j - 1] && lines[j - 1].match(/^\s*\/\//)) {
                    // Check if we should remove the comment too (only if it's a single comment)
                    // Let's just keep it simple and only remove the key line to avoid messing up formatting too much
                    // Or actually, let's just comment it out to be safe
                }
                lines[j] = null; // Mark for deletion
            }
        }
    }
}

deduplicateBlock('en');
deduplicateBlock('th');

// Filter out null lines
const newLines = lines.filter(line => line !== null);

fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Deduplication complete!');
