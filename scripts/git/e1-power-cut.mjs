#!/usr/bin/env node
// Experiment E1 (Git spec §15, §10): Publication objects, refs, packed-refs and the file WAL
// survive a power cut at every barrier, and fgos-git's own syscalls follow the §10 order.
// scripts/git/e1-power-cut.sh drives the root-only device part; this file is the unprivileged
// half it calls:
//
//   node scripts/git/e1-power-cut.mjs workload --root <dir> --descriptor <file> --plan <file> [--ops N] [--handshake]
//   node scripts/git/e1-power-cut.mjs check    --root <dir> --descriptor <file> --plan <file> --acked <n>
//   node scripts/git/e1-power-cut.mjs trace    --root <fresh dir> [--ops N]     (strace; no root)
//   node scripts/git/e1-power-cut.mjs order    --trace <strace log>             (checks a trace)
//
// The workload records every operation in --plan, which must live OUTSIDE the device under test:
// an `intent` line before the CAS and an `ack` line after the receipt returns. With --handshake it
// prints `ack <i>` and waits for one stdin line, so the root driver places a dm-log-writes mark
// between the acknowledgement and the next operation's first write.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sandboxGit } from '../lib/sandbox-git.mjs';

const SELF = fileURLToPath(import.meta.url);
const CHECKOUT = path.resolve(path.dirname(SELF), '../..');
const WRITER = 'e1-writer';
const IDENTITY = { name: 'E1', email: 'e1@fgos.invalid' };
const DATE = '1792300000 +0700';
const REFS = ['refs/fgos/events/e1-a', 'refs/fgos/events/e1-b', 'refs/fgos/events/nested/e1-c'];

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  return out;
}
async function loaders(descriptorFile) {
  const index = await import('../../src/git/index.mjs');
  return { index, loader: { descriptor: JSON.parse(fs.readFileSync(descriptorFile, 'utf8')) } };
}
/** The bare repository and state root the workload owns under --root (the device mount). */
function layout(root) {
  return { repo: path.join(root, 'repo.git'), state: path.join(root, 'state') };
}
function prepare(root) {
  const { repo, state } = layout(root);
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const git = sandboxGit(root);
  git(['init', '-q', '--bare', repo]);
  fs.mkdirSync(path.join(repo, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ at: 'e1 fixture', v: 1, lock: 'activation', by: 'fgos git' }) + '\n');
  fs.mkdirSync(state, { recursive: true, mode: 0o700 });
  // The fixture predates every judged operation: `git init` does not fsync HEAD or config, and
  // ext4 delays their data, so make the whole filesystem durable before the first write we judge.
  execFileSync('sync', ['--file-system', root]);
  return { repo: fs.realpathSync(repo), state: fs.realpathSync(state), git };
}
function appendDurably(file, line) {
  const fd = fs.openSync(file, 'a');
  try { fs.writeSync(fd, line + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function readPlan(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

async function workload(args) {
  const ops = Number(args.ops ?? 24);
  const { repo, state, git } = prepare(path.resolve(args.root));
  const { index, loader } = await loaders(args.descriptor);
  const tips = new Map(REFS.map((ref) => [ref, null]));
  const input = args.handshake ? readline.createInterface({ input: process.stdin }) : null;
  const lines = input ? input[Symbol.asyncIterator]() : null;
  for (let i = 0; i < ops; i++) {
    const ref = REFS[i % REFS.length];
    // One port at a time: a Publication port holds the repository's publication borrow.
    const port = index.createGitPublication({ stateRoot: state, repoPath: repo, trustedMain: repo, reference: ref, writer: WRITER }, loader);
    // Fresh object bytes every operation, so each CAS also creates new loose objects.
    const blob = port.writeBlob({ bytes: [...Buffer.from(`e1 payload ${i}\n`)] });
    const tree = port.writeTree({ entries: [{ name: 'seal.json', mode: 0o100644, oid: blob }] });
    const tip = tips.get(ref);
    const next = port.writeCommit({ tree, parents: tip ? [tip] : [], author: IDENTITY, committer: IDENTITY, authorDate: DATE, committerDate: DATE, message: `e1 ${i}\n` });
    const id = `e1-${i}`;
    appendDurably(args.plan, JSON.stringify({ kind: 'intent', i, id, ref, expected: tip, next }));
    const receipt = port.compareAndSwap({ expected: tip, next, operationId: id });
    appendDurably(args.plan, JSON.stringify({ kind: 'ack', i, id, ref, next, durability: receipt.durability ?? null }));
    port.close();
    tips.set(ref, next);
    // Halfway through, move every ref into packed-refs so later CASes start from a packed ref.
    if (i === Math.floor(ops / 2)) {
      git(['--git-dir', repo, 'pack-refs', '--all']);
      // Packing is fixture preparation, not a judged operation: Git writes packed-refs without
      // a directory fsync, so make it durable before the next judged write.
      execFileSync('sync', ['--file-system', repo]);
    }
    if (lines) { process.stdout.write(`ack ${i}\n`); await lines.next(); }
  }
  // The open stdin reader would keep the process alive, and the root driver waits for its exit.
  input?.close();
}

/** Post-cut invariants on a replayed image, given the acknowledgements that reached the log
 * before the cut. Prints one JSON verdict; exits 1 on any violation. */
async function check(args) {
  const root = path.resolve(args.root);
  const { repo, state } = layout(root);
  const acked = Number(args.acked);
  const plan = readPlan(args.plan);
  const violations = [];
  const git = sandboxGit(root);
  const run = (argv) => { try { return { ok: true, out: git(argv, { stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }; } };
  // Before the first acknowledgement the repository may be absent or half-initialised (its
  // creation is not an acknowledged operation); after it, it must be a readable repository.
  const opened = fs.existsSync(repo) ? run(['--git-dir', repo, 'rev-parse', '--git-dir']) : { ok: false, out: 'absent' };
  if (!opened.ok) {
    if (acked > 0) violations.push(`repository missing or unreadable after acknowledged operations: ${String(opened.out).trim().slice(0, 300)}`);
    return finish({ acked, violations });
  }
  const fsck = run(['--git-dir', repo, 'fsck', '--full', '--no-dangling']);
  if (!fsck.ok) violations.push(`git fsck: ${String(fsck.out).trim().slice(0, 400)}`);
  for (const ref of REFS) {
    const ops = plan.filter((p) => p.kind === 'intent' && p.ref === ref);
    const lastAck = plan.filter((p) => p.kind === 'ack' && p.ref === ref && p.i < acked).at(-1);
    const shown = run(['--git-dir', repo, 'rev-parse', '--verify', '-q', ref]);
    const value = shown.ok ? String(shown.out).trim() : null;
    // A durable acknowledgement means the ref holds that next or a later planned next on the
    // same ref; an unacknowledged operation may or may not have reached the media.
    const allowed = new Set(ops.filter((p) => !lastAck || p.i >= lastAck.i).map((p) => p.next));
    if (lastAck && !allowed.has(value)) violations.push(`${ref}: ${value ?? 'absent'} after acked ${lastAck.id} (${lastAck.next})`);
    if (!lastAck && value !== null && !ops.some((p) => p.next === value)) violations.push(`${ref}: unplanned value ${value}`);
    if (value && !run(['--git-dir', repo, 'cat-file', '-e', `${value}^{tree}`]).ok) violations.push(`${ref}: tree of ${value} unreadable`);
  }
  // Every acknowledged operation's WAL chain must still be readable and terminal; an
  // unacknowledged one may be pending or absent, never corrupt.
  const { index, loader } = await loaders(args.descriptor);
  let recovery;
  try { recovery = index.createGitRecovery({ stateRoot: state, repoPath: repo, trustedMain: repo, writer: WRITER }, loader); } catch (e) {
    violations.push(`WAL open: ${e.message.slice(0, 400)}`);
    return finish({ acked, violations });
  }
  let pending;
  try { pending = recovery.listPending({}); } catch (e) {
    // Before the first acknowledgement the WAL directory may not exist yet; after it, it must scan.
    if (acked > 0 || !e.message.includes('NotFound')) violations.push(`WAL scan: ${e.message.slice(0, 400)}`);
  }
  for (const p of plan.filter((q) => q.kind === 'ack' && q.i < acked)) {
    try {
      const seen = recovery.inspectOperation({ operationId: p.id });
      if (JSON.stringify(seen).includes('"pending"')) violations.push(`${p.id}: acknowledged but pending in WAL`);
    } catch (e) { violations.push(`${p.id}: ${e.message.slice(0, 300)}`); }
  }
  return finish({ acked, pending, violations });
  function finish(verdict) {
    process.stdout.write(JSON.stringify(verdict) + '\n');
    if (verdict.violations.length) process.exitCode = 1;
  }
}

// ---- §10 syscall order -------------------------------------------------------

/** Join strace's `<unfinished ...>` / `<... resumed>` halves; keep completion order. */
function calls(trace) {
  const pending = new Map(), out = [];
  for (const raw of trace.split('\n')) {
    const row = raw.match(/^(\d+)\s+(.*)$/);
    if (!row) continue;
    const [, pid, text] = row;
    if (text.includes('<unfinished ...>')) { pending.set(pid, text.replace('<unfinished ...>', '')); continue; }
    if (text.startsWith('<... ')) {
      const head = pending.get(pid);
      if (head === undefined) continue;
      pending.delete(pid);
      out.push({ pid, text: head + text.slice(text.indexOf('resumed>') + 8) });
      continue;
    }
    out.push({ pid, text });
  }
  return out;
}
const fdPath = (text) => text.match(/^\w+\(\d+<([^>]+)>/)?.[1];
const ok = (text) => /= 0$/.test(text) || /= 0 /.test(text);

/** Check a strace log of `trace` mode against §10:
 *  R1 each WAL record: temp file fsynced before its no-overwrite install, the operation
 *     directory fsynced after it, and for record 0 the operations directory too;
 *  R2 the fan-out directory of the published commit fsynced before the `prepared` record;
 *  R3 the target ref's directory fsynced after Git's ref rename and before the outcome record;
 *  R4 no plain rename(2) ever installs a WAL record (rename overwrites). */
export function checkOrder(trace) {
  const list = calls(trace);
  const writes = new Map(), installs = [], fsyncs = [], refRenames = [], violations = [];
  // fgos-git installs through `/proc/self/fd/<dirfd>/<name>`; resolve those from openat results.
  const fds = new Map();
  const real = (pid, p) => {
    const m = p.match(/^\/proc\/self\/fd\/(\d+)(\/.*)?$/);
    if (!m) return p;
    const dir = fds.get(`${pid}:${m[1]}`) ?? fds.get(m[1]);
    return dir ? dir + (m[2] ?? '') : p;
  };
  list.forEach(({ pid, text }, at) => {
    const o = text.match(/^openat\(.*\) = (\d+)<([^>]+)>$/);
    if (o) { fds.set(`${pid}:${o[1]}`, o[2]); fds.set(o[1], o[2]); }
    const w = text.match(/^(?:write|pwrite64)\(\d+<([^>]+)>, "(.*)", \d+/);
    if (w) writes.set(w[1], (writes.get(w[1]) ?? '') + w[2]);
    const f = text.match(/^f(?:data)?sync\(/);
    if (f && ok(text)) fsyncs.push({ at, path: fdPath(text) });
    const r2 = text.match(/^renameat2\(-?\w+<?([^>,]*)>?, "([^"]+)", -?\w+<?([^>,]*)>?, "([^"]+)", RENAME_NOREPLACE\)/);
    const ln = text.match(/^linkat\(-?\w+<?([^>,]*)>?, "([^"]+)", -?\w+<?([^>,]*)>?, "([^"]+)"/);
    const rn = text.match(/^rename(?:at)?\((?:-?\w+<?([^>,]*)>?, )?"([^"]+)", (?:-?\w+<?([^>,]*)>?, )?"([^"]+)"\)/);
    for (const [m, how] of [[r2, 'renameat2-noreplace'], [ln, 'link'], [rn, 'rename']]) {
      if (!m || !ok(text)) continue;
      const from = path.resolve(m[1] || '/', real(pid, m[2])), to = path.resolve(m[3] || '/', real(pid, m[4]));
      if (/\/fgos\/git\/operations\/[^/]+\/\d{8}\.json$/.test(to)) installs.push({ at, from, to, how });
      else if (/\.lock$/.test(from) && /\/refs\//.test(to)) refRenames.push({ at, to });
      else if (/\/packed-refs$/.test(to)) refRenames.push({ at, to });
    }
  });
  const fsyncedAfter = (dir, from, until = Infinity) => fsyncs.some((s) => s.path === dir && s.at > from && s.at < until);
  const fsyncedBefore = (p, until) => fsyncs.some((s) => s.path === p && s.at < until);
  const records = installs.map((r) => {
    const body = writes.get(r.from) ?? '';
    return { ...r, op: path.basename(path.dirname(r.to)), seq: Number(path.basename(r.to, '.json')), phase: body.match(/\\"phase\\":\\"([a-z-]+)\\"/)?.[1] ?? null, body };
  });
  for (const r of records) {
    if (r.how === 'rename') violations.push(`R4 ${r.to}: installed by rename(2), which overwrites`);
    if (!fsyncedBefore(r.from, r.at)) violations.push(`R1 ${r.to}: temp not fsynced before install`);
    const next = records.find((q) => q.op === r.op && q.seq === r.seq + 1);
    if (!fsyncedAfter(path.dirname(r.to), r.at, next?.at)) violations.push(`R1 ${r.to}: operation directory not fsynced after install`);
    if (r.seq === 0 && !fsyncedAfter(path.dirname(path.dirname(r.to)), r.at, next?.at)) violations.push(`R1 ${r.to}: operations directory not fsynced after record 0`);
  }
  const byOp = Map.groupBy(records, (r) => r.op);
  const ops = [];
  for (const [op, chain] of byOp) {
    const intent = chain.find((r) => r.seq === 0);
    const next = intent?.body.match(/\\"next\\":\{\\"kind\\":\\"oid\\",\\"oid\\":\\"([0-9a-f]+)\\"/)?.[1];
    const reference = intent?.body.match(/\\"resourceSet\\":\[\\"([^\\]+)\\"/)?.[1];
    const prepared = chain.find((r) => r.phase === 'prepared');
    const outcome = chain.find((r) => r.phase === 'outcome');
    const row = { op, records: chain.map((r) => r.phase), next: next ?? null };
    if (prepared && next) {
      const fan = fsyncs.find((s) => s.at < prepared.at && s.path?.endsWith(`/objects/${next.slice(0, 2)}`));
      row.fanoutFsynced = Boolean(fan);
      if (!fan) violations.push(`R2 ${op}: objects/${next.slice(0, 2)} not fsynced before prepared`);
    }
    if (outcome) {
      const cas = refRenames.filter((x) => x.at < outcome.at && (!prepared || x.at > prepared.at)).at(-1);
      row.refRename = cas?.to ?? null;
      if (cas && !fsyncedAfter(path.dirname(cas.to), cas.at, outcome.at)) violations.push(`R3 ${op}: ${path.dirname(cas.to)} not fsynced between ref rename and outcome`);
      if (!cas && reference) row.note = 'no ref rename observed before outcome (no-op CAS or packed update)';
    }
    ops.push(row);
  }
  return { records: records.length, operations: ops, fsyncs: fsyncs.length, refRenames: refRenames.length, violations };
}

async function traceMode(args) {
  const root = path.resolve(args.root);
  if (fs.existsSync(root) && fs.readdirSync(root).length) throw new Error(`root must be fresh: ${root}`);
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const descriptor = args.descriptor ?? await stageDescriptor(root);
  const out = path.join(root, 'e1.strace');
  const plan = path.join(root, 'plan.jsonl');
  execFileSync('strace', ['-f', '-qq', '-yy', '-s', '4096', '-e', 'trace=write,pwrite64,fsync,fdatasync,rename,renameat,renameat2,link,linkat,openat,mkdir,mkdirat', '-o', out,
    process.execPath, SELF, 'workload', '--root', path.join(root, 'device'), '--descriptor', descriptor, '--plan', plan, '--ops', String(args.ops ?? 12)], { stdio: 'inherit' });
  const verdict = checkOrder(fs.readFileSync(out, 'utf8'));
  verdict.trace = out;
  verdict.filesystem = execFileSync('findmnt', ['-T', root, '-n', '-o', 'FSTYPE'], { encoding: 'utf8' }).trim();
  process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
  if (verdict.violations.length) process.exitCode = 1;
}
/** A descriptor for the checkout's built addon (scripts/git-addon.mjs builds it). */
async function stageDescriptor(root) {
  const { ensureGitAddon } = await import('../git-addon.mjs');
  const built = ensureGitAddon();
  const file = path.join(root, 'addon-descriptor.json');
  fs.writeFileSync(file, JSON.stringify({ manifest: JSON.parse(fs.readFileSync(built.manifest, 'utf8')), releaseRoot: CHECKOUT }));
  return file;
}

if (process.argv[1] === SELF) {
  const [mode, ...rest] = process.argv.slice(2);
  const args = options(rest);
  const modes = {
    workload, check, trace: traceMode,
    order: async (a) => { const v = checkOrder(fs.readFileSync(a.trace, 'utf8')); process.stdout.write(JSON.stringify(v, null, 2) + '\n'); if (v.violations.length) process.exitCode = 1; },
    descriptor: async (a) => { fs.mkdirSync(a.root, { recursive: true }); process.stdout.write(await stageDescriptor(a.root) + '\n'); },
  };
  if (!modes[mode]) { console.error(`usage: e1-power-cut.mjs ${Object.keys(modes).join('|')} ...`); process.exit(2); }
  await modes[mode](args);
}
