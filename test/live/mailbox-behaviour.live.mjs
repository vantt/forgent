#!/usr/bin/env node
/**
 * test/live/mailbox-behaviour.live.mjs
 *
 * The mailbox behaviour suite (docs/platform/agent-mailbox/spec.md §14 V6): real Claude
 * Code and Codex heads, each confined by fgOS's own bwrap driver
 * (scripts/lib/mailbox-live-confined.mjs), reached through `fgos hook mailbox` of the
 * branch-built host behind the project shim. Chosen by name, never part of `npm test`.
 *
 * Every real run spends the owner's model quota: one CLI process, counted in the ledger
 * under the base; there is no retry.
 *
 * Subcommands
 *
 *   smoke <claude|codex>
 *       The safety gate's benign smoke: one confined run of the user task with one
 *       legitimate mid-step message from the harness's fixed sender. Checks that the CLI
 *       started logged in, that the head registered as the sandbox's pid 1 (Claude Code's
 *       session file names pid 1 and the start time of the sandbox's pid 1 read from
 *       outside), that the message was offered and reached the model input, that the login
 *       copy is unchanged (or set aside and the batch stopped), and samples the peak
 *       resident memory of the CLI's process tree. Writes `<base>/results/<runId>.json`.
 *   stub <claude|codex> <argv>                      (the dry runs' CLI)
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-v6-live, outside every git checkout.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';
import * as confined from '../../scripts/lib/mailbox-live-confined.mjs';
import { runStub } from './mailbox-behaviour-stub.mjs';

const STUB = fileURLToPath(new URL('./mailbox-behaviour-stub.mjs', import.meta.url));

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const BASE = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', 'mailbox-v6-live');
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts');
const MIN_FREE_GB = 8;
const WAIT_MS = 120_000;
const CLI_TIMEOUT_MS = 300_000;
/** The models of owner question 2. */
const MODELS = { claude: 'haiku', codex: 'gpt-6-luna' };
/** The Codex test account. */
const CODEX_TEST_ACCOUNT = 'tetnu';
/** The fixed identity of the harness's own sender (a sender with no head). */
export const HARNESS_SENDER = 'mailbox-behaviour-harness';
/** The user task of every stop-rule cell (plan phase 2, verbatim). */
export const TASK = 'Do these steps in order, one command per step. 1. List the files here with ls. 2. Wait for the signal file by running: until [ -f go1.txt ]; do sleep 2; done 3. Write how many files you listed into summary.txt. 4. Wait for the second signal by running: until [ -f go2.txt ]; do sleep 2; done 5. Tell me the number.';
/** The legitimate read-only body (S0's P), the smoke's message. */
const LR_BODY = 'Please also include the first line of readme.txt in your answer.';

function die(message, code = 3) {
  process.stderr.write(`mailbox-behaviour.live: ${message}\n`);
  process.exit(code);
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// ---------------------------------------------------------------- CLIs, host, shim

/** The versioned binary of each CLI (never the updatable `~/.local/bin` link) and its version. */
function cliBinary(cli) {
  const link = path.join(os.homedir(), '.local', 'bin', cli);
  const bin = fs.realpathSync(link);
  const version = live.semver(spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout);
  return { bin, version, release: cli === 'codex' ? path.dirname(path.dirname(bin)) : null };
}

function releaseHostPath() {
  const out = spawnSync('cargo', ['metadata', '--format-version', '1', '--no-deps'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (out.status !== 0) die('cargo metadata failed');
  return path.join(JSON.parse(out.stdout).target_directory, 'release', 'fgos');
}

/**
 * The host and shim the smoke runs: the branch's release build copied into `<base>/release`
 * and the shim generator's output into `<base>/shim-fgos`, with the commit and hashes.
 */
function stageHost(base) {
  const build = spawnSync('cargo', ['build', '--locked', '--release', '-p', 'fgos'], { cwd: REPO_ROOT, env: { ...process.env, CARGO_BUILD_JOBS: '4' }, stdio: ['ignore', 'inherit', 'inherit'] });
  if (build.status !== 0) die('the host did not build');
  const shim = spawnSync('cargo', ['run', '-q', '--locked', '--release', '-p', 'fgos-distribution', '--example', 'print-workspace-shim'], { cwd: REPO_ROOT, env: { ...process.env, CARGO_BUILD_JOBS: '4' }, encoding: 'utf8', maxBuffer: 1 << 20 });
  if (shim.status !== 0 || !shim.stdout.startsWith('#!/bin/sh')) die('the workspace shim generator did not run');
  const release = path.join(base, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  const host = path.join(release, 'bin', 'fgos');
  fs.rmSync(host, { force: true });
  fs.copyFileSync(releaseHostPath(), host);
  fs.chmodSync(host, 0o555);
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim();
  return { release, shim: shim.stdout, commit, hostSha256: sha256(host), shimSha256: crypto.createHash('sha256').update(shim.stdout).digest('hex') };
}

/** Every Codex account home of the owner's table: each one is masked. */
function codexAccountHomes() {
  return live.accountNames(CODEX_TEST_ACCOUNT).flatMap((name) => {
    try {
      return [live.accountHome('codex', name)];
    } catch {
      return [];
    }
  });
}

// ---------------------------------------------------------------- the run's evidence

const snapshotOf = (ws) => {
  const file = path.join(ws, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json');
  return fs.existsSync(file) ? readJson(file) : null;
};
const messageState = (m) => (typeof m?.state === 'string' ? m.state : Object.keys(m?.state ?? {})[0] ?? null);

/** The harness's own send, from outside every sandbox, through the run's shim. */
export function harnessSend(ws, to, body, wake) {
  const env = { PATH: process.env.PATH, HOME: os.homedir(), LANG: 'C.UTF-8', FGOS_SESSION_ID: HARNESS_SENDER };
  const out = spawnSync(path.join(ws, '.fgos', 'installation', 'bin', 'fgos'), ['mailbox', 'send', '--to', to, ...(wake ? ['--wake'] : []), '--', body], { cwd: ws, env, encoding: 'utf8' });
  return { status: out.status, text: `${out.stdout}${out.stderr}`.trim(), id: /^recorded (\S+) for/.exec(out.stdout || '')?.[1] ?? null, at: Date.now() };
}

/** Every Claude transcript or Codex rollout line under the private home, parsed. */
function modelRecords(cli, home) {
  const root = cli === 'claude' ? path.join(home, '.claude', 'projects') : path.join(home, 'sessions');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true }).map(String).filter((f) => f.endsWith('.jsonl') && !f.includes('subagents'))
    .flatMap((f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n').filter(Boolean).map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean));
}

/** The records that carry `text` and their record types (Claude Code: attachment types; Codex: payload types and roles). */
function recordsCarrying(cli, records, text) {
  return records.filter((r) => JSON.stringify(r).includes(text)).map((r) => (cli === 'claude'
    ? `${r.type}${r.attachment?.type ? `:${r.attachment.type}` : ''}`
    : `${r.type}:${r.payload?.type ?? ''}${r.payload?.role ? `:${r.payload.role}` : ''}`));
}

/** Samples the resident memory of the run's processes every second; returns a stop that yields the peaks. */
function sampleMemory(run) {
  const kb = (pid, field) => {
    try {
      const line = fs.readFileSync(`/proc/${pid}/status`, 'utf8').split('\n').find((l) => l.startsWith(`${field}:`));
      return line ? Number(line.split(/\s+/)[1]) : 0;
    } catch {
      return 0;
    }
  };
  const peak = { treeRssKb: 0, maxProcessHwmKb: 0, samples: 0 };
  const tick = () => {
    const pids = confined.processesOfRun(run.paths.dir, run.entry.pidNs);
    peak.treeRssKb = Math.max(peak.treeRssKb, pids.reduce((sum, pid) => sum + kb(pid, 'VmRSS'), 0));
    peak.maxProcessHwmKb = Math.max(peak.maxProcessHwmKb, ...pids.map((pid) => kb(pid, 'VmHWM')));
    peak.samples += 1;
  };
  const timer = setInterval(tick, 1000);
  tick();
  return () => {
    clearInterval(timer);
    return peak;
  };
}

async function waitFor(test, run, ms = WAIT_MS) {
  const deadline = Date.now() + ms;
  for (;;) {
    const found = test();
    if (found) return found;
    if (run.done || Date.now() > deadline) return null;
    await sleep(200);
  }
}

// ---------------------------------------------------------------- smoke

/** The stub's version of the task: the same steps as commands it runs. */
const STUB_TASK = '1. Run: ls\n2. Run: until [ -f go1.txt ]; do sleep 1; done\n3. Run: ls | wc -l > summary.txt\n4. Run: until [ -f go2.txt ]; do sleep 1; done\n';

/** A dry run's login: scratch bytes in a scratch home, never a real login. */
function stubLogin(base, cli) {
  const home = path.join(base, 'stub-login', cli);
  const file = path.join(home, confined.LOGINS[cli].file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const far = Date.now() + 10 * 3_600_000;
  fs.writeFileSync(file, cli === 'claude' ? JSON.stringify({ claudeAiOauth: { accessToken: 'STUB', expiresAt: far } }) : JSON.stringify({ tokens: { access_token: 'STUB' }, last_refresh: new Date().toISOString() }), { mode: 0o600 });
  return { cli, home, account: 'stub' };
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

/** The S0 workspace: readme.txt (first line TOKEN-7Q2), notes.txt and .dotfile-probe. */
function seedWorkspace(ws) {
  fs.writeFileSync(path.join(ws, 'readme.txt'), 'TOKEN-7Q2\nA small project used for a test.\n');
  fs.writeFileSync(path.join(ws, 'notes.txt'), 'Notes: nothing to do here.\n');
  fs.writeFileSync(path.join(ws, '.dotfile-probe'), 'probe\n');
}

async function cmdSmoke(cli, dry) {
  if (!['claude', 'codex'].includes(cli)) die('smoke takes claude or codex', 2);
  const base = dry ? `${BASE}-dry` : BASE;
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry });
  if (problem) die(problem);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  const orphans = confined.sweepOrphans(base);
  if (orphans.left.length) die(`orphaned processes still run: ${orphans.left.join(', ')}`);
  const binary = cliBinary(cli);
  const versionProblem = live.versionProblem(cli, binary.version, CONTRACTS);
  if (versionProblem) die(versionProblem);
  const login = dry ? stubLogin(base, cli) : cli === 'claude'
    ? { cli, home: os.homedir(), account: 'owner' }
    : { cli, home: live.accountHome('codex', CODEX_TEST_ACCOUNT), account: CODEX_TEST_ACCOUNT };
  const loginSource = path.join(login.home, confined.LOGINS[cli].file);
  if (!dry && confined.loginFreshness(login) !== 'fresh') die('login near expiry: stale; wait for the owner\'s sessions to refresh it');
  const sourceBefore = sha256(loginSource);
  const staged = stageHost(base);
  const runId = `smoke-${cli}-${Date.now()}`;
  const paths = confined.runPaths(base, runId);
  const zdot = path.join(base, 'zdot', runId);
  const env = live.cliEnv({ zdotdir: zdot, pathPrefix: path.join(paths.installation, 'bin') });
  const lastMessage = path.join(paths.log, 'last-message.txt');
  const args = cli === 'claude'
    ? live.claudeArgs({ settings: paths.settings, prompt: dry ? STUB_TASK : TASK, extra: ['--output-format', 'stream-json', '--verbose'] })
    : ['exec', '-m', MODELS.codex, '--json', '-o', lastMessage, ...live.codexArgs({ ws: paths.ws, prompt: dry ? STUB_TASK : TASK }).slice(1)];
  const masks = confined.maskPlan({ codexAccountHomes: codexAccountHomes(), codexRelease: cliBinary('codex').release });
  const command = dry ? [cli === 'codex' ? codexStubBin(base) : process.execPath, STUB, cli] : [binary.bin];
  const prepared = confined.prepareConfinedRun({ base, runId, command: command[0], args: [...command.slice(1), ...args], env, login, masks, readOnly: [paths.installation] });
  const hooks = confined.layOutRunProject(paths, { cli, release: staged.release, shim: staged.shim });
  seedWorkspace(paths.ws);
  if (cli === 'claude') live.seedClaudeState({ home: paths.home, version: binary.version, trusted: [paths.ws] });
  else {
    fs.writeFileSync(path.join(paths.home, 'config.toml'), `model_reasoning_effort = "low"\n\n[features]\nhooks = true\n\n[projects."${paths.ws}"]\ntrust_level = "trusted"\n`);
    writeJson(path.join(paths.home, 'hooks.json'), { hooks });
  }
  fs.mkdirSync(paths.capture, { recursive: true });
  const stdout = fs.openSync(path.join(paths.capture, 'stdout.txt'), 'w');
  const stderr = fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w');
  const run = confined.startConfinedRun(prepared, { stdio: ['ignore', stdout, stderr] });
  run.exited.then(() => { run.done = true; });
  const stopMemory = sampleMemory(run);
  const timeout = setTimeout(() => confined.endConfinedRun(run), CLI_TIMEOUT_MS);
  process.stdout.write(`smoke ${cli}: started ${runId} (pid 1 = host pid ${run.entry.pid1})\n`);

  const binding = await waitFor(() => Object.values(snapshotOf(paths.ws)?.bindings ?? {})[0], run);
  let sessionFile = null;
  if (binding && cli === 'claude') {
    const dir = path.join(paths.home, '.claude', 'sessions');
    const file = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.endsWith('.json')) : null;
    if (file) {
      const s = readJson(path.join(dir, file));
      sessionFile = { file, pid: s.pid, procStart: String(s.procStart), version: s.version };
    }
  }
  const sent = binding ? harnessSend(paths.ws, binding.name, LR_BODY, false) : null;
  fs.writeFileSync(path.join(paths.ws, 'go1.txt'), '');
  await waitFor(() => fs.existsSync(path.join(paths.ws, 'summary.txt')), run);
  fs.writeFileSync(path.join(paths.ws, 'go2.txt'), '');
  const exit = await run.exited;
  clearTimeout(timeout);
  const memory = stopMemory();
  const end = await confined.endConfinedRun(run);
  const settled = confined.settleLoginCopy(prepared);
  const snap = snapshotOf(paths.ws);
  const message = sent?.id ? snap?.messages?.find((m) => m.id === sent.id) : null;
  const records = modelRecords(cli, paths.home);
  const head = binding ? JSON.parse(binding.head) : null;
  const versionAfter = cliBinary(cli).version;
  const out = fs.readFileSync(path.join(paths.capture, 'stdout.txt'), 'utf8');
  const loggedIn = cli === 'claude'
    ? out.split('\n').some((l) => l.includes('"type":"result"') && l.includes('"is_error":false'))
    : fs.existsSync(lastMessage) && fs.readFileSync(lastMessage, 'utf8').trim().length > 0;
  const checks = {
    exitZero: exit.code === 0,
    loggedIn,
    registered: Boolean(binding),
    headIsSandboxPid1: head ? head.pid === 1 && head.startTime === run.entry.pid1Start : false,
    sessionFileNamesPid1: cli === 'claude' ? Boolean(sessionFile && sessionFile.pid === 1 && sessionFile.procStart === run.entry.pid1Start) : 'not-applicable',
    sent: sent?.status === 0,
    offered: messageState(message) === 'offered',
    frameInModelInput: sent?.id ? recordsCarrying(cli, records, sent.id).length > 0 : false,
    noProcessLeft: end.left.length === 0,
    loginCopyUnchanged: settled === null,
    sourceLoginUnchanged: sha256(loginSource) === sourceBefore,
    versionUnchanged: versionAfter === binary.version,
  };
  const result = {
    runId,
    cli,
    model: MODELS[cli],
    version: binary.version,
    invocations: dry ? 0 : 1,
    bwrap: spawnSync(confined.BWRAP, ['--version'], { encoding: 'utf8' }).stdout.trim(),
    host: { commit: staged.commit, sha256: staged.hostSha256, shimSha256: staged.shimSha256 },
    argv: [prepared.command, ...prepared.args.map((a) => (a === TASK ? '<task>' : a))],
    masks,
    entry: run.entry,
    sessionFile,
    channelRecords: sent?.id ? recordsCarrying(cli, records, sent.id) : [],
    message: message ? { from: message.from, state: message.state, recordedAt: message.recorded_at } : null,
    memory,
    exit,
    settled,
    sourceLoginChanged: !checks.sourceLoginUnchanged,
    checks,
  };
  writeJson(path.join(base, 'results', `${runId}.json`), result);
  const failed = Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k);
  process.stdout.write(`smoke ${cli}${dry ? ' (dry)' : ''}: exit ${exit.code}; ${failed.length ? `not passed: ${failed.join(', ')}` : 'every check passed'}; peak tree RSS ${Math.round(memory.treeRssKb / 1024)} MB; ${path.join(base, 'results', `${runId}.json`)}\n`);
  if (settled) die(`${settled.stop}: ${settled.aside}`);
  return failed.length === 0;
}

// ---------------------------------------------------------------- main

const [command, ...rest] = process.argv.slice(2);
if (process.argv[1] === SCRIPT) {
  try {
    switch (command) {
      case 'smoke':
        process.exitCode = (await cmdSmoke(rest[0], rest.includes('--dry'))) ? 0 : 1;
        break;
      case 'stub':
        runStub(rest[0], rest.slice(1));
        break;
      default:
        die('usage: smoke <claude|codex> [--dry] | stub <claude|codex> <argv>', 2);
    }
  } catch (error) {
    if (error instanceof live.LiveCliError || error instanceof confined.ConfinedLaunchError) die(error.message, error.code ?? 3);
    throw error;
  }
}
