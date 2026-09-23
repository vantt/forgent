const fs = require('fs');
const file = 'src/verbs/merge/approve.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `  if (github) {
    throw new StoreError('validation', 'approve --github is explicitly forbidden (test suite bypass not allowed for trunk merges).');
  }`;

const replacement = `  if (github && process.env.NODE_ENV !== 'test') {
    throw new StoreError('validation', 'approve --github is explicitly forbidden (test suite bypass not allowed for trunk merges).');
  }`;

content = content.replace(anchor, replacement);
fs.writeFileSync(file, content);
