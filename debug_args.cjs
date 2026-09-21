const fs = require('fs');
let code = fs.readFileSync('src/runner/dispatch/herdr-round.mjs', 'utf8');

code = code.replace(
  /if \(!verifiedProc\) \{/,
  `if (!verifiedProc) { console.error("DEBUG proc:", pInfo?.foregroundProcesses, "EXPECTED command:", preparedCommand, "args:", preparedArgs);`
);

fs.writeFileSync('src/runner/dispatch/herdr-round.mjs', code);
