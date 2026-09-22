const fs = require('fs');
const file = '.github/workflows/ci.yml';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: 'test' job write test marker
content = content.replace(
  'node scripts/write-test-marker.mjs --type related --xml test-results/related.xml --plan selector-plan.json --type full --xml test-results/full.xml',
  'node scripts/write-test-marker.mjs --type full --xml test-results/full.xml'
);

// Fix 2: 'related' job write test marker and test reporter destination
content = content.replace(
  '--test-reporter-destination=test-results/full.xml',
  '--test-reporter-destination=test-results/related.xml'
);

content = content.replace(
  'node scripts/write-test-marker.mjs',
  'node scripts/write-test-marker.mjs --type related --xml test-results/related.xml --plan selector-plan.json'
);

fs.writeFileSync(file, content);
