const fs = require('fs');
const file = 'src/verbs/merge/approve.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "if (github && process.env.NODE_ENV !== 'test')",
  "if (github)"
);
fs.writeFileSync(file, content);
