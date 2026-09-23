const fs = require('fs');
const file = 'scripts/test-select-mutate.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /const fullPassed = true; \/\/ We stopped running full suite.*/g,
  `// Run full suite only if related passed
    let fullPassed = false;
    if (relatedPassed) {
      const fullCmd = \`node "\${path.join(worktreePath, 'scripts/run-tests.mjs')}"\`;
      try {
        execSync(fullCmd, { cwd: worktreePath, stdio: 'ignore' });
        fullPassed = true;
      } catch (err) {
        fullPassed = false;
      }
    }`
);
fs.writeFileSync(file, content);
