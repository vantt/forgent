// test/helpers/fake-herdr-pane.mjs -- a fake herdr binary that behaves like real panes.
//
// Point FGOS_HERDR_BIN at `herdrBin`. Every herdr call is appended to a log (argv, one JSON
// line each). Unlike a canned-answer mock it gives each pane a real process: `pane run` starts
// the command in the pane's cwd/env, and `pane process-info` reports that process's live argv,
// so the confined-launch checks (argv, executable, environment, cwd) see a genuine process and
// the command that reaches the pane is exactly what the runner prepared.
//
// The worker protocol is played by the fake, never by the model: when a brief is delivered to
// a pane it writes ack/report/result into that run's outbox -- unless the pane is scripted to
// show a usage-limit screen instead, in which case it writes nothing and stays idle.
//
// A scripted pane is picked by creation order (1-based). Per pane:
//   limit: true         idle forever; `agent read` shows `limitScreen`
//   blockedAfterBrief: true  once the brief is typed the agent sits on a dialog only a person can answer: `agent get`
//                       says "blocked", `agent read` shows `blockScreen`, and no ack or result is ever written
//   awaitProbe: true    wait for the in-sandbox agent's probe-results.json before settling
//   detector: true      `agent explain` answers like herdr's screen detector (idle until a brief is taken)
//   reportedWorking: true  `agent get` says "working" forever, as it does for a confined pane (only the state
//                       fgos reported at launch exists); only the detector knows what the pane is doing
//   startupPolls: N     the detector says "unknown" for the first N explain calls (UI still starting);
//                       a brief typed before the detector turned idle is lost, like a real UI that is not up yet
//   swallowEnter: N     the first N submit keys are lost: `agent prompt` leaves the brief as an unsent
//                       draft in the prompt box, and only a later `agent send-keys Enter` submits it
// `signalDir` is where the in-sandbox agent looks for `signal-<pane id>.json` (default: the fake's own dir).
import fs from 'node:fs';
import path from 'node:path';

const MOCK = String.raw`
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const dir = process.env.FAKE_HERDR_DIR;
const statePath = path.join(dir, 'state.json');
const logPath = path.join(dir, 'calls.jsonl');
const scenario = JSON.parse(fs.readFileSync(path.join(dir, 'scenario.json'), 'utf8'));
const args = process.argv.slice(2);
fs.appendFileSync(logPath, JSON.stringify(args) + '\n');
fs.appendFileSync(path.join(dir, 'envs.jsonl'), JSON.stringify({ socket: process.env.HERDR_SOCKET_PATH ?? null, session: process.env.HERDR_SESSION ?? null }) + '\n');

// Rounds of one batch run concurrently, and every herdr call is its own process: the state file is
// read-modified-written under a lock held for the whole call, and written atomically.
const lockPath = path.join(dir, 'state.lock');
const sleepBlock = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
for (let tries = 0; ; tries += 1) {
  try { fs.mkdirSync(lockPath); break; } catch (err) {
    if (err.code !== 'EEXIST' || tries > 4000) throw err;
    sleepBlock(5);
  }
}
process.on('exit', () => { try { fs.rmdirSync(lockPath); } catch { /* released */ } });
const readState = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
const writeState = (s) => { const tmp = statePath + '.' + process.pid; fs.writeFileSync(tmp, JSON.stringify(s)); fs.renameSync(tmp, statePath); };
const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const fail = (code, message) => { console.log(JSON.stringify({ error: { code, message: message ?? code }, id: 'cli:mock' })); process.exit(1); };
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flagAll = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []));
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const envOf = () => {
  const env = {};
  for (const kv of flagAll('--env')) { const eq = kv.indexOf('='); env[kv.slice(0, eq)] = kv.slice(eq + 1); }
  return env;
};

if (args[0] === '--version') { console.log('herdr 0.9.1-fake'); process.exit(0); }
if (args[0] === 'pane' && args[1] === 'layout' && args[2] === '--help') { console.log('usage: herdr pane layout'); process.exit(0); }

const [group, action] = args;
const state = readState();
state.tabs ??= {};
const paneIndex = (id) => Number(String(id).replace('mock-pane-', ''));
const scripted = (id) => scenario.panes?.[paneIndex(id) - 1] ?? {};
const openPane = (id) => (state.panes[id] && !state.panes[id].closed ? state.panes[id] : null);
const liveIds = () => Object.keys(state.panes).filter((id) => !state.panes[id].closed);

const newPane = (tab, extra = {}) => {
  const id = 'mock-pane-' + (Object.keys(state.panes).length + 1);
  state.panes[id] = { tab, cwd: flag('--cwd') ?? process.cwd(), env: envOf(), pid: null, closed: false, exited: false, ...extra };
  return id;
};

if (group === 'status' && action === 'server') ok({ running: true, socket: process.env.HERDR_SOCKET_PATH ?? scenario.socketPath ?? null });

if ((group === 'tab' || group === 'workspace') && action === 'create') {
  const tab = 'mock-tab-' + (Object.keys(state.tabs).length + 1);
  state.tabs[tab] = { label: flag('--label') ?? null };
  const pane = newPane(tab);
  writeState(state);
  ok({ tab: { tab_id: tab }, root_pane: { pane_id: pane } });
}
if ((group === 'tab' || group === 'pane') && action === 'rename') {
  if (group === 'tab') state.tabs[args[2]] = { ...(state.tabs[args[2]] ?? {}), label: args[3] };
  else if (state.panes[args[2]]) state.panes[args[2]].label = args[3];
  writeState(state);
  ok({});
}

if (group === 'pane' && action === 'split') {
  const target = flag('--pane');
  if (scenario.deadAnchorPane && target === scenario.deadAnchorPane) fail('pane_not_found', 'no such pane');
  const anchor = openPane(target);
  if (!anchor) fail('pane_not_found', 'no such pane');
  const id = newPane(anchor.tab);
  writeState(state);
  ok({ pane: { pane_id: id, tab_id: anchor.tab } });
}

if (group === 'pane' && action === 'layout') {
  const pane = openPane(flag('--pane'));
  if (!pane) fail('pane_not_found', 'no such pane');
  const ids = liveIds().filter((id) => state.panes[id].tab === pane.tab);
  const height = Math.floor(69 / ids.length);
  ok({
    layout: {
      tab_id: pane.tab,
      area: { x: 0, y: 0, width: 352, height: 69 },
      panes: ids.map((id, i) => ({ pane_id: id, rect: { x: 0, y: i * height, width: 352, height } })),
    },
  });
}

if (group === 'pane' && action === 'get') {
  if (scenario.paneVanishesAfterBrief && Object.values(state.panes).some((p) => p.delivered)) fail('pane_not_found', 'pane not found');
  const id = args[2];
  if (!openPane(id)) fail('pane_not_found', 'pane not found');
  ok({ pane: { pane_id: id, tab_id: state.panes[id].tab } });
}

const startProcess = (id, name) => {
  const pane = state.panes[id];
  const child = spawn('bash', ['-c', 'exec -a ' + name + ' sleep 600'], {
    cwd: pane.cwd,
    env: { ...process.env, ...pane.env, FAKE_HERDR_DIR: undefined },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  pane.pid = child.pid;
};

if (group === 'pane' && action === 'run') {
  const id = args[2];
  const pane = openPane(id);
  if (!pane) fail('pane_not_found');
  if (scenario.runError) fail(scenario.runError, 'pane run failed');
  const command = args.slice(3).join(' ');
  const child = spawn('bash', ['-c', command], {
    cwd: pane.cwd,
    env: { ...process.env, ...pane.env, FAKE_HERDR_DIR: undefined },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  pane.pid = child.pid;
  pane.runCommand = command;
  writeState(state);
  ok({ type: 'ok' });
}

if (group === 'pane' && action === 'process-info') {
  const id = flag('--pane');
  const paneVanished = scenario.paneVanishesAfterBrief && Object.values(state.panes).some((p) => p.delivered);
  if (paneVanished || !openPane(id)) fail('pane_not_found', 'pane not found');
  const pane = state.panes[id];
  const foreground = [{ pid: 100, name: 'zsh', argv: ['zsh'] }];
  let fgPid = 100;
  const gone = scenario.agentGone || pane.exited;
  if (pane.pid && !gone && alive(pane.pid)) {
    let argv = [];
    try { argv = fs.readFileSync('/proc/' + pane.pid + '/cmdline', 'utf8').split('\0').filter((a, i, all) => a !== '' || i < all.length - 1); } catch {}
    foreground.unshift({ pid: pane.pid, name: argv[0] ?? 'agent', argv });
    fgPid = pane.pid;
    pane.lastArgv = argv;
    writeState(state);
  }
  ok({ process_info: { pane_id: id, shell_pid: 100, foreground_process_group_id: fgPid, foreground_processes: foreground } });
}

if (group === 'pane' && (action === 'report-agent' || action === 'report-agent-session')) {
  const pane = openPane(args[2]);
  if (pane) { pane.reported = true; writeState(state); }
  ok({ type: 'ok' });
}

if (group === 'pane' && action === 'close') {
  const pane = state.panes[args[2]];
  if (!pane || pane.closed) fail('pane_not_found', 'pane not found');
  pane.closed = true;
  if (pane.pid && alive(pane.pid)) { try { process.kill(pane.pid, 'SIGKILL'); } catch {} }
  writeState(state);
  ok({ closed: true });
}

if (group === 'agent' && action === 'get') {
  const id = args[2];
  if (scenario.paneVanishesAfterBrief && Object.values(state.panes).some((p) => p.delivered)) fail('agent_not_found', 'agent target ' + id + ' not found');
  const pane = openPane(id);
  if (!pane) fail('agent_not_found', 'agent target ' + id + ' not found');
  if (scenario.unrecognisedAgent && !pane.reported) fail('agent_not_found', 'agent target ' + id + ' not found');
  const blocked = scripted(id).blockedAfterBrief && pane.delivered;
  ok({ agent: { agent: 'fake', agent_status: blocked ? 'blocked' : scripted(id).reportedWorking ? 'working' : 'idle', pane_id: id, state_change_seq: 0 } });
}

if (group === 'pane' && action === 'read' || group === 'agent' && action === 'read') {
  const id = args[2];
  const pane = openPane(id);
  if (!pane) fail('pane_not_found', 'pane not found');
  const blockedText = scripted(id).blockedAfterBrief && pane.delivered ? (scenario.blockScreen ?? '') : '';
  console.log(scripted(id).limit ? (scenario.limitScreen ?? '') : blockedText);
  process.exit(0);
}

if (group === 'agent' && action === 'start') {
  const id = flag('--pane');
  if (!openPane(id)) fail('pane_not_found');
  startProcess(id, flag('--kind') ?? 'agent');
  writeState(state);
  ok({ agent: { agent_status: 'idle' } });
}

const deliver = (id, text) => {
  let briefText = text;
  const pointer = text.match(/^Read (.+) and do what it says\.$/);
  if (pointer) briefText = fs.readFileSync(pointer[1], 'utf8');
  if (scripted(id).blockedAfterBrief) return;
  const ackMatch = briefText.match(/(\/\S+\/outbox\/ack-1\.json)/);
  if (ackMatch) {
    const outbox = path.dirname(ackMatch[1]);
    if (scripted(id).awaitProbe) {
      fs.writeFileSync(path.join(scenario.signalDir ?? dir, 'signal-' + id + '.json'), JSON.stringify({ outbox }));
      const until = Date.now() + 15000;
      while (Date.now() < until && !fs.existsSync(path.join(outbox, 'probe-results.json'))) sleepSync(50);
    }
    const atomic = (file, body) => { fs.writeFileSync(file + '.tmp', body); fs.renameSync(file + '.tmp', file); };
    atomic(path.join(outbox, 'ack-1.json'), JSON.stringify({ round: 1, receivedAt: new Date().toISOString() }));
    atomic(path.join(outbox, 'report-1.md'), '# Report\nThe assigned work was inspected and completed with a full explanation of what was checked.\n');
    atomic(path.join(outbox, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'fake pane worker finished', assessment: { verdict: 'pass' } }));
  }
};

if (group === 'agent' && action === 'explain') {
  const id = args[2];
  const script = scripted(id);
  const pane = openPane(id);
  if (!pane) fail('agent_not_found', 'agent target ' + id + ' not found');
  if (!script.detector && !script.startupPolls && !script.swallowEnter) ok({});
  pane.explainCalls = (pane.explainCalls ?? 0) + 1;
  writeState(state);
  const starting = pane.explainCalls <= (script.startupPolls ?? 0);
  const verdict = starting ? 'unknown' : (pane.delivered ? 'working' : 'idle');
  console.log(JSON.stringify({
    agent: 'fake',
    state: verdict,
    visible_idle: verdict === 'idle',
    visible_working: verdict === 'working',
    visible_blocker: false,
    matched_rule: { id: 'live_prompt_box', priority: 950, region: 'prompt_box_body', state: verdict },
    evaluated_rules: [{ id: 'live_prompt_box', matched: true, evidence: { region_preview: '❯ ' + (pane.draft ?? '') + '\n' } }],
  }));
  process.exit(0);
}

if ((group === 'agent' || group === 'pane') && action === 'send-keys') {
  const id = args[2];
  const pane = state.panes[id];
  if (pane && args.slice(3).includes('Enter') && pane.draft) {
    const text = pane.draft;
    pane.enters = (pane.enters ?? 0) + 1;
    if (pane.enters > (scripted(id).swallowEnter ?? 0) - 1) {
      pane.draft = null;
      pane.delivered = true;
      writeState(state);
      deliver(id, text);
      ok({});
    }
    writeState(state);
  }
  ok({});
}

if (group === 'pane' && action === 'send-text') {
  const pane = openPane(args[2]);
  if (!pane) fail('pane_not_found');
  pane.draft = args[3] ?? '';
  writeState(state);
  ok({});
}

if (group === 'agent' && action === 'prompt') {
  const id = args[2];
  const text = args[3] ?? '';
  const pane = state.panes[id];
  if (!pane || pane.closed) fail('agent_not_found', 'agent target ' + id + ' not found');
  if (text.startsWith('/')) {
    pane.exited = true;
    if (pane.pid && alive(pane.pid)) { try { process.kill(pane.pid, 'SIGKILL'); } catch {} }
    writeState(state);
    ok({ agent: { agent_status: 'idle' } });
  }
  if (scripted(id).limit) ok({ agent: { agent_status: 'idle' } });

  const script = scripted(id);
  pane.prompts = [...(pane.prompts ?? []), { text, at: Date.now(), explainCallsBefore: pane.explainCalls ?? 0 }];
  const startingUp = (pane.explainCalls ?? 0) < (script.startupPolls ?? 0);
  if (script.swallowEnter || startingUp) {
    // The UI took the text but lost the submit key: it stays an unsent draft.
    pane.draft = text;
    writeState(state);
    ok({ agent: { agent_status: 'working' } });
  }
  pane.delivered = true;
  writeState(state);
  deliver(id, text);
  ok({ agent: { agent_status: 'working' } });
}
ok({});
`;

/**
 * @param {string} dir  scratch directory (created if missing)
 * @param {{panes?: object[], limitScreen?: string, blockScreen?: string}} [scenario]
 */
export function createFakeHerdr(dir, scenario = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const scriptPath = path.join(dir, 'fake-herdr.mjs');
  const wrapperPath = path.join(dir, 'fake-herdr.sh');
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ panes: {} }));
  fs.writeFileSync(path.join(dir, 'calls.jsonl'), '');
  fs.writeFileSync(path.join(dir, 'envs.jsonl'), '');
  fs.writeFileSync(path.join(dir, 'scenario.json'), JSON.stringify(scenario));
  fs.writeFileSync(scriptPath, MOCK);
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nFAKE_HERDR_DIR=${JSON.stringify(dir)} exec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const readState = () => JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'));
  return {
    herdrBin: wrapperPath,
    calls: () => fs.readFileSync(path.join(dir, 'calls.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)),
    /** The herdr server each call addressed, in call order: `{ socket, session }`. */
    envs: () => fs.readFileSync(path.join(dir, 'envs.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)),
    panes: () => readState().panes,
    /** Argv of every `pane close` call, i.e. the panes the runner closed. */
    closedPaneIds() {
      return this.calls().filter((c) => c[0] === 'pane' && c[1] === 'close').map((c) => c[2]);
    },
    /** Kill any agent process a pane left running (a kept pane keeps its process). */
    cleanup() {
      for (const pane of Object.values(readState().panes)) {
        if (pane.pid) { try { process.kill(pane.pid, 'SIGKILL'); } catch { /* already gone */ } }
      }
    },
  };
}

/**
 * The agent started inside the sandbox. It waits for the fake herdr to deliver a brief (a
 * signal file naming the run outbox), then records which writes the sandbox allowed:
 *   worktree -> the Unit worktree, main -> the main checkout, outbox -> the run outbox.
 * It writes only the probe record itself into the outbox, which is the one write a read-only
 * posture permits.
 */
export const SANDBOXED_AGENT_SOURCE = `
import fs from 'node:fs';
import path from 'node:path';
const signalFile = process.env.FAKE_AGENT_SIGNAL;
const targets = JSON.parse(fs.readFileSync(process.env.FAKE_AGENT_TARGETS, 'utf8'));
const attempt = (file) => { try { fs.writeFileSync(file, 'x'); return 'ok'; } catch (err) { return err.code || String(err); } };
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]));
const accountReport = (dir) => {
  if (!dir) return { dir: null };
  const files = fs.existsSync(dir) ? walk(dir).filter((f) => !f.startsWith('.fgos-confinement')).sort() : [];
  const read = (rel) => { try { return fs.readFileSync(path.join(dir, rel), 'utf8'); } catch { return null; } };
  const modeOf = (rel) => { try { return (fs.statSync(path.join(dir, rel)).mode & 0o777).toString(8); } catch { return null; } };
  return { dir, files, contents: Object.fromEntries(files.map((f) => [f, read(f)])), modes: Object.fromEntries(files.map((f) => [f, modeOf(f)])), writable: attempt(path.join(dir, 'state-probe.txt')) };
};
const deadline = Date.now() + 25000;
const timer = setInterval(() => {
  if (Date.now() > deadline) { clearInterval(timer); process.exit(0); }
  if (!fs.existsSync(signalFile)) return;
  clearInterval(timer);
  const { outbox } = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
  const results = {
    worktree: attempt(path.join(targets.worktree, 'probe-worktree.txt')),
    main: attempt(path.join(targets.main, 'probe-main.txt')),
    outbox: attempt(path.join(outbox, 'probe-outbox.txt')),
    tty: process.stdin.isTTY === true || process.stdout.isTTY === true,
    home: process.env.HOME ?? null,
    // An account home the launch provisioned: what it holds, and whether the agent may write in it.
    account: process.env.FAKE_ACCOUNT_HOME_VAR ? accountReport(process.env[process.env.FAKE_ACCOUNT_HOME_VAR]) : null,
  };
  fs.writeFileSync(path.join(outbox, 'probe-results.json'), JSON.stringify(results));
  // Stay up like a REPL waiting for /exit, but only for a bounded time. The fake herdr kills the
  // pane's wrapper process on close, not this process inside the sandbox, so an agent that waited
  // forever outlived its test: hundreds of these piled up, holding gigabytes.
  setTimeout(() => process.exit(0), 30000);
}, 50);
`;
