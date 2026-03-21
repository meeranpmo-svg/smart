const fs = require('fs');
const babel = require('@babel/core');

const html = fs.readFileSync('SmartEdit.html', 'utf8');

// Extract JSX from script tag
const jsxMatch = html.match(/<script[^>]*type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
if (!jsxMatch) { console.error('No JSX found'); process.exit(1); }
const jsx = jsxMatch[1];

// Compile JSX → plain JS
const result = babel.transformSync(jsx, {
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  compact: true,
});

// Remove loading boot screen since compiled JS is instant
const noBootHtml = html
  .replace(/<!-- Loading screen[\s\S]*?<\/style>\n/m, '')
  .replace("document.getElementById('boot')?.remove();", '');

// Remove Babel CDN script tag
const noBabel = noBootHtml.replace(/<script[^>]*babel[^>]*><\/script>\n?/g, '');

// Replace JSX script tag with compiled JS
const compiled = noBabel.replace(
  /<script[^>]*type="text\/babel"[^>]*>[\s\S]*?<\/script>/,
  `<script>\n${result.code}\n</script>`
);

fs.writeFileSync('SmartEdit.compiled.html', compiled);
console.log('✅ Done! Open SmartEdit.compiled.html — loads instantly!');
