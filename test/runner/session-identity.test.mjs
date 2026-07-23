// session-identity.test.mjs -- tests for resolveWriterIdentity (D6,
// str65-worktree-isolation-enforcement).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolveWriterIdentity, SESSION, PID } from '../../src/runner/session-identity.mjs';

test('BEE_SESSION_ID takes precedence over CLAUDE_CODE_SESSION_ID when both set', () => {
  const result = resolveWriterIdentity({
    env: { BEE_SESSION_ID: 'bee-session-1', CLAUDE_CODE_SESSION_ID: 'claude-session-2' },
  });
  assert.deepEqual(result, { identity: 'bee-session-1', kind: SESSION });
});

test('falls back to CLAUDE_CODE_SESSION_ID when BEE_SESSION_ID is unset', () => {
  const result = resolveWriterIdentity({ env: { CLAUDE_CODE_SESSION_ID: 'claude-session-2' } });
  assert.deepEqual(result, { identity: 'claude-session-2', kind: SESSION });
});

test('neither env var set falls back to a 3-hop-capped ancestor pid walk', () => {
  const chain = { 100: '90', 90: '80', 80: '70' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid]}\n`;
  };
  const result = resolveWriterIdentity({ env: {}, pid: 100, execFile });
  assert.deepEqual(result, { identity: 70, kind: PID });
});

test('empty-string env values are treated as unset, same ancestor walk fallback', () => {
  const chain = { 100: '90', 90: '80', 80: '70' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid]}\n`;
  };
  const result = resolveWriterIdentity({
    env: { BEE_SESSION_ID: '   ', CLAUDE_CODE_SESSION_ID: '' },
    pid: 100,
    execFile,
  });
  assert.deepEqual(result, { identity: 70, kind: PID });
});

test('walk stops early at pid 1 before exhausting 3 hops', () => {
  const chain = { 50: '1' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid] ?? '1'}\n`;
  };
  const result = resolveWriterIdentity({ env: {}, pid: 50, execFile });
  assert.deepEqual(result, { identity: 1, kind: PID });
});

test('ps failure on the very first hop falls back to the caller\'s own pid', () => {
  const execFile = () => {
    throw new Error('ps: command not found');
  };
  const result = resolveWriterIdentity({ env: {}, pid: 4242, execFile });
  assert.deepEqual(result, { identity: 4242, kind: PID });
});

test('ps failure after the first successful hop returns the last resolved pid', () => {
  let calls = 0;
  const execFile = () => {
    calls += 1;
    if (calls === 1) return '90\n';
    throw new Error('ps failed mid-walk');
  };
  const result = resolveWriterIdentity({ env: {}, pid: 100, execFile });
  assert.deepEqual(result, { identity: 90, kind: PID });
});

// Real-process test: proves the 3-hop walk reaches the expected ancestor
// against an actual OS process tree, not just a faked ppid lookup. Builds a
// live 3-level chain of spawned node processes (top -> mid -> leaf) below
// this test process (T), so leaf's 3rd ancestor hop is T itself:
//   leaf -> (hop1) mid -> (hop2) top -> (hop3) T
// Each level keeps itself alive (setInterval) until explicitly killed, and
// relays its own pid, plus every descendant's pid, up to T over IPC so the
// test can assert against T's own process.pid and clean up afterward.
//
// Note: with `node -e <script> <arg1> <arg2>`, process.argv has NO filler
// slot for the eval'd script itself -- argv[1]/argv[2] ARE the extra args
// (verified empirically; differs from running a real file, where argv[1]
// is the file path).
test('3-hop walk reaches the real ancestor across a spawned process chain', { timeout: 10_000 }, async () => {
  const CHILD_SCRIPT = `
    const { spawn } = require('node:child_process');
    const depth = Number(process.argv[1]);
    const src = process.argv[2];
    if (depth > 0) {
      const child = spawn(process.execPath, ['-e', src, String(depth - 1), src], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      });
      child.on('message', (chain) => {
        if (process.send) process.send([process.pid, ...chain]);
      });
    } else if (process.send) {
      process.send([process.pid]);
    }
    setInterval(() => {}, 3_600_000);
  `;

  const top = spawn(process.execPath, ['-e', CHILD_SCRIPT, '2', CHILD_SCRIPT], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });

  let chain;
  try {
    chain = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for process chain')), 8000);
      top.once('message', (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      top.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const [topPid, midPid, leafPid] = chain;
    assert.equal(typeof leafPid, 'number');

    const result = resolveWriterIdentity({ env: {}, pid: leafPid });
    assert.deepEqual(result, { identity: process.pid, kind: PID });

    for (const pid of [topPid, midPid, leafPid]) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // already gone -- fine
      }
    }
  } finally {
    top.kill('SIGKILL');
  }
});
