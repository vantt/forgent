const fs = require('fs');
const file = 'scripts/test-select-compare.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `    // In actual implementation, we would rerun the test here.
    // For now we will assume it is not a flake if it fails here.
    const rerunPassed = false; // TODO: implement rerun to detect flakes`;

const replacement = `    let rerunPassed = false;
    if (!isSelected) {
      try {
        const { execSync } = require('child_process');
        execSync(\`node --test "\${test.file}" --test-name-pattern="^\${test.name}$"\`, { stdio: 'ignore' });
        rerunPassed = true;
      } catch (e) {
        rerunPassed = false;
      }
    }`;

content = content.replace(anchor, replacement);
fs.writeFileSync(file, content);
