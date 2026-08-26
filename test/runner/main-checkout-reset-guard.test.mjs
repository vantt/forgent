import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeMainCheckoutReset } from '../../src/runner/main-checkout-reset-guard.mjs';

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
