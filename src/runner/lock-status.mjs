// lock-status.mjs — the read-only report behind `fgos lock-status`: every
// repo- and machine-scoped row of the lock registry as `free` or `held`, with
// the holders the kernel shows and the guarantee of the directory the lock
// file lives in. A lock file that does not exist cannot be held, so nothing
// is created to ask. A row with a path parameter the report cannot know (a
// merge target, a working directory, a provider account) lists the lock
// files that exist and reads each one by its holders.

import fs from 'node:fs';
import path from 'node:path';
import { lockEntry, loadLockRegistry, resolveLock, probe, guaranteeFor, fileHolders, resolveLockRoot, HolderLockError } from '../holder-lock/index.mjs';

const REPORTED_SCOPES = new Set(['repo', 'machine']);
const PLACEHOLDER = /<([^<>]+)>/g;
const HAS_PLACEHOLDER = /<[^<>]+>/;
const PLACEHOLDER_SPLIT = /<[^<>]+>/;

function errorNote(err) {
  return { code: err.code ?? err.name ?? 'error', message: err.message };
}

function holdersOf(name, lockPath) {
  const listed = fileHolders(name, lockPath);
  return listed.kind === 'list' ? { holders: listed.holders.map((h) => h.pid) } : { holders: null, holdersNote: listed.reason };
}

function guaranteeOf(lockPath) {
  try {
    if (!fs.existsSync(path.dirname(lockPath))) return null;
    const { driver, exclusion, notes } = guaranteeFor(lockPath);
    return { driver, exclusion, ...(notes?.length ? { notes } : {}) };
  } catch (err) {
    return { error: errorNote(err) };
  }
}

/** Lock files of a parametric row that exist on disk: the template with the
 * known params filled, every other `<placeholder>` a wildcard path segment part. */
function existingInstances(template, known) {
  const filled = template.replace(PLACEHOLDER, (whole, key) => (known[key] !== undefined ? known[key] : whole));
  const segments = filled.split('/');
  let candidates = [segments[0] === '' ? '/' : segments[0]];
  for (const segment of segments.slice(1)) {
    const next = [];
    if (!HAS_PLACEHOLDER.test(segment)) {
      for (const base of candidates) next.push(path.join(base, segment));
    } else {
      const literal = segment.split(PLACEHOLDER_SPLIT).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`^${literal.join('.+')}$`);
      for (const base of candidates) {
        let names = [];
        try {
          names = fs.readdirSync(base);
        } catch {
          // a directory that does not exist has no instance
        }
        for (const name of names) if (pattern.test(name)) next.push(path.join(base, name));
      }
    }
    candidates = next;
  }
  return candidates.filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function reportFixedRow(entry, params) {
  const base = { name: entry.name, kind: entry.kind, scope: entry.scope, rank: entry.rank };
  const lock = resolveLock(entry.name, params);
  const row = { ...base, path: lock.v3Path };
  if (!fs.existsSync(lock.v3Path)) return { ...row, status: 'free', holders: [], via: 'absent-file' };
  const listed = holdersOf(entry.name, lock.v3Path);
  try {
    const { result } = probe(entry.name, params);
    return { ...row, status: result, ...listed, via: 'probe', guarantee: guaranteeOf(lock.v3Path) };
  } catch (err) {
    return { ...row, status: 'unknown', ...listed, via: 'probe', error: errorNote(err) };
  }
}

function reportParametricRow(entry, params) {
  const base = { name: entry.name, kind: entry.kind, scope: entry.scope, rank: entry.rank, parametric: true, template: entry.v3Path };
  const instances = existingInstances(entry.v3Path, params).map((file) => {
    const listed = holdersOf(entry.name, file);
    const status = listed.holders === null ? 'unknown' : listed.holders.length > 0 ? 'held' : 'free';
    return { path: file, status, ...listed };
  });
  const status = instances.some((i) => i.status === 'held') ? 'held' : instances.some((i) => i.status === 'unknown') ? 'unknown' : 'free';
  return { ...base, status, via: 'holders', instances };
}

/**
 * collectLockStatus({ fgosDir }) -> { mainCheckout, locks }
 *
 * `locks` has one row per repo- or machine-scoped registry row; `mainCheckout`
 * is the main-checkout row's `{ outcome, holders, guarantee }` for callers
 * that only care about that one lock.
 */
export function collectLockStatus({ fgosDir }) {
  const params = { fgosDir };
  let machineParams = params;
  try {
    machineParams = { fgosDir, lockRoot: resolveLockRoot({ fgosDir }) };
  } catch (err) {
    if (!(err instanceof HolderLockError)) throw err;
  }
  const locks = [];
  for (const { name } of loadLockRegistry().locks) {
    const entry = lockEntry(name);
    if (!REPORTED_SCOPES.has(entry.scope)) continue;
    const known = entry.scope === 'machine' ? machineParams : params;
    if (typeof entry.v3Path !== 'string') {
      locks.push({ name, kind: entry.kind, scope: entry.scope, rank: entry.rank, status: 'not-node-owned', owner: entry.owner });
      continue;
    }
    try {
      locks.push(reportFixedRow(entry, known));
    } catch (err) {
      if (!(err instanceof HolderLockError) || err.code !== 'lock-path-param-missing') {
        locks.push({ name, kind: entry.kind, scope: entry.scope, rank: entry.rank, status: 'unknown', error: errorNote(err) });
        continue;
      }
      locks.push(reportParametricRow(entry, known));
    }
  }
  const main = locks.find((row) => row.name === 'main-checkout');
  return {
    mainCheckout: { outcome: main?.status ?? 'unknown', holders: main?.holders ?? null, path: main?.path ?? null, guarantee: main?.guarantee ?? null },
    locks,
  };
}
