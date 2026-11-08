// src/workflow/propose-classify.mjs — what kind of slice a set of write paths makes, and the rigor it carries
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The table is data (domains/coding/slice-kinds.yaml); this module only reads it and applies it. Each write
// path takes the matching rule with the highest rigor, the slice takes its highest-rigor path (the first
// listed rule wins a tie), and an agent may raise the result with a reason but never lower it. A kind that
// needs the owner first is returned with `dispatch: false`: the caller asks before launching any seat.
//
// A directory or a glob names files this module cannot see. Without `listFiles` it judges them by the rules
// anchored under them and reports them in `unresolvedScopes`, so the caller must expand them (the proposal
// refuses to go on while one is left); with `listFiles` every file below the scope is classified too, which
// is how a rule such as "any .sql file" reaches a parent directory.

import fs from 'node:fs';
import path from 'node:path';

import { parseYaml } from '../util/yaml.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { canonicalizeWriteEntry, globsMeet } from '../runner/dispatch/write-scope.mjs';
import { RIGOR_ORDER } from './guide-schema.mjs';

const TABLE_PATH = path.resolve(import.meta.dirname, '../../domains/coding/slice-kinds.yaml');
const TABLE_VERSION = 1;

/** The lowest rigor a table may give each kind. A table edit cannot quietly classify these low. */
const KIND_FLOORS = Object.freeze({ contract: 'high', platform: 'high', irreversible: 'critical', code: 'standard', test: 'standard' });

const refuse = (message, code) => new RunnerConfigError(message, { code });
const isText = (value) => typeof value === 'string' && value.trim() !== '';
const rigorRank = (rigor) => RIGOR_ORDER.indexOf(rigor);

const hasStar = (segment) => segment.includes('*');

function validateRule(rule, index, ids) {
  const where = `slice-kinds rule ${index + 1}`;
  if (!rule || typeof rule !== 'object' || !isText(rule.id)) throw refuse(`${where} needs an id`, 'slice-table-invalid');
  if (ids.has(rule.id)) throw refuse(`${where}: id "${rule.id}" is used twice`, 'slice-table-invalid');
  ids.add(rule.id);
  if (!isText(rule.kind)) throw refuse(`${where} ("${rule.id}") needs a kind`, 'slice-table-invalid');
  if (!RIGOR_ORDER.includes(rule.rigor)) throw refuse(`${where} ("${rule.id}"): rigor must be one of ${RIGOR_ORDER.join(', ')}`, 'slice-table-invalid');
  if (!Array.isArray(rule.match) || rule.match.length === 0 || !rule.match.every(isText)) throw refuse(`${where} ("${rule.id}") needs a list of path patterns in match`, 'slice-table-invalid');
  const floor = KIND_FLOORS[rule.kind];
  if (floor && rigorRank(rule.rigor) < rigorRank(floor)) throw refuse(`${where} ("${rule.id}"): kind ${rule.kind} cannot be below ${floor}`, 'slice-table-invalid');
  if (rule.askOwnerFirst === true) {
    if (rule.rigor !== 'critical' || rule.capability !== undefined || rule.pattern !== undefined) throw refuse(`${where} ("${rule.id}"): an ask-owner-first kind is critical and names no capability or pattern`, 'slice-table-invalid');
  } else {
    if (rule.kind === 'irreversible') throw refuse(`${where} ("${rule.id}"): an irreversible kind must ask the owner first`, 'slice-table-invalid');
    if (!(isText(rule.capability) && isText(rule.pattern))) throw refuse(`${where} ("${rule.id}") needs a capability and a pattern, or askOwnerFirst`, 'slice-table-invalid');
  }
  if (rule.followUp !== undefined && !(isText(rule.followUp?.capability) && isText(rule.followUp?.pattern))) throw refuse(`${where} ("${rule.id}"): followUp needs a capability and a pattern`, 'slice-table-invalid');
}

/**
 * Read and check the slice table. A table with an unknown version, a missing or low default, a kind below its
 * floor, a missing protected kind or a malformed rule is refused by name, so a bad edit cannot quietly
 * classify slices low.
 *
 * @param {{ tablePath?: string }} [options] test seam: another table file
 * @returns {Readonly<{ version: number, defaultRuleId: string, request: { singleRunMaxPaths: number, singleRunMaxRigor: string }, rules: ReadonlyArray<object> }>}
 */
export function loadSliceTable({ tablePath = TABLE_PATH } = {}) {
  const raw = parseYaml(fs.readFileSync(tablePath, 'utf8'), { filename: tablePath });
  if (raw?.version !== TABLE_VERSION) throw refuse(`slice-kinds version must be ${TABLE_VERSION}`, 'slice-table-invalid');
  if (!isText(raw.default?.kind)) throw refuse('slice-kinds needs a default kind', 'slice-table-invalid');
  if (!Array.isArray(raw.rules) || raw.rules.length === 0) throw refuse('slice-kinds needs rules', 'slice-table-invalid');
  const ids = new Set();
  raw.rules.forEach((rule, index) => validateRule(rule, index, ids));
  for (const kind of ['contract', 'platform', 'irreversible']) {
    if (!raw.rules.some((rule) => rule.kind === kind)) throw refuse(`slice-kinds needs a rule of kind ${kind}`, 'slice-table-invalid');
  }
  const defaultRule = raw.rules.find((rule) => rule.kind === raw.default.kind);
  if (!defaultRule) throw refuse(`slice-kinds default kind "${raw.default.kind}" has no rule`, 'slice-table-invalid');
  if (rigorRank(defaultRule.rigor) < rigorRank('standard')) throw refuse('the default kind cannot be below standard', 'slice-table-invalid');
  const request = raw.request ?? {};
  if (!Number.isInteger(request.singleRunMaxPaths) || request.singleRunMaxPaths < 1) throw refuse('slice-kinds request.singleRunMaxPaths must be a whole number of at least 1', 'slice-table-invalid');
  if (!RIGOR_ORDER.includes(request.singleRunMaxRigor) || rigorRank(request.singleRunMaxRigor) < rigorRank('standard')) throw refuse(`slice-kinds request.singleRunMaxRigor must be one of ${RIGOR_ORDER.filter((r) => rigorRank(r) >= rigorRank('standard')).join(', ')}`, 'slice-table-invalid');
  const rules = raw.rules.map((rule, order) => Object.freeze({ ...rule, order, globs: Object.freeze(rule.match.map((glob) => glob.split('/'))) }));
  return Object.freeze({ version: raw.version, defaultRuleId: defaultRule.id, request: Object.freeze({ singleRunMaxPaths: request.singleRunMaxPaths, singleRunMaxRigor: request.singleRunMaxRigor }), rules: Object.freeze(rules) });
}

let cachedTable = null;
export const defaultSliceTable = () => (cachedTable ??= loadSliceTable());

/** A write path read as segments: `scopeLike` when it may name a directory (or a glob), `glob` when it has a wildcard. */
const writeOf = (segments, scopeLike = false) => ({ path: segments.join('/'), segments, glob: segments.some(hasStar), scopeLike: scopeLike || segments.some(hasStar) });

/**
 * One write path as the write-scope reader reads it (no `//` or `.` segments, no trailing slash), so a path it
 * would refuse is refused here by name. `.` is the whole repository, read as the glob `**`.
 */
export function normalizeWrite(raw) {
  if (!isText(raw)) throw refuse('a slice write path must be a non-empty string', 'slice-write-invalid');
  if (raw.trim().split('/').every((segment) => segment === '' || segment === '.')) return writeOf(['**']);
  let entry;
  try {
    entry = canonicalizeWriteEntry(raw);
  } catch (err) {
    throw refuse(`slice write path "${raw}" is refused: ${err.message}`, 'slice-write-invalid');
  }
  const last = entry.slice(entry.lastIndexOf('/') + 1);
  return writeOf(entry.split('/'), raw.trim().endsWith('/') || !/[^.]\.[^/]+$/.test(last));
}

/**
 * Does `rule` cover this write? A file is matched by its path; a glob by the files it can name (a rule that
 * starts with `**` joins in only when the glob has no `**` of its own or starts with one, so `docs/**` is not
 * every `.sql` file); a path that could be a directory also covers every rule anchored below it.
 */
function ruleCovers(rule, write) {
  const joins = (glob) => !(write.glob && glob[0] === '**' && write.segments[0] !== '**' && write.segments.includes('**'));
  if (rule.globs.some((glob) => joins(glob) && globsMeet(glob, write.segments))) return true;
  if (write.glob) return false;
  const below = [...write.segments, '**'];
  return rule.globs.some((glob) => glob[0] !== '**' && globsMeet(glob, below));
}

function classifyPath(table, write) {
  let best = null;
  for (const rule of table.rules) {
    if (!ruleCovers(rule, write)) continue;
    if (best === null || rigorRank(rule.rigor) > rigorRank(best.rigor)) best = rule;
  }
  if (best) return { rule: best, byDefault: false };
  return { rule: table.rules.find((rule) => rule.id === table.defaultRuleId), byDefault: true };
}

/**
 * Classify one writing slice from its write paths.
 *
 * @param {object} params
 * @param {string[]} params.writes repo-relative paths, directories or globs the slice may write
 * @param {{ rigor: string, reason: string }} [params.raise] an agent's raise: needs a reason and may not lower the table
 * @param {(scope: string) => string[]} [params.listFiles] the repository files under a directory or glob; with it
 *   every such file is classified as well, without it the scope is reported in `unresolvedScopes`
 * @param {object} [params.table] test seam: a table from `loadSliceTable`
 * @returns {{ kind: string, ruleId: string, capability: string|null, pattern: string|null, followUp: object|null,
 *   rigor: string, tableRigor: string, raised: { rigor: string, reason: string }|null, askOwnerFirst: boolean,
 *   dispatch: boolean, unresolvedScopes: string[], paths: Array<{ path: string, ruleId: string, byDefault: boolean }> }}
 */
export function classifySlice({ writes, raise, listFiles, table = defaultSliceTable() }) {
  if (!Array.isArray(writes) || writes.length === 0) throw refuse('a writing slice needs at least one write path', 'slice-writes-missing');
  const normalized = writes.map(normalizeWrite);
  const unresolvedScopes = [];
  const judged = [];
  for (const write of normalized) {
    judged.push({ write, ...classifyPath(table, write) });
    if (!write.scopeLike) continue;
    if (typeof listFiles !== 'function') {
      unresolvedScopes.push(write.path === '**' ? '.' : write.path);
      continue;
    }
    for (const file of listFiles(write.path === '**' ? '.' : write.path)) {
      const member = writeOf(file.split('/'));
      judged.push({ write: member, ...classifyPath(table, member) });
    }
  }

  let top = judged[0];
  for (const entry of judged) {
    const better = rigorRank(entry.rule.rigor) - rigorRank(top.rule.rigor);
    if (better > 0 || (better === 0 && entry.rule.order < top.rule.order)) top = entry;
  }
  const rule = top.rule;

  let rigor = rule.rigor;
  let raised = null;
  if (raise !== undefined && raise !== null) {
    if (!RIGOR_ORDER.includes(raise.rigor)) throw refuse(`a raise must name a rigor of ${RIGOR_ORDER.join(', ')}`, 'slice-raise-invalid');
    if (!isText(raise.reason)) throw refuse('a raise needs a reason', 'slice-raise-needs-reason');
    if (rigorRank(raise.rigor) < rigorRank(rule.rigor)) throw refuse(`the slice is ${rule.rigor} by its paths; a raise cannot lower it to ${raise.rigor}`, 'slice-rigor-below-table');
    if (rigorRank(raise.rigor) > rigorRank(rule.rigor)) {
      rigor = raise.rigor;
      raised = { rigor: raise.rigor, reason: raise.reason.trim() };
    }
  }

  const askOwnerFirst = rule.askOwnerFirst === true;
  return {
    kind: rule.kind,
    ruleId: rule.id,
    capability: askOwnerFirst ? null : rule.capability,
    pattern: askOwnerFirst ? null : rule.pattern,
    followUp: askOwnerFirst || !rule.followUp ? null : { ...rule.followUp },
    rigor,
    tableRigor: rule.rigor,
    raised,
    askOwnerFirst,
    dispatch: !askOwnerFirst,
    unresolvedScopes,
    paths: judged.map((entry) => ({ path: entry.write.path, ruleId: entry.rule.id, byDefault: entry.byDefault })),
  };
}
