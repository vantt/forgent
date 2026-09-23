const fs = require('fs');
let file = 'test/scripts/test-select-compare.test.mjs';
let content = fs.readFileSync(file, 'utf8');

const newFixture = `
  it('returns os-specific if the test fails on windows/macos but passes on ubuntu', () => {
    assert.deepEqual(classifyTestCase({
      status: 'fail',
      name: 'some test',
      file: 'test.mjs',
      osFailures: ['macos-latest']
    }, []), { label: 'os-specific' });
  });`;

content = content.replace(
  /  it\('related-only-fail: red in related, green in full'/g,
  newFixture + "\n  it('related-only-fail: red in related, green in full'"
);
fs.writeFileSync(file, content);
