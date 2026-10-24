// The friction client builds argv from what the caller passed and leaves every
// value list, default and validation to the Rust host. These tests drive it
// against a stand-in host that records its argv and stdin and answers as told.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recordFriction, resolveFriction } from '../../src/observe/friction-client.mjs';

function standInHost(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-friction-client-'));
  const bin = path.join(dir, 'host.sh');
  fs.writeFileSync(
    bin,
    [
      '#!/bin/sh',
      'printf "%s\\n" "$@" > "$STAND_IN_ARGV"',
      'cat > "$STAND_IN_STDIN"',
      'if [ -n "$STAND_IN_STDERR" ]; then echo "$STAND_IN_STDERR" >&2; exit 1; fi',
      'echo \'{"contract":"fgos.v1","data":{"ok":true}}\'',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  const saved = { ...process.env };
  Object.assign(process.env, {
    FGOS_HOST_BIN: bin,
    STAND_IN_ARGV: path.join(dir, 'argv'),
    STAND_IN_STDIN: path.join(dir, 'stdin'),
  });
  delete process.env.STAND_IN_STDERR;
  t.after(() => {
    for (const key of ['FGOS_HOST_BIN', 'STAND_IN_ARGV', 'STAND_IN_STDIN', 'STAND_IN_STDERR']) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const root = path.join(dir, 'root');
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return {
    root,
    argv: () => fs.readFileSync(process.env.STAND_IN_ARGV, 'utf8').trim().split('\n'),
    stdin: () => fs.readFileSync(process.env.STAND_IN_STDIN, 'utf8'),
  };
}

test('record and resolve pass exactly what the caller supplied, with the one producer default', (t) => {
  const host = standInHost(t);
  recordFriction(host.root, { id: 'tsk-1', layer: 'verification', errorClass: 'usage', disposition: 'blocked', detail: 'why', attempts: 2 });
  assert.deepEqual(host.argv().slice(0, -2), [
    'friction', 'record', '--subject', 'work:tsk-1', '--layer', 'verification', '--error-class', 'usage',
    '--disposition', 'blocked', '--producer', 'work', '--attempts', '2', '--detail-stdin',
  ]);
  assert.equal(host.stdin(), 'why');

  recordFriction({ dir: host.root, id: 'tsk-2' });
  assert.ok(!host.argv().includes('--layer'), 'a missing layer is the host\'s to refuse, not the client\'s to default');

  resolveFriction(host.root, { id: 'tsk-1', reason: 'done', by: 'work' });
  assert.deepEqual(host.argv().slice(0, 8), ['friction', 'resolve', '--subject', 'work:tsk-1', '--reason', 'done', '--by', 'work']);
});

test('a refusal of the caller\'s input is rethrown as a validation StoreError', (t) => {
  const host = standInHost(t);
  process.env.STAND_IN_STDERR = 'fgos: error: invocation failed: provider failed: friction-invalid-input: invalid layer "nope"';
  assert.throws(
    () => recordFriction(host.root, { id: 'tsk-1', layer: 'nope', errorClass: 'e', disposition: 'advisory' }),
    (err) => err.name === 'StoreError' && err.category === 'validation' && err.message === 'invalid layer "nope"',
  );
  assert.throws(() => resolveFriction(host.root, {}), (err) => err.category === 'validation');
});

test('any other host failure warns and returns null instead of throwing into the workflow', (t) => {
  const host = standInHost(t);
  process.env.STAND_IN_STDERR = 'fgos: error: invocation failed: provider failed: observe-lock-timeout: timed out';
  const warnings = [];
  t.mock.method(console, 'error', (line) => warnings.push(line));
  assert.equal(recordFriction(host.root, { id: 'tsk-1', layer: 'state', errorClass: 'e', disposition: 'advisory' }), null);
  assert.match(warnings.join('\n'), /friction write failed \[host-exec-error\].*observe-lock-timeout/);
});
