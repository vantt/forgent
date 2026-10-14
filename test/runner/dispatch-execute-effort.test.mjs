// `dispatch execute --effort <level>`: one command sets how hard the worker
// reasons, without editing the provider's own config file. The level goes
// through the same validation as an Assignment's reasoningEffort (canonical
// vocabulary, then the executor's own declared `supports.reasoningEffort`),
// and is rendered into the flag the spawned CLI actually reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeExecutorCli, runDispatchCli } from '../../src/runner/dispatch/cli.mjs';
import { renderReasoningEffortArgs, checkLaunchedModel, collectModelWarnings } from '../../src/runner/dispatch/provider-adapter.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
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

test('the CLI door parses --effort and refuses a bad level before launch', async () => {
  const root = fixtureRepo();
  const ok = await runDispatchCli(['execute', 'fake', '--for', 'execute', '--prompt', 'hi', '--effort', 'low', '--cwd', root, '--repo-root', root], { returnResult: true });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.reasoningEffort.native, 'low');
  await assert.rejects(
    runDispatchCli(['execute', 'fake', '--for', 'execute', '--prompt', 'hi', '--effort', 'bogus', '--cwd', root, '--repo-root', root], { returnResult: true }),
    /invalid reasoningEffort "bogus"/,
  );
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
  assert.equal(result.reasoningEffort.native, 'high');
  assert.deepEqual(result.modelWarnings.map((w) => w.code), ['model-reported-different']);
});
