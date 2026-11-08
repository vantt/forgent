// lock-status.mjs — the read-only report behind `fgos lock-status`: every
// repo- and machine-scoped row of the lock registry as `free` or `held`, with
// the holders the kernel shows and the guarantee of the directory the lock
// file lives in. A lock file that does not exist cannot be held, so nothing
// is created to ask. A row with a path parameter the report cannot know (a
// merge target, a working directory, a provider account) lists the lock
// files that exist and reads each one by its holders. `problems` are the
// findings that need a person: a holder that is not a fgOS process, a
// predecessor domain still running, a hot record that does not parse.

import fs from 'node:fs';
import path from 'node:path';
import { lockEntry, loadLockRegistry, resolveLock, probe, guaranteeFor, fileHolders, predecessorState, resolveLockRoot, HolderLockError } from '../holder-lock/index.mjs';
import { LOCKS_DIR } from '../holder-lock/state-root.mjs';
import { hotPaths, readHotRecord, judgeHotRecord } from '../state/hot-lock.mjs';
import { judge } from '../native/process-identity.mjs';
import { listAssignmentRuns } from './dispatch/assignment-layout.mjs';
import { runsRoot } from './execution/case-run-paths.mjs';
import { listOpenAttemptDirs } from '../run-supervisor/client.mjs';

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

function filesIn(dir, accept) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((entry) => entry.isFile() && accept(entry.name)).map((entry) => path.join(dir, entry.name));
}

function subdirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}

function existing(file) {
  try {
    return fs.statSync(file).isFile() ? [file] : [];
  } catch {
    return [];
  }
}

// The lock files of this release's registry rows that exist right now, per
// row. Rows with a parameter (a run, a cwd, an account) are enumerated from
// the directories their v3 path lives in.
const LOCK_FILES = {
  'main-checkout': ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'main-checkout.lock')),
  'merge-slot': ({ fgosDir }) => filesIn(path.join(fgosDir, LOCKS_DIR), (name) => name.startsWith('merge-slot--') && name.endsWith('.lock')),
  'worktree-admin': ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'worktree-admin.lock')),
  // The hot record (`<resource>.hot`) is not a kernel lock file: only the reclaim lock beside it is listed here.
  state: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'state.reclaim.lock')),
  'porting-events': ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'porting-events.reclaim.lock')),
  gateway: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'gateway.lock')),
  runner: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'runner.lock')),
  sessions: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'sessions.lock')),
  reconcile: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'reconcile.lock')),
  'repo-config': ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'repo-config.lock')),
  'project-config': ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'project-config.lock')),
  activation: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'activation-v2.lock')),
  observe: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'observe.lock')),
  mailbox: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'mailbox.lock')),
  'dispatch-cwd': ({ fgosDir }) => filesIn(path.join(fgosDir, LOCKS_DIR), (name) => name.startsWith('dispatch-cwd--') && name.endsWith('.lock')),
  advance: ({ fgosDir }) => subdirs(runsRoot(path.dirname(fgosDir))).flatMap((runDir) => existing(path.join(runDir, LOCKS_DIR, 'advance.lock'))),
  recovery: ({ fgosDir }) => [...listAssignmentRuns(fgosDir)].flatMap(({ runDir }) => existing(path.join(runDir, LOCKS_DIR, 'recovery.lock'))),
  install: ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'install.lock')) : []),
  'full-suite': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'full-suite.lock')) : []),
  'provider-state': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'provider-state.lock')) : []),
  'worker-session': ({ lockRoot }) => (lockRoot ? filesIn(path.join(lockRoot, 'worker-session'), (name) => name.endsWith('.lock')) : []),
  'agent-trust-store': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'agent-trust-store.lock')) : []),
  'identity-pins': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'identity-pins.lock')) : []),
  'global-config': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'global-config.lock')) : []),
  'provider-account': ({ lockRoot }) => (lockRoot ? subdirs(path.join(lockRoot, 'provider-account')).flatMap((dir) => filesIn(dir, (name) => name.endsWith('.lock'))) : []),
};

/**
 * The registry rows that have a lock file to scan (a row of `LOCK_FILES`),
 * with every lock file of each that exists. Rows without one (`attempt`,
 * `event-seal`, `event-append`) are not scanned here.
 */
export function cutOverLockFiles({ fgosDir, lockRoot }) {
  return loadLockRegistry().locks
    .filter((lock) => lock.name in LOCK_FILES)
    .map((lock) => ({ lock: lock.name, files: LOCK_FILES[lock.name]({ fgosDir, lockRoot }) }));
}

/** The `attempt.lock` files of attempts that are not closed. Closed attempts hold nothing. */
function attemptLockFiles(fgosDir) {
  return listOpenAttemptDirs(path.join(fgosDir, 'assignments')).flatMap((dir) => existing(path.join(dir, 'attempt.lock')));
}

/**
 * A `windows-job` record is judged by the host (one read-only contender-view
 * pass, never a kill): `empty` and `absent` are no problem, anything else
 * warns with the domain and the reason the host names.
 */
function windowsJobProblem(lockFile, recordPath, record) {
  let out;
  try {
    out = predecessorState(lockFile);
  } catch (err) {
    return `${recordPath} names Windows job ${JSON.stringify(record.domainId)}; the host did not judge it (${err.message})`;
  }
  if (out?.result !== 'predecessor') {
    return `${recordPath} names Windows job ${JSON.stringify(record.domainId)}; the host did not judge it (${JSON.stringify(out?.result)})`;
  }
  if (out.state === 'empty' || out.state === 'absent') return null;
  return `${recordPath}: windows-job domain ${JSON.stringify(out.domain ?? record.domainId)} is ${out.state} (${out.reason ?? 'no reason named'}); the next holder ends it, or an acquire answers held (predecessor-domain-not-empty)`;
}

/** `null` when the predecessor record is absent or names an empty domain; otherwise why it does not. */
function predecessorProblem(lockFile) {
  const recordPath = `${lockFile}.predecessor.json`;
  let raw;
  try {
    raw = fs.readFileSync(recordPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    return `${recordPath} unreadable (${err.code})`;
  }
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return `${recordPath} is not JSON: ${raw.slice(0, 120)}`;
  }
  if (record?.v !== 1) return `${recordPath} has unknown version ${JSON.stringify(record?.v)}: ${raw.slice(0, 120)}`;
  if (record.domainKind === 'windows-job') return windowsJobProblem(lockFile, recordPath, record);
  const verdict = judge(record.domainId);
  if (verdict === 'dead') return null;
  return `${recordPath}: ${record.domainKind} domain ${JSON.stringify(record.domainId)} is not empty (${verdict}); the next holder kills it, or an acquire answers held (predecessor-domain-not-empty)`;
}

// ---------------------------------------------------------------------
// hot records (judged beside their reclaim lock files)
// ---------------------------------------------------------------------

/** The hot resources of the state store, by registry name (contracts/hot-lock.v1.json). */
const HOT_RESOURCES = ['state', 'porting-events'];
/** How long a record the judge cannot place may sit before it is worth a warning. */
export const UNKNOWN_JUDGE_GRACE_MS = 5 * 60 * 1000;

function recordAgeMs(recordPath, now) {
  try {
    return now - fs.statSync(recordPath).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Why a hot record needs a person, or `null` when it is absent or healthy.
 * A record that does not parse is a problem at once; a parsed record whose
 * holder the judge answers `unknown` for longer than the grace is one too (a
 * live holder answers `unknown` only when the process table or its namespace
 * cannot be read, so a young record is just a busy holder).
 */
function hotRecordProblem(resource, fgosDir, now) {
  const { record: recordPath } = hotPaths(fgosDir, resource);
  let seen;
  try {
    seen = readHotRecord(recordPath);
  } catch (err) {
    return `${resource}: ${recordPath} cannot be read (${err.code ?? err.message})`;
  }
  if (seen.state === 'absent') return null;
  if (seen.state === 'retry') return `${resource}: ${recordPath} is open by another process (sharing violation, ${seen.code}); stop that process`;
  if (seen.state === 'unreadable') return `${resource}: ${recordPath} does not parse (${JSON.stringify(seen.raw.slice(0, 80))})`;
  if (judgeHotRecord(seen.record) !== 'unknown') return null;
  const age = recordAgeMs(recordPath, now);
  if (age <= UNKNOWN_JUDGE_GRACE_MS) return null;
  return `${resource}: ${recordPath} names pid ${seen.record.pid} that cannot be judged here, for ${Math.round(age / 60000)} min`;
}

/** The hot records of this workspace that need a person, each with the one way out. Never repaired here. */
function hotRecordProblems(fgosDir, now) {
  return HOT_RESOURCES.map((resource) => ({ resource, problem: hotRecordProblem(resource, fgosDir, now) }))
    .filter((entry) => entry.problem)
    .map(({ resource, problem }) => `${problem}; once the holder is confirmed gone, run: fgos lock fence ${resource}`);
}

/**
 * What needs a person among the lock files of this release's registry rows (and the attempt locks of
 * attempts that are not closed): a holder the kernel lists that is neither a fgOS process nor a child of a
 * `runBorrowed` call of that lock, a `predecessor.json` naming a domain that is not empty, and a hot record
 * that does not parse or whose holder cannot be judged. A platform that cannot list holders reports none.
 * Nothing is repaired here.
 */
function collectLockProblems({ fgosDir, lockRoot, now }) {
  const foreign = [];
  const predecessors = [];
  // The attempt lock belongs to the run supervisor (not a cut-over row of the lock registry), so it is added here.
  const scanned = [...cutOverLockFiles({ fgosDir, lockRoot }), { lock: 'attempt', files: attemptLockFiles(fgosDir) }];
  for (const { lock, files } of scanned) {
    for (const file of files) {
      const problem = predecessorProblem(file);
      if (problem) predecessors.push(`${lock}: ${problem}`);
      const holders = fileHolders(lock, file);
      if (holders.kind !== 'list') continue;
      for (const holder of holders.holders) {
        // Rust decides the origin; an attempt member is only meaningful under the attempt lock.
        if (holder.origin === 'foreign' || (holder.origin === 'attempt-member' && lock !== 'attempt')) foreign.push(`${lock} ${file} held by pid ${holder.pid} (${holder.cmdline}), not a fgOS process nor a borrowed child`);
      }
    }
  }
  return [...foreign, ...predecessors, ...hotRecordProblems(fgosDir, now)];
}

/**
 * collectLockStatus({ fgosDir, now }) -> { mainCheckout, locks, problems }
 *
 * `locks` has one row per repo- or machine-scoped registry row; `mainCheckout`
 * is the main-checkout row's `{ outcome, holders, guarantee }` for callers
 * that only care about that one lock; `problems` lists the findings that need
 * a person, each with its way out.
 */
export function collectLockStatus({ fgosDir, now = Date.now() }) {
  const params = { fgosDir };
  let machineParams = params;
  try {
    machineParams = { fgosDir, lockRoot: resolveLockRoot() };
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
    problems: collectLockProblems({ fgosDir, lockRoot: machineParams.lockRoot, now }),
  };
}
