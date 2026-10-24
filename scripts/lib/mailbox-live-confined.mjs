/**
 * scripts/lib/mailbox-live-confined.mjs
 *
 * The confined launch of every live CLI of the mailbox behaviour suite
 * (docs/platform/agent-mailbox/spec.md §11 "Safety of the live suites", the V4
 * review's H2): fgOS's own bwrap driver, a run directory as the only writable
 * host path, the whole real home hidden but for an allow-list, a private home
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
 * `/tmp`, `--unshare-pid --as-pid-1`), then the hidden home and runtime
 * directory with the allow-listed paths bound back, and the base bound
 * read-only (added here), then the driver's resource binds (the run directory
 * and its private home, writable), then the read-only binds the caller names
 * (added here), then each hidden tmpfs made read-only, then the driver's
 * command.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { prepareBwrapSync } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import { DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS, readCredentialExpiry } from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import { installClaudeHook, installCodexHook, installOmpHook, installPiHook } from '../../src/setup/agent-hooks.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
import { loginDigest, setAsideChangedCopy } from './codex-auth-guard.mjs';
import { sandboxGit } from './sandbox-git.mjs';

export const BWRAP = '/usr/bin/bwrap';

/** The one login file each CLI needs, how the driver copies it, and how its expiry is read. */
export const LOGINS = Object.freeze({
  claude: { layout: 'claude-credentials-json', file: path.join('.claude', '.credentials.json'), homeEnv: 'HOME', source: (home) => ({ kind: 'home-files', home, files: [path.join('.claude', '.credentials.json')] }) },
  codex: { layout: 'codex-auth-json', file: 'auth.json', homeEnv: 'CODEX_HOME', source: (home) => ({ kind: 'codex-home', home }) },
});

/** The provider whose OAuth login a pi or omp run carries: the ChatGPT account's Codex login. */
export const ACCOUNT_PROVIDER = 'openai-codex';

/**
 * The account login of a pi or omp run. Both read the one account's login from that account's
 * omp profile store (`<profile dir>/agent/agent.db`, opened read-only, the source never
 * written); pi's own store of the account is not read (its token expired 2026-10-23 and only a
 * refresh, which would rotate the refresh token, could renew it). The login is materialized in
 * the private home, never linked: pi gets `auth.json` (its file, `PI_CODING_AGENT_DIR` pointing
 * at the home), omp an `agent.db` holding that credential only, written by its own `auth import`.
 * `digest` names how a copy is compared after the run: pi's by bytes, omp's by its credential
 * rows (omp writes usage and cache rows into the same database on every run).
 */
export const ACCOUNT_LOGINS = Object.freeze({
  pi: { copyPath: (home) => path.join(home, 'auth.json'), digest: 'bytes' },
  omp: { copyPath: (home, profile) => path.join(home, '.omp', 'profiles', profile, 'agent', 'agent.db'), digest: 'credentials' },
});

/**
 * pi's and omp's installs, as a confined run binds them back read-only (`allow`): pi's launcher
 * and its managed install (the launcher reads `install/current-version`), omp's binary and its
 * unpacked natives (`PI_NATIVES_DIR` points there, so nothing is unpacked into a run). Nothing
 * else of `~/.pi` or `~/.omp`: no account, profile, session or settings. The one definition of
 * those paths.
 */
export function piOmpInstall(home = os.homedir()) {
  const pi = path.join(home, '.pi', 'agent', 'bin', 'pi');
  const omp = path.join(home, '.local', 'bin', 'omp');
  const natives = path.join(home, '.omp', 'natives');
  return { pi, omp, natives, allow: [path.join(home, '.pi', 'agent', 'bin'), path.join(home, '.pi', 'agent', 'install'), omp, natives], installed: exists(pi) && exists(omp) };
}

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
    // pi's or omp's generated extension and omp's off overlay, read-only to the run.
    extension: path.join(base, 'settings', `${runId}-fgos-hooks.ts`),
    ompOff: path.join(base, 'settings', `${runId}-omp-off.yml`),
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
 * rows are returned, for the run's CODEX_HOME; pi's and omp's generated extension (the
 * project's opt-in decides its mailbox handlers) goes to `paths.extension`, read-only, and
 * its path is returned. The project keeps no hook file of its own.
 */
export function installRunRows(paths, cli) {
  if (cli === 'pi' || cli === 'omp') {
    (cli === 'pi' ? installPiHook : installOmpHook)(paths.ws);
    fs.mkdirSync(path.dirname(paths.extension), { recursive: true });
    fs.copyFileSync(path.join(paths.ws, `.${cli}`, 'extensions', 'fgos-hooks.ts'), paths.extension);
    fs.chmodSync(paths.extension, 0o444);
    fs.rmSync(path.join(paths.ws, `.${cli}`), { recursive: true });
    return paths.extension;
  }
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

/**
 * The one confinement of a run's view of the host, an allow-list: the whole real home and the
 * user's runtime directory (its keyring and D-Bus sockets) are each an empty tmpfs, and only the
 * paths in `allow` that lie inside the home are bound back read-only: the pinned CLI installs and
 * the toolchain the CLI executes. The launch itself binds the base read-only and the run's own
 * directory and private home writable; everything else under the home stays unreadable. The plan
 * goes into every ledger entry in full, with its sha256.
 */
export function maskPlan({ home = os.homedir(), runtimeDir = `/run/user/${os.userInfo().uid}`, allow = [] } = {}) {
  const hidden = [home, runtimeDir].filter(isDir);
  const bindBack = [...new Set(allow.filter(Boolean).map((p) => path.resolve(p)))].filter((p) => inside(p, home) && exists(p)).sort();
  return { hidden, bindBack };
}

/** The sha256 of a mask plan, recorded in each run's ledger entry beside the plan itself. */
export const maskPlanSha256 = (masks) => crypto.createHash('sha256').update(JSON.stringify({ hidden: masks.hidden, bindBack: masks.bindBack })).digest('hex');

/** The bwrap arguments that hide: an empty tmpfs over each hidden path, then each allowed path bound back read-only. */
export const maskArgs = ({ hidden, bindBack }) => [...hidden.flatMap((d) => ['--tmpfs', d]), ...bindBack.flatMap((b) => ['--ro-bind', b, b])];

/** The bwrap arguments that make each hidden tmpfs read-only, last, once every mount point inside it exists. */
export const maskSealArgs = ({ hidden }) => hidden.flatMap((d) => ['--remount-ro', d]);

/**
 * The account's `provider` OAuth credential in an omp profile store: `{type, ...data}`. The
 * owner's database is never opened in place: even a read-only SQLite open of a WAL database
 * writes its `-shm` index (measured on the V7e runs). `agent.db` and a `-wal` beside it are
 * copied with a plain file copy into a fresh directory under `scratch`, the copy is read and
 * the directory removed; the source files keep their bytes, mtimes and inodes.
 */
export function readAccountCredential(profileDir, scratch, provider = ACCOUNT_PROVIDER) {
  const file = path.join(profileDir, 'agent', 'agent.db');
  if (!exists(file)) throw new ConfinedLaunchError(`no login store at ${file}; the account was never logged in`);
  fs.mkdirSync(scratch, { recursive: true });
  const dir = fs.mkdtempSync(path.join(scratch, 'login-read-'));
  try {
    fs.chmodSync(dir, 0o700);
    const copy = path.join(dir, 'agent.db');
    fs.copyFileSync(file, copy);
    if (exists(`${file}-wal`)) fs.copyFileSync(`${file}-wal`, `${copy}-wal`);
    const db = new DatabaseSync(copy, { readOnly: true });
    try {
      const row = db.prepare('SELECT credential_type, data FROM auth_credentials WHERE provider = ? AND disabled_cause IS NULL ORDER BY id DESC LIMIT 1').get(provider);
      if (!row) throw new ConfinedLaunchError(`the login store at ${file} holds no ${provider} credential`);
      return { type: row.credential_type, ...JSON.parse(row.data) };
    } finally {
      db.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The account's `provider` credential in pi's own account file (`<account dir>/auth.json`, read
 * once as a plain file, never written): an account whose login pi itself holds, such as one that
 * serves a provider no omp profile carries.
 */
export function readPiAccountCredential(accountDir, provider) {
  const file = path.join(accountDir, 'auth.json');
  if (!exists(file)) throw new ConfinedLaunchError(`no login file at ${file}; the account was never logged in`);
  const credential = JSON.parse(fs.readFileSync(file, 'utf8'))[provider];
  if (!credential) throw new ConfinedLaunchError(`the login file at ${file} holds no ${provider} credential`);
  return credential;
}

/**
 * The sha256 of the credential rows of an omp `agent.db` (provider, type, data, disabled
 * cause), after folding its WAL into the file, so the rows omp writes on every run (usage,
 * cache, model statistics) never read as a changed login.
 */
export function credentialRowsDigest(file) {
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    const rows = db.prepare('SELECT provider, credential_type, data, disabled_cause FROM auth_credentials ORDER BY id').all();
    return crypto.createHash('sha256').update(JSON.stringify(rows.map((r) => [r.provider, r.credential_type, r.data, r.disabled_cause]))).digest('hex');
  } finally {
    db.close();
  }
}

/**
 * The sha256 of the refresh tokens of an omp `agent.db`'s credential rows, after folding its WAL:
 * for a provider whose CLI refreshes its own copy inside a run (a short-lived access token, the
 * refresh token kept), a new access token is no change; a new refresh token is.
 */
export function credentialRefreshDigest(file) {
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    const rows = db.prepare('SELECT provider, data FROM auth_credentials ORDER BY id').all();
    return crypto.createHash('sha256').update(JSON.stringify(rows.map((r) => [r.provider, JSON.parse(r.data)?.refresh ?? null]))).digest('hex');
  } finally {
    db.close();
  }
}

const DIGESTS = { bytes: loginDigest, credentials: credentialRowsDigest, refresh: credentialRefreshDigest };

/**
 * Writes the account login of a `cli` (pi or omp) run into its private `home`, under `provider`
 * (the Codex login's by default): pi's `auth.json` (mode 0600), or omp's `agent.db` for `profile`
 * through `<ompBin> auth import -` with the home as `HOME` (the credential on stdin, never in a
 * file). Returns the copy, its snapshot digest and the digest's kind.
 */
export function materializeAccountLogin({ cli, home, credential, provider = ACCOUNT_PROVIDER, settleBy = null, profile = null, ompBin = null, nativesDir = null }) {
  const spec = ACCOUNT_LOGINS[cli];
  if (!spec) throw new ConfinedLaunchError(`no account login rule for ${cli}`);
  const copy = spec.copyPath(home, profile);
  if (cli === 'pi') {
    const { type, access, refresh, expires, accountId } = credential;
    fs.writeFileSync(copy, `${JSON.stringify({ [provider]: { type, access, refresh, expires, accountId } }, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  } else {
    const env = { PATH: process.env.PATH, HOME: home, LANG: 'C.UTF-8', ...(nativesDir ? { PI_NATIVES_DIR: nativesDir } : {}) };
    const out = spawnSync(ompBin, [`--profile=${profile}`, 'auth', 'import', '-'], { input: JSON.stringify({ version: 1, credentials: [{ provider, credential }] }), env, encoding: 'utf8', timeout: 60_000 });
    if (out.status !== 0 || !exists(copy)) throw new ConfinedLaunchError(`omp auth import into the private home failed (exit ${out.status}): ${String(out.stderr).trim().split('\n')[0]}`);
  }
  // `settleBy` names another digest the copy is settled by: `refresh` for a pair whose CLI refreshes its own copy.
  const digest = settleBy ?? spec.digest;
  if (!DIGESTS[digest]) throw new ConfinedLaunchError(`no login digest ${digest}`);
  return { copy, snapshot: DIGESTS[digest](copy), digest };
}

/**
 * Prepares run `runId` under `base` through the bwrap driver: the run directory (or the
 * shared `workspace`) as a writable workspace grant, a private home inside it (the driver copies `login`'s file
 * there when given: `{cli, home, account}`), the masks after the driver's base flags, the
 * base read-only, and `readOnly` paths bound read-only last. Returns the argv and env to
 * spawn, the paths, and the copied login's path and snapshot digest. Starts nothing.
 */
export function prepareConfinedRun({ base, runId, command, args = [], env = {}, login = null, accountLogin = null, masks, readOnly = [], workspace = null }) {
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
  const confined = [...head, ...maskArgs(masks), '--ro-bind', base, base, ...argv, ...readOnly.flatMap((p) => ['--ro-bind', p, p]), ...maskSealArgs(masks), ...tail];
  // `launch` goes into the ledger entry: the CLI's own argv as given, and the masks in force.
  const launch = { argv: [command, ...args], masks: { hidden: masks.hidden, bindBack: masks.bindBack }, maskSha256: maskPlanSha256(masks) };
  if (accountLogin) {
    const made = materializeAccountLogin({ ...accountLogin, home: paths.home });
    return { paths, command: prepared.invocation.command, args: confined, env: prepared.invocation.env, ...made, launch };
  }
  const copy = spec ? path.join(paths.home, spec.file) : null;
  return { paths, command: prepared.invocation.command, args: confined, env: prepared.invocation.env, copy, snapshot: copy ? loginDigest(copy) : null, digest: 'bytes', launch };
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
  const entry = { runId: paths.runId, dir: paths.dir, startedAt: new Date().toISOString(), ...prepared.launch, login: prepared.copy ? { copy: prepared.copy, snapshot: prepared.snapshot, digest: prepared.digest ?? 'bytes' } : null };
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
 * namespace, or by the run directory), and its login copy is settled like a finished run's
 * (`settleCopy`) whether or not the kill worked: a copy whose bytes changed is set aside and
 * stops the batch, an unchanged one is removed. The entry is recorded `error` (`orphan`) and
 * ended only once no process of it is left; until then it stays open, every later sweep kills
 * and settles it again (a surviving CLI may write a new copy), and its pids are returned in
 * `left`, so no run starts. A copy that cannot be settled (one is already set aside there) is
 * returned in `unsettled`, which also refuses every run. Returns the swept run ids, the pids
 * left, the copies set aside and the copies left unsettled.
 */
export function sweepOrphans(base, { waitMs = 5000 } = {}) {
  const dir = path.join(base, 'ledger');
  const swept = [];
  const left = [];
  const asides = [];
  const unsettled = [];
  if (!isDir(dir)) return { swept, left, asides, unsettled };
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const file = path.join(dir, name);
    const entry = readJson(file);
    if (entry.endedAt) continue;
    const pidNs = entry.pid1 && startTime(entry.pid1) === entry.pid1Start ? entry.pidNs : null;
    killIfSame(entry.pid1, entry.pid1Start);
    killIfSame(entry.bwrapPid, entry.bwrapStart);
    const still = killRunProcesses(entry.dir, pidNs, waitMs);
    left.push(...still);
    let settled = null;
    let loginSettled = entry.loginSettled ?? false;
    // A copy settled by an earlier sweep is gone; only a copy written since is settled again.
    if (entry.login && (!loginSettled || exists(entry.login.copy))) {
      try {
        settled = settleCopy(entry.login, entry.dir);
        loginSettled = true;
      } catch (error) {
        unsettled.push({ runId: entry.runId, copy: entry.login.copy, reason: error.message });
      }
    }
    if (settled) asides.push({ runId: entry.runId, ...settled });
    const record = { ...entry, outcome: 'error', reason: 'orphan', left: still.length, loginSettled, ...(settled ? { loginAside: settled.aside } : {}) };
    writeJson(file, still.length ? { ...record, sweptAt: new Date().toISOString() } : { ...record, endedAt: new Date().toISOString() });
    swept.push(entry.runId);
  }
  return { swept, left, asides, unsettled };
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
 * batch's stop reason is returned with the kept path. The run's ledger entry records it as the
 * orphan sweep records an orphan's: `loginSettled` (true once settled, null for a run with no
 * copy) and `loginAside` for a copy set aside, with `fields` beside them (a talking run's launch
 * settings).
 */
export function settleLoginCopy(prepared, fields = {}) {
  const settled = prepared.copy ? settleCopy({ copy: prepared.copy, snapshot: prepared.snapshot, digest: prepared.digest }, prepared.paths.dir) : null;
  if (exists(prepared.paths.ledger)) writeJson(prepared.paths.ledger, { ...readJson(prepared.paths.ledger), loginSettled: prepared.copy ? true : null, ...(settled ? { loginAside: settled.aside } : {}), ...fields });
  return settled;
}

/**
 * The one settlement of a login copy, for a finished run and an orphan alike: a copy whose
 * `digest` (bytes by default, an omp database's credential rows for `credentials`) still equals
 * its snapshot is removed (null); any other copy
 * (changed, replaced or gone) is set aside into `dir` under the guard's one name, and the
 * batch's stop reason is returned with the kept path.
 */
export function settleCopy({ copy, snapshot, digest = 'bytes' }, dir) {
  // A database copy is compared after its WAL is folded in; closing it leaves no WAL or index file.
  const aside = setAsideChangedCopy(copy, snapshot, dir, DIGESTS[digest]);
  if (aside === null) {
    fs.rmSync(copy);
    return null;
  }
  return { stop: STOP_LOGIN, aside };
}

/** `fresh` when an account credential stays valid for at least the renewal threshold from `now`, else `stale`. */
export const accountLoginFreshness = (credential, now = Date.now()) => (Number(credential?.expires) - now >= DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS ? 'fresh' : 'stale');

const STOP_LOGIN = 'login refreshed inside a run; the copy may hold the only valid token; ask the owner';
