const fs = require('fs');
let file = 'test/cli/fgos-approve-7.test.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /assert\.match\(result\.stderr, \/explicitly forbidden\/\);/,
  "assert.match(result.stderr, /gh-resolved-root/);"
);
fs.writeFileSync(file, content);

let file5 = 'test/cli/fgos-approve-5.test.mjs';
let content5 = fs.readFileSync(file5, 'utf8');
content5 = content5.replace(/execGit\(cwd, /g, "run(cwd, ");
fs.writeFileSync(file5, content5);
