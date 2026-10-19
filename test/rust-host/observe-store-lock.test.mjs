// The observe store lock is one kernel lock file shared by Node (holder-lock facade) and the Rust
// `fgos` host: a Node holder must make `fgos metrics case open` wait, then time out by name, and a
// holder that ends frees the lock at once.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { holdLock } from './fgctl-lock-holder.mjs';

const HOST = process.env.FGOS_HOST_BIN;

function runCaseOpen(root, name) {
  const env = { ...process.env };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID']) delete env[key];
  const child = spawn(HOST, ['metrics', 'case', 'open', name, '--harness', 'plain', '--dir', root], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  return new Promise((resolve) => child.once('exit', (code) => resolve({ code, out })));
}

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-observe-lock-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return root;
}

test('a Node holder of observe makes the Rust command wait, then time out by name', { skip: !HOST }, async () => {
  const root = tempRoot();
  const holder = await holdLock('observe', { fgosDir: path.join(root, '.fgos') });
  try {
    const started = Date.now();
    const res = await runCaseOpen(root, 'held-case');
    const waited = Date.now() - started;
    assert.notEqual(res.code, 0, res.out);
    assert.match(res.out, /observe-lock-timeout/);
    assert.ok(waited >= 4500, `must wait for the kernel lock before giving up: ${waited} ms`);
  } finally {
    await holder.kill();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the Rust command takes the lock right after a Node holder is killed', { skip: !HOST }, async () => {
  const root = tempRoot();
  const holder = await holdLock('observe', { fgosDir: path.join(root, '.fgos') });
  try {
    const pending = runCaseOpen(root, 'freed-case');
    await new Promise((resolve) => setTimeout(resolve, 700));
    await holder.kill();
    const started = Date.now();
    const res = await pending;
    assert.equal(res.code, 0, res.out);
    assert.ok(Date.now() - started < 3000, 'a killed holder must not cost an expiry window');
    assert.ok(fs.existsSync(path.join(root, '.fgos', 'observe', 'cases')) || fs.existsSync(path.join(root, '.fgos', 'observe')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
