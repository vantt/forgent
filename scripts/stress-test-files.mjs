#!/usr/bin/env node
// stress-test-files.mjs -- reproduce load-dependent test failures.
//
// Runs the given test files repeatedly under a controlled synthetic CPU load
// and reports, per round, pass / fail / hang. Each round is one
// `node --test` invocation over all the files; a round that outlives
// --round-timeout-s has its process group killed and counts as a hang.
//
//   node scripts/stress-test-files.mjs [--rounds=N] [--burners=K]
//        [--concurrency=C] [--round-timeout-s=S] [--log-dir=DIR]
//        [--burner=shell|node|fsync] <test files...>
//
// With --log-dir, every non-passing round's full output is kept there.
//
// Burners expire on their own after the whole budget and are SIGKILLed on
// exit, so an interrupted run leaves nothing behind for longer than that
// budget. `--burner=shell` (default) is a `bash` busy loop, a few MB each:
// CPU contention only. `--burner=node` is a busy `node` process (~40 MB
// each): CPU contention plus memory pressure, which on a machine already
// short of RAM stalls processes for seconds at a time. `--burner=fsync` is a
// `node` process rewriting a 4 MB file and fsyncing it in a loop: disk-flush
// contention, the load a full suite's many file-writing tests put on a lock
// holder that fsyncs inside its critical section. Its files live in one
// directory this script removes on exit.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

const opts = {};
const files = [];
for (const arg of process.argv.slice(2)) {
  const m = /^--([a-z-]+)=(.*)$/.exec(arg);
  if (m) opts[m[1]] = m[2];
  else files.push(arg);
}
const rounds = Number(opts.rounds ?? 10);
const burners = Number(opts.burners ?? os.availableParallelism());
const concurrency = opts.concurrency === undefined ? null : Number(opts.concurrency);
const roundTimeoutS = Number(opts['round-timeout-s'] ?? 300);
if (files.length === 0 || !(rounds > 0)) {
  console.error('usage: stress-test-files.mjs [--rounds=N] [--burners=K] [--concurrency=C] [--round-timeout-s=S] [--log-dir=DIR] [--burner=shell|node|fsync] <test files...>');
  process.exit(2);
}
if (opts.burner !== undefined && !['shell', 'node', 'fsync'].includes(opts.burner)) {
  console.error(`stress-test-files: unknown --burner=${opts.burner} (shell, node or fsync)`);
  process.exit(2);
}

const budgetMs = (rounds * roundTimeoutS + 30) * 1000;
const burnDir = opts.burner === 'fsync' ? fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stress-fsync-')) : null;
const fsyncLoop = (file) => `const fs = require('node:fs'); const fd = fs.openSync(${JSON.stringify(file)}, 'w');
const buf = Buffer.alloc(1 << 20, 1); const end = Date.now() + ${budgetMs};
while (Date.now() < end) { for (let i = 0; i < 4; i += 1) fs.writeSync(fd, buf, 0, buf.length, i * buf.length); fs.fsyncSync(fd); }`;
const burnerCommand = (i) => {
  if (opts.burner === 'node') return [process.execPath, ['-e', `const end = Date.now() + ${budgetMs}; while (Date.now() < end) {}`]];
  if (opts.burner === 'fsync') return [process.execPath, ['-e', fsyncLoop(path.join(burnDir, `burner-${i}`))]];
  return ['bash', ['-c', `while [ $SECONDS -lt ${Math.ceil(budgetMs / 1000)} ]; do :; done`]];
};
const burnerProcs = Array.from({ length: burners }, (_, i) => {
  const [cmd, args] = burnerCommand(i);
  return spawn(cmd, args, { stdio: 'ignore' });
});
function stopBurners() {
  for (const b of burnerProcs) {
    try { b.kill('SIGKILL'); } catch { /* already gone */ }
  }
  if (burnDir) fs.rmSync(burnDir, { recursive: true, force: true });
}
process.on('exit', stopBurners);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));

const env = { ...process.env };
delete env.CLAUDE_CODE_SESSION_ID;
delete env.NODE_TEST_CONTEXT;
env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = '1';

const tally = { pass: 0, fail: 0, hang: 0 };
for (let round = 1; round <= rounds; round += 1) {
  const argv = ['--test', ...(concurrency === null ? [] : [`--test-concurrency=${concurrency}`]), ...files];
  // Each round gets its own temp dir, removed afterwards, so fixtures the
  // tests leave behind do not pile up in the OS temp dir round after round.
  const roundTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stress-round-'));
  // Fixtures a confined worker must reach live under /var/tmp; the test helpers honour this root.
  const roundFixtures = fs.existsSync('/var/tmp') ? fs.mkdtempSync('/var/tmp/fgos-stress-fixtures-') : null;
  const started = Date.now();
  const child = spawn(process.execPath, argv, {
    env: { ...env, TMPDIR: roundTemp, TMP: roundTemp, TEMP: roundTemp, ...(roundFixtures ? { FGOS_TEST_FIXTURE_ROOT: roundFixtures } : {}) }, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  let hung = false;
  const timer = setTimeout(() => {
    hung = true;
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  }, roundTimeoutS * 1000);
  const code = await new Promise((resolve) => child.on('close', resolve));
  clearTimeout(timer);
  fs.rmSync(roundTemp, { recursive: true, force: true, maxRetries: 3 });
  if (roundFixtures) fs.rmSync(roundFixtures, { recursive: true, force: true, maxRetries: 3 });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const verdict = hung ? 'hang' : code === 0 ? 'pass' : 'fail';
  tally[verdict] += 1;
  console.log(`round ${round}/${rounds}: ${verdict} (${secs}s)`);
  if (verdict !== 'pass') {
    const failing = out.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => /^\s*(not ok|✖)/.test(l)).slice(0, 12);
    for (const l of failing) console.log(`    ${l.trim().slice(0, 200)}`);
    if (opts['log-dir']) {
      fs.mkdirSync(opts['log-dir'], { recursive: true });
      const logPath = path.join(opts['log-dir'], `round-${round}-${verdict}.log`);
      fs.writeFileSync(logPath, out);
      console.log(`    full output: ${logPath}`);
    }
  }
}
console.log(`summary: rounds=${rounds} burners=${burners}(${opts.burner ?? 'shell'}) concurrency=${concurrency ?? 'default'} pass=${tally.pass} fail=${tally.fail} hang=${tally.hang}`);
stopBurners();
process.exitCode = tally.fail + tally.hang > 0 ? 1 : 0;
