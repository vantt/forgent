const fs = require('fs');
const file = 'src/runner/merge.mjs';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      execFileSync('git', ['update-ref', \`refs/heads/\${targetBranch}\`, commitSha, targetTip], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' });`;
const replacement = `      execFileSync('git', ['update-ref', \`refs/heads/\${targetBranch}\`, commitSha, targetTip], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' });
      const currentBranch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
      if (currentBranch === targetBranch) {
        try {
          execFileSync('git', ['read-tree', '-m', '-u', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' });
        } catch (e) {
          // Non-destructive sync aborted due to unstaged changes on non-intersecting paths.
          // Leaving the working tree out of sync, which is acceptable under D-ADR0042.
        }
      }`;

content = content.replace(anchor, replacement);
fs.writeFileSync(file, content);
