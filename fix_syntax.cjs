const fs = require('fs');
let file = 'test/scripts/test-select-compare.test.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("  });\n  });", "  });");
fs.writeFileSync(file, content);
