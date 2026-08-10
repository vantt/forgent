// test/state/gate-bypass.test.mjs — docs/history/gate-bypass/plan.md Piece 1.
// Covers the two cases the plan's risk map flagged as needing explicit proof:
// the completeness scan must never false-negative on an incomplete artifact,
// and the D4 hard-gate floor must hold even at the highest level.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  LEVELS,
  DEFAULT_LEVEL,
  readGateBypassLevel,
  isTierCovered,
  hasOpenItems,
  canAutoApprove,
  canAutoApproveValidate,
} from '../../src/state/gate-bypass.mjs';

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

test('hasOpenItems: TODO marker anywhere flags open, even with a clean Outstanding section', () => {
  assert.equal(hasOpenItems(OPEN_ARTIFACT_TODO), true);
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

// ─── canAutoApproveValidate (D6, docs/history/gate-bypass/CONTEXT.md) ─────
// Same shape as canAutoApprove above, but the third axis is fgos-validating's
// own reality-gate verdict instead of an artifact completeness scan.

test('canAutoApproveValidate: verdict READY + covered tier + no hard-gate hit -> true', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'standard'), true);
});

test('canAutoApproveValidate: verdict READY WITH CONSTRAINTS never approves, regardless of level/tier', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY WITH CONSTRAINTS', 'heavy'), false);
});

test('canAutoApproveValidate: verdict NOT READY never approves', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'NOT READY', 'heavy'), false);
});

test('canAutoApproveValidate: level off never approves, even with verdict READY', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'off'), false);
});

test('canAutoApproveValidate: tier not covered by level never approves', () => {
  const item = { title: 'Add a config toggle', description: 'small ui tweak', tier: 'heavy' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'light'), false);
});

// D4 floor — same single-most-important-case shape as canAutoApprove's own
// D4 test: a hard-gate keyword hit must never be skippable, even with
// verdict READY at the highest level.
test('canAutoApproveValidate: D4 floor — hard-gate keyword in title blocks approval at level heavy, verdict READY', () => {
  const item = { title: 'Add auth bypass for internal service', description: 'small change', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'heavy'), false);
});

test('canAutoApproveValidate: D4 floor — hard-gate keyword in description blocks approval at level heavy, verdict READY', () => {
  const item = { title: 'Small cleanup', description: 'this also touches payment processing', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'heavy'), false);
});

test('canAutoApproveValidate: no hard-gate keyword + verdict READY + tier covered at level heavy -> true', () => {
  const item = { title: 'Rename a helper function', description: 'pure refactor, no behavior change', tier: 'heavy' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'heavy'), true);
});

test('canAutoApproveValidate: "auth" inside "authoring" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Verify authoring during fgos-exploring', description: 'docs-only change', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'heavy'), true);
});

test('canAutoApproveValidate: "audit" inside "audited" is not a hard-gate hit (tsk-1gj)', () => {
  const item = { title: 'Already done', description: 'already audited every other remaining caller', tier: 'light' };
  assert.equal(canAutoApproveValidate(item, 'READY', 'heavy'), true);
});
