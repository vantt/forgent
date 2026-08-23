#!/usr/bin/env node
// check-decision-supersession.mjs — detects a decision record named in
// another record's `supersedes:` frontmatter that carries no backward
// pointer of its own (STR72 follow-up, PBI p-9fb81485). Two independent
// signals, checked separately per target: its own frontmatter
// (`superseded_by:`) and its row in docs/decisions/0000-index.md.
// Detection only — flags drift, never fixes it.

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../src/report/frontmatter.mjs';

const ID_PATTERN = /^\d{4}$/;

/**
 * Pure: classify a record's raw `supersedes` frontmatter value.
 * - 'ids'   — array where every item matches ID_PATTERN (e.g. ['0002'])
 * - 'empty' — an empty array (`supersedes: []`)
 * - 'prose' — anything else (a plain string, or an array with a non-id item)
 * - 'none'  — the record has no `supersedes` key at all
 */
export function classifySupersedes(raw) {
  if (raw === undefined) return { kind: 'none' };
  if (Array.isArray(raw)) {
    if (raw.length === 0) return { kind: 'empty' };
    if (raw.every((item) => ID_PATTERN.test(item))) return { kind: 'ids', ids: raw };
    return { kind: 'prose', raw };
  }
  return { kind: 'prose', raw };
}

/**
 * Pure: find the single index-table line for `id` (matched on the
 * `[<id>]` markdown-link anchor a hand-maintained row always carries).
 * Returns null when no such row exists — a distinct finding from a row
 * existing but missing the backward-pointer substring.
 */
function findIndexRow(indexContent, id) {
  return indexContent.split('\n').find((line) => line.includes(`[${id}]`)) ?? null;
}

/**
 * Pure: does a record's raw `superseded_by` frontmatter value point back
 * at `id`? A record superseded more than once carries `superseded_by` as
 * a list (e.g. `[0028, 0029]`); a record superseded once carries it as a
 * scalar. Both are valid — this checks membership either way rather than
 * assuming one shape.
 */
function pointsBackAt(supersededBy, id) {
  return Array.isArray(supersededBy) ? supersededBy.includes(id) : supersededBy === id;
}

/**
 * Pure: given every decision record's `{ id, meta }` and the raw
 * `0000-index.md` text, return every supersession-drift finding. Records
 * are supplied already parsed — this function does no file I/O.
 */
export function findSupersessionFindings(records, indexContent) {
  const byId = new Map(records.map((r) => [r.id, r]));
  const findings = [];

  for (const record of records) {
    const classified = classifySupersedes(record.meta.supersedes);

    if (classified.kind === 'prose') {
      findings.push({
        kind: 'unparseable',
        id: record.id,
        raw: classified.raw,
        message: `${record.id}: supersedes frontmatter is not a clean list of ids -- check by hand`,
      });
      continue;
    }
    if (classified.kind !== 'ids') continue;

    for (const targetId of classified.ids) {
      const target = byId.get(targetId);
      if (!target) {
        findings.push({
          kind: 'unknown-target',
          id: record.id,
          targetId,
          message: `${record.id}: supersedes unknown id ${targetId}`,
        });
        continue;
      }

      if (!pointsBackAt(target.meta.superseded_by, record.id)) {
        findings.push({
          kind: 'missing-frontmatter-pointer',
          id: targetId,
          supersededBy: record.id,
          message: `${targetId}: superseded by ${record.id} but its own frontmatter has no superseded_by: ${record.id}`,
        });
      }

      const row = findIndexRow(indexContent, targetId);
      if (row === null) {
        findings.push({
          kind: 'missing-index-row',
          id: targetId,
          message: `${targetId}: no row found in 0000-index.md (expected a "[${targetId}]" anchor)`,
        });
      } else if (!row.includes(record.id)) {
        findings.push({
          kind: 'missing-index-pointer',
          id: targetId,
          supersededBy: record.id,
          message: `${targetId}: its 0000-index.md row does not mention superseding id ${record.id}`,
        });
      }
    }
  }
  return findings;
}

function loadRecords(decisionsDir) {
  const files = fs.readdirSync(decisionsDir).filter((f) => /^\d{4}-.*\.md$/.test(f));
  return files.map((file) => {
    const id = file.slice(0, 4);
    const content = fs.readFileSync(path.join(decisionsDir, file), 'utf8');
    const { meta } = parseFrontmatter(content);
    return { id, meta, file };
  });
}

function parseArgs(argv) {
  const dirIdx = argv.indexOf('--dir');
  const dir = dirIdx >= 0 ? argv[dirIdx + 1] : 'docs/decisions';
  return { dir };
}

function runCli(argv, cwd) {
  const { dir } = parseArgs(argv);
  const decisionsDir = path.resolve(cwd, dir);
  const indexPath = path.join(decisionsDir, '0000-index.md');
  // tsk-1lv-4 D5: the hand-authored docs/decisions/*.md corpus this check
  // was written for is retired for good -- docs/decisions/ is now a
  // directory holding only the generated docs/decisions/index.md (fgos
  // decision-index, tsk-1lv-2), which is not this file's own
  // 0000-index.md, and the NNNN-*.md + 0000-index.md pointer-pair format
  // this check validates cannot come back (tsk-1lv review-fix F9: unlike
  // every other "absent capability = clean skip" check in this repo, that
  // absence is now permanent, not "not yet present"). Confirmed by direct
  // reproduction, not assumed: graceful degradation (never a crash) is
  // still correct here -- there is a real difference between "nothing to
  // check because the corpus is gone" and "crashed because a file this
  // script forgot to expect went missing" -- but this script is
  // deliberately no longer wired into `npm run check:*` (removed from
  // package.json, F9) so nobody mistakes a standing green check for live
  // coverage of anything. The pure functions below
  // (classifySupersedes/findSupersessionFindings) stay real and tested
  // against synthetic fixtures (test/scripts/check-decision-supersession.
  // test.mjs) -- only the real-repo CLI mode is retired.
  if (!fs.existsSync(indexPath)) {
    console.log('check-decision-supersession: docs/decisions/0000-index.md not found -- the NNNN-*.md ADR corpus format this check validates was retired for good (tsk-1lv-4); this check has no real-repo target left to run against.');
    return 0;
  }
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const records = loadRecords(decisionsDir);
  const findings = findSupersessionFindings(records, indexContent);

  if (findings.length === 0) {
    console.log('check-decision-supersession: no findings.');
    return 0;
  }
  console.log(`check-decision-supersession: ${findings.length} finding(s):`);
  for (const f of findings) console.log(`  - ${f.message}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
