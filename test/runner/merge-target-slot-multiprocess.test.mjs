// Real OS processes contending for a target's merge slot, which Land's own
// session takes on the target's full ref (Git spec §9). The slot is a kernel
// lock on an open file description: a process that dies releases it by
// dying, no TTL or pid record is involved, and two processes that inherit the
// same session environment still exclude each other because they hold
// distinct descriptions.
//
// Mutual exclusion is a two-party property, so this uses the minimum real
// parties: one child holder plus the test process. Every assertion is on an
// outcome, never on timing.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { landRunnerItem, MergeError } from '../../src/runner/merge.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { activateGitFixture } from './worktree-native-fixture.helper.mjs';

const git = (repoRoot, args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

/** A repo on main with a root branch per name in `roots` and one leaf
 * branch `fgw/leaf` carrying `leaf.txt`, ready to land into any root. */
function leafRepo(roots) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-target-slot-mp-'));
  git(repoRoot, ['init', '-q', '-b', 'main']);
  git(repoRoot, ['config', 'user.email', 'test@example.com']);
  git(repoRoot, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, ['add', 'seed.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'seed']);
  for (const root of roots) git(repoRoot, ['branch', root]);
  git(repoRoot, ['checkout', '-q', '-b', 'fgw/leaf']);
  fs.writeFileSync(path.join(repoRoot, 'leaf.txt'), 'leaf\n');
  git(repoRoot, ['add', 'leaf.txt']);
  git(repoRoot, ['commit', '-q', '-m', 'leaf work']);
  git(repoRoot, ['checkout', '-q', 'main']);
  activateGitFixture(repoRoot);
  return repoRoot;
}

const slot = (repoRoot, target) => ({ fgosDir: path.join(repoRoot, '.fgos'), ref: encodeURIComponent(`refs/heads/${target}`) });
const land = (repoRoot, target, opts = {}) => landRunnerItem(repoRoot, { id: 'leaf', verify: 'test -f leaf.txt' }, { target, timeoutMs: 60000, ...opts });

async function killHolder(holder) {
  holder.child.kill('SIGKILL');
  await holder.exited;
}

test('a slot held by a REAL separate process is refused in this one, naming the slot and that process\'s pid', async () => {
  const target = 'fgw/tsk-target';
  const repoRoot = leafRepo([target]);
  const before = git(repoRoot, ['rev-parse', target]);
  const holder = await holdLockInChild('merge-slot', slot(repoRoot, target));
  try {
    const err = await land(repoRoot, target, { lockWaitMs: 0 }).then(() => null, (e) => e);
    assert.ok(err instanceof MergeError, `expected MergeError, got ${err}`);
    assert.equal(err.code, 'lock-held');
    assert.equal(err.targetRef, target);
    assert.match(err.message, /merge slot of "refs\/heads\/fgw\/tsk-target" is held by another process/);
    assert.deepEqual(err.holders, [holder.child.pid], 'the kernel names the child as the one holder, not this process');
    assert.equal(git(repoRoot, ['rev-parse', target]), before, 'the second process never moved the target');
  } finally {
    await killHolder(holder);
  }
});

test('two DIFFERENT target refs never contend across processes — parallelism is per target', async () => {
  const repoRoot = leafRepo(['fgw/one', 'fgw/two']);
  const holder = await holdLockInChild('merge-slot', slot(repoRoot, 'fgw/one'));
  try {
    const result = await land(repoRoot, 'fgw/two', { lockWaitMs: 0 });
    assert.equal(result.outcome, 'merged', 'a distinct target ref must not be blocked by another target\'s holder');
    assert.equal(git(repoRoot, ['show', 'fgw/two:leaf.txt']), 'leaf');
  } finally {
    await killHolder(holder);
  }
});

test('a holder that is SIGKILLed lets the next merge into the same target in at once', async () => {
  const target = 'fgw/tsk-reuse';
  const repoRoot = leafRepo([target]);
  const holder = await holdLockInChild('merge-slot', slot(repoRoot, target));
  await killHolder(holder);

  const result = await land(repoRoot, target, { lockWaitMs: 0 });
  assert.equal(result.outcome, 'merged', 'the slot must be free once the holding process is gone, with no TTL to wait out');
});

test('waiting: a land given a wait budget enters once the holder is gone; no wait fails at once with the same name', async () => {
  const target = 'fgw/tsk-wait';
  const repoRoot = leafRepo([target]);
  const holder = await holdLockInChild('merge-slot', slot(repoRoot, target));
  try {
    const noWaitStart = Date.now();
    const refused = await land(repoRoot, target, { lockWaitMs: 0 }).then(() => null, (e) => e);
    assert.equal(refused?.code, 'lock-held');
    assert.match(refused.message, /merge slot of "refs\/heads\/fgw\/tsk-wait"/);
    assert.ok(Date.now() - noWaitStart < 2000, 'a single try must fail at once, not wait');

    setTimeout(() => holder.child.kill('SIGKILL'), 400);
    const result = await land(repoRoot, target, { lockWaitMs: 15_000 });
    assert.equal(result.outcome, 'merged');
  } finally {
    await killHolder(holder);
  }
});
