const fs = require('fs');
const file = 'test/cli/helpers/fgos-cli-harness.mjs';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'opts.env = { ...process.env, FGOS_SESSION_ID: DEFAULT_CLI_SESSION_ID, ...extraEnv };',
  "opts.env = { ...process.env, FGOS_SESSION_ID: DEFAULT_CLI_SESSION_ID, FGOS_TEST_SUITE: '1', ...extraEnv };"
);
fs.writeFileSync(file, content);

const file2 = 'src/verbs/merge/approve.mjs';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  "if (github && process.env.NODE_ENV !== 'test' && process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS !== '1')",
  "if (github && process.env.NODE_ENV !== 'test' && process.env.FGOS_TEST_SUITE !== '1')"
);
fs.writeFileSync(file2, content2);
