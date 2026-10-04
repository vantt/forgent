#!/usr/bin/env node
// stress-test-files.mjs -- reproduce load-dependent test failures.
//
// Runs the given test files repeatedly under a controlled synthetic CPU load
// and reports, per round, pass / fail / hang. Each round is one
// `node --test` invocation over all the files; a round that outlives
// --round-timeout-s has its process group killed and counts as a hang.
//
//   node scripts/stress-test-files.mjs [--rounds=N] [--burners=K]
//        [--concurrency=C] [--round-timeout-s=S] [--log-dir=DIR] <test files...>
//
// With --log-dir, every non-passing round's full output is kept there.
//
// Burners are `node` busy loops that expire on their own after the whole
// budget, and are SIGKILLed on exit, so an interrupted run leaves nothing
// behind for longer than that budget.

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
  console.error('usage: stress-test-files.mjs [--rounds=N] [--burners=K] [--concurrency=C] [--round-timeout-s=S] [--log-dir=DIR] <test files...>');
  process.exit(2);
}

const budgetMs = (rounds * roundTimeoutS + 30) * 1000;
const burnerProcs = Array.from({ length: burners }, () =>
  spawn(process.execPath, ['-e', `const end = Date.now() + ${budgetMs}; while (Date.now() < end) {}`], { stdio: 'ignore' }),
);
function stopBurners() {
  for (const b of burnerProcs) {
    try { b.kill('SIGKILL'); } catch { /* already gone */ }
  }
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
  const started = Date.now();
  const child = spawn(process.execPath, argv, { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
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
console.log(`summary: rounds=${rounds} burners=${burners} concurrency=${concurrency ?? 'default'} pass=${tally.pass} fail=${tally.fail} hang=${tally.hang}`);
stopBurners();
process.exitCode = tally.fail + tally.hang > 0 ? 1 : 0;
