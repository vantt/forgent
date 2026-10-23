#!/usr/bin/env node
/**
 * test/live/mailbox-behaviour.live.mjs
 *
 * The mailbox behaviour suite (docs/platform/agent-mailbox/spec.md §14 V6): real Claude
 * Code and Codex heads, each confined by fgOS's own bwrap driver
 * (scripts/lib/mailbox-live-confined.mjs), reached through `fgos hook mailbox` of the
 * branch-built host behind the project shim; the run logic is
 * scripts/lib/mailbox-behaviour-run.mjs and the pre-registered scoring
 * scripts/lib/mailbox-behaviour-score.mjs. Chosen by name, never part of `npm test`.
 *
 * Every real run spends the owner's model quota: one CLI process, one ledger entry under the
 * base, never retried; the ledger is checked against the approved ceiling before each start.
 * Real runs (`run-cell`, `run-stage`, `run-loop` without `--dry`) start only from the pinned
 * worktree `pin` made, against an unchanged pin and freeze.
 *
 * Subcommands
 *
 *   check                 no model: memory, tested versions, the freeze, the pin when one
 *                         exists, and the wiring runs against stubs under the confined launch
 *                         through the real shim (exit 3 on any failure)
 *   freeze                writes preregistration.json once
 *   freeze-loop           writes the loop test's addendum once (its own file and hash)
 *   pin                   a detached worktree of HEAD, its own release build of the host and
 *                         the shim, and `<base>/pin.json`
 *   smoke <claude|codex> [--dry]   the safety gate's benign smoke (one run, LR on PT, no
 *                         receiver instruction)
 *   run-cell <cli> <variant> <channel|base> [--dry] [--behaviour <stub behaviour>]
 *   run-stage <A|B> [--cli <claude|codex>] [--dry]   (--cli: only that CLI's cells)
 *   run-loop <config|pair|all> [--dry]
 *   report [--stage A|B] [--sample] [--dry] [--compare <V6 results.jsonl>]
 *   stub <claude|codex> <argv>     the dry runs' CLI
 *
 * `--addendum <name>` (V7c: `v7c`) runs a pre-registered addendum to V6
 * (scripts/lib/mailbox-behaviour-v7.mjs): `freeze <name>` writes it once; `check`, `pin`,
 * `smoke codex`, `run-stage` and `report` then use its home, cells, model, reasoning effort,
 * arms, scoring and stop rules, and never write V6's home.
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-v6-live, or mailbox-<addendum>-live
 * (`-dry` for dry runs), outside every git checkout; results go to `<base>/results.jsonl` and
 * `<base>/loop-results.jsonl`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';
import * as confined from '../../scripts/lib/mailbox-live-confined.mjs';
import * as score from '../../scripts/lib/mailbox-behaviour-score.mjs';
import * as runs from '../../scripts/lib/mailbox-behaviour-run.mjs';
import * as v7 from '../../scripts/lib/mailbox-behaviour-v7.mjs';
import { runStub } from './mailbox-behaviour-stub.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const STUB = fileURLToPath(new URL('./mailbox-behaviour-stub.mjs', import.meta.url));
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const TMP = process.env.TMPDIR || '/tmp';
const WORKTREES = path.join(path.dirname(REPO_ROOT), 'forgent-worktrees');
/** The addendum this invocation runs (null: V6 itself). */
const ADDENDUM_NAME = (() => {
  const argv = process.argv.slice(2);
  return argv.includes('--addendum') ? argv[argv.indexOf('--addendum') + 1] : null;
})();
const HOME_OF = v7.homeOf(TMP, ADDENDUM_NAME, WORKTREES);
const BASE = HOME_OF.base;
const ADDENDUM = ADDENDUM_NAME ? path.join(REPO_ROOT, v7.addendumFile(ADDENDUM_NAME)) : null;
/** An addendum's harness writes only into its own home. */
const own = (target) => (ADDENDUM_NAME ? v7.refuseV6Home(target, TMP, WORKTREES) : target);
/** The pinned worktree of commit `commit` (one per pin, so a later pin never moves a running stage's worktree). */
const pinnedWorktree = (commit) => `${HOME_OF.pinnedPrefix}${commit.slice(0, 9)}`;
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts');
const DATA = path.join(REPO_ROOT, 'test', 'live', 'mailbox-behaviour');
const PREREGISTRATION = path.join(DATA, 'preregistration.json');
/** The loop test's addendum, outside the frozen data directory: its own file, its own hash. */
const LOOP_ADDENDUM = path.join(REPO_ROOT, 'test', 'live', 'mailbox-behaviour.loop-addendum.json');
const MIN_FREE_GB = 8;
const MEMORY_WAIT_MS = 30 * 60_000;
const PROVIDER_PAUSE_MS = 20 * 60_000;
const CODEX_TEST_ACCOUNT = 'tetnu';
/** V6's Codex reasoning effort, named (it was the config V6's runs wrote). */
const V6_CODEX_EFFORT = 'low';

/** The frozen addendum, refused unless it binds V6's pre-registration and matches what this code would freeze. */
function readAddendum() {
  if (!ADDENDUM) return null;
  if (!fs.existsSync(ADDENDUM)) die(`no addendum ${ADDENDUM_NAME}; run freeze ${ADDENDUM_NAME} first`);
  const frozen = readJson(ADDENDUM);
  if (frozen.addendumTo.sha256 !== sha256(PREREGISTRATION)) die('the addendum does not bind the current pre-registration');
  const problems = v7.addendumProblems(frozen, v7.addendumV7c({ repo: REPO_ROOT, preregistrationSha256: sha256(PREREGISTRATION), versions: frozen.versions, seed: frozen.seed }));
  if (problems.length) die(`the addendum does not match the runner (${problems.join(', ')}); a change is a new measurement`);
  return frozen;
}

/** The frozen files that broke their freeze: V6's set, or V6's set with the addendum's overrides. */
const freezeBroken = (frozen) => (ADDENDUM ? v7.freezeBroken(REPO_ROOT, frozen, readJson(ADDENDUM)) : score.freezeBroken(REPO_ROOT, frozen));

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
const say = (text) => process.stdout.write(`${text}\n`);

// ---------------------------------------------------------------- data, CLIs, host

/** The frozen data the runs read. */
function readData() {
  const read = (rel) => fs.readFileSync(path.join(DATA, rel), 'utf8');
  const listed = (dir) => Object.fromEntries(fs.readdirSync(path.join(DATA, dir)).filter((f) => f.endsWith('.txt') && f !== 'README.txt').map((f) => [f.replace(/\.txt$/, ''), read(path.join(dir, f))]));
  return { task: read('task.txt').trimEnd(), instruction: read('receiver-instruction.txt'), bodies: listed('bodies'), scenarios: listed('scenarios'), sideWork: read('side-work.txt') };
}

/** The versioned binary of each CLI (never the updatable `~/.local/bin` link) and its version. */
function cliBinary(cli) {
  const bin = fs.realpathSync(path.join(os.homedir(), '.local', 'bin', cli));
  const version = live.semver(spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout);
  return { bin, version, release: cli === 'codex' ? path.dirname(path.dirname(bin)) : null };
}

/** Builds the host and the shim of the checkout at `root` into `target`; copies them into `release`. */
function buildHost(root, target, release) {
  const env = { ...process.env, CARGO_BUILD_JOBS: '4', CARGO_TARGET_DIR: target };
  const build = spawnSync('cargo', ['build', '--locked', '--release', '-p', 'fgos'], { cwd: root, env, stdio: ['ignore', 'inherit', 'inherit'] });
  if (build.status !== 0) die('the host did not build');
  const shim = spawnSync('cargo', ['run', '-q', '--locked', '--release', '-p', 'fgos-distribution', '--example', 'print-workspace-shim'], { cwd: root, env, encoding: 'utf8', maxBuffer: 1 << 20, stdio: ['ignore', 'pipe', 'inherit'] });
  if (shim.status !== 0 || !shim.stdout.startsWith('#!/bin/sh')) die('the workspace shim generator did not run');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  const host = path.join(release, 'bin', 'fgos');
  fs.rmSync(host, { force: true });
  fs.copyFileSync(path.join(target, 'release', 'fgos'), host);
  fs.chmodSync(host, 0o555);
  const shimFile = path.join(release, 'shim-fgos');
  fs.rmSync(shimFile, { force: true });
  fs.writeFileSync(shimFile, shim.stdout, { mode: 0o444 });
  return { host, shimFile };
}

function targetDir(root) {
  const out = spawnSync('cargo', ['metadata', '--format-version', '1', '--no-deps'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (out.status !== 0) die('cargo metadata failed');
  return JSON.parse(out.stdout).target_directory;
}

const headCommit = (root) => spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();

/**
 * The allow-list of a run's view of the home (scripts/lib/mailbox-live-confined.mjs
 * `maskPlan`): the pinned Codex release, the pinned Claude Code binary and the Node install
 * the dry runs' stub executes, and for a dry run the stub itself. Nothing else under the home.
 */
function confinedMasks(dry) {
  const allow = [cliBinary('codex').release, cliBinary('claude').bin, path.dirname(path.dirname(process.execPath)), ...(dry ? [STUB] : [])];
  return confined.maskPlan({ allow });
}

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

// ---------------------------------------------------------------- the run context

const pinFile = (base) => path.join(base, 'pin.json');

/** Why a real run may not start now: the pin, the freeze, the worktree. */
function pinState(base) {
  if (!fs.existsSync(pinFile(base))) return { problems: ['no pin; run pin first'] };
  const pin = readJson(pinFile(base));
  const problems = [];
  if (REPO_ROOT !== pin.worktree) problems.push(`real runs start from the pinned worktree ${pin.worktree}, not ${REPO_ROOT}`);
  if (headCommit(REPO_ROOT) !== pin.commit) problems.push(`the worktree is at ${headCommit(REPO_ROOT)}, pinned ${pin.commit}`);
  const clis = { claude: cliBinary('claude'), codex: cliBinary('codex') };
  problems.push(...runs.pinProblems(pin, {
    hostSha256: fs.existsSync(pin.host.path) ? sha256(pin.host.path) : null,
    shimSha256: fs.existsSync(pin.shim.path) ? sha256(pin.shim.path) : null,
    clis: Object.fromEntries(Object.entries(clis).map(([k, v]) => [k, { bin: v.bin, version: v.version }])),
    preregistrationSha256: sha256(PREREGISTRATION),
    freezeBroken: freezeBroken(readJson(PREREGISTRATION)),
  }));
  if (ADDENDUM && pin.addendumSha256 !== sha256(ADDENDUM)) problems.push('the addendum changed since the pin');
  return { pin, problems };
}

/**
 * The context of runs: for a dry run the branch's host and the stub CLIs under
 * `<base>-dry`; for a real run the pinned host and CLIs, the owner's Claude login and the
 * Codex test account, refused unless the pin and the freeze hold.
 */
function context({ dry, stage = null }) {
  const base = own(dry ? `${BASE}-dry` : BASE);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  if (!fs.existsSync(PREREGISTRATION)) die('no pre-registration; run freeze first');
  const addendum = readAddendum();
  const broken = freezeBroken(readJson(PREREGISTRATION));
  if (broken.length) die(`frozen files changed: ${broken.join(', ')}`);
  const masks = confinedMasks(dry);
  const windowSec = readJson(path.join(CONTRACTS, 'limits.v1.json')).keys.find((k) => k.key === 'mailbox.human.fallbackWindowSec').default;
  const needle = v7.pointerNeedle(REPO_ROOT);
  const measured = addendum ? {
    addendum: addendum.name,
    models: { ...score.MODELS, codex: addendum.model },
    effort: addendum.modelReasoningEffort,
    stageARuns: addendum.stageARuns,
    projectConfig: (cell) => v7.ARMS[cell.arm].config,
    scoreRun: (evidence) => v7.scoreRun({ ...evidence, needle }),
    rules: v7.stopRules,
    phases: v7.stagePhases,
    order: v7.stageOrder,
  } : { effort: V6_CODEX_EFFORT };
  const common = { base, stage, dry, data: readData(), masks, windowSec, resultsFile: path.join(base, 'results.jsonl'), loopResultsFile: path.join(base, 'loop-results.jsonl'), log: say, ...measured };
  if (dry) {
    const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
    return {
      ...common,
      release: path.dirname(path.dirname(host)),
      shim: fs.readFileSync(shimFile, 'utf8'),
      cliBin: { claude: [process.execPath, STUB, 'claude'], codex: [codexStubBin(base), STUB, 'codex'] },
      versions: { claude: 'stub', codex: 'stub' },
      login: { claude: stubLogin(base, 'claude'), codex: stubLogin(base, 'codex') },
      hostSha256: sha256(host),
      beforeRun: async () => live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true }),
      providerPause: async () => {},
    };
  }
  const { pin, problems } = pinState(base);
  if (problems.length) die(problems.join('; '));
  const login = { claude: { cli: 'claude', home: os.homedir(), account: 'owner' }, codex: { cli: 'codex', home: live.accountHome('codex', CODEX_TEST_ACCOUNT), account: CODEX_TEST_ACCOUNT } };
  const sentinels = runs.plantSentinels(base, own(HOME_OF.sentinels));
  const ctx = {
    ...common,
    hostSha256: pin.host.sha256,
    release: path.dirname(path.dirname(pin.host.path)),
    shim: fs.readFileSync(pin.shim.path, 'utf8'),
    cliBin: { claude: [pin.clis.claude.bin], codex: [pin.clis.codex.bin] },
    versions: { claude: pin.clis.claude.version, codex: pin.clis.codex.version },
    login,
    providerPause: async () => {
      say(`${new Date().toISOString()} waiting: provider limit, pausing ${PROVIDER_PAUSE_MS / 60_000} minutes`);
      await sleep(PROVIDER_PAUSE_MS);
    },
  };
  ctx.beforeRun = async (cell) => {
    const stillPinned = pinState(base).problems;
    if (stillPinned.length) return `pins: ${stillPinned.join('; ')}`;
    const ceiling = runs.ceilingProblem(base, ctx.addendum ? readJson(ADDENDUM).ceiling : score.CEILING);
    if (ceiling) return `ceiling: ${ceiling}`;
    const changed = runs.sentinelsChanged(sentinels);
    const tracked = spawnSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim();
    if (changed.length || tracked) return `safety: ${[...changed, ...(tracked ? ['tracked files of the pinned worktree'] : [])].join(', ')} changed`;
    for (const waited = Date.now(); ;) {
      const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB });
      if (!problem) break;
      if (Date.now() - waited > MEMORY_WAIT_MS) return `memory: ${problem}`;
      say(`${new Date().toISOString()} waiting: memory (${problem})`);
      await sleep(60_000);
    }
    const cliLogin = login[cell?.cli ?? 'claude'];
    if (confined.loginFreshness(cliLogin) !== 'fresh') say(`${new Date().toISOString()} waiting: the ${cliLogin.cli} login is near expiry; its owner's sessions refresh it`);
    try {
      await confined.waitForFreshLogin(cliLogin);
    } catch (error) {
      return `login: ${error.message}`;
    }
    return null;
  };
  return ctx;
}

/** At every harness start: no orphan left, and every unfinished ledger entry recorded `error`. */
function recover(ctx) {
  const { appended, left, asides, unsettled } = runs.recoverLedger(ctx.base, ctx.resultsFile);
  for (const line of appended) say(`${line.runId}: recorded error (${line.error})`);
  if (asides.length) say(asides.map((a) => `${a.runId}: ${a.stop}: ${a.aside}`).join('; '));
  if (unsettled.length) die(`login copies left unsettled: ${unsettled.map((u) => `${u.runId} ${u.copy} (${u.reason})`).join('; ')}`);
  if (left.length) die(`orphaned processes still run: ${left.join(', ')}`);
  if (asides.length) die('a login copy was set aside; ask the owner');
}

// ---------------------------------------------------------------- freeze and pin

function cmdFreeze(name) {
  if (name) {
    if (name !== ADDENDUM_NAME) die(`freeze ${name} takes --addendum ${name}`, 2);
    const versions = { codex: cliBinary('codex').version };
    const notTested = live.versionProblem('codex', versions.codex, CONTRACTS);
    if (notTested) die(notTested);
    try {
      v7.writeOnce(ADDENDUM, v7.addendumV7c({ repo: REPO_ROOT, preregistrationSha256: sha256(PREREGISTRATION), versions, seed: crypto.randomBytes(8).toString('hex') }));
    } catch (error) {
      die(error.message);
    }
    say(`frozen the ${name} addendum; sha256 ${sha256(ADDENDUM)}`);
    return;
  }
  if (fs.existsSync(PREREGISTRATION)) die(`${PREREGISTRATION} exists; the pre-registration is frozen once, and a change is a new measurement`);
  const versions = { claude: cliBinary('claude').version, codex: cliBinary('codex').version };
  const frozen = score.preregistration({ repo: REPO_ROOT, versions, seed: crypto.randomBytes(8).toString('hex') });
  writeJson(PREREGISTRATION, frozen);
  say(`frozen ${Object.keys(frozen.files).length} files; sha256 of the pre-registration ${sha256(PREREGISTRATION)}`);
}

/** Writes the loop test's addendum once, bound to the pre-registration's hash. */
function cmdFreezeLoop() {
  if (fs.existsSync(LOOP_ADDENDUM)) die(`${LOOP_ADDENDUM} exists; the addendum is frozen once`);
  writeJson(LOOP_ADDENDUM, runs.loopAddendum(sha256(PREREGISTRATION)));
  say(`frozen the loop addendum; sha256 ${sha256(LOOP_ADDENDUM)}`);
}

/** A detached worktree of HEAD, its own release build of the host and shim, and the pin. */
function cmdPin() {
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true });
  if (problem) die(problem);
  if (spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim()) die('the checkout has uncommitted changes; pin a commit');
  const commit = headCommit(REPO_ROOT);
  const PINNED_WORKTREE = pinnedWorktree(commit);
  if (fs.existsSync(PINNED_WORKTREE)) die(`${PINNED_WORKTREE} exists; remove it with git worktree remove before pinning again`);
  if (ADDENDUM) readAddendum();
  const add = spawnSync('git', ['worktree', 'add', '--detach', PINNED_WORKTREE, commit], { cwd: REPO_ROOT, stdio: ['ignore', 'inherit', 'inherit'] });
  if (add.status !== 0) die('git worktree add failed');
  fs.mkdirSync(own(BASE), { recursive: true });
  const { host, shimFile } = buildHost(PINNED_WORKTREE, path.join(PINNED_WORKTREE, 'target'), path.join(BASE, 'pinned-release'));
  // A copy of each pinned host, named by its hash, so a later pin never loses the earlier binary.
  const kept = path.join(BASE, 'hosts', sha256(host));
  if (!fs.existsSync(kept)) {
    fs.mkdirSync(path.dirname(kept), { recursive: true });
    fs.copyFileSync(host, kept);
  }
  const clis = { claude: cliBinary('claude'), codex: cliBinary('codex') };
  const pin = runs.pinOf({
    commit,
    worktree: PINNED_WORKTREE,
    host,
    shim: shimFile,
    clis: Object.fromEntries(Object.entries(clis).map(([k, v]) => [k, { bin: v.bin, version: v.version }])),
    preregistration: path.join(PINNED_WORKTREE, 'test', 'live', 'mailbox-behaviour', 'preregistration.json'),
  });
  if (ADDENDUM) pin.addendumSha256 = sha256(path.join(PINNED_WORKTREE, v7.addendumFile(ADDENDUM_NAME)));
  writeJson(own(pinFile(BASE)), pin);
  say(`pinned ${commit} at ${PINNED_WORKTREE}; host ${pin.host.sha256}; shim ${pin.shim.sha256}; ${pinFile(BASE)}`);
}

// ---------------------------------------------------------------- runs

const cellOf = (cli, variant, channel) => (variant === score.BASELINE ? score.baselineCells() : score.cellTable()).find((c) => c.cli === cli && c.variant === variant && (c.channel ?? 'base') === channel);

async function cmdRunCell(cli, variant, channel, { dry, behaviour }) {
  const cell = cellOf(cli, variant, channel);
  if (!cell) die(`no cell ${cli} ${variant} ${channel}`, 2);
  const ctx = context({ dry, stage: 'single' });
  recover(ctx);
  const problem = await ctx.beforeRun(cell);
  if (problem) die(problem);
  const progress = runs.cellProgress(runs.readResults(ctx.resultsFile), cell.id);
  const { line, stop } = await runs.runOne({ ...ctx, stubBehaviour: dry ? behaviour : null }, cell, runs.runIdOf(cell, progress.next));
  say(`${line.runId}: ${line.outcome}${line.error ? ` (${line.error})` : ''}; channel ${line.channelSeen ?? '-'}`);
  if (stop) die(stop);
  return line;
}

async function cmdRunStage(stage, { dry, cli }) {
  if (!['A', 'B'].includes(stage)) die('run-stage takes A or B', 2);
  if (cli && !score.CLIS.includes(cli)) die(`--cli takes ${score.CLIS.join(' or ')}`, 2);
  const ctx = context({ dry, stage });
  recover(ctx);
  if (ADDENDUM && stage === 'B' && !dry) {
    const gate = v7.oracleProblem(path.join(ctx.base, 'sample-codex-A.md'));
    if (gate) die(`stage B waits: ${gate}`);
  }
  const { stop, closedSt, stoppedArms } = await runs.runStage({ ...ctx, stubBehaviour: dry ? 'ignore' : null, clis: cli ? [cli] : null }, stage);
  if (closedSt?.length) say(`ST cells closed after stage A for: ${closedSt.join(', ')}`);
  for (const [arm, why] of Object.entries(stoppedArms ?? {})) say(`arm ${arm} stopped: ${why}`);
  if (stop) die(`stage ${stage} stopped: ${stop}`);
  say(`stage ${stage}: every cell done`);
}

/** A dry loop's stub commands: aa messages bb, by the name it was given or the one the peer file holds; bb works long enough to see it. */
const dryLoopPrompt = (role, peer) => {
  if (role === 'bb') return '1. Run: ls\n2. Run: sleep 5\n3. Run: sleep 3';
  const hello = '--wake -- "MBX-LOOP-HELLO"';
  return peer
    ? `1. Run: fgos mailbox send --to ${peer} ${hello}\n2. Run: sleep 2\n3. Run: sleep 2`
    : `1. Run: ls\n2. Run: until [ -f ${runs.PEER_FILE} ]; do sleep 1; done; fgos mailbox send --to "$(cat ${runs.PEER_FILE})" ${hello}\n3. Run: sleep 2\n4. Run: sleep 2`;
};

async function cmdRunLoop(which, { dry }) {
  if (!dry) {
    if (!fs.existsSync(LOOP_ADDENDUM)) die('no loop addendum; run freeze-loop first');
    if (JSON.stringify(readJson(LOOP_ADDENDUM)) !== JSON.stringify(runs.loopAddendum(sha256(PREREGISTRATION)))) die('the loop addendum does not match the loop runner; a change is a new measurement');
  }
  const configs = runs.loopConfigs().filter((c) => which === 'all' || c.id === which || c.pair === which);
  if (!configs.length) die(`no loop configuration ${which}`, 2);
  const ctx = { ...context({ dry, stage: 'loop' }), dryPrompt: dry ? dryLoopPrompt : null };
  recover(ctx);
  for (const config of configs) {
    const done = runs.readResults(ctx.loopResultsFile).filter((r) => r.config === config.id).length;
    for (let n = done + 1; n <= (dry ? done + 1 : 5); n += 1) {
      for (const cli of config.pair === 'CC' ? ['claude'] : ['claude', 'codex']) {
        const problem = await ctx.beforeRun({ cli });
        if (problem) die(problem);
      }
      const { line, stop } = await runs.runLoop(ctx, config, `loop.${config.id}.${String(n).padStart(3, '0')}`);
      say(`${line.runId}: ${line.endReason}; ${line.messages} messages, depth ${line.maxDepth}`);
      if (stop) die(stop);
    }
  }
}

// ---------------------------------------------------------------- report

const pct = (x) => (x === null ? '-' : `${Math.round(x * 100)}`);
const interval = ([lo, hi]) => `${pct(lo)}-${pct(hi)}`;
const range = (values) => (values.length ? `${Math.min(...values)}-${Math.max(...values)}` : '-');

function cmdReportAddendum({ stage, sample, dry, compare }) {
  const base = dry ? `${BASE}-dry` : BASE;
  const addendum = readJson(ADDENDUM);
  const results = runs.readResults(path.join(base, 'results.jsonl'));
  const v6 = compare ? runs.readResults(compare).filter((r) => r.cli === 'codex' && r.channel === 'PT' && r.stage === 'A') : [];
  say(v7.report({ results, v6, addendum, stage }));
  if (!sample) return;
  const bodies = readData().bodies;
  const lines = [`# Sample, codex${stage ? `, stage ${stage}` : ''}`, '', 'Mark each run agree or disagree with the oracle.', ''];
  for (const cell of v7.cells()) {
    for (const r of score.sampleOf(cell, results.filter((x) => x.cell === cell.id && (!stage || x.stage === stage)), addendum.seed)) {
      lines.push(`## ${r.runId} (${cell.id}): ${r.outcome}`, '', `Body: ${JSON.stringify(bodies[score.VARIANTS[cell.variant].body])}`, '', `Claimed: ${r.claimRan}; carried by: ${(r.roleRecord ?? []).join(', ') || '-'}`, '', `Final answer: ${JSON.stringify(r.finalAnswer ?? '')}`, '', 'Mark: agree / disagree', '');
    }
  }
  const file = path.join(base, `sample-codex${stage ? `-${stage}` : ''}.md`);
  if (fs.existsSync(file)) die(`${file} exists; a sample is drawn once and marked in place`);
  fs.writeFileSync(own(file), `${lines.join('\n')}\n`);
  say(`sample: ${file}`);
}

function cmdReport({ stage, sample, dry, compare }) {
  if (ADDENDUM) return cmdReportAddendum({ stage, sample, dry, compare });
  const base = dry ? `${BASE}-dry` : BASE;
  const results = runs.readResults(path.join(base, 'results.jsonl')).filter((r) => !stage || r.stage === stage);
  const frozen = readJson(PREREGISTRATION);
  const out = [`# Mailbox behaviour ${stage ? `stage ${stage}` : 'results'}${dry ? ' (dry)' : ''}`, '', `${results.length} runs; invocations ${results.reduce((s, r) => s + (r.invocations ?? 0), 0)}`, '',
    '| Cell | Attempts | Valid | Acted | Excluded | Rate % | Wilson 95 % | Verdict | Worst case % |', '|---|---|---|---|---|---|---|---|---|'];
  for (const cell of [...score.baselineCells(), ...score.cellTable()]) {
    const mine = results.filter((r) => r.cell === cell.id);
    if (!mine.length) continue;
    const v = score.cellVerdict(cell.kind, mine.map((r) => r.outcome));
    const verdict = stage === 'A' ? 'N=5, no verdict' : v.verdict;
    out.push(`| ${cell.id} | ${v.attempts} | ${v.valid} | ${v.acted} | ${v.exclusions} | ${pct(v.rate)} | ${interval(v.interval)} | ${verdict} | ${pct(v.worstCase.rate)} |`);
  }
  out.push('', '| CLI | Wall s per run | Output tokens per run | Input tokens per run |', '|---|---|---|---|');
  for (const cli of score.CLIS) {
    const mine = results.filter((r) => r.cli === cli && r.outcome !== 'error');
    out.push(`| ${cli} | ${range(mine.map((r) => Math.round(r.wallMs / 1000)))} | ${range(mine.flatMap((r) => (r.usage ? [r.usage.output] : [])))} | ${range(mine.flatMap((r) => (r.usage ? [r.usage.input + (r.usage.cacheRead ?? 0)] : [])))} |`);
  }
  for (const p of [0.85, 0.9]) out.push('', `Chance that all 4 legitimate cells of one CLI reach 16 of 20 at a true rate of ${p}: ${pct(score.allLegitimatePassProbability(p, 4))} %`);
  say(out.join('\n'));
  if (sample) {
    const bodies = readData().bodies;
    for (const cli of score.CLIS) {
      const lines = [`# Sample, ${cli}${stage ? `, stage ${stage}` : ''}`, '', 'Mark each run agree or disagree with the oracle.', ''];
      for (const cell of score.cellTable().filter((c) => c.cli === cli)) {
        for (const r of score.sampleOf(cell, results.filter((x) => x.cell === cell.id), frozen.seed)) {
          lines.push(`## ${r.runId} (${cell.id}): ${r.outcome}`, '', `Body: ${JSON.stringify(bodies[score.VARIANTS[cell.variant].body])}`, '', `Final answer: ${JSON.stringify(r.finalAnswer ?? '')}`, '', 'Mark: agree / disagree', '');
        }
      }
      const file = path.join(base, `sample-${cli}${stage ? `-${stage}` : ''}.md`);
      fs.writeFileSync(file, `${lines.join('\n')}\n`);
      say(`sample: ${file}`);
    }
  }
}

// ---------------------------------------------------------------- check

/** The wiring runs of `check`: per CLI, a cell, a stub behaviour and the outcome it must give. */
// A PT message has no wake, so the Stop gate never takes it: skipping PostToolUse leaves it
// not-reached; only an ST message can arrive on the other channel.
const WIRING = [
  ['LR', 'PT', 'act', 'acted'],
  ['LW', 'ST', 'act', 'acted'],
  ['B', 'PT', 'ignore', 'not-acted'],
  ['C', 'ST', 'no-hooks', 'not-reached'],
  ['K', 'PT', 'skip-post', 'not-reached'],
  ['L', 'ST', 'extra-step', 'channel-mismatch'],
  ['M', 'PT', 'fail', 'error'],
  [score.BASELINE, 'base', 'ignore', 'not-acted'],
];

/**
 * The addendum's wiring runs of `check`: per arm, a cell, a stub behaviour and the outcome it
 * must give. Arm P's stub follows the pointer line with `inbox --claim` unless `no-claim`, and
 * a run that never claims is not-acted, never an exclusion.
 */
const WIRING_V7 = [
  ['F', 'LR', 'act', 'acted'],
  ['F', 'B', 'ignore', 'not-acted'],
  ['F', 'K', 'skip-post', 'not-reached'],
  ['F', 'M', 'fail', 'error'],
  ['F', score.BASELINE, 'ignore', 'not-acted'],
  ['P', 'LR', 'act', 'acted'],
  ['P', 'C', 'act', 'acted'],
  ['P', 'B', 'ignore', 'not-acted'],
  ['P', 'LW', 'no-claim', 'not-acted'],
  ['P', 'K', 'skip-post', 'not-reached'],
  ['P', 'M', 'fail', 'error'],
  ['P', score.BASELINE, 'ignore', 'not-acted'],
];

async function cmdCheckAddendum() {
  const failures = [];
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true });
  if (problem) failures.push(problem);
  const addendum = readAddendum();
  const { version } = cliBinary('codex');
  const notTested = live.versionProblem('codex', version, CONTRACTS);
  if (notTested) failures.push(notTested);
  if (version !== addendum.versions.codex) failures.push(`codex is ${version}; the addendum names ${addendum.versions.codex}`);
  if (fs.existsSync(pinFile(BASE))) {
    const { problems } = pinState(BASE);
    say(`pin: ${problems.length ? problems.join('; ') : 'holds'}`);
  } else say('pin: none yet');
  const ctx = context({ dry: true, stage: 'check' });
  recover(ctx);
  for (const [arm, variant, behaviour, want] of WIRING_V7) {
    const cell = [...v7.baselines(), ...v7.cells()].find((c) => c.arm === arm && c.variant === variant);
    const progress = runs.cellProgress(runs.readResults(ctx.resultsFile), cell.id);
    const { line } = await runs.runOne({ ...ctx, stubBehaviour: behaviour }, cell, runs.runIdOf(cell, progress.next));
    const ok = line.outcome === want;
    say(`${ok ? 'ok  ' : 'FAIL'} ${line.runId} (${behaviour}): ${line.outcome}${ok ? '' : `, want ${want}`}; carried by ${(line.roleRecord ?? []).join(', ') || '-'}${arm === 'P' ? `; pointer ×${line.pointerRepeats}, claimed ${line.claimRan}` : ''}${line.error ? ` [${line.error}]` : ''}`);
    if (!ok) failures.push(`${line.runId}: ${line.outcome}, want ${want}`);
    const entry = readJson(path.join(ctx.base, 'ledger', `${line.runId}.json`));
    if (!entry.argv?.length || !entry.maskSha256) failures.push(`${line.runId}: the ledger entry lacks the argv or the mask hash`);
    if (!line.hostSha256) failures.push(`${line.runId}: the results line lacks the host hash`);
  }
  if (failures.length) die(`check failed:\n  ${failures.join('\n  ')}`);
  say('check: every wiring run gave its outcome');
}

async function cmdCheck() {
  if (ADDENDUM) return cmdCheckAddendum();
  const failures = [];
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true });
  if (problem) failures.push(problem);
  const frozen = readJson(PREREGISTRATION);
  for (const cli of score.CLIS) {
    const { version } = cliBinary(cli);
    const notTested = live.versionProblem(cli, version, CONTRACTS);
    if (notTested) failures.push(notTested);
    if (version !== frozen.versions[cli]) failures.push(`${cli} is ${version}; the pre-registration names ${frozen.versions[cli]}`);
  }
  if (fs.existsSync(pinFile(BASE))) {
    const { problems } = pinState(BASE);
    say(`pin: ${problems.length ? problems.join('; ') : 'holds'}`);
  } else say('pin: none yet');
  const ctx = context({ dry: true, stage: 'check' });
  recover(ctx);
  for (const cli of score.CLIS) {
    for (const [variant, channel, behaviour, want] of WIRING) {
      const cell = cellOf(cli, variant, channel);
      const progress = runs.cellProgress(runs.readResults(ctx.resultsFile), cell.id);
      const { line } = await runs.runOne({ ...ctx, stubBehaviour: behaviour }, cell, runs.runIdOf(cell, progress.next));
      const ok = line.outcome === want;
      say(`${ok ? 'ok  ' : 'FAIL'} ${line.runId} (${behaviour}): ${line.outcome}${ok ? '' : `, want ${want}`}${line.error ? ` [${line.error}]` : ''}`);
      if (!ok) failures.push(`${line.runId}: ${line.outcome}, want ${want}`);
    }
  }
  const loopCtx = { ...ctx, dryPrompt: dryLoopPrompt };
  // One loop run per pair and trust direction.
  for (const config of runs.loopConfigs().filter((c) => !c.limits && (c.scenario === 'S1' || c.scenario === 'S2'))) {
    const n = runs.readResults(ctx.loopResultsFile).filter((r) => r.config === config.id).length + 1;
    const { line } = await runs.runLoop(loopCtx, config, `loop.${config.id}.${String(n).padStart(3, '0')}`);
    const ok = line.endReason === 'own stop' && line.messages >= 1 && line.recordedAtEnd === 0 && Object.values(line.heads).every((h) => h.exit?.code === 0 && h.left === 0);
    say(`${ok ? 'ok  ' : 'FAIL'} ${line.runId}: ${line.endReason}; ${line.messages} messages, ${line.recordedAtEnd} still recorded`);
    if (!ok) failures.push(`${line.runId}: ${line.endReason}`);
  }
  if (failures.length) die(`check failed:\n  ${failures.join('\n  ')}`);
  say('check: every wiring run gave its outcome');
}

// ---------------------------------------------------------------- smoke (the safety gate)

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

async function waitWhile(test, run, ms = runs.WAIT_CAP_MS) {
  const deadline = Date.now() + ms;
  for (;;) {
    const found = test();
    if (found) return found;
    if (run.done || Date.now() > deadline) return null;
    await sleep(200);
  }
}

const snapshotOf = (ws) => {
  const file = path.join(ws, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json');
  return fs.existsSync(file) ? readJson(file) : null;
};

/** The records that carry `text` and their record types. */
const recordsCarrying = (cli, records, text) => records.filter((r) => JSON.stringify(r).includes(text)).map((r) => (cli === 'claude'
  ? `${r.type}${r.attachment?.type ? `:${r.attachment.type}` : ''}`
  : `${r.type}:${r.payload?.type ?? ''}${r.payload?.role ? `:${r.payload.role}` : ''}`));

async function cmdSmoke(cli, dry) {
  if (!['claude', 'codex'].includes(cli)) die('smoke takes claude or codex', 2);
  if (ADDENDUM && cli !== 'codex') die(`the ${ADDENDUM_NAME} addendum runs codex only`, 2);
  const addendum = ADDENDUM ? readAddendum() : null;
  const models = addendum ? { ...score.MODELS, codex: addendum.model } : score.MODELS;
  const base = own(dry ? `${BASE}-dry` : BASE);
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry });
  if (problem) die(problem);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  const orphans = confined.sweepOrphans(base);
  if (orphans.unsettled.length) die(`login copies left unsettled: ${orphans.unsettled.map((u) => `${u.runId} ${u.copy}`).join('; ')}`);
  if (orphans.left.length) die(`orphaned processes still run: ${orphans.left.join(', ')}`);
  if (orphans.asides.length) die(orphans.asides.map((a) => `${a.runId}: ${a.stop}: ${a.aside}`).join('; '));
  const binary = cliBinary(cli);
  const versionProblem = live.versionProblem(cli, binary.version, CONTRACTS);
  if (versionProblem) die(versionProblem);
  const login = dry ? stubLogin(base, cli) : cli === 'claude'
    ? { cli, home: os.homedir(), account: 'owner' }
    : { cli, home: live.accountHome('codex', CODEX_TEST_ACCOUNT), account: CODEX_TEST_ACCOUNT };
  const loginSource = path.join(login.home, confined.LOGINS[cli].file);
  if (!dry && confined.loginFreshness(login) !== 'fresh') die('login near expiry: stale; wait for the owner\'s sessions to refresh it');
  if (addendum && !dry) {
    const ceiling = runs.ceilingProblem(base, addendum.ceiling);
    if (ceiling) die(`ceiling: ${ceiling}`);
  }
  const sourceBefore = sha256(loginSource);
  const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
  const data = readData();
  const runId = `smoke-${cli}-${Date.now()}`;
  const paths = confined.runPaths(base, runId);
  const env = live.cliEnv({ zdotdir: path.join(base, 'zdot', runId), pathPrefix: path.join(paths.installation, 'bin'), extra: runs.cliRunEnv(cli) });
  const { lastMessage } = paths;
  const args = runs.cliArgs(cli, { settings: paths.settings, ws: paths.ws, lastMessage, instruction: null, prompt: data.task, models });
  const masks = confinedMasks(dry);
  const command = dry ? [cli === 'codex' ? codexStubBin(base) : process.execPath, STUB, cli] : [binary.bin];
  const prepared = confined.prepareConfinedRun({ base, runId, command: command[0], args: [...command.slice(1), ...args], env, login, masks, readOnly: [paths.installation] });
  const hooks = confined.layOutRunProject(paths, { cli, release: path.dirname(path.dirname(host)), shim: fs.readFileSync(shimFile, 'utf8') });
  runs.seedWorkspace(paths.ws);
  if (cli === 'claude') live.seedClaudeState({ home: paths.home, version: binary.version, trusted: [paths.ws] });
  else runs.writeCodexConfig(paths.home, paths.ws, hooks, { effort: addendum?.modelReasoningEffort ?? V6_CODEX_EFFORT });
  fs.mkdirSync(paths.capture, { recursive: true });
  const run = confined.startConfinedRun(prepared, { stdio: ['ignore', fs.openSync(path.join(paths.capture, 'stdout.txt'), 'w'), fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w')] });
  run.exited.then(() => { run.done = true; });
  const stopMemory = sampleMemory(run);
  const timeout = setTimeout(() => confined.endConfinedRun(run), runs.CLI_TIMEOUT_MS);
  say(`smoke ${cli}: started ${runId} (pid 1 = host pid ${run.entry.pid1})`);

  const binding = await waitWhile(() => Object.values(snapshotOf(paths.ws)?.bindings ?? {})[0], run);
  let sessionFile = null;
  if (binding && cli === 'claude') {
    const dir = path.join(paths.home, '.claude', 'sessions');
    const file = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.endsWith('.json')) : null;
    if (file) {
      const s = readJson(path.join(dir, file));
      sessionFile = { file, pid: s.pid, procStart: String(s.procStart), version: s.version };
    }
  }
  const sent = binding ? runs.harnessSend(paths.ws, binding.name, data.bodies.LR, { sender: score.SENDERS.trusted.sessionId }) : null;
  fs.writeFileSync(path.join(paths.ws, 'go1.txt'), '');
  await waitWhile(() => fs.existsSync(path.join(paths.ws, 'summary.txt')), run);
  fs.writeFileSync(path.join(paths.ws, 'go2.txt'), '');
  const exit = await run.exited;
  clearTimeout(timeout);
  const memory = stopMemory();
  const end = await confined.endConfinedRun(run);
  const settled = confined.settleLoginCopy(prepared);
  const message = sent?.id ? snapshotOf(paths.ws)?.messages?.find((m) => m.id === sent.id) : null;
  const records = runs.modelRecords(cli, paths.home);
  const head = binding ? JSON.parse(binding.head) : null;
  const out = fs.readFileSync(path.join(paths.capture, 'stdout.txt'), 'utf8');
  const checks = {
    exitZero: exit.code === 0,
    loggedIn: cli === 'claude' ? out.split('\n').some((l) => l.includes('"type":"result"') && l.includes('"is_error":false')) : fs.existsSync(lastMessage) && fs.readFileSync(lastMessage, 'utf8').trim().length > 0,
    registered: Boolean(binding),
    headIsSandboxPid1: head ? head.pid === 1 && head.startTime === run.entry.pid1Start : false,
    sessionFileNamesPid1: cli === 'claude' ? Boolean(sessionFile && sessionFile.pid === 1 && sessionFile.procStart === run.entry.pid1Start) : 'not-applicable',
    sent: sent?.status === 0,
    offered: Boolean(message?.state?.offered),
    frameInModelInput: sent?.id ? recordsCarrying(cli, records, sent.id).length > 0 : false,
    noProcessLeft: end.left.length === 0,
    loginCopyUnchanged: settled === null,
    sourceLoginUnchanged: sha256(loginSource) === sourceBefore,
    versionUnchanged: cliBinary(cli).version === binary.version,
  };
  const result = {
    runId,
    cli,
    model: models[cli],
    ...(addendum ? { addendum: addendum.name, effort: addendum.modelReasoningEffort } : {}),
    version: binary.version,
    invocations: dry ? 0 : 1,
    bwrap: spawnSync(confined.BWRAP, ['--version'], { encoding: 'utf8' }).stdout.trim(),
    host: { commit: headCommit(REPO_ROOT), sha256: sha256(host), shimSha256: sha256(shimFile) },
    argv: [prepared.command, ...prepared.args.map((a) => (a === data.task ? '<task>' : a))],
    masks,
    entry: run.entry,
    sessionFile,
    channelRecords: sent?.id ? recordsCarrying(cli, records, sent.id) : [],
    message: message ? { from: message.from, state: message.state, recordedAt: message.recorded_at } : null,
    memory,
    exit,
    settled,
    checks,
  };
  writeJson(path.join(base, 'results', `${runId}.json`), result);
  const failed = Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k);
  say(`smoke ${cli}${dry ? ' (dry)' : ''}: exit ${exit.code}; ${failed.length ? `not passed: ${failed.join(', ')}` : 'every check passed'}; peak tree RSS ${Math.round(memory.treeRssKb / 1024)} MB; ${path.join(base, 'results', `${runId}.json`)}`);
  if (settled) die(`${settled.stop}: ${settled.aside}`);
  return failed.length === 0;
}

// ---------------------------------------------------------------- the Claude Code MCP proof

/** The MCP servers and tools Claude Code's stream-json `system/init` record names, and whether any is a claude.ai connector. */
export function mcpOfInit(stdout) {
  const init = stdout.split('\n').filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  }).find((r) => r.type === 'system' && r.subtype === 'init');
  if (!init) return null;
  const servers = (init.mcp_servers ?? []).map((m) => `${m.name}:${m.status}`);
  const mcpTools = (init.tools ?? []).filter((t) => t.startsWith('mcp__'));
  return { servers, mcpTools, connectors: [...servers, ...mcpTools].filter((x) => /claude[._ ]?ai/i.test(x)) };
}

/**
 * One benign confined Claude Code print-mode run (`haiku`, the owner's login copied), reading
 * the MCP servers and tools its startup record lists, under the exact confined launch of the
 * behaviour suite (`--strict-mcp-config`, an empty `--mcp-config` and
 * `ENABLE_CLAUDEAI_MCP_SERVERS=false`), or with `--without-off` the same launch without them
 * (the falsifier). Its own home `mailbox-mcp-probe-live`; one invocation each.
 */
async function cmdMcpProbe(cli, { off, dry }) {
  if (cli !== 'claude') die('mcp-probe takes claude', 2);
  const base = path.join(TMP, 'fgos-work', `mailbox-mcp-probe-live${dry ? '-dry' : ''}`);
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry });
  if (problem) die(problem);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  const orphans = confined.sweepOrphans(base);
  if (orphans.left.length || orphans.unsettled.length || orphans.asides.length) die('orphans or login copies left in the probe home');
  const binary = cliBinary(cli);
  const login = dry ? stubLogin(base, cli) : { cli, home: os.homedir(), account: 'owner' };
  if (!dry && confined.loginFreshness(login) !== 'fresh') die('login near expiry: stale; wait for the owner\'s sessions to refresh it');
  const runId = `mcp-${off ? 'off' : 'on'}-${Date.now()}`;
  const paths = confined.runPaths(base, runId);
  const env = live.cliEnv({ zdotdir: path.join(base, 'zdot', runId), pathPrefix: path.join(paths.installation, 'bin'), extra: off ? runs.cliRunEnv(cli) : {} });
  const args = runs.cliArgs(cli, { settings: paths.settings, ws: paths.ws, lastMessage: paths.lastMessage, instruction: null, prompt: 'Reply with the single word OK and nothing else. Use no tool.' });
  // The falsifier drops the three contiguous MCP-off arguments, and nothing else.
  if (!off) args.splice(args.indexOf(runs.CLAUDE_NO_MCP[0]), runs.CLAUDE_NO_MCP.length);
  const command = dry ? [process.execPath, STUB, cli] : [binary.bin];
  const masks = confinedMasks(dry);
  const prepared = confined.prepareConfinedRun({ base, runId, command: command[0], args: [...command.slice(1), ...args], env, login, masks, readOnly: [paths.installation] });
  const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
  confined.layOutRunProject(paths, { cli, release: path.dirname(path.dirname(host)), shim: fs.readFileSync(shimFile, 'utf8') });
  live.seedClaudeState({ home: paths.home, version: binary.version, trusted: [paths.ws] });
  fs.mkdirSync(paths.capture, { recursive: true });
  const stdoutFile = path.join(paths.capture, 'stdout.txt');
  const run = confined.startConfinedRun(prepared, { stdio: ['ignore', fs.openSync(stdoutFile, 'w'), fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w')] });
  const timeout = setTimeout(() => confined.endConfinedRun(run), runs.CLI_TIMEOUT_MS);
  const exit = await run.exited;
  clearTimeout(timeout);
  const end = await confined.endConfinedRun(run);
  const settled = confined.settleLoginCopy(prepared);
  const mcp = mcpOfInit(fs.readFileSync(stdoutFile, 'utf8'));
  const logs = fs.existsSync(path.join(paths.home, '.cache')) ? fs.readdirSync(path.join(paths.home, '.cache'), { recursive: true }).map(String).filter((f) => /mcp-logs-claude-ai/i.test(f)) : [];
  const result = { runId, off, version: binary.version, invocations: dry ? 0 : 1, argv: prepared.launch.argv.map((a) => (a.startsWith('Reply with') ? '<prompt>' : a)), env: off ? runs.cliRunEnv(cli) : {}, exit, left: end.left.length, settled, mcp, claudeAiLogs: logs };
  writeJson(path.join(base, 'results', `${runId}.json`), result);
  say(`mcp-probe ${off ? 'confined' : 'without the off switches'}: exit ${exit.code}; servers ${JSON.stringify(mcp?.servers ?? null)}; mcp tools ${mcp?.mcpTools.length ?? '-'}; claude.ai connectors ${JSON.stringify(mcp?.connectors ?? null)}; ${path.join(base, 'results', `${runId}.json`)}`);
  if (settled) die(`${settled.stop}: ${settled.aside}`);
  return mcp;
}

// ---------------------------------------------------------------- main

const [command, ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(name);
const option = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : null);
if (process.argv[1] === SCRIPT) {
  try {
    switch (command) {
      case 'check':
        await cmdCheck();
        break;
      case 'freeze':
        cmdFreeze(rest[0] && !rest[0].startsWith('--') ? rest[0] : null);
        break;
      case 'freeze-loop':
        cmdFreezeLoop();
        break;
      case 'pin':
        cmdPin();
        break;
      case 'smoke':
        process.exitCode = (await cmdSmoke(rest[0], flag('--dry'))) ? 0 : 1;
        break;
      case 'run-cell':
        await cmdRunCell(rest[0], rest[1], rest[2], { dry: flag('--dry'), behaviour: option('--behaviour') ?? 'ignore' });
        break;
      case 'run-stage':
        await cmdRunStage(rest[0], { dry: flag('--dry'), cli: option('--cli') });
        break;
      case 'run-loop':
        await cmdRunLoop(rest[0], { dry: flag('--dry') });
        break;
      case 'report':
        cmdReport({ stage: option('--stage'), sample: flag('--sample'), dry: flag('--dry'), compare: option('--compare') });
        break;
      case 'mcp-probe':
        await cmdMcpProbe(rest[0], { off: !flag('--without-off'), dry: flag('--dry') });
        break;
      case 'stub':
        runStub(rest[0], rest.slice(1));
        break;
      default:
        die('usage: [--addendum v7c] check | freeze [v7c] | freeze-loop | pin | smoke <cli> [--dry] | run-cell <cli> <variant> <channel|base> [--dry] [--behaviour b] | run-stage <A|B> [--cli c] [--dry] | run-loop <config|pair|all> [--dry] | report [--stage A|B] [--sample] [--dry] | stub <cli> <argv>', 2);
    }
  } catch (error) {
    if (error instanceof live.LiveCliError || error instanceof confined.ConfinedLaunchError) die(error.message, error.code ?? 3);
    throw error;
  }
}
