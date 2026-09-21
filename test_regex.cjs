const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');

const regex = /export function openSession\([\s\S]*?\n\s*return \{ manifest, manifestPath, events, quorum \};\n\s*\} catch \(err\) \{[\s\S]*?\n\s*throw err;\n\s*\}\n\}/;
console.log(code.match(regex) ? "MATCH" : "NO MATCH");
