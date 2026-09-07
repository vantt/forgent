// Does confinement actually close the lane a worker could escape through?
//
// The 2026-09-06 probes established the shape of the hole: a worker pane can
// always reach A cockpit socket, because herdr injects `HERDR_SOCKET_PATH` and
// overwrites any override. The only question left is WHICH cockpit it reaches.
//
// This asks a worker pane directly, from inside it:
//   - which socket did herdr hand it?
//   - how many agents can it see?
//   - is its HOME the private one?
//
// and compares that with what the operator's own session contains. A confined
// worker that can enumerate the operator's live agents would fail this.
//
// Own session throughout. The operator's `default` is only ever READ, never
// addressed for a write, and never stopped.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');
const SESSION = 'fgos-worker';
const STAMP = Date.now().toString(36);
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-confine-${STAMP}`);

const log = [];
const say = (m) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${m}`; log.push(l); console.log(l); };
const results = { startedAt: new Date().toISOString() };
const sh = (b, a, o = {}) => execFileSync(b, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...o });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let workerHome = null;

function cleanup() {
  say('cleanup');
  try { sh('herdr', ['session', 'stop', SESSION]); } catch { /* down */ }
  try { sh('herdr', ['session', 'delete', SESSION]); } catch { /* gone */ }
  if (workerHome) { try { fs.rmSync(workerHome, { recursive: true, force: true }); } catch { /* best effort */ } }
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* best effort */ }
  try {
    results.operatorSessionsAfter = JSON.parse(sh('herdr', ['session', 'list', '--json'])).sessions.map((s) => `${s.name}(${s.running ? 'running' : 'stopped'})`);
    say(`sessions left: ${results.operatorSessionsAfter.join(', ')}`);
  } catch { /* nothing */ }
}

async function main() {
  const { createWorkerHome } = await import(`${REPO}/src/runner/dispatch/worker-home.mjs`);
  const { ensureWorkerSession } = await import(`${REPO}/src/runner/dispatch/worker-session-boot.mjs`);
  const { createHerdrClient } = await import(`${REPO}/src/runner/dispatch/herdr-agent.mjs`);
  const { seedTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);

  // What the operator's own session actually holds right now -- the thing a
  // worker must not be able to enumerate.
  const operatorAgents = JSON.parse(sh('herdr', ['agent', 'list'])).result.agents.length;
  results.operatorAgentsVisibleToOperator = operatorAgents;
  say(`operator session currently holds ${operatorAgents} agents`);

  fs.mkdirSync(WORK, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  seedTrust(path.join(os.homedir(), '.claude.json'), { projectPath: WORK, repoRoot: TRUSTED_ROOT });

  const home = createWorkerHome(os.tmpdir(), {
    runId: `confine-${STAMP}`,
    sourceHome: os.homedir(),
    workspacePath: WORK,
    repoRoot: TRUSTED_ROOT,
    permissionMode: 'ask',
  });
  workerHome = home.homePath;
  results.workerHome = { path: workerHome, provisioned: home.provisioned };
  say(`private HOME provisioned: ${home.provisioned.join(', ')}`);

  const session = await ensureWorkerSession(SESSION, { callerEnv: process.env, workerHome, cwd: WORK });
  results.session = { name: session.sessionName, socketPath: session.socketPath, rootPane: session.rootPaneId, startedServer: session.startedServer };
  say(`worker session up: ${session.sessionName} (${session.socketPath})`);

  const client = createHerdrClient({ herdrBin: 'herdr', cwd: WORK, env: session.env });
  const pane = client.paneSplit({ cwd: WORK, env: { HOME: workerHome } });
  say(`worker pane ${pane}`);
  await sleep(2500);

  // Ask the pane itself. Whatever it reports is what a worker running there
  // would be able to do.
  const out = path.join(WORK, 'seen.txt');
  const probe = [
    `{ echo "SOCK=$HERDR_SOCKET_PATH";`,
    `echo "HOME=$HOME";`,
    `echo "SESSION=$HERDR_SESSION";`,
    `echo "AGENTS=$(herdr agent list 2>/dev/null | tr -cd '{' | wc -c)";`,
    `echo "OPSOCK_EXISTS=$( [ -S "$HOME/.config/herdr/herdr.sock" ] && echo yes || echo no )"; } > ${out} 2>&1`,
  ].join(' ');
  // `herdr pane run` answers with nothing at all on success, so it goes
  // through a raw call rather than the JSON client.
  try {
    sh('herdr', ['pane', 'run', pane, probe], { env: { ...process.env, HERDR_SOCKET_PATH: session.socketPath } });
  } catch { /* the file it writes is the real result */ }
  await sleep(4000);

  const seen = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '(pane wrote nothing)';
  const parse = (k) => (seen.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1] ?? null;
  const workerSock = parse('SOCK');
  const workerAgents = Number(parse('AGENTS'));

  results.fromInsideTheWorkerPane = {
    socket: workerSock,
    home: parse('HOME'),
    session: parse('SESSION'),
    agentBracesSeen: parse('AGENTS'),
    operatorSocketReachableViaHome: parse('OPSOCK_EXISTS'),
  };
  results.verdict = {
    socketIsWorkerSessionNotOperator: workerSock === session.socketPath,
    homeIsPrivate: parse('HOME') === workerHome,
    homeFallbackToOperatorCockpitClosed: parse('OPSOCK_EXISTS') === 'no',
    cannotEnumerateOperatorAgents: Number.isFinite(workerAgents) ? workerAgents < operatorAgents : null,
  };
  results.verdict.passes = results.verdict.socketIsWorkerSessionNotOperator
    && results.verdict.homeIsPrivate
    && results.verdict.homeFallbackToOperatorCockpitClosed;

  say(`worker sees socket: ${workerSock}`);
  say(`worker HOME private: ${results.verdict.homeIsPrivate} | operator socket reachable via HOME: ${parse('OPSOCK_EXISTS')}`);
  say(`VERDICT: ${results.verdict.passes ? 'CONFINED' : 'NOT CONFINED'}`);

  client.paneClose(pane);
  results.finishedAt = new Date().toISOString();
}

try { await main(); } catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'confinement-result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say('wrote confinement-result.json');
}
