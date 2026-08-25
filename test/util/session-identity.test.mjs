// session-identity.test.mjs -- tests for resolveWriterIdentity (D6,
// str65-worktree-isolation-enforcement; D9/D15/D16/D17/D18/D25/D28,
// str46-io-contract).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolveWriterIdentity,
  REGISTRY,
  ENV,
  PID,
  UNRESOLVED,
} from '../../src/util/session-identity.mjs';

/** A disposable `.fgos`-shaped directory holding whatever raw sessions.json
 * body a case needs -- including bodies that are not valid JSON at all. */
function mkFgosDir(rawRegistryBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-session-identity-'));
  if (rawRegistryBody !== undefined) {
    fs.writeFileSync(path.join(dir, 'sessions.json'), rawRegistryBody);
  }
  return dir;
}

// tsk-13m: a hung `ps` must not be able to block the caller (and, in
// production, the held cross-process events.lock) forever. Asserts the
// real fix -- a bounded timeout actually reaches execFileSync's options --
// rather than just the pre-existing catch-all behavior around it.
test('ppidOf passes a bounded timeout to execFileSync, so a hung ps command cannot block the caller forever (tsk-13m)', () => {
  let capturedOptions;
  const execFile = (_file, _args, options) => {
    capturedOptions = options;
    return '90\n';
  };
  resolveWriterIdentity(undefined, { env: {}, pid: 100, execFile });
  assert.equal(typeof capturedOptions.timeout, 'number');
  assert.ok(capturedOptions.timeout > 0, 'timeout must be a positive bound, not 0/undefined (no bound)');
  assert.ok(capturedOptions.timeout <= 500, 'timeout must stay a small fraction of events.lock\'s own 2s budget');
});

test('FGOS_SESSION_ID takes precedence over CLAUDE_CODE_SESSION_ID when both set', () => {
  const result = resolveWriterIdentity(undefined, {
    env: { FGOS_SESSION_ID: 'bee-session-1', CLAUDE_CODE_SESSION_ID: 'claude-session-2' },
  });
  assert.deepEqual(result, { id: 'bee-session-1', source: ENV });
});

test('falls back to CLAUDE_CODE_SESSION_ID when FGOS_SESSION_ID is unset', () => {
  const result = resolveWriterIdentity(undefined, { env: { CLAUDE_CODE_SESSION_ID: 'claude-session-2' } });
  assert.deepEqual(result, { id: 'claude-session-2', source: ENV });
});

test('neither env var set falls back to a 3-hop-capped ancestor pid walk', () => {
  const chain = { 100: '90', 90: '80', 80: '70' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid]}\n`;
  };
  const result = resolveWriterIdentity(undefined, { env: {}, pid: 100, execFile });
  assert.deepEqual(result, { id: 70, source: PID });
});

test('empty-string env values are treated as unset, same ancestor walk fallback', () => {
  const chain = { 100: '90', 90: '80', 80: '70' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid]}\n`;
  };
  const result = resolveWriterIdentity(undefined, {
    env: { FGOS_SESSION_ID: '   ', CLAUDE_CODE_SESSION_ID: '' },
    pid: 100,
    execFile,
  });
  assert.deepEqual(result, { id: 70, source: PID });
});

test('walk stops early at pid 1 before exhausting 3 hops', () => {
  const chain = { 50: '1' };
  const execFile = (_file, args) => {
    const pid = Number(args[args.length - 1]);
    return `${chain[pid] ?? '1'}\n`;
  };
  const result = resolveWriterIdentity(undefined, { env: {}, pid: 50, execFile });
  assert.deepEqual(result, { id: 1, source: PID });
});

// D17: the fourth source is a LABEL, never an absent identity. No env value
// was usable and `ps` was unavailable on the very first hop, so no ancestor
// could be walked -- the caller's own pid is still handed back, byte-identical
// to the pre-D9 behaviour, and only `source` records that nothing confirmed it.
test('unresolved keeps the callers own pid when ps fails on the very first hop', () => {
  const execFile = () => {
    throw new Error('ps: command not found');
  };
  const result = resolveWriterIdentity(undefined, { env: {}, pid: 4242, execFile });
  assert.deepEqual(result, { id: 4242, source: UNRESOLVED });
});

test('ps failure after the first successful hop returns the last resolved pid', () => {
  let calls = 0;
  const execFile = () => {
    calls += 1;
    if (calls === 1) return '90\n';
    throw new Error('ps failed mid-walk');
  };
  const result = resolveWriterIdentity(undefined, { env: {}, pid: 100, execFile });
  assert.deepEqual(result, { id: 90, source: PID });
});

// --- D28: the registry CONFIRMS an env-supplied id, it never supplies one ---

test('identity resolves from the session registry when the env id matches a row', () => {
  const fgosDir = mkFgosDir(
    JSON.stringify([
      { sessionId: 'other-session', worktreePath: '/tmp/other', pid: 111 },
      { sessionId: 'session-in-registry', worktreePath: '/tmp/mine', pid: 222 },
    ]),
  );
  const result = resolveWriterIdentity(fgosDir, { env: { FGOS_SESSION_ID: 'session-in-registry' } });
  assert.deepEqual(result, { id: 'session-in-registry', source: REGISTRY });
});

test('an env id absent from the registry keeps the same value but reports env', () => {
  const fgosDir = mkFgosDir(JSON.stringify([{ sessionId: 'someone-else', worktreePath: '/tmp/other', pid: 111 }]));
  const result = resolveWriterIdentity(fgosDir, { env: { FGOS_SESSION_ID: 'not-registered' } });
  assert.deepEqual(result, { id: 'not-registered', source: ENV });
});

test('a registry row is never matched by directory or by row pid', () => {
  const fgosDir = mkFgosDir(
    JSON.stringify([{ sessionId: 'issued-by-fgos', worktreePath: process.cwd(), pid: process.pid }]),
  );
  // Same worktree, same live pid, DIFFERENT session id: two agent processes
  // sharing one worktree must not collapse onto one identity.
  const result = resolveWriterIdentity(fgosDir, { env: { FGOS_SESSION_ID: 'a-different-session' } });
  assert.deepEqual(result, { id: 'a-different-session', source: ENV });
});

// D25: this module reads sessions.json with its own fs and is TOLERANT of
// every shape session.mjs's own reader would throw on -- writeRegistry is a
// non-atomic writeFileSync, so a half-written file is reachable in practice.
const CORRUPT_REGISTRIES = [
  ['no sessions.json at all', undefined],
  ['not valid JSON', 'not-json-at-all{{{'],
  ['a half-written array', '[{"sessionId": "session-corrupt", "worktree'],
  ['a JSON object rather than an array', '{"sessionId": "session-corrupt"}'],
  ['an array of non-objects', '["session-corrupt", null, 7]'],
];

for (const [label, body] of CORRUPT_REGISTRIES) {
  test(`a corrupt registry falls through to env without throwing -- ${label}`, () => {
    const fgosDir = mkFgosDir(body);
    const result = resolveWriterIdentity(fgosDir, { env: { FGOS_SESSION_ID: 'session-corrupt' } });
    assert.deepEqual(result, { id: 'session-corrupt', source: ENV });
  });
}

test('a corrupt registry falls through to env without throwing -- an unreadable fgosDir path', () => {
  const result = resolveWriterIdentity('/definitely/not/a/real/fgos/dir', {
    env: { FGOS_SESSION_ID: 'session-corrupt' },
  });
  assert.deepEqual(result, { id: 'session-corrupt', source: ENV });
});

// D18: an identity outside SESSION_ID_RE (session.mjs:48) plus a length cap
// is DISCARDED at the resolution layer and the next source is tried. This is
// the one input class whose resolved VALUE deliberately changes: today such a
// string is returned verbatim and reaches acquireMainCheckoutLock.
const MALFORMED_ENV_VALUES = [
  ['a path traversal segment', '../../etc/passwd'],
  ['a shell metacharacter', 'session;rm -rf /'],
  ['whitespace inside the value', 'session id with spaces'],
  ['a slash', 'sessions/abc'],
  ['a value past the length ceiling', 'a'.repeat(201)],
];

for (const [label, value] of MALFORMED_ENV_VALUES) {
  test(`a malformed env value falls through to the next source -- ${label}`, () => {
    const chain = { 100: '90', 90: '80', 80: '70' };
    const execFile = (_file, args) => {
      const pid = Number(args[args.length - 1]);
      return `${chain[pid]}\n`;
    };
    const result = resolveWriterIdentity(undefined, {
      env: { FGOS_SESSION_ID: value },
      pid: 100,
      execFile,
    });
    assert.deepEqual(result, { id: 70, source: PID });
  });
}

test('a malformed env value falls through to the next source -- a valid fallback env var is still used', () => {
  const result = resolveWriterIdentity(undefined, {
    env: { FGOS_SESSION_ID: 'bad value/with spaces', CLAUDE_CODE_SESSION_ID: 'claude-session-2' },
  });
  assert.deepEqual(result, { id: 'claude-session-2', source: ENV });
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

    const result = resolveWriterIdentity(undefined, {
      env: {},
      pid: leafPid,
      execFile: (file, args, options) => execFileSync(file, args, { ...options, timeout: 2000 }),
    });
    assert.deepEqual(result, { id: process.pid, source: PID });

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
