// Lock order inside one scope: a lock may only be taken at a rank above
// every rank the scope holds; the same rank twice is refused; two scopes
// in one process do not see each other. A violation throws before any
// file is opened or any helper runs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { LockScope, createLockScope, acquire, acquireSync, probe, HolderLockError } from '../../src/holder-lock/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route';

const handleLike = (name, rank) => Object.freeze({ name, rank });

test('a lower rank after a higher one is refused with the held and acquiring locks named', () => {
  const scope = createLockScope('order');
  scope.track(handleLike('main-checkout', 50));
  assert.throws(
    () => scope.assertCanAcquire('runner', 10),
    (err) => {
      assert.ok(err instanceof HolderLockError);
      assert.equal(err.code, 'lock-order-violation');
      assert.deepEqual(err.held, [{ name: 'main-checkout', rank: 50 }]);
      assert.deepEqual(err.acquiring, { name: 'runner', rank: 10 });
      assert.equal(err.scope, 'order');
      return true;
    },
  );
});

test('the same rank twice in one scope is refused', () => {
  const scope = createLockScope('same');
  scope.track(handleLike('sessions', 80));
  assert.throws(() => scope.assertCanAcquire('advance', 80), (err) => err.code === 'lock-order-violation' && /one rank at a time/.test(err.message));
});

test('ascending ranks pass, and a released lock no longer constrains the scope', () => {
  const scope = createLockScope('up');
  scope.assertCanAcquire('gateway', 10);
  const gateway = handleLike('gateway', 10);
  scope.track(gateway);
  scope.assertCanAcquire('main-checkout', 50);
  const main = handleLike('main-checkout', 50);
  scope.track(main);
  scope.assertCanAcquire('sessions', 80);
  assert.deepEqual(scope.holding(), [{ name: 'gateway', rank: 10 }, { name: 'main-checkout', rank: 50 }]);
  scope.untrack(main);
  scope.assertCanAcquire('merge-slot', 20);
});

test('two scopes in one process keep separate rank histories', () => {
  const first = createLockScope('first');
  const second = createLockScope('second');
  first.track(handleLike('main-checkout', 50));
  second.assertCanAcquire('gateway', 10);
  assert.throws(() => first.assertCanAcquire('gateway', 10), (err) => err.code === 'lock-order-violation');
  assert.ok(first instanceof LockScope && second instanceof LockScope);
});

test('a real acquire out of order throws before any lock file is opened', { skip: NEEDS_HOST }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-order-'));
  const fgosDir = path.join(dir, '.fgos');
  try {
    const scope = createLockScope('real');
    const main = acquireSync(scope, 'main-checkout', { fgosDir });
    assert.equal(main.result, 'acquired');
    const sessions = acquireSync(scope, 'sessions', { fgosDir });
    assert.equal(sessions.result, 'acquired');

    assert.throws(
      () => acquireSync(scope, 'gateway', { fgosDir }),
      (err) => err.code === 'lock-order-violation' && err.acquiring.name === 'gateway' && err.held.length === 2,
    );
    assert.equal(fs.existsSync(path.join(fgosDir, 'locks', 'gateway.lock')), false, 'the refused acquire opened nothing');

    const other = createLockScope('other');
    const gateway = acquireSync(other, 'gateway', { fgosDir });
    assert.equal(gateway.result, 'acquired', 'another scope is not bound by this scope\'s ranks');
    assert.deepEqual(probe('main-checkout', { fgosDir }), { result: 'held' });

    gateway.handle.release();
    sessions.handle.release();
    main.handle.release();
    assert.deepEqual(scope.holding(), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('two async acquires started together on one scope are checked against each other', { skip: NEEDS_HOST }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-order-async-'));
  const fgosDir = path.join(dir, '.fgos');
  try {
    const scope = createLockScope('async');
    const [main, gateway] = await Promise.allSettled([
      acquire(scope, 'main-checkout', { fgosDir }),
      acquire(scope, 'gateway', { fgosDir }),
    ]);
    assert.equal(main.status, 'fulfilled');
    assert.equal(main.value.result, 'acquired');
    assert.equal(gateway.status, 'rejected', 'the lower rank started while the higher one was in flight is refused');
    assert.equal(gateway.reason.code, 'lock-order-violation');
    assert.deepEqual(scope.holding(), [{ name: 'main-checkout', rank: main.value.handle.rank }], 'no reservation outlives its acquire');
    main.value.handle.release();
    assert.deepEqual(scope.holding(), []);
    const failed = await acquire(createLockScope('other'), 'gateway', { fgosDir });
    assert.equal(failed.result, 'acquired');
    failed.handle.release();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
