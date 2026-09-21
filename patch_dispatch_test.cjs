const fs = require('fs');
let code = fs.readFileSync('test/runner/dispatch.test.mjs', 'utf8');

code = code.replace(
  /const start = Date\.now\(\);/g,
  `const start = Date.now(); console.error("DEBUG EXEC " + process.pid + " START: " + start);`
);

fs.writeFileSync('test/runner/dispatch.test.mjs', code);
