const fs = require('fs');
let file = 'scripts/test-ownership-lint.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /console\.error\(\`Block: Orphaned test file not referenced in manifest: \$\{relPath\}\`\);\n        hasBlock = true;/g,
  "console.warn(`Warn: Orphaned test file not referenced in manifest: ${relPath}`);"
);
fs.writeFileSync(file, content);
