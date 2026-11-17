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
import { isMainModule } from './lib/is-main-module.mjs';
import { PLAN_SECTIONS, hasSection } from '../src/portfolio/plan-sections.mjs';

export const CONTRACT_MARKER = 'plan-v1';
export const STATUSES = ['draft', 'ready', 'running', 'done', 'withdrawn'];
// Legacy status values and the contract value each one is rewritten to when the plan is migrated.
export const LEGACY_STATUS = {
  pending: 'draft', proposed: 'draft', todo: 'ready', 'in-progress': 'running',
  completed: 'done', complete: 'done', landed: 'done', done: 'done', approved: 'ready', cancelled: 'withdrawn', archived: 'withdrawn',
};
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const TABLE_COLUMNS = ['id', 'title', 'dependson', 'footprint', 'wave', 'status'];

const strings = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && s.trim() !== '');
const norm = (p) => p.replace(/\\/g, '/').replace(/\*.*$/, '').replace(/\/+$/, '');

/** Whether two footprint lists share a path: equal, or one inside the other; a glob counts as its fixed prefix. */
export function overlaps(a, b) {
  return a.some((x) => b.some((y) => {
    const nx = norm(x), ny = norm(y);
    return nx === '' || ny === '' || nx === ny || nx.startsWith(`${ny}/`) || ny.startsWith(`${nx}/`);
  }));
}

const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
const plain = (c) => c.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, '').trim();
const idList = (c) => plain(c).split(/[,;]/).map((s) => s.trim()).filter((s) => s && !/^(-|none|—|n\/a)$/i.test(s));
const pathList = (c) => c.split(/,|<br\s*\/?>/i).map((s) => plain(s)).filter(Boolean);

/** The first markdown table of `body` whose header names a footprint column, as `{ header, rows }`, else null. */
export function findPhaseTable(body) {
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trimStart().startsWith('|')) continue;
    let j = i;
    while (j < lines.length && lines[j].trimStart().startsWith('|')) j++;
    const block = lines.slice(i, j);
    const header = cells(block[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
    if (header.includes('footprint')) {
      const rows = block.slice(2).map((l) => cells(l));
      return { header, rows };
    }
    i = j;
  }
  return null;
}

function checkPhaseTable(body, errors) {
  const table = findPhaseTable(body);
  if (!table) { errors.push('no phase table with a footprint column'); return; }
  const missing = TABLE_COLUMNS.filter((c) => !table.header.includes(c));
  if (missing.length) { errors.push(`phase table lacks columns: ${missing.join(', ')}`); return; }
  const at = (name) => table.header.indexOf(name);
  const phases = table.rows.map((r) => ({
    id: plain(r[at('id')] ?? ''), deps: idList(r[at('dependson')] ?? ''), footprint: pathList(r[at('footprint')] ?? ''),
    wave: Number(plain(r[at('wave')] ?? '')), status: plain(r[at('status')] ?? '').toLowerCase(),
  }));
  if (!phases.length) { errors.push('phase table has no rows'); return; }
  const byId = new Map();
  for (const p of phases) {
    if (!p.id) errors.push('phase row without an id');
    else if (byId.has(p.id)) errors.push(`phase id ${p.id} appears twice`);
    else byId.set(p.id, p);
    if (!Number.isInteger(p.wave) || p.wave < 1) errors.push(`phase ${p.id}: wave must be an integer from 1`);
    if (!p.footprint.length) errors.push(`phase ${p.id}: footprint is empty`);
    if (!STATUSES.includes(p.status)) errors.push(`phase ${p.id}: status "${p.status}" is not one of ${STATUSES.join(', ')}`);
  }
  for (const p of phases) for (const d of p.deps) {
    const dep = byId.get(d);
    if (!dep) errors.push(`phase ${p.id}: depends on unknown phase ${d}`);
    else if (dep.wave >= p.wave) errors.push(`phase ${p.id} (wave ${p.wave}) depends on ${d} (wave ${dep.wave}): a phase runs in a later wave than its dependencies`);
  }
  for (let i = 0; i < phases.length; i++) for (let j = i + 1; j < phases.length; j++) {
    const a = phases[i], b = phases[j];
    if (a.wave === b.wave && overlaps(a.footprint, b.footprint)) {
      errors.push(`phases ${a.id} and ${b.id} share wave ${a.wave} but their footprints overlap`);
    }
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
  for (const [name] of PLAN_SECTIONS) if (!hasSection(body, name)) errors.push(`missing section: ${name}`);
  checkPhaseTable(body, errors);
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

/** Pairs of ready or running contract plans whose footprints overlap. */
export function activeOverlaps(results) {
  const active = results.filter((r) => !r.legacy && ['ready', 'running'].includes(r.meta.status) && strings(r.meta.footprint ?? []) && r.meta.footprint?.length);
  const out = [];
  for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
    if (overlaps(active[i].meta.footprint, active[j].meta.footprint)) out.push([path.basename(active[i].dir), path.basename(active[j].dir)]);
  }
  return out;
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
