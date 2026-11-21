#!/usr/bin/env node
// Asserts that every backlog item still marked `proposed` under plans/backlog/
// has been reconciled against the execution layer, with real evidence, in
// docs/history/backlog-execution-reconciliation/RECONCILIATION.md.
//
// The `proposed` id set is re-derived from the item files on every run
// rather than hard-coded: that is what makes this catch FUTURE drift. A
// newly added `proposed` item starts failing here until someone reconciles
// it, which is the whole point — a reconciliation nobody re-checks stops
// being true, which is how the backlog got 0/31 done in the first place.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFrontmatter } from '../src/util/yaml.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

// The YAML door needs the native addon; a missing addon must fail loudly here,
// never surface as swallowed parse errors that read as zero proposed items.
ensureAddonForScript();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

// One file per backlog item lives under the backlog item root.
const ITEMS_DIR = path.join(repoRoot, 'plans/backlog');

/**
 * The ids of the item files whose parsed frontmatter status is `proposed`, and,
 * counted independently of the YAML door, the number of item files that have a
 * `status: proposed` line anywhere (a whole-file line scan, no frontmatter reader).
 */
function proposedIdsFromItems(dir) {
  const ids = [];
  let scanned = 0;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    if (/^status:\s*proposed\s*$/m.test(text)) scanned += 1;
    let meta = {};
    try {
      meta = readFrontmatter(text, name).meta;
    } catch {
      // an unparseable block carries no id or status
    }
    if (meta.status === 'proposed' && typeof meta.id === 'string' && meta.id) ids.push(meta.id);
  }
  return { ids, scanned };
}

if (!fs.existsSync(ITEMS_DIR)) {
  console.error(`FAIL: ${path.relative(repoRoot, ITEMS_DIR)} does not exist.`);
  process.exit(1);
}
const { ids: proposed, scanned } = proposedIdsFromItems(ITEMS_DIR);

// Self-consistency: the id list must agree with the independent count of item
// files whose status is proposed. An id list that disagrees with that count
// must never produce a passing run — that is exactly the silent under-count
// this check exists to make impossible.
if (proposed.length !== scanned) {
  console.error(
    `FAIL: id list disagrees with the file count — read ${proposed.length} proposed ids, ` +
      `but ${scanned} item files say proposed. An item lost its id or its frontmatter; fix it ` +
      `before trusting any verdict below it.`,
  );
  process.exit(1);
}
if (proposed.length === 0) {
  console.error(
    'FAIL: found zero proposed items under plans/backlog. Either the backlog is ' +
      'genuinely empty of proposed work, or the item format changed and this check ' +
      'has quietly stopped checking anything. Confirm which before silencing this.',
  );
  process.exit(1);
}

const dupes = proposed.filter((id, i) => proposed.indexOf(id) !== i);
if (dupes.length) fail(`plans/backlog lists duplicate proposed ids: ${[...new Set(dupes)].join(', ')}`);

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
    fail(`${id}: proposed under plans/backlog but has no section in RECONCILIATION.md`);
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
    fail(`${id}: reconciled in RECONCILIATION.md but is not a proposed item under plans/backlog`);
  }
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} problem(s) reconciling ${proposed.length} proposed PBI rows:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`OK: all ${proposed.length} proposed PBI rows reconciled with evidence.`);
