// Run: node check-image-overrides.mjs. Fails if an override points at a missing photo or its key is not in cleanProdName() form.
import fs from 'fs';
const overrides = JSON.parse(fs.readFileSync('src/data/image-overrides.json', 'utf8'));
const clean = (n) => n.toLowerCase().replace(/\s*\(tester\)/i, '').replace(/\s*edp.*/i, '').replace(/aurora\s*/i, '').replace(/&.*/i, '').trim();
let bad = 0;
for (const [key, img] of Object.entries(overrides)) {
  if (clean(key) !== key) { console.log('key not in cleaned form:', key); bad++; }
  if (!fs.existsSync('public' + img)) { console.log('missing photo:', key, img); bad++; }
}
console.log(bad ? `${bad} problem(s)` : `ok: ${Object.keys(overrides).length} overrides`);
process.exit(bad ? 1 : 0);
