#!/usr/bin/env node
/**
 * Guarantees `assets/content/library.generated.json` exists before Metro bundles.
 * The generated library is not committed (see the compliance report); a fresh
 * checkout falls back to the committed public-domain sample.
 */
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '..', 'assets', 'content');
const generated = path.join(contentDir, 'library.generated.json');
const sample = path.join(contentDir, 'library.sample.json');

if (fs.existsSync(generated)) {
  process.exit(0);
}

fs.mkdirSync(contentDir, { recursive: true });
fs.copyFileSync(sample, generated);
console.log('seeded assets/content/library.generated.json from library.sample.json');
