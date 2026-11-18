// `fgos dispatch explain` parity table: the capabilities and rigors the base release explains, and every refusal of
// its arm, on a fresh world per entry (see `execution-world.mjs`). The explanation reads this machine's PATH for the
// agent CLIs, which a world leaves empty, so every capability is explained against the same absent CLIs.
import { OUT_OF_PROCESS_GLOBAL, runTable, tableOf } from './execution-world.mjs';

const { cases, call, add } = tableOf('dispatch-explain', ['dispatch', 'explain']);
export { cases };
export const runPreparedCase = runTable;

const OUT = { do: 'globalConfig', text: OUT_OF_PROCESS_GLOBAL };
const project = (text) => ({ do: 'projectConfig', text });

// What is explained.
add('capability-with-a-prefer-pool', [call(['--for', 'code:implement'])]);
add('capability-with-rigor-high', [call(['--for', 'code:implement', '--rigor', 'high'])]);
add('capability-with-rigor-critical', [call(['--for', 'code:review', '--rigor', 'critical'])]);
add('capability-with-rigor-low', [call(['--for', 'code:implement', '--rigor', 'low'])]);
add('capability-that-is-a-label', [call(['--for', 'something-unregistered'])]);
add('capability-named-like-an-executor', [OUT, call(['--for', 'outproc'])]);
add('json-flag', [call(['--for', 'code:implement', '--json'])]);
add('from-a-subdirectory-reads-the-callers-own-directory', [call(['--for', 'code:implement'], { cwd: 'sub' })]);
add('dir-names-the-project', [call(['--for', 'code:implement', '--dir', '$REPO'], { cwd: 'outside' })]);
add('outside-any-repository-reads-the-working-directory', [call(['--for', 'code:implement'], { cwd: 'outside' })]);
add('project-config-with-a-capability-row', [project('runner:\n  capabilities:\n    mine:\n      tier: standard\n'), call(['--for', 'mine'])]);

// Refusals of the arm.
add('no-capability', [call([])]);
add('bare-capability-flag', [call(['--for'])]);
add('empty-capability', [call(['--for', ''])]);
add('rigor-not-a-rigor', [call(['--for', 'code:implement', '--rigor', 'bogus'])]);
add('unknown-flag', [call(['--for', 'code:implement', '--bogus'])]);
add('flag-with-equals', [call(['--for=code:implement'])]);
add('dir-bare', [call(['--dir'])]);
add('config-does-not-parse', [project('runner: [\n'), call(['--for', 'code:implement'])]);
add('config-semantic-rule-broken', [project('runner:\n  capabilities:\n    foo:\n      prefer: ghost\n'), call(['--for', 'foo'])]);
add('config-key-in-the-wrong-scope', [project('runner:\n  executors:\n    a:\n      kind: agent\n      invocations: []\n'), call(['--for', 'x'])]);
add('global-rigor-to-tier-is-refused', [{ do: 'globalConfig', text: 'runner:\n  rigorToTier:\n    high: flagship\n' }, call(['--for', 'code:implement'])]);
