// test/state/gate-bypass.test.mjs — docs/history/gate-bypass/plan.md Piece 1.
// Covers the two cases the plan's risk map flagged as needing explicit proof:
// the completeness scan must never false-negative on an incomplete artifact,
// and the D4 hard-gate floor must hold even at the highest level.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LEVELS,
  DEFAULT_LEVEL,
  readGateBypassLevel,
  isTierCovered,
  hasOpenItems,
  canAutoApprove,
  canAutoApproveMergedGate,
  COST_REVERSIBLE,
} from '../../src/state/gate-bypass.mjs';
import { addWork } from '../../src/state/store.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gate-bypass-'));
}

// The shared-config-file read path (docs/history/doctor-fix-gate-bypass/
// CONTEXT.md D1/D3, tsk-2qz-2) needs `dir` nested under a real repo root
// (`readGateBypassLevel`'s own `dir` param is the `.fgos` directory;
// `readSharedConfig` internally resolves `path.dirname(dir)` as the repo
// root) -- unlike the flat `tmpDir()` above, whose `path.dirname` would
// otherwise land on the shared, uncontrolled `os.tmpdir()` itself.
function tmpFgosDir() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gate-bypass-repo-'));
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return fgosDir;
}

const CLEAR_ARTIFACT = `# feature — plan

## Some section

Body text.

## Outstanding questions

None — all decisions locked.
`;

const OPEN_ARTIFACT_TODO = `# feature — plan

Still need to check this. TODO: confirm with someone.

## Outstanding questions

None
`;

const OPEN_ARTIFACT_FIXME_PAREN = `# feature — plan

FIXME(alice): handle this edge case before shipping.

## Outstanding questions

None
`;

// The false positive this fixture exists to prove resolved: prose that
// legitimately discusses the word "todo" — as a status literal, an enum
// variant, or a marker-family reference — with no colon/paren following it,
// must NOT be read as a real, unfinished TODO marker.
const CLEAR_ARTIFACT_TODO_WORD_IN_PROSE = `# feature — plan

A refused claim leaves the item at todo rather than orphaning it at doing.
herdr-plugin's own WorkTab::Todo enum variant and the "TODO" tab label are
unrelated to this plan. A TODO-only placeholder is never acceptable here.
This plan discusses the TODO/FIXME marker family only as a concept.

## Outstanding questions

None
`;

const OPEN_ARTIFACT_REAL_QUESTION = `# feature — plan

## Outstanding questions

Does this also need to cover the review/approve gate?
`;

const OPEN_ARTIFACT_NO_SECTION = `# feature — plan

## Some section

Body text, no Outstanding questions section at all.
`;

test('LEVELS is off + TIERS in order', () => {
  assert.deepEqual(LEVELS, ['off', 'light', 'standard', 'heavy']);
  assert.equal(DEFAULT_LEVEL, 'off');
});

test('readGateBypassLevel: missing file defaults to off', () => {
  const dir = tmpDir();
  assert.equal(readGateBypassLevel(dir), 'off');
});

test('readGateBypassLevel: malformed JSON fails closed to off', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'gate-bypass.json'), '{ not json', 'utf8');
  assert.equal(readGateBypassLevel(dir), 'off');
});

test('readGateBypassLevel: unrecognized level value fails closed to off', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'gate-bypass.json'), JSON.stringify({ level: 'total' }), 'utf8');
  assert.equal(readGateBypassLevel(dir), 'off');
});

test('readGateBypassLevel: valid level round-trips', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'gate-bypass.json'), JSON.stringify({ level: 'standard' }), 'utf8');
  assert.equal(readGateBypassLevel(dir), 'standard');
});

// ─── shared-config-file read path (D1/D3, tsk-2qz-2) ──────────────────────

test('readGateBypassLevel: reads config.gateBypass.level from the shared config file when present and valid', () => {
  const fgosDir = tmpFgosDir();
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ gateBypass: { level: 'heavy' } }), 'utf8');
  assert.equal(readGateBypassLevel(fgosDir), 'heavy');
});

test('readGateBypassLevel: falls back to the legacy standalone file when the shared file exists but has no gateBypass key', () => {
  const fgosDir = tmpFgosDir();
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ runner: { timeoutMs: 5000 } }), 'utf8');
  fs.writeFileSync(path.join(fgosDir, 'gate-bypass.json'), JSON.stringify({ level: 'light' }), 'utf8');
  assert.equal(readGateBypassLevel(fgosDir), 'light');
});

test('readGateBypassLevel: falls back to the legacy standalone file when the shared file has an unrecognized gateBypass.level', () => {
  const fgosDir = tmpFgosDir();
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ gateBypass: { level: 'total' } }), 'utf8');
  fs.writeFileSync(path.join(fgosDir, 'gate-bypass.json'), JSON.stringify({ level: 'standard' }), 'utf8');
  assert.equal(readGateBypassLevel(fgosDir), 'standard');
});

test('readGateBypassLevel: fails closed to off when neither the shared file nor the legacy file has a valid level', () => {
  const fgosDir = tmpFgosDir();
  assert.equal(readGateBypassLevel(fgosDir), 'off');
});

test('readGateBypassLevel: never throws when the shared config file is malformed JSON, falls back to legacy', () => {
  const fgosDir = tmpFgosDir();
  fs.writeFileSync(path.join(fgosDir, 'config.json'), '{ not json', 'utf8');
  fs.writeFileSync(path.join(fgosDir, 'gate-bypass.json'), JSON.stringify({ level: 'standard' }), 'utf8');
  assert.equal(readGateBypassLevel(fgosDir), 'standard');
});

test('isTierCovered: off covers nothing', () => {
  for (const tier of ['light', 'standard', 'heavy']) {
    assert.equal(isTierCovered(tier, 'off'), false);
  }
});

test('isTierCovered: table-driven over every (tier, level) pair', () => {
  const expected = {
    'light,light': true, 'light,standard': true, 'light,heavy': true,
    'standard,light': false, 'standard,standard': true, 'standard,heavy': true,
    'heavy,light': false, 'heavy,standard': false, 'heavy,heavy': true,
  };
  for (const [key, want] of Object.entries(expected)) {
    const [tier, level] = key.split(',');
    assert.equal(isTierCovered(tier, level), want, `tier=${tier} level=${level}`);
  }
});

test('isTierCovered: unrecognized tier or level is never covered', () => {
  assert.equal(isTierCovered('nonexistent', 'heavy'), false);
  assert.equal(isTierCovered('light', 'nonexistent'), false);
});

test('hasOpenItems: clear artifact (Outstanding questions: None) is not open', () => {
  assert.equal(hasOpenItems(CLEAR_ARTIFACT), false);
});

test('hasOpenItems: a real "TODO:" marker flags open, even with a clean Outstanding section', () => {
  assert.equal(hasOpenItems(OPEN_ARTIFACT_TODO), true);
});

test('hasOpenItems: a real "FIXME(name):" marker (parenthesized form) also flags open', () => {
  assert.equal(hasOpenItems(OPEN_ARTIFACT_FIXME_PAREN), true);
});

test('hasOpenItems: prose that references "todo"/"TODO" as a status literal, enum variant, or marker-family name — never followed by a colon or paren — is NOT flagged open (false-positive regression guard)', () => {
  assert.equal(hasOpenItems(CLEAR_ARTIFACT_TODO_WORD_IN_PROSE), false);
});

test('hasOpenItems: a real question in Outstanding questions flags open', () => {
  assert.equal(hasOpenItems(OPEN_ARTIFACT_REAL_QUESTION), true);
});

test('hasOpenItems: missing Outstanding questions section fails closed to open', () => {
  assert.equal(hasOpenItems(OPEN_ARTIFACT_NO_SECTION), true);
});

test('hasOpenItems: non-string input fails closed to open', () => {
  assert.equal(hasOpenItems(undefined), true);
  assert.equal(hasOpenItems(null), true);
});

test('canAutoApprove: clear artifact + covered tier + no hard-gate hit -> true', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'standard'), true);
});

test('canAutoApprove: level off never approves, even with a clear artifact', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'off'), false);
});

test('canAutoApprove: open artifact never approves regardless of level/tier', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApprove(item, OPEN_ARTIFACT_TODO, 'heavy'), false);
});

test('canAutoApprove: tier not covered by level never approves', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'heavy' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'light'), false);
});

// D4 floor — the single most important case in this whole feature: a
// hard-gate risk-keyword hit must never be skippable, even with a clear
// artifact at the highest level.
test('canAutoApprove: D4 floor — hard-gate keyword in title blocks approval at level heavy', () => {
  const item = { title: 'Add auth bypass for internal service', description: 'small change', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), false);
});

test('canAutoApprove: D4 floor — hard-gate keyword in description blocks approval at level heavy', () => {
  const item = { title: 'Small cleanup', description: 'this also touches payment processing', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), false);
});

test('canAutoApprove: no hard-gate keyword + everything else clear at level heavy -> true', () => {
  const item = { title: 'Rename a helper function', description: 'pure refactor, no behavior change', tier: 'heavy' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), true);
});

// tsk-1gj: real false positives the scan report found live in the backlog
// (finding 11) -- "auth"/"audit" as substrings of unrelated words must
// never trip the hard-gate floor.
test('canAutoApprove: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Verify authoring during fgos-exploring', description: 'docs-only change', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), true);
});

test('canAutoApprove: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Already done', description: 'already audited every other remaining caller', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), true);
});

// ─── canAutoApproveMergedGate (tsk-224, docs/history/coding-planning- ─────
// validating-gate-redesign/CONTEXT.md D1/D3-D5/D8-D11) — the single gate
// that replaced planApprove + validateApprove, and the export that replaced
// canAutoApproveValidate. Four axes, every one monotone toward asking (D9).

const CLEAN_PLAN = ['# plan', '', '## Outstanding questions', '', 'None', ''].join('\n');
const OPEN_PLAN = ['# plan', '', '## Outstanding questions', '', '- still deciding the split', ''].join('\n');

test('canAutoApproveMergedGate: reversible cost + clean plan + covered tier + no hard-gate hit -> true', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'standard'), true);
});

test('canAutoApproveMergedGate: an expensive cost verdict never approves, regardless of level/tier', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], 'EXPENSIVE', 'heavy'), false);
});

// D9's monotone invariant, stated as a test: an unrecognized or missing
// cost verdict must fail closed rather than being treated as reversible.
test('canAutoApproveMergedGate: an unrecognized cost verdict fails closed', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], 'probably fine', 'heavy'), false);
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], undefined, 'heavy'), false);
});

test('canAutoApproveMergedGate: open items in plan.md never approve, even with a reversible cost', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, OPEN_PLAN, [], COST_REVERSIBLE, 'heavy'), false);
});

test('canAutoApproveMergedGate: level off never approves', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'off'), false);
});

test('canAutoApproveMergedGate: tier not covered by level never approves (D11 delegation ceiling)', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'heavy' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'light'), false);
});

test('canAutoApproveMergedGate: hard-gate keyword in title blocks approval at level heavy', () => {
  const item = { title: 'Add auth bypass for internal service', description: 'small change', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), false);
});

test('canAutoApproveMergedGate: hard-gate keyword in description blocks approval at level heavy', () => {
  const item = { title: 'Small cleanup', description: 'this also touches payment processing', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), false);
});

// D10 — the widened source. These four pin the exact boundary the measured
// assumption A1 draws: structured fields are scanned, narrative prose is not.

test('canAutoApproveMergedGate: D10 — a hard-gate keyword in the item footprint blocks approval', () => {
  const item = {
    title: 'Tidy a helper', description: 'pure refactor', tier: 'light',
    footprint: ['src/state/migration.mjs'],
  };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), false);
});

test('canAutoApproveMergedGate: D10 — a hard-gate keyword in a child footprint blocks approval', () => {
  const item = { title: 'Tidy a helper', description: 'pure refactor', tier: 'light' };
  const children = [{ title: 'Split the reader', verify: 'npm test', footprint: ['src/db/migration.mjs'] }];
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, children, COST_REVERSIBLE, 'heavy'), false);
});

test('canAutoApproveMergedGate: D10 — a hard-gate keyword in a child action blocks approval', () => {
  const item = { title: 'Tidy a helper', description: 'pure refactor', tier: 'light' };
  const children = [{ title: 'Step one', verify: 'npm test', action: 'D3: delete the stale rows' }];
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, children, COST_REVERSIBLE, 'heavy'), false);
});

// A1's measured boundary, as a regression test: plan.md's narrative prose is
// NOT part of the haystack. Scanning it would trip this floor on 266 of the
// repo's 318 real plan.md files (83.6%) on words like `audit`/`auth`/
// `security`, which are this project's everyday vocabulary — see
// mergedGateHaystack's own comment for why that would stop discriminating.
test('canAutoApproveMergedGate: A1 — hard-gate keywords in plan.md prose alone do NOT block approval', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  const prosePlan = [
    '# plan',
    '',
    'This plan touches no risky area, but its prose mentions audit, auth,',
    'security, and migration while explaining what it deliberately avoids.',
    '',
    '## Outstanding questions',
    '',
    'None',
    '',
  ].join('\n');
  assert.equal(canAutoApproveMergedGate(item, prosePlan, [], COST_REVERSIBLE, 'standard'), true);
});

test('canAutoApproveMergedGate: malformed childSpecs never throw and never widen the haystack', () => {
  const item = { title: 'Rename a helper function', description: 'pure refactor', tier: 'heavy' };
  for (const bad of [undefined, null, 'not an array', [null], [42], [{ footprint: 'not an array' }]]) {
    assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, bad, COST_REVERSIBLE, 'heavy'), true);
  }
});

test('canAutoApproveMergedGate: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Verify authoring during fgos-exploring', description: 'docs-only change', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), true);
});

test('canAutoApproveMergedGate: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Already done', description: 'already audited every other remaining caller', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), true);
});

// tsk-1gj's word-boundary guarantee must hold on D10's widened source too,
// not just on the item's own text — a footprint path like
// `src/authoring/index.mjs` must not read as an `auth` hit.
test('canAutoApproveMergedGate: D10 — word boundaries hold on footprint paths too', () => {
  const item = {
    title: 'Tidy a helper', description: 'pure refactor', tier: 'light',
    footprint: ['src/authoring/index.mjs', 'test/authoring.test.mjs'],
  };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), true);
});

// tsk-4gr: doc citations like `AUDIT.md` or bare AUDIT.md filename tokens must not trip keyword floor
test('canAutoApprove: backtick-quoted doc citation `AUDIT.md` does not trip hard-gate keyword audit (tsk-4gr)', () => {
  const item = { title: 'Fix false positive', description: 'Citing `AUDIT.md` in description', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), true);
});

test('canAutoApproveMergedGate: backtick-quoted doc citation `AUDIT.md` does not trip hard-gate keyword audit (tsk-4gr)', () => {
  const item = { title: 'Fix false positive', description: 'Citing `AUDIT.md` in description', tier: 'light' };
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), true);
});

test('canAutoApprove & canAutoApproveMergedGate: bare AUDIT.md filename token does not trip hard-gate keyword audit (tsk-4gr)', () => {
  const item = { title: 'Fix false positive', description: 'Citing AUDIT.md in description', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), true);
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), true);
});

test('canAutoApprove & canAutoApproveMergedGate: regression — genuine prose keyword mention "audit" still hard-gates (tsk-4gr)', () => {
  const item = { title: 'Security review', description: 'run a security audit of the login flow', tier: 'light' };
  assert.equal(canAutoApprove(item, CLEAR_ARTIFACT, 'heavy'), false);
  assert.equal(canAutoApproveMergedGate(item, CLEAN_PLAN, [], COST_REVERSIBLE, 'heavy'), false);
});

// ─── the `gate-check` CLI verb (tsk-65q) — fgos-coding-exploring/
// fgos-coding-validating's own "check whether the gate can auto-approve"
// step now calls `fgos gate-check` instead of embedding its own
// cwd-relative dynamic-import resolver + inline JSON.parse(argv). That
// resolver crashed unconditionally on a pure global npm install (no local
// src/state/*.mjs at cwd or at the calling repo's own root); routing
// through the CLI instead inherits bin/fgos.mjs's own static imports,
// which resolve against the CLI file's own location, never the caller's
// cwd. See test/cli/fgos-gate-approve.test.mjs for the CLI-level
// round-trip coverage (valid input, both gates, the no-crash-from-an-
// unrelated-cwd regression proof); the two tests below cover what the old
// snippet-extraction tests here used to: how a malformed --children value
// and a bad --plan path each fail, now that fail-closed is the CALLING
// SKILL's own responsibility (any non-`true` JSON output, including a
// non-zero exit, reads as "false" per fgos-coding-exploring/
// fgos-coding-validating's own Gate section prose) rather than the verb
// itself swallowing every error into a bare `false` on stdout.

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FGOS_BIN = path.join(REPO_ROOT, 'bin/fgos.mjs');

function tmpGateCheckFixture() {
  const fgosRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gate-check-cli-'));
  const fgosDir = path.join(fgosRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  addWork(fgosDir, { id: 'gate-check-fixture', title: 'Fixture item', description: 'fixture, not real work', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', tier: 'light' });
  fs.writeFileSync(path.join(fgosDir, 'gate-bypass.json'), JSON.stringify({ level: 'standard' }));
  const planPath = path.join(fgosRoot, 'plan.md');
  fs.writeFileSync(planPath, CLEAN_PLAN);
  return { fgosRoot, planPath };
}

test('gate-check: malformed --children JSON never crashes uncaught, and reports a real diagnostic on stderr rather than silence (tsk-65q, carries forward tsk-blk/tsk-13s\'s own regression intent)', () => {
  const { fgosRoot, planPath } = tmpGateCheckFixture();
  const result = spawnSync(
    process.execPath,
    [FGOS_BIN, 'gate-check', 'gate-check-fixture', '--gate', 'validateApprove', '--plan', planPath, '--children', '[{"title": "x",]', '--cost', COST_REVERSIBLE, '--dir', fgosRoot],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0, `expected a non-zero exit on malformed --children JSON, got status ${result.status}, stdout:\n${result.stdout}`);
  assert.match(result.stderr, /JSON/, `expected a real diagnostic on stderr, got:\n${JSON.stringify(result.stderr)}`);
});

test('gate-check: a bad --plan path also never crashes uncaught, and reports a real diagnostic on stderr rather than silence (tsk-65q, carries forward tsk-blk/tsk-13s\'s own regression intent)', () => {
  const { fgosRoot } = tmpGateCheckFixture();
  const badPlanPath = path.join(fgosRoot, 'no-such-plan.md');
  const result = spawnSync(
    process.execPath,
    [FGOS_BIN, 'gate-check', 'gate-check-fixture', '--gate', 'validateApprove', '--plan', badPlanPath, '--children', '[]', '--cost', COST_REVERSIBLE, '--dir', fgosRoot],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0, `expected a non-zero exit on a bad --plan path, got status ${result.status}, stdout:\n${result.stdout}`);
  assert.match(result.stderr, /ENOENT/, `expected a real diagnostic on stderr instead of silence -- this is exactly what a confused caller (wrong plan path) needs to debug their own command; got stderr:\n${JSON.stringify(result.stderr)}`);
});
