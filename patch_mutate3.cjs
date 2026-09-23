const fs = require('fs');
const file = 'scripts/test-select-mutate.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "fullPassed: false\n            syntaxError: false",
  "fullPassed: false,\n            syntaxError: false"
);
fs.writeFileSync(file, content);
