const fs = require('fs');
const file = 'scripts/test-select-mutate.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const execSync = require('node:child_process').execSync;\n              execSync('node scripts/run-tests.mjs', { cwd: worktreePath, stdio: 'ignore' });",
  "execFileSync('node', ['scripts/run-tests.mjs'], { cwd: worktreePath, stdio: 'ignore' });"
);
fs.writeFileSync(file, content);
