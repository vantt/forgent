// A reasoning-effort level for one run (`fgos run --effort <level>`, handed on to
// `executeExecutorCli`): one command sets how hard the worker
// reasons, without editing the provider's own config file. The level goes
// through the same validation as an Assignment's reasoningEffort (canonical
// vocabulary, then the executor's own declared `supports.reasoningEffort`),
// and is rendered into the flag the spawned CLI actually reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { renderReasoningEffortArgs, checkLaunchedModel, collectModelWarnings } from '../../src/runner/dispatch/provider-adapter.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { bind } from '../../src/runner/execution/bind.mjs';
import { runUnit } from '../../src/runner/execution/run.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();
// The machine's ~/.fgos/config.json must not leak executors into these runs.
process.env.HOME = makeFixtureDir('fgos-effort-home-');
import { assertReasoningEffort, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

test('renderReasoningEffortArgs puts codex effort in a config override after the exec subcommand', () => {
  const rendered = renderReasoningEffortArgs({ command: '/usr/bin/codex', args: ['exec', '--model', '{model}', '{prompt}'], effort: 'high' });
  assert.deepEqual(rendered.args, ['exec', '-c', 'model_reasoning_effort=high', '--model', '{model}', '{prompt}']);
  assert.deepEqual(rendered.control, { command: 'codex', flag: '-c model_reasoning_effort', native: 'high' });
});

test('renderReasoningEffortArgs maps max to the codex top level and replaces an effort already in the template', () => {
  const rendered = renderReasoningEffortArgs({ command: 'codex', args: ['-c', 'model_reasoning_effort=low', '-s', 'danger-full-access'], effort: 'max' });
  assert.deepEqual(rendered.args, ['-c', 'model_reasoning_effort=xhigh', '-s', 'danger-full-access']);
  assert.equal(rendered.control.replaced, 'low');
});

test('renderReasoningEffortArgs replaces the thinking level a pi or omp template hard-codes', () => {
  for (const command of ['pi', 'omp']) {
    const rendered = renderReasoningEffortArgs({ command, args: ['--model', '{model}', '--thinking', 'medium', '-p', '{prompt}'], effort: 'low' });
    assert.deepEqual(rendered.args, ['--model', '{model}', '--thinking', 'low', '-p', '{prompt}']);
    assert.equal(rendered.control.replaced, 'medium');
  }
});

test('renderReasoningEffortArgs adds --effort for claude and agy', () => {
  for (const command of ['claude', 'agy']) {
    const rendered = renderReasoningEffortArgs({ command, args: ['-p', '{prompt}', '--model', '{model}'], effort: 'medium' });
    assert.deepEqual(rendered.args, ['--effort', 'medium', '-p', '{prompt}', '--model', '{model}']);
  }
});

test('renderReasoningEffortArgs returns null for a command with no effort control', () => {
  assert.equal(renderReasoningEffortArgs({ command: 'herdr', args: [], effort: 'high' }), null);
});

test('assertReasoningEffort refuses a value outside the canonical vocabulary and outside what the executor declares', () => {
  assert.throws(() => assertReasoningEffort('turbo'), (err) => err instanceof RunnerConfigError && /invalid reasoningEffort "turbo". Valid values: \[low, medium, high, max\]/.test(err.message));
  assert.throws(
    () => assertReasoningEffort('max', { supported: ['low', 'medium', 'high'], executorId: 'claude' }),
    /executor "claude" supports reasoningEffort \[low, medium, high\], not "max"/,
  );
  assert.equal(assertReasoningEffort('high', { supported: ['low', 'medium', 'high'], executorId: 'claude' }), 'high');
});

// A fake CLI named after the real one, so the effort control keyed on the
// command name applies. It records its argv and prints a codex-style header.
const FAKE_CLI = `#!/usr/bin/env node
import fs from 'node:fs';
const args = process.argv.slice(2);
fs.writeFileSync('argv.json', JSON.stringify(args));
const model = process.env.FAKE_REPORTED_MODEL ?? args[args.indexOf('--model') + 1];
process.stderr.write('model: ' + model + '\\n');
console.log('ok');
`;

function fixtureRepo({ commandName = 'codex', executorPatch = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-execute-effort-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, '.gitignore'), ['bin/', 'argv.json', '.fgos/', ''].join('\n'));
  execFileSync('git', ['add', '.gitignore'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root });
  fs.mkdirSync(path.join(root, 'bin'));
  const cli = path.join(root, 'bin', commandName);
  fs.writeFileSync(cli, FAKE_CLI.replace('#!/usr/bin/env node', `#!${process.execPath}`));
  fs.chmodSync(cli, 0o755);
  const runner = {
    modelPolicies: { fake: { standard: 'fake-standard', flagship: 'fake-flagship' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 20000,
    executors: {
      fake: {
        kind: 'agent',
        providerModel: 'fake',
        allowCrossProvider: true,
        invocations: [{ id: 'main', via: 'cli', adapter: 'cli-spawn', command: cli, args: ['exec', '--model', '{model}', '{prompt}'] }],
        ...executorPatch,
      },
    },
    capabilities: { execute: { description: 'changes files', serves: { outputKind: 'change', mutates: true } } },
  };
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  return root;
}

const spawnedArgv = (root) => JSON.parse(fs.readFileSync(path.join(root, 'argv.json'), 'utf8'));

test('execute --effort renders the level into the spawned CLI and reports what it applied', async () => {
  const root = fixtureRepo();
  const result = await executeExecutorCli('fake', { for: 'execute', prompt: 'hello', reasoningEffort: 'high', cwd: root, repoRoot: root });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(spawnedArgv(root), ['exec', '-c', 'model_reasoning_effort=high', '--model', 'fake-standard', 'hello']);
  assert.deepEqual(result.reasoningEffort, { requested: 'high', command: 'codex', flag: '-c model_reasoning_effort', native: 'high' });
});

test('execute without --effort leaves the argv exactly as the template renders it', async () => {
  const root = fixtureRepo();
  const result = await executeExecutorCli('fake', { for: 'execute', prompt: 'hello', cwd: root, repoRoot: root });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(spawnedArgv(root), ['exec', '--model', 'fake-standard', 'hello']);
  assert.equal(result.reasoningEffort, undefined);
});

test('execute --effort refuses an invalid level before spawning', async () => {
  const root = fixtureRepo();
  await assert.rejects(
    executeExecutorCli('fake', { for: 'execute', prompt: 'hello', reasoningEffort: 'turbo', cwd: root, repoRoot: root }),
    /invalid reasoningEffort "turbo"/,
  );
  assert.equal(fs.existsSync(path.join(root, 'argv.json')), false);
});

test('execute --effort refuses a level the executor does not declare', async () => {
  const root = fixtureRepo({ executorPatch: { supports: { reasoningEffort: ['low', 'medium'] } } });
  await assert.rejects(
    executeExecutorCli('fake', { for: 'execute', prompt: 'hello', reasoningEffort: 'high', cwd: root, repoRoot: root }),
    /executor "fake" supports reasoningEffort \[low, medium\], not "high"/,
  );
  assert.equal(fs.existsSync(path.join(root, 'argv.json')), false);
});

test('execute --effort refuses an invocation whose CLI has no effort control', async () => {
  const root = fixtureRepo({ commandName: 'some-agent' });
  await assert.rejects(
    executeExecutorCli('fake', { for: 'execute', prompt: 'hello', reasoningEffort: 'high', cwd: root, repoRoot: root }),
    /runs "some-agent", which has no reasoning-effort control fgOS can set/,
  );
  assert.equal(fs.existsSync(path.join(root, 'argv.json')), false);
});

test('the model check warns when policy replaced the requested model or the argv never carries it', () => {
  const check = checkLaunchedModel({ requested: 'opus', launched: 'gpt-5.6-terra', args: ['exec', '--model', 'gpt-5.6-terra'] });
  assert.deepEqual(check.warnings.map((w) => w.code), ['model-overridden']);
  const ignored = checkLaunchedModel({ requested: 'opus', launched: 'opus', args: ['-p', 'hi'] });
  assert.deepEqual(ignored.warnings.map((w) => w.code), ['model-not-passed']);
  // An executor nobody asked a model of is not ignoring one.
  assert.deepEqual(checkLaunchedModel({ launched: 'sonnet', args: [] }).warnings, []);
});

test('the model check reads the provider CLI refusing a model or reporting another one', () => {
  const check = checkLaunchedModel({ launched: 'gemini-3.1-pro-low', args: ['--model', 'gemini-3.1-pro-low'] });
  // agy's own refusal, verbatim from a real run (2026-10-14).
  const agy = collectModelWarnings(check, { stdout: '{"status":"ERROR","error":"invalid model selection (--model \\"gemini-3.1-pro-low\\" --effort \\"\\"): model gemini-3.1-pro-low is not recognized as a known model or custom model in settings"}' });
  assert.equal(agy[0].code, 'model-unsupported');
  assert.equal(agy[0].model, 'gemini-3.1-pro-low');
  assert.equal(collectModelWarnings(check, { stderr: 'Error: Model "x-1" not found. Use --list-models to see available models.' })[0].model, 'x-1');
  assert.equal(collectModelWarnings(check, { stderr: 'warning: Model metadata for `x-2` not found. Defaulting to fallback metadata' })[0].model, 'x-2');
  const reported = collectModelWarnings(checkLaunchedModel({ launched: 'a' }), { stderr: 'OpenAI Codex\n--------\nmodel: b\nprovider: openai\n' });
  assert.deepEqual(reported.map((w) => [w.code, w.launched, w.reported]), [['model-reported-different', 'a', 'b']]);
  // A worker's stdout saying "model: ..." is its own text, not the CLI header.
  assert.deepEqual(collectModelWarnings(checkLaunchedModel({ launched: 'a' }), { stdout: 'model: b\n' }), []);
});

test('execute surfaces a model the CLI reports running instead of the launched one', async () => {
  const root = fixtureRepo();
  const prev = process.env.FAKE_REPORTED_MODEL;
  process.env.FAKE_REPORTED_MODEL = 'some-other-model';
  try {
    const result = await executeExecutorCli('fake', { for: 'execute', prompt: 'hello', model: 'asked-model', cwd: root, repoRoot: root });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.modelWarnings.map((w) => [w.code, w.launched, w.reported]), [['model-reported-different', 'asked-model', 'some-other-model']]);
  } finally {
    if (prev === undefined) delete process.env.FAKE_REPORTED_MODEL; else process.env.FAKE_REPORTED_MODEL = prev;
  }
});

test('an Assignment launched with --effort and --model renders the effort and reports both in its result', async () => {
  const root = fixtureRepo();
  const cli = path.join(root, 'bin', 'codex');
  // Also write the claim an Assignment run expects, like the shared echo executor.
  fs.writeFileSync(cli, `#!${process.execPath}
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
fs.writeFileSync('argv.json', JSON.stringify(args));
const prompt = args[args.length - 1];
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const runDir = path.dirname(match[1]);
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed with a full report.\\n');
  fs.writeFileSync(match[1], JSON.stringify({ status: 'done', summary: 'Done' }));
}
process.stderr.write('model: some-other-model\\n');
console.log('All good');
`);
  const runnerConfig = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'config.json'), 'utf8')).runner;
  runnerConfig.executor = { allowCrossProvider: true, command: cli, args: ['exec', '--model', '{model}', '{prompt}'] };
  runnerConfig.modelPolicies.claude = { standard: 'fake-standard', flagship: 'fake-flagship' };
  const assignment = buildAssignment({ workId: 'tsk-effort-asgn', stage: 'planning', operation: 'validate-plan' });
  const result = await executeAssignment(assignment, {
    cwd: root,
    repoRoot: root,
    runnerConfig,
    cliOverride: { preferExecutor: 'fake', reasoningEffort: 'high', model: 'asked-model' },
  });
  assert.equal(result.status, 'done', JSON.stringify(result));
  const argv = spawnedArgv(root);
  assert.deepEqual(argv.slice(0, 5), ['exec', '-c', 'model_reasoning_effort=high', '--model', 'asked-model']);
  // The receipt records what the launch did as provenance of the policy it ran under.
  assert.equal(result.policy.provenance.reasoningEffort.value, 'high');
  assert.equal(result.policy.provenance.reasoningEffort.rendered.native, 'high');
  assert.deepEqual(result.policy.provenance.modelDrift.value.map((w) => w.code), ['model-reported-different']);
  assert.equal(result.reasoningEffort, undefined);
  assert.equal(result.modelWarnings, undefined);
});

const bindConfig = () => ({
  modelPolicies: { openai: { standard: 'gpt-std' }, claude: { standard: 'sonnet' } },
  rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  capabilities: { 'docs:write': { prefer: [{ executor: 'codex' }], rigor: 'standard' } },
  executors: {
    codex: { kind: 'agent', providerModel: 'openai', allowCrossProvider: true, invocations: [{ id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: 'codex', args: ['exec', '{prompt}'] }] },
    claude: { kind: 'agent', supports: { reasoningEffort: ['low', 'medium', 'high'] }, invocations: [{ id: 'claude-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: 'claude', args: ['-p', '{prompt}'] }] },
  },
});
const unitAsk = (overrides) => ({ unit: { id: 'u1', capability: 'docs:write', writes: ['README.md'] }, role: 'producer', overrides });

test('bind() takes a reasoningEffort override and records where it came from', () => {
  const bound = bind(unitAsk([{ reasoningEffort: 'high', origin: 'human-cli' }]), { runnerConfig: bindConfig(), session: {} });
  assert.equal(bound.executor, 'codex');
  assert.equal(bound.reasoningEffort, 'high');
  assert.deepEqual(bound.provenance.reasoningEffort, { value: 'high', source: 'override:human-cli' });
  const plain = bind(unitAsk([]), { runnerConfig: bindConfig(), session: {} });
  assert.equal(plain.reasoningEffort, null);
  assert.deepEqual(plain.provenance.reasoningEffort, { value: null, source: 'none' });
});

test('bind() refuses an effort outside the vocabulary or outside what the bound executor declares', () => {
  const bad = bind(unitAsk([{ reasoningEffort: 'turbo', origin: 'human-cli' }]), { runnerConfig: bindConfig(), session: {} });
  assert.equal(bad.refused.reason, 'reasoning-effort');
  assert.match(bad.refused.detail, /invalid reasoningEffort "turbo"/);
  const locked = bind(unitAsk([{ executor: 'claude', reasoningEffort: 'max', origin: 'human-cli' }]), { runnerConfig: bindConfig(), session: {} });
  assert.match(locked.refused.detail, /executor "claude" supports reasoningEffort \[low, medium, high\], not "max"/);
});

test('fgos run with an effort override renders it into the CLI the bound executor spawns', async () => {
  const repoRoot = makeFixtureDir('fgos-run-effort-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# t\n');
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/\n');
  execFileSync('git', ['add', '.'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: repoRoot });
  const worktreeDir = makeFixtureDir('fgos-run-effort-wt-');
  fs.rmSync(worktreeDir, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', worktreeDir], { cwd: repoRoot });
  const binDir = path.join(worktreeDir, '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  const cli = path.join(binDir, 'codex');
  // Prints its argv; the run keeps the worker's stdout in the run directory.
  fs.writeFileSync(cli, `#!${process.execPath}\nprocess.stdout.write('ARGV' + JSON.stringify(process.argv.slice(2)) + '\\n');\n`);
  fs.chmodSync(cli, 0o755);
  const runner = {
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { openai: { standard: 'gpt-std' } },
    executors: { codex: { kind: 'agent', providerModel: 'openai', allowCrossProvider: true, invocations: [{ id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: cli, args: ['exec', '--model', '{model}', '{prompt}'] }] } },
    capabilities: { 'docs:write': { prefer: [{ executor: 'codex' }], rigor: 'standard' } },
  };
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));

  const res = await runUnit({
    unitData: { id: 'u-effort', objective: 'Touch the readme', capability: 'docs:write', writes: ['README.md'] },
    repoRoot,
    cwd: worktreeDir,
    pattern: 'solo',
    overrides: [{ reasoningEffort: 'low', origin: 'human-cli' }],
  });
  const record = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  const attempt = Object.values(record.bindings)[0][0];
  assert.equal(attempt.binding.reasoningEffort, 'low');
  const stdoutLogs = execFileSync('find', [path.join(repoRoot, '.fgos', 'assignments', res.unitRunId), '-name', 'stdout.log'], { encoding: 'utf8' }).trim().split('\n');
  const argvLine = fs.readFileSync(stdoutLogs[0], 'utf8').split('\n').find((line) => line.startsWith('ARGV'));
  assert.ok(argvLine, `no ARGV line in ${stdoutLogs[0]}`);
  assert.deepEqual(JSON.parse(argvLine.slice(4)).slice(0, 5), ['exec', '-c', 'model_reasoning_effort=low', '--model', 'gpt-std']);
});

test('fgos run --effort reaches bind() as an override, and a level the executor does not declare is a policy refusal', () => {
  const repo = makeFixtureDir('fgos-cli-effort-');
  for (const args of [['init', '-q', '-b', 'main'], ['config', 'user.email', 't@e.com'], ['config', 'user.name', 'T']]) execFileSync('git', args, { cwd: repo });
  fs.writeFileSync(path.join(repo, 'README.md'), '# t\n');
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/\n');
  execFileSync('git', ['add', '.'], { cwd: repo });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: repo });
  const runner = {
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { claude: { standard: 'sonnet' } },
    executors: { claude: { kind: 'agent', supports: { reasoningEffort: ['low', 'medium', 'high'] }, invocations: [{ id: 'c', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: 'claude', args: ['-p', '{prompt}'] }] } },
    capabilities: { 'docs:write': { prefer: [{ executor: 'claude' }], rigor: 'standard' } },
  };
  fs.mkdirSync(path.join(repo, '.fgos'));
  fs.writeFileSync(path.join(repo, '.fgos', 'config.json'), JSON.stringify({ runner }));
  const wt = makeFixtureDir('fgos-cli-effort-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: repo });
  const unitFile = path.join(wt, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify({ id: 'u', objective: 'x', capability: 'docs:write', writes: ['README.md'] }));
  const res = spawnSync(process.execPath, [path.resolve('bin/fgos.mjs'), 'run', '--unit', unitFile, '--dir', repo, '--effort', 'max', '--json'], { cwd: wt, encoding: 'utf8' });
  assert.equal(res.status, 4, res.stderr);
  const { data } = JSON.parse(res.stdout);
  assert.equal(data.outcome, 'policy-refusal');
  assert.deepEqual(data.results[0].refused, { reason: 'reasoning-effort', detail: 'executor "claude" supports reasoningEffort [low, medium, high], not "max"' });
});

test('fgos run --effort still reaches a role that a scoped --override does not name', () => {
  const repo = makeFixtureDir('fgos-cli-effort-scoped-');
  for (const args of [['init', '-q', '-b', 'main'], ['config', 'user.email', 't@e.com'], ['config', 'user.name', 'T']]) execFileSync('git', args, { cwd: repo });
  fs.writeFileSync(path.join(repo, 'README.md'), '# t\n');
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/\n');
  execFileSync('git', ['add', '.'], { cwd: repo });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: repo });
  // No real CLI is ever launched: the effort check refuses before spawn, and the
  // command does not exist if it were reached.
  const runner = {
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { claude: { standard: 'sonnet' } },
    executors: { claude: { kind: 'agent', supports: { reasoningEffort: ['low', 'medium', 'high'] }, invocations: [{ id: 'c', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: 'fgos-test-no-such-cli', args: ['-p', '{prompt}'] }] } },
    capabilities: { 'docs:write': { prefer: [{ executor: 'claude' }], rigor: 'standard' } },
  };
  fs.mkdirSync(path.join(repo, '.fgos'));
  fs.writeFileSync(path.join(repo, '.fgos', 'config.json'), JSON.stringify({ runner }));
  const wt = makeFixtureDir('fgos-cli-effort-scoped-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: repo });
  const unitFile = path.join(wt, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify({ id: 'u', objective: 'x', capability: 'docs:write', writes: ['README.md'] }));
  const override = JSON.stringify({ scope: { role: 'reviewer' }, executor: 'claude' });
  let out;
  try {
    out = execFileSync(process.execPath, [path.resolve('bin/fgos.mjs'), 'run', '--unit', unitFile, '--dir', repo, '--override', override, '--effort', 'max', '--json'], { cwd: wt, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    out = err.stdout;
  }
  const { data } = JSON.parse(out);
  assert.equal(data.outcome, 'policy-refusal');
  assert.deepEqual(data.results[0].refused, { reason: 'reasoning-effort', detail: 'executor "claude" supports reasoningEffort [low, medium, high], not "max"' });
});

test('one settled run keeps effort and model drift provenance beside a correlated warning and the sandbox that ran', async () => {
  const { settleRunOutcome } = await import('../../src/runner/dispatch/assignment-runner.mjs');
  const { acquireRunControl } = await import('../../src/runner/dispatch/run-lock.mjs');
  const base = makeFixtureDir('fgos-settle-effort-warning-');
  const cwd = path.join(base, 'repo');
  fs.mkdirSync(cwd);
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.email', 't@e.com'); git('config', 'user.name', 'T');
  fs.writeFileSync(path.join(cwd, 'plan.md'), 'x\n');
  git('add', '.'); git('commit', '-qm', 'init');
  const gitBefore = git('rev-parse', 'HEAD');
  const runDir = path.join(base, 'run');
  fs.mkdirSync(path.join(runDir, 'protected', 'prepared-invocation'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'protected', 'prepared-invocation', 'lc-1.json'), JSON.stringify({ backend: { id: 'bwrap', type: 'bwrap' } }));
  // Another session edits the checkout while the read-only round runs.
  fs.writeFileSync(path.join(cwd, 'plan.md'), 'edited by another session\n');
  const { controlToken } = acquireRunControl(runDir, { controllerId: 'effort-warning-test' });
  const { runResult } = await settleRunOutcome({
    runDir,
    runMeta: { runId: 'run_ew_01', assignmentId: 'asgn_ew' },
    assignment: { assignmentId: 'asgn_ew', role: 'reviewer', operation: 'validate-plan', mutation: 'read-only' },
    controlEpoch: 1,
    controlToken,
    exitCode: 0,
    settledAt: new Date().toISOString(),
    effectiveCwd: cwd,
    gitBefore,
    dirtyBefore: [],
    launchCommandId: 'lc-1',
    effectivePolicy: { tier: 'standard', model: 'm1', reasoningEffort: 'high', provenance: { reasoningEffort: { value: 'high', source: { scope: 'cliOverride' } } } },
    reasoningEffort: 'high',
    modelWarnings: [{ code: 'model-drift', requested: 'm1', launched: 'm2' }],
    opts: { cwd, repoRoot: base },
  });
  const stored = JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8'));
  for (const r of [runResult, stored]) {
    assert.equal(r.policy.provenance.reasoningEffort.value, 'high');
    assert.equal(r.policy.provenance.reasoningEffort.rendered, 'high');
    assert.ok(r.policy.provenance.modelDrift, 'model drift recorded');
    assert.ok(r.warnings.some((w) => w.code === 'read-only-mutation-correlated'));
    assert.equal(r.confinement, 'bwrap');
  }
});
