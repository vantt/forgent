/**
 * scripts/lib/mailbox-live-confined.mjs
 *
 * The confined launch of every live CLI of the mailbox behaviour suite
 * (docs/platform/agent-mailbox/spec.md §11 "Safety of the live suites", the V4
 * review's H2): fgOS's own bwrap driver, a run directory as the only writable
 * host path, the real login stores and listed secrets masked, a private home
 * holding a copy (never a link) of the one login file the CLI needs, and an
 * end that leaves no process behind. Node built-ins and the driver only.
 *
 * Layout of a run `<base>/<runId>/` (the only writable bind):
 *   ws/        the CLI's cwd and the run's project (its `.fgos/`); the
 *              project's `.fgos/installation/` (shim and activation) is bound
 *              read-only over it
 *   home/      the private home: the copied login, the CLI's own files and its
 *              last message (Codex `-o`), writable even when the workspace is shared
 * Outside the run directory, read-only to the run: `<base>/ledger/<runId>.json`
 * (the launch facts the orphan sweep reads), `<base>/settings/<runId>.json` (a
 * Claude Code run's hook rows), `<base>/capture/<runId>/` (the harness's captures of
 * the CLI's output) and `<base>/attestations/`.
 *
 * Order of the bwrap argv: the driver's base flags (`--ro-bind / /`, a private
 * `/tmp`, `--unshare-pid --as-pid-1`), then the masks and the base bound
 * read-only (added here), then the driver's resource binds (the run directory
 * and its private home, writable), then the read-only binds the caller names
 * (added here), then the driver's command.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { prepareBwrapSync } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import { DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS, readCredentialExpiry } from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import { installClaudeHook, installCodexHook } from '../../src/setup/agent-hooks.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
import { loginDigest, setAsideChangedCopy } from './codex-auth-guard.mjs';
import { sandboxGit } from './sandbox-git.mjs';

export const BWRAP = '/usr/bin/bwrap';

/** The one login file each CLI needs, how the driver copies it, and how its expiry is read. */
export const LOGINS = Object.freeze({
  claude: { layout: 'claude-credentials-json', file: path.join('.claude', '.credentials.json'), homeEnv: 'HOME', source: (home) => ({ kind: 'home-files', home, files: [path.join('.claude', '.credentials.json')] }) },
  codex: { layout: 'codex-auth-json', file: 'auth.json', homeEnv: 'CODEX_HOME', source: (home) => ({ kind: 'codex-home', home }) },
});

/**
 * The one list of known credential stores every confined launch masks, relative to the home.
 * Directories get an empty read-only tmpfs: the CLIs' login stores, fgOS's own, SSH and GnuPG
 * keys, and the GitHub, AWS, Google Cloud and Azure CLIs' stores.
 */
export const MASKED_HOME_DIRS = Object.freeze(['.claude', '.codex', '.fgos', '.ssh', '.gnupg', '.aws', path.join('.config', 'gh'), path.join('.config', 'gcloud'), '.azure', '.agy-homes', '.gemini']);
/**
 * Files masked by an empty file, besides every `secrets.local.env` found under the secret
 * roots: Claude Code's account file, the npm, git, netrc, Docker and Kubernetes credentials.
 */
export const MASKED_HOME_FILES = Object.freeze(['.claude.json', '.npmrc', '.git-credentials', '.netrc', path.join('.docker', 'config.json'), path.join('.kube', 'config')]);
const SECRET_FILE = 'secrets.local.env';
const SECRET_DEPTH = 4;

/** A launch refused before any CLI started. */
export class ConfinedLaunchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfinedLaunchError';
  }
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const isDir = (p) => fs.statSync(p, { throwIfNoEntry: false })?.isDirectory() === true;
const exists = (p) => fs.lstatSync(p, { throwIfNoEntry: false }) !== undefined;
const inside = (p, root) => typeof p === 'string' && (p === root || p.startsWith(root + path.sep));
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * The paths of run `runId` under `base`. `workspace` is the writable directory holding the
 * project `ws/`: the run directory itself, or a directory two runs share (the loop test's
 * pair, whose two heads work in one project), in which case only the run's home is writable
 * inside its own run directory.
 */
export function runPaths(base, runId, workspace = null) {
  const dir = path.join(base, runId);
  const wsRoot = workspace ?? dir;
  return {
    base,
    runId,
    dir,
    workspace: wsRoot,
    ws: path.join(wsRoot, 'ws'),
    home: path.join(dir, 'home'),
    lastMessage: path.join(dir, 'home', 'last-message.txt'),
    installation: path.join(wsRoot, 'ws', '.fgos', 'installation'),
    ledger: path.join(base, 'ledger', `${runId}.json`),
    settings: path.join(base, 'settings', `${runId}.json`),
    capture: path.join(base, 'capture', runId),
  };
}

/**
 * The run's project, laid out the way an installed project is: the workspace shim (`shim`,
 * the bytes `fgctl` writes) and an activation naming `release` (a directory whose
 * `bin/fgos` is the host under test, never an activated release), the project's `config`
 * (the mailbox opt-in by default), an empty git repository, and the product installer's
 * hook rows for `cli` (see `installRunRows`). Call it after `prepareConfinedRun` (which
 * creates the run directory), before the start; a second head over the same shared
 * workspace calls only `installRunRows`.
 */
export function layOutRunProject(paths, { cli, release, shim, config = { mailbox: { enabled: true } } }) {
  const bin = path.join(paths.installation, 'bin', 'fgos');
  fs.mkdirSync(path.dirname(bin), { recursive: true });
  fs.writeFileSync(bin, shim, { mode: 0o555 });
  writeJson(path.join(paths.installation, 'activation.json'), { status: 'ready', releasePath: release });
  writeSharedConfig(paths.ws, config);
  sandboxGit(paths.workspace)(['init', '-q', paths.ws]);
  return installRunRows(paths, cli);
}

/**
 * The product installer's hook rows for `cli` in the run's project, without its PreToolUse
 * guards (they need the legacy-node payload the private release does not stage). Claude
 * Code's rows go to `paths.settings`, outside the project and read-only to the run; Codex's
 * rows are returned, for the run's CODEX_HOME. The project keeps no hook file of its own.
 */
export function installRunRows(paths, cli) {
  if (cli === 'claude') {
    installClaudeHook(paths.ws);
    const file = path.join(paths.ws, '.claude', 'settings.json');
    const settings = readJson(file);
    delete settings.hooks.PreToolUse;
    writeJson(paths.settings, settings);
    fs.rmSync(path.join(paths.ws, '.claude'), { recursive: true });
    return settings.hooks;
  }
  installCodexHook(paths.ws);
  const hooks = readJson(path.join(paths.ws, '.codex', 'hooks.json')).hooks;
  delete hooks.PreToolUse;
  fs.rmSync(path.join(paths.ws, '.codex'), { recursive: true });
  return hooks;
}

/** Every `secrets.local.env` under `roots`, at most four levels down, never through a symlink. */
function secretFiles(roots) {
  const found = [];
  const walk = (dir, depth) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === SECRET_FILE) found.push(full);
      else if (entry.isDirectory() && depth < SECRET_DEPTH) walk(full, depth + 1);
    }
  };
  for (const root of roots) walk(root, 1);
  return found;
}

/**
 * The masks of one launch, from what exists at launch: the home's login and secret
 * directories plus each Codex account home (`dirs`, an empty read-only tmpfs each), the
 * home's `.claude.json` and every `secrets.local.env` under `secretRoots` (`files`,
 * an empty file each), and the pinned Codex release directory bound back read-only when a
 * mask hides it (`bindBack`).
 */
export function maskPlan({ home = os.homedir(), codexAccountHomes = [], secretRoots = [path.join(home, 'projects')], codexRelease = null } = {}) {
  const dirs = [...new Set([...MASKED_HOME_DIRS.map((d) => path.join(home, d)), ...codexAccountHomes])].filter(isDir);
  const files = [...MASKED_HOME_FILES.map((f) => path.join(home, f)), ...secretFiles(secretRoots)].filter(exists);
  const bindBack = codexRelease && dirs.some((d) => inside(codexRelease, d)) ? [codexRelease] : [];
  return { dirs, files, bindBack };
}

/** The sha256 of a mask plan, recorded in each run's ledger entry as the masks in force. */
export const maskPlanSha256 = (masks) => crypto.createHash('sha256').update(JSON.stringify({ dirs: masks.dirs, files: masks.files, bindBack: masks.bindBack })).digest('hex');

/**
 * The bwrap arguments of a mask plan: tmpfs, binds back, each tmpfs made read-only, and
 * each masked file replaced by `empty`, an empty regular file (bwrap binds without device
 * access, so /dev/null bound over a file would read as EACCES, not as empty).
 */
export function maskArgs({ dirs, files, bindBack }, empty) {
  return [
    ...dirs.flatMap((d) => ['--tmpfs', d]),
    ...bindBack.flatMap((b) => ['--ro-bind', b, b]),
    ...dirs.flatMap((d) => ['--remount-ro', d]),
    ...files.flatMap((f) => ['--ro-bind', empty, f]),
  ];
}

/**
 * Prepares run `runId` under `base` through the bwrap driver: the run directory (or the
 * shared `workspace`) as a writable workspace grant, a private home inside it (the driver copies `login`'s file
 * there when given: `{cli, home, account}`), the masks after the driver's base flags, the
 * base read-only, and `readOnly` paths bound read-only last. Returns the argv and env to
 * spawn, the paths, and the copied login's path and snapshot digest. Starts nothing.
 */
export function prepareConfinedRun({ base, runId, command, args = [], env = {}, login = null, masks, readOnly = [], workspace = null }) {
  const paths = runPaths(base, runId, workspace);
  if (exists(paths.dir)) throw new ConfinedLaunchError(`${paths.dir} exists; every run gets a fresh directory`);
  if (exists(paths.ledger)) throw new ConfinedLaunchError(`${paths.ledger} exists; ${runId} was launched before`);
  if (workspace && !(inside(workspace, base) && isDir(workspace))) throw new ConfinedLaunchError(`a shared workspace must be an existing directory under ${base}`);
  fs.mkdirSync(paths.ws, { recursive: true });
  const context = { cwd: paths.ws, repoRoot: paths.workspace, attestationStoreDir: path.join(base, 'attestations') };
  const resources = resolveConfinementResources({
    dispatchId: runId,
    context,
    grants: [{ resource: 'workspace', access: 'write' }, { resource: 'private-home', access: 'write' }],
    backendConfig: { tempRoot: base },
  });
  const spec = login ? LOGINS[login.cli] : null;
  if (login && !spec) throw new ConfinedLaunchError(`no login rule for ${login.cli}`);
  const request = {
    dispatchId: runId,
    invocation: {
      command,
      args,
      env: { ...env, HOME: paths.home },
      ...(spec ? { credentialStore: { use: login.cli, homeEnv: spec.homeEnv, files: [spec.file] } } : {}),
    },
    ...(spec ? { providerCapacity: { provider: login.cli, accountId: login.account ?? login.cli, credentialSource: spec.source(login.home) } } : {}),
    context,
  };
  const prepared = prepareBwrapSync({ resources }, request, { id: 'bwrap', config: { executable: BWRAP } });
  const argv = [...prepared.invocation.args];
  const afterBase = argv.indexOf('--as-pid-1') + 1;
  const separator = argv.indexOf('--');
  if (afterBase === 0 || separator < afterBase) throw new ConfinedLaunchError('the driver argv has no base flags or no command separator');
  const tail = argv.splice(separator);
  const head = argv.splice(0, afterBase);
  const empty = path.join(base, 'masks', 'empty');
  if (!exists(empty)) {
    fs.mkdirSync(path.dirname(empty), { recursive: true });
    fs.writeFileSync(empty, '', { mode: 0o444 });
  }
  const confined = [...head, ...maskArgs(masks, empty), '--ro-bind', base, base, ...argv, ...readOnly.flatMap((p) => ['--ro-bind', p, p]), ...tail];
  const copy = spec ? path.join(paths.home, spec.file) : null;
  // `launch` goes into the ledger entry: the CLI's own argv as given, and the masks in force.
  const launch = { argv: [command, ...args], maskSha256: maskPlanSha256(masks) };
  return { paths, command: prepared.invocation.command, args: confined, env: prepared.invocation.env, copy, snapshot: copy ? loginDigest(copy) : null, launch };
}

// ---------------------------------------------------------------- processes

/** `/proc/<pid>/stat` start time, or null when the pid is gone. */
export function startTime(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')[19];
  } catch {
    return null;
  }
}

const readLink = (p) => {
  try {
    return fs.readlinkSync(p);
  } catch {
    return null;
  }
};

/** The state letter of `/proc/<pid>/stat` (`Z` for a zombie), or null when the pid is gone. */
const stateOf = (pid) => {
  try {
    return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')[0];
  } catch {
    return null;
  }
};

/** The host pid of the sandbox's pid 1: the child of bwrap. Polls up to `waitMs`; null once bwrap has exited. */
export function sandboxInit(bwrapPid, waitMs = 5000) {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if ([null, 'Z', 'X'].includes(stateOf(bwrapPid))) return null;
    let tasks = [];
    try {
      tasks = fs.readdirSync(`/proc/${bwrapPid}/task`);
    } catch {
      return null;
    }
    for (const task of tasks) {
      let children = '';
      try {
        children = fs.readFileSync(`/proc/${bwrapPid}/task/${task}/children`, 'utf8').trim();
      } catch {
        continue;
      }
      const first = Number(children.split(/\s+/)[0]);
      if (first > 0 && readLink(`/proc/${first}/ns/pid`) !== readLink(`/proc/${bwrapPid}/ns/pid`)) return first;
    }
    sleepSync(20);
  }
  return null;
}

/**
 * The host pids of processes that belong to a run: in its pid namespace `pidNs`, or with a
 * working directory or executable inside `dir`. Never this process or its parent.
 */
export function processesOfRun(dir, pidNs) {
  const pids = [];
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    if (pid === process.pid || pid === process.ppid) continue;
    const ns = readLink(`/proc/${pid}/ns/pid`);
    if ((pidNs && ns === pidNs) || inside(readLink(`/proc/${pid}/cwd`), dir) || inside(readLink(`/proc/${pid}/exe`), dir)) pids.push(pid);
  }
  return pids;
}

const killIfSame = (pid, start) => {
  if (pid && start && startTime(pid) === start) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // gone between the check and the kill
    }
  }
};

/** SIGKILL to every process of the run until none is left or `waitMs` passes; returns what is left. */
function killRunProcesses(dir, pidNs, waitMs) {
  const deadline = Date.now() + waitMs;
  let left = processesOfRun(dir, pidNs);
  while (left.length && Date.now() < deadline) {
    for (const pid of left) killIfSame(pid, startTime(pid));
    sleepSync(50);
    left = processesOfRun(dir, pidNs);
  }
  return left;
}

/**
 * Starts a prepared run. The ledger entry is written before the spawn (so a crash right
 * after it still leaves a trace) and completed with the bwrap pid, the sandbox's pid 1 (by
 * its host pid), their start times and the pid namespace once the sandbox is up.
 */
export function startConfinedRun(prepared, { stdio = ['ignore', 'pipe', 'pipe'] } = {}) {
  const { paths } = prepared;
  // The login copy and its snapshot let the orphan sweep settle the copy of a run it ends.
  const entry = { runId: paths.runId, dir: paths.dir, startedAt: new Date().toISOString(), ...prepared.launch, login: prepared.copy ? { copy: prepared.copy, snapshot: prepared.snapshot } : null };
  writeJson(paths.ledger, entry);
  // `prepared.command` is always BWRAP (the driver's configured executable); the program is named here.
  const child = spawn(BWRAP, prepared.args, { cwd: paths.ws, env: prepared.env, stdio });
  const pid1 = sandboxInit(child.pid);
  Object.assign(entry, {
    bwrapPid: child.pid,
    bwrapStart: startTime(child.pid),
    pid1,
    pid1Start: pid1 ? startTime(pid1) : null,
    pidNs: pid1 ? readLink(`/proc/${pid1}/ns/pid`) : null,
  });
  writeJson(paths.ledger, entry);
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
  return { child, exited, entry, paths };
}

/**
 * Ends a run: SIGKILL to the sandbox's pid 1 by its host pid (a namespace init ignores a
 * SIGTERM it has no handler for, and its death ends every process of the namespace), then
 * to bwrap, then to anything still in the namespace or inside the run directory. Records
 * the end in the ledger. Returns `{left}`, the pids still there (empty on success).
 */
export async function endConfinedRun(run, { waitMs = 5000, outcome = null } = {}) {
  const { entry, paths } = run;
  killIfSame(entry.pid1, entry.pid1Start);
  killIfSame(entry.bwrapPid, entry.bwrapStart);
  await Promise.race([run.exited, new Promise((resolve) => setTimeout(resolve, waitMs))]);
  const left = killRunProcesses(paths.dir, entry.pidNs, waitMs);
  writeJson(paths.ledger, { ...readJson(paths.ledger), endedAt: new Date().toISOString(), left: left.length, ...(outcome ? { outcome } : {}) });
  return { left };
}

/**
 * At every harness start: each ledger entry under `base` without an end is an orphan of a
 * harness that died. Its processes are killed (matched by recorded start times and its pid
 * namespace, or by the run directory), its login copy is settled like a finished run's
 * (`settleCopy`), and it is recorded `error` (`orphan`). Returns the swept run ids, the pids
 * left and the copies set aside; the caller starts no run while any pid is left, and stops
 * the batch for a copy set aside.
 */
export function sweepOrphans(base, { waitMs = 5000 } = {}) {
  const dir = path.join(base, 'ledger');
  const swept = [];
  const left = [];
  const asides = [];
  if (!isDir(dir)) return { swept, left, asides };
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const file = path.join(dir, name);
    const entry = readJson(file);
    if (entry.endedAt) continue;
    const pidNs = entry.pid1 && startTime(entry.pid1) === entry.pid1Start ? entry.pidNs : null;
    killIfSame(entry.pid1, entry.pid1Start);
    killIfSame(entry.bwrapPid, entry.bwrapStart);
    const still = killRunProcesses(entry.dir, pidNs, waitMs);
    left.push(...still);
    const settled = entry.login && !still.length ? settleCopy(entry.login, entry.dir) : null;
    if (settled) asides.push({ runId: entry.runId, ...settled });
    writeJson(file, { ...entry, endedAt: new Date().toISOString(), outcome: 'error', reason: 'orphan', left: still.length, ...(settled ? { loginAside: settled.aside } : {}) });
    swept.push(entry.runId);
  }
  return { swept, left, asides };
}

// ---------------------------------------------------------------- the login guard

/**
 * `fresh` when the login at `login.home` stays valid for at least the renewal threshold
 * (DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS) from `now`, else `stale` (an unreadable login is
 * stale). Never reads more than the expiry.
 */
export function loginFreshness(login, now = Date.now()) {
  const read = readCredentialExpiry(LOGINS[login.cli].layout, login.home);
  if (!read.ok) return 'stale';
  return Math.min(...read.entries.map((e) => e.expiresMs)) - now >= DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS ? 'fresh' : 'stale';
}

/**
 * Waits for a fresh login: re-checks every `intervalMs` (5 minutes) for up to `maxMs` (2
 * hours), since the owner's own sessions refresh the source. Resolves `fresh`, or throws
 * "login near expiry".
 */
export async function waitForFreshLogin(login, { intervalMs = 5 * 60_000, maxMs = 2 * 3_600_000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() } = {}) {
  const until = now() + maxMs;
  for (;;) {
    if (loginFreshness(login, now()) === 'fresh') return 'fresh';
    if (now() + intervalMs > until) throw new ConfinedLaunchError('login near expiry');
    await sleep(intervalMs);
  }
}

/**
 * After a run: when the copied login still has its snapshot bytes, only that file is
 * removed (null). Otherwise it is set aside out of the home under the guard's one name
 * (codex-auth-guard), never deleted, the run directory is then never removed, and the
 * batch's stop reason is returned with the kept path.
 */
export function settleLoginCopy(prepared) {
  return prepared.copy ? settleCopy({ copy: prepared.copy, snapshot: prepared.snapshot }, prepared.paths.dir) : null;
}

/**
 * The one settlement of a login copy, for a finished run and an orphan alike: a copy that
 * still has its snapshot bytes is removed (null); any other copy (changed, replaced or gone)
 * is set aside into `dir` under the guard's one name, and the batch's stop reason is returned
 * with the kept path.
 */
export function settleCopy({ copy, snapshot }, dir) {
  const aside = setAsideChangedCopy(copy, snapshot, dir);
  if (aside === null) {
    fs.rmSync(copy);
    return null;
  }
  return { stop: STOP_LOGIN, aside };
}

const STOP_LOGIN = 'login refreshed inside a run; the copy may hold the only valid token; ask the owner';
