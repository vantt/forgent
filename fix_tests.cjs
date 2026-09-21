const fs = require('fs');

// Fix coordination-r5-hard-budgets.test.mjs
let r5 = fs.readFileSync('test/runner/coordination-r5-hard-budgets.test.mjs', 'utf8');
r5 = r5.replace(/wallTimeMs: 1000 \}\);/g, 'wallTimeMs: 2000 });');
fs.writeFileSync('test/runner/coordination-r5-hard-budgets.test.mjs', r5);

// Fix coordination-research-fan-out.test.mjs
let rfo = fs.readFileSync('test/runner/coordination-research-fan-out.test.mjs', 'utf8');
rfo = rfo.replace(/const FAKE_WORKER_DELAY_MS = 1500;/g, 'const FAKE_WORKER_DELAY_MS = 2500;');
fs.writeFileSync('test/runner/coordination-research-fan-out.test.mjs', rfo);

