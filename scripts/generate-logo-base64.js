const fs = require('fs');

const buf = fs.readFileSync('public/logo-eas.jpg');
const base64 = 'data:image/jpeg;base64,' + buf.toString('base64');
fs.writeFileSync('src/lib/defaultLogoBase64.ts', `export const DEFAULT_LOGO_BASE64 = "${base64}";\n`);
console.log('✅ Logo guardado en src/lib/defaultLogoBase64.ts con longitud', base64.length);
