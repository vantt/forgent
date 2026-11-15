#!/usr/bin/env node
/**
 * test/live/mailbox-behaviour-ack.live.mjs
 *
 * The behaviour check of the mailbox frame's acknowledgement line (scripts/lib/mailbox-behaviour-ack.mjs):
 * real Claude Code and Codex heads, each confined by the same bwrap driver the behaviour suite uses
 * (scripts/lib/mailbox-live-confined.mjs), reached through the shim of a host built from this checkout.
 * Chosen by name, never part of `npm test`. Every run spends the owner's model quota: two CLI
 * processes, one ledger entry each, never retried; the ledger is checked against the ceiling
 * before each start.
 *
 *   build                         builds the host and the shim of this checkout into <base>/release
 *   run <claude|codex> <n> [--from <iso>] [--until <iso>]
 *                                 the next n runs of that CLI in the plan's interleaved order
 *                                 (info, work, control); refuses before --from and past --until
 *   report                        the numbers per CLI and scenario from <base>/results.jsonl
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-ack-live, outside every git checkout.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';
import * as confined from '../../scripts/lib/mailbox-live-confined.mjs';
import * as runs from '../../scripts/lib/mailbox-behaviour-run.mjs';
import * as score from '../../scripts/lib/mailbox-behaviour-score.mjs';
import * as ack from '../../scripts/lib/mailbox-behaviour-ack.mjs';
import { buildHost, targetDir } from './mailbox-behaviour.live.mjs';
import { ensureAddonForScript } from '../../scripts/lib/git-addon-stage.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const BASE = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', 'mailbox-ack-live');
const DATA = path.join(REPO_ROOT, 'test', 'live', 'mailbox-behaviour');
const INSTRUCTION = path.join(REPO_ROOT, 'test', 'live', 'mailbox-behaviour-receiver-instruction.v3.txt');
const RESULTS = path.join(BASE, 'results.jsonl');
/** The real CLI starts this check may spend, both heads of every run included. */
const CEILING = 200;
const MIN_FREE_GB = 8;
const CODEX_TEST_ACCOUNT = 'tetnu';
const CODEX_EFFORT = 'low';

const say = (text) => process.stdout.write(`${text}\n`);
function die(message, code = 3) {
  process.stderr.write(`mailbox-behaviour-ack.live: ${message}\n`);
  process.exit(code);
}
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function cliBinary(cli) {
  const bin = fs.realpathSync(path.join(os.homedir(), '.local', 'bin', cli));
  const version = live.semver(spawnSync(bin, ['--version'], { encoding: 'utf8' }).stdout);
  return { bin, version, release: cli === 'codex' ? path.dirname(path.dirname(bin)) : null };
}

function cmdBuild() {
  const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB, dry: true });
  if (problem) die(problem);
  fs.mkdirSync(BASE, { recursive: true });
  const { host, shimFile } = buildHost(REPO_ROOT, targetDir(REPO_ROOT), path.join(BASE, 'release'));
  fs.writeFileSync(path.join(BASE, 'host.json'), `${JSON.stringify({ commit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim(), host, hostSha256: sha256(host), shimSha256: sha256(shimFile) }, null, 2)}\n`);
  say(`built ${host} ${sha256(host)}`);
}

/** The run context: this checkout's host, the pinned-by-realpath CLIs, the owner's Claude login and the Codex test account. */
function context() {
  live.assertOutsideCheckout(BASE);
  const hostFile = path.join(BASE, 'host.json');
  if (!fs.existsSync(hostFile)) die('no host; run build first');
  const built = JSON.parse(fs.readFileSync(hostFile, 'utf8'));
  if (!fs.existsSync(built.host) || sha256(built.host) !== built.hostSha256) die('the built host changed; run build again');
  const clis = Object.fromEntries(ack.CLIS.map((c) => [c, cliBinary(c)]));
  const allow = [clis.codex.release, clis.claude.bin, path.dirname(path.dirname(process.execPath))];
  const instruction = fs.readFileSync(INSTRUCTION, 'utf8');
  return {
    base: BASE,
    resultsFile: RESULTS,
    data: ack.dataFor({ sideWork: fs.readFileSync(path.join(DATA, 'side-work.txt'), 'utf8'), instruction }),
    masks: confined.maskPlan({ allow }),
    release: path.dirname(path.dirname(built.host)),
    shim: fs.readFileSync(path.join(BASE, 'release', 'shim-fgos'), 'utf8'),
    hostSha256: built.hostSha256,
    cliBin: Object.fromEntries(Object.entries(clis).map(([c, v]) => [c, [v.bin]])),
    versions: Object.fromEntries(Object.entries(clis).map(([c, v]) => [c, v.version])),
    login: { claude: { cli: 'claude', home: os.homedir(), account: 'owner' }, codex: { cli: 'codex', home: live.accountHome('codex', CODEX_TEST_ACCOUNT), account: CODEX_TEST_ACCOUNT } },
    models: score.MODELS,
    effort: CODEX_EFFORT,
  };
}

/** The runs of `cli` in the plan's interleaved order: one of each cell still owed, round by round. */
export function schedule(cli, results) {
  const done = (cell) => results.filter((r) => r.cli === cli && r.scenario === cell.scenario && (r.arm ?? 'with-instruction') === ack.armOf(cell)).length;
  const order = [];
  for (let round = 0; round < Math.max(...ack.PLAN.map((c) => c.n)); round += 1) {
    for (const cell of ack.PLAN) if (round < cell.n) order.push({ cli, scenario: cell.scenario, instruction: cell.instruction, n: round + 1 });
  }
  return order.filter((o) => o.n > done(o));
}

async function cmdRun(cli, count, { from, until }) {
  if (!ack.CLIS.includes(cli) || !(count > 0)) die('usage: run <claude|codex> <n> [--from <iso>] [--until <iso>]', 2);
  if (from && Date.now() < Date.parse(from)) die(`before ${from}: live runs start only inside the quiet window`);
  const ctx = context();
  const { left, asides, unsettled } = confined.sweepOrphans(BASE);
  if (left.length || asides.length || unsettled.length) die(`orphans left: ${JSON.stringify({ left, asides, unsettled })}`);
  const todo = schedule(cli, runs.readResults(RESULTS)).slice(0, count);
  for (const { scenario, instruction, n } of todo) {
    if (until && Date.now() >= Date.parse(until)) {
      say(`stopped at ${until}`);
      return;
    }
    const ceiling = runs.ceilingProblem(BASE, CEILING);
    if (ceiling) die(`ceiling: ${ceiling}`);
    const problem = live.resourceProblem({ minFreeGb: MIN_FREE_GB });
    if (problem) die(`memory: ${problem}`);
    try {
      await confined.waitForFreshLogin(ctx.login[cli]);
    } catch (error) {
      die(`login: ${error.message}`);
    }
    const started = new Date().toISOString();
    const { line, stop } = await ack.runPair(ctx, { cli, scenario, instruction }, `ack.${cli}.${scenario}${instruction ? '' : '-frameonly'}.${String(n).padStart(3, '0')}`);
    say(`${started} ${line.runId}: ${line.endReason}; request ${line.requestSent}, acked ${line.acked}, ack reached ${line.ackReached}, sender silent ${line.senderSilent}, ${line.totalMessages} messages, cost ${line.usage?.costUsd ?? 'n/a'}`);
    if (stop) die(stop);
  }
}

function cmdReport() {
  const lines = runs.readResults(RESULTS);
  for (const r of ack.summarize(lines)) {
    const pct = ([lo, hi]) => `${Math.round(lo * 100)}-${Math.round(hi * 100)}%`;
    say(`${r.cli}/${r.scenario}/${r.arm}: runs ${r.runs} (errors ${r.errors}), valid ${r.valid}; acked ${r.acked}/${r.valid} ${pct(r.ackedCi)}; ack reached sender ${r.reached}; sender silent ${r.silentOfReached}/${r.reached} ${pct(r.silentCi)}; ack-on-ack ${r.ackOnAck}; invocations ${r.invocations}; cost ${r.costUsd.toFixed(3)} usd`);
  }
}

const [command, ...rest] = process.argv.slice(2);
const option = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : null);
if (process.argv[1] === SCRIPT) {
  ensureAddonForScript(process.env, REPO_ROOT);
  try {
    if (command === 'build') cmdBuild();
    else if (command === 'run') await cmdRun(rest[0], Number(rest[1]), { from: option('--from'), until: option('--until') });
    else if (command === 'report') cmdReport();
    else die('usage: build | run <claude|codex> <n> | report', 2);
  } catch (error) {
    die(error.stack ?? String(error), error.code ?? 1);
  }
}
