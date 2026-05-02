const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../routes/auth.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldLine = 'res.json({ token, user: { id: user.id, username: user.username, role: user.role } });';
const newLine = 'res.json({ token, user: { id: user.id, username: user.username, role: user.role, profile_image: user.profile_image } });';

if (content.includes(oldLine)) {
    content = content.replace(oldLine, newLine);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated auth.js login response.');
} else {
    console.log('Could not find the exact line in auth.js. Content might have already been updated or differs in whitespace.');
    // Try a more flexible approach
    const regex = /res\.json\(\{ token, user: \{ id: user\.id, username: user\.username, role: user\.role \} \}\);/;
    if (regex.test(content)) {
        content = content.replace(regex, newLine);
        fs.writeFileSync(filePath, content);
        console.log('Successfully updated auth.js login response using regex.');
    } else {
        console.log('Regex match also failed.');
    }
}
