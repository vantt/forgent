#!/usr/bin/env node
/**
 * test/live/mailbox-wake-probe.live.mjs
 *
 * The mailbox's interactive wake-channel probes (V7f part A; the logic and the probe table are
 * scripts/lib/mailbox-wake-probe.mjs). Each probe opens one pane through Terminal Control's
 * internal route (the private release's host, built from this checkout), starts one interactive head in it as
 * `env -i <allowlisted env> <cli> …` with a private HOME holding a copied login (never linked),
 * no MCP server and no account connector, the project's mailbox hook rows of the branch host;
 * once the head registered and idles (or runs its busy step), the harness sends it a benign hello
 * and fires the probe's channel with the fixed nudge line, then watches its records, its
 * presence, the pane's screen and the focus. A dialog is left for a person; the harness never
 * types into a pane and never answers one.
 *
 * Chosen by name, never part of `npm test`. A real probe spends one interactive session of the
 * owner's ten (Q3 option A) and runs only with `--watched` (the owner present); `--dry` runs the
 * stand-in heads of test/live/mailbox-wake-probe-stub.mjs (Claude Code, Codex) or the real pi
 * and omp against the recording endpoint, in a herdr session of its own.
 *
 * Subcommands
 *   plan                       every probe: question, expected result, stop condition, pane, command
 *   run <W1|W2|W3|W5|W6|W7|W9|W10> [--dry | --watched] [--keep]
 *   report [--dry]             every probe's result, with W4 (Claude presence) and W8 (Codex presence)
 *
 * Where: ../forgent-worktrees/mbx-wake[-dry]/<probe>/ (short, so a Claude Code socket path stays
 * under 104 bytes inside the probe's own directory); results in <probe>/result.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';
import * as confined from '../../scripts/lib/mailbox-live-confined.mjs';
import * as runs from '../../scripts/lib/mailbox-behaviour-run.mjs';
import * as wake from '../../scripts/lib/mailbox-wake-probe.mjs';
import { loginDigest } from '../../scripts/lib/codex-auth-guard.mjs';
import { startRecorder } from '../../scripts/lib/mailbox-role-recorder.mjs';
import { buildHost, scratchCodexLogin, targetDir } from './mailbox-behaviour.live.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const STUB = fileURLToPath(new URL('./mailbox-wake-probe-stub.mjs', import.meta.url));
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const WORKTREES = path.join(path.dirname(REPO_ROOT), 'forgent-worktrees');
const baseOf = (dry) => path.join(WORKTREES, `mbx-wake${dry ? '-dry' : ''}`);
const DRY_HERDR_SESSION = 'mbx-wake-dry';
const MIN_FREE_GB = 8;
const CODEX_ACCOUNT = 'tetnu';
const PI_OMP_ACCOUNT = 'openai-tetnu';
const SENDER = 'planner1';

const say = (text) => process.stdout.write(`${text}\n`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
function die(message, code = 3) {
  process.stderr.write(`mailbox-wake-probe.live: ${message}\n`);
  process.exit(code);
}

/** The versioned binary of a CLI (never the updatable link). */
const cliBin = (cli) => (cli === 'pi' || cli === 'omp' ? confined.piOmpInstall()[cli] : fs.realpathSync(path.join(os.homedir(), '.local', 'bin', cli)));

/** One call of Terminal Control's internal route. */
function route(op, request, herdrEnv) {
  const out = spawnSync(process.env.FGOS_HOST_BIN, ['internal', 'terminal-control', op, '--protocol', '1', '--json'], { input: JSON.stringify({ v: 1, driver: 'herdr', timeoutMs: 60_000, request, ...(Object.keys(herdrEnv).length ? { env: herdrEnv } : {}) }), encoding: 'utf8', env: { ...process.env, ...herdrEnv }, timeout: 90_000 });
  try {
    return JSON.parse(out.stdout);
  } catch {
    return { result: 'route-error', status: out.status, stderr: String(out.stderr).trim().split('\n').slice(-3).join(' ') };
  }
}

/** A read-only herdr call (pane list, pane read) answering JSON or text. */
function herdr(args, herdrEnv) {
  const out = spawnSync('herdr', args, { env: { ...process.env, ...herdrEnv }, encoding: 'utf8', timeout: 15_000 });
  try {
    return JSON.parse(out.stdout);
  } catch {
    return out.stdout ?? '';
  }
}

// ---------------------------------------------------------------- one probe's head

/** The command line the person runs (or reads) for a probe. */
const commandOf = (probe, flag) => `node test/live/mailbox-wake-probe.live.mjs run ${probe.id} ${flag}`;

/**
 * Lays out a probe: the project (the branch host behind the shim, the mailbox on, the CLI's hook
 * rows), the private home with the copied login, and the head's argv and environment.
 */
function layOut(probe, { dry, base, release, shim }) {
  const paths = confined.runPaths(base, probe.id);
  if (fs.existsSync(paths.dir)) die(`${paths.dir} exists; every probe session runs once`);
  fs.mkdirSync(paths.ws, { recursive: true });
  fs.mkdirSync(paths.home, { recursive: true });
  const run = path.join(paths.dir, 'run');
  fs.mkdirSync(run, { recursive: true, mode: 0o700 });
  const hooks = confined.layOutRunProject(paths, { cli: probe.cli, release, shim });
  const env = { HOME: paths.home, XDG_RUNTIME_DIR: run, ...runs.cliRunEnv(probe.cli) };
  let bin = dry && ['claude', 'codex'].includes(probe.cli) ? null : cliBin(probe.cli);
  let pathPrefix = path.join(paths.installation, 'bin');
  let args;
  let login = null;
  if (probe.cli === 'claude') {
    if (!dry) {
      login = path.join(paths.home, confined.LOGINS.claude.file);
      fs.mkdirSync(path.dirname(login), { recursive: true });
      fs.copyFileSync(path.join(os.homedir(), confined.LOGINS.claude.file), login);
      fs.chmodSync(login, 0o600);
    }
    live.seedClaudeState({ home: paths.home, version: dry ? 'stub' : live.semver(spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout), trusted: [paths.ws] });
    writeJson(paths.settings, wake.claudeSettings(probe, hooks));
    args = wake.claudeArgs(probe, { settings: paths.settings, noMcp: runs.CLAUDE_NO_MCP });
    if (dry) [bin, args] = [process.execPath, [STUB, 'claude', ...args]];
  } else if (probe.cli === 'codex') {
    env.CODEX_HOME = paths.home;
    if (!dry) {
      login = path.join(paths.home, 'auth.json');
      fs.copyFileSync(path.join(live.accountHome('codex', CODEX_ACCOUNT), 'auth.json'), login);
      fs.chmodSync(login, 0o600);
    }
    runs.writeCodexConfig(paths.home, paths.ws, hooks, { effort: 'low' });
    args = ['-m', 'gpt-6.1-sol', '--dangerously-bypass-hook-trust', '--dangerously-bypass-approvals-and-sandbox', '-C', paths.ws, wake.firstPrompt(probe)];
    if (dry) {
      bin = codexStubBin(base);
      args = [STUB, 'codex', ...args];
    }
  } else {
    const install = confined.piOmpInstall();
    const ext = path.join(paths.dir, 'wake-probe-ext.ts');
    fs.writeFileSync(ext, wake.timerExtension(probe.cli, { trigger: path.join(paths.ws, '.wake-trigger'), log: path.join(paths.dir, 'wake-ext.log') }));
    const credential = dry ? scratchCodexLogin() : confined.readAccountCredential(path.join(os.homedir(), '.omp', 'profiles', PI_OMP_ACCOUNT), path.join(paths.dir, 'login-read'));
    if (probe.cli === 'pi') env.PI_CODING_AGENT_DIR = paths.home;
    else env.PI_NATIVES_DIR = install.natives;
    const made = confined.materializeAccountLogin({ cli: probe.cli, home: paths.home, credential, profile: runs.RUN_PROFILE, ompBin: install.omp, nativesDir: install.natives });
    login = { ...made };
    // A fresh omp profile opens its onboarding wizard and an update check, which the owner's omp ran long ago: both off.
    // A dry omp talks to the recording endpoint, which takes no websocket: its Codex websockets are off there only.
    if (probe.cli === 'omp') fs.writeFileSync(paths.ompOff, `${runs.OMP_OFF_CONFIG}startup:\n  setupWizard: false\n  checkUpdate: false\n${dry ? 'providers:\n  openaiWebsockets: "off"\n' : ''}`, { mode: 0o444 });
    // pi asks a person to trust the project folder; `--approve` trusts its project-local files for this run only, as Claude Code's seeded trust does.
    const head = probe.cli === 'pi' ? [...runs.PI_OFF, '--approve'] : [`--profile=${runs.RUN_PROFILE}`, ...runs.OMP_OFF, `--config=${paths.ompOff}`];
    args = [...head, '-e', paths.extension, '-e', ext, '--model', 'openai-codex/gpt-6.1-sol', '--thinking', 'low', wake.firstPrompt(probe)];
    if (probe.cli === 'pi') {
      // pi's launcher is a shell script that execs Node on the managed release; the pane runs that Node directly, so Terminal Control identifies the process it launched.
      const managed = piManaged();
      Object.assign(env, managed.env);
      pathPrefix = `${pathPrefix}:${managed.pathDir}`;
      [bin, args] = [managed.node, [managed.entry, ...args]];
    }
  }
  const snapshot = login && typeof login === 'string' ? { copy: login, snapshot: loginDigest(login), digest: 'bytes' } : login;
  return { paths, run, env: live.cliEnv({ zdotdir: path.join(paths.dir, 'zdot'), pathPrefix, extra: env }), bin, args, login: snapshot };
}

/** What pi's launcher execs: the managed release's entry under the Node it installed, and the two variables the launcher sets. */
function piManaged() {
  const agent = path.join(os.homedir(), '.pi', 'agent');
  const version = fs.readFileSync(path.join(agent, 'install', 'current-version'), 'utf8').trim();
  const entry = fs.realpathSync(path.join(agent, 'install', 'releases', version, 'node_modules', '.bin', 'pi'));
  const nodeDir = path.join(os.homedir(), '.local', 'share', 'pi-node', 'current', 'bin');
  const node = fs.existsSync(path.join(nodeDir, 'node')) ? fs.realpathSync(path.join(nodeDir, 'node')) : process.execPath;
  return { node, entry, env: { PI_MANAGED_INSTALL_ROOT: path.join(agent, 'install') }, pathDir: path.dirname(node) };
}

/** The Node binary under the file name `codex` (the head check reads the executable name). */
function codexStubBin(base) {
  const bin = path.join(base, 'stub-bin', 'codex');
  if (!fs.existsSync(bin)) {
    fs.mkdirSync(path.dirname(bin), { recursive: true });
    fs.copyFileSync(process.execPath, bin);
    fs.chmodSync(bin, 0o755);
  }
  return bin;
}

/** A dry pi or omp head's model: the recording endpoint, scripted to run `ls`, then `inbox --claim` after the nudge, each followed by a short answer. */
async function dryModel(probe, paths) {
  const recorder = await startRecorder({
    dir: path.join(paths.dir, 'recorder'),
    callFor: (body) => {
      const input = body?.input ?? [];
      const nudged = input.findIndex((i) => JSON.stringify(i).includes(wake.NUDGE));
      const calls = input.filter((i) => i.type === 'function_call').length;
      if (nudged < 0) return calls ? null : { name: 'bash', arguments: JSON.stringify({ command: 'ls' }) };
      return input.slice(nudged).some((i) => i.type === 'function_call') ? null : { name: 'bash', arguments: JSON.stringify({ command: 'fgos mailbox inbox --claim' }) };
    },
    textFor: (body) => (JSON.stringify(body?.input ?? []).includes(wake.NUDGE) ? 'It was a benign hello from another agent.' : 'READY'),
  });
  if (probe.cli === 'pi') writeJson(path.join(paths.home, 'models.json'), { providers: { [confined.ACCOUNT_PROVIDER]: { baseUrl: recorder.url } } });
  else fs.writeFileSync(path.join(paths.home, '.omp', 'profiles', runs.RUN_PROFILE, 'agent', 'models.yml'), `providers:\n  ${confined.ACCOUNT_PROVIDER}:\n    baseUrl: ${recorder.url}\n`);
  return recorder;
}

// ---------------------------------------------------------------- what the harness reads

const snapshotOf = (ws) => {
  try {
    return readJson(path.join(ws, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json'));
  } catch {
    return null;
  }
};

/** The Claude Code session file of the probe's head under its private home. */
function claudeSession(home) {
  const dir = path.join(home, '.claude', 'sessions');
  const file = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => /^\d+\.json$/.test(f)) : null;
  return file ? path.join(dir, file) : null;
}

const claudeStatus = (home) => {
  const file = claudeSession(home);
  try {
    return file ? readJson(file).status ?? null : null;
  } catch {
    return null;
  }
};

/** Whether the head is idle, by its own records: Claude Code's status, else the last record an answer and nothing new for 3 s. */
function idleNow(probe, paths, last) {
  if (probe.cli === 'claude') return claudeStatus(paths.home) === 'idle';
  const records = runs.modelRecords(probe.cli, paths.home);
  const changed = records.length !== last.count;
  last.count = records.length;
  if (changed) last.at = Date.now();
  return records.length > 0 && Date.now() - last.at > 3_000;
}

/** Whether the busy step (`sleep`) has started and not ended. */
function sleeping(probe, paths) {
  const records = runs.modelRecords(probe.cli, paths.home);
  const started = records.some((r) => JSON.stringify(r).includes('sleep 45'));
  return started && (probe.cli !== 'claude' || claudeStatus(paths.home) === 'busy');
}

// ---------------------------------------------------------------- run

async function cmdRun(id, { dry, watched, keep }) {
  const probe = wake.probeOf(id);
  if (!dry && !watched) die('a real probe runs only with --watched: the owner watches the pane and answers any dialog', 2);
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry });
  if (problem) die(problem);
  const base = baseOf(dry);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  // A dry probe reruns freely; a real one runs once.
  if (dry) {
    const old = confined.runPaths(base, probe.id);
    for (const p of [old.dir, old.settings, old.extension, old.ompOff]) fs.rmSync(p, { recursive: true, force: true });
  }
  const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
  // Terminal Control's internal route (and a dry herdr session) are reached through the private release's host, never an activated one.
  process.env.FGOS_HOST_BIN = host;
  const laid = layOut(probe, { dry, base, release: path.dirname(path.dirname(host)), shim: fs.readFileSync(shimFile, 'utf8') });
  const { paths } = laid;
  const recorder = dry && ['pi', 'omp'].includes(probe.cli) ? await dryModel(probe, paths) : null;
  let herdrEnv = {};
  if (dry) {
    const { ensureWorkerSession } = await import('../../src/runner/dispatch/worker-session-boot.mjs');
    const session = await ensureWorkerSession(DRY_HERDR_SESSION, { callerEnv: process.env });
    herdrEnv = { HERDR_SESSION: session.env.HERDR_SESSION, HERDR_SOCKET_PATH: session.env.HERDR_SOCKET_PATH };
  }
  const pane = wake.paneOf(probe, { dry });
  const result = { probe: probe.id, cli: probe.cli, channel: probe.channel, dry, pane, startedAt: new Date().toISOString(), argv: [laid.bin, ...laid.args], events: [] };
  const note = (what, extra = {}) => {
    result.events.push({ at: Date.now(), what, ...extra });
    say(`${probe.id}: ${what}${Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : ''}`);
  };
  const allocated = route('allocate', { key: pane.key, groupKey: pane.group, display: { label: pane.label, role: probe.id, agent: probe.cli }, cwd: paths.ws }, herdrEnv);
  if (allocated.result !== 'slot') die(`allocate ${pane.key}: ${JSON.stringify(allocated)}`);
  result.paneId = allocated.paneId ?? allocated.slot?.paneId ?? null;
  writeJson(path.join(paths.dir, 'pane.json'), { ...pane, paneId: result.paneId, herdrSession: herdrEnv.HERDR_SESSION ?? 'the owner\'s' });
  const pairs = Object.entries(laid.env).map(([k, v]) => `${k}=${v}`);
  const launched = route('launch', { key: pane.key, launchSpec: { command: '/usr/bin/env', args: ['-i', ...pairs, laid.bin, ...laid.args], cwd: paths.ws, env: {}, expect: { argv0: laid.bin, command: laid.bin, args: laid.args } } }, herdrEnv);
  note('launched', { result: launched.result });
  const samples = [];
  const sample = () => {
    if (probe.cli === 'claude') samples.push({ at: Date.now(), status: claudeStatus(paths.home) });
  };
  const screen = () => (result.paneId ? String(herdr(['pane', 'read', result.paneId, '--source', 'visible'], herdrEnv)) : '');
  const waitUntil = async (what, test, ms) => {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(wake.SAMPLE_MS)) {
      sample();
      if (test()) return true;
      const dialog = wake.dialogOn(screen());
      if (dialog) {
        note('dialog', { while: what, dialog });
        return false;
      }
    }
    note('timed out', { while: what, screen: screen().split('\n').filter((l) => l.trim()).slice(-12) });
    return false;
  };
  let fired = null;
  let binding = null;
  const ready = launched.result === 'launched'
    && await waitUntil('registration', () => (binding = Object.values(snapshotOf(paths.ws)?.bindings ?? {})[0] ?? null) !== null, 120_000)
    && await (async () => {
      const last = { count: -1, at: Date.now() };
      return waitUntil(probe.busy ? 'the busy step' : 'idle', () => (probe.busy ? sleeping(probe, paths) : idleNow(probe, paths, last)), 120_000);
    })();
  if (ready) {
    note('registered', { name: binding.name });
    const sent = runs.harnessSend(paths.ws, binding.name, wake.HELLO, { sender: SENDER });
    result.sent = { status: sent.status, id: sent.id, text: sent.text.split('\n')[0] };
    result.focusBefore = wake.focusedPanes(herdr(['pane', 'list'], herdrEnv));
    if (probe.channel === 'socket') {
      const socket = wake.socketOf(claudeSession(paths.home), paths.dir);
      fired = await wake.writeSocket(socket, wake.socketLine());
    } else if (probe.channel === 'queue') {
      const at = Date.now();
      const queueBin = dry ? codexStubBin(base) : laid.bin;
      const out = spawnSync(queueBin, [...(dry ? [STUB, 'codex'] : []), ...wake.queueArgs(binding.key)], { env: laid.env, cwd: paths.ws, encoding: 'utf8', timeout: 30_000 });
      fired = { ok: out.status === 0, at, error: out.status === 0 ? null : String(out.stderr || out.stdout).trim().split('\n')[0], answer: String(out.stdout).trim().split('\n')[0] };
    } else {
      fs.writeFileSync(path.join(paths.ws, '.wake-trigger'), '');
      fired = { ok: true, at: Date.now(), error: null };
    }
    note('fired', { ok: fired.ok, error: fired.error });
    const records = () => runs.modelRecords(probe.cli, paths.home);
    const offered = () => {
      const m = (snapshotOf(paths.ws)?.messages ?? []).find((x) => x.id === sent.id);
      return Boolean(m?.state?.offered);
    };
    const watch = wake.WATCH_MS + (probe.busy ? 60_000 : 0);
    await waitUntil('the turn', () => wake.turnAfter(records(), fired.at).started && offered(), watch);
    const turn = wake.turnAfter(records(), fired.at);
    result.focusAfter = wake.focusedPanes(herdr(['pane', 'list'], herdrEnv));
    result.turn = turn;
    result.offered = offered();
    result.screenAfter = screen().split('\n').slice(-25).join('\n');
    result.verdict = wake.verdict({ started: turn.started, dialog: result.events.find((e) => e.what === 'dialog')?.dialog ?? wake.dialogOn(result.screenAfter), focusBefore: result.focusBefore, focusAfter: result.focusAfter });
    result.fired = fired;
  }
  result.presence = samples;
  const dialogOpen = Boolean(result.verdict?.dialog ?? result.events.some((e) => e.what === 'dialog'));
  // A dialog is a person's to answer: that pane stays, and its login copy with it.
  const disposition = keep || dialogOpen ? 'retain' : 'close';
  result.released = route('release', disposition === 'retain' ? { key: pane.key, disposition, until: null } : { key: pane.key, disposition }, herdrEnv).result;
  await recorder?.close();
  if (disposition === 'close') {
    // A real Codex REPL started a daemon of its own under the private CODEX_HOME: stopped here, never the owner's.
    if (probe.cli === 'codex' && !dry) result.daemonStop = spawnSync(laid.bin, ['app-server', 'daemon', 'stop'], { env: laid.env, cwd: paths.ws, encoding: 'utf8', timeout: 30_000 }).status;
    await sleep(1_000);
    // Anything still running from the probe's directory is the probe's own: ended, and named in the result.
    result.left = confined.processesOfRun(paths.dir, null);
    for (const pid of result.left) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // already gone
      }
    }
  }
  if (disposition === 'close' && laid.login) {
    await sleep(2_000);
    result.login = confined.settleCopy(laid.login, paths.dir) ?? 'unchanged, removed';
  } else if (laid.login) result.login = `kept with the retained pane: settle it after a person closes the pane (${laid.login.copy})`;
  if (dry) spawnSync('herdr', ['--session', DRY_HERDR_SESSION, 'server', 'stop'], { env: { ...process.env, ...herdrEnv }, stdio: 'ignore' });
  writeJson(path.join(paths.dir, 'result.json'), result);
  say(`${probe.id}: ${JSON.stringify(result.verdict ?? { ready: false })}; latency ${result.turn?.latencyMs ?? '-'} ms; nudge carried by ${result.turn?.carriedBy ?? '-'}; pane ${disposition}; ${path.join(paths.dir, 'result.json')}`);
  if (result.login?.stop) die(`${result.login.stop}: ${result.login.aside}`);
}

// ---------------------------------------------------------------- plan and report

function cmdPlan() {
  say(`# V7f part A: interactive wake probes (${wake.sessionsStarted()} sessions of the owner's 10)\n`);
  for (const probe of wake.PROBES) {
    const pane = probe.sessions ? wake.paneOf(probe) : null;
    say(`## ${probe.id} (${probe.cli}${probe.channel ? `, ${probe.channel}` : ''})`);
    say(`- Question: ${probe.question}`);
    say(`- Expected: ${probe.expected}`);
    say(`- Stop: ${probe.stop}`);
    if (probe.replaces) say(`- Replaces: ${probe.replaces}`);
    say(pane ? `- Pane: key ${pane.key}, group ${pane.group}, label "${pane.label}"` : `- Pane: none; reads ${probe.observes.join(', ')}`);
    if (pane) say(`- Dry: ${commandOf(probe, '--dry')}\n- Real: ${commandOf(probe, '--watched')}`);
    say('');
  }
}

function cmdReport(dry) {
  const base = baseOf(dry);
  const results = wake.PROBES.filter((p) => p.sessions).map((p) => path.join(base, p.id, 'result.json')).filter((f) => fs.existsSync(f)).map(readJson);
  say('| Probe | Fired | Turn started | Latency ms | Nudge carried by | Dialog | Focus changed | Offered | Meets the bar |\n|---|---|---|---|---|---|---|---|---|');
  for (const r of results) say(`| ${r.probe} | ${r.fired?.ok ?? '-'} | ${r.verdict?.started ?? '-'} | ${r.turn?.latencyMs ?? '-'} | ${r.turn?.carriedBy ?? '-'} | ${r.verdict?.dialog ?? 'none'} | ${r.verdict?.focusChanged ?? '-'} | ${r.offered ?? '-'} | ${r.verdict?.meetsBar ?? '-'} |`);
  say('\nW4 (Claude Code presence at the fire):');
  for (const r of results.filter((x) => x.cli === 'claude')) say(`- ${r.probe}: ${wake.statusAt(r.presence ?? [], r.fired?.at ?? 0) ?? '-'} at the fire; statuses seen ${[...new Set((r.presence ?? []).map((s) => s.status).filter(Boolean))].join(', ')}`);
  say('\nW8 (Codex presence): the hook events and the rollout\'s task_started/task_complete; no session file.');
}

const [command, ...rest] = process.argv.slice(2);
if (process.argv[1] === SCRIPT) {
  const flag = (name) => rest.includes(name);
  if (command === 'plan') cmdPlan();
  else if (command === 'run') await cmdRun(rest[0], { dry: flag('--dry'), watched: flag('--watched'), keep: flag('--keep') });
  else if (command === 'report') cmdReport(flag('--dry'));
  else die('usage: plan | run <W1|W2|W3|W5|W6|W7|W9|W10> [--dry | --watched] [--keep] | report [--dry]', 2);
}

