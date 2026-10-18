// A real Node CLI that behaves like a chatty agent: it writes stdout without
// pause, leaves a `setsid` grandchild behind, optionally forks many short-lived
// orphans, and writes its outbox result when it is done.
//
//   node noisy-agent.mjs --outbox <dir> --marker <file> [--run-ms N]
//        [--grandchild-pidfile <file>] [--orphans N] [--orphan-life SECONDS]
//        [--ignore-sigterm]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const option = (name, fallback = null) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};
const outbox = option('--outbox');
const marker = option('--marker');
const runMs = Number(option('--run-ms', '2000'));
const orphans = Number(option('--orphans', '0'));
const pidfile = option('--grandchild-pidfile');
const orphanLife = option('--orphan-life', '0.05');

if (argv.includes('--ignore-sigterm')) process.on('SIGTERM', () => {});

writeFileSync(marker, `${process.pid}\n`);

if (pidfile) {
  const grandchild = spawn('setsid', ['sleep', '600'], { stdio: 'ignore', detached: true });
  grandchild.unref();
  writeFileSync(pidfile, `${grandchild.pid}\n`);
}

// Short-lived orphans: the shell exits at once, so `sleep` is adopted by pid 1.

const started = Date.now();
let wave = 0;
const orphanTimer = orphans > 0
  ? setInterval(() => {
      // spread the orphans across the whole run
      forkOrphans1(Math.max(1, Math.ceil(orphans / Math.max(1, runMs / 250))));
      wave += 1;
    }, 250)
  : null;
let forked = 0;
function forkOrphans1(count) {
  for (let i = 0; i < count && forked < orphans; i += 1, forked += 1) {
    const child = spawn('/bin/sh', ['-c', `(sleep ${orphanLife} &) ; exit 0`], { stdio: 'ignore' });
    child.unref();
  }
}

const chatter = setInterval(() => {
  process.stdout.write(`tick ${Date.now() - started}\n`);
}, 20);

setTimeout(() => {
  clearInterval(chatter);
  if (orphanTimer) clearInterval(orphanTimer);
  mkdirSync(outbox, { recursive: true });
  const next = readdirSync(outbox).length + 1;
  writeFileSync(join(outbox, `result-${next}.json`), JSON.stringify({ ok: true, ticks: wave }));
  process.exit(0);
}, runMs);
