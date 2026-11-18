// `fgos hook dispatch-decide` parity table: every verdict and answer protocol the base release gives, on a fresh
// world per entry (see `execution-world.mjs`). A step's `stdin` is the harness's payload; `$REPO` is the project.
// The project a verdict is judged against is `CLAUDE_PROJECT_DIR` (set through the step's `env`), an agy
// workspace root, or the directory the hook started in.
import { OUT_OF_PROCESS_GLOBAL, runTable, tableOf } from './execution-world.mjs';

const { cases, call, add } = tableOf('hook-dispatch-decide', ['hook', 'dispatch-decide']);
export { cases };
export const runPreparedCase = runTable;

const OUT = { do: 'globalConfig', text: OUT_OF_PROCESS_GLOBAL };
const project = (text) => ({ do: 'projectConfig', text });
const task = (subagent, extra = {}) => JSON.stringify({ tool_name: 'Task', tool_input: { subagent_type: subagent }, cwd: '/tmp', ...extra });
const agy = (subagent, root = '$REPO') => JSON.stringify({ toolCall: { name: 'Task', args: { subagent_type: subagent } }, workspacePaths: [root] });
const inProject = (extra = {}) => ({ ...extra });

// The standard protocol (Claude Code, Codex): exit 2 and the reason on stderr, or exit 0 and nothing.
add('standard-in-process-task-is-allowed', [call([], inProject({ stdin: task('general-purpose') }))]);
add('standard-out-of-process-task-is-blocked', [OUT, call([], inProject({ stdin: task('outproc') }))]);
add('standard-agent-tool-name', [OUT, call([], inProject({ stdin: JSON.stringify({ tool_name: 'Agent', tool_input: { subagent_type: 'outproc' } }) }))]);
add('standard-lowercase-task-tool-name', [OUT, call([], inProject({ stdin: JSON.stringify({ tool_name: 'task', tool_input: { agent: 'outproc' } }) }))]);
add('standard-no-subagent-type-is-general-purpose', [call([], inProject({ stdin: JSON.stringify({ tool_name: 'Task', tool_input: {} }) }))]);
add('standard-blank-subagent-type-falls-to-agent', [OUT, call([], inProject({ stdin: JSON.stringify({ tool_name: 'Task', tool_input: { subagent_type: '  ', agent: 'outproc' } }) }))]);
add('standard-other-tool-is-allowed', [call([], inProject({ stdin: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }) }))]);
add('standard-tool-name-not-text-is-allowed', [call([], inProject({ stdin: JSON.stringify({ tool_name: 7, tool_input: {} }) }))]);
add('standard-empty-payload-is-allowed', [call([], inProject({ stdin: '' }))]);
add('standard-blank-payload-is-allowed', [call([], inProject({ stdin: '  \n' }))]);
add('standard-payload-that-does-not-parse-is-allowed', [call([], inProject({ stdin: '{ not json' }))]);
add('standard-payload-that-is-an-array-is-allowed', [call([], inProject({ stdin: '[1]' }))]);
add('standard-payload-that-is-a-string-is-allowed', [call([], inProject({ stdin: '"x"' }))]);
add('standard-payload-cwd-is-never-the-project', [OUT, call([], inProject({ stdin: task('outproc', { cwd: '$OUTSIDE' }) }))]);
add('standard-unregistered-agent-with-needs-soul-but-no-native-access', [call([], inProject({ stdin: task('anything-else') }))]);

// The agy protocol: JSON on stdout and exit 0, whatever the verdict.
add('agy-in-process-task-is-allowed', [call(['--format=agy'], { stdin: agy('general-purpose') })]);
add('agy-out-of-process-task-is-denied', [OUT, call(['--format=agy'], { stdin: agy('outproc') })]);
add('agy-payload-shape-decides-without-the-flag', [OUT, call([], { stdin: agy('outproc') })]);
add('agy-flag-with-a-standard-payload', [OUT, call(['--format=agy'], inProject({ stdin: task('outproc') }))]);
add('agy-empty-payload-is-allowed-in-agy', [call(['--format=agy'], { stdin: '' })]);
add('agy-payload-that-does-not-parse-is-allowed-in-agy', [call(['--format=agy'], { stdin: 'nope' })]);
add('agy-format-written-as-two-words-is-not-the-flag', [OUT, call(['--format', 'agy'], inProject({ stdin: task('outproc') }))]);
add('unknown-format-value-is-the-payloads-own-shape', [OUT, call(['--format=other'], inProject({ stdin: task('outproc') }))]);

// Where the project comes from.
add('claude-project-dir-names-the-project', [OUT, call([], { stdin: task('outproc'), cwd: 'outside', env: { CLAUDE_PROJECT_DIR: '$REPO' } })]);
add('project-dir-that-does-not-exist-blocks', [call([], { stdin: task('outproc'), env: { CLAUDE_PROJECT_DIR: '/nonexistent/fgos-parity-project' } })]);
add('project-dir-that-does-not-exist-blocks-in-agy', [call(['--format=agy'], { stdin: agy('outproc', '/nonexistent/fgos-parity-project') })]);
add('hook-started-outside-a-repository-allows', [call([], { stdin: task('outproc'), cwd: 'outside' })]);
add('hook-started-in-a-subdirectory', [OUT, call([], { stdin: task('outproc'), cwd: 'sub' })]);

// The project's config: a refusal of it blocks, any other failure allows.
add('config-does-not-parse-blocks', [project('runner: [\n'), call([], inProject({ stdin: task('general-purpose') }))]);
add('config-does-not-parse-blocks-in-agy', [project('runner: [\n'), call(['--format=agy'], { stdin: agy('general-purpose') })]);
add('config-key-in-the-wrong-scope-blocks', [project('runner:\n  executors:\n    a:\n      kind: agent\n      invocations: []\n'), call([], inProject({ stdin: task('general-purpose') }))]);
add('config-semantic-rule-broken-blocks', [project('runner:\n  capabilities:\n    foo:\n      prefer: ghost\n'), call([], inProject({ stdin: task('foo') }))]);
add('global-config-does-not-parse-blocks', [{ do: 'globalConfig', text: 'runner: [\n' }, call([], inProject({ stdin: task('general-purpose') }))]);
add('global-rigor-to-tier-blocks', [{ do: 'globalConfig', text: 'runner:\n  rigorToTier:\n    high: flagship\n' }, call([], inProject({ stdin: task('general-purpose') }))]);
add('a-non-config-failure-allows-an-unusable-payload-tool-input', [call([], inProject({ stdin: JSON.stringify({ tool_name: 'Task', tool_input: 'oops' }) }))]);
