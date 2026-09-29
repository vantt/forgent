// test/skills/coordination-raw-request-json-allowlist.test.mjs
// Unit I34 (Phase 7 item 5, drift check 2: "runtime skills contain no raw
// request JSON").
//
// Locked decision (Lead, 2026-09-28, plan.md's I34 unit block): a blanket,
// repo-wide "no raw declared-protocol/request JSON anywhere" check is FALSE
// against current, accepted reality --
// domains/coding/skills/fgos-code-change/SKILL.md (~L121-131) intentionally
// embeds raw `declared-protocol` request JSON for its documented "Optional:
// Concurrent Read-Only Fan-Out (Two-Request DAG Mode)" carve-out (a
// deliberate, reviewed Unit I28 design choice; see also
// test/skills/coordination-phase4-driver-discipline.test.mjs's own comment
// on this same carve-out). This test enforces the ALLOWLISTED form instead:
// no raw request JSON appears ANYWHERE across runtime skills except inside
// that one documented DAG-mode block -- catching new raw-JSON creep without
// contradicting the accepted design.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const SKILL_ROOTS = [
  path.join(REPO_ROOT, 'core/skills'),
  path.join(REPO_ROOT, 'domains/coding/skills'),
  path.join(REPO_ROOT, 'domains/marketing/skills'),
];

const DAG_MODE_ALLOWLISTED_FILE = path.join(REPO_ROOT, 'domains/coding/skills/fgos-code-change/SKILL.md');
const DAG_MODE_HEADING = '### Optional: Concurrent Read-Only Fan-Out (Two-Request DAG Mode)';

// Fingerprint of a raw declared-protocol/request JSON object (not a
// semantic CLI invocation, which is what every OTHER example in these
// skills uses instead).
const RAW_REQUEST_JSON_MARKERS = [
  /"kind"\s*:\s*"declared-protocol"/,
  /"protocolRef"\s*:/,
  /"coordinationId"\s*:\s*"/,
  /"steps"\s*:\s*\[/,
];

function listMarkdownFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdownFilesRecursive(full));
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

// Returns the DAG-mode section's own text span (from its heading to the
// next heading of the same or higher level, or EOF) so an allowlisted match
// must fall strictly within it -- a raw-JSON marker anywhere ELSE in the
// same file still fails.
function dagModeSectionSpan(content) {
  const start = content.indexOf(DAG_MODE_HEADING);
  assert.ok(start >= 0, `${DAG_MODE_ALLOWLISTED_FILE} must still contain the documented DAG-mode heading this allowlist is pinned to`);
  const afterHeading = start + DAG_MODE_HEADING.length;
  const nextHeadingMatch = content.slice(afterHeading).match(/\n#{1,3}\s+\S/);
  const end = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : content.length;
  return [start, end];
}

test('no runtime skill contains raw declared-protocol/request JSON outside the documented DAG-mode carve-out', () => {
  const dagModeFileContent = fs.readFileSync(DAG_MODE_ALLOWLISTED_FILE, 'utf8');
  const [dagStart, dagEnd] = dagModeSectionSpan(dagModeFileContent);

  let allowlistedMatchCount = 0;
  const offenders = [];

  for (const skillRoot of SKILL_ROOTS) {
    for (const filePath of listMarkdownFilesRecursive(skillRoot)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const marker of RAW_REQUEST_JSON_MARKERS) {
        const match = content.match(marker);
        if (!match) continue;
        const isAllowlistedFile = filePath === DAG_MODE_ALLOWLISTED_FILE;
        // A file can carry multiple markers at different offsets (this one
        // does: kind, coordinationId, protocolRef, steps all appear inside
        // the same DAG-mode block) -- check EVERY occurrence of EVERY
        // marker, not just the first, so a second raw-JSON block added
        // later in the same file outside the span still fails.
        const globalMarker = new RegExp(marker.source, 'g');
        let m;
        while ((m = globalMarker.exec(content)) !== null) {
          const offset = m.index;
          if (isAllowlistedFile && offset >= dagStart && offset < dagEnd) {
            allowlistedMatchCount += 1;
            continue;
          }
          offenders.push(`${path.relative(REPO_ROOT, filePath)} (offset ${offset}): raw request JSON marker ${marker} outside the documented DAG-mode carve-out`);
        }
      }
    }
  }

  assert.deepEqual(offenders, [], `raw request JSON found outside the accepted DAG-mode carve-out:\n${offenders.join('\n')}`);
  assert.ok(allowlistedMatchCount > 0, 'expected at least one raw-JSON marker inside the documented DAG-mode carve-out itself -- allowlist span or markers have drifted');
});
