// holder-lock-checks.mjs -- the doctor checks and setup fixes of the
// holder-lock component (docs/platform/holder-lock/spec.md, "Setup, doctor
// and activation"). `registrations.mjs` registers them; the bodies live here.
//
// Every check reads; the one fix, `lock-dirs`, creates `<fgosDir>/locks` and
// `<lockRoot>`.
//
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin, guaranteeFor, doorTwoProcessProbe } from '../holder-lock/driver.mjs';
import { fileHolders, predecessorState } from '../holder-lock/index.mjs';
import { PROTOCOL, DEFAULT_KILL_WAIT_MS } from '../holder-lock/protocol.mjs';
import { resolveStateRoot, LOCKS_DIR } from '../holder-lock/state-root.mjs';
import { loadLockRegistry } from '../holder-lock/registry.mjs';
import { hotPaths, readHotRecord, judgeHotRecord } from '../state/hot-lock.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';
import { judge } from '../runner/dispatch/process-identity.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { listOpenAttemptDirs } from '../run-supervisor/client.mjs';

const BORROW_VECTORS_TIMEOUT_MS = 30_000;
const MAX_LISTED = 5;

const warn = (text) => `warning: ${text}`;

function listed(items) {
  const head = items.slice(0, MAX_LISTED).join('; ');
  return items.length > MAX_LISTED ? `${head}; and ${items.length - MAX_LISTED} more` : head;
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** The machine state root and lock root with what decided them, or `{ error }` naming why it cannot be resolved. */
function machineLockRoot() {
  try {
    return resolveStateRoot();
  } catch (err) {
    return { error: err.message };
  }
}

/** Both lock directories this workspace uses, workspace first. */
function lockDirs(repoRoot, machine = machineLockRoot()) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  return [
    { label: 'workspace', dir: path.join(fgosDir, LOCKS_DIR) },
    machine.error ? { label: 'machine', error: machine.error } : { label: 'machine', dir: machine.lockRoot },
  ];
}

// ---------------------------------------------------------------------
// lock-kernel-semantics
// ---------------------------------------------------------------------

function guaranteeShape(guarantee) {
  return JSON.stringify({ driver: guarantee.driver, exclusion: guarantee.exclusion, borrow: guarantee.borrow, holders: guarantee.holders });
}

/** Why a guarantee refuses the locks, or null when the driver can exclude there. */
export function guaranteeRefusal(label, dir, guarantee) {
  const shape = guaranteeShape(guarantee);
  if (guarantee.exclusion === 'unsupported') {
    return `${label} ${dir} ${shape}: holder-lock has no driver on ${guarantee.platform}; gateway, sessions, runner, dispatch, advance, recovery and the provider locks cannot run here`;
  }
  if (guarantee.exclusion === 'none') {
    return `${label} ${dir} ${shape}: the filesystem gives no lock exclusion (${(guarantee.notes ?? []).join('; ') || 'network filesystem'}); move the state root or the workspace to a local disk`;
  }
  return null;
}

/**
 * For `<fgosDir>/locks` and `<lockRoot>`: the driver's guarantee through
 * door, then the two-process probe on that same mount.
 * `kernel` with a green probe passes; a platform with no driver
 * (`unsupported`) and a network filesystem (`none`) fail by name; a missing
 * directory warns (setup creates it).
 */
export async function checkLockKernelSemantics(repoRoot) {
  const failures = [];
  const warnings = [];
  const passes = [];
  const machine = machineLockRoot();
  for (const { label, dir, error } of lockDirs(repoRoot, machine)) {
    if (error) {
      failures.push(`${label} lock root unresolved: ${error}`);
      continue;
    }
    if (!isDirectory(dir)) {
      warnings.push(`${label} ${dir} does not exist yet, not measured (fgos setup creates it)`);
      continue;
    }
    let guarantee;
    try {
      guarantee = guaranteeFor(path.join(dir, 'guarantee.lock'));
    } catch (err) {
      failures.push(`${label} ${dir}: ${err.message}`);
      continue;
    }
    const shape = guaranteeShape(guarantee);
    const refusal = guaranteeRefusal(label, dir, guarantee);
    if (refusal) {
      failures.push(refusal);
      continue;
    }
    try {
      doorTwoProcessProbe(dir);
      passes.push(`${label} ${dir} ${shape}, two-process probe green`);
    } catch (err) {
      failures.push(`${label} ${dir} ${shape}: two-process probe failed: ${err.message}`);
    }
  }
  // The two fixed facts of the lock layer stay visible: the state root the locks live under and the predecessor kill wait.
  const facts = [machine.error ? null : `stateRoot ${machine.stateRoot} (${machine.source})`, `killWaitMs ${DEFAULT_KILL_WAIT_MS} (fixed)`].filter(Boolean);
  const all = [...failures, ...warnings, ...passes, ...facts].join('; ');
  if (failures.length > 0) return { passed: false, message: all };
  if (warnings.length > 0) return { passed: true, message: warn(all) };
  return { passed: true, message: all };
}

// ---------------------------------------------------------------------
// lock-borrow-vectors
// ---------------------------------------------------------------------

/**
 * `fgos internal lock-borrow-vectors`: a borrowed description must not leak
 * to any background process of git. Any red vector fails (there is no
 * run-time switch that turns borrowing off).
 */
export function checkLockBorrowVectors(repoRoot) {
  let bin;
  try {
    bin = hostBin({ fgosDir: fgosDirFromRoot(repoRoot) });
  } catch (err) {
    return { passed: false, message: `cannot run the borrow vectors: ${err.message}` };
  }
  const res = spawnSync(bin, ['internal', 'lock-borrow-vectors', '--protocol', String(PROTOCOL)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: BORROW_VECTORS_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: 1024 * 1024,
  });
  if (res.error) return { passed: false, message: `${bin} internal lock-borrow-vectors did not finish: ${res.error.message}` };
  let out = null;
  try {
    out = JSON.parse(String(res.stdout).split('\n').find((line) => line.trim() !== '') ?? '');
  } catch {
    out = null;
  }
  const stderr = String(res.stderr ?? '').trim().slice(0, 300);
  if (res.status === 0 && out?.result === 'pass') {
    return { passed: true, message: `all ${out.vectors.length} vectors and the sibling check green (${out.gitVersion})` };
  }
  if (res.status === 10 && out) {
    const red = (out.vectors ?? []).filter((vector) => vector.result !== 'pass').map((vector) => `${vector.name}: ${vector.detail}`);
    if (out.sibling?.result !== 'pass') red.push(`sibling-refused: ${out.sibling?.detail ?? 'no result'}`);
    return { passed: false, message: `borrowed lock leaks (${out.gitVersion}): ${listed(red)}` };
  }
  if (res.status === 12) return { passed: false, message: `borrow vectors unavailable: ${out?.detail ?? stderr ?? 'no detail'}` };
  if (res.status === 3) return { passed: false, message: `${bin} refused protocol ${PROTOCOL} (host-version-mismatch): restage/activate a matching release` };
  return { passed: false, message: `${bin} internal lock-borrow-vectors exited ${res.status}${res.signal ? ` (${res.signal})` : ''}: ${stderr || String(res.stdout).slice(0, 300)}` };
}

// ---------------------------------------------------------------------
// lock-holders
// ---------------------------------------------------------------------

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
  advance: ({ fgosDir }) => subdirs(path.join(fgosDir, 'workflow-runs')).flatMap((runDir) => existing(path.join(runDir, LOCKS_DIR, 'advance.lock'))),
  recovery: ({ fgosDir }) => [...listAssignmentRuns(fgosDir)].flatMap(({ runDir }) => existing(path.join(runDir, LOCKS_DIR, 'recovery.lock'))),
  install: ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'install.lock')) : []),
  'full-suite': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'full-suite.lock')) : []),
  'provider-state': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'provider-state.lock')) : []),
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
// hot records (judged beside their reclaim lock files, by lock-holders)
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
 * For every lock file of this release's registry rows: who holds it, as
 * the kernel lists it. A holder that is neither a fgOS process nor a child
 * of a `runBorrowed` call of that lock warns with pid and cmdline; a
 * `predecessor.json` naming a domain that is not empty warns with the
 * domain. A platform that cannot list holders is informational.
 */
export function checkLockHolders(repoRoot, { now = Date.now() } = {}) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  const machine = machineLockRoot();
  const notes = machine.error ? [`machine locks not scanned: ${machine.error}`] : [];
  let rows;
  try {
    rows = cutOverLockFiles({ fgosDir, lockRoot: machine.lockRoot });
  } catch (err) {
    return { passed: false, message: err.message };
  }
  const foreign = [];
  const predecessors = [];
  const unlistable = [];
  let files = 0;
  let held = 0;
  // The attempt lock belongs to the run supervisor (not a cut-over row of the lock registry), so it is added here.
  const scanned = [...rows, { lock: 'attempt', files: attemptLockFiles(fgosDir) }];
  for (const { lock, files: lockFiles } of scanned) {
    for (const file of lockFiles) {
      files += 1;
      const problem = predecessorProblem(file);
      if (problem) predecessors.push(`${lock}: ${problem}`);
      const holders = fileHolders(lock, file);
      if (holders.kind !== 'list') {
        unlistable.push(`${lock} ${file}: ${holders.reason}`);
        continue;
      }
      if (holders.holders.length > 0) held += 1;
      for (const holder of holders.holders) {
        // Rust decides the origin; an attempt member is only meaningful under the attempt lock.
        if (holder.origin === 'foreign' || (holder.origin === 'attempt-member' && lock !== 'attempt')) foreign.push(`${lock} ${file} held by pid ${holder.pid} (${holder.cmdline}), not a fgOS process nor a borrowed child`);
      }
    }
  }
  const problems = [...foreign, ...predecessors, ...hotRecordProblems(fgosDir, now)];
  const summary = `${files} lock file(s) of ${rows.length} locks, ${held} held`;
  if (problems.length > 0) return { passed: true, message: warn(`${listed(problems)} (${summary})`) };
  if (unlistable.length > 0 && unlistable.length === files) {
    return { passed: true, message: `info: holders not listable here: ${listed(unlistable)} (${summary})${notes.length ? `; ${notes.join('; ')}` : ''}` };
  }
  return { passed: true, message: `${summary}, every holder a fgOS process or a borrowed child${notes.length ? `; ${notes.join('; ')}` : ''}` };
}

// ---------------------------------------------------------------------
// lock-dirs (setup)
// ---------------------------------------------------------------------

/**
 * Create `<fgosDir>/locks` and `<lockRoot>` with mode 0700 when missing, and
 * tighten an existing one to 0700 (the first acquire may have created it
 * with the umask's mode before setup ran).
 */
export function fixLockDirs(repoRoot) {
  const created = [];
  const skipped = [];
  for (const { label, dir, error } of lockDirs(repoRoot)) {
    if (error) {
      skipped.push(`${label} lock root unresolved: ${error}`);
      continue;
    }
    if (isDirectory(dir)) {
      try {
        if ((fs.statSync(dir).mode & 0o077) !== 0) {
          fs.chmodSync(dir, 0o700);
          created.push(`${dir} (mode tightened to 0700)`);
        }
      } catch (err) {
        skipped.push(`${dir}: ${err.code ?? err.message}`);
      }
      continue;
    }
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      fs.chmodSync(dir, 0o700);
      created.push(dir);
    } catch (err) {
      skipped.push(`${dir}: ${err.code ?? err.message}`);
    }
  }
  const parts = [];
  if (created.length > 0) parts.push(`created or tightened ${created.join(', ')}`);
  if (skipped.length > 0) parts.push(`not created: ${skipped.join('; ')}`);
  return { changed: created.length > 0, message: parts.length > 0 ? parts.join('; ') : 'lock directories present' };
}
