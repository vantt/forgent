import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertSafeMainCheckoutReset, mainCheckoutResetUseCase } from '../../src/runner/main-checkout-reset-guard.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';

// tsk-3au D2(2): acceptance bar for the code-level choke-point guard, not a
// design commitment — the module path/export name here is a placeholder
// planning may rename; the two behaviors below (refuse dirty+unconfirmed,
// allow once confirmed) are the locked acceptance criteria (CONTEXT.md).

test('refuses a destructive main-checkout reset when the tree is dirty and unconfirmed', () => {
  assert.throws(() => {
    assertSafeMainCheckoutReset({ dirty: true, confirmed: false });
  });
});

test('allows the reset once the caller has confirmed after seeing full git status', () => {
  assert.doesNotThrow(() => {
    assertSafeMainCheckoutReset({ dirty: true, confirmed: true });
  });
});

test('allows the reset outright when the tree is already clean', () => {
  assert.doesNotThrow(() => {
    assertSafeMainCheckoutReset({ dirty: false, confirmed: false });
  });
});

test('refuses a destructive main-checkout reset when reset would discard committed commits and unconfirmed', () => {
  assert.throws(
    () => {
      assertSafeMainCheckoutReset({ dirty: false, confirmed: false, lostCommitCount: 2, sha: '16e9cff4' });
    },
    (err) => {
      return err.message.includes('would discard 2 committed commit(s)');
    }
  );
});

test('refuses reset when tree is dirty AND would discard committed commits and unconfirmed', () => {
  assert.throws(
    () => {
      assertSafeMainCheckoutReset({ dirty: true, confirmed: false, lostCommitCount: 1, sha: '16e9cff4' });
    },
    (err) => {
      return err.message.includes('uncommitted changes') && err.message.includes('would discard 1 committed commit(s)');
    }
  );
});

test('allows resetting behind committed commits once confirmed', () => {
  assert.doesNotThrow(() => {
    assertSafeMainCheckoutReset({ dirty: false, confirmed: true, lostCommitCount: 2, sha: '16e9cff4' });
  });
});

// The use case owns the reset's decisions: why no existing test proves them at this layer is that the CLI cases in
// test/cli/fgos-claim.test.mjs only see a spawned call's text and exit code.
function mainWithTwoCommits() {
  const main = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-reset-uc-'));
  initFixtureRepo(main, { branch: 'main' });
  const git = (...args) => execFileSync('git', args, { cwd: main, encoding: 'utf8' }).trim();
  const first = git('rev-parse', 'HEAD');
  fs.writeFileSync(path.join(main, 'second.txt'), 'two\n');
  git('add', 'second.txt');
  git('commit', '-q', '-m', 'second change');
  return { main, git, first };
}

test('the reset use case refuses without --dir from a linked worktree, before reading or restoring anything', async () => {
  const { main, git, first } = mainWithTwoCommits();
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-reset-wt-')), 'wt');
  git('worktree', 'add', '-q', '--detach', wt, 'HEAD');
  const head = git('rev-parse', 'HEAD');
  await assert.rejects(
    () => mainCheckoutResetUseCase({ repoRoot: main, cwd: wt, explicitDir: false }, { sha: first, confirmed: true }),
    (err) => err.category === 'validation' && /refusing to run without --dir/.test(err.message),
  );
  assert.equal(git('rev-parse', 'HEAD'), head);
});

test('the reset use case lists the commits it would discard and leaves HEAD alone until confirmed, then resets', async () => {
  const { main, git, first } = mainWithTwoCommits();
  const head = git('rev-parse', 'HEAD');
  const ask = (confirmed) => mainCheckoutResetUseCase({ repoRoot: main, cwd: main, explicitDir: false }, { sha: first, confirmed });
  await assert.rejects(() => ask(false), (err) => err.category === 'validation' && /Commits about to be discarded \(1\)/.test(err.message) && /second change/.test(err.message));
  assert.equal(git('rev-parse', 'HEAD'), head);
  const result = await ask(true);
  assert.equal(git('rev-parse', 'HEAD'), first);
  assert.equal(result.lostCommitCount, 1);
  assert.equal(result.confirmed, true);
});

test('the reset use case refuses a sha that names no commit', async () => {
  const { main } = mainWithTwoCommits();
  await assert.rejects(
    () => mainCheckoutResetUseCase({ repoRoot: main, cwd: main, explicitDir: false }, { sha: 'no-such-ref', confirmed: false }),
    (err) => err.category === 'validation' && /does not name a commit/.test(err.message),
  );
});
