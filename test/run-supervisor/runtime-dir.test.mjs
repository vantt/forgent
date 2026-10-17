import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolveRuntimeSocketDir,
  ensureRuntimeSocketDir,
  RuntimeDirError,
  SOCKET_PATH_MAX_BYTES,
} from '../../src/run-supervisor/runtime-dir.mjs';

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rtdir-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('the directory is under XDG_RUNTIME_DIR when set, else /tmp/fgos-<uid>', () => {
  assert.equal(resolveRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: '/run/user/1234' }, uid: 1234 }), '/run/user/1234/fgos');
  assert.equal(resolveRuntimeSocketDir({ env: {}, uid: 1234 }), '/tmp/fgos-1234');
  assert.equal(resolveRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: 'relative' }, uid: 7 }), '/tmp/fgos-7');
});

test('ensure creates the directory 0700 owned by the user, and a socket path fits sun_path', (t) => {
  const root = scratch(t);
  const dir = ensureRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: root } });
  const st = fs.statSync(dir);
  assert.equal(st.mode & 0o777, 0o700);
  assert.equal(st.uid, process.getuid());
  const socket = path.join(dir, `${'a'.repeat(16)}.sock`);
  assert.ok(Buffer.byteLength(socket) <= SOCKET_PATH_MAX_BYTES, `${socket} is ${Buffer.byteLength(socket)} bytes`);
});

test('ensure refuses a directory open to group or other', (t) => {
  const root = scratch(t);
  const dir = path.join(root, 'fgos');
  fs.mkdirSync(dir, { mode: 0o755 });
  fs.chmodSync(dir, 0o755);
  assert.throws(() => ensureRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: root } }), (e) => e instanceof RuntimeDirError && e.code === 'runtime-dir-permissions');
});

test('ensure refuses a path that leaves no room for a socket name', (t) => {
  const root = scratch(t);
  const long = path.join(root, 'x'.repeat(90));
  assert.throws(() => ensureRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: long } }), (e) => e.code === 'runtime-dir-too-long');
});
