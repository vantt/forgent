import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const hotLock = readJson('packages/holder-lock/contracts/hot-lock.v1.json');
const borrow = readJson('packages/holder-lock/contracts/main-checkout-borrow.v1.json');
const registry = readJson('packages/holder-lock/contracts/lock-registry.v1.json');
const lockFd = readJson('packages/holder-lock/contracts/internal-route.lock-fd.v1.json');

test('every hot-lock resource is a hot-mutex row of the registry with the same record path', () => {
  assert.deepEqual(hotLock.contract, { id: 'hot-lock', version: 1 });
  assert.deepEqual(Object.keys(hotLock.resources).sort(), ['porting-events', 'state']);
  const hotRows = registry.locks.filter((lock) => lock.kind === 'hot-mutex').map((lock) => lock.name).sort();
  assert.deepEqual(hotRows, Object.keys(hotLock.resources).sort());
  for (const [name, resource] of Object.entries(hotLock.resources)) {
    const row = registry.locks.find((lock) => lock.name === resource.registryLock);
    assert.equal(row.name, name);
    assert.equal(resource.recordPath, row.v3Path, `${name}: record path matches the registry`);
    assert.equal(resource.reclaimLockPath, row.v3Path.replace(/\.hot$/, '.reclaim.lock'), `${name}: reclaim lock sits next to the record`);
  }
});

test('the hot record carries the full process tuple', () => {
  assert.deepEqual(hotLock.record.required, ['v', 'pid', 'startTime', 'bootId']);
  for (const key of ['v', 'pid', 'startTime', 'bootId', 'pidNs', 'writer']) assert.ok(key in hotLock.record.fields, key);
});

test('reclaim needs a dead verdict, the kernel reclaim lock and an unchanged record', () => {
  assert.match(hotLock.reclaim.when, /judge\(record\) == dead/);
  assert.match(hotLock.reclaim.when, /never reclaimed/);
  const steps = hotLock.reclaim.steps.join('\n');
  assert.match(steps, /never reclaim, report lock-record-unreadable/);
  assert.match(steps, /kernel lock reclaimLockPath/);
  assert.match(steps, /re-read recordPath and compare bytes/);
  assert.ok(steps.indexOf('kernel lock') < steps.indexOf('unlink recordPath'));
});

test('the hot-lock error codes are the closed set the callers handle', () => {
  assert.deepEqual(Object.keys(hotLock.errors).sort(), [
    'exec-under-hot-lock', 'hot-lock-reentry', 'hot-lock-timeout', 'lock-record-unreadable', 'state-tx-revoked',
  ]);
  assert.match(hotLock.acquire.reentry, /hot-lock-reentry at once/);
  assert.match(hotLock.criticalSection.noSubprocess, /syncBuiltinESMExports/);
});

test('borrowing names the main-checkout row and the borrowed-check route', () => {
  assert.deepEqual(borrow.contract, { id: 'main-checkout-borrow', version: 1 });
  const [lockName, slot] = borrow.env.value.split(':');
  assert.equal(borrow.env.name, 'FGOS_LOCK_FD');
  assert.ok(registry.locks.some((lock) => lock.name === lockName), `${lockName} is a registry lock`);
  assert.equal(slot, '3');
  assert.ok(lockFd.argv.mode.exactlyOne.some((mode) => mode.flag.startsWith('--borrowed-check')));
  assert.match(borrow.borrowerCheck.route, /--borrowed-check/);
  assert.equal(borrow.borrowerCheck.allOf.length, 3);
  assert.deepEqual(borrow.holder.gitConfigPrefix, ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false']);
});
