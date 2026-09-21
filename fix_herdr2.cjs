const fs = require('fs');
let code = fs.readFileSync('src/runner/dispatch/herdr-round.mjs', 'utf8');

code = code.replace(
  /const argsForBash = \[preparedCommand, \.\.\.preparedArgs\];\n\s*const cmdStr = argsForBash\.map\(a => "'" \+ a\.replace\(\/'\/g, "'\\\\''"\) \+ "'"\)\.join\(' '\);\n\s*client\.paneRun\(round\.paneId, cmdStr\);/,
  `client.paneRun(round.paneId, preparedCommand, preparedArgs);`
);

code = code.replace(
  /console\.error\("DEBUG proc:", pInfo\?\.foregroundProcesses, "EXPECTED command:", preparedCommand, "args:", preparedArgs\);/g,
  ''
);

fs.writeFileSync('src/runner/dispatch/herdr-round.mjs', code);
