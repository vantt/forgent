// Splitting the test suite into shards, and proving afterwards that the shards that ran are exactly the suite.
// Pure: no filesystem, no process, no import of the runner.

import path from 'node:path';

/** Repo-relative posix key of a file, the form `suite-baseline.json` `fileCpu` uses. */
export function repoRelative(root, file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function assertTotal(total) {
  if (!Number.isInteger(total) || total < 1) throw new Error(`shard total must be an integer >= 1, got ${total}`);
}

// Weight of each file: its recorded one, else the mean of the recorded ones among `files`, else 1.
function weigh(files, weights) {
  const known = files.map((f) => weights[f]).filter((w) => typeof w === 'number' && w > 0);
  const mean = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : 1;
  return new Map(files.map((f) => [f, typeof weights[f] === 'number' && weights[f] > 0 ? weights[f] : mean]));
}

function plan(files, total, weights) {
  assertTotal(total);
  const weight = weigh(files, weights);
  const order = [...files].sort((a, b) => weight.get(b) - weight.get(a) || (a < b ? -1 : a > b ? 1 : 0));
  const shards = Array.from({ length: total }, () => []);
  const loads = new Array(total).fill(0);
  for (const file of order) {
    let least = 0;
    for (let i = 1; i < total; i++) if (loads[i] < loads[least]) least = i;
    shards[least].push(file);
    loads[least] += weight.get(file);
  }
  return { shards: shards.map((s) => s.sort()), loads };
}

/**
 * `files` split into `total` shards by longest-processing-time-first over `weights` (path -> seconds). The same
 * files and weights give the same shards whatever the input order. Each shard is sorted by path.
 */
export function partitionFiles(files, total, weights = {}) {
  return plan(files, total, weights).shards;
}

/** The summed weight of each shard `partitionFiles` returns for the same arguments. */
export function shardLoads(files, total, weights = {}) {
  return plan(files, total, weights).loads;
}

/** `{ index, total }` of a `k/n` shard spec with 1 <= k <= n; throws naming the value otherwise. */
export function parseShard(text) {
  const match = /^(\d+)\/(\d+)$/.exec(String(text));
  const index = match ? Number(match[1]) : NaN;
  const total = match ? Number(match[2]) : NaN;
  if (!match || index < 1 || total < 1 || index > total) {
    throw new Error(`invalid shard "${text}": expected k/n with 1 <= k <= n, for example 2/5`);
  }
  return { index, total };
}

const XML_ENTITIES = { '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&apos;': "'" };

/**
 * The repo-relative posix paths named by the `file="..."` attributes of a junit report. `repoRoot` is the exact
 * checkout directory the report was produced in; a path that does not start with it is kept as reported, so the
 * exact-set check names it instead of matching it by accident.
 */
export function junitFiles(xml, repoRoot) {
  const root = repoRoot.replaceAll('\\', '/').replace(/\/+$/, '');
  const found = new Set();
  for (const [, raw] of xml.matchAll(/\sfile="([^"]*)"/g)) {
    const file = raw.replace(/&(?:quot|amp|lt|gt|apos);/g, (e) => XML_ENTITIES[e]).replaceAll('\\', '/');
    found.add(file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file);
  }
  return found;
}

/**
 * The problem lines (empty = exact set) when the shards that reported do not cover `discovered` exactly once.
 * `shards` is `[{ index, total, files: Set }]`, read from what each shard produced, not from the partition.
 * A file with no test() call still reports one case under its own name, and so does a file that throws on import
 * or has only skipped tests, so every discovered file is expected to appear.
 */
export function checkShardSet(discovered, shards) {
  const problems = [];
  const totals = [...new Set(shards.map((s) => s.total))].sort((a, b) => a - b);
  if (totals.length === 0) return ['no shard result reported'];
  if (totals.length > 1) problems.push(`shards disagree on the total: ${totals.join(', ')}`);
  const total = totals[0];
  const seen = new Map();
  for (const s of shards) seen.set(s.index, (seen.get(s.index) ?? 0) + 1);
  for (let i = 1; i <= total; i++) {
    if (!seen.has(i)) problems.push(`shard ${i}/${total} reported no result`);
  }
  for (const [index, count] of seen) {
    if (count > 1) problems.push(`shard ${index}/${total} reported ${count} times`);
    if (index < 1 || index > total) problems.push(`shard ${index} is outside 1..${total}`);
  }
  const owners = new Map();
  for (const s of shards) {
    for (const file of s.files) owners.set(file, [...(owners.get(file) ?? []), `${s.index}/${s.total}`]);
  }
  const wanted = new Set(discovered);
  for (const file of [...wanted].sort()) {
    const where = owners.get(file);
    if (!where) problems.push(`${file} ran in no shard`);
    else if (where.length > 1) problems.push(`${file} ran in more than one shard: ${where.join(', ')}`);
  }
  for (const file of [...owners.keys()].sort()) {
    if (!wanted.has(file)) problems.push(`${file} ran in shard ${owners.get(file).join(', ')} but is not a discovered test file`);
  }
  return problems;
}

/**
 * One `<testsuites>` document holding every root child of each input, in input order, never nested. The reporter's
 * trailing count comments are dropped: they describe one shard, not the merge. Throws on a report with no root.
 */
export function mergeJunit(xmls) {
  const body = xmls.map((xml, i) => {
    const open = /<testsuites\b[^>]*?(\/?)>/.exec(xml);
    if (!open) throw new Error(`junit report ${i + 1} has no <testsuites> root`);
    if (open[1] === '/') return '';
    const close = xml.lastIndexOf('</testsuites>');
    if (close < 0) throw new Error(`junit report ${i + 1} has an unclosed <testsuites> root`);
    return xml.slice(open.index + open[0].length, close).replace(/<!--[\s\S]*?-->/g, '').trim();
  }).filter(Boolean);
  return `<?xml version="1.0" encoding="utf-8"?>\n<testsuites>\n\t${body.join('\n\t')}\n</testsuites>\n`;
}

/** The summed `<testcase time>` seconds of a junit report: what the shard that produced it spent on its tests. */
export function junitSeconds(xml) {
  let total = 0;
  for (const [, tag] of xml.matchAll(/<testcase\b([^>]*)>/g)) {
    const time = /\stime="([^"]*)"/.exec(tag);
    if (time && Number.isFinite(Number(time[1]))) total += Number(time[1]);
  }
  return total;
}

/** `{ ratio, slowest }`: the slowest shard's seconds over the mean, from `[{ index, seconds }]`; null when nothing was measured. */
export function measuredImbalance(shards) {
  const total = shards.reduce((sum, s) => sum + s.seconds, 0);
  if (shards.length === 0 || total <= 0) return null;
  const slowest = shards.reduce((a, b) => (b.seconds > a.seconds ? b : a));
  return { ratio: slowest.seconds / (total / shards.length), slowest: slowest.index };
}
