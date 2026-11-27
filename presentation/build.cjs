// Wraps deck.html (the page body, as published on claude.ai) into index.html,
// a complete page you can open straight from the folder. Run: node build.cjs
const fs = require('fs');
const path = require('path');
const deck = fs.readFileSync(path.join(__dirname, 'deck.html'), 'utf8');
const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${deck}
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html written');
