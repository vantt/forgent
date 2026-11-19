#!/usr/bin/env node
// plan-contract-check.mjs -- the mechanical check of the plan contract
// (core/skills/_shared/plan-contract.md). It reads plan frontmatter only through the
// YAML door (src/util/yaml.mjs) and never edits a plan.
//
//   node scripts/plan-contract-check.mjs --plan plans/<dir>   one plan; any error exits 1
//   node scripts/plan-contract-check.mjs --all [--root plans] every plan; plans without the
//                                                             `contract` marker are counted as
//                                                             legacy (warning), marked plans fail hard
//
// Exit codes: 0 clean, 1 contract error, 2 usage or unreadable input.
import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../src/util/yaml.mjs';
import { nativeDoor } from '../src/native/door.mjs';
import { isMainModule } from './lib/is-main-module.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';
import { PLAN_SECTIONS, hasSection } from '../src/portfolio/plan-sections.mjs';

// The YAML door and the write-scope package both answer through the native addon; a checkout stages its own.
ensureAddonForScript();

export const CONTRACT_MARKER = 'plan-v1';
// The plan vocabulary has one source, shared with the Rust portfolio reader and the head-name resolver.
const VOCABULARY = JSON.parse(fs.readFileSync(new URL('../packages/supervision/contracts/plan-vocabulary.v1.json', import.meta.url), 'utf8'));
export const STATUSES = VOCABULARY.statuses;
// Legacy status values and the contract value each one is rewritten to when the plan is migrated.
export const LEGACY_STATUS = {
  pending: 'draft', proposed: 'draft', todo: 'ready', 'in-progress': 'running',
  completed: 'done', complete: 'done', landed: 'done', done: 'done', approved: 'ready', cancelled: 'withdrawn', archived: 'withdrawn',
};
const PRIORITIES = VOCABULARY.priorities;
const TABLE_COLUMNS = VOCABULARY.tableColumns;

const strings = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && s.trim() !== '');

/**
 * The pairs among `items` ({id, footprint}) whose footprints may touch the same path, by the `write-scope`
 * package's rule (a directory contains its files, a glob meets what it matches). An unreadable entry is left out of
 * the comparison (readable entries of the same item still count); a truncated scan, or a claim the package dropped as too large or too long, throws, never a partial answer.
 * @returns {Array<{ a: string, b: string, shared: string[] }>}
 */
function collisions(items) {
  const found = nativeDoor().writeScope('collidingPairs', { items: items.map(({ id, footprint }) => ({ id, scopes: footprint })) });
  if (found.truncated) throw new Error(`footprint overlap scan stopped at its ${found.truncated.reason} (${found.truncated.limit}): the overlaps are not complete`);
  // An entry the package dropped (`scope-too-large`, `entry-too-long`, or any code this reader does not know) is a
  // claim that was never compared, so the answer is not complete. Only an unreadable entry (`entry-invalid`, and the
  // `scope-empty` of an item holding nothing else) is left out: `unreadableEntries` reports it by name.
  const dropped = found.problems.find((problem) => !['entry-invalid', 'scope-empty'].includes(problem.code));
  if (dropped) throw new Error(`footprint overlap scan dropped a claim (${dropped.code}${dropped.entry === undefined ? '' : `: ${dropped.entry.slice(0, 40)}`}): the overlaps are not complete`);
  return found.pairs;
}

/** The entries of `footprint` that are not a repo-relative path or glob. */
const unreadableEntries = (footprint) => footprint.filter((entry) => {
  try { nativeDoor().writeScope('canonicalize', { raw: entry }); return false; } catch { return true; }
});

const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
const links = (c) => c.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
const plain = (c) => links(c).replace(/[`*]/g, '').trim();
const idList = (c) => plain(c).split(/[,;]/).map((s) => s.trim()).filter((s) => s && !/^(-|none|—|n\/a)$/i.test(s));
// One footprint entry: only backticks around the whole entry, or a link whose text is the whole entry, are unwrapped.
// Every other character stays (a `*` is a glob), and nothing inside a code span is touched.
function unwrapEntry(entry) {
  let s = entry.trim();
  for (;;) {
    const code = /^`([^`]*)`$/.exec(s);
    if (code) return code[1].trim();
    const link = /^\[([^\[\]]*)\]\(([^)]*)\)$/.exec(s);
    if (!link) return s;
    s = link[1].trim();
  }
}
const pathList = (c) => c.split(/,|<br\s*\/?>/i).map(unwrapEntry).filter(Boolean);

/**
 * The phase table of `body`: the one markdown table whose header names a footprint column, as `{ header, rows }`.
 * `null` when no table has one; `{ ambiguous: n }` when several do. Mirrors the supervisor's reader
 * (packages/supervision/rust/src/portfolio.rs, `read_phase_table`).
 */
export function findPhaseTable(body) {
  const lines = body.split(/\r?\n/);
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trimStart().startsWith('|')) continue;
    let j = i;
    while (j < lines.length && lines[j].trimStart().startsWith('|')) j++;
    const block = lines.slice(i, j);
    const header = cells(block[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
    if (header.includes('footprint')) found.push({ header, rows: block.slice(2).map((l) => cells(l)) });
    i = j;
  }
  if (found.length > 1) return { ambiguous: found.length };
  return found[0] ?? null;
}

const WAVE = /^\+?[0-9]+$/;
const HISTORICAL = new Set(['done', 'withdrawn']);

/**
 * Checks the phase table, as the supervisor's reader refuses it: a table that exists is read strictly whatever the
 * plan's status (a column missing, no rows, several tables with a footprint column, a wave that is not an integer
 * from 1, a duplicate id); a missing table is an error only for a plan that is `ready` or `running`.
 */
function checkPhaseTable(body, errors, status) {
  const table = findPhaseTable(body);
  const strict = status === 'ready' || status === 'running';
  if (!table) { if (strict) errors.push('no phase table with a footprint column'); return; }
  if (table.ambiguous) { errors.push(`${table.ambiguous} tables have a footprint column: a plan has one phase table`); return; }
  const missing = TABLE_COLUMNS.filter((c) => !table.header.includes(c));
  if (missing.length) { errors.push(`phase table lacks columns: ${missing.join(', ')}`); return; }
  const at = (name) => table.header.indexOf(name);
  const phases = table.rows.map((r) => ({
    id: plain(r[at('id')] ?? ''), deps: idList(r[at('dependson')] ?? ''), footprint: pathList(r[at('footprint')] ?? ''),
    wave: plain(r[at('wave')] ?? ''), status: plain(r[at('status')] ?? '').toLowerCase(),
  }));
  if (!phases.length) { errors.push('phase table has no rows'); return; }
  const byId = new Map();
  for (const p of phases) {
    if (!p.id) errors.push('phase row without an id');
    else if (byId.has(p.id)) errors.push(`phase id ${p.id} appears twice`);
    else byId.set(p.id, p);
    const wave = WAVE.test(p.wave) ? Number(p.wave) : NaN;
    p.wave = Number.isSafeInteger(wave) && wave >= 1 && wave <= 0xffffffff ? wave : NaN;
    if (Number.isNaN(p.wave)) errors.push(`phase ${p.id}: wave must be an integer from 1`);
    if (!p.footprint.length) errors.push(`phase ${p.id}: footprint is empty`);
    if (!STATUSES.includes(p.status)) errors.push(`phase ${p.id}: status "${p.status}" is not one of ${STATUSES.join(', ')}`);
    if (status === 'ready') {
      for (const entry of unreadableEntries(p.footprint)) errors.push(`phase ${p.id}: footprint entry ${JSON.stringify(entry)} is not a repo-relative path or glob`);
    }
  }
  for (const p of phases) for (const d of p.deps) {
    const dep = byId.get(d);
    if (!dep) errors.push(`phase ${p.id}: depends on unknown phase ${d}`);
    else if (dep.wave >= p.wave) errors.push(`phase ${p.id} (wave ${p.wave}) depends on ${d} (wave ${dep.wave}): a phase runs in a later wave than its dependencies`);
  }
  // Same-wave overlap is a rule about phases that can still run together: a finished or withdrawn phase, and
  // every phase of a finished or withdrawn plan, is history that no lane can change.
  if (HISTORICAL.has(status)) return;
  const live = phases.filter((p) => !HISTORICAL.has(p.status));
  const waves = new Set(live.map((p) => p.wave).filter(Number.isInteger));
  for (const wave of waves) {
    const same = live.filter((p) => p.wave === wave && p.footprint.length);
    // Ids may repeat in a malformed table (already an error); the scan keys on position.
    let pairs;
    try { pairs = collisions(same.map((p, n) => ({ id: String(n), footprint: p.footprint }))); } catch (e) { errors.push(e.message); continue; }
    for (const { a, b } of pairs) errors.push(`phases ${same[Number(a)].id} and ${same[Number(b)].id} share wave ${wave} but their footprints overlap`);
  }
}

/**
 * Checks one plan directory against the contract.
 * @param {string} dir plan directory (holds plan.md)
 * @param {{ plansRoot?: string }} [opts] where `blockedBy` names are looked up; default the parent of `dir`
 * @returns {{ dir: string, legacy: boolean, unparseable?: boolean, meta: object, errors: string[] }} `legacy` is a plan without the contract marker
 */
export function checkPlanDir(dir, { plansRoot = path.dirname(path.resolve(dir)) } = {}) {
  const file = path.join(dir, 'plan.md');
  const errors = [];
  let parsed;
  const raw = fs.readFileSync(file, 'utf8');
  try { parsed = readFrontmatter(raw, file); } catch (e) {
    // A block the YAML door refuses is a contract error only for a plan that claims the contract.
    const claims = new RegExp(`^contract:\\s*${CONTRACT_MARKER}\\s*$`, 'm').test(raw);
    return { dir, legacy: !claims, unparseable: true, meta: {}, errors: [`frontmatter is not valid YAML: ${e.message}`] };
  }
  const { meta, body } = parsed;
  if (meta.contract !== CONTRACT_MARKER) {
    return { dir, legacy: true, meta, errors: [`no \`contract: ${CONTRACT_MARKER}\` marker`] };
  }
  if (typeof meta.title !== 'string' || !meta.title.trim()) errors.push('title must be a non-empty string');
  if (!STATUSES.includes(meta.status)) {
    const mapped = LEGACY_STATUS[meta.status];
    errors.push(`status "${meta.status}" is not one of ${STATUSES.join(', ')}${mapped ? `; write "${mapped}"` : ''}`);
  }
  if (!PRIORITIES.includes(meta.priority)) errors.push(`priority must be one of ${PRIORITIES.join(', ')}`);
  if (!Array.isArray(meta.blockedBy) || !strings(meta.blockedBy)) errors.push('blockedBy must be a list of plan directory names');
  else for (const b of meta.blockedBy) if (!fs.existsSync(path.join(plansRoot, b, 'plan.md'))) errors.push(`blockedBy names unknown plan ${b}`);
  if (!Array.isArray(meta.source) || !strings(meta.source)) errors.push('source must be a list of paths or backlog ids');
  if (typeof meta.created !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.created)) errors.push('created must be a YYYY-MM-DD string');
  if (meta.footprint !== undefined && !strings(meta.footprint)) errors.push('footprint must be a list of repo-relative paths or globs');
  if (meta.base !== undefined && !(typeof meta.base === 'string' && /^[0-9a-f]{40}$/.test(meta.base))) errors.push('base must be a full 40-character commit sha');
  if (meta.status === 'ready' || meta.status === 'running') {
    if (!Array.isArray(meta.footprint) || meta.footprint.length === 0) errors.push(`footprint is required when status is ${meta.status}`);
    if (meta.base === undefined) errors.push(`base is required when status is ${meta.status}`);
  }
  if (meta.status === 'ready' && strings(meta.footprint ?? [])) {
    for (const entry of unreadableEntries(meta.footprint ?? [])) errors.push(`footprint entry ${JSON.stringify(entry)} is not a repo-relative path or glob`);
  }
  for (const [name] of PLAN_SECTIONS) if (!hasSection(body, name)) errors.push(`missing section: ${name}`);
  checkPhaseTable(body, errors, meta.status);
  return { dir, legacy: false, meta, errors };
}

/** Checks every plan directory under `root`; returns per-plan results plus cross-plan footprint overlaps. */
export function checkAll(root) {
  const results = [];
  for (const name of fs.readdirSync(root).sort()) {
    const dir = path.join(root, name);
    if (fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'plan.md'))) results.push(checkPlanDir(dir, { plansRoot: root }));
  }
  return { results, overlaps: activeOverlaps(results) };
}

/** Pairs of ready or running contract plans whose footprints overlap (a truncated scan throws). */
export function activeOverlaps(results) {
  const active = results.filter((r) => !r.legacy && ['ready', 'running'].includes(r.meta.status) && strings(r.meta.footprint ?? []) && r.meta.footprint?.length);
  return collisions(active.map((r, n) => ({ id: String(n), footprint: r.meta.footprint })))
    .map(({ a, b }) => [path.basename(active[Number(a)].dir), path.basename(active[Number(b)].dir)]);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') flags.all = true;
    else if (a === '--plan' || a === '--root') flags[a.slice(2)] = argv[++i];
    else return { error: `unknown argument ${a}` };
  }
  if (flags.all === !!flags.plan) return { error: 'give exactly one of --all or --plan <dir>' };
  if ((flags.plan === undefined && 'plan' in flags) || (flags.root === undefined && 'root' in flags)) return { error: 'a flag lacks its value' };
  return { flags };
}

export function main(argv, out = console.log) {
  const { flags, error } = parseArgs(argv);
  if (error) { out(`plan-contract-check: ${error}`); return 2; }
  try {
    if (flags.plan) {
      const dir = path.resolve(flags.plan);
      const r = checkPlanDir(dir, { plansRoot: flags.root ? path.resolve(flags.root) : undefined });
      const errors = r.legacy ? r.errors.map((e) => `legacy plan: ${e}`) : r.errors;
      const others = r.legacy ? [] : activeOverlaps([r, ...siblings(dir, flags.root)]).filter((p) => p.includes(path.basename(dir)));
      for (const [a, b] of others) errors.push(`footprint overlaps another active plan: ${a} and ${b}`);
      for (const e of errors) out(`ERROR ${path.basename(dir)}: ${e}`);
      if (!errors.length) out(`ok ${path.basename(dir)}`);
      return errors.length ? 1 : 0;
    }
    const { results, overlaps: clashes } = checkAll(path.resolve(flags.root ?? 'plans'));
    const legacy = results.filter((r) => r.legacy);
    const marked = results.filter((r) => !r.legacy);
    const failing = marked.filter((r) => r.errors.length);
    for (const r of failing) for (const e of r.errors) out(`ERROR ${path.basename(r.dir)}: ${e}`);
    for (const [a, b] of clashes) out(`ERROR active plans ${a} and ${b} have overlapping footprints`);
    const byStatus = {};
    for (const r of legacy) {
      const s = r.unparseable ? 'unreadable' : (LEGACY_STATUS[r.meta.status] ?? 'unmapped');
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const broken = legacy.filter((r) => r.unparseable).length;
    out(`plans ${results.length}: under contract ${marked.length} (failing ${failing.length}), legacy ${legacy.length} (${broken} with frontmatter that is not valid YAML; would migrate to ${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})`);
    if (legacy.length) out('WARN legacy plans are not checked; add `contract: plan-v1` when a plan is next planned');
    return failing.length || clashes.length ? 1 : 0;
  } catch (e) {
    out(`plan-contract-check: ${e.message}`);
    return 2;
  }
}

function siblings(dir, root) {
  const plansRoot = root ? path.resolve(root) : path.dirname(dir);
  return fs.readdirSync(plansRoot).sort()
    .map((n) => path.join(plansRoot, n))
    .filter((d) => d !== dir && fs.existsSync(path.join(d, 'plan.md')))
    .map((d) => checkPlanDir(d, { plansRoot }));
}

if (isMainModule(import.meta.url)) process.exit(main(process.argv.slice(2)));
