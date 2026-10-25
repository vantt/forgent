import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from '../event-store/phase07-fixture.mjs';
import { fixEventStoreLockDirs } from '../../src/setup/event-store-fixes.mjs';

test('the lock-dirs fix is idempotent, repairs modes below fgos and creates a missing tree private', t => {
  const f = fixture(t, { remote: true });
  // The locks directory and each parent the fix owns up to the Git common dir (Git's WAL refuses a
  // group-writable one): a wrong mode below `fgos` is fixed, and a missing tree is created private. A
  // group-writable `fgos` itself is refused by Git before any Event Store fact can be read.
  const owned = [f.locks, path.dirname(f.locks), path.dirname(path.dirname(f.locks))];
  for (const dir of owned.slice(0, 2)) {
    fs.chmodSync(dir, 0o775);
    assert.equal(fixEventStoreLockDirs(f.repo, f.ctx).changed, true, dir);
    for (const each of owned) assert.equal(fs.statSync(each).mode & 0o777, 0o700, each);
    assert.equal(fixEventStoreLockDirs(f.repo, f.ctx).changed, false);
  }
  fs.rmSync(owned[2], { recursive: true });
  assert.equal(fixEventStoreLockDirs(f.repo, f.ctx).changed, true);
  for (const each of owned) assert.equal(fs.statSync(each).mode & 0o777, 0o700, each);
});
test('the lock-dirs fix refuses a symlinked locks directory', t => {
  const f = fixture(t);
  fs.rmdirSync(f.locks); fs.symlinkSync(f.stateRoot, f.locks);
  assert.throws(() => fixEventStoreLockDirs(f.repo, f.ctx), /unsafe directory/);
});
