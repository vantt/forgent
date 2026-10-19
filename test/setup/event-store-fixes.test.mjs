import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from '../event-store/phase07-fixture.mjs';
import { fixEventStoreMachineId, fixEventStoreRefspec, fixEventStoreLockDirs } from '../../src/setup/event-store-fixes.mjs';

test('all setup fixes are idempotent; mappings are fetched only through Git config port', t => {
  const f = fixture(t, { remote: true });
  assert.equal(fixEventStoreMachineId(f.repo, f.ctx).changed, true);
  const id = fs.readFileSync(path.join(f.stateRoot, 'machine-id'), 'utf8'); assert.match(id, /^[a-z0-9][a-z0-9-]{1,62}\n$/);
  assert.equal(fixEventStoreMachineId(f.repo, f.ctx).changed, false);
  assert.equal(fs.readFileSync(path.join(f.stateRoot, 'machine-id'), 'utf8'), id);
  assert.equal(fixEventStoreRefspec(f.repo, f.ctx).changed, true);
  assert.equal(fixEventStoreRefspec(f.repo, f.ctx).changed, false);
  assert.throws(() => f.git('config', '--get-all', 'remote.origin.push'));
  fs.chmodSync(f.locks, 0o755);
  assert.equal(fixEventStoreLockDirs(f.repo, f.ctx).changed, true);
  assert.equal(fs.statSync(f.locks).mode & 0o777, 0o700);
  assert.equal(fixEventStoreLockDirs(f.repo, f.ctx).changed, false);
});
test('setup refuses symlink identities and lock directories, preserves invalid existing identity', t => {
  const f = fixture(t);
  const target = path.join(f.stateRoot, 'machine-id'); fs.writeFileSync(target, 'INVALID');
  assert.throws(() => fixEventStoreMachineId(f.repo, f.ctx), /existing identity is invalid/);
  assert.equal(fs.readFileSync(target, 'utf8'), 'INVALID');
  fs.unlinkSync(target); fs.symlinkSync(path.join(f.temp, 'elsewhere'), target);
  assert.throws(() => fixEventStoreMachineId(f.repo, f.ctx), /identity is invalid/);
  fs.rmdirSync(f.locks); fs.symlinkSync(f.stateRoot, f.locks);
  assert.throws(() => fixEventStoreLockDirs(f.repo, f.ctx), /unsafe directory/);
});

test('machine identity accepts a canonical state root beneath symlinked ancestors', t => {
  const f = fixture(t);
  const linked = path.join(f.temp, 'linked-state'); fs.symlinkSync(f.stateRoot, linked);
  const options = { ...f.ctx, stateRoot: path.join(linked, 'nested') };
  assert.equal(fixEventStoreMachineId(f.repo, options).changed, true);
  assert.equal(fixEventStoreMachineId(f.repo, options).changed, false);
  assert.match(fs.readFileSync(path.join(f.stateRoot, 'nested/machine-id'), 'utf8'), /^[a-z0-9-]+\n$/);
});
