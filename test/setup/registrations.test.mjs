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

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { DOCTOR_CHECKS, CONFIG_DEFAULT_REGISTRATIONS, FIX_REGISTRATIONS, registerCheck, registerConfigDefault, registerFix, runFixes, ensureSharedConfigDefaults } from '../../src/setup/checks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';
import { DEFAULT_CAPABILITY_SLOTS, PI_EXECUTOR_DEFAULT, findWorkflowStageOperationProblems } from '../../src/setup/registrations.mjs';
import { recordMainCheckoutGuardWarning } from '../../src/state/main-checkout-guard-warnings.mjs';


const EXPECTED_RUNNER_DEFAULT = {
  ...DEFAULT_RUNNER_CONFIG,
  capabilities: DEFAULT_CAPABILITY_SLOTS,
  modelPolicies: { ...DEFAULT_RUNNER_CONFIG.modelPolicies, 'openai-codex': { lightweight: 'gpt-5.5' } },
  executors: { pi: PI_EXECUTOR_DEFAULT },
};

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
  // tsk-2uf-3: the registered "runner" config-default layers the
  // advise/execute capability slots onto DEFAULT_RUNNER_CONFIG (that
  // constant itself, src/runner/dispatch.mjs, stays untouched -- see
  // registrations.mjs's own `DEFAULT_CAPABILITY_SLOTS` composition), so
  // the assembled "runner" section is no longer byte-identical to
  // DEFAULT_RUNNER_CONFIG alone.
  assert.deepEqual(config.runner, EXPECTED_RUNNER_DEFAULT);
  assert.ok(addedKeys.some((k) => k.startsWith('runner.')) || addedKeys.includes('runner'));
  const written = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8'));
  assert.deepEqual(written.runner, EXPECTED_RUNNER_DEFAULT);
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

test('plugin-skill-cli-reachable fails when neither a local bin/fgos.mjs, a project-local install, a cached global path, nor a live PATH install exists', () => {
  const dir = mkTempDir();
  // HOME override (tsk-2qc-1): resolveFgosBin's tier-3 cache reads
  // ~/.fgos/config.json by default -- without this override, a real
  // cached bin.globalFgosPath left on the machine running this test
  // (from a real `fgos setup`/`doctor --fix` run) would make this check
  // pass for the wrong reason. Same isolation discipline the
  // shell-integration-sourced tests already apply via HOME (checks.test.mjs).
  const homeDir = mkTempDir();
  const originalPath = process.env.PATH;
  const originalHome = process.env.HOME;
  process.env.PATH = '';
  process.env.HOME = homeDir;
  try {
    const result = pluginSkillCliReachableCheck()(dir);
    assert.equal(result.passed, false);
    assert.match(result.message, /no bin\/fgos\.mjs at .* and no global fgos install on PATH/);
  } finally {
    process.env.PATH = originalPath;
    process.env.HOME = originalHome;
  }
});

// ─── cli-version-visible (tsk-2ej): the running build's own package
// version/commit/verb-set resolve cleanly -- the "always green on a
// healthy build" self-check pattern node-version-and-git already uses, so
// fgos doctor's own report always surfaces the first thing worth comparing
// when a verb comes back "unknown" on some other machine.

function cliVersionVisibleCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'cli-version-visible');
  assert.ok(entry, 'cli-version-visible must be registered');
  return entry.check;
}

test('cli-version-visible passes and its message embeds the resolved packageVersion', () => {
  const result = cliVersionVisibleCheck()();
  assert.equal(result.passed, true);
  const { version: packageVersion } = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.ok(result.message.includes(packageVersion), `message "${result.message}" missing packageVersion "${packageVersion}"`);
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

// ─── gateway-token-configured (tsk-4r1, found by the gateway audit,
// Finding 9): the gateway's own token lives in ~/.fgos/config.json (home),
// never `cwd`'s -- every test below overrides HOME so it never touches
// this machine's real home config, mirroring plugin-skill-cli-reachable's
// own HOME-override discipline above.

function gatewayTokenConfiguredCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'gateway-token-configured');
  assert.ok(entry, 'gateway-token-configured must be registered');
  return entry.check;
}

function gatewayTokenConfiguredFix() {
  const entry = FIX_REGISTRATIONS.find((f) => f.id === 'gateway-token-configured');
  assert.ok(entry, 'gateway-token-configured fix must be registered');
  return entry.fix;
}

test('gateway-token-configured check fails when HOME has no gateway.token, and fix provisions a real one the check then accepts', () => {
  const homeDir = mkTempDir();
  const originalHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const before = gatewayTokenConfiguredCheck()();
    assert.equal(before.passed, false);
    assert.match(before.message, /gateway\.token missing/);
    assert.match(before.message, /fgos doctor --fix/);

    const fixResult = gatewayTokenConfiguredFix()();
    assert.equal(fixResult.changed, true);

    const written = JSON.parse(fs.readFileSync(path.join(homeDir, '.fgos', 'config.json'), 'utf8'));
    assert.equal(typeof written.gateway.token, 'string');
    assert.ok(written.gateway.token.length >= 32, `expected a high-entropy token, got ${written.gateway.token.length} chars`);

    const after = gatewayTokenConfiguredCheck()();
    assert.equal(after.passed, true);
  } finally {
    process.env.HOME = originalHome;
  }
});

test('gateway-token-configured fix is idempotent — an existing token is never rotated out from under a client that already has it', () => {
  const homeDir = mkTempDir();
  const originalHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
    fs.writeFileSync(
      path.join(homeDir, '.fgos', 'config.json'),
      JSON.stringify({ gateway: { port: 4170, token: 'already-set-token' } }),
    );
    const fixResult = gatewayTokenConfiguredFix()();
    assert.equal(fixResult.changed, false);
    const written = JSON.parse(fs.readFileSync(path.join(homeDir, '.fgos', 'config.json'), 'utf8'));
    assert.equal(written.gateway.token, 'already-set-token');
  } finally {
    process.env.HOME = originalHome;
  }
});

test('the gateway config-default is registered under the "gateway" key with port and an unarmed null token', () => {
  const entry = CONFIG_DEFAULT_REGISTRATIONS.find((c) => c.id === 'gateway');
  assert.ok(entry, 'the gateway config-default is missing from CONFIG_DEFAULT_REGISTRATIONS');
  assert.equal(entry.key, 'gateway');
  assert.equal(entry.shape.port, 4170);
  assert.equal(entry.shape.token, null);
});

test('task-specs-resolve doctor check passes when core/task-specs/ and domain task-specs exist', () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'task-specs-resolve');
  assert.ok(entry, 'task-specs-resolve check must be registered');
  const result = entry.check(process.cwd());
  assert.equal(result.passed, true, `task-specs-resolve failed: ${result.message}`);
});

test('agent-type-names-unique doctor check passes when agent-type names are globally unique', () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-type-names-unique');
  assert.ok(entry, 'agent-type-names-unique check must be registered');
  const result = entry.check(process.cwd());
  assert.equal(result.passed, true, `agent-type-names-unique failed: ${result.message}`);
});

test('agent-type-names-unique doctor check fails when duplicate agent-type names exist across sources (D33)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-unique-test-'));
  try {
    const coreDir = path.join(tempDir, 'core', 'agents');
    const domainDir = path.join(tempDir, 'domains', 'coding', 'agents');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(domainDir, { recursive: true });

    fs.writeFileSync(path.join(coreDir, 'dup.yaml'), 'name: dup-agent\nversion: 0.1.0\n');
    fs.writeFileSync(path.join(domainDir, 'dup.yaml'), 'name: dup-agent\nversion: 0.1.0\n');

    const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-type-names-unique');
    const result = entry.check(tempDir);
    assert.equal(result.passed, false);
    assert.match(result.message, /duplicate agent-type name/);
    assert.match(result.message, /"dup-agent"/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('guard-warnings-surface: main-checkout-guard-warnings doctor check passes when no warnings exist and fails when warnings exist', () => {
  const dir = mkTempDir();

  // 1. Not in a git checkout
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'main-checkout-guard-warnings');
  assert.ok(entry, 'main-checkout-guard-warnings check must be registered');
  const nonGitResult = entry.check(dir);
  assert.equal(nonGitResult.passed, true);
  assert.match(nonGitResult.message, /not inside a git checkout/);

  // 2. Fresh checkout (no warnings recorded)
  const gitDir = mkTempDir();
  execFileSync('git', ['init'], { cwd: gitDir });
  const freshResult = entry.check(gitDir);
  assert.equal(freshResult.passed, true);
  assert.match(freshResult.message, /no main checkout guard warnings recorded/);

  // 3. Warnings recorded
  recordMainCheckoutGuardWarning(gitDir, {
    reason: 'regressed',
    message: 'current tip seq 22816 is lower than last recorded mark 22850',
    mark: 22850,
  });

  const warnedResult = entry.check(gitDir);
  assert.equal(warnedResult.passed, false);
  assert.match(warnedResult.message, /1 main checkout guard warning\(s\) recorded/);
  assert.match(warnedResult.message, /regressed: current tip seq 22816 is lower than last recorded mark 22850/);
});




// --- Tầng A/T5: events-jsonl-not-truncated rescoped to check baseline-0
// AND every per-writer file under .fgos/events/ (TA-D10) ----------------

function ev(seq, ts, type) {
  return JSON.stringify({ seq, ts, type, payload: null });
}
function raw(lines) {
  return `${lines.join('\n')}\n`;
}

test('events-jsonl-not-truncated: a truncation in a per-writer file under .fgos/events/ fails the check even when baseline-0 holds clean', () => {
  const gitDir = mkTempDir();
  execFileSync('git', ['init', '-q'], { cwd: gitDir });
  const fgosDir = path.join(gitDir, '.fgos');
  const eventsDir = path.join(fgosDir, 'events');
  fs.mkdirSync(eventsDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'events.jsonl'), raw([ev(1, '2026-01-01T00:00:00.000Z', 'a')]), 'utf8');
  const writerPath = path.join(eventsDir, 'writer-a-1.jsonl');
  fs.writeFileSync(writerPath, raw([ev(1, '2026-08-23T00:00:00.000Z', 'x'), ev(2, '2026-08-23T00:00:01.000Z', 'y')]), 'utf8');

  const entry = DOCTOR_CHECKS.find((c) => c.id === 'events-jsonl-not-truncated');
  const bootstrapResult = entry.check(gitDir); // bootstraps the mark for both files
  assert.equal(bootstrapResult.passed, true);

  // Truncate the writer file back to just its first line.
  fs.writeFileSync(writerPath, raw([ev(1, '2026-08-23T00:00:00.000Z', 'x')]), 'utf8');
  const result = entry.check(gitDir);
  assert.equal(result.passed, false);
  assert.match(result.message, /events\/writer-a-1\.jsonl/);
});

// --- Tầng A/T6: events-compaction-verified (TA-D6) -------------------------

function hashOfObj(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}
function evWithHash(seq, ts, type, payload, src = 'writer-a') {
  const unhashed = { seq, ts, type, payload, v: 1, src };
  return { ...unhashed, h: hashOfObj(unhashed) };
}
function writeJsonlEvents(filePath, events) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, events.map((e) => `${JSON.stringify(e)}\n`).join(''), 'utf8');
}

test('events-compaction-verified passes trivially when no compaction has ever run', () => {
  const gitDir = mkTempDir();
  execFileSync('git', ['init', '-q'], { cwd: gitDir });
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'events-compaction-verified');
  const result = entry.check(gitDir);
  assert.equal(result.passed, true);
  assert.match(result.message, /nothing to verify/);
});

test('events-compaction-verified passes when a real compaction\'s baseline still matches its archived originals', () => {
  const gitDir = mkTempDir();
  execFileSync('git', ['init', '-q'], { cwd: gitDir });
  const fgosDir = path.join(gitDir, '.fgos');
  const eventsDir = path.join(fgosDir, 'events');
  const archiveDir = path.join(eventsDir, 'archive');

  const e1 = evWithHash(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' });
  writeJsonlEvents(path.join(archiveDir, 'writer-a-1.jsonl'), [e1]); // already archived
  writeJsonlEvents(path.join(eventsDir, 'baseline-1.jsonl'), [e1]); // the live compacted baseline
  fs.writeFileSync(
    path.join(archiveDir, 'compact-1.manifest.json'),
    JSON.stringify({ baseline: 'baseline-1.jsonl', originals: ['writer-a-1.jsonl'] }),
    'utf8',
  );

  const entry = DOCTOR_CHECKS.find((c) => c.id === 'events-compaction-verified');
  const result = entry.check(gitDir);
  assert.equal(result.passed, true);
  assert.match(result.message, /1 past compaction/);
});

test('events-compaction-verified fails and names the broken manifest when the baseline no longer matches its archived originals', () => {
  const gitDir = mkTempDir();
  execFileSync('git', ['init', '-q'], { cwd: gitDir });
  const fgosDir = path.join(gitDir, '.fgos');
  const eventsDir = path.join(fgosDir, 'events');
  const archiveDir = path.join(eventsDir, 'archive');

  const e1 = evWithHash(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' });
  writeJsonlEvents(path.join(archiveDir, 'writer-a-1.jsonl'), [e1]);
  writeJsonlEvents(path.join(eventsDir, 'baseline-1.jsonl'), []); // tampered/corrupted after the fact -- missing e1
  fs.writeFileSync(
    path.join(archiveDir, 'compact-1.manifest.json'),
    JSON.stringify({ baseline: 'baseline-1.jsonl', originals: ['writer-a-1.jsonl'] }),
    'utf8',
  );

  const entry = DOCTOR_CHECKS.find((c) => c.id === 'events-compaction-verified');
  const result = entry.check(gitDir);
  assert.equal(result.passed, false);
  assert.match(result.message, /compact-1\.manifest\.json/);
});

// --- workflow stage operations validation (Step 02 / D19) ---

test('findWorkflowStageOperationProblems passes on the live repository setup', () => {
  const problems = findWorkflowStageOperationProblems(process.cwd());
  assert.deepEqual(problems, []);
});

test('findWorkflowStageOperationProblems fails when operation taskSpec does not resolve', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'bad-task', taskSpec: 'nonexistent-task-spec-file', role: 'implementer', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /nonexistent-task-spec-file/);
});

test('findWorkflowStageOperationProblems fails when operation role is not in roleGraph.roles', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'researcher'],
      },
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', taskSpec: 'shape-plan', role: 'unknown-role-xyz', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /unknown-role-xyz/);
});

test('findWorkflowStageOperationProblems fails when operation skill is not provided by any agent-type', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-completely-fake-skill-123'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /fgos-completely-fake-skill-123/);
});

test('findWorkflowStageOperationProblems fails when operation reason has no matching roleGraph edge', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'reviewer'],
        edges: {
          planning: [
            { from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' },
          ],
        },
      },
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'validate-plan', taskSpec: 'validate-plan', role: 'reviewer', reason: 'review', skills: ['fgos-coding-validating'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /does not match any legal roleGraph edge/);
});

test('findWorkflowStageOperationProblems fails when multiple operations are marked primary: true', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', primary: true, taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: 'scout-blast-radius', primary: true, taskSpec: 'scout-blast-radius', role: 'researcher', skills: ['fgos-researching'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /2 operations marked primary: true/);
});

test('findWorkflowStageOperationProblems fails when primary operation contradicts stage taskSpec or skill', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          skillMap: { planning: 'fgos-coding-planning' },
          taskSpecMap: { planning: 'shape-plan' },
          operationMap: {
            planning: [
              { id: 'validate-plan', primary: true, taskSpec: 'validate-plan', role: 'reviewer', skills: ['fgos-coding-validating'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length >= 2, true);
  assert.ok(problems.some((p) => p.includes('contradicts stage taskSpec')));
  assert.ok(problems.some((p) => p.includes('does not include stage skill')));
});

test('findWorkflowStageOperationProblems fails when policy minTier or preferPersona is invalid', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'shape-plan',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: { minTier: 'ultra-mega-tier', preferPersona: 'alien-persona' },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.equal(problems.length >= 2, true);
  assert.ok(problems.some((p) => p.includes('policy.minTier')));
  assert.ok(problems.some((p) => p.includes('policy.preferPersona')));
});

test('findWorkflowStageOperationProblems fails on invalid dispatch mode or human-only with executor policy', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'bad-dispatch',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                dispatch: 'robot-only',
              },
              {
                id: 'bad-human-only',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                dispatch: 'human-only',
                policy: { preferExecutor: 'claude' },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.ok(problems.some((p) => p.includes('invalid dispatch mode "robot-only"')));
  assert.ok(problems.some((p) => p.includes('dispatch: human-only operation must not declare executor policy')));
});

test('findWorkflowStageOperationProblems fails on invalid preferExecutor, fallbackExecutors shape/names, or visibility', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'op1',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: {
                  preferExecutor: 'does-not-exist',
                  fallbackExecutors: 'pi', // string instead of array
                  visibility: 'opaque',
                },
              },
              {
                id: 'op2',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: {
                  fallbackExecutors: ['unrecognized-fake-executor'],
                },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.ok(problems.some((p) => p.includes('policy.preferExecutor "does-not-exist" is not a recognized executor')));
  assert.ok(problems.some((p) => p.includes('policy.fallbackExecutors must be an array of strings')));
  assert.ok(problems.some((p) => p.includes('policy.visibility "opaque" must be "headless" or "visible"')));
  assert.ok(problems.some((p) => p.includes('policy.fallbackExecutors contains unrecognized executor "unrecognized-fake-executor"')));
});

test('findWorkflowStageOperationProblems fails on duplicate operation id or empty id', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'duplicate-id', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: 'duplicate-id', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: '', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(process.cwd(), customDomains);
  assert.ok(problems.some((p) => p.includes('duplicate operation id "duplicate-id"')));
  assert.ok(problems.some((p) => p.includes('operation id must be a non-empty string')));
});

test('domain-workflow-operations-coverage doctor check is registered and passes on clean repo', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'domain-workflow-operations-coverage');
  assert.ok(check, 'domain-workflow-operations-coverage doctor check must be registered');
  const result = check.check(process.cwd());
  assert.equal(result.passed, true);
  assert.match(result.message, /every stage operation across domain workflows resolves/);
});

