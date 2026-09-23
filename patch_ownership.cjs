const fs = require('fs');
const file = 'test/test-ownership.mjs';
let content = fs.readFileSync(file, 'utf8');

const newRule = `
  {
    name: 'verbs/merge/approve',
    pattern: 'src/verbs/merge/approve.mjs',
    directTests: [
      'test/direct/merge-gate.test.mjs'
    ],
    boundaryTests: [],
    status: 'shadow'
  },`;

content = content.replace(/export const MANIFEST = \[/, "export const MANIFEST = [" + newRule);
fs.writeFileSync(file, content);
