import test from 'node:test';
import assert from 'node:assert/strict';
import { operationCensus } from '../../scripts/git/e3-bench.mjs';

test('operation census counts completed Git execs and fresh lock descriptions, including interrupted syscalls', () => {
  const phases = { 'land-prepare': {gitExecs:[], holderLockAcquisitions:[], exclusiveLockCalls:[]} };
  operationCensus(`1 access("/nonexistent-e3-marker/land-prepare-begin", F_OK) = -1 ENOENT
1 openat(AT_FDCWD, "/r/.fgos/locks/merge-slot.lock", O_RDWR) = 4</r/.fgos/locks/merge-slot.lock>
1 flock(4</r/.fgos/locks/merge-slot.lock>, LOCK_EX|LOCK_NB <unfinished ...>
2 execve("/missing/git", ["git"], 0x0) = -1 ENOENT
1 <... flock resumed>) = 0
1 flock(4</r/.fgos/locks/merge-slot.lock>, LOCK_EX|LOCK_NB) = 0
2 flock(3</r/.fgos/locks/merge-slot.lock>, LOCK_EX|LOCK_NB) = 0
2 execve("/usr/bin/git", ["git", "status"], 0x0 <unfinished ...>
2 <... execve resumed>) = 0
1 close(4</r/.fgos/locks/merge-slot.lock>) = 0
1 openat(AT_FDCWD, "/r/.fgos/locks/merge-slot.lock", O_RDWR) = 4</r/.fgos/locks/merge-slot.lock>
1 flock(4</r/.fgos/locks/merge-slot.lock>, LOCK_EX|LOCK_NB) = 0
1 access("/nonexistent-e3-marker/land-prepare-end", F_OK) = -1 ENOENT
2 execve("/usr/bin/git", ["git", "status"], 0x0) = 0`, phases, '/usr/bin/git');
  const result = phases['land-prepare'];
  assert.equal(result.gitExecCount, 1);
  assert.equal(result.holderLockAcquisitionCount, 2);
  assert.equal(result.exclusiveLockCallCount, 4);
  assert.match(result.gitExecs[0], /"status"/);
});

test('operation census recognizes the Node lock-fd acquisition adapter on inherited fd 3', () => {
  const phases = { 'land-legacy': {gitExecs:[], holderLockAcquisitions:[], exclusiveLockCalls:[]} };
  operationCensus(`1 access("/nonexistent-e3-marker/land-legacy-begin", F_OK) = -1 ENOENT
2 execve("/bin/fgos", ["fgos", "internal", "lock-fd", "--try"], 0x0) = 0
2 flock(3</r/.fgos/locks/main-checkout.lock>, LOCK_EX|LOCK_NB) = 0
1 access("/nonexistent-e3-marker/land-legacy-end", F_OK) = -1 ENOENT`, phases, '/usr/bin/git');
  assert.equal(phases['land-legacy'].holderLockAcquisitionCount, 1);
});
