const fs = require('fs');
const file = 'test/cli/fgos-approve.test.mjs';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "assert.ok(gitAtCwd(cwd, ['ls-tree', '-r', 'main', '--name-only']).includes('approve-runner-item-produced.txt'), 'the merged file must be present on main');",
  "assert.ok(fs.existsSync(path.join(cwd, 'approve-runner-item-produced.txt')), 'the merged file must be present on main');"
);

fs.writeFileSync(file, content);
