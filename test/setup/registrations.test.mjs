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

// tsk-4xg: runFixes() below invokes every registered fix, including the
// real `claude-plugin-marketplace` one, which shells out to a real,
// mutating external CLI (`claude plugin marketplace add`/`install`) when
// the `claude` binary is present. FGOS_CLAUDE_COMMAND (registrations.mjs's
// own test-only seam, mirroring bin/fgos.mjs's FGOS_GH_COMMAND for `gh`)
// points it at a path that never exists for this whole test file's process,
// so it always sees "claude CLI not found" and no-ops that fix, never
// touching this machine's real Claude Code config as a side effect of
// running the test suite.
process.env.FGOS_CLAUDE_COMMAND = '/nonexistent/fgos-test-claude-binary';

// Snapshot the real registry HERE, at module scope, before any test below
// registers a throwaway entry into these same live shared arrays. The spec
// rows the last two tests in this file compare against name only the real
// entries, so reading DOCTOR_CHECKS/FIX_REGISTRATIONS from inside a test
// would pick up throwaways and fail for the wrong reason.
const REGISTERED_CHECK_IDS = DOCTOR_CHECKS.map((c) => c.id);
const REGISTERED_FIX_IDS = FIX_REGISTRATIONS.map((f) => f.id);

const SPEC_PATH = new URL('../../docs/specs/distribution.md', import.meta.url);

/**
 * The ids a Data Dictionary row enumerates after its "Today's registered
 * ..." marker — the backticked tokens up to the end of that sentence, so
 * the row's surrounding prose (which backticks `registerCheck`, module
 * paths, and command names too) is never mistaken for an entry.
 */
function specEnumeratedIds(marker) {
  const spec = fs.readFileSync(SPEC_PATH, 'utf8');
  const start = spec.indexOf(marker);
  assert.notEqual(start, -1, `docs/specs/distribution.md no longer contains the marker "${marker}"`);
  const rest = spec.slice(start + marker.length);
  const end = rest.indexOf('. ');
  assert.notEqual(end, -1, `the "${marker}" enumeration is not terminated by a sentence break`);
  return [...rest.slice(0, end).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

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

// ─── spec/registry agreement. Data Dictionary #7 and #7b used to say the
// list "grows without a spec update whenever a module registers a new one",
// which let it rot: a module registered `claude-plugin-marketplace` as both
// a check and a fix without touching the spec, and nothing noticed until a
// person audited by hand. Those rows now carry the opposite obligation —
// they name every registered entry, and a module adding one updates the row
// in the same change. These two tests are what makes that obligation real
// instead of a sentence nobody enforces.

test('Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one', () => {
  assert.deepEqual(
    specEnumeratedIds("Today's registered checks: ").slice().sort(),
    REGISTERED_CHECK_IDS.slice().sort(),
  );
});

test('Data Dictionary #7b names exactly the registered doctor fixes — no missing entry, no stale one', () => {
  assert.deepEqual(
    specEnumeratedIds("Today's registered fixes: ").slice().sort(),
    REGISTERED_FIX_IDS.slice().sort(),
  );
});

// ─── plugin-skill-cli-reachable (tsk-1no D3): the plugin skill layer's own
// CLI-resolution fallback, mirrored as a doctor check so a future install
// gap surfaces at `fgos doctor` time instead of at first slash-command use.

function pluginSkillCliReachableCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'plugin-skill-cli-reachable');
  assert.ok(entry, 'plugin-skill-cli-reachable must be registered');
  return entry.check;
}

test('plugin-skill-cli-reachable passes when a local bin/fgos.mjs exists, without touching PATH', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin', 'fgos.mjs'), '// stub\n');
  const result = pluginSkillCliReachableCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /local bin\/fgos\.mjs found/);
});

test('plugin-skill-cli-reachable passes when no local bin/fgos.mjs exists but fgos resolves from PATH', () => {
  const dir = mkTempDir();
  const binDir = mkTempDir();
  const stubPath = path.join(binDir, 'fgos');
  fs.writeFileSync(stubPath, '#!/bin/sh\necho stub\n');
  fs.chmodSync(stubPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    const result = pluginSkillCliReachableCheck()(dir);
    assert.equal(result.passed, true);
    assert.match(result.message, /fgos resolved from PATH/);
  } finally {
    process.env.PATH = originalPath;
  }
});

test('plugin-skill-cli-reachable fails when neither a local bin/fgos.mjs nor a PATH install exists', () => {
  const dir = mkTempDir();
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const result = pluginSkillCliReachableCheck()(dir);
    assert.equal(result.passed, false);
    assert.match(result.message, /no bin\/fgos\.mjs at .* and no global fgos install on PATH/);
  } finally {
    process.env.PATH = originalPath;
  }
});

// ─── plugin-dev-skills-packaged (tsk-32b): confirms the coding-domain
// dev-skills plugin-skill-cli-reachable never checked (fgos-coding-driving,
// fgos-routing, ...) are actually present in plugins/fgOS/skills/, so a
// maintainer who adds/renames one in .claude/skills/ but forgets to copy it
// forward gets caught at `fgos doctor` time instead of shipping silently.

function pluginDevSkillsPackagedCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'plugin-dev-skills-packaged');
  assert.ok(entry, 'plugin-dev-skills-packaged must be registered');
  return entry.check;
}

test('plugin-dev-skills-packaged passes cleanly when the project has no .claude/skills or plugins/fgOS/skills at all', () => {
  const dir = mkTempDir();
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /not a forgent checkout/);
});

test('plugin-dev-skills-packaged passes when every .claude/skills/fgos-* dev-skill has a matching plugins/fgOS/skills/ copy', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  fs.mkdirSync(path.join(dir, 'plugins', 'fgOS', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'plugins', 'fgOS', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /all 1 coding-domain dev-skills are packaged/);
});

test('plugin-dev-skills-packaged fails and names any .claude/skills/fgos-* dev-skill missing from plugins/fgOS/skills/', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  fs.mkdirSync(path.join(dir, 'plugins', 'fgOS', 'skills'), { recursive: true });
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, false);
  assert.match(result.message, /fgos-example/);
  assert.match(result.message, /Unknown skill/);
});
