import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HotLockError } from '../../src/state/hot-lock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const hot = readJson('packages/holder-lock/contracts/hot-lock.v1.json');
const registry = readJson('packages/holder-lock/contracts/lock-registry.v1.json');
const lockOf = (name) => registry.locks.find((lock) => lock.name === name);

test('every hot resource is a hot-mutex registry row whose v3Path is its reclaim lock', () => {
  assert.deepEqual(hot.contract, { id: 'hot-lock', version: 1 });
  assert.deepEqual(Object.keys(hot.resources).sort(), ['porting-events', 'state']);
  for (const [name, resource] of Object.entries(hot.resources)) {
    const row = lockOf(resource.registryLock);
    assert.ok(row, `${name}: registry row`);
    assert.equal(resource.registryLock, name);
    assert.equal(row.kind, 'hot-mutex');
    assert.equal(row.v3Path, resource.reclaimLock);
    assert.equal(resource.record, `<fgosDir>/locks/${name}.hot`);
    assert.equal(resource.reclaimLock, `<fgosDir>/locks/${name}.reclaim.lock`);
  }
});

test('the record carries the full process tuple and cleanup needs the judge and the kernel lock', () => {
  for (const field of ['v', 'pid', 'startTime', 'bootId', 'pidNs']) {
    assert.ok(field in hot.record.shape, `record field ${field}`);
  }
  const rules = hot.cleanup.allOf.join('\n');
  assert.match(rules, /judge .* answers dead/);
  assert.match(rules, /kernel lock/);
  const never = hot.cleanup.never.join('\n');
  assert.match(never, /does not parse is never cleaned/);
  assert.match(never, /unknown is never cleaned/);
});

test('the critical section forbids children and nesting, and names every error the module throws', () => {
  assert.match(hot.criticalSection.callback, /synchronous/);
  assert.ok(hot.criticalSection.forbidden.some((rule) => /child process/.test(rule)));
  assert.ok(hot.criticalSection.forbidden.some((rule) => /again in the same process/.test(rule)));
  assert.deepEqual(
    Object.keys(hot.errors).sort(),
    ['exec-under-hot-lock', 'hot-lock-reentry', 'hot-lock-release-stuck', 'hot-lock-timeout', 'lock-record-unreadable', 'state-tx-async', 'state-tx-revoked'],
  );
  assert.equal(hot.wait.timeoutMs, 5000);
});

test('HotLockError maps a timeout to the lock-timeout exit category and every other code to precondition', () => {
  for (const [code, entry] of Object.entries(hot.errors)) {
    if (code === 'lock-record-unreadable') continue;
    assert.equal(new HotLockError(code, 'x').category, entry.category, code);
  }
});
