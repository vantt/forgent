#!/usr/bin/env node
// P-SPACE and P-RESOURCE (Git spec §15, §10 C4): real kernel faults at every point of one
// Publication operation, before and after its CAS effect, with no fault-injection seam.
//
// A sweep raises one limit step by step. Each run starts a fresh worker process with its own bare
// repository and an established tip, lowers the limit on that worker (prlimit --pid, or chmod, or
// free space), lets it publish one operation, restores the limit, then checks:
//   I1 a returned receipt is backed by a terminal WAL chain and the ref at `next`;
//   I2 a thrown operation left the ref at `expected` with no success, or at `next` with the
//      operation pending or uncertain in the WAL (effect-aware, never "no effect");
//   I3 the WAL scan stays complete and readable;
//   I4 every descriptor the operation opened is closed again;
//   I5 after recovery of the same id, a fresh operation id publishes.
// Small limits fail early (before the effect); larger ones fail later, so a sweep crosses the
// object, prepare, pin, CAS, receipt and directory-sync barriers in order.
//
//   node scripts/git/p-space-resource.mjs resource --kind nofile|nproc|fsize|perm --root <fresh dir> [--max N] [--out f]
//   node scripts/git/p-space-resource.mjs space --root <dir on a private small filesystem> [--step 4096] [--out f]
//
// `space` refuses a filesystem with more than 64 MiB free: it must be a private small one that
// scripts/git/p-space.sh mounts as root (ext4 loop, inode-starved ext4, dm-flakey for EIO).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sandboxGit } from '../lib/sandbox-git.mjs';

const SELF = fileURLToPath(import.meta.url);
const CHECKOUT = path.resolve(path.dirname(SELF), '../..');
const WRITER = 'p-space-writer';
const IDENTITY = { name: 'P', email: 'p@fgos.invalid' };
const DATE = '1792300000 +0700';
const REF = 'refs/fgos/events/p-space';
const RUN_MS = 120_000;

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  return out;
}
const openFds = () => fs.readdirSync('/proc/self/fd').length;
function errorText(e) { return String(e?.message ?? e).slice(0, 300); }

// ---- worker: one operation under a fault -------------------------------------

async function worker(args) {
  process.on('SIGXFSZ', () => {}); // RLIMIT_FSIZE must surface as EFBIG, not kill the writer.
  const root = path.resolve(args.root);
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const git = sandboxGit(root);
  const repo = path.join(root, 'repo.git'), state = path.join(root, 'state');
  git(['init', '-q', '--bare', repo]);
  fs.mkdirSync(path.join(repo, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ at: 'p-space fixture', v: 1, lock: 'activation', by: 'fgos git' }) + '\n');
  fs.mkdirSync(state, { mode: 0o700 });
  const index = await import('../../src/git/index.mjs');
  const loader = { descriptor: JSON.parse(fs.readFileSync(args.descriptor, 'utf8')) };
  const open = () => index.createGitPublication({ stateRoot: state, repoPath: repo, trustedMain: repo, reference: REF, writer: WRITER }, loader);
  const commit = (port, label, parents) => {
    const blob = port.writeBlob({ bytes: [...Buffer.from(`${label}\n`)] });
    const tree = port.writeTree({ entries: [{ name: 'seal.json', mode: 0o100644, oid: blob }] });
    return port.writeCommit({ tree, parents, author: IDENTITY, committer: IDENTITY, authorDate: DATE, committerDate: DATE, message: `${label}\n` });
  };
  // An established tip, so the operation under test changes an existing loose ref.
  let port = open();
  const expected = commit(port, 'base', []);
  port.compareAndSwap({ expected: null, next: expected, operationId: 'p-base' });
  port.close();
  const lines = readline.createInterface({ input: process.stdin })[Symbol.asyncIterator]();
  const say = (value) => process.stdout.write(JSON.stringify(value) + '\n');

  const baseline = openFds();
  say({ ready: true, pid: process.pid, fds: baseline, repo });
  await lines.next();
  // ---- under the fault: open, write objects, CAS, close ----
  const id = 'p-op';
  let next = null, receipt = null, error = null, closed = null;
  try {
    port = open();
    try {
      next = commit(port, `operation ${args.label ?? ''}`, [expected]);
      receipt = port.compareAndSwap({ expected, next, operationId: id });
    } finally {
      try { closed = port.close(); } catch (e) { closed = { error: errorText(e) }; }
    }
  } catch (e) { error = errorText(e); }
  say({ done: true, error });
  await lines.next();
  // ---- fault lifted: observe ----
  const violations = [];
  const fdsAfter = openFds();
  if (fdsAfter > baseline) violations.push(`I4 ${fdsAfter - baseline} descriptor(s) left open`);
  const recovery = index.createGitRecovery({ stateRoot: state, repoPath: repo, trustedMain: repo, writer: WRITER }, loader);
  let pending = null, inspected = null;
  try { pending = recovery.listPending({}); if (pending.complete !== true) violations.push('I3 WAL scan incomplete'); } catch (e) { violations.push(`I3 WAL scan: ${errorText(e)}`); }
  try { inspected = recovery.inspectOperation({ operationId: id }); } catch (e) { inspected = { error: errorText(e) }; }
  const ref = git(['--git-dir', repo, 'rev-parse', '--verify', '-q', REF], { stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const walText = JSON.stringify(inspected);
  const terminalSuccess = /"success"|thisInvocationWonCas|effectObservedOnly/i.test(walText) && !/"pending"/.test(walText);
  if (receipt) {
    if (ref !== next) violations.push(`I1 receipt returned but ref is ${ref}`);
    if (!terminalSuccess) violations.push(`I1 receipt returned but WAL shows ${walText.slice(0, 200)}`);
  } else if (ref === next) {
    const open = (pending?.operations ?? []).some((o) => JSON.stringify(o).includes(id)) || /pending|uncertain|recovery/i.test(walText);
    if (!open && !terminalSuccess) violations.push(`I2 effect happened, call threw "${error}", WAL neither pending nor terminal: ${walText.slice(0, 200)}`);
  } else if (ref !== expected) violations.push(`I2 ref moved to an unknown value ${ref}`);
  else if (terminalSuccess) violations.push('I2 ref unchanged but WAL records success');
  // I5: settle the same id through its own recovery, then a fresh id must publish.
  let recovered = null, fresh = null;
  try {
    port = open();
    if (!receipt) { try { recovered = port.recover({ operationId: id }); } catch (e) { recovered = { error: errorText(e) }; } }
    const tip = git(['--git-dir', repo, 'rev-parse', REF]).trim();
    const later = commit(port, `fresh ${args.label ?? ''}`, [tip]);
    fresh = port.compareAndSwap({ expected: tip, next: later, operationId: 'p-fresh' });
    port.close();
  } catch (e) { violations.push(`I5 fresh operation after recovery: ${errorText(e)}`); }
  say({ verdict: { error, receipt: Boolean(receipt), effect: ref === next ? 'next' : ref === expected ? 'expected' : 'other', closed, wal: walText.slice(0, 240), recovered: recovered && JSON.stringify(recovered).slice(0, 160), fresh: Boolean(fresh), violations } });
}

// ---- driver ------------------------------------------------------------------

async function descriptorFor(root) {
  const { ensureGitAddon } = await import('../git-addon.mjs');
  const built = ensureGitAddon();
  const file = path.join(root, 'addon-descriptor.json');
  fs.writeFileSync(file, JSON.stringify({ manifest: JSON.parse(fs.readFileSync(built.manifest, 'utf8')), releaseRoot: CHECKOUT }));
  return file;
}
/** Tasks (threads) of this real uid: RLIMIT_NPROC counts them all. */
function userTasks() {
  const uid = String(process.getuid());
  let n = 0;
  for (const p of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(p)) continue;
    try {
      const status = fs.readFileSync(`/proc/${p}/status`, 'utf8');
      if (status.match(/^Uid:\s+(\d+)/m)?.[1] === uid) n += Number(status.match(/^Threads:\s+(\d+)/m)?.[1] ?? 1);
    } catch {}
  }
  return n;
}

/** One worker run: `apply(ready)` installs the fault, `lift(ready)` removes it. */
async function runOnce(root, descriptor, label, apply, lift) {
  const child = spawn(process.execPath, [SELF, 'worker', '--root', root, '--descriptor', descriptor, '--label', label], { cwd: CHECKOUT, stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d; });
  const lines = readline.createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  // A run that stops answering is itself a finding (an unbounded wait under a fault).
  const hung = setTimeout(() => { stderr += `\nhung: no answer within ${RUN_MS} ms`; child.kill('SIGKILL'); }, RUN_MS);
  const read = async () => { const { value, done } = await lines.next(); if (done) throw new Error(`worker exited: ${stderr.slice(-400)}`); return JSON.parse(value); };
  const ready = await read();
  const fault = apply(ready);
  child.stdin.write('go\n');
  const done = await read();
  lift(ready);
  child.stdin.end('lifted\n');
  const { verdict } = await read();
  await new Promise((resolve) => child.on('close', resolve));
  clearTimeout(hung);
  return { label, fault, ...verdict, error: done.error ?? verdict.error };
}

const prlimit = (pid, resource, soft) => execFileSync('prlimit', ['--pid', String(pid), `--${resource}=${soft}:`]);
/** Restore a soft limit to the worker's own hard limit. */
const restore = (pid, resource) => prlimit(pid, resource, execFileSync('prlimit', ['--pid', String(pid), `--${resource}`, '-o', 'HARD', '--noheadings'], { encoding: 'utf8' }).trim());

async function resource(args) {
  const root = path.resolve(args.root);
  if (fs.existsSync(root) && fs.readdirSync(root).length) throw new Error(`root must be fresh: ${root}`);
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const descriptor = await descriptorFor(root);
  const kind = args.kind;
  const runs = [];
  const sweep = async (values, apply, lift) => {
    let clean = 0;
    for (const v of values) {
      const r = await runOnce(path.join(root, `${kind}-${v}`), descriptor, `${kind}=${v}`, (ready) => apply(ready, v), lift)
        .catch((e) => ({ label: `${kind}=${v}`, error: errorText(e), effect: 'unknown', violations: [`worker died or hung: ${errorText(e)}`] }));
      runs.push(r);
      console.error(`${r.label}: ${r.error ? `refused ${r.error.slice(0, 90)}` : 'published'} effect=${r.effect} violations=${r.violations.length}`);
      clean = r.error ? 0 : clean + 1;
      if (clean >= 3) break; // the limit no longer bites
    }
  };
  const max = Number(args.max ?? 200);
  const range = (from, to, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
  if (kind === 'nofile') {
    await sweep(range(0, max), (ready, k) => { prlimit(ready.pid, 'nofile', ready.fds + k); return { nofile: ready.fds + k }; }, (ready) => restore(ready.pid, 'nofile'));
  } else if (kind === 'nproc') {
    await sweep(range(0, max), (ready, k) => { const base = userTasks(); prlimit(ready.pid, 'nproc', base + k); return { nproc: base + k, tasks: base }; }, (ready) => restore(ready.pid, 'nproc'));
  } else if (kind === 'fsize') {
    await sweep(range(0, Number(args.max ?? 16384), 128), (ready, k) => { prlimit(ready.pid, 'fsize', k); return { fsize: k }; }, (ready) => restore(ready.pid, 'fsize'));
  } else if (kind === 'perm') {
    // Each target directory read-only to its owner while the operation runs.
    const targets = ['objects', 'fgos/git/operations', 'refs/fgos/events', 'refs/fgos', 'fgos/git'];
    for (const t of targets) {
      const r = await runOnce(path.join(root, `perm-${t.replaceAll('/', '_')}`), descriptor, `perm=${t}`,
        (ready) => { const d = path.join(ready.repo, t); fs.mkdirSync(d, { recursive: true }); fs.chmodSync(d, 0o500); return { readOnly: t }; },
        (ready) => fs.chmodSync(path.join(ready.repo, t), 0o700));
      runs.push(r);
      console.error(`${r.label}: ${r.error ? `refused ${r.error.slice(0, 90)}` : 'published'} effect=${r.effect} violations=${r.violations.length}`);
    }
  } else throw new Error(`unknown --kind ${kind}`);
  report(args, { proof: 'P-RESOURCE', kind, filesystem: fstype(root), runs });
}

async function space(args) {
  const root = path.resolve(args.root);
  const st = fs.statfsSync(root);
  if (st.bavail * st.bsize > 64 << 20) throw new Error(`space needs a private small filesystem (<= 64 MiB free), ${root} has ${Math.round(st.bavail * st.bsize / 2 ** 20)} MiB`);
  const descriptor = await descriptorFor(fs.mkdtempSync(path.join(root, 'desc-')));
  const step = Number(args.step ?? 4096);
  const runs = [];
  const ballast = path.join(root, 'ballast');
  // Fill so that only `k` bytes (or, with --inodes, `k` inodes) stay free while the operation runs.
  for (let k = 0, clean = 0; clean < 3 && k < 4 << 20; k += step) {
    const dir = path.join(root, `run-${k}`);
    const r = await runOnce(dir, descriptor, `free=${k}`, () => {
      fs.rmSync(ballast, { recursive: true, force: true });
      if (args.inodes) {
        fs.mkdirSync(ballast);
        for (let n = 0; fs.statfsSync(root).ffree > k; n++) { try { fs.writeFileSync(path.join(ballast, String(n)), ''); } catch { break; } }
        return { freeInodes: fs.statfsSync(root).ffree };
      }
      const s = fs.statfsSync(root);
      const fill = Math.max(0, s.bavail * s.bsize - k);
      const fd = fs.openSync(ballast, 'w');
      try { for (let left = fill; left > 0; left -= 1 << 20) fs.writeSync(fd, Buffer.alloc(Math.min(left, 1 << 20))); } catch {} finally { fs.fsyncSync(fd); fs.closeSync(fd); }
      return { freeBytes: fs.statfsSync(root).bavail * s.bsize };
    }, () => fs.rmSync(ballast, { recursive: true, force: true }));
    runs.push(r);
    console.error(`${r.label}: ${r.error ? `refused ${r.error.slice(0, 90)}` : 'published'} effect=${r.effect} violations=${r.violations.length}`);
    clean = r.error ? 0 : clean + 1;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  report(args, { proof: 'P-SPACE', kind: args.inodes ? 'inodes' : 'bytes', filesystem: fstype(root), runs });
}

function fstype(dir) { return execFileSync('findmnt', ['-T', dir, '-n', '-o', 'SOURCE,FSTYPE,SIZE'], { encoding: 'utf8' }).trim(); }
function report(args, result) {
  const violations = result.runs.flatMap((r) => r.violations.map((v) => `${r.label}: ${v}`));
  const out = { ...result, refused: result.runs.filter((r) => r.error).length, published: result.runs.filter((r) => !r.error).length, afterEffect: result.runs.filter((r) => r.error && r.effect === 'next').length, violations };
  const text = JSON.stringify(out, null, 2) + '\n';
  if (args.out) fs.writeFileSync(args.out, text);
  process.stdout.write(JSON.stringify({ proof: out.proof, kind: out.kind, runs: out.runs.length, refused: out.refused, afterEffect: out.afterEffect, violations }, null, 2) + '\n');
  if (violations.length) process.exitCode = 1;
}

if (process.argv[1] === SELF) {
  const [mode, ...rest] = process.argv.slice(2);
  const modes = { worker, resource, space };
  if (!modes[mode]) { console.error(`usage: p-space-resource.mjs ${Object.keys(modes).join('|')} ...`); process.exit(2); }
  await modes[mode](options(rest));
}
