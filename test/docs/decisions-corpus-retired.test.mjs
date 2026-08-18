// test/docs/decisions-corpus-retired.test.mjs — tsk-1lv-4 (D5): the
// hand-authored docs/decisions/*.md corpus (35 files: 34 numbered ADRs +
// 0000-index.md) is retired -- docs/decisions/ persists as a directory
// holding ONLY the generated index.md (fgos decision-index, tsk-1lv-2);
// every ADR's narrative moved into the docs/specs/<area>.md (or
// docs/architecture-map.md) its own frontmatter already declared via
// relates_specs, under a new "## Lịch sử quyết định retired từ
// docs/decisions/" section.
//
// What this file does NOT assert: live `state.decisions` content. The 34
// `fgos decision --scope <area>` calls that logged each ADR's short record
// were run directly against the shared main-checkout event log (the same
// "operator action on .fgos/, never through a branch's own commit" shape
// ADR0019/ADR0024's own migration scripts already established) -- that
// data is not part of this branch's portable git history the way
// docs/specs/*.md's edits are, so asserting on it here would pass on this
// machine and fail on any other clone/CI checkout. The `--scope` field and
// `fgos decision-index` verb's own capability is already covered by
// tsk-1lv-2's test/state/decision-scope-field.test.mjs and
// test/report/decision-index.test.mjs -- this file only re-verifies the
// structural/narrative side that IS portable.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DECISIONS_DIR = path.join(REPO_ROOT, 'docs', 'decisions');

// The 34 retired ADR ids (33 unique numbers + the real 0032 duplicate-
// numbering collision, disambiguated as 0032a/0032b for this test's own
// bookkeeping -- both real records, two different topics, confirmed by
// direct read before migration).
const RETIRED_ADR_HEADINGS = [
  '0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010',
  '0011', '0012', '0013', '0014', '0015', '0016', '0017', '0018', '0019', '0020',
  '0021', '0022', '0023', '0024', '0025', '0026', '0027', '0028', '0029', '0030',
  '0031', '0032', '0033',
];

const NARRATIVE_TARGETS = [
  'docs/specs/platform-foundations.md',
  'docs/specs/work-state.md',
  'docs/specs/runner.md',
  'docs/architecture-map.md',
  'docs/specs/system-overview.md',
];

test('docs/decisions/ contains no hand-authored NNNN-slug.md ADR files', () => {
  const entries = fs.existsSync(DECISIONS_DIR) ? fs.readdirSync(DECISIONS_DIR) : [];
  const adrFiles = entries.filter((f) => /^\d{4}-.*\.md$/.test(f));
  assert.deepEqual(adrFiles, [], 'every hand-authored ADR file must be gone -- only the generated index.md may remain');
});

test('docs/decisions/0000-index.md (the old hand-written index) no longer exists', () => {
  assert.equal(fs.existsSync(path.join(DECISIONS_DIR, '0000-index.md')), false);
});

test('docs/decisions/ still exists as a directory (D5: "docs/decisions/ giữ lại là thư mục")', () => {
  assert.equal(fs.existsSync(DECISIONS_DIR), true);
  assert.equal(fs.statSync(DECISIONS_DIR).isDirectory(), true);
});

test('every one of the 34 retired ADR ids has its narrative present in a docs/specs/<area>.md or docs/architecture-map.md "Lịch sử quyết định" section', () => {
  const combined = NARRATIVE_TARGETS.map((rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')).join('\n');
  const missing = [];
  for (const id of RETIRED_ADR_HEADINGS) {
    const headingPattern = new RegExp(`^### ${id} `, 'm');
    if (!headingPattern.test(combined)) missing.push(id);
  }
  assert.deepEqual(missing, [], `every retired ADR id must have a "### <id> ..." heading somewhere in ${NARRATIVE_TARGETS.join(', ')}`);
});

test('the real 0032 numbering collision migrated as two distinct sections (both topics preserved, neither silently dropped)', () => {
  const runner = fs.readFileSync(path.join(REPO_ROOT, 'docs/specs/runner.md'), 'utf8');
  const workState = fs.readFileSync(path.join(REPO_ROOT, 'docs/specs/work-state.md'), 'utf8');
  assert.match(runner, /### 0032 — Cổng Iron Law/, 'the Iron Law 0032 record must be in runner.md');
  assert.match(workState, /### 0032 — Multi-role Team Harness/, 'the Team Harness 0032 record must be in work-state.md');
});

test('each target spec file carries the "Lịch sử quyết định retired" section heading exactly once', () => {
  for (const rel of NARRATIVE_TARGETS) {
    const content = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    const matches = content.match(/^## Lịch sử quyết định retired từ docs\/decisions\/ \(tsk-1lv-4\)$/gm) ?? [];
    assert.equal(matches.length, 1, `${rel} must carry exactly one "Lịch sử quyết định retired" heading`);
  }
});

test('AGENTS.md no longer cites a deleted docs/decisions/NNNN-*.md path for the product priority order', () => {
  const agents = fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8');
  assert.doesNotMatch(agents, /docs\/decisions\/00\d\d(?!\/index)/, 'AGENTS.md must not point at a specific retired ADR file path');
});
