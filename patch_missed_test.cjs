const fs = require('fs');
const file = 'test/cli/fgos-approve-4.test.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /assert\.match\(result\.stderr, \/runner-sourced item\/\);/,
  "assert.match(result.stderr, /explicitly forbidden/);"
);
fs.writeFileSync(file, content);
