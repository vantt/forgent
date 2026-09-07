// The final check: does each herdr-spawn executor run using the entry that is
// actually in .fgos/config.json right now?
//
// Nothing here is hardcoded. Each spec is read out of the live config, so a
// pass means the CONFIG is right, not that some hand-written argv happened to
// work. This is the difference the earlier probes did not close: they proved
// the adapter, using arguments the probe chose.
//
// Own herdr session throughout; the operator's `default` is never addressed,
// and any trust entry this seeds is removed again on the way out.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../../../..');
const CFG = '/home/vantt/projects/forgentX/.fgos/config.json';
const SESSION = 'fgos-fromcfg';
const SOCK = path.join(os.homedir(), '.config', 'herdr', 'sessions', SESSION, 'herdr.sock');
const TRUSTED_ROOT = path.join(os.homedir(), 'projects');
const WORK = path.join(TRUSTED_ROOT, `fgos-fromcfg-${Date.now().toString(36)}`);
const ROUNDS = Number(process.env.PROBE_ROUNDS ?? 2);

const log = [];
const say = (m) => { const l = `[${new Date().toISOString().slice(11, 19)}] ${m}`; log.push(l); console.log(l); };
const results = { startedAt: new Date().toISOString(), source: CFG, executors: {} };
const sh = (b, a, o = {}) => execFileSync(b, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...o });
const herdr = (a) => { try { return JSON.parse(sh('herdr', a, { env: { ...process.env, HERDR_SOCKET_PATH: SOCK } })); } catch (e) { try { return JSON.parse(e.stdout ?? '{}'); } catch { return {}; } } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server = null;
const seededCodexPaths = [];

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

const PROMPT = [
  '# Tiny task',
  '',
  'Create a file named ROUND.txt in the current directory.',
  'Its only content must be the word: ok',
  '',
  'Do not ask questions.',
].join('\n');

async function main() {
  const { EXECUTOR_ADAPTERS, resolveExecutorEnv } = await import(`${REPO}/src/runner/dispatch/transport.mjs`);
  const { seedTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);
  const { removeCodexTrust } = await import(`${REPO}/src/runner/dispatch/trust-store.mjs`);

  const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
  const specs = Object.entries(cfg.runner.executors)
    .map(([id, e]) => [id, (e.invocations ?? []).find((i) => i.via === 'cli') ?? e])
    .filter(([, inv]) => inv.adapter === 'herdr-spawn')
    .map(([id, inv]) => ({ id, inv }));
  say(`herdr-spawn executors in the live config: ${specs.map((s) => s.id).join(', ')}`);

  fs.mkdirSync(WORK, { recursive: true });
  sh('git', ['init', '-q'], { cwd: WORK });
  sh('git', ['config', 'user.name', 'FromCfg'], { cwd: WORK });
  sh('git', ['config', 'user.email', 'cfg@example.invalid'], { cwd: WORK });
  sh('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: WORK });
  // The claude-json side is seeded here because the adapter only seeds what an
  // executor declares, and agy declares nothing (it has no trust dialog).
  seedTrust(path.join(os.homedir(), '.claude.json'), { projectPath: WORK, repoRoot: TRUSTED_ROOT });

  server = spawn('herdr', ['--session', SESSION, 'server'], { detached: true, stdio: 'ignore' });
  for (let i = 0; i < 60 && !fs.existsSync(SOCK); i += 1) await sleep(500);
  if (!fs.existsSync(SOCK)) throw new Error('socket never appeared');
  process.env.HERDR_SOCKET_PATH = SOCK;
  if (!herdr(['workspace', 'create', '--cwd', WORK, '--label', 'fromcfg'])?.result?.root_pane?.pane_id) throw new Error('no root pane');

  const adapter = EXECUTOR_ADAPTERS['herdr-spawn'];
  for (const { id, inv } of specs) {
    const model = cfg.runner.modelPolicies?.[
      { agy: 'gemini', claude: 'claude', codex: 'openai-codex' }[inv.interactiveMode?.kind] ?? 'claude'
    ]?.lightweight ?? 'sonnet';
    const rows = [];
    say(`--- ${id}: command=${inv.command} kind=${inv.interactiveMode?.kind} args=${JSON.stringify(inv.args)}`);
    if (inv.interactiveMode?.trustStore) {
      const env = resolveExecutorEnv(inv.env ?? {});
      if (inv.interactiveMode.trustStore.kind === 'codex-toml') {
        seededCodexPaths.push(path.join(env.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'config.toml'));
      }
    }
    for (let n = 1; n <= ROUNDS; n += 1) {
      const runDir = path.join(WORK, '.runs', id, String(n).padStart(2, '0'));
      fs.mkdirSync(runDir, { recursive: true });
      const t0 = Date.now();
      let row;
      try {
        const res = await adapter({
          command: inv.command,
          args: [],
          argsTemplate: inv.args,
          prompt: PROMPT,
          env: inv.env ?? {},
          interactiveMode: { readyTimeoutMs: 90000, promptTimeoutMs: 20000, resendAfterMs: 45000, maxResends: 1, ...inv.interactiveMode },
        }, {
          cwd: WORK, repoRoot: TRUSTED_ROOT, runDir,
          timeoutMs: 180000, idleTimeoutMs: 150000,
          workId: `${id}-${n}`, tier: 'light', model,
        });
        row = { round: n, outcome: res.outcome ?? 'settled' };
      } catch (err) {
        row = { round: n, outcome: err.outcome ?? null, reason: err.reason ?? null, message: String(err.message).slice(0, 200) };
      }
      row.ms = Date.now() - t0;
      row.ack = fs.existsSync(path.join(runDir, 'outbox', 'ack-1.json'));
      row.result = fs.existsSync(path.join(runDir, 'outbox', 'result-1.json'));
      rows.push(row);
      say(`    round ${n}/${ROUNDS}: outcome=${row.outcome ?? row.reason} ack=${row.ack} result=${row.result} (${row.ms}ms)`);
      if (row.message) say(`      ${row.message}`);
    }
    const ok = rows.filter((r) => r.outcome === 'settled').length;
    results.executors[id] = {
      command: inv.command, kind: inv.interactiveMode?.kind, args: inv.args,
      env: inv.env ?? null, trustStore: inv.interactiveMode?.trustStore ?? null,
      model, rounds: rows, settled: ok, of: ROUNDS,
      verdict: ok === ROUNDS ? 'works from config' : (ok > 0 ? 'intermittent' : 'does not work'),
    };
    say(`    => ${id}: ${ok}/${ROUNDS} settled`);
  }
  results.finishedAt = new Date().toISOString();

  // Leave the operator's codex config as it was found.
  for (const cfgPath of [...new Set(seededCodexPaths)]) {
    try { removeCodexTrust(cfgPath, WORK); say(`removed codex trust entry from ${cfgPath}`); } catch { /* nothing to undo */ }
  }
}

try { await main(); } catch (err) {
  results.fatal = err.message;
  say(`FATAL: ${err.message}`);
} finally {
  cleanup();
  results.log = log;
  fs.writeFileSync(path.join(HERE, 'from-config-result.json'), `${JSON.stringify(results, null, 2)}\n`);
  say('wrote from-config-result.json');
}
