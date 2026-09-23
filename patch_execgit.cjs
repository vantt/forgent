const fs = require('fs');
let file5 = 'test/cli/fgos-approve-5.test.mjs';
let content5 = fs.readFileSync(file5, 'utf8');
content5 = content5.replace(/run\(cwd, \['add'/g, "execFileSync('git', ['add'");
content5 = content5.replace(/run\(cwd, \['commit'/g, "execFileSync('git', ['commit'");
fs.writeFileSync(file5, content5);
