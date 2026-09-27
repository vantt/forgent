// CLI integration coverage for `fgos plan-lint <path>` -- the read-only door
// onto lintPlanCapabilityAnnotations (src/report/capability-plan-lint.mjs).
// Self-contained harness (own tmpCwd/run/envelopeData), same style as
// fgos-faults.test.mjs in this directory.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// `ensureRunnerConfigForDir` always merges in the REAL machine's global
// `~/.fgos/config.json` (mergeWithGlobalConfig, project wins) -- read-only,
// but on a dev machine running other concurrent fgOS work that global file
// can carry an in-progress, incompatible catalog shape (confirmed live:
// another worktree's capability-catalog experiment tripped
// validateCapabilitiesShape here). Isolate HOME to a throwaway, empty
// directory for every spawn so this suite never reads that shared file.
const ISOLATED_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plan-lint-home-'));

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: ISOLATED_HOME, USERPROFILE: ISOLATED_HOME },
  });
}

// `ensureRunnerConfigForDir`'s bare-bootstrap fallback (no prior `fgos
// setup`) writes DEFAULT_RUNNER_CONFIG only -- no `capabilities` catalog at
// all (that catalog is registered separately, via `fgos setup`'s
// config-default registry, and running the real `setup` verb per fixture
// here is too slow -- ~20s each -- for a unit-test suite). Write the same
// resulting shape directly instead: a real project's `.fgos/config.json`
// after `fgos setup` always carries `runner.capabilities`, so every fixture
// here starts from that same state without paying for the real subprocess.
function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plan-lint-cli-'));
  const runner = { ...DEFAULT_RUNNER_CONFIG, executor: { command: 'true', args: [] }, capabilities: DEFAULT_CAPABILITY_SLOTS };
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), `${JSON.stringify({ runner }, null, 2)}\n`);
  return cwd;
}

function writePlan(cwd, name, text) {
  const abs = path.join(cwd, name);
  fs.writeFileSync(abs, text);
  return name;
}

// Deliberately no `.fgos/` at all -- unlike tmpCwd() above, which always
// pre-seeds a config so most tests can lint against a known catalog.
function bareTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plan-lint-bare-'));
}

function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  return envelope.data;
}

test('missing <path> is a usage error: exit 2, stderr names the requirement', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['plan-lint']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires a <path>/);
});

test('a nonexistent path is a usage error: exit 2', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['plan-lint', 'no-such-plan.md']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /is not an existing file/);
});

test('a project with no .fgos/config.json at all is a usage error: exit 2, and no config gets created', () => {
  const cwd = bareTmpDir();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:implement\n`);
  const result = run(cwd, ['plan-lint', rel]);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(fs.existsSync(path.join(cwd, '.fgos', 'config.json')), false, 'plan-lint must never bootstrap a runner config as a side effect of a read-only lint');
});

test('a bare --cell with no value is a usage error: exit 2', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:implement\n`);
  const result = run(cwd, ['plan-lint', rel, '--cell']);
  assert.equal(result.status, 2, result.stderr);
});

test('a clean plan exits 0, --json reports ok:true with no findings', () => {
  const cwd = tmpCwd();
  const rel = writePlan(
    cwd,
    'plan.md',
    `- unit: apply the fix\n  capability: code:implement\n- unit: review it\n  capability: code:review\n`,
  );
  const result = run(cwd, ['plan-lint', rel, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.ok, true);
  assert.deepEqual(data.findings, []);
  assert.equal(data.units.length, 2);
  assert.match(data.path, /plan\.md$/);
});

test('--json omitted (default) prints a human-readable report naming each unit\'s registered capability description', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:implement\n`);
  const result = run(cwd, ['plan-lint', rel]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /OK -- no hard findings/);
  assert.match(result.stdout, /code:implement/);
  assert.match(result.stdout, /coding implementation/i);
});

test('a hard finding (unregistered capability) exits 1, --json reports ok:false', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:teleport\n`);
  const result = run(cwd, ['plan-lint', rel, '--json']);
  assert.equal(result.status, 1, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.ok, false);
  assert.equal(data.findings.length, 1);
  assert.equal(data.findings[0].code, 'capability.unregistered');
  assert.equal(data.findings[0].severity, 'hard');
});

test('default readable output on a failing plan says FAILED and lists the finding', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:teleport\n`);
  const result = run(cwd, ['plan-lint', rel]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /FAILED -- hard findings present/);
  assert.match(result.stdout, /HARD capability\.unregistered/);
});

test('a warn-only finding (unresolved) still exits 0', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: unresolved (needs a new slot)\n`);
  const result = run(cwd, ['plan-lint', rel, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.ok, true);
  assert.equal(data.findings[0].code, 'capability.unresolved');
  assert.equal(data.findings[0].severity, 'warn');
});

test('--cell scopes the result to only the matching unit', () => {
  const cwd = tmpCwd();
  const rel = writePlan(
    cwd,
    'plan.md',
    `- unit: I18 — plan lint hardening\n  capability: code:implement\n- unit: I19 — catalog serves\n  capability: code:teleport\n`,
  );
  const result = run(cwd, ['plan-lint', rel, '--cell', 'I18', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.ok, true);
  assert.equal(data.units.length, 1);
  assert.equal(data.units[0].unit, 'I18 — plan lint hardening');
});

test('--cell with no match reports capability.undeclared (warn) and still exits 0', () => {
  const cwd = tmpCwd();
  const rel = writePlan(cwd, 'plan.md', `- unit: apply the fix\n  capability: code:implement\n`);
  const result = run(cwd, ['plan-lint', rel, '--cell', 'no-such-cell', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.ok, true);
  assert.deepEqual(data.units, []);
  assert.equal(data.findings[0].code, 'capability.undeclared');
  assert.equal(data.findings[0].severity, 'warn');
});

test('running plan-lint on the track\'s own plan.md lints clean and shows I15\'s code:implement description', () => {
  const trackPlan = path.resolve(__dirname, '../../plans/260919-coordination-skill-harness-simplification/plan.md');
  assert.ok(fs.existsSync(trackPlan), 'fixture plan.md must exist in this checkout');
  const cwd = tmpCwd();
  const result = run(cwd, ['plan-lint', trackPlan]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /I15/);
  assert.match(result.stdout, /coding implementation/i);
});
