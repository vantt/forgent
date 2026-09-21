const fs = require('fs');
let code = fs.readFileSync('src/runner/dispatch/herdr-round.mjs', 'utf8');

// Replace startAgent call with client.paneRun for confined agent
code = code.replace(
  /\/\/ LOW-8: Launch the confined agent using startAgent and --executable\n\s*startAgent\(\{ client, round, agentKind: agentKindToUse, agentArgs: preparedArgs, executable: preparedCommand, readyMs: deadlines\.startup\.readyMs \}\);/,
  `// Re-introduced paneRun because herdr agent start does not support custom wrappers like bwrap
      const argsForBash = [preparedCommand, ...preparedArgs];
      const cmdStr = argsForBash.map(a => "'" + a.replace(/'/g, "'\\''") + "'").join(' ');
      client.paneRun(round.paneId, cmdStr);`
);

// We need to make sure herdrStartArgv is updated to reflect this for the digest, but it's just for digest?
code = code.replace(
  /herdrStartArgv = \['agent', 'start', round\.agentName, '--kind', agentKindToUse, '--pane', round\.paneId, '--executable', preparedCommand, '--timeout', String\(deadlines\.startup\.readyMs\), \.\.\.\(preparedArgs\.length \? \['--', \.\.\.preparedArgs\] : \[\]\)\];/,
  `herdrStartArgv = [preparedCommand, ...preparedArgs];`
);

fs.writeFileSync('src/runner/dispatch/herdr-round.mjs', code);
