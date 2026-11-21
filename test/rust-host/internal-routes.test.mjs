// `fgos internal ...` through the real host binary (FGOS_HOST_BIN, which
// `npm test` builds from this checkout): the routes answer one JSON line,
// a protocol other than the route's own fails closed with exit 3 (host-version-mismatch),
// and `internal` is in neither the route table nor the help manifest.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canonicalJson, computeSha256Digest } from '../../src/native/proof-helpers.mjs';
import { commandManifest } from '../helpers/command-manifest.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTES = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-routes.json'), 'utf8'));
const HOST_BIN = process.env.FGOS_HOST_BIN;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-internal-routes-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function host(args, { env } = {}) {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  const childEnv = { ...process.env, ...env };
  delete childEnv.FGOS_LOCK_FD;
  return spawnSync(HOST_BIN, ['internal', ...args], {
    encoding: 'utf8',
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
  });
}

function line(result) {
  const lines = result.stdout.split('\n').filter((l) => l.trim() !== '');
  assert.equal(lines.length, 1, `one JSON line expected, got ${JSON.stringify(result.stdout)} (stderr ${result.stderr})`);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.v, parsed.protocol);
  return parsed;
}

test('internal is neither a route nor in the command manifest', () => {
  assert.equal(ROUTES.internal, undefined);
  assert.ok(!Object.values(ROUTES).some((r) => r.selector === 'internal'));
  const names = commandManifest().commands.map((c) => c.name);
  assert.ok(names.length > 0);
  assert.ok(!names.includes('internal'), 'help lists internal');
  assert.ok(!names.includes('terminal-control'), 'help lists terminal-control');
  assert.equal(ROUTES['terminal-control'], undefined);
});

test('a protocol other than the route protocol fails closed with exit 3 and host-version-mismatch', () => {
  for (const args of [['lock-fd', '--try'], ['lock-fd', '--protocol', '1', '--try'], ['lock-borrow-vectors', '--protocol', '9'], ['terminal-control', 'capabilities', '--json'], ['terminal-control', 'capabilities', '--protocol', '2', '--json']]) {
    const result = host(args);
    assert.equal(result.status, 3, args.join(' '));
    const parsed = line(result);
    assert.equal(parsed.result, 'error');
    assert.equal(parsed.code, 'host-version-mismatch');
    assert.match(result.stderr, /host-version-mismatch/);
  }
  const unknown = host(['nope', '--protocol', '2']);
  assert.equal(unknown.status, 2);
  assert.equal(line(unknown).code, 'usage');
});

test('source-payload lists the files of a declared payload as one JSON line and refuses another protocol', () => {
  const root = fs.mkdtempSync(path.join(scratch, 'payload-'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ files: ['src'] }));
  fs.writeFileSync(path.join(root, 'src', 'a.mjs'), 'a');
  const ok = host(['source-payload', root, '--protocol', '1']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(line(ok).files, ['package.json', 'src/a.mjs']);
  const mismatch = host(['source-payload', root, '--protocol', '2']);
  assert.equal(mismatch.status, 3);
  assert.equal(line(mismatch).code, 'host-version-mismatch');
});

test('the run supervisor routes fail closed on a protocol other than 1', () => {
  for (const route of ['supervise', 'gate', 'adopt', 'attempt-step']) {
    for (const args of [[route], [route, '--protocol', '2']]) {
      const result = host(args);
      assert.equal(result.status, 3, args.join(' '));
      assert.equal(line(result).code, 'host-version-mismatch');
    }
  }
});

test('the run supervisor routes refuse a missing or unknown flag as usage', () => {
  const missing = host(['supervise', '--protocol', '1']);
  assert.equal(missing.status, 2);
  const unknown = host(['supervise', '--protocol', '1', '--envelope', '/x', '--wat', '1']);
  assert.equal(unknown.status, 2);
});

function writeEnvelope(dir, stepIds) {
  const steps = stepIds.map((stepId) => ({ stepId, hostBin: HOST_BIN, payloadRoot: path.join(dir, 'payload'), argv: [], cwd: dir, env: {}, stepTimeoutMs: 1000 }));
  const envelope = {
    v: 3, attemptId: 'att-routes', unitRunId: 'u', runDir: dir, mode: 'direct', protocolId: 1,
    hostBin: HOST_BIN, payloadRoot: path.join(dir, 'payload'), cwd: dir, mutation: 'read-only', steps,
  };
  envelope.digest = computeSha256Digest(canonicalJson(envelope));
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify(envelope));
}

test('attempt-step runs the step from the engine in the host, with no Node payload, and passes its exit code on', () => {
  const dir = fs.mkdtempSync(path.join(scratch, 'step-'));
  const stateRoot = fs.mkdtempSync(path.join(scratch, 'state-'));
  writeEnvelope(dir, ['settle-attempt', 'cleanup-trust']);
  const env = { FGOS_STATE_ROOT: stateRoot, HOME: scratch, USERPROFILE: scratch };

  const done = host(['attempt-step', 'cleanup-trust', '--protocol', '1', '--run-dir', dir], { env });
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(line(done), { v: 1, protocol: 1, result: 'done', detail: { trust: 'none-written' } });

  const failed = host(['attempt-step', 'settle-attempt', '--protocol', '1', '--run-dir', dir], { env });
  assert.equal(failed.status, 70, failed.stderr);
  assert.equal(line(failed).code, 'io');
});
