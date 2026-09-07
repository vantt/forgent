// Do the executors as they are ACTUALLY CONFIGURED run through the new adapter?
//
// The earlier P1 run proved agy works, but with an arg set chosen by the probe.
// The entry in .fgos/config.json carries a different one, and the difference is
// exactly the sort of gap that only shows up when someone flips `prefer`. This
// runs each executor with the argv the adapter would really build from its own
// config template, after the `{prompt}` element is stripped.
//
//   agy-herdr   configured today: -i {prompt} --mode accept-edits --new-project --model {model}
//               untested delta vs P1: `-i` and `--model`
//   codex-herdr configured today: exec --dangerously-bypass-approvals-and-sandbox {prompt}
//               and interactiveMode: null, so the adapter refuses it outright.
//               `exec` is codex's NON-interactive subcommand, so that entry
//               could never have worked in a pane. The shape tried here is the
//               interactive one, which is what the entry should become.
//
// Own herdr session throughout; the operator's `default` is never addressed.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');
const SESSION = 'fgos-cfg-probe';
const SOCK = path.join(os.homedir(), '.config', 'herdr', 'sessions', SESSION, 'herdr.sock');
const STAMP = Date.now().toString(36);
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-cfg-${STAMP}`);
const ROUNDS = Number(process.env.PROBE_ROUNDS ?? 3);

const log = [];
const say = (m) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${m}`; log.push(l); console.log(l); };
const results = { startedAt: new Date().toISOString(), executors: {} };
const sh = (b, a, o = {}) => execFileSync(b, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...o });
const herdr = (a) => { try { return JSON.parse(sh('herdr', a, { env: { ...process.env, HERDR_SOCKET_PATH: SOCK } })); } catch (e) { try { return JSON.parse(e.stdout ?? '{}'); } catch { return {}; } } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server = null;

// Exactly what each entry should look like. `argsTemplate` is the config's own
// args array; the adapter strips the `{prompt}` element and substitutes
// `{model}`, so this is what the agent really receives.
const SPECS = [
  {
    id: 'agy-herdr',
    note: 'corrected: -i removed (it swallows the next flag as its prompt value)',
    command: 'agy',
    kind: 'agy',
    argsTemplate: ['{prompt}', '--mode', 'accept-edits', '--new-project', '--model', '{model}'],
    model: 'gemini-3.6-flash-medium',
    exitCommand: '/exit',
  },
  {
    id: 'codex-herdr',
    note: 'corrected: bare interactive codex; the shell alias already supplies the bypass flag',
    command: 'codex',
    kind: 'codex',
    argsTemplate: ['{prompt}'],
    model: 'gpt-5.5',
    exitCommand: '/quit',
  },
];

const PROMPT = [
  '# Tiny task',
  '',
  'Create a file named ROUND.txt in the current directory.',
  'Its only content must be the word: ok',
  '',
  'Do not ask questions.',
].join('\n');

function cleanup() {
  say('cleanup');
  try { sh('herdr', ['session', 'stop', SESSION]); } catch { /* down */ }
  try { sh('herdr', ['session', 'delete', SESSION]); } catch { /* gone */ }
  try { if (server?.pid) process.kill(-server.pid, 'SIGTERM'); } catch { /* dead */ }
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* best effort */ }
  try {
    results.operatorSessionsAfter = JSON.parse(sh('herdr', ['session', 'list', '--json'])).sessions.map((s) => `${s.name}(${s.running ? 'running' : 'stopped'})`);
    say(`sessions left: ${results.operatorSessionsAfter.join(', ')}`);
  } catch { /* nothing */ }
}

async function main() {
  const { EXECUTOR_ADAPTERS } = await import(`${REPO}/src/runner/dispatch/transport.mjs`);
  const { seedTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);

  fs.mkdirSync(WORK, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  sh('git', ['config', 'user.name', 'Cfg Probe'], { cwd: WORK });
  sh('git', ['config', 'user.email', 'cfg@example.invalid'], { cwd: WORK });
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: WORK });
  seedTrust(path.join(os.homedir(), '.claude.json'), { projectPath: WORK, repoRoot: TRUSTED_ROOT });

  if (!SOCK.includes(`/sessions/${SESSION}/`)) throw new Error('refusing: not this probe\'s session');
  server = spawn('herdr', ['--session', SESSION, 'server'], { detached: true, stdio: 'ignore' });
  for (let i = 0; i < 60 && !fs.existsSync(SOCK); i += 1) await sleep(500);
  if (!fs.existsSync(SOCK)) throw new Error('socket never appeared');
  process.env.HERDR_SOCKET_PATH = SOCK;
  if (!herdr(['workspace', 'create', '--cwd', WORK, '--label', 'cfg'])?.result?.root_pane?.pane_id) throw new Error('no root pane');
  say(`isolated session up; ${SPECS.length} executors x ${ROUNDS} rounds`);

  const adapter = EXECUTOR_ADAPTERS['herdr-spawn'];
  for (const spec of SPECS) {
    const rows = [];
    say(`--- ${spec.id}: ${spec.note}`);
    say(`    agent receives: ${spec.argsTemplate.filter((a) => !a.includes('{prompt}')).map((a) => a.replace('{model}', spec.model)).join(' ')}`);
    for (let n = 1; n <= ROUNDS; n += 1) {
      const runDir = path.join(WORK, '.runs', spec.id, String(n).padStart(2, '0'));
      fs.mkdirSync(runDir, { recursive: true });
      const t0 = Date.now();
      let row;
      try {
        const res = await adapter({
          command: spec.command, args: [], argsTemplate: spec.argsTemplate, prompt: PROMPT, env: {},
          interactiveMode: {
            exitCommand: spec.exitCommand, kind: spec.kind,
            readyTimeoutMs: 90000, promptTimeoutMs: 20000, resendAfterMs: 45000, maxResends: 1,
          },
        }, {
          cwd: WORK, runDir, timeoutMs: 150000, idleTimeoutMs: 120000,
          workId: `${spec.id}-${n}`, tier: 'light', model: spec.model,
        });
        row = { round: n, outcome: res.outcome ?? 'settled' };
      } catch (err) {
        row = { round: n, outcome: err.outcome ?? null, reason: err.reason ?? null, message: String(err.message).slice(0, 220) };
      }
      row.ms = Date.now() - t0;
      row.ack = fs.existsSync(path.join(runDir, 'outbox', 'ack-1.json'));
      row.result = fs.existsSync(path.join(runDir, 'outbox', 'result-1.json'));
      rows.push(row);
      say(`    round ${n}/${ROUNDS}: outcome=${row.outcome ?? row.reason} ack=${row.ack} result=${row.result} (${row.ms}ms)`);
      if (row.message) say(`      ${row.message}`);
    }
    const ok = rows.filter((r) => r.outcome === 'settled').length;
    results.executors[spec.id] = {
      note: spec.note,
      argsTemplate: spec.argsTemplate,
      effectiveArgs: spec.argsTemplate.filter((a) => !a.includes('{prompt}')).map((a) => a.replace('{model}', spec.model)),
      kind: spec.kind,
      exitCommand: spec.exitCommand,
      rounds: rows,
      settled: ok,
      of: ROUNDS,
      verdict: ok === ROUNDS ? 'works as configured' : (ok > 0 ? 'intermittent' : 'does not work'),
    };
    say(`    => ${spec.id}: ${ok}/${ROUNDS} settled`);
  }
  results.finishedAt = new Date().toISOString();
}

try { await main(); } catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'configured-executors-result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say('wrote configured-executors-result.json');
}
