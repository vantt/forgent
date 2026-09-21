const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');

// Part 1: declare claimDir outside and generate token
let newCode = code.replace(
  "  let id = coordinationId;\n  let sessionDir;\n  \n  try {\n",
  "  let id = coordinationId;\n  let sessionDir;\n  let claimDir;\n  const token = Math.random().toString(36).slice(2);\n  \n  try {\n"
);

// Part 2: change writeFileSync for claim.json to include token
newCode = newCode.replace(
  "fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({\n            pid: process.pid,\n            createdAt: Date.now()\n          }));",
  "fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({\n            pid: process.pid,\n            createdAt: Date.now(),\n            token\n          }));"
);
newCode = newCode.replace(
  "fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({\n              pid: process.pid,\n              createdAt: Date.now()\n            }));",
  "fs.writeFileSync(path.join(claimDir, 'claim.json'), JSON.stringify({\n              pid: process.pid,\n              createdAt: Date.now(),\n              token\n            }));"
);

// Part 3: remove 'let claimDir;' from inside try block
newCode = newCode.replace("\n    let claimDir;\n    if (id) {", "\n    if (id) {");

// Part 4: replace the catch and finally block at the end of the function
const catchFinallyRegex = /\s*try \{\n\s*if \(typeof claimDir !== 'undefined'[\s\S]*?throw err;\n\s*\}/;

const finalCleanup = `
  } catch (err) {
    if (err.code === 'EEXIST' && fs.existsSync(sessionDir)) {
      // session dir was actually created, don't clean claim here, it was already cleaned or is final
    }
    throw err;
  } finally {
    if (claimDir) {
      try {
        const claimJsonPath = path.join(claimDir, 'claim.json');
        if (fs.existsSync(claimJsonPath)) {
          const claimData = JSON.parse(fs.readFileSync(claimJsonPath, 'utf8'));
          if (claimData.token === token) {
            fs.rmSync(claimDir, { recursive: true, force: true });
          }
        } else {
           fs.rmSync(claimDir, { recursive: true, force: true });
        }
      } catch (e) {}
    }
    try {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } catch (e) {}
  }`;

newCode = newCode.replace(catchFinallyRegex, finalCleanup);

// Oh wait, there is an INNER finally around line 417 for renameSync:
/*
    try {
      fs.renameSync(stagingDir, sessionDir);
      ...
    } catch (err) {
      ...
    } finally {
      try {
        if (typeof claimDir !== 'undefined' && claimDir && fs.existsSync(claimDir)) {
          fs.rmSync(claimDir, { recursive: true, force: true });
        }
      } catch (e) {}
    }
*/
// Let's remove the inner finally block because the outer finally handles claimDir
newCode = newCode.replace(
  /\} finally \{\n\s*try \{\n\s*if \(typeof claimDir[\s\S]*?\} catch \(e\) \{\}\n\s*\}/,
  "} /* inner finally removed, handled by outer */"
);

fs.writeFileSync('src/runner/coordination/store.mjs', newCode);
