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
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';
import { readBacklogItemIdentity } from './identity-ids-unique.mjs';

// The YAML door needs the native addon; a missing addon must fail loudly here,
// never surface as swallowed parse errors that read as zero proposed items.
ensureAddonForScript();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VERDICTS = ['resolved', 'partial', 'open', 'stale'];

// An fgOS work item id, as it appears everywhere else in this repo.
const ITEM_ID = /\btsk-[a-z0-9]+(?:-[a-z0-9]+)*\b/;
// A `path/to/file.ext:123` citation — the only accepted proof that a verdict
// came from reading real code rather than from a state field or a prior report.
const PATH_LINE = /\b[\w./-]+\.(?:mjs|js|cjs|ts|md|json|sh|yml|yaml):\d+\b/;
// A git sha, accepted only for `stale` rows (the code being gone means there
// may be no live line left to cite).
const SHA = /\b[0-9a-f]{7,40}\b/;

/**
 * Reads all backlog items from dir, collecting proposed items, all items,
 * and the independent line-scan count of files with status: proposed.
 */
function readBacklogItems(dir) {
  const allItems = [];
  const proposedItems = [];
  const parseErrors = [];
  let scanned = 0;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    if (/^status:\s*proposed\s*$/m.test(text)) scanned += 1;
    try {
      const item = readBacklogItemIdentity(text, path.join(dir, name));
      allItems.push(item);
      if (item.status === 'proposed' && item.id) {
        proposedItems.push(item);
      }
    } catch (err) {
      parseErrors.push(`${name}: failed to read backlog item: ${err.message}`);
    }
  }
  return { allItems, proposedItems, scanned, parseErrors };
}

/**
 * Checks backlog reconciliation against docs/history/backlog-execution-reconciliation/RECONCILIATION.md.
 * Returns { passed, failures, proposedCount }.
 */
export function checkBacklogReconciliation(root = repoRoot) {
  const itemsDir = path.join(root, 'plans/backlog');
  const docPath = path.join(root, 'docs/history/backlog-execution-reconciliation/RECONCILIATION.md');
  const failures = [];
  const fail = (msg) => failures.push(msg);

  if (!fs.existsSync(itemsDir)) {
    throw new Error(`FAIL: ${path.relative(root, itemsDir)} does not exist.`);
  }

  const { allItems, proposedItems, scanned, parseErrors } = readBacklogItems(itemsDir);

  // Self-consistency: the id list must agree with the independent count of item
  // files whose status is proposed. An id list that disagrees with that count
  // must never produce a passing run — that is exactly the silent under-count
  // this check exists to make impossible.
  if (proposedItems.length !== scanned) {
    throw new Error(
      `FAIL: id list disagrees with the file count — read ${proposedItems.length} proposed ids, ` +
        `but ${scanned} item files say proposed. An item lost its id or its frontmatter; fix it ` +
        `before trusting any verdict below it.`,
    );
  }
  if (proposedItems.length === 0) {
    throw new Error(
      'FAIL: found zero proposed items under plans/backlog. Either the backlog is ' +
        'genuinely empty of proposed work, or the item format changed and this check ' +
        'has quietly stopped checking anything. Confirm which before silencing this.',
    );
  }

  for (const err of parseErrors) {
    fail(err);
  }

  const proposedIds = proposedItems.map((it) => it.id);
  const dupes = proposedIds.filter((id, i) => proposedIds.indexOf(id) !== i);
  if (dupes.length) fail(`plans/backlog lists duplicate proposed ids: ${[...new Set(dupes)].join(', ')}`);

  if (!fs.existsSync(docPath)) {
    throw new Error(`FAIL: ${path.relative(root, docPath)} does not exist — nothing has been reconciled.`);
  }
  const doc = fs.readFileSync(docPath, 'utf8');

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

  for (const item of proposedItems) {
    const sectionKey = sections.has(item.id)
      ? item.id
      : (item.originalId && sections.has(item.originalId) ? item.originalId : null);
    const section = sectionKey ? sections.get(sectionKey) : null;
    if (!section) {
      fail(`${item.id}: proposed under plans/backlog but has no section in RECONCILIATION.md`);
      continue;
    }
    const { verdict, body } = section;
    if (!VERDICTS.includes(verdict)) {
      fail(`${sectionKey}: verdict "${verdict}" is not one of ${VERDICTS.join('/')}`);
      continue;
    }
    if (verdict === 'resolved' || verdict === 'partial') {
      if (!ITEM_ID.test(body)) fail(`${sectionKey}: verdict "${verdict}" cites no fgOS item id (tsk-*)`);
      if (!PATH_LINE.test(body)) fail(`${sectionKey}: verdict "${verdict}" cites no path:line evidence`);
    }
    if (verdict === 'stale' && !PATH_LINE.test(body) && !SHA.test(body)) {
      fail(`${sectionKey}: verdict "stale" cites neither a path:line nor a commit sha`);
    }
  }

  const itemById = new Map();
  for (const item of allItems) {
    if (item.id) itemById.set(item.id, item);
    if (item.originalId && !itemById.has(item.originalId)) itemById.set(item.originalId, item);
  }

  for (const id of sections.keys()) {
    const item = itemById.get(id);
    if (!item) {
      fail(`${id}: reconciled in RECONCILIATION.md but is not a proposed item under plans/backlog`);
    } else if (item.status !== 'proposed') {
      fail(`${id}: reconciled in RECONCILIATION.md but item ${item.id} has status "${item.status}" (expected "proposed")`);
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    proposedCount: proposedItems.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rootIdx = process.argv.indexOf('--repo-root');
  const targetRoot = rootIdx !== -1 && process.argv[rootIdx + 1]
    ? path.resolve(process.argv[rootIdx + 1])
    : repoRoot;
  try {
    const result = checkBacklogReconciliation(targetRoot);
    if (!result.passed) {
      console.error(`FAIL: ${result.failures.length} problem(s) reconciling ${result.proposedCount} proposed PBI rows:`);
      for (const f of result.failures) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log(`OK: all ${result.proposedCount} proposed PBI rows reconciled with evidence.`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
