const fs = require('fs');
const file = 'scripts/test-select-mutate.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /fullPassed: true, \/\/ We stopped running full suite, so assume it would pass if related passed/g,
  `fullPassed: false`
);

// We need to add the execution of the full suite ONLY IF related passed.
content = content.replace(
  /if \(parsed\.decision === 'full'\) {\n\s*result\.relatedPassed = exitCode === 0;\n\s*}/g,
  `if (parsed.decision === 'full') {
            result.relatedPassed = exitCode === 0;
          }
          // AC 5: run full ONLY if related passed
          if (result.relatedPassed) {
            try {
              const execSync = require('node:child_process').execSync;
              execSync('node scripts/run-tests.mjs', { cwd: worktreePath, stdio: 'ignore' });
              result.fullPassed = true;
            } catch (err) {
              result.fullPassed = false;
            }
          }`
);

fs.writeFileSync(file, content);
