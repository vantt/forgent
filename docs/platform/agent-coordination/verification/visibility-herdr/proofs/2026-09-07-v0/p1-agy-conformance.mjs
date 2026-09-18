// P1: does agy honour the brief contract, ten times in a row?
//
// This is a measurement about agy, not about the design. The threshold is
// declared in advance so the result cannot be rationalised afterwards:
//
//   >= 9/10 rounds produce an ack file
//   10/10 rounds produce either a result file or a NAMED failure
//
// Below that, agy loses its interactive label in the capability profile and
// falls back to cli-spawn. The design does not get adjusted to make agy pass.
//
// Own herdr session throughout; the operator's `default` is never addressed.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');
const SESSION = 'fgos-v0-p1';
const SOCK = path.join(os.homedir(), '.config', 'herdr', 'sessions', SESSION, 'herdr.sock');
const STAMP = Date.now().toString(36);
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-v0-p1-${STAMP}`);
const ROUNDS = Number(process.env.P1_ROUNDS ?? 10);

const log = [];
const say = (m) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${m}`; log.push(l); console.log(l); };
const results = { startedAt: new Date().toISOString(), agent: 'agy', rounds: [] };
const sh = (b, a, o = {}) => execFileSync(b, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...o });
const herdr = (a) => { try { return JSON.parse(sh('herdr', a, { env: { ...process.env, HERDR_SOCKET_PATH: SOCK } })); } catch (e) { try { return JSON.parse(e.stdout ?? '{}'); } catch { return {}; } } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server = null;

function cleanup() {
  say('cleanup');
  try { sh('herdr', ['session', 'stop', SESSION]); } catch { /* down */ }
  try { sh('herdr', ['session', 'delete', SESSION]); } catch { /* gone */ }
  try { if (server?.pid) process.kill(-server.pid, 'SIGTERM'); } catch { /* dead */ }
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* best effort */ }
  try { results.operatorSessionsAfter = JSON.parse(sh('herdr', ['session', 'list', '--json'])).sessions.map((s) => `${s.name}(${s.running ? 'running' : 'stopped'})`); } catch { /* nothing */ }
}

const PROMPT = [
  '# Tiny task',
  '',
  'Create a file named ROUND.txt in the current directory.',
  'Its only content must be the word: ok',
  '',
  'Do not ask questions.',
].join('\n');

async function main() {
  const { EXECUTOR_ADAPTERS } = await import(`${REPO}/src/runner/dispatch/transport.mjs`);
  const { seedTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);

  fs.mkdirSync(WORK, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  sh('git', ['config', 'user.name', 'P1'], { cwd: WORK });
  sh('git', ['config', 'user.email', 'p1@example.invalid'], { cwd: WORK });
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: WORK });
  seedTrust(path.join(os.homedir(), '.claude.json'), { projectPath: WORK, repoRoot: TRUSTED_ROOT });

  if (!SOCK.includes(`/sessions/${SESSION}/`)) throw new Error('refusing: not this probe\'s session');
  server = spawn('herdr', ['--session', SESSION, 'server'], { detached: true, stdio: 'ignore' });
  for (let i = 0; i < 60 && !fs.existsSync(SOCK); i += 1) await sleep(500);
  if (!fs.existsSync(SOCK)) throw new Error('socket never appeared');
  process.env.HERDR_SOCKET_PATH = SOCK;
  const ws = herdr(['workspace', 'create', '--cwd', WORK, '--label', 'p1']);
  if (!ws?.result?.root_pane?.pane_id) throw new Error('no root pane');
  say(`isolated session up; running ${ROUNDS} agy rounds`);

  const adapter = EXECUTOR_ADAPTERS['herdr-spawn'];
  for (let n = 1; n <= ROUNDS; n += 1) {
    const runDir = path.join(WORK, '.runs', String(n).padStart(2, '0'));
    fs.mkdirSync(runDir, { recursive: true });
    const t0 = Date.now();
    let row;
    try {
      const res = await adapter({
        command: 'agy', args: [], argsTemplate: ['--mode', 'accept-edits', '--new-project'],
        prompt: PROMPT, env: {},
        interactiveMode: { exitCommand: '/exit', kind: 'agy', readyTimeoutMs: 90000, promptTimeoutMs: 20000, resendAfterMs: 45000, maxResends: 1 },
      }, {
        cwd: WORK, runDir, timeoutMs: 150000, idleTimeoutMs: 120000,
        workId: `p1-${n}`, tier: 'light', model: 'gemini-3.6-flash-medium',
      });
      row = { round: n, outcome: res.outcome ?? 'settled' };
    } catch (err) {
      row = { round: n, outcome: err.outcome ?? null, reason: err.reason ?? null, named: Boolean(err.outcome || err.reason) };
    }
    row.ms = Date.now() - t0;
    row.ack = fs.existsSync(path.join(runDir, 'outbox', 'ack-1.json'));
    row.result = fs.existsSync(path.join(runDir, 'outbox', 'result-1.json'));
    row.report = fs.existsSync(path.join(runDir, 'outbox', 'report-1.md'));
    results.rounds.push(row);
    say(`round ${n}/${ROUNDS}: outcome=${row.outcome ?? row.reason} ack=${row.ack} result=${row.result} (${row.ms}ms)`);
  }

  const acks = results.rounds.filter((r) => r.ack).length;
  const resultOrNamed = results.rounds.filter((r) => r.result || r.outcome || r.reason).length;
  results.verdict = {
    rounds: ROUNDS,
    acks,
    ackThreshold: Math.ceil(ROUNDS * 0.9),
    resultOrNamedFailure: resultOrNamed,
    passes: acks >= Math.ceil(ROUNDS * 0.9) && resultOrNamed === ROUNDS,
  };
  results.verdict.conclusion = results.verdict.passes
    ? 'agy keeps its interactive label'
    : 'agy loses its interactive label in the capability profile and falls back to cli-spawn; this is a conclusion about agy, not about the design';
  say(`VERDICT: ack ${acks}/${ROUNDS} (need ${results.verdict.ackThreshold}), result-or-named ${resultOrNamed}/${ROUNDS} -> ${results.verdict.passes ? 'PASS' : 'FAIL'}`);
  results.finishedAt = new Date().toISOString();
}

try { await main(); } catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'p1-agy-result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say('wrote p1-agy-result.json');
}
