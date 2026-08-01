// registrations.test.mjs — proves the doctor-check / config-default registry
// mechanism (CONTEXT.md D1/D2, docs/history/setup-doctor-config-registry/):
// a module registers a new entry via src/setup/registrations.mjs and it is
// picked up through checks.mjs's own re-exported DOCTOR_CHECKS without this
// test (or any other new module) touching checks.mjs itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DOCTOR_CHECKS, CONFIG_DEFAULT_REGISTRATIONS, registerCheck, registerConfigDefault } from '../../src/setup/checks.mjs';

test('a new module can register a check via registrations.mjs and see it in checks.mjs\'s own DOCTOR_CHECKS, without checks.mjs being edited', () => {
  const before = DOCTOR_CHECKS.length;
  registerCheck({
    id: 'registrations-test-throwaway-check',
    description: 'proves a new entry needs no checks.mjs edit',
    check: () => ({ passed: true, message: 'throwaway check ran' }),
  });
  assert.equal(DOCTOR_CHECKS.length, before + 1);
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'registrations-test-throwaway-check');
  assert.ok(entry, 'DOCTOR_CHECKS (re-exported from checks.mjs) did not pick up the new registration');
  assert.deepEqual(entry.check(), { passed: true, message: 'throwaway check ran' });
});

test('registering a check with a duplicate id throws rather than silently shadowing the original', () => {
  assert.throws(
    () => registerCheck({ id: 'node-version-and-git', description: 'dup', check: () => ({ passed: true, message: '' }) }),
    /already registered/,
  );
});

test('a new module can register a config-default independently of any check (D2)', () => {
  const before = CONFIG_DEFAULT_REGISTRATIONS.length;
  registerConfigDefault({
    id: 'registrations-test-throwaway-config',
    key: 'throwawayModule',
    shape: { enabled: true },
  });
  assert.equal(CONFIG_DEFAULT_REGISTRATIONS.length, before + 1);
  const entry = CONFIG_DEFAULT_REGISTRATIONS.find((c) => c.id === 'registrations-test-throwaway-config');
  assert.ok(entry, 'CONFIG_DEFAULT_REGISTRATIONS did not pick up the new registration');
  assert.equal(entry.key, 'throwawayModule');
  assert.deepEqual(entry.shape, { enabled: true });
});

test('registerConfigDefault rejects a non-object shape', () => {
  assert.throws(
    () => registerConfigDefault({ id: 'registrations-test-bad-shape', key: 'bad', shape: 'not-an-object' }),
    /plain-object shape/,
  );
});

test('registerConfigDefault requires a non-empty key', () => {
  assert.throws(
    () => registerConfigDefault({ id: 'registrations-test-no-key', key: '', shape: {} }),
    /non-empty key/,
  );
});

test('the runner\'s own config-default is registered under the "runner" key (built-in, proves the same mechanism a new module would use)', () => {
  const entry = CONFIG_DEFAULT_REGISTRATIONS.find((c) => c.id === 'runner');
  assert.ok(entry, 'the built-in runner config-default is missing from CONFIG_DEFAULT_REGISTRATIONS');
  assert.equal(entry.key, 'runner');
  assert.equal(typeof entry.shape, 'object');
});
