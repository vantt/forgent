import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Phase 06 driver-contract: the mechanical coordination suite never reads
// SKILL.md, so it cannot prove this phase's actual diff. This file is the
// small content-contract that does: canonical skill text must carry the
// caveat-blocks-close rule in the close section itself, the two-request DAG
// pattern, the refused-vs-pending resume language, and the accepted
// projection-gap names a driver needs on a cold resume.

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODE_PANEL_SKILL = path.join(REPO_ROOT, 'domains/coding/skills/fgos-code-panel/SKILL.md');
const PLAN_LOOP_SKILL = path.join(REPO_ROOT, 'core/skills/fgos-plan-loop/SKILL.md');

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

test('canonical fgos-code-panel and fgos-plan-loop close sections both carry sharedCwdCaveat caveat-blocks-close', () => {
  const codePanelClose = markdownSection(readSkill(CODE_PANEL_SKILL), '## 4. Close, then merge, then verify');
  const planLoopClose = markdownSection(readSkill(PLAN_LOOP_SKILL), '## 4. Close a cell (`close.json`)');

  for (const [name, section] of [
    ['fgos-code-panel', codePanelClose],
    ['fgos-plan-loop', planLoopClose],
  ]) {
    assert.match(section, /sharedCwdCaveat/, `${name} close section must name sharedCwdCaveat`);
    assert.match(section, /status: 'recheck-required'/, `${name} close section must name recheck-required status`);
    assert.match(
      section,
      /Never issue `cell-closed` while any node carries a `sharedCwdCaveat` with `status: 'recheck-required'`/,
      `${name} close section must state the caveat-blocks-close rule in plain words`,
    );
    assert.match(section, /"disposition": "cell-closed"/, `${name} close section must still show the cell-closed template`);
  }
});

test('canonical fgos-code-panel documents the two-request DAG pattern with dag: true', () => {
  const text = readSkill(CODE_PANEL_SKILL);
  const dagSection = markdownSection(text, '### Optional: Concurrent Read-Only Fan-Out (Two-Request DAG Mode)');
  assert.match(dagSection, /"dag": true/);
  assert.match(dagSection, /two-request DAG-mode pattern/);
  assert.match(dagSection, /NEW.*coordinationId/s);
  assert.match(
    dagSection,
    /intentionally single-peer-safe \/ expected to self-caveat/,
    'the shared-cwd example must admit it self-caveats rather than pretending two peers on one cwd are clean',
  );
  assert.match(dagSection, /<testedSha>/, 'objectives must pin a commit SHA, not only a moving branch name');
});

test('canonical fgos-code-panel fresh-session resume contract names refused-vs-pending and accepted projection gaps', () => {
  const resume = markdownSection(readSkill(CODE_PANEL_SKILL), '### Fresh-session resume contract');
  assert.match(resume, /Refused-vs-pending ambiguity/);
  assert.match(resume, /schedulerOutcome='pending'/);
  assert.match(resume, /safe to \(re\)attempt/);
  assert.match(resume, /dag\.counts\.deferred/);
  assert.match(resume, /all N node\(s\) settled/);
  assert.match(resume, /schedulerOutcome: 'materialized'/);
});
