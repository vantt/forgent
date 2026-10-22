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
import { canonicalJson, computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';

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

test('internal is neither a route nor in the help manifest', () => {
  assert.equal(ROUTES.internal, undefined);
  assert.ok(!Object.values(ROUTES).some((r) => r.selector === 'internal'));
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  const help = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), '--help', '--json'], { cwd: scratch, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(help.status, 0, help.stderr);
  const names = JSON.parse(help.stdout).commands.map((c) => c.name);
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

function writeEnvelope(dir, overrides = {}) {
  const envelope = {
    v: 3, attemptId: 'att-routes', unitRunId: 'u', runDir: dir, mode: 'direct', protocolId: 1,
    hostBin: HOST_BIN, payloadRoot: path.join(dir, 'payload'), cwd: dir, mutation: 'read-only',
    steps: [{ stepId: 'settle-attempt', hostBin: HOST_BIN, payloadRoot: path.join(dir, 'payload'), argv: [], cwd: dir, env: {}, stepTimeoutMs: 1000 }],
    ...overrides,
  };
  envelope.digest = computeSha256Digest(canonicalJson(envelope));
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify(envelope));
}

test('attempt-step refuses a tampered envelope, a foreign host binary and a missing payload', () => {
  const dir = fs.mkdtempSync(path.join(scratch, 'step-'));
  writeEnvelope(dir);
  const missing = host(['attempt-step', 'settle-attempt', '--protocol', '1', '--run-dir', dir]);
  assert.equal(missing.status, 66, missing.stderr);
  assert.equal(line(missing).code, 'payload-missing');

  const foreign = fs.mkdtempSync(path.join(scratch, 'step-'));
  writeEnvelope(foreign, { hostBin: process.execPath });
  const mismatch = host(['attempt-step', 'settle-attempt', '--protocol', '1', '--run-dir', foreign]);
  assert.equal(mismatch.status, 3);
  assert.equal(line(mismatch).code, 'host-version-mismatch');

  const tampered = fs.mkdtempSync(path.join(scratch, 'step-'));
  writeEnvelope(tampered);
  const file = path.join(tampered, 'envelope.json');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('att-routes', 'att-other'));
  const invalid = host(['attempt-step', 'settle-attempt', '--protocol', '1', '--run-dir', tampered]);
  assert.equal(invalid.status, 65);
  assert.equal(line(invalid).code, 'envelope-invalid');
});

test('attempt-step hands over to the Node payload of the envelope and passes its exit code on', () => {
  const dir = fs.mkdtempSync(path.join(scratch, 'step-'));
  const entry = path.join(dir, 'payload', 'src', 'run-supervisor');
  fs.mkdirSync(entry, { recursive: true });
  fs.writeFileSync(path.join(entry, 'attempt-step.mjs'), "console.log(JSON.stringify({ result: 'retry', reason: process.argv[2] })); process.exit(75);\n");
  writeEnvelope(dir);
  const result = host(['attempt-step', 'settle-attempt', '--protocol', '1', '--run-dir', dir]);
  assert.equal(result.status, 75, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.trim()), { result: 'retry', reason: 'settle-attempt' });
});
