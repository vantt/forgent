import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const borrow = readJson('packages/holder-lock/contracts/main-checkout-borrow.v1.json');
const registry = readJson('packages/holder-lock/contracts/lock-registry.v1.json');
const lockFd = readJson('packages/holder-lock/contracts/internal-route.lock-fd.v1.json');

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

test('the holder waits for the child and only the facade maps the description', () => {
  const rules = borrow.holder.rules.join('\n');
  assert.match(rules, /only the holder-lock facade maps a lock description/);
  assert.match(rules, /after acquire succeeded/);
  assert.match(rules, /waits for the child to exit/);
  assert.match(borrow.scrub, /workerBaseEnv drops FGOS_LOCK_FD/);
});
