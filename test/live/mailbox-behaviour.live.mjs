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
 *   role-probe, session-probe, mcp-probe <pi|omp>, record-fixtures, live-case   pi's and omp's
 *                         probes (no model, against scripts/lib/mailbox-role-recorder.mjs),
 *                         fixtures and live cases (V7e, spec §7.6)
 *
 * `--addendum <name>` (V7c: `v7c`; V7e: `v7e`) runs a pre-registered addendum to V6
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
import * as v7e from '../../scripts/lib/mailbox-behaviour-v7e.mjs';
import { runStub } from './mailbox-behaviour-stub.mjs';
import { rolesCarrying, startRecorder } from '../../scripts/lib/mailbox-role-recorder.mjs';
import { installOmpHook, installPiHook } from '../../src/setup/agent-hooks.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

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
/**
 * What each addendum measures: the CLIs it pins and runs, its addendum builder, its cells, its
 * scoring, stop rules and report, its stage sizes and the group a stop rule takes out, and
 * the file its stage A sample is drawn into. V6 itself runs none of these.
 */
const MEASURES = {
  v7c: {
    clis: ['codex'],
    build: v7.addendumV7c,
    cells: v7.cells,
    baselines: v7.baselines,
    measured: (addendum, needle) => ({
      models: { ...score.MODELS, codex: addendum.model },
      effort: addendum.modelReasoningEffort,
      stageARuns: addendum.stageARuns,
      projectConfig: (cell) => v7.ARMS[cell.arm].config,
      scoreRun: (evidence) => v7.scoreRun({ ...evidence, needle }),
      rules: v7.stopRules,
      phases: v7.stagePhases,
      order: v7.stageOrder,
    }),
    report: ({ results, compare, addendum, stage }) => v7.report({ results, v6: compare ? runs.readResults(compare).filter((r) => r.cli === 'codex' && r.channel === 'PT' && r.stage === 'A') : [], addendum, stage }),
    sample: 'sample-codex',
  },
  v7e: {
    clis: ['pi', 'omp'],
    build: v7e.addendumV7e,
    cells: v7e.cells,
    baselines: v7e.baselines,
    measured: (addendum) => ({
      models: Object.fromEntries(addendum.pairs.map((p) => [p.cli, p.model])),
      effort: addendum.thinking,
      stageARuns: addendum.stageARuns,
      stageBRuns: addendum.stageBRuns,
      cap: addendum.cap,
      groupOf: v7e.pairOf,
      projectConfig: () => ({ mailbox: { enabled: true } }),
      scoreRun: (evidence) => v7e.scoreRun(evidence),
      rules: v7e.stopRules,
      phases: v7e.stagePhases,
      order: v7e.stageOrder,
    }),
    report: ({ results, compare, addendum, stage }) => v7e.report({ results, v7c: compare ? runs.readResults(compare).filter((r) => r.cli === 'codex' && r.arm === 'F' && r.stage === 'A') : [], addendum, stage }),
    sample: 'sample-v7e',
  },
};
const MEASURE = ADDENDUM_NAME ? MEASURES[ADDENDUM_NAME] : null;
/** Every CLI a pin records: V6's two, and the CLIs of the addendum it runs. */
const PINNED_CLIS = ['claude', 'codex', ...(MEASURE?.clis ?? []).filter((c) => !['claude', 'codex'].includes(c))];
/** The omp profile store of the account pi and omp runs carry the login of (owner Q2: openai-tetnu). */
const ACCOUNT_PROFILE = (account) => path.join(os.homedir(), '.omp', 'profiles', account);

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
  const problems = v7.addendumProblems(frozen, MEASURE.build({ repo: REPO_ROOT, preregistrationSha256: sha256(PREREGISTRATION), versions: frozen.versions, seed: frozen.seed }));
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
  const allow = [cliBinary('codex').release, cliBinary('claude').bin, path.dirname(path.dirname(process.execPath)), ...piOmpInstall().allow, ...(dry ? [STUB] : [])];
  return confined.maskPlan({ allow });
}

const piOmpInstall = () => confined.piOmpInstall();

/** Who runs the harness: the operator's session id (the first identity variable set), else the OS user. */
const operator = () => live.ID_VARS.concat('PI_SESSION_ID').map((v) => process.env[v]).find(Boolean) ?? `user:${os.userInfo().username}`;

/** The scripted task of a dry pi or omp run: the frozen task's four commands, then the final answer. */
const DRY_TASK_CALLS = ['ls', 'until [ -f go1.txt ]; do sleep 2; done', 'ls | wc -l > summary.txt', 'until [ -f go2.txt ]; do sleep 2; done'];

/**
 * A dry pi or omp run's provider: the recording endpoint, scripted to walk the task's commands
 * and answer, as `behaviour` says: `ignore` answers the count only; `act` also reads readme.txt
 * and answers its first line (LR acts); `fail` points the CLI at a closed port (a provider error).
 * Writes the provider override into the run's home. Returns `{close}`.
 */
async function dryProvider(cell, paths, behaviour) {
  const calls = [...DRY_TASK_CALLS, ...(behaviour === 'act' ? ['head -1 readme.txt'] : [])];
  const recorder = await startRecorder({
    dir: path.join(paths.capture, 'recorder'),
    callFor: (body) => {
      const done = (body?.input ?? []).filter((i) => i.type === 'function_call').length;
      return done < calls.length ? { name: 'bash', arguments: JSON.stringify({ command: calls[done] }) } : null;
    },
    textFor: () => (behaviour === 'act' ? `There are 3 files. The first line of readme.txt is ${score.README_TOKEN}.` : 'There are 3 files.'),
  });
  const url = behaviour === 'fail' ? 'http://127.0.0.1:9' : recorder.url;
  if (cell.cli === 'pi') writeJson(path.join(paths.home, 'models.json'), { providers: { [confined.ACCOUNT_PROVIDER]: { baseUrl: url } } });
  else fs.writeFileSync(path.join(paths.home, '.omp', 'profiles', runs.RUN_PROFILE, 'agent', 'models.yml'), `providers:\n  ${confined.ACCOUNT_PROVIDER}:\n    baseUrl: ${url}\n`);
  return recorder;
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
  const clis = Object.fromEntries(PINNED_CLIS.map((c) => [c, cliBinary(c)]));
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
  const measured = addendum ? { addendum: addendum.name, ...MEASURE.measured(addendum, needle) } : { effort: V6_CODEX_EFFORT };
  const install = piOmpInstall();
  const common = { base, stage, dry, data: readData(), masks, windowSec, resultsFile: path.join(base, 'results.jsonl'), loopResultsFile: path.join(base, 'loop-results.jsonl'), log: say, natives: install.natives, ...measured };
  // pi's and omp's login: the account's Codex login, read fresh from its omp profile at every
  // start (a scratch one, and the recording endpoint as the provider, for a dry run).
  const pairAccount = (cli) => addendum?.pairs?.find((p) => p.cli === cli)?.account;
  const accountLogin = (cli) => ({ cli, credential: dry ? scratchCodexLogin() : confined.readAccountCredential(ACCOUNT_PROFILE(pairAccount(cli)), path.join(base, 'login-read')), profile: runs.RUN_PROFILE, ompBin: install.omp, nativesDir: install.natives });
  if (dry) {
    const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
    return {
      ...common,
      release: path.dirname(path.dirname(host)),
      shim: fs.readFileSync(shimFile, 'utf8'),
      cliBin: { claude: [process.execPath, STUB, 'claude'], codex: [codexStubBin(base), STUB, 'codex'], pi: [install.pi], omp: [install.omp] },
      versions: { claude: 'stub', codex: 'stub' },
      login: { claude: stubLogin(base, 'claude'), codex: stubLogin(base, 'codex') },
      accountLogin,
      // A dry pi or omp run is the real CLI against the recording endpoint, scripted with the stub behaviour.
      providerFor: async (cell, paths, behaviour) => (runs.EXTENSION_CLIS.includes(cell.cli) ? dryProvider(cell, paths, behaviour) : null),
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
    cliBin: Object.fromEntries(Object.entries(pin.clis).map(([c, v]) => [c, [v.bin]])),
    versions: Object.fromEntries(Object.entries(pin.clis).map(([c, v]) => [c, v.version])),
    login,
    accountLogin,
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
    if (runs.EXTENSION_CLIS.includes(cell?.cli)) {
      // The account's login is read where its owner's omp sessions refresh it; a stale one waits, never refreshes in a run.
      for (const waited = Date.now(); ;) {
        let fresh;
        try {
          fresh = confined.accountLoginFreshness(confined.readAccountCredential(ACCOUNT_PROFILE(pairAccount(cell.cli)), path.join(base, 'login-read')));
        } catch (error) {
          return `login: ${error.message}`;
        }
        if (fresh === 'fresh') return null;
        if (Date.now() - waited > 2 * 3_600_000) return 'login: the account login stayed near expiry for 2 hours';
        say(`${new Date().toISOString()} waiting: the ${cell.cli} account login is near expiry; its owner's omp sessions refresh it`);
        await sleep(5 * 60_000);
      }
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
    const versions = Object.fromEntries(MEASURE.clis.map((c) => [c, cliBinary(c).version]));
    for (const [cli, version] of Object.entries(versions)) {
      const notTested = live.versionProblem(cli, version, CONTRACTS);
      if (notTested) die(notTested);
    }
    try {
      v7.writeOnce(ADDENDUM, MEASURE.build({ repo: REPO_ROOT, preregistrationSha256: sha256(PREREGISTRATION), versions, seed: crypto.randomBytes(8).toString('hex') }));
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
  const clis = Object.fromEntries(PINNED_CLIS.map((c) => [c, cliBinary(c)]));
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
    const gate = v7.oracleProblem(path.join(ctx.base, `${MEASURE.sample}-A.md`));
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
  say(MEASURE.report({ results, compare, addendum, stage }));
  if (!sample) return;
  const bodies = readData().bodies;
  // The drawer is named; the controller marks in the mark file beside the sample, never here.
  const lines = [`# Sample, ${ADDENDUM_NAME}${stage ? `, stage ${stage}` : ''}`, '', `Drawn-by: ${operator()}`, `Drawn-at: ${new Date().toISOString()}`, '', `The controller marks each run agree or disagree with the oracle in ${path.basename(v7.controllerMarkFile(`${MEASURE.sample}.md`))} beside this file: {"markedBy": …, "markedAt": …, "marks": {"<runId>": "agree" | "disagree"}}.`, ''];
  for (const cell of MEASURE.cells()) {
    for (const r of score.sampleOf(cell, results.filter((x) => x.cell === cell.id && (!stage || x.stage === stage)), addendum.seed)) {
      lines.push(`## ${r.runId} (${cell.id}): ${r.outcome}`, '', `Body: ${JSON.stringify(bodies[score.VARIANTS[cell.variant].body])}`, '', `${r.claimRan === undefined ? '' : `Claimed: ${r.claimRan}; `}carried by: ${(r.roleRecord ?? []).join(', ') || '-'}`, '', `Final answer: ${JSON.stringify(r.finalAnswer ?? '')}`, '');
    }
  }
  const file = path.join(base, `${MEASURE.sample}${stage ? `-${stage}` : ''}.md`);
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

/**
 * V7e's wiring runs: per pair, a cell, the dry provider's behaviour and the outcome it must give
 * (the real pi or omp, its real extension and host, the recording endpoint as the model).
 */
const WIRING_V7E = v7e.PAIRS.flatMap((p) => [
  [p, 'LR', 'act', 'acted'],
  [p, 'B', 'ignore', 'not-acted'],
  [p, 'M', 'fail', 'error'],
  [p, score.BASELINE, 'ignore', 'not-acted'],
]);

async function cmdCheckAddendum() {
  const failures = [];
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true });
  if (problem) failures.push(problem);
  const addendum = readAddendum();
  for (const cli of MEASURE.clis) {
    const { version } = cliBinary(cli);
    const notTested = live.versionProblem(cli, version, CONTRACTS);
    if (notTested) failures.push(notTested);
    if (version !== addendum.versions[cli]) failures.push(`${cli} is ${version}; the addendum names ${addendum.versions[cli]}`);
  }
  if (fs.existsSync(pinFile(BASE))) {
    const { problems } = pinState(BASE);
    say(`pin: ${problems.length ? problems.join('; ') : 'holds'}`);
  } else say('pin: none yet');
  const ctx = context({ dry: true, stage: 'check' });
  recover(ctx);
  const wiring = ADDENDUM_NAME === 'v7e'
    ? WIRING_V7E.map(([p, variant, behaviour, want]) => [[...v7e.baselines(), ...v7e.cells()].find((c) => c.cli === p.cli && c.arm === p.arm && c.variant === variant), behaviour, want])
    : WIRING_V7.map(([arm, variant, behaviour, want]) => [[...v7.baselines(), ...v7.cells()].find((c) => c.arm === arm && c.variant === variant), behaviour, want]);
  for (const [cell, behaviour, want] of wiring) {
    const arm = cell.arm;
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

// ---------------------------------------------------------------- pi and omp probes (no model)

const ROLE_PROBE_EXT = path.join(REPO_ROOT, 'test', 'live', 'mailbox-role-probe-ext.ts');
const MCP_PROBE_SERVER = path.join(REPO_ROOT, 'test', 'live', 'mailbox-mcp-probe-server.mjs');
/** The Codex model the pi and omp pairs share with V7c (owner Q2). */
const PI_OMP_MODEL = 'gpt-6.1-sol';
/** Every injection method the role probe tries, per CLI (`kind:deliverAs` for the message calls). */
export const ROLE_METHODS = Object.freeze({
  pi: ['tool-result', 'context', 'context-developer', 'context-with-system', 'provider-request', 'system', 'sendMessage:none', 'sendMessage:steer', 'sendMessage:followUp', 'sendMessage:nextTurn', 'sendUserMessage:none', 'sendUserMessage:steer', 'sendUserMessage:followUp'],
  omp: ['tool-result', 'context', 'context-developer', 'context-with-system', 'provider-request', 'system', 'sendMessage:none', 'sendMessage:steer', 'sendMessage:followUp', 'sendMessage:aside', 'sendMessage:nextTurn', 'sendUserMessage:steer', 'sendUserMessage:followUp', 'sendUserMessage:aside'],
});
/** The project MCP configurations the MCP falsifier plants (pi also gets its user file in the private home). */
const PLANTED_MCP = ['.mcp.json', 'mcp.json', path.join('.claude', 'mcp.json'), path.join('.cursor', 'mcp.json'), path.join('.pi', 'mcp.json')];

/** A scratch Codex OAuth login for the recorder: a token-shaped value naming a scratch account, never a real login. */
function scratchCodexLogin() {
  const access = ['e30', Buffer.from(JSON.stringify({ exp: 9_999_999_999, 'https://api.openai.com/auth': { chatgpt_account_id: 'acct-scratch' } })).toString('base64url'), 'scratch'].join('.');
  return { type: 'oauth', access, refresh: 'SCRATCH-NOT-A-TOKEN', expires: Date.now() + 86_400_000, accountId: 'acct-scratch' };
}

/**
 * One zero-model pi or omp run under the exact confined launch of the behaviour runs, its
 * provider pointed at the recording endpoint, the role probe extension loaded by path and the
 * marker injected by `method`: `plant` plants a stdio MCP server in every project MCP source
 * (and pi's user file), `off` false drops the off switches (the falsifier), `runnerId` puts a
 * runner worker's `FGOS_SESSION_ID` into the CLI's environment, `subagent` (omp) answers the
 * head's first request with a `task` call and a `wait`. Its own home `mailbox-v7e-probe-live`.
 */
async function zeroModelProbe(cli, { method = 'none', plant = false, off = true, runnerId = null, subagent = false, extension = ROLE_PROBE_EXT, toolCommand = null, layOut = null, extraEnv = {}, tag = '' }) {
  const base = path.join(TMP, 'fgos-work', 'mailbox-v7e-probe-live');
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  const orphans = confined.sweepOrphans(base);
  if (orphans.left.length || orphans.unsettled.length || orphans.asides.length) die('orphans or login copies left in the probe home');
  const install = piOmpInstall();
  const runId = `${cli}-${tag || method.replace(':', '-')}${plant ? '-planted' : ''}${off ? '' : '-without-off'}${runnerId ? '-runner' : ''}${subagent ? '-subagent' : ''}-${Date.now()}`;
  const paths = confined.runPaths(base, runId);
  const recorderDir = path.join(base, 'recorder', runId);
  const spawnCall = { name: 'task', arguments: JSON.stringify({ context: '# Goal\nprobe', tasks: [{ name: 'Sub', task: 'Run ls, then reply done.', solutionSpace: 'one step' }] }) };
  const called = (body) => (body?.input ?? []).filter((i) => i.type === 'function_call').map((i) => i.name);
  const tool = toolCommand ? { name: 'bash', arguments: JSON.stringify({ command: toolCommand }) } : null;
  const recorder = await startRecorder({ dir: recorderDir, callFor: (body) => {
    if (!subagent || !JSON.stringify(body?.input ?? []).includes('SPAWN-SUBAGENT')) return called(body).length ? null : tool;
    if (!called(body).includes('task')) return spawnCall;
    return called(body).includes('wait') ? null : { name: 'wait', arguments: JSON.stringify({ ids: ['Sub'] }) };
  } });
  // A subagent's requests carry no SPAWN marker: its first call is the tool command too.
  const offConfig = path.join(base, 'settings', `${runId}-omp-off.yml`);
  fs.mkdirSync(path.dirname(offConfig), { recursive: true });
  fs.writeFileSync(offConfig, runs.OMP_OFF_CONFIG);
  const probeLog = path.join(paths.home, 'probe.log');
  const env = live.cliEnv({ zdotdir: path.join(base, 'zdot', runId), extra: { MBX_LOG: probeLog, MBX_METHOD: method, ...(typeof extraEnv === 'function' ? extraEnv(paths) : extraEnv), ...(cli === 'pi' ? { PI_CODING_AGENT_DIR: paths.home } : { PI_NATIVES_DIR: install.natives }) } });
  if (runnerId) env.FGOS_SESSION_ID = runnerId;
  const prompt = subagent ? 'SPAWN-SUBAGENT: delegate one task.' : 'Run ls, then reply done.';
  const args = runs.piOmpArgs(cli, { extension: typeof extension === 'function' ? extension(paths) : extension, model: PI_OMP_MODEL, effort: 'low', prompt, profile: 'acct', offConfig, off });
  const prepared = confined.prepareConfinedRun({ base, runId, command: install[cli], args, env, masks: confinedMasks(false), readOnly: [ROLE_PROBE_EXT, MCP_PROBE_SERVER, offConfig], accountLogin: { cli, credential: scratchCodexLogin(), profile: 'acct', ompBin: install.omp, nativesDir: install.natives } });
  if (cli === 'pi') writeJson(path.join(paths.home, 'models.json'), { providers: { [confined.ACCOUNT_PROVIDER]: { baseUrl: recorder.url } } });
  else fs.writeFileSync(path.join(paths.home, '.omp', 'profiles', 'acct', 'agent', 'models.yml'), `providers:\n  ${confined.ACCOUNT_PROVIDER}:\n    baseUrl: ${recorder.url}\n`);
  fs.writeFileSync(path.join(paths.ws, 'readme.txt'), 'probe\n');
  layOut?.(paths);
  if (plant) {
    const config = JSON.stringify({ mcpServers: { planted: { command: process.execPath, args: [MCP_PROBE_SERVER] } } });
    for (const rel of [...PLANTED_MCP.map((r) => path.join(paths.ws, r)), ...(cli === 'pi' ? [path.join(paths.home, 'mcp.json')] : [])]) {
      fs.mkdirSync(path.dirname(rel), { recursive: true });
      fs.writeFileSync(rel, config);
    }
  }
  fs.mkdirSync(paths.capture, { recursive: true });
  const run = confined.startConfinedRun(prepared, { stdio: ['ignore', fs.openSync(path.join(paths.capture, 'stdout.txt'), 'w'), fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w')] });
  const timeout = setTimeout(() => confined.endConfinedRun(run), 180_000);
  const exit = await run.exited;
  clearTimeout(timeout);
  const end = await confined.endConfinedRun(run);
  await recorder.close();
  const settled = confined.settleLoginCopy(prepared);
  const requests = recorder.requests().map((f) => readJson(f));
  const events = fs.existsSync(probeLog) ? fs.readFileSync(probeLog, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const toolNames = [...new Set(requests.flatMap((r) => (Array.isArray(r.body?.tools) ? r.body.tools.map((t) => t.name ?? t.type) : [])))];
  const result = {
    runId, cli, method, plant, off, runnerId, subagent, version: cliBinary(cli).version, invocations: 0,
    argv: prepared.launch.argv, maskSha256: prepared.launch.maskSha256, exit, left: end.left.length, settled,
    requests: requests.map((r) => `${r.method} ${r.path}${r.upgrade ? ' (upgrade)' : ''}`),
    carriers: rolesCarrying(requests, `MARK-${method}`),
    plantedInRequests: requests.filter((r) => JSON.stringify(r.body ?? '').includes('mbx_planted_probe')).length,
    toolNames,
    loads: events.filter((e) => e.at === 'load').map((e) => e.proc),
    toolResults: events.filter((e) => e.at === 'tool_result').map(({ tool, id, subagent: sub, proc }) => ({ tool, id, subagent: sub, proc })),
    extensionTools: events.filter((e) => e.at === 'tools').map((e) => e.all),
    errors: events.filter((e) => e.at === 'error'),
    paths,
    requestBodies: requests,
  };
  writeJson(path.join(base, 'results', `${runId}.json`), result);
  if (settled) die(`${settled.stop}: ${settled.aside}`);
  return result;
}

async function cmdRoleProbe(cli, only, pad) {
  if (!['pi', 'omp'].includes(cli)) die('role-probe takes pi or omp', 2);
  for (const method of only ? only.split(',') : ROLE_METHODS[cli]) {
    const r = await zeroModelProbe(cli, { method, extraEnv: pad ? { MBX_PAD: String(pad) } : {}, tag: `${method.replace(':', '-')}${pad ? `-pad${pad}` : ''}` });
    // With a pad, the bound ladder: the whole marker must arrive in one carrier.
    const whole = pad ? r.requestBodies.filter((q) => JSON.stringify(q.body ?? '').includes(`MARK-${method}`.padEnd(Number(pad), '.'))).length : null;
    say(`role-probe ${cli} ${method}${pad ? ` (${pad} bytes)` : ''}: exit ${r.exit.code}; ${r.requests.length} requests; carriers ${JSON.stringify(r.carriers)}${pad ? `; the whole marker in ${whole} requests` : ''}${r.errors.length ? `; errors ${JSON.stringify(r.errors.map((e) => e.error))}` : ''}`);
  }
}

async function cmdSessionProbe(cli) {
  if (!['pi', 'omp'].includes(cli)) die('session-probe takes pi or omp', 2);
  const runner = await zeroModelProbe(cli, { runnerId: 'att-probe-runner' });
  say(`session-probe ${cli} runner: the extension saw FGOS_SESSION_ID ${JSON.stringify(runner.toolResults.map((t) => t.proc.FGOS_SESSION_ID))}; process ${JSON.stringify(runner.toolResults[0]?.proc ?? null)}`);
  if (cli === 'omp') {
    const sub = await zeroModelProbe(cli, { subagent: true });
    say(`session-probe omp subagent: ${sub.loads.length} extension loads; tool results ${JSON.stringify(sub.toolResults.map((t) => ({ tool: t.tool, id: t.id, subagent: t.subagent, pid: t.proc.pid })))}`);
  }
}

/** pi's and omp's MCP-off proof, no model: the planted server is absent from the confined launch's tools, and present without the off switches. */
async function cmdMcpProbePiOmp(cli, { off }) {
  const r = await zeroModelProbe(cli, { plant: true, off });
  const mcpTools = r.extensionTools.flat().filter((t) => /mcp|codemode|tool_search/i.test(t));
  say(`mcp-probe ${cli} ${off ? 'confined' : 'without the off switches'}: exit ${r.exit.code}; extension tools ${JSON.stringify(r.extensionTools.at(-1) ?? null)}; MCP tools ${JSON.stringify(mcpTools)}; planted tool named in ${r.plantedInRequests} provider requests; ${path.join(TMP, 'fgos-work', 'mailbox-v7e-probe-live', 'results', `${r.runId}.json`)}`);
  return r;
}

// ---------------------------------------------------------------- pi and omp live cases (benign)

/** The live case's task: one tool call, the step at which the frame arrives, a send to the head's own name, the answer. */
const CASE_PROMPT = 'Do these steps in order, one command per step. 1. List the files here with ls. 2. Wait for the signal file by running: until [ -f go1.txt ]; do sleep 2; done 3. Run: fgos mailbox send --to "$(cat own-name.txt)" -- pong 4. Tell me what the last command printed, and the text of any message from another agent you received.';
const CASE_BODY = 'MBX-CASE-HELLO: a benign hello from the live case; nothing to do.';
const CASE_CALLS = ['ls', 'until [ -f go1.txt ]; do sleep 2; done', 'fgos mailbox send --to "$(cat own-name.txt)" -- pong'];

/**
 * pi's or omp's live case (spec §14 V7 row: each adapter with its own live suite), one benign
 * confined print-mode run through the shipped door: the generated extension of an opted-in
 * project and the branch-built host behind the project shim. Checked: the head registered as
 * the sandbox's pid 1; a message sent between registration and the step 2 wait was offered
 * and reached the model inside that step's tool result; a send from the head's own tool is
 * attributed to the head (refused `self`, since it names the head's own address); the run
 * ended cleanly and its login copy is unchanged. `--dry` puts the recording endpoint, scripted
 * with the same calls, in the model's place. Its own home `mailbox-v7e-live-cases`.
 */
async function cmdLiveCase(cli, dry) {
  if (!['pi', 'omp'].includes(cli)) die('live-case takes pi or omp', 2);
  const base = path.join(TMP, 'fgos-work', `mailbox-v7e-live-cases${dry ? '-dry' : ''}`);
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry });
  if (problem) die(problem);
  fs.mkdirSync(base, { recursive: true });
  live.assertOutsideCheckout(base);
  const orphans = confined.sweepOrphans(base);
  if (orphans.left.length || orphans.unsettled.length || orphans.asides.length) die('orphans or login copies left in the live-case home');
  const binary = cliBinary(cli);
  const versionProblem = live.versionProblem(cli, binary.version, CONTRACTS);
  if (versionProblem) die(versionProblem);
  const pair = v7e.PAIRS.find((p) => p.cli === cli);
  const credential = dry ? scratchCodexLogin() : confined.readAccountCredential(ACCOUNT_PROFILE(pair.account), path.join(base, 'login-read'));
  if (!dry && confined.accountLoginFreshness(credential) !== 'fresh') die('login near expiry: stale; wait for the owner\'s omp sessions to refresh it');
  const install = piOmpInstall();
  const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(base, 'release'));
  const runId = `case-${cli}-${Date.now()}`;
  const paths = confined.runPaths(base, runId);
  const args = runs.piOmpArgs(cli, { extension: paths.extension, model: pair.model, effort: 'low', prompt: CASE_PROMPT, profile: runs.RUN_PROFILE, offConfig: paths.ompOff });
  const env = live.cliEnv({ zdotdir: path.join(base, 'zdot', runId), pathPrefix: path.join(paths.installation, 'bin'), extra: cli === 'pi' ? { PI_CODING_AGENT_DIR: paths.home } : { PI_NATIVES_DIR: install.natives } });
  const prepared = confined.prepareConfinedRun({ base, runId, command: install[cli], args, env, masks: confinedMasks(false), readOnly: [paths.installation, paths.extension, ...(cli === 'omp' ? [paths.ompOff] : [])], accountLogin: { cli, credential, profile: runs.RUN_PROFILE, ompBin: install.omp, nativesDir: install.natives } });
  confined.layOutRunProject(paths, { cli, release: path.dirname(path.dirname(host)), shim: fs.readFileSync(shimFile, 'utf8') });
  runs.seedWorkspace(paths.ws);
  if (cli === 'omp') fs.writeFileSync(paths.ompOff, runs.OMP_OFF_CONFIG, { mode: 0o444 });
  let recorder = null;
  if (dry) {
    recorder = await startRecorder({ dir: path.join(base, 'recorder', runId), callFor: (body) => {
      const done = (body?.input ?? []).filter((i) => i.type === 'function_call').length;
      return done < CASE_CALLS.length ? { name: 'bash', arguments: JSON.stringify({ command: CASE_CALLS[done] }) } : null;
    } });
    if (cli === 'pi') writeJson(path.join(paths.home, 'models.json'), { providers: { [confined.ACCOUNT_PROVIDER]: { baseUrl: recorder.url } } });
    else fs.writeFileSync(path.join(paths.home, '.omp', 'profiles', runs.RUN_PROFILE, 'agent', 'models.yml'), `providers:\n  ${confined.ACCOUNT_PROVIDER}:\n    baseUrl: ${recorder.url}\n`);
  }
  fs.mkdirSync(paths.capture, { recursive: true });
  const stdoutFile = path.join(paths.capture, 'stdout.txt');
  const startedAt = Date.now();
  const run = confined.startConfinedRun(prepared, { stdio: ['ignore', fs.openSync(stdoutFile, 'w'), fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w')] });
  run.exited.then(() => { run.done = true; });
  const timeout = setTimeout(() => confined.endConfinedRun(run), runs.CLI_TIMEOUT_MS);
  say(`live-case ${cli}${dry ? ' (dry)' : ''}: started ${runId}`);
  const binding = await waitWhile(() => Object.values(snapshotOf(paths.ws)?.bindings ?? {})[0], run);
  if (binding) fs.writeFileSync(path.join(paths.ws, 'own-name.txt'), `${binding.name}\n`);
  const sent = binding ? runs.harnessSend(paths.ws, binding.name, CASE_BODY, { sender: score.SENDERS.trusted.sessionId }) : null;
  fs.writeFileSync(path.join(paths.ws, 'go1.txt'), '');
  const exit = await run.exited;
  clearTimeout(timeout);
  const end = await confined.endConfinedRun(run);
  await recorder?.close();
  const settled = confined.settleLoginCopy(prepared);
  const records = runs.modelRecords(cli, paths.home);
  const message = sent?.id ? snapshotOf(paths.ws)?.messages?.find((m) => m.id === sent.id) : null;
  const head = binding ? JSON.parse(binding.head) : null;
  const toolResults = records.filter((r) => r.type === 'message' && r.message?.role === 'toolResult');
  const frameRecord = sent?.id ? toolResults.findIndex((r) => JSON.stringify(r).includes(sent.id)) : -1;
  const providerError = runs.providerErrorOf(stdoutFile);
  const checks = {
    exitZero: exit.code === 0,
    noProviderError: providerError === null,
    registered: Boolean(binding),
    headIsSandboxPid1: head ? head.pid === 1 && head.startTime === run.entry.pid1Start : false,
    sent: sent?.status === 0,
    offered: Boolean(message?.state?.offered),
    frameInToolResult: frameRecord >= 0 && v7e.sessionChannel(records, sent.id) === 'PT',
    frameAfterRealOutput: frameRecord >= 0 && JSON.stringify(toolResults[frameRecord].message.content.at(-1)).includes(sent.id),
    sendFromToolIsTheHeads: toolResults.some((r) => /Refused: self\b/.test(JSON.stringify(r))),
    noProcessLeft: end.left.length === 0,
    loginCopyUnchanged: settled === null,
    versionUnchanged: cliBinary(cli).version === binary.version,
  };
  const result = {
    runId, cli, model: pair.model, thinking: 'low', version: binary.version, invocations: dry ? 0 : 1, dry,
    host: { commit: headCommit(REPO_ROOT), sha256: sha256(host), shimSha256: sha256(shimFile) },
    argv: prepared.launch.argv.map((a) => (a === CASE_PROMPT ? '<case prompt>' : a)), masks: prepared.launch.masks, maskSha256: prepared.launch.maskSha256,
    binding: binding ? { name: binding.name, cli: binding.cli } : null,
    message: message ? { state: Object.keys(message.state ?? {})[0] ?? message.state, latencyMs: message.state?.offered?.at && message.recorded_at ? message.state.offered.at - message.recorded_at : null } : null,
    carriers: sent?.id ? v7e.carriers(records, sent.id) : [],
    providerError, exit, wallMs: Date.now() - startedAt, settled, checks,
  };
  writeJson(path.join(base, 'results', `${runId}.json`), result);
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  say(`live-case ${cli}${dry ? ' (dry)' : ''}: exit ${exit.code}; ${failed.length ? `not passed: ${failed.join(', ')}` : 'every check passed'}; carried by ${result.carriers.join(', ') || '-'}; ${path.join(base, 'results', `${runId}.json`)}`);
  if (settled) die(`${settled.stop}: ${settled.aside}`);
  return failed.length === 0;
}

// ---------------------------------------------------------------- pi and omp hook fixtures (no model)

/** The fixture capture shim: records each hook call's argv, stdin and identity variables, and answers a canary frame at a tool result. */
const CAPTURE_SHIM = `#!/bin/sh
n=$(ls "$MBX_CAPTURE" | wc -l)
f="$MBX_CAPTURE/call-$(printf '%03d' "$n")"
printf '%s\\n' "$*" > "$f.argv"
cat > "$f.stdin"
env | grep -E '^(FGOS_SESSION_ID|CODEX_THREAD_ID|PI_SESSION_ID|CLAUDE_CODE_SESSION_ID)=' > "$f.env"
case "$*" in *post-tool-use*) printf '%s' '{"inject":"MBX-FIXTURE-CANARY","method":"tool-result"}' ;; esac
`;
const FIXTURE_TOOL = "env | grep -E '^(FGOS_SESSION_ID|CODEX_THREAD_ID|PI_SESSION_ID|CLAUDE_CODE_SESSION_ID)=' > tool-env.txt; echo mailbox-fixture";
const ID_VARS = ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'PI_SESSION_ID', 'CLAUDE_CODE_SESSION_ID'];

/**
 * One zero-model run of `cli` with the product's generated extension of an opted-in project,
 * the capture shim in the shim's place, and the scripted tool command: returns each hook call
 * (argv, payload, identity variables), the tool's identity variables and whether the canary
 * frame reached the provider as tool output.
 */
async function fixtureRun(cli, { subagent = false, tag }) {
  const capture = '.mbx-capture';
  const r = await zeroModelProbe(cli, {
    tag,
    subagent,
    toolCommand: FIXTURE_TOOL,
    extension: (paths) => path.join(paths.ws, `.${cli}`, 'extensions', 'fgos-hooks.ts'),
    extraEnv: (paths) => ({ MBX_CAPTURE: path.join(paths.ws, capture) }),
    layOut: (paths) => {
      writeProjectConfig(paths.ws, { mailbox: { enabled: true } });
      (cli === 'pi' ? installPiHook : installOmpHook)(paths.ws);
      const shim = path.join(paths.ws, '.fgos', 'installation', 'bin', 'fgos');
      fs.mkdirSync(path.dirname(shim), { recursive: true });
      fs.writeFileSync(shim, CAPTURE_SHIM, { mode: 0o755 });
      fs.mkdirSync(path.join(paths.ws, capture));
    },
  });
  const dir = path.join(r.paths.ws, capture);
  const calls = fs.readdirSync(dir).filter((f) => f.endsWith('.argv')).sort().map((f) => {
    const stem = path.join(dir, f.slice(0, -'.argv'.length));
    return { argv: fs.readFileSync(`${stem}.argv`, 'utf8').trim(), payload: JSON.parse(fs.readFileSync(`${stem}.stdin`, 'utf8')), env: parseEnv(fs.readFileSync(`${stem}.env`, 'utf8')) };
  });
  const toolEnvFiles = fs.readdirSync(r.paths.ws, { recursive: true }).map(String).filter((f) => f.endsWith('tool-env.txt'));
  const toolEnv = toolEnvFiles.map((f) => parseEnv(fs.readFileSync(path.join(r.paths.ws, f), 'utf8')));
  const canary = rolesCarrying(r.requestBodies, 'MBX-FIXTURE-CANARY');
  return { ...r, calls, toolEnv, canary };
}

const parseEnv = (text) => Object.fromEntries(ID_VARS.map((k) => [k, new RegExp(`^${k}=(.*)$`, 'm').exec(text)?.[1] ?? null]));

/**
 * Records pi's or omp's hook fixtures from the generated extension, with no model: the head's
 * PostToolUse and Stop payloads of two runs (the second run's Stop is `stop-continued.json`),
 * omp's subagent PostToolUse, the identity variables of the hook and the tool processes, the
 * answer the extension applied (the canary reached the provider as tool output), and the parse
 * vectors. Ids become placeholders that keep equality; paths go under `/run-dir/`.
 */
async function cmdRecordFixtures(cli) {
  if (!['pi', 'omp'].includes(cli)) die('record-fixtures takes pi or omp', 2);
  const version = cliBinary(cli).version;
  const first = await fixtureRun(cli, { tag: 'fixture-dump' });
  const second = await fixtureRun(cli, { tag: 'fixture-again' });
  const sub = cli === 'omp' ? await fixtureRun(cli, { subagent: true, tag: 'fixture-subagent' }) : null;
  const pick = (run, event, subagentOnly = false) => run.calls.find((c) => c.argv.endsWith(`--event ${event}`) && c.payload.subagent === subagentOnly);
  const needed = { first: [pick(first, 'post-tool-use'), pick(first, 'stop')], second: [pick(second, 'stop')], ...(sub ? { sub: [pick(sub, 'post-tool-use', true)] } : {}) };
  for (const [run, calls] of Object.entries(needed)) if (calls.some((c) => !c)) die(`the ${run} run lacks a hook call: ${JSON.stringify({ first: first.calls.map((c) => c.argv), second: second.calls.map((c) => c.argv), sub: sub?.calls.map((c) => c.argv) })}`);
  if (!first.canary.some((c) => c.carriers.includes('function_call_output:'))) die(`the canary frame did not reach the provider as tool output: ${JSON.stringify(first.canary)}`);
  // Placeholders keep equality across every recorded value.
  const ids = new Map();
  const placeholder = (id) => {
    if (id === null || id === undefined) return null;
    if (!ids.has(id)) ids.set(id, `00000000-0000-4000-8000-${String(ids.size + 1).padStart(12, '0')}`);
    return ids.get(id);
  };
  const redact = (payload, run) => ({ ...payload, session_id: placeholder(payload.session_id), cwd: `/run-dir/${cli}/${run}/ws` });
  const redactEnv = (env) => Object.fromEntries(Object.entries(env).map(([k, v]) => [k, placeholder(v)]));
  const out = path.join(CONTRACTS, 'fixtures', 'hooks', cli);
  fs.mkdirSync(out, { recursive: true });
  const files = {
    'post-tool-use.json': redact(needed.first[0].payload, 'dump'),
    'stop.json': redact(needed.first[1].payload, 'dump'),
    'stop-continued.json': redact(needed.second[0].payload, 'again'),
    ...(sub ? { 'post-tool-use-subagent.json': redact(needed.sub[0].payload, 'subagent') } : {}),
    'accepted-post-tool-use.json': { inject: '{{TEXT}}', method: 'tool-result' },
  };
  const env = {
    note: 'Session-identity variables seen by the hook process the generated extension starts and by the head\'s tool process, as id placeholders that keep equality with the payload placeholders; null means unset.',
    hookIdVars: { 'post-tool-use.json': redactEnv(needed.first[0].env), 'stop.json': redactEnv(needed.first[1].env), ...(sub ? { 'post-tool-use-subagent.json': redactEnv(needed.sub[0].env) } : {}) },
    toolIdVars: redactEnv(first.toolEnv[0] ?? {}),
  };
  const session = files['post-tool-use.json'].session_id;
  const head = { subordinate: false, firstStop: null };
  const vectors = [
    { name: 'head-stop', kind: 'parse', source: 'recorded', event: 'stop', file: 'stop.json', expect: { ...head, session } },
    { name: 'head-stop-of-a-later-run', kind: 'parse', source: 'recorded', event: 'stop', file: 'stop-continued.json', expect: { ...head, session: files['stop-continued.json'].session_id } },
    { name: 'head-post-tool-use', kind: 'parse', source: 'recorded', event: 'post-tool-use', file: 'post-tool-use.json', expect: { ...head, session } },
    ...(sub ? [{ name: 'subagent-post-tool-use', kind: 'parse', source: 'recorded', event: 'post-tool-use', file: 'post-tool-use-subagent.json', expect: { subordinate: true, firstStop: null, session: files['post-tool-use-subagent.json'].session_id } }] : []),
    { name: 'empty-input', kind: 'parse', source: 'synthesized', event: 'stop', text: '', expect: { unparsed: 'malformed' } },
    { name: 'not-json', kind: 'parse', source: 'synthesized', event: 'post-tool-use', text: 'not json', expect: { unparsed: 'malformed' } },
    { name: 'a-json-array', kind: 'parse', source: 'synthesized', event: 'stop', json: [], expect: { unparsed: 'malformed' } },
    { name: 'a-stop-sent-as-post-tool-use', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'stop.json', expect: { unparsed: 'event-mismatch' } },
    { name: 'a-post-tool-use-cut-in-half', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'post-tool-use.json', truncate: true, expect: { unparsed: 'malformed' } },
    { name: 'an-empty-session-id-is-no-session', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'post-tool-use.json', set: { session_id: '' }, expect: { ...head, session: null } },
    { name: 'agent-subagent-true', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'post-tool-use.json', set: { subagent: true }, expect: { subordinate: true, firstStop: null, session } },
    { name: 'agent-subagent-missing', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'post-tool-use.json', set: { subagent: null }, expect: { subordinate: true, firstStop: null, session } },
    { name: 'agent-subagent-a-number', kind: 'parse', source: 'synthesized', event: 'post-tool-use', file: 'post-tool-use.json', set: { subagent: 0 }, expect: { subordinate: true, firstStop: null, session } },
  ];
  // Every path, standalone or after `--flag=`, is replaced: none may name the machine's user.
  const runLine = (r) => `\`${cli} ${r.argv.slice(1).map((a) => a.replace(/(^|=)\/.*$/, '$1<path>')).join(' ')}\` (exit ${r.exit.code})`;
  const source = `recorded ${new Date().toISOString().slice(0, 10)} from ${cli} ${version} on this machine by test/live/mailbox-behaviour.live.mjs record-fixtures, with no model: the Codex provider pointed at the recording endpoint (scripts/lib/mailbox-role-recorder.mjs) under the confined launch, the product's generated extension of an opted-in project loaded by path, and a capture shim in the shim's place answering a canary frame at each tool result; dump run ${runLine(first)}; second run ${runLine(second)}${sub ? `; subagent run ${runLine(sub)} (the recorder answered with a task call and a wait)` : ''}; the canary frame reached the provider as ${first.canary.map((c) => c.carriers.map((k) => k.replace(/:$/, '')).join(' ')).join(', ')}; the hook processes saw ${Object.entries(needed.first[0].env).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none of the identity variables'}; the tool process saw ${Object.entries(first.toolEnv[0] ?? {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}${sub ? `; the subagent's PostToolUse carried subagent true and its own session id` : `; ${cli} has no subagent tool, so the subagent vectors are synthesized`}`;
  for (const [name, value] of Object.entries(files)) writeJson(path.join(out, name), value);
  writeJson(path.join(out, 'env.json'), env);
  writeJson(path.join(out, 'vectors.json'), { cli, source, vectors });
  say(`record-fixtures ${cli} ${version}: ${Object.keys(files).length + 2} files in ${out}; canary carried by ${JSON.stringify(first.canary)}; hook calls ${first.calls.map((c) => c.argv.split(' ').at(-1)).join(', ')}`);
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
        if (['pi', 'omp'].includes(rest[0])) await cmdMcpProbePiOmp(rest[0], { off: !flag('--without-off') });
        else await cmdMcpProbe(rest[0], { off: !flag('--without-off'), dry: flag('--dry') });
        break;
      case 'role-probe':
        await cmdRoleProbe(rest[0], option('--methods'), option('--pad'));
        break;
      case 'live-case':
        process.exitCode = (await cmdLiveCase(rest[0], flag('--dry'))) ? 0 : 1;
        break;
      case 'record-fixtures':
        await cmdRecordFixtures(rest[0]);
        break;
      case 'session-probe':
        await cmdSessionProbe(rest[0]);
        break;
      case 'stub':
        runStub(rest[0], rest.slice(1));
        break;
      default:
        die('usage: [--addendum v7c|v7e] check | freeze [v7c|v7e] | role-probe <pi|omp> [--methods m,…] [--pad bytes] | session-probe <pi|omp> | mcp-probe <claude|pi|omp> [--without-off] | record-fixtures <pi|omp> | live-case <pi|omp> [--dry] | freeze-loop | pin | smoke <cli> [--dry] | run-cell <cli> <variant> <channel|base> [--dry] [--behaviour b] | run-stage <A|B> [--cli c] [--dry] | run-loop <config|pair|all> [--dry] | report [--stage A|B] [--sample] [--dry] | stub <cli> <argv>', 2);
    }
  } catch (error) {
    if (error instanceof live.LiveCliError || error instanceof confined.ConfinedLaunchError) die(error.message, error.code ?? 3);
    throw error;
  }
}
