const fs = require('fs');
let file = 'test/scripts/test-select-compare.test.mjs';
let content = fs.readFileSync(file, 'utf8');

const newFixture = `  await t.test('os-specific: returns os-specific if isOsSpecific is true', () => {
    assert.equal(classifyTestCase({ isOsSpecific: true }), 'os-specific');
  });`;

content = content.replace(
  /  await t\.test\('os-specific: returns os-specific if the test fails on windows\/macos but passes on ubuntu', \(\) => {[\s\S]*?\}\);/g,
  newFixture
);
fs.writeFileSync(file, content);
