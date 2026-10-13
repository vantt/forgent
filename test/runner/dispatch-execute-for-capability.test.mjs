// `execute <executorId> --for <capability>`: the work names its capability and
// the capability owns the posture. An agent executor declares no `for` of its
// own (it can do any kind of work), so its posture is never inferred from the
// executor; the CLI door refuses an agent dispatch that names no capability, and
// the invocation that runs is the one that can carry the capability's posture.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeExecutorCli, runDispatchCli } from '../../src/runner/dispatch/cli.mjs';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { collectExecutorProfileWarnings } from '../../src/setup/executor-profile-warnings.mjs';

// argv: <invocation marker> <prompt>. Writes "<marker>:<prompt>" so a test can
// tell which invocation ran.
const WORKER_SCRIPT = `
import fs from 'node:fs';
const [marker, prompt = ''] = process.argv.slice(2);
const sleepMs = Number(process.env.FAKE_WORKER_SLEEP_MS ?? 0);
if (sleepMs > 0) await new Promise((r) => setTimeout(r, sleepMs));
fs.writeFileSync('written.txt', marker + ':' + prompt);
console.log('wrote');
`;

function fixtureRepo({ workerEnv, executorPatch = {}, capabilitiesPatch = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-execute-for-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, '.gitignore'), ['worker.mjs', 'written.txt', '.fgos/', ''].join('\n'));
  execFileSync('git', ['add', '.gitignore'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root });
  const script = path.join(root, 'worker.mjs');
  fs.writeFileSync(script, WORKER_SCRIPT);
  const invocation = (id) => ({ id, via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [script, id, '{prompt}'] });
  const runner = {
    modelPolicies: { fake: { standard: 'fake-standard', flagship: 'fake-flagship' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 20000,
    executors: {
      fake: {
        kind: 'agent',
        providerModel: 'fake',
        allowCrossProvider: true,
        invocations: [invocation('first'), invocation('second')],
        ...(workerEnv ? { env: workerEnv } : {}),
        ...executorPatch,
      },
    },
    capabilities: {
      'code:review': {
        description: 'read-only review',
        confinement: { mode: 'required', policy: 'host-write-denied' },
        serves: { outputKind: 'finding', mutates: false },
      },
      execute: {
        description: 'changes files',
        serves: { outputKind: 'change', mutates: true },
      },
      'pinned-write': {
        description: 'a capability that pins the invocation it runs on',
        prefer: [{ executor: 'fake', invocation: 'second' }],
      },
      ...capabilitiesPatch,
    },
  };
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  return { root, runner };
}

const written = (root) => fs.readFileSync(path.join(root, 'written.txt'), 'utf8');

test('a "for" left on an agent executor is inert: the dispatch still runs under the capability it names, and doctor names the leftover', async () => {
  const { root } = fixtureRepo({ executorPatch: { for: ['code:review'] } });
  const result = await executeExecutorCli('fake', { for: 'execute', prompt: 'hello', cwd: root, repoRoot: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(written(root), 'first:hello');
  const warnings = collectExecutorProfileWarnings(loadRunnerConfigFromDir(root));
  assert.ok(warnings.some((w) => w.id === 'executor.fake.agent-for-inert'), JSON.stringify(warnings));
});

test('execute <agent> --for <capability without confinement> runs unconfined on the first cli invocation', async () => {
  const { root } = fixtureRepo();
  const result = await executeExecutorCli('fake', { for: 'execute', prompt: 'hello', tier: 'flagship', cwd: root, repoRoot: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.model, 'fake-flagship');
  assert.equal(written(root), 'first:hello');
  assert.notEqual(result.attestation?.requested?.policyId, 'host-write-denied');
});

test('execute <agent> --for <capability> runs the invocation the capability prefers for that executor', async () => {
  const { root } = fixtureRepo();
  const result = await executeExecutorCli('fake', { for: 'pinned-write', prompt: 'hello', cwd: root, repoRoot: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(written(root), 'second:hello');
});

test('execute <agent> --for <confined capability> refuses before spawning and names both read-only doors', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    executeExecutorCli('fake', { for: 'code:review', prompt: 'hello', cwd: root, repoRoot: root }),
    (err) => {
      assert.equal(err.errorClass, 'posture-needs-assignment');
      assert.match(err.message, /fgos workflow start --units <file>/);
      assert.match(err.message, /execute --contract <file> --executor fake/);
      assert.match(err.message, /by instruction only, without a sandbox/);
      return true;
    },
  );
  assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
});

test('execute <agent> --for refuses an unregistered capability', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    executeExecutorCli('fake', { for: 'no-such-capability', prompt: 'hello', cwd: root, repoRoot: root }),
    (err) => {
      assert.equal(err.errorClass, 'capability-not-registered');
      assert.match(err.message, /not a registered capability/);
      return true;
    },
  );
});

test('dispatch CLI execute <agent> without --for refuses before spawning and names the capabilities to choose from', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    runDispatchCli(['execute', 'fake', '--prompt', 'hello', '--cwd', root, '--repo-root', root], { returnResult: true }),
    (err) => {
      assert.equal(err.errorClass, 'capability-required');
      assert.match(err.message, /--for <capability>/);
      assert.match(err.message, /--for execute/);
      assert.match(err.message, /execute --contract <file> --executor fake/);
      return true;
    },
  );
  assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
});

test('dispatch CLI execute accepts --for next to a positional executor id', async () => {
  const { root } = fixtureRepo();
  const result = await runDispatchCli(
    ['execute', 'fake', '--for', 'execute', '--prompt', 'from-cli', '--cwd', root, '--repo-root', root],
    { returnResult: true },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(written(root), 'first:from-cli');
});

test('dispatch CLI execute --timeout-ms overrides the configured timeout', async () => {
  const { root } = fixtureRepo({ workerEnv: { FAKE_WORKER_SLEEP_MS: '5000' } });
  const started = Date.now();
  const result = await runDispatchCli(
    ['execute', 'fake', '--for', 'execute', '--prompt', 'slow', '--timeout-ms', '500', '--cwd', root, '--repo-root', root],
    { returnResult: true },
  ).catch((err) => err);
  assert.doesNotMatch(String(result?.message ?? ''), /--for|--timeout-ms must be/);
  assert.ok(Date.now() - started < 4500, 'the 500ms override must end the run before the worker finishes');
  assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
  assert.ok(result instanceof Error || result.status !== 0, 'a timed-out run must not report success');
});

test('dispatch CLI execute rejects a non-positive --timeout-ms', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    runDispatchCli(['execute', 'fake', '--for', 'execute', '--timeout-ms', '0', '--cwd', root, '--repo-root', root], { returnResult: true }),
    /--timeout-ms must be a positive integer/,
  );
});
