// V0 live proof, second half: the cases that need something to go wrong, or a
// second process to be watching while it does.
//
// Same absolute safety rule as the first probe: its own herdr session, its own
// socket, and the operator's `default` session is never addressed, stopped or
// restarted. The gateway-restart case restarts THIS probe's session only.
//
//   B. died      -- the agent process is killed mid-round. Is a vanished
//                   worker reported dead within seconds, with its pane kept?
//   D. observer  -- a genuinely separate OS process runs `fgos dispatch watch`
//                   while another process drives the run. The first probe
//                   could not answer this: the adapter's herdr calls are
//                   synchronous, so an in-process timer never gets to run.
//   P3. restart  -- does a pane survive a herdr server restart? Decides one
//                   field: resume is reattach-or-relaunch, or relaunch-only.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');

const SESSION = 'fgos-v0-proof2';
const SOCK = path.join(os.homedir(), '.config', 'herdr', 'sessions', SESSION, 'herdr.sock');
const STAMP = Date.now().toString(36);
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-v0-proof2-${STAMP}`);
const RUN_ID = `run_v0_${STAMP}`;
const RUN_DIR = path.join(WORK, '.fgos', 'assignments', 'asgn_v0', 'runs', '01');

const log = [];
const say = (m) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${m}`; log.push(l); console.log(l); };
const results = { startedAt: new Date().toISOString(), cases: {} };

const sh = (bin, args, opts = {}) => execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const herdr = (args) => {
  try { return JSON.parse(sh('herdr', args, { env: { ...process.env, HERDR_SOCKET_PATH: SOCK } })); } catch (err) {
    try { return JSON.parse(err.stdout ?? '{}'); } catch { return { error: { code: 'unparseable', message: err.message } }; }
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server = null;

async function startIsolatedSession() {
  if (!SOCK.includes(`/sessions/${SESSION}/`)) throw new Error('refusing: not this probe\'s own session');
  server = spawn('herdr', ['--session', SESSION, 'server'], { detached: true, stdio: 'ignore' });
  for (let i = 0; i < 60; i += 1) { if (fs.existsSync(SOCK)) return; await sleep(500); }
  throw new Error('socket never appeared');
}

function cleanup() {
  say('cleanup');
  try { sh('herdr', ['session', 'stop', SESSION]); } catch { /* down */ }
  try { sh('herdr', ['session', 'delete', SESSION]); } catch { /* gone */ }
  try { if (server?.pid) process.kill(-server.pid, 'SIGTERM'); } catch { /* dead */ }
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* best effort */ }
  try {
    const s = JSON.parse(sh('herdr', ['session', 'list', '--json'])).sessions.map((x) => `${x.name}(${x.running ? 'running' : 'stopped'})`);
    results.operatorSessionsAfter = s;
    say(`sessions left: ${s.join(', ')}`);
  } catch { /* nothing */ }
}

// The driver runs in its own process so the watcher below is genuinely a
// different OS process, not a timer sharing this one's blocked event loop.
const DRIVER = `
import { EXECUTOR_ADAPTERS } from ${JSON.stringify(`${REPO}/src/runner/dispatch/transport.mjs`)};
process.env.HERDR_SOCKET_PATH = ${JSON.stringify(SOCK)};
const prompt = ['# Long task', '', 'Count slowly from 1 to 40, one number per line.', 'Then create COUNTED.txt containing the word done.', '', 'Do not ask questions.'].join('\\n');
try {
  const res = await EXECUTOR_ADAPTERS['herdr-spawn']({
    command: 'claude', args: [], argsTemplate: [], prompt, env: {},
    interactiveMode: { exitCommand: '/exit', kind: 'claude', readyTimeoutMs: 90000, promptTimeoutMs: 20000, resendAfterMs: 60000, maxResends: 0 },
  }, {
    cwd: ${JSON.stringify(WORK)}, runDir: ${JSON.stringify(RUN_DIR)},
    timeoutMs: 180000, idleTimeoutMs: 150000,
    workId: 'v0-proof-b', tier: 'standard', model: 'sonnet',
  });
  console.log(JSON.stringify({ outcome: res.outcome, paneId: res.paneId }));
} catch (err) {
  console.log(JSON.stringify({ outcome: err.outcome ?? null, reason: err.reason ?? null, errorClass: err.errorClass, paneId: err.paneId, message: String(err.message).slice(0, 300) }));
}
`;

async function main() {
  const { seedTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);
  const { readVisibility } = await import(`${REPO}/src/runner/dispatch/visibility-session.mjs`);

  fs.mkdirSync(RUN_DIR, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  sh('git', ['config', 'user.name', 'V0 Proof'], { cwd: WORK });
  sh('git', ['config', 'user.email', 'proof@example.invalid'], { cwd: WORK });
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: WORK });
  fs.writeFileSync(path.join(RUN_DIR, 'run.json'), JSON.stringify({ runId: RUN_ID, assignmentId: 'asgn_v0', status: 'running' }, null, 2));
  seedTrust(path.join(os.homedir(), '.claude.json'), { projectPath: WORK, repoRoot: TRUSTED_ROOT });

  await startIsolatedSession();
  process.env.HERDR_SOCKET_PATH = SOCK;
  const ws = herdr(['workspace', 'create', '--cwd', WORK, '--label', 'v0-proof2']);
  const rootPane = ws?.result?.root_pane?.pane_id;
  if (!rootPane) throw new Error('no root pane');
  say(`isolated session up, root pane ${rootPane}`);

  const driverPath = path.join(WORK, 'driver.mjs');
  fs.writeFileSync(driverPath, DRIVER);

  say('CASE B+D: driving in one process, watching from another');
  const driver = spawn('node', [driverPath], { env: { ...process.env, HERDR_SOCKET_PATH: SOCK }, stdio: ['ignore', 'pipe', 'pipe'] });
  let driverOut = '';
  driver.stdout.on('data', (d) => { driverOut += d; });
  driver.stderr.on('data', () => {});

  // A genuinely separate process, running the real read-only CLI verb, with no
  // lease and no permission from the driver.
  const watcher = spawn('node', [`${REPO}/bin/fgos.mjs`, 'dispatch', 'watch', RUN_ID, '--dir', WORK, '--interval', '1000', '--ticks', '40'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let watcherLines = [];
  watcher.stderr.on('data', (d) => { watcherLines.push(...String(d).split('\n').filter(Boolean)); });
  let watcherOut = '';
  watcher.stdout.on('data', (d) => { watcherOut += d; });

  // Wait for the agent to actually be working, then kill it.
  let paneId = null;
  let killedPid = null;
  for (let i = 0; i < 90; i += 1) {
    await sleep(1000);
    const v = (() => { try { return readVisibility(RUN_DIR); } catch { return null; } })();
    if (v?.paneId) paneId = v.paneId;
    if (paneId && v?.status === 'working') {
      const info = herdr(['pane', 'process-info', '--pane', paneId])?.result?.process_info;
      const agent = (info?.foreground_processes ?? []).find((p) => p.pid !== info.shell_pid);
      if (agent) {
        say(`agent is working; killing pid ${agent.pid} (${agent.name}) to prove death detection`);
        try { process.kill(agent.pid, 'SIGKILL'); killedPid = agent.pid; } catch (e) { say(`kill failed: ${e.message}`); }
        break;
      }
    }
  }
  if (!killedPid) say('never saw a working agent to kill; case B will report what the driver got instead');

  const killedAt = Date.now();
  const driverResult = await new Promise((resolve) => {
    driver.on('close', () => { try { resolve(JSON.parse(driverOut.trim().split('\n').pop())); } catch { resolve({ raw: driverOut.slice(0, 300) }); } });
    setTimeout(() => resolve({ timeout: 'driver did not exit in time' }), 200000);
  });

  const paneStillOpen = paneId ? Boolean(herdr(['pane', 'process-info', '--pane', paneId])?.result) : null;
  results.cases.B_died = {
    killedPid,
    paneId,
    detectedAfterMs: killedPid ? Date.now() - killedAt : null,
    driverResult,
    paneKeptForForensics: paneStillOpen,
    visibility: (() => { try { return readVisibility(RUN_DIR); } catch { return null; } })(),
  };
  say(`CASE B: outcome=${driverResult.outcome} reason=${driverResult.reason ?? '-'} paneKept=${paneStillOpen}`);

  try { watcher.kill('SIGTERM'); } catch { /* fine */ }
  results.cases.D_observer = {
    separateProcess: true,
    readings: watcherLines.length,
    sample: watcherLines.slice(0, 6),
    neededNoLease: true,
  };
  say(`CASE D: a separate process took ${watcherLines.length} readings while another drove the run`);

  // ---- P3: does a pane survive a herdr server restart? Our session only. ----
  say('CASE P3: restarting THIS probe\'s herdr session (never the operator default)');
  const beforePanes = herdr(['pane', 'list'])?.result?.panes?.map((p) => p.pane_id) ?? [];
  sh('herdr', ['session', 'stop', SESSION]);
  await sleep(3000);
  server = spawn('herdr', ['--session', SESSION, 'server'], { detached: true, stdio: 'ignore' });
  let back = false;
  for (let i = 0; i < 40; i += 1) { if (fs.existsSync(SOCK)) { back = true; break; } await sleep(500); }
  await sleep(2000);
  const afterPanes = back ? (herdr(['pane', 'list'])?.result?.panes?.map((p) => p.pane_id) ?? []) : [];
  results.cases.P3_restart = {
    panesBefore: beforePanes,
    serverCameBack: back,
    panesAfter: afterPanes,
    panesSurvived: beforePanes.length > 0 && beforePanes.every((p) => afterPanes.includes(p)),
    decision: beforePanes.length > 0 && beforePanes.every((p) => afterPanes.includes(p)) ? 'reattach-or-relaunch' : 'relaunch-only',
  };
  say(`CASE P3: panes before=${beforePanes.length} after=${afterPanes.length} -> resume: ${results.cases.P3_restart.decision}`);

  results.finishedAt = new Date().toISOString();
}

try { await main(); } catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'failure-result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say('wrote failure-result.json');
}
