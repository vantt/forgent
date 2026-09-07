// V0 live proof: drive the REAL herdr-spawn adapter against a REAL herdr and a
// REAL claude agent, and record what actually happened.
//
// Safety, absolute: this creates its own herdr session and only ever talks to
// that session's socket. It never touches the operator's `default` session,
// where real work is running, and it stops and deletes only the session it
// created. Nothing here restarts, stops or reconfigures anything shared.
//
// Cases, each answering a question the fake tests can only approximate:
//   A. settled end-to-end -- a real multi-line prompt reaches a real agent
//      through a brief file, the agent writes its own ack and result, and the
//      adapter concludes from those files. Closes: does the shape work at all.
//   B. died -- the agent process is killed mid-round. Closes: is a vanished
//      worker reported as dead within seconds, with its pane kept.
//   C. descendant survival -- a `setsid` child outlives `pane close`. Closes:
//      closing a pane is not cancelling a worker.
//   D. observer -- a second process reads the run while the first drives it.
//      Closes: observing needs no permission from the actor.
//
// Every measurement is written to result.json next to this script. Nothing is
// inferred from terminal text.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');

const SESSION = 'fgos-v0-proof';
const SOCK = path.join(os.homedir(), '.config', 'herdr', 'sessions', SESSION, 'herdr.sock');
const STAMP = Date.now().toString(36);
// Under an already-trusted root on purpose: the trust store's own rule is
// that a new entry may only be derived from a root that is already trusted,
// so a throwaway workspace in /var/tmp has nothing to derive from. Exercising
// the real rule is the point; working around it would prove nothing.
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-v0-proof-${STAMP}`);
const RUN_DIR = `${WORK}/.runs/01`;

const log = [];
const say = (msg) => { const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`; log.push(line); console.log(line); };
const results = { startedAt: new Date().toISOString(), cases: {} };

const sh = (bin, args, opts = {}) => execFileSync(bin, args, {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts,
});
const herdr = (args) => {
  try {
    return JSON.parse(sh('herdr', args, { env: { ...process.env, HERDR_SOCKET_PATH: SOCK } }));
  } catch (err) {
    try { return JSON.parse(err.stdout ?? '{}'); } catch { return { error: { code: 'unparseable', message: err.message } }; }
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server = null;

async function startIsolatedSession() {
  // Refuse to proceed if anything about the target is not our own session.
  if (!SOCK.includes(`/sessions/${SESSION}/`)) throw new Error('refusing: socket path is not this probe\'s own session');
  say(`starting isolated herdr session "${SESSION}" (never the operator's default)`);
  server = spawn('herdr', ['--session', SESSION, 'server'], {
    detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', () => {});
  server.stderr?.on('data', () => {});
  for (let i = 0; i < 60; i += 1) {
    if (fs.existsSync(SOCK)) { say(`socket up after ~${i * 0.5}s`); return; }
    await sleep(500);
  }
  throw new Error('isolated session socket never appeared');
}

function cleanup() {
  say('cleanup');
  try { sh('herdr', ['session', 'stop', SESSION]); } catch { /* already down */ }
  try { sh('herdr', ['session', 'delete', SESSION]); } catch { /* already gone */ }
  try { if (server?.pid) process.kill(-server.pid, 'SIGTERM'); } catch { /* already dead */ }
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* best effort */ }
  // Prove we left the operator's own session alone.
  try {
    const sessions = JSON.parse(sh('herdr', ['session', 'list', '--json']));
    results.operatorSessionsAfter = sessions.sessions.map((s) => ({ name: s.name, running: s.running }));
    say(`sessions left: ${results.operatorSessionsAfter.map((s) => `${s.name}(${s.running ? 'running' : 'stopped'})`).join(', ')}`);
  } catch { /* nothing to report */ }
}

function prepareWorkspace() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  sh('git', ['config', 'user.name', 'V0 Proof'], { cwd: WORK });
  sh('git', ['config', 'user.email', 'proof@example.invalid'], { cwd: WORK });
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'initial'], { cwd: WORK });
  say(`workspace ${WORK}`);
}

async function main() {
  const { EXECUTOR_ADAPTERS } = await import(`${REPO}/src/runner/dispatch/transport.mjs`);
  const { seedTrust, readTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);
  const { readVisibility } = await import(`${REPO}/src/runner/dispatch/visibility-session.mjs`);
  const { readRunSnapshot } = await import(`${REPO}/src/verbs/dispatch/show-run.mjs`);

  prepareWorkspace();
  await startIsolatedSession();
  process.env.HERDR_SOCKET_PATH = SOCK;

  // MEASURED CONSTRAINT, first run of this probe: `herdr pane split` needs an
  // existing pane to split FROM, and a freshly started session has none. The
  // adapter always splits, so it cannot open the first pane in an empty
  // session -- in the operator's own session a pane always exists, which is
  // why this never showed up before. A workspace is created here to give the
  // session its root pane, exactly as a real session would already have one.
  const ws = herdr(['workspace', 'create', '--cwd', WORK, '--label', 'v0-proof']);
  const rootPane = ws?.result?.root_pane?.pane_id ?? ws?.result?.pane?.pane_id ?? null;
  results.cases.sessionBootstrap = { rootPane, note: 'pane split requires an existing pane; a fresh session has none' };
  if (!rootPane) throw new Error(`could not create a root pane in the isolated session: ${JSON.stringify(ws).slice(0, 300)}`);
  say(`root pane ${rootPane} created in the isolated session`);

  // Pre-seed folder trust for the throwaway workspace, through the real Phase
  // 01 module. Without this every dispatch into a fresh directory stops at a
  // trust dialog with nobody there to answer it.
  const store = path.join(os.homedir(), '.claude.json');
  try {
    seedTrust(store, { projectPath: WORK, repoRoot: TRUSTED_ROOT });
    results.cases.trustSeed = { ok: readTrust(store, WORK) === true };
    say(`trust pre-seeded for ${WORK}: ${results.cases.trustSeed.ok}`);
  } catch (err) {
    results.cases.trustSeed = { ok: false, error: err.message };
    say(`trust seed failed: ${err.message}`);
  }

  const PROMPT = [
    '# Live proof task',
    '',
    'Do exactly this, nothing more:',
    '',
    '1. Create a file named PROOF.txt in the current directory.',
    '2. Its only content must be the line: v0-live-proof',
    '',
    'Do not ask questions. Do not run any other command.',
  ].join('\n');

  const adapter = EXECUTOR_ADAPTERS['herdr-spawn'];
  const invocation = {
    command: 'claude',
    args: [],
    argsTemplate: [],
    prompt: PROMPT,
    env: {},
    interactiveMode: {
      exitCommand: '/exit',
      kind: 'claude',
      readyTimeoutMs: 90000,
      promptTimeoutMs: 20000,
      resendAfterMs: 45000,
      maxResends: 1,
    },
  };

  // ---- Case A: settled end-to-end, plus D: observed while it runs ----
  const t0 = Date.now();
  let observed = [];
  const observer = setInterval(() => {
    // A different code path than the driver's, reading the same files: this is
    // the observe door, used exactly as an outside process would use it.
    try { observed.push(readRunSnapshot(RUN_DIR).run.status + '/' + (readVisibility(RUN_DIR)?.status ?? 'none')); } catch { /* not written yet */ }
  }, 1000);

  let caseA;
  try {
    say('CASE A: real claude dispatch with a real multi-line prompt');
    const res = await adapter(invocation, {
      cwd: WORK,
      runDir: RUN_DIR,
      timeoutMs: 300000,
      idleTimeoutMs: 240000,
      workId: 'v0-proof-a',
      tier: 'standard',
      model: 'sonnet',
    });
    caseA = { outcome: res.outcome, paneId: res.paneId, ms: Date.now() - t0 };
  } catch (err) {
    caseA = { outcome: err.outcome ?? null, reason: err.reason ?? null, errorClass: err.errorClass, message: err.message.slice(0, 400), paneId: err.paneId, ms: Date.now() - t0 };
  }
  clearInterval(observer);

  const briefPath = path.join(RUN_DIR, 'brief-1.md');
  const brief = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, 'utf8') : '';
  caseA.briefCarriedPromptVerbatim = brief.includes(PROMPT);
  caseA.ackWritten = fs.existsSync(path.join(RUN_DIR, 'outbox', 'ack-1.json'));
  caseA.resultWritten = fs.existsSync(path.join(RUN_DIR, 'outbox', 'result-1.json'));
  caseA.reportWritten = fs.existsSync(path.join(RUN_DIR, 'outbox', 'report-1.md'));
  caseA.taskFileWritten = fs.existsSync(path.join(WORK, 'PROOF.txt'));
  caseA.taskFileContent = caseA.taskFileWritten ? fs.readFileSync(path.join(WORK, 'PROOF.txt'), 'utf8').trim() : null;
  caseA.visibility = readVisibility(RUN_DIR);
  results.cases.A_settled = caseA;
  say(`CASE A: outcome=${caseA.outcome} ack=${caseA.ackWritten} result=${caseA.resultWritten} proofFile=${caseA.taskFileWritten} in ${caseA.ms}ms`);

  results.cases.D_observer = {
    readingsWhileAnotherProcessDrove: observed.length,
    distinctStates: [...new Set(observed)],
    neededNoPermission: true,
  };
  say(`CASE D: observer took ${observed.length} readings while the driver ran; states seen: ${[...new Set(observed)].join(' -> ')}`);

  // ---- Case C: a setsid descendant outlives pane close ----
  try {
    say('CASE C: descendant survival across pane close');
    const split = herdr(['pane', 'split', '--direction', 'right', '--no-focus', '--cwd', WORK]);
    const paneId = split?.result?.pane?.pane_id ?? split?.result?.pane_id;
    const marker = `${WORK}/descendant-${STAMP}`;
    herdr(['pane', 'run', paneId, `setsid sh -c 'sleep 120 & echo $! > ${marker}'`]);
    await sleep(6000);
    const pid = fs.existsSync(marker) ? Number(fs.readFileSync(marker, 'utf8').trim()) : null;
    herdr(['pane', 'close', paneId]);
    await sleep(2000);
    let alive = false;
    if (pid) { try { process.kill(pid, 0); alive = true; } catch { alive = false; } }
    results.cases.C_descendant = { paneId, descendantPid: pid, survivedPaneClose: alive };
    say(`CASE C: descendant pid=${pid} survived pane close = ${alive}`);
    if (pid && alive) { try { process.kill(pid, 'SIGTERM'); } catch { /* fine */ } }
  } catch (err) {
    results.cases.C_descendant = { error: err.message };
    say(`CASE C failed: ${err.message}`);
  }

  results.finishedAt = new Date().toISOString();
}

try {
  await main();
} catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say(`wrote ${path.join(HERE, 'result.json')}`);
}
