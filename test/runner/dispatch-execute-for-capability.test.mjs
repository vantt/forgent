// `execute <executorId> --for <capability>`: a caller that names an executor
// can also name the capability the dispatch serves, so a multi-purpose
// executor (one that declares both read-only and writing capabilities) runs
// under the posture of the work actually handed to it. Without `--for`, the
// posture is still inferred from the executor's own `for` list, strictest
// first, exactly as before.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeExecutorCli, runDispatchCli } from '../../src/runner/dispatch/cli.mjs';

const WORKER_SCRIPT = `
import fs from 'node:fs';
const prompt = process.argv[2] ?? '';
const sleepMs = Number(process.env.FAKE_WORKER_SLEEP_MS ?? 0);
if (sleepMs > 0) await new Promise((r) => setTimeout(r, sleepMs));
fs.writeFileSync('written.txt', prompt);
console.log('wrote');
`;

function fixtureRepo({ workerEnv } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-execute-for-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, '.gitignore'), ['worker.mjs', 'written.txt', '.fgos/', ''].join('\n'));
  execFileSync('git', ['add', '.gitignore'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root });
  fs.writeFileSync(path.join(root, 'worker.mjs'), WORKER_SCRIPT);
  const runner = {
    modelPolicies: { fake: { standard: 'fake-standard', flagship: 'fake-flagship' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 20000,
    executors: {
      fake: {
        kind: 'agent',
        providerModel: 'fake',
        allowCrossProvider: true,
        for: ['code:review', 'execute'],
        command: process.execPath,
        args: [path.join(root, 'worker.mjs'), '{prompt}'],
        ...(workerEnv ? { env: workerEnv } : {}),
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
      'code:test': { description: 'not declared by fake' },
    },
  };
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  return { root, runner };
}

test('execute <executor> --for <capability> runs under that capability, not the strictest one the executor declares', async () => {
  const { root } = fixtureRepo();
  const result = await executeExecutorCli('fake', {
    for: 'execute',
    prompt: 'hello',
    tier: 'flagship',
    cwd: root,
    repoRoot: root,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.model, 'fake-flagship');
  assert.equal(fs.readFileSync(path.join(root, 'written.txt'), 'utf8'), 'hello');
  assert.notEqual(result.attestation?.requested?.policyId, 'host-write-denied');
});

test('execute <executor> without --for still takes the strictest capability the executor declares', async () => {
  const { root } = fixtureRepo();
  let result;
  try {
    result = await executeExecutorCli('fake', { prompt: 'hello', cwd: root, repoRoot: root });
  } catch (err) {
    // No confinement backend is declared for the fixture executor, so a
    // required policy may be refused outright -- also a fail-closed outcome.
    assert.equal(err.errorClass, 'confinement-policy-error', err.message);
    assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
    return;
  }
  assert.equal(result.attestation?.requested?.policyId, 'host-write-denied');
});

test('execute <executor> --for refuses a capability the executor does not declare, before spawning', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    executeExecutorCli('fake', { for: 'code:test', prompt: 'hello', cwd: root, repoRoot: root }),
    (err) => {
      assert.equal(err.errorClass, 'capability-not-served');
      assert.match(err.message, /"fake" does not serve capability "code:test"/);
      return true;
    },
  );
  assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
});

test('execute <executor> --for refuses an unregistered capability', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    executeExecutorCli('fake', { for: 'no-such-capability', prompt: 'hello', cwd: root, repoRoot: root }),
    (err) => {
      assert.equal(err.errorClass, 'capability-not-served');
      assert.match(err.message, /not a registered capability/);
      return true;
    },
  );
});

test('dispatch CLI execute accepts --for next to a positional executor id', async () => {
  const { root } = fixtureRepo();
  const result = await runDispatchCli(
    ['execute', 'fake', '--for', 'execute', '--prompt', 'from-cli', '--cwd', root, '--repo-root', root],
    { returnResult: true },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(root, 'written.txt'), 'utf8'), 'from-cli');
});

test('dispatch CLI execute --timeout-ms overrides the configured timeout', async () => {
  const { root } = fixtureRepo({ workerEnv: { FAKE_WORKER_SLEEP_MS: '5000' } });
  const started = Date.now();
  const result = await runDispatchCli(
    ['execute', 'fake', '--for', 'execute', '--prompt', 'slow', '--timeout-ms', '500', '--cwd', root, '--repo-root', root],
    { returnResult: true },
  ).catch((err) => err);
  assert.doesNotMatch(String(result?.message ?? ''), /no longer supported|--timeout-ms must be/);
  assert.ok(Date.now() - started < 4500, 'the 500ms override must end the run before the worker finishes');
  assert.equal(fs.existsSync(path.join(root, 'written.txt')), false);
  assert.ok(result instanceof Error || result.status !== 0, 'a timed-out run must not report success');
});

test('dispatch CLI execute rejects a non-positive --timeout-ms', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    runDispatchCli(['execute', 'fake', '--timeout-ms', '0', '--cwd', root, '--repo-root', root], { returnResult: true }),
    /--timeout-ms must be a positive integer/,
  );
});
