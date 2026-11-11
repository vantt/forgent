// The paseo carrier of an external attempt (src/runner/dispatch/paseo-launch.mjs): what it asks paseo,
// which agent mode it asks for, the link paseo's provider runs and the brief the agent answers. The
// attempt around it (envelope, supervisor, gate) is proven in test/run-supervisor; paseo itself is
// replaced by an injected runner here.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  MAX_PROMPT_BYTES, createPaseoCarrier, execLinkPath, paseoModeFor, paseoRunArgs, refreshExecLink, writeExternalBrief,
} from '../../src/runner/dispatch/paseo-launch.mjs';

function scratch(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('the agent is asked of provider fgos-<cli> with the attempt directory in FGOS_ATTEMPT_DIR, and a confined Codex runs without its own sandbox', () => {
  assert.deepEqual(
    paseoRunArgs({ cli: 'codex', mode: 'full-access', attemptDir: '/runs/01', cwd: '/wt', title: 'run-1 fix', prompt: 'brief' }),
    ['run', '--no-wait', '--json', '--provider', 'fgos-codex', '--mode', 'full-access', '--env', 'FGOS_ATTEMPT_DIR=/runs/01', '--cwd', '/wt', '--title', 'run-1 fix', 'brief'],
  );
  assert.equal(paseoRunArgs({ cli: 'pi', mode: null, attemptDir: '/r', cwd: '/c', title: 't', prompt: 'p' }).includes('--mode'), false, 'no mode: the provider default');
  assert.equal(paseoModeFor('codex', { confined: true }), 'full-access');
  assert.equal(paseoModeFor('codex', { confined: false }), null, 'unconfined, the CLI keeps its own sandbox');
  assert.throws(() => paseoModeFor('agy', { confined: true }), (err) => err.code === 'external-confined-mode-unknown');
});

test('the carrier returns the agent id paseo printed, refuses by name when paseo does not start it or the brief cannot be one argument, and archives the agent after its turn', async () => {
  const calls = [];
  const answers = [
    { status: 0, stdout: 'Created workspace\n{\n  "agentId": "agent-1",\n  "status": "running"\n}\n', stderr: '' },
    { status: 1, stdout: '', stderr: "Provider 'fgos-codex' is not available" },
    { status: 0, stdout: '', stderr: '' },
    { status: 0, stdout: '', stderr: '' },
  ];
  const carrier = createPaseoCarrier({ env: { FGOS_PASEO_BIN: '/opt/paseo' }, runner: async (bin, args) => { calls.push([bin, ...args]); return answers.shift(); } });
  const start = { cli: 'codex', mode: null, attemptDir: '/r', cwd: '/c', title: 't', prompt: 'p' };
  assert.equal(await carrier.start(start), 'agent-1');
  await assert.rejects(carrier.start(start), (err) => err.code === 'external-host-refused' && /not available/.test(err.message));
  await assert.rejects(carrier.start({ ...start, prompt: 'x'.repeat(MAX_PROMPT_BYTES + 1) }), (err) => err.code === 'external-brief-too-large');
  assert.equal(calls.length, 2, 'an oversized brief never reaches paseo');
  assert.deepEqual(await carrier.closeWhenDone('agent-1', { timeoutMs: 90_500, cwd: '/c' }), { waited: 0, archived: 0 });
  assert.deepEqual(calls.slice(2), [['/opt/paseo', 'wait', 'agent-1', '--timeout', '91s'], ['/opt/paseo', 'agent', 'archive', 'agent-1']]);
});

test('the fgos-exec-<cli> link under the state root points at the attempt host and is replaced, never left pointing at another release', (t) => {
  const root = scratch(t, 'fgos-paseo-link-');
  const link = refreshExecLink({ stateRoot: root, cli: 'codex', hostBin: '/releases/a/bin/fgos' });
  assert.equal(link, execLinkPath(root, 'codex'));
  assert.equal(path.basename(link), 'fgos-exec-codex');
  assert.equal(fs.readlinkSync(link), '/releases/a/bin/fgos');
  refreshExecLink({ stateRoot: root, cli: 'codex', hostBin: '/releases/b/bin/fgos' });
  assert.equal(fs.readlinkSync(link), '/releases/b/bin/fgos');
  assert.deepEqual(fs.readdirSync(path.dirname(link)), ['fgos-exec-codex'], 'no staged link is left behind');
});

test('the brief names the outbox claim the agent answers in, and a result already there refuses the attempt', (t) => {
  const runDir = scratch(t, 'fgos-paseo-brief-');
  const brief = writeExternalBrief({ runDir, prompt: 'Say hello.', runId: 'run-1', attemptId: 'att-1', effectiveContract: null });
  assert.equal(brief.outboxDir, path.join(runDir, 'outbox'));
  assert.equal(fs.readFileSync(brief.briefPath, 'utf8'), brief.text);
  assert.match(brief.text, /Say hello\./);
  assert.ok(brief.text.includes(path.join(runDir, 'outbox', 'result-1.json')), 'the agent is told where its claim goes');
  fs.writeFileSync(path.join(runDir, 'outbox', 'result-1.json'), '{}');
  assert.throws(
    () => writeExternalBrief({ runDir, prompt: 'again', runId: 'run-1', attemptId: 'att-2', effectiveContract: null }),
    (err) => err.code === 'invalid-config' && err.reason === 'stale-result-in-run-dir',
  );
});
