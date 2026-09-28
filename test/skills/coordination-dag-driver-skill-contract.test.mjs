import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chainCoordinationUseCase } from '../../src/verbs/coordination/chain.mjs';

// Phase 06 driver-contract: the mechanical coordination suite never reads
// SKILL.md, so it cannot prove this phase's actual diff. This file is the
// small content-contract that does: canonical skill text must carry the
// caveat-blocks-close rule in the close section itself, the two-request DAG
// pattern, the refused-vs-pending resume language, and the accepted
// projection-gap names a driver needs on a cold resume.

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Phase 06 (Unit I28) created fgos-code-change as the merged facade; Unit
// I29 converted fgos-code-panel/fgos-plan-loop into deprecated stubs once
// this file's fgos-code-change assertions below proved the content carried
// forward -- the former fgos-code-panel/fgos-plan-loop-targeted assertions
// are retired here, not weakened: their coverage is fully subsumed by the
// fgos-code-change assertions below, which assert the identical content.
const CODE_CHANGE_SKILL = path.join(REPO_ROOT, 'domains/coding/skills/fgos-code-change/SKILL.md');
const CODE_CHANGE_PLAN_MODE = path.join(REPO_ROOT, 'domains/coding/skills/fgos-code-change/references/plan-mode.md');

function readSkill(skillPath) {
  return fs.readFileSync(skillPath, 'utf8');
}

function markdownSection(text, heading) {
  const start = text.indexOf(heading);
  assert.ok(start >= 0, `expected heading ${JSON.stringify(heading)}`);
  const after = start + heading.length;
  const next = text.indexOf('\n## ', after);
  return next === -1 ? text.slice(start) : text.slice(start, next);
}

test('canonical fgos-code-change close section carries sharedCwdCaveat caveat-blocks-close', () => {
  const codeChangeClose = markdownSection(readSkill(CODE_CHANGE_SKILL), '## Step 4: Close a Cell');
  assert.match(codeChangeClose, /sharedCwdCaveat/, 'fgos-code-change close section must name sharedCwdCaveat');
  assert.match(codeChangeClose, /status: 'recheck-required'/, 'fgos-code-change close section must name recheck-required status');
  assert.match(codeChangeClose, /Never issue close while one does/, 'fgos-code-change close section must state the caveat-blocks-close rule in plain words');
  assert.match(codeChangeClose, /fgos coordination close/, 'fgos-code-change close section must use semantic close command');
  assert.doesNotMatch(codeChangeClose, /close\.json/, 'fgos-code-change close section must not use raw close.json');
});

test('canonical fgos-code-change documents the two-request DAG pattern with dag: true', () => {
  const text = readSkill(CODE_CHANGE_SKILL);
  const dagSection = markdownSection(text, '### Optional: Concurrent Read-Only Fan-Out (Two-Request DAG Mode)');
  assert.match(dagSection, /"dag": true/);
  assert.match(dagSection, /Two-Request DAG Mode/);
  assert.match(dagSection, /NEW.*coordinationId/s);
  assert.match(
    dagSection,
    /intentionally single-peer-safe \/ expected to self-caveat/,
    'the shared-cwd example must admit it self-caveats rather than pretending two peers on one cwd are clean',
  );
  assert.match(dagSection, /<testedSha>/, 'objectives must pin a commit SHA, not only a moving branch name');
});

test('canonical fgos-code-change Step 0 names refused-vs-pending and accepted projection gaps', () => {
  const resume = markdownSection(readSkill(CODE_CHANGE_SKILL), '## Step 0: Determine Mode and Resume');
  assert.match(resume, /Refused-vs-pending ambiguity/);
  assert.match(resume, /schedulerOutcome: 'pending'/);
  assert.match(resume, /safe to \(re\)attempt/);
  assert.match(resume, /dag\.counts\.deferred/);
  assert.match(resume, /all N node\(s\) settled/);
  assert.match(resume, /schedulerOutcome: 'materialized'/);
});

test('canonical fgos-code-change plan-mode reference names track-level cell selection and closeout', () => {
  const planMode = readSkill(CODE_CHANGE_PLAN_MODE);
  assert.match(planMode, /active cell/);
  assert.match(planMode, /terminal cell not integrated/);
  assert.match(planMode, /merged cell with stale session evidence/);
  assert.match(planMode, /completed track/);
  assert.match(planMode, /track-closeout\.md/);
});

test('canonical fgos-code-change two-request DAG mode names the inspect--<coordinationId> auxiliary pattern, never a <coordinationId>-suffix', () => {
  const text = readSkill(CODE_CHANGE_SKILL);
  const dagSection = markdownSection(text, '### Optional: Concurrent Read-Only Fan-Out (Two-Request DAG Mode)');
  assert.match(dagSection, /"coordinationId":\s*"inspect--<coordinationId>"/, 'the JSON template\'s own coordinationId value must use the non-prefix-colliding auxiliary id shape');
  assert.doesNotMatch(dagSection, /"coordinationId":\s*"<coordinationId>-inspections"/, 'the JSON template must not use the old suffix shape, which collides with chain.mjs\'s <track>-- prefix match');
});

// Regression (tsk item from fix-round-1): a plan-mode coordinationId is
// `<track>--<cell-id>`. An auxiliary two-request-DAG session id that merely
// appended a suffix (`<coordinationId>-inspections`) still started with the
// literal `<track>--` prefix `src/verbs/coordination/chain.mjs` uses for
// track-membership matching, so it was silently grouped as a fake extra cell
// of the track. Prove the renamed `inspect--<coordinationId>` shape is never
// grouped, against the REAL chain.mjs (not a re-derived predicate).
test('an inspect--<coordinationId> auxiliary session id is never grouped by fgos coordination chain <track>', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-code-change-chain-prefix-test-'));
  const sessionsDir = path.join(tempDir, '.fgos', 'coordination', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });

  const track = 'code-change-facade-track';
  const realCellSessionId = `${track}--cell-01`;
  const auxiliarySessionId = `inspect--${realCellSessionId}`;
  // The old, rejected shape -- kept here only to prove the bug this rename
  // fixes actually reproduces without it, not as a recommended pattern.
  const oldBuggySessionId = `${realCellSessionId}-inspections`;

  for (const id of [realCellSessionId, auxiliarySessionId, oldBuggySessionId]) {
    fs.mkdirSync(path.join(sessionsDir, id), { recursive: true });
  }

  const ctx = { cwd: tempDir, repoRoot: tempDir };
  const result = chainCoordinationUseCase(ctx, { track });
  const sessionIds = result.cells.map((cell) => cell.sessionId);

  assert.ok(sessionIds.includes(realCellSessionId), 'the real cell must still be grouped');
  assert.ok(
    !sessionIds.includes(auxiliarySessionId),
    'the renamed inspect--<coordinationId> auxiliary id must never be grouped as a track member',
  );
  assert.ok(
    sessionIds.includes(oldBuggySessionId),
    'sanity check: the old <coordinationId>-inspections shape DOES reproduce the bug (confirms the rename is load-bearing, not cosmetic)',
  );

  fs.rmSync(tempDir, { recursive: true, force: true });
});
