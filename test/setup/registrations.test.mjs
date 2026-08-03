// registrations.test.mjs — proves the doctor-check / config-default registry
// mechanism (CONTEXT.md D1/D2, docs/history/setup-doctor-config-registry/):
// a module registers a new entry via src/setup/registrations.mjs and it is
// picked up through checks.mjs's own re-exported DOCTOR_CHECKS without this
// test (or any other new module) touching checks.mjs itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS, CONFIG_DEFAULT_REGISTRATIONS, FIX_REGISTRATIONS, registerCheck, registerConfigDefault, registerFix, runFixes, ensureSharedConfigDefaults } from '../../src/setup/checks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-registrations-test-'));
}

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

// ─── fix (docs/history/doctor-fix-gate-bypass/CONTEXT.md D3, tsk-2qz-1): a
// third registration capability, independent of check/configDefault, proven
// here with a throwaway entry -- never the real gate-bypass entry (that's
// tsk-2qz-2's own job, per the plan's piece boundary).

test('a new module can register a fix via registrations.mjs and see it in checks.mjs\'s own FIX_REGISTRATIONS, without checks.mjs being edited', () => {
  const before = FIX_REGISTRATIONS.length;
  registerFix({
    id: 'registrations-test-throwaway-fix',
    fix: () => ({ changed: true, message: 'throwaway fix ran' }),
  });
  assert.equal(FIX_REGISTRATIONS.length, before + 1);
  const entry = FIX_REGISTRATIONS.find((f) => f.id === 'registrations-test-throwaway-fix');
  assert.ok(entry, 'FIX_REGISTRATIONS (re-exported from checks.mjs) did not pick up the new registration');
  assert.deepEqual(entry.fix(), { changed: true, message: 'throwaway fix ran' });
});

test('registering a fix with a duplicate id throws rather than silently shadowing the original', () => {
  registerFix({ id: 'registrations-test-dup-fix', fix: () => ({ changed: false, message: '' }) });
  assert.throws(
    () => registerFix({ id: 'registrations-test-dup-fix', fix: () => ({ changed: false, message: '' }) }),
    /already registered/,
  );
});

test('registerFix requires a fix function', () => {
  assert.throws(
    () => registerFix({ id: 'registrations-test-no-fn' }),
    /requires a fix function/,
  );
});

test('runFixes invokes every registered fix against the given cwd and reports id/changed/message per entry', () => {
  const before = FIX_REGISTRATIONS.length;
  registerFix({
    id: 'registrations-test-runfixes-throwaway',
    fix: (cwd) => ({ changed: true, message: `ran against ${cwd}` }),
  });
  const results = runFixes('/tmp/some-cwd');
  assert.equal(results.length, before + 1);
  const entry = results.find((r) => r.id === 'registrations-test-runfixes-throwaway');
  assert.deepEqual(entry, { id: 'registrations-test-runfixes-throwaway', changed: true, message: 'ran against /tmp/some-cwd' });
});

// ─── ensureSharedConfigDefaults (tsk-5vf D4): the registry-driven assembler
// `fgos setup` calls. CONFIG_DEFAULT_REGISTRATIONS is a live, shared, mutable
// module array (see the throwaway-registration tests above) -- these
// assertions only check for the presence/shape of entries this file itself
// controls (the built-in `runner` entry), never a strict deepEqual of the
// WHOLE assembled object, which would break the moment any other test in
// the same process registers its own throwaway entry.

test('ensureSharedConfigDefaults on a fresh dir writes every registered entry under its own key, including the built-in "runner" one', () => {
  const dir = mkTempDir();
  const { config, addedKeys } = ensureSharedConfigDefaults(dir);
  assert.deepEqual(config.runner, DEFAULT_RUNNER_CONFIG);
  assert.ok(addedKeys.some((k) => k.startsWith('runner.')) || addedKeys.includes('runner'));
  const written = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8'));
  assert.deepEqual(written.runner, DEFAULT_RUNNER_CONFIG);
});

test('ensureSharedConfigDefaults on an already-complete shared file does not rewrite it', () => {
  const dir = mkTempDir();
  const first = ensureSharedConfigDefaults(dir);
  const sharedPath = path.join(dir, '.fgos', 'config.json');
  const before = fs.statSync(sharedPath).mtimeMs;
  const second = ensureSharedConfigDefaults(dir);
  assert.deepEqual(second.addedKeys, []);
  assert.deepEqual(second.config, first.config);
  assert.equal(fs.statSync(sharedPath).mtimeMs, before);
});

test('ensureSharedConfigDefaults migrates a legacy .fgos-runner.json into the runner section without deleting the old file', () => {
  const dir = mkTempDir();
  const legacyRunner = { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 };
  fs.writeFileSync(path.join(dir, '.fgos-runner.json'), JSON.stringify(legacyRunner));

  const { config } = ensureSharedConfigDefaults(dir);

  assert.equal(config.runner.executor.command, 'claude');
  assert.equal(config.runner.timeoutMs, 5000);
  // Defaults fill in whatever the legacy file didn't have (e.g. "parallel").
  assert.deepEqual(config.runner.parallel, DEFAULT_RUNNER_CONFIG.parallel);
  assert.equal(fs.existsSync(path.join(dir, '.fgos-runner.json')), true, 'the legacy file is never deleted');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'config.json')), true, 'the real move actually happened');
});
