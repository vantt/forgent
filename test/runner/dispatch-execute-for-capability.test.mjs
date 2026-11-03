// The dispatch CLI's `probe-account` door over a fixture repository with one agent executor.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runDispatchCli } from '../../src/runner/dispatch/cli.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

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
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
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
  writeProjectConfig(root, { runner });
  return { root, runner };
}

test('dispatch CLI probe-account rejects a non-positive --timeout-ms', async () => {
  const { root } = fixtureRepo();
  await assert.rejects(
    runDispatchCli(['probe-account', '--provider', 'fake', '--account', 'a1', '--timeout-ms', '0', '--cwd', root, '--repo-root', root], { returnResult: true }),
    /--timeout-ms must be a positive integer/,
  );
});
