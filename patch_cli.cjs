const fs = require('fs');
let code = fs.readFileSync('src/runner/dispatch/cli.mjs', 'utf8');

code = code.replace(
  /const pickStdout = execFgos\(\['pick', candidateId/g,
  `console.error("DEBUG MAP START " + candidateId + " " + Date.now()); const pickStdout = execFgos(['pick', candidateId`
);

code = code.replace(
  /const execRes = await executeExecutorCli/g,
  `console.error("DEBUG EXEC_CLI START " + candidateId + " " + Date.now()); const execRes = await executeExecutorCli`
);

code = code.replace(
  /const returnArgs = \['return', candidateId/g,
  `console.error("DEBUG RETURN START " + candidateId + " " + Date.now()); const returnArgs = ['return', candidateId`
);

fs.writeFileSync('src/runner/dispatch/cli.mjs', code);
