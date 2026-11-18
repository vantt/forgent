// `fgos dispatch decide` parity table: every selector the base release answers and every refusal of its arm, on a
// fresh world per entry (see `execution-world.mjs`). The Work hint of `--work <item>` is read through Node on both
// sides and has its own wiring proof (`apps/fgos/tests/cli_tests.rs`), so no case here names `--work`. One refusal
// is the host's own and is not a case: an `--assignment` that is a path (the host reads only one plain segment).
import { OUT_OF_PROCESS_GLOBAL, runTable, tableOf } from './execution-world.mjs';

const { cases, call, add } = tableOf('dispatch-decide', ['dispatch', 'decide']);
export { cases };
export const runPreparedCase = runTable;

const OUT = { do: 'globalConfig', text: OUT_OF_PROCESS_GLOBAL };
const project = (text) => ({ do: 'projectConfig', text });

// The selectors.
add('executor-not-registered', [call(['nobody'])]);
add('executor-registered-out-of-process', [OUT, call(['outproc'])]);
add('executor-registered-with-live-task-access', [OUT, call(['outproc', '--has-live-task-access'])]);
add('purpose-with-needs-soul-and-live-access', [call(['--for', 'general-purpose', '--needs-soul', '--has-live-task-access'])]);
add('purpose-with-needs-soul-only', [call(['--for', 'general-purpose', '--needs-soul'])]);
add('purpose-registered-executor-name', [OUT, call(['--for', 'outproc', '--needs-soul', '--has-live-task-access'])]);
add('purpose-unconfigured', [call(['--for', 'something-unregistered'])]);
add('needs-soul-alone', [call(['--needs-soul'])]);
add('needs-soul-with-live-access', [call(['--needs-soul', '--has-live-task-access'])]);
add('flag-value-on-a-switch-still-declares-it', [call(['--for', 'x', '--has-live-task-access', 'yes'])]);
add('executor-wins-over-purpose', [OUT, call(['outproc', '--for', 'general-purpose'])]);
add('purpose-with-a-prefer-pool-binds-a-seat', [call(['--for', 'code:implement'])]);
add('json-flag', [call(['--for', 'general-purpose', '--needs-soul', '--json'])]);

// The assignment selector: no record, a record naming an executor, an unreadable record.
add('assignment-without-a-record', [call(['--assignment', 'asgn-none'])]);
add('assignment-record-names-an-executor', [
  OUT,
  { do: 'file', path: '.fgos/assignments/asgn-1/assignment.json', text: JSON.stringify({ id: 'asgn-1', capability: 'x', executor: 'outproc' }) },
  call(['--assignment', 'asgn-1']),
]);
add('assignment-record-that-is-not-json', [
  { do: 'file', path: '.fgos/assignments/asgn-2/assignment.json', text: '{ not json' },
  call(['--assignment', 'asgn-2']),
]);
add('assignment-record-with-a-bad-policy', [
  { do: 'file', path: '.fgos/assignments/asgn-3/assignment.json', text: JSON.stringify({ id: 'asgn-3', policy: 'oops' }) },
  call(['--assignment', 'asgn-3']),
]);
add('executor-named-with-an-assignment-ignores-it', [OUT, call(['outproc', '--assignment', 'asgn-none'])]);

// Where the project is resolved from.
add('from-a-subdirectory', [call(['--for', 'general-purpose', '--needs-soul', '--has-live-task-access'], { cwd: 'sub' })]);
add('cwd-names-the-project', [call(['--for', 'general-purpose', '--needs-soul', '--has-live-task-access', '--cwd', '$REPO'], { cwd: 'outside' })]);
add('dir-names-the-cwd', [call(['--for', 'general-purpose', '--needs-soul', '--has-live-task-access', '--dir', '$REPO'], { cwd: 'outside' })]);
add('from-a-linked-worktree-without-its-own-config', [{ do: 'linkedWorktree' }, OUT, call(['outproc'], { cwd: 'linked' })]);
add('repo-root-with-a-matching-cwd', [call(['--for', 'x', '--cwd', '$REPO', '--repo-root', '$REPO'], { cwd: 'outside' })]);

// Refusals of the arm.
add('no-selector', [call([])]);
add('stage-alone-is-no-selector', [call(['--stage', 'plan'])]);
add('repo-root-without-cwd', [call(['--for', 'x', '--repo-root', '/elsewhere'])]);
add('repo-root-without-cwd-from-a-subdirectory', [call(['--for', 'x', '--repo-root', '$REPO'], { cwd: 'sub' })]);
add('outside-any-repository', [call(['--for', 'x'], { cwd: 'outside' })]);
add('cwd-outside-any-repository', [call(['--for', 'x', '--cwd', '$OUTSIDE'])]);
add('repository-without-a-commit', [{ do: 'noCommit' }, call(['--for', 'x'], { cwd: 'empty' })]);
add('unknown-flag', [call(['--bogus'])]);
add('flag-with-equals', [call(['--for=x'])]);
add('dir-bare', [call(['--dir'])]);

// The runner config the project carries.
add('config-semantic-rule-broken', [project('runner:\n  capabilities:\n    foo:\n      prefer: ghost\n'), call(['--for', 'foo'])]);
add('config-semantic-rule-broken-for-an-executor', [project('runner:\n  capabilities:\n    foo:\n      prefer: ghost\n'), call(['outproc'])]);
add('config-does-not-parse', [project('runner: [\n'), call(['--for', 'x'])]);
add('config-key-in-the-wrong-scope', [project('runner:\n  executors:\n    a:\n      kind: agent\n      invocations: []\n'), call(['--for', 'x'])]);
add('config-value-breaks-its-schema', [project('runner:\n  maxTier: 7\n'), call(['--for', 'x'])]);
add('global-config-does-not-parse', [{ do: 'globalConfig', text: 'runner: [\n' }, call(['--for', 'x'])]);
add('global-rigor-to-tier-is-refused', [{ do: 'globalConfig', text: 'runner:\n  rigorToTier:\n    high: flagship\n' }, call(['--for', 'x'])]);
add('model-policies-broken', [project('runner:\n  modelPolicies:\n    claude:\n      standard: ""\n'), call(['--for', 'x'])]);
add('executor-governance-blocks-it', [
  { do: 'globalConfig', text: OUT_OF_PROCESS_GLOBAL.replace('      providerModel: claude\n', '      providerModel: claude\n      governance: { blocked: true, reason: parity }\n') },
  call(['outproc']),
]);
