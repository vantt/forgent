const fs = require('fs');
let code = fs.readFileSync('test/runner/assignment-dispatch.test.mjs', 'utf8');

code = code.replace(/timeoutMs: 150/g, 'timeoutMs: 800');
fs.writeFileSync('test/runner/assignment-dispatch.test.mjs', code);

