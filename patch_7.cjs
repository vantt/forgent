const fs = require('fs');
let file = 'test/cli/fgos-approve-7.test.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /assert\.match\(result\.stderr, \/gh-resolved-root\/\);/,
  "assert.match(result.stderr, /explicitly forbidden/);"
);
fs.writeFileSync(file, content);
