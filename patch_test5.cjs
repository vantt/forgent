const fs = require('fs');
let file = 'test/cli/fgos-approve-5.test.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /test\('approve --github --pr on the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges via the fake gh, awaiting-approval -> done \(f01\)', \(\) => {/g,
  "test('approve --github --pr on the same self-modifying diff is explicitly forbidden', () => {"
);
content = content.replace(
  /  assert\.equal\(result\.status, 0, \`approve --github with acknowledgment must succeed: \$\{result\.stdout\}\$\{result\.stderr\}\`\);\n  assert\.equal\(envelopeData\(result\.stdout\)\.to, 'delivered'\);\n  assert\.equal\(stateView\(cwd\)\.work\['gh-iron-ack-item'\]\.status, 'delivered'\);\n/g,
  "  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);\n  assert.match(result.stderr, /explicitly forbidden/);\n"
);
fs.writeFileSync(file, content);
