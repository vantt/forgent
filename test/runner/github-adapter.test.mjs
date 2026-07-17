import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  classifyGhFailure,
  createGitHubPR,
  viewGitHubPRStatus,
  mergeGitHubPR,
} from '../../src/runner/github-adapter.mjs';

// Fake `gh` executors only. Every "gh" invoked here is a short-lived node
// script this file writes to a mkdtemp dir with a `#!/usr/bin/env node`
// shebang + chmod 0o755, passed as opts.ghCommand so the module's gh() helper
// execs it DIRECTLY as a binary (unlike dispatch.test.mjs, which runs its
// fakes through `spawn(process.execPath, [scriptPath])`). No real `gh` binary
// is ever invoked and no network call is ever made.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gh-adapter-test-'));
}

/** Write an executable fake gh script (shebang + chmod 0o755) and return its
 * path. `body` is CommonJS (the file is `.cjs`) so it can require('fs'). */
function writeFakeGh(dir, name, body) {
  const scriptPath = path.join(dir, name);
  fs.writeFileSync(scriptPath, `#!/usr/bin/env node\n${body}\n`);
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}

const SETTLED_VIEW = JSON.stringify({
  state: 'OPEN',
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  mergedAt: null,
  closed: false,
  closedAt: null,
});

/** A fake that logs each invocation's argv to `logPath`, then for `pr create`
 * prints the real observed URL shape and exits 0. */
function writeCreateFake(dir, logPath, prNumber) {
  return writeFakeGh(
    dir,
    'gh-create.cjs',
    `const fs = require('fs');
fs.appendFileSync(${JSON.stringify(logPath)}, process.argv.slice(2).join(' ') + '\\n');
process.stdout.write('https://github.com/vantt/forgent/pull/${prNumber}\\n');
process.exit(0);`,
  );
}

/** A fake that exits 1 with S1's real auth-failure stderr on ANY call. */
function writeAuthFailFake(dir) {
  return writeFakeGh(
    dir,
    'gh-auth-fail.cjs',
    `process.stderr.write('HTTP 401: Bad credentials (https://api.github.com/graphql)\\nTry authenticating with:  gh auth login -h github.com\\n');
process.exit(1);`,
  );
}

/** A stateful view fake: reads/increments a counter file so its Nth
 * invocation returns mergeable:"UNKNOWN" until `settleAfter`, then settled —
 * proving the poll loop actually re-invokes gh across fresh processes. */
function writeStatefulViewFake(dir, counterPath, settleAfter) {
  return writeFakeGh(
    dir,
    'gh-stateful-view.cjs',
    `const fs = require('fs');
const counterPath = ${JSON.stringify(counterPath)};
let n = 0;
try { n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) || 0; } catch {}
n += 1;
fs.writeFileSync(counterPath, String(n));
const settled = n >= ${settleAfter};
process.stdout.write(JSON.stringify({
  state: 'OPEN',
  mergeable: settled ? 'MERGEABLE' : 'UNKNOWN',
  mergeStateStatus: settled ? 'CLEAN' : 'UNKNOWN',
  mergedAt: null,
  closed: false,
  closedAt: null,
}));
process.exit(0);`,
  );
}

/** A fake that always reports mergeable:"UNKNOWN" — for exercising the
 * poll-budget-exhausted (never-hang) path. */
function writeAlwaysUnknownViewFake(dir) {
  return writeFakeGh(
    dir,
    'gh-always-unknown.cjs',
    `process.stdout.write(JSON.stringify({
  state: 'OPEN',
  mergeable: 'UNKNOWN',
  mergeStateStatus: 'UNKNOWN',
  mergedAt: null,
  closed: false,
  closedAt: null,
}));
process.exit(0);`,
  );
}

/** A fake serving both `pr view` (settled) and `pr merge` (exit `mergeExit`,
 * with `mergeStderr` on failure). */
function writeMergeFake(dir, mergeExit, mergeStderr = '') {
  return writeFakeGh(
    dir,
    'gh-merge.cjs',
    `const args = process.argv.slice(2);
if (args[0] === 'pr' && args[1] === 'view') {
  process.stdout.write(${JSON.stringify(SETTLED_VIEW)});
  process.exit(0);
}
if (args[0] === 'pr' && args[1] === 'merge') {
  ${mergeExit === 0
    ? "process.stdout.write('Merged pull request'); process.exit(0);"
    : `process.stderr.write(${JSON.stringify(mergeStderr)}); process.exit(${mergeExit});`}
}
process.stderr.write('unexpected fake gh invocation: ' + args.join(' '));
process.exit(2);`,
  );
}

// --- classifyGhFailure: pure, stderr-driven, never gates on exit code 4 ----

test('classifyGhFailure maps HTTP 401 stderr at exit 1 to auth-failure (S1: not exit 4)', () => {
  assert.equal(
    classifyGhFailure({ status: 1, stderr: 'HTTP 401: Bad credentials (https://api.github.com/graphql)' }),
    'auth-failure',
  );
});

test('classifyGhFailure maps "Bad credentials" stderr to auth-failure regardless of exit code', () => {
  assert.equal(classifyGhFailure({ status: 1, stderr: 'gh: Bad credentials' }), 'auth-failure');
  // Even if gh ever DID exit 4, the stderr text still decides — exit 4 is not
  // treated as a distinct signal, and its absence does not hide a 401.
  assert.equal(classifyGhFailure({ status: 4, stderr: 'HTTP 401: Bad credentials' }), 'auth-failure');
});

test('classifyGhFailure maps a rate-limit stderr to rate-limited', () => {
  assert.equal(classifyGhFailure({ status: 1, stderr: 'API rate limit exceeded for user' }), 'rate-limited');
});

test('classifyGhFailure maps a connectivity stderr to unreachable', () => {
  assert.equal(
    classifyGhFailure({ status: 1, stderr: 'dial tcp: lookup api.github.com: no such host' }),
    'unreachable',
  );
});

test('classifyGhFailure buckets anything else (incl. gh missing/ENOENT) as gh-invocation-failed', () => {
  assert.equal(classifyGhFailure({ status: 1, stderr: 'some other gh error' }), 'gh-invocation-failed');
  assert.equal(classifyGhFailure({ status: undefined, stderr: undefined }), 'gh-invocation-failed');
});

// --- createGitHubPR --------------------------------------------------------

test('createGitHubPR resolves created+prNumber on success and runs no git push', async () => {
  const dir = mkTempDir();
  const logPath = path.join(dir, 'invocations.log');
  const ghCommand = writeCreateFake(dir, logPath, 42);

  const result = await createGitHubPR(
    mkTempDir(),
    { head: 'fgw/item-x', base: 'main', title: 'T', body: 'B' },
    { ghCommand },
  );

  assert.deepEqual(result, { outcome: 'created', step: 'create', prNumber: 42 });

  const log = fs.readFileSync(logPath, 'utf8').trim();
  assert.equal(log.split('\n').length, 1, 'exactly one gh invocation — no extra calls');
  assert.ok(log.startsWith('pr create'), `expected a single "pr create" call, got: ${log}`);
  assert.ok(!log.includes('push'), 'createGitHubPR must not push the branch itself');
});

test('createGitHubPR resolves blocked/create (not throw) when gh fails', async () => {
  const ghCommand = writeAuthFailFake(mkTempDir());
  const result = await createGitHubPR(
    mkTempDir(),
    { head: 'fgw/item-x', base: 'main', title: 'T', body: 'B' },
    { ghCommand },
  );
  assert.equal(result.outcome, 'blocked');
  assert.equal(result.step, 'create');
  assert.equal(result.reason, 'auth-failure');
});

test('createGitHubPR rejects only for a caller programming error (missing args)', async () => {
  await assert.rejects(() => createGitHubPR(mkTempDir(), { base: 'main', title: 'T' }, {}), TypeError);
});

// --- viewGitHubPRStatus ----------------------------------------------------

test('viewGitHubPRStatus polls past UNKNOWN and resolves the settled value', async () => {
  const dir = mkTempDir();
  const counterPath = path.join(dir, 'counter');
  const ghCommand = writeStatefulViewFake(dir, counterPath, 2); // UNKNOWN on call 1, settled on call 2

  const result = await viewGitHubPRStatus(mkTempDir(), 7, {
    ghCommand,
    pollIntervalMs: 5,
    pollTimeoutMs: 2000,
  });

  assert.equal(result.outcome, 'viewed');
  assert.equal(result.step, 'status');
  assert.equal(result.prNumber, 7);
  assert.equal(result.mergeable, 'MERGEABLE');
  const invocations = parseInt(fs.readFileSync(counterPath, 'utf8'), 10);
  assert.ok(invocations >= 2, `expected the poll loop to re-invoke gh (>=2), got ${invocations}`);
});

test('viewGitHubPRStatus resolves the last-seen value when the poll budget is exhausted (never hangs)', async () => {
  const ghCommand = writeAlwaysUnknownViewFake(mkTempDir());
  const result = await viewGitHubPRStatus(mkTempDir(), 9, {
    ghCommand,
    pollIntervalMs: 5,
    pollTimeoutMs: 30,
  });
  assert.equal(result.outcome, 'viewed');
  assert.equal(result.mergeable, 'UNKNOWN');
});

test('viewGitHubPRStatus resolves blocked/status (not throw) when gh fails', async () => {
  const ghCommand = writeAuthFailFake(mkTempDir());
  const result = await viewGitHubPRStatus(mkTempDir(), 5, { ghCommand, pollIntervalMs: 5, pollTimeoutMs: 100 });
  assert.equal(result.outcome, 'blocked');
  assert.equal(result.step, 'status');
  assert.equal(result.reason, 'auth-failure');
});

// --- mergeGitHubPR ---------------------------------------------------------

test('mergeGitHubPR resolves merged/merge when the merge call exits 0', async () => {
  const ghCommand = writeMergeFake(mkTempDir(), 0);
  const result = await mergeGitHubPR(mkTempDir(), 3, { ghCommand, pollIntervalMs: 5, pollTimeoutMs: 200 });
  assert.deepEqual(result, { outcome: 'merged', step: 'merge', prNumber: 3 });
});

test('mergeGitHubPR resolves blocked/merge (never a distinct conflict outcome) on a merge failure', async () => {
  const ghCommand = writeMergeFake(mkTempDir(), 1, 'failed to merge: the base branch has changed');
  const result = await mergeGitHubPR(mkTempDir(), 3, { ghCommand, pollIntervalMs: 5, pollTimeoutMs: 200 });
  assert.equal(result.outcome, 'blocked');
  assert.notEqual(result.outcome, 'conflict');
  assert.equal(result.step, 'merge');
  assert.equal(result.reason, 'gh-invocation-failed');
});

test('mergeGitHubPR reports step:status when its internal status read fails (not step:merge)', async () => {
  const ghCommand = writeAuthFailFake(mkTempDir()); // fails the internal `pr view` first
  const result = await mergeGitHubPR(mkTempDir(), 3, { ghCommand, pollIntervalMs: 5, pollTimeoutMs: 100 });
  assert.equal(result.outcome, 'blocked');
  assert.equal(result.step, 'status');
  assert.equal(result.reason, 'auth-failure');
});

// --- module-level invariant: no 'conflict' outcome anywhere ----------------

test("github-adapter.mjs resolves no 'conflict' outcome anywhere (cell C2 scope cut)", () => {
  const source = fs.readFileSync(
    new URL('../../src/runner/github-adapter.mjs', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /outcome:\s*['"]conflict['"]/, "no 'conflict' outcome literal");
});
