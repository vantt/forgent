const fs = require('fs');
const file = '.github/workflows/ci.yml';
let content = fs.readFileSync(file, 'utf8');

// fix job test
content = content.replace(
  /test-reporter-destination=test-results\/related\.xml/g,
  "test-reporter-destination=test-results/full.xml"
);
content = content.replace(
  /write-test-marker\.mjs --type related --xml test-results\/related\.xml --plan selector-plan\.json --type full --xml test-results\/full\.xml/g,
  "write-test-marker.mjs --type full --xml test-results/full.xml"
);

// fix job related
content = content.replace(
  /test-reporter-destination=test-results\/full\.xml/g,
  "test-reporter-destination=test-results/related.xml"
);

fs.writeFileSync(file, content);
