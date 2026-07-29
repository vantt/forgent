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
} from '../../src/state/gate-bypass.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gate-bypass-'));
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
