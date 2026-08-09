#!/usr/bin/env node
// Asserts that every PBI row still marked `proposed` in docs/backlog.md has
// been reconciled against the execution layer, with real evidence, in
// docs/history/backlog-execution-reconciliation/RECONCILIATION.md.
//
// The `proposed` id set is re-derived from docs/backlog.md on every run
// rather than hard-coded: that is what makes this catch FUTURE drift. A
// newly added `proposed` row starts failing here until someone reconciles
// it, which is the whole point — a reconciliation nobody re-checks stops
// being true, which is how the backlog got 0/31 done in the first place.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKLOG = path.join(repoRoot, 'docs/backlog.md');
const DOC = path.join(repoRoot, 'docs/history/backlog-execution-reconciliation/RECONCILIATION.md');

const VERDICTS = ['resolved', 'partial', 'open', 'stale'];

// An fgOS work item id, as it appears everywhere else in this repo.
const ITEM_ID = /\btsk-[a-z0-9]+(?:-[a-z0-9]+)*\b/;
// A `path/to/file.ext:123` citation — the only accepted proof that a verdict
// came from reading real code rather than from a state field or a prior report.
const PATH_LINE = /\b[\w./-]+\.(?:mjs|js|cjs|ts|md|json|sh|yml|yaml):\d+\b/;
// A git sha, accepted only for `stale` rows (the code being gone means there
// may be no live line left to cite).
const SHA = /\b[0-9a-f]{7,40}\b/;

const failures = [];
const fail = (msg) => failures.push(msg);

/**
 * Splits one markdown table row into cells.
 *
 * Deliberately does NOT trust a fixed left-hand index for the status column:
 * a Story cell containing a literal `|` shifts every column after it. Measured
 * on this repo's own backlog (2026-08-08): `cells[3]` finds 29 proposed rows
 * where the file really has 30, because STR70b's story carries a pipe. The
 * status column is the second from the right, which stays correct however many
 * pipes the prose in between contains.
 */
function parseRow(line) {
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length < 4) return null;
  return { id: cells[0], status: cells[cells.length - 2] };
}

function proposedIdsFromBacklog(text) {
  const ids = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('|') || line.startsWith('|--')) continue;
    const row = parseRow(line);
    if (row && row.status === 'proposed') ids.push(row.id);
  }
  return ids;
}

if (!fs.existsSync(BACKLOG)) {
  console.error(`FAIL: ${path.relative(repoRoot, BACKLOG)} does not exist.`);
  process.exit(1);
}
const backlog = fs.readFileSync(BACKLOG, 'utf8');
const proposed = proposedIdsFromBacklog(backlog);

// Self-consistency: the parser must agree with a whole-file scan. A parser
// that disagrees with itself must never produce a passing run — that is
// exactly the silent under-count this check exists to make impossible.
const scanned = (backlog.match(/\|\s*proposed\s*\|/g) ?? []).length;
if (proposed.length !== scanned) {
  console.error(
    `FAIL: parser disagrees with itself — classified ${proposed.length} proposed rows, ` +
      `but a whole-file scan finds ${scanned}. The table format changed; fix the parser ` +
      `before trusting any verdict below it.`,
  );
  process.exit(1);
}
if (proposed.length === 0) {
  console.error(
    'FAIL: extracted zero proposed rows from docs/backlog.md. Either the backlog is ' +
      'genuinely empty of proposed work, or the table format changed and this check ' +
      'has quietly stopped checking anything. Confirm which before silencing this.',
  );
  process.exit(1);
}

const dupes = proposed.filter((id, i) => proposed.indexOf(id) !== i);
if (dupes.length) fail(`docs/backlog.md lists duplicate proposed ids: ${[...new Set(dupes)].join(', ')}`);

if (!fs.existsSync(DOC)) {
  console.error(`FAIL: ${path.relative(repoRoot, DOC)} does not exist — nothing has been reconciled.`);
  process.exit(1);
}
const doc = fs.readFileSync(DOC, 'utf8');

// One section per PBI: `### <id> — verdict: <verdict>`, body running to the
// next `###` heading.
const sections = new Map();
const headingRe = /^### +(\S+) +— +verdict: +(\S+) *$/gm;
const heads = [...doc.matchAll(headingRe)];
for (const [i, m] of heads.entries()) {
  const id = m[1];
  const verdict = m[2];
  const start = m.index + m[0].length;
  const end = i + 1 < heads.length ? heads[i + 1].index : doc.length;
  if (sections.has(id)) fail(`${id}: appears more than once in RECONCILIATION.md`);
  sections.set(id, { verdict, body: doc.slice(start, end) });
}

for (const id of proposed) {
  const section = sections.get(id);
  if (!section) {
    fail(`${id}: proposed in docs/backlog.md but has no section in RECONCILIATION.md`);
    continue;
  }
  const { verdict, body } = section;
  if (!VERDICTS.includes(verdict)) {
    fail(`${id}: verdict "${verdict}" is not one of ${VERDICTS.join('/')}`);
    continue;
  }
  if (verdict === 'resolved' || verdict === 'partial') {
    if (!ITEM_ID.test(body)) fail(`${id}: verdict "${verdict}" cites no fgOS item id (tsk-*)`);
    if (!PATH_LINE.test(body)) fail(`${id}: verdict "${verdict}" cites no path:line evidence`);
  }
  if (verdict === 'stale' && !PATH_LINE.test(body) && !SHA.test(body)) {
    fail(`${id}: verdict "stale" cites neither a path:line nor a commit sha`);
  }
}

for (const id of sections.keys()) {
  if (!proposed.includes(id)) {
    fail(`${id}: reconciled in RECONCILIATION.md but is not a proposed row in docs/backlog.md`);
  }
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} problem(s) reconciling ${proposed.length} proposed PBI rows:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`OK: all ${proposed.length} proposed PBI rows reconciled with evidence.`);
