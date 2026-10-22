// holder-lock-checks.mjs -- the doctor checks and setup fixes of the
// holder-lock component (docs/platform/holder-lock/spec.md, "Setup, doctor
// and activation"). `registrations.mjs` registers them; the bodies live here.
//
// Every check reads; only the two fixes write. `lock-dirs` creates
// `<fgosDir>/locks` and `<lockRoot>`. `lock-fences` is the cutover step
// (check stopped -> place fences -> check stopped) and acts only in a
// workspace whose own activated release already takes these locks as kernel
// locks: fencing a workspace that still runs the old lock code would stop it.
//
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin, guaranteeFor, runStateRootRoute, doorTwoProcessProbe } from '../holder-lock/driver.mjs';
import { fileHolders, predecessorState } from '../holder-lock/index.mjs';
import { PROTOCOL } from '../holder-lock/protocol.mjs';
import { resolveStateRoot, STATE_ROOT_ENV, LOCKS_DIR } from '../holder-lock/state-root.mjs';
import { loadLockRegistry } from '../holder-lock/registry.mjs';
import { isCutOverLock, fenceStatus, fenceCutover, defaultProviderRuntimeDir } from '../holder-lock/fences.mjs';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { judge } from '../runner/dispatch/process-identity.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { listOpenAttemptDirs } from '../run-supervisor/client.mjs';

const BORROW_VECTORS_TIMEOUT_MS = 30_000;
const MAX_LISTED = 5;
const REGISTRY_IN_PAYLOAD = path.join('packages', 'holder-lock', 'contracts', 'lock-registry.v1.json');

const warn = (text) => `warning: ${text}`;

function listed(items) {
  const head = items.slice(0, MAX_LISTED).join('; ');
  return items.length > MAX_LISTED ? `${head}; and ${items.length - MAX_LISTED} more` : head;
}

export function fgosDirOf(repoRoot) {
  return path.join(path.resolve(repoRoot), '.fgos');
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** The machine lock root, or `{ error }` naming why it cannot be resolved. */
function machineLockRoot(fgosDir) {
  try {
    return { lockRoot: resolveStateRoot({ fgosDir }).lockRoot };
  } catch (err) {
    return { error: err.message };
  }
}

/** Both lock directories this workspace uses, workspace first. */
function lockDirs(repoRoot) {
  const fgosDir = fgosDirOf(repoRoot);
  const machine = machineLockRoot(fgosDir);
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
  for (const { label, dir, error } of lockDirs(repoRoot)) {
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
  const all = [...failures, ...warnings, ...passes].join('; ');
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
    bin = hostBin({ fgosDir: fgosDirOf(repoRoot) });
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
  activation: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'activation-v2.lock')),
  observe: ({ fgosDir }) => existing(path.join(fgosDir, LOCKS_DIR, 'observe.lock')),
  'dispatch-cwd': ({ fgosDir }) => filesIn(path.join(fgosDir, LOCKS_DIR), (name) => name.startsWith('dispatch-cwd--') && name.endsWith('.lock')),
  advance: ({ fgosDir }) => subdirs(path.join(fgosDir, 'workflow-runs')).flatMap((runDir) => existing(path.join(runDir, LOCKS_DIR, 'advance.lock'))),
  recovery: ({ fgosDir }) => [...listAssignmentRuns(fgosDir)].flatMap(({ runDir }) => existing(path.join(runDir, LOCKS_DIR, 'recovery.lock'))),
  install: ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'install.lock')) : []),
  'full-suite': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'full-suite.lock')) : []),
  'provider-state': ({ lockRoot }) => (lockRoot ? existing(path.join(lockRoot, 'provider-state.lock')) : []),
  'provider-account': ({ lockRoot }) => (lockRoot ? subdirs(path.join(lockRoot, 'provider-account')).flatMap((dir) => filesIn(dir, (name) => name.endsWith('.lock'))) : []),
};

/** The registry rows this release cut over, with every lock file of each that exists. */
export function cutOverLockFiles({ fgosDir, lockRoot }) {
  const rows = loadLockRegistry().locks.filter(isCutOverLock);
  return rows.map((lock) => {
    const enumerate = LOCK_FILES[lock.name];
    if (!enumerate) throw new Error(`lock "${lock.name}" of release ${lock.owner} has no lock-file enumeration in holder-lock-checks.mjs`);
    return { lock: lock.name, files: enumerate({ fgosDir, lockRoot }) };
  });
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

/**
 * For every lock file of this release's registry rows: who holds it, as
 * the kernel lists it. A holder that is neither a fgOS process nor a child
 * of a `runBorrowed` call of that lock warns with pid and cmdline; a
 * `predecessor.json` naming a domain that is not empty warns with the
 * domain. A platform that cannot list holders is informational.
 */
export function checkLockHolders(repoRoot) {
  const fgosDir = fgosDirOf(repoRoot);
  const machine = machineLockRoot(fgosDir);
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
  const problems = [...foreign, ...predecessors];
  const summary = `${files} lock file(s) of ${rows.length} locks, ${held} held`;
  if (problems.length > 0) return { passed: true, message: warn(`${listed(problems)} (${summary})`) };
  if (unlistable.length > 0 && unlistable.length === files) {
    return { passed: true, message: `info: holders not listable here: ${listed(unlistable)} (${summary})${notes.length ? `; ${notes.join('; ')}` : ''}` };
  }
  return { passed: true, message: `${summary}, every holder a fgOS process or a borrowed child${notes.length ? `; ${notes.join('; ')}` : ''}` };
}

// ---------------------------------------------------------------------
// lock-fences
// ---------------------------------------------------------------------

/**
 * The workspace's Git listing the fences need, read through Inspect:
 * holder-lock sits below Git and never lists worktrees or branches itself.
 * Empty outside a repository.
 */
export function workspaceListing(repoRoot) {
  const inspect = createGitInspect(gitPortOptions(repoRoot));
  if (inspect.resolveRepo().notARepository) return { worktrees: [], branches: [] };
  const worktrees = [];
  let cursor;
  do {
    const page = inspect.listWorktrees({ cursor, maxEntries: 4096 });
    for (const row of page.entries) worktrees.push(Buffer.from(row.path).toString('utf8'));
    cursor = page.nextCursor;
  } while (cursor);
  const branches = inspect.listBranches({ prefix: 'refs/heads/' }).map((ref) => ref.slice('refs/heads/'.length));
  return { worktrees, branches };
}

/**
 * Every legacy lock path of the registry carries its cutover fence. A
 * missing fence warns and names the fix; an old lock file still present
 * is named, because it blocks the fix.
 */
export function checkLockFences(repoRoot, { providerRuntimeDir = defaultProviderRuntimeDir() } = {}) {
  let status;
  try {
    status = fenceStatus({ fgosDir: fgosDirOf(repoRoot), workspaceRoot: path.resolve(repoRoot), ...workspaceListing(repoRoot), providerRuntimeDir });
  } catch (err) {
    return { passed: false, message: `cannot read the fence status: ${err.message}` };
  }
  // Channels without a controller activation or WAL have never crossed C5.
  const activatedPath = path.join(fgosDirOf(repoRoot), 'installation/activation.json');
  const main = resolveMainCheckoutRoot(repoRoot) ?? repoRoot;
  const common = fs.existsSync(path.join(main, '.git')) ? path.join(main, '.git') : main;
  if (!fs.existsSync(activatedPath) && !fs.existsSync(path.join(repoRoot, 'fgos/git')) && !fs.existsSync(path.join(common, 'fgos/git'))) {
    status.targets = status.targets.filter(target => !(target.managedBy === 'fgctl' && target.state === 'absent'));
    status.controllerMissing = status.targets.filter(target => target.managedBy === 'fgctl' && !target.fenced).map(target => target.path);
  }
  if (status.complete && status.controllerMissing.length === 0) return { passed: true, message: `all ${status.targets.length} legacy lock path(s) fenced` };
  if (status.complete) {
    return { passed: false, message: 'git-fence-missing: the new fgctl places the activation fence during a WAL-capable activation' };
  }
  const present = status.v1Present.length > 0 ? `; old lock still present (blocks the fix until its holder is gone): ${listed(status.v1Present)}` : '';
  const activated = activatedHolderLockRelease(repoRoot);
  const fixable = fixableTargets(status, activated);
  const next = fixable.length > 0
    ? 'stop every fgOS process of this workspace, then run fgos doctor --fix'
    : `the fix waits for this release to be activated here (${activated.reason ?? 'the activated release does not yet take every one of these locks'})`;
  return {
    passed: true,
    message: warn(`${status.missing.length} of ${status.targets.filter(target => target.managedBy !== 'fgctl').length} legacy lock path(s) not fenced: ${listed(status.missing)}${present} -- ${next}`),
  };
}

/**
 * The missing fences the activated release can already stand behind: those
 * of registry owners whose rows its own registry carries. A fence placed
 * before the release that takes the lock as a kernel lock is active would
 * stop that very release from upgrading (an older `fgctl` meets the
 * tombstone at its own lock path).
 */
function fixableTargets(status, activated) {
  const owners = activated.owners ?? [];
  const missing = new Set(status.missing);
  return status.targets.filter((target) => missing.has(target.path) && owners.includes(target.owner));
}

/**
 * The release the workspace's own activation runs, when its payload takes
 * this release's locks as kernel locks (it ships the lock registry); null
 * with the reason otherwise. `owners` lists the registry owners whose locks
 * that payload's registry names.
 */
export function activatedHolderLockRelease(repoRoot) {
  const activationPath = path.join(fgosDirOf(repoRoot), 'installation', 'activation.json');
  let activation;
  try {
    activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
  } catch (err) {
    return { release: null, reason: `no readable activation at ${activationPath} (${err.code ?? err.message})` };
  }
  if (activation?.status !== 'ready' || typeof activation.releasePath !== 'string') {
    return { release: null, reason: `activation at ${activationPath} is not ready` };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
  } catch (err) {
    return { release: null, reason: `the activated release ${activation.releasePath} has no readable manifest (${err.code ?? err.message})` };
  }
  const payloadRoot = manifest?.components?.legacyNode?.root;
  if (typeof payloadRoot !== 'string' || !fs.existsSync(path.join(activation.releasePath, payloadRoot, REGISTRY_IN_PAYLOAD))) {
    return { release: null, reason: `the activated release ${activation.releasePath} still runs the old lock code (no ${REGISTRY_IN_PAYLOAD} in its payload); activate this release first` };
  }
  let owners;
  try {
    const payloadRegistry = JSON.parse(fs.readFileSync(path.join(activation.releasePath, payloadRoot, REGISTRY_IN_PAYLOAD), 'utf8'));
    owners = [...new Set(payloadRegistry.locks.map((lock) => lock.owner))];
  } catch (err) {
    return { release: null, reason: `the activated release ${activation.releasePath} has no readable lock registry (${err.code ?? err.message})` };
  }
  return { release: activation.releasePath, reason: null, owners };
}

/**
 * The cutover step for this workspace: check that every fgOS process has
 * stopped, place the fences, check again (fences.mjs `fenceCutover`). Acts
 * only when the workspace's activated release already runs holder-lock.
 * Blockers mean nothing is placed; they are listed so a person can stop them.
 */
export function fixLockFences(repoRoot, { providerRuntimeDir = defaultProviderRuntimeDir(), excludePids, hostBin: bin } = {}) {
  const workspaceRoot = path.resolve(repoRoot);
  const fgosDir = fgosDirOf(repoRoot);
  let status;
  let listing;
  try {
    listing = workspaceListing(repoRoot);
    status = fenceStatus({ fgosDir, workspaceRoot, ...listing, providerRuntimeDir });
  } catch (err) {
    return { changed: false, message: `cannot read the fence status: ${err.message}` };
  }
  if (status.complete && status.controllerMissing.length > 0) {
    return { changed: false, message: 'fences not placed: only the new fgctl may place the activation fence during a WAL-capable activation' };
  }
  if (status.complete) return { changed: false, message: `all ${status.targets.length} legacy lock path(s) already fenced` };
  const activated = activatedHolderLockRelease(repoRoot);
  if (!activated.release) return { changed: false, message: `fences not placed: ${activated.reason}` };
  const owners = [...new Set(fixableTargets(status, activated).map((target) => target.owner))];
  if (owners.length === 0) return { changed: false, message: 'fences not placed: the activated release does not yet take the locks still missing a fence; activate the release that ships them first' };
  let result;
  try {
    result = fenceCutover({ workspaces: [{ root: workspaceRoot, worktrees: listing.worktrees }], fgosDir, workspaceRoot, ...listing, providerRuntimeDir, owners, ...(bin ? { hostBin: bin } : {}), ...(excludePids ? { excludePids } : {}) });
  } catch (err) {
    return { changed: false, message: `fences not placed: ${err.message}` };
  }
  const blockers = (scan) => scan.blockers.map((b) => (b.kind === 'process' ? `pid ${b.pid} (${String(b.cmdline ?? '').slice(0, 120)}, ${b.matched})` : `${b.count} unreadable process entries`));
  switch (result.status) {
    case 'placed':
      return { changed: result.fences.placed.length > 0, message: `placed ${result.fences.placed.length} fence(s), ${result.fences.skipped.length} already there` };
    case 'placed-then-blocked':
      return { changed: true, message: `placed ${result.fences.placed.length} fence(s); fgOS processes started meanwhile and now fail against them, stop them: ${listed(blockers(result.after))}` };
    case 'blocked':
      return { changed: false, message: `fences not placed: fgOS processes still running, stop them first: ${listed(blockers(result.before))}` };
    case 'needs-attest':
      return { changed: false, message: `fences not placed: this platform cannot scan for running fgOS processes (${result.before.detail ?? 'no detail'}); confirm nothing runs and place them through fenceCutover with attested` };
    default:
      return { changed: false, message: `fences not placed: ${result.status}: old lock still present at ${listed(result.fences?.paths ?? [])}` };
  }
}

// ---------------------------------------------------------------------
// state-root
// ---------------------------------------------------------------------

/**
 * `stateRoot`, `lockRoot` and their source as Node resolves them, next to
 * what the Rust host answers for the same environment. A difference fails.
 * When the root is pinned, the host's answer without the pin is shown too.
 */
export function checkStateRoot(repoRoot, { env = process.env } = {}) {
  const fgosDir = fgosDirOf(repoRoot);
  let node;
  let host;
  try {
    node = resolveStateRoot({ env, fgosDir });
    host = runStateRootRoute({ fgosDir, env });
  } catch (err) {
    return { passed: false, message: `cannot resolve the state root: ${err.message}` };
  }
  const describe = (r) => `stateRoot ${r.stateRoot}, lockRoot ${r.lockRoot} (${r.source})`;
  // Two spellings of one directory (a trailing slash in a pin) are the same root.
  const same = (a, b) => path.resolve(a) === path.resolve(b);
  if (!same(node.stateRoot, host.stateRoot) || !same(node.lockRoot, host.lockRoot)) {
    return { passed: false, message: `Node and the host disagree: Node ${describe(node)}; host ${describe(host)}` };
  }
  if (node.source !== 'pinned') return { passed: true, message: describe(node) };
  const { [STATE_ROOT_ENV]: _pin, ...unpinned } = env;
  let natural = null;
  try {
    natural = runStateRootRoute({ fgosDir, env: unpinned });
  } catch {
    natural = null;
  }
  return { passed: true, message: `${describe(node)}${natural ? `; without the pin the host resolves ${describe(natural)}` : ''}` };
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
