// fgos-gateway.test.mjs -- tsk-31v: CLI-dispatch coverage for `fgos gateway
// <start|stop|status>` (the one-door lifecycle for the herdr-fgos gateway
// process). The underlying logic (registry read/write, PID liveness, real
// HTTP reachability, real SIGTERM delivery) is covered by
// test/runner/gateway-control.test.mjs -- this file only proves the CLI
// dispatch layer itself: sub-verb parsing, exit codes, and the JSON
// envelope shape. `start` is deliberately NOT exercised here (it shells out
// to a real `cargo build --release`, too slow for this file's fast-CLI
// contract) -- covered instead by test/runner/gateway-control.test.mjs's
// unit tests and a real manual end-to-end run (tsk-31v's own plan.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gateway-cli-'));
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  return cwd;
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

test('fgos gateway with no sub-verb is a validation error naming the usage', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gateway']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /gateway requires a sub-verb: fgos gateway <start\|stop\|status>/);
});

test('fgos gateway with an unknown sub-verb is a validation error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gateway', 'restart']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown gateway sub-verb "restart"/);
});

test('fgos gateway status on a fresh repo (no gateway.json yet) reports not running, exits 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gateway', 'status']);
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.deepEqual(envelope.data, { running: false, reachable: false });
});

test('fgos gateway stop on a fresh repo (nothing running) reports alreadyStopped, exits 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gateway', 'stop']);
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.deepEqual(envelope.data, { alreadyStopped: true });
});

test('fgos gateway start on a repo with no herdr-plugin/ directory is a real, named refusal', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gateway', 'start']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no herdr-plugin\/ directory found/);
});

test('fgos --help --json lists gateway with its start|stop|status sub-verb enum', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'gateway');
  assert.ok(entry, 'gateway missing from --help --json manifest');
  assert.deepEqual(entry.parameters.properties.sub.enum, ['start', 'stop', 'status']);
});
