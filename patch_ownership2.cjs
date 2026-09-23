const fs = require('fs');
const file = 'test/test-ownership.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /name: 'verbs\/merge\/approve'/,
  "id: 'verbs-merge-approve'"
);
fs.writeFileSync(file, content);
