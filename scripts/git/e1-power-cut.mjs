#!/usr/bin/env node
// Experiment E1 (Git spec §15, §10): Publication objects, refs, packed-refs and the file WAL
// survive a power cut at every barrier, and fgos-git's own syscalls follow the §10 order.
// scripts/git/e1-power-cut.sh drives the root-only device part; this file is the unprivileged
// half it calls:
//
//   node scripts/git/e1-power-cut.mjs workload --root <dir> --descriptor <file> --plan <file> [--kind publication|scoped] [--ops N] [--handshake]
//   node scripts/git/e1-power-cut.mjs check    --root <dir> --descriptor <file> --plan <file> --acked <n> [--kind publication|scoped]
//   node scripts/git/e1-power-cut.mjs trace    --root <fresh dir> [--kind publication|scoped] [--ops N] [--addon <.so> --host <fgos>]  (strace; no root)
//   node scripts/git/e1-power-cut.mjs order    --trace <strace log>             (checks a trace)
//
// `--kind scoped` runs ScopedCommit instead of Publication: each operation commits a new file in a
// new nested directory, so a blob, two trees and a commit are new loose objects every time. Its
// check adds what only a scoped commit can lose: an acknowledged commit must be on the producer
// branch with every tree and blob readable (`git fsck --full` reports an empty loose object).
// `--addon`/`--host` stage a prebuilt addon and host instead of the checkout's build, to compare
// two binaries on the same workload.
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

const SCOPED_REF = 'refs/heads/producer';
/** One repository with a linked worktree under --root, the activation fence and the state root. */
function layoutScoped(root) {
  return { repo: path.join(root, 'scoped/repo'), linked: path.join(root, 'scoped/linked'), state: path.join(root, 'state') };
}
function prepareScoped(root) {
  const { repo, linked, state } = layoutScoped(root);
  fs.mkdirSync(path.dirname(repo), { recursive: true, mode: 0o700 });
  const git = sandboxGit(root);
  git(['init', '-q', '--initial-branch=trunk', repo]);
  git(['-C', repo, 'config', 'user.name', IDENTITY.name]);
  git(['-C', repo, 'config', 'user.email', IDENTITY.email]);
  fs.writeFileSync(path.join(repo, 'base'), 'base\n');
  git(['-C', repo, 'add', 'base']);
  git(['-C', repo, 'commit', '-qm', 'base']);
  git(['-C', repo, 'worktree', 'add', '-qb', 'producer', linked]);
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ at: 'e1 fixture', v: 1, lock: 'activation', by: 'fgos git' }) + '\n');
  fs.mkdirSync(state, { recursive: true, mode: 0o700 });
  // Everything above is fixture, not a judged operation: make it durable first.
  execFileSync('sync', ['--file-system', root]);
  return { repo: fs.realpathSync(repo), linked: fs.realpathSync(linked), state: fs.realpathSync(state) };
}
async function scopedWorkload(args) {
  const ops = Number(args.ops ?? 12);
  const { repo, linked, state } = prepareScoped(path.resolve(args.root));
  const { index, loader } = await loaders(args.descriptor);
  const { acquireSync, createLockScope } = await import('../../src/holder-lock/index.mjs');
  const lease = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: path.join(repo, '.fgos'), cwd: linked });
  if (lease.result !== 'acquired') throw new Error(`custody of ${linked}: ${lease.result}`);
  const held = [lease.handle];
  const port = index.createGitScopedCommit({ stateRoot: state, repoPath: linked, trustedMain: repo, writer: WRITER }, loader);
  const input = args.handshake ? readline.createInterface({ input: process.stdin }) : null;
  const lines = input ? input[Symbol.asyncIterator]() : null;
  try {
    for (let i = 0; i < ops; i++) {
      const baseline = port.preflight({}, held);
      // A fresh nested directory every operation: a new blob, two new trees and a new commit.
      const file = `d${i}/n/f${i}`;
      fs.mkdirSync(path.join(linked, path.dirname(file)), { recursive: true });
      fs.writeFileSync(path.join(linked, file), `e1 payload ${i}\n`);
      const id = `e1-${i}`;
      appendDurably(args.plan, JSON.stringify({ kind: 'intent', i, id, ref: SCOPED_REF, expected: baseline.head, files: [file] }));
      const receipt = port.commit({ operationId: id, baseline, request: { writes: [file], message: `e1 ${i}\n`, cutoverGrant: null } }, held);
      if (receipt.status !== 'committed') throw new Error(`${id}: ${JSON.stringify(receipt)}`);
      appendDurably(args.plan, JSON.stringify({ kind: 'ack', i, id, ref: SCOPED_REF, next: receipt.oid, files: receipt.files }));
      if (lines) { process.stdout.write(`ack ${i}\n`); await lines.next(); }
    }
  } finally {
    lease.handle.release();
    // The open stdin reader would keep the process alive, and the root driver waits for its exit.
    input?.close();
  }
}

async function workload(args) {
  if (args.kind === 'scoped') return scopedWorkload(args);
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

/** Post-cut invariants of a scoped workload. Judged state: the producer branch tip is fully
 * readable at every replay point, whether or not the operation that made it was acknowledged: its
 * history lists, every tree and blob opens, and `git fsck --full` is clean (the staged blobs and
 * trees are durable before `git commit` moves the branch, the commit object before its ref). The
 * last acknowledged commit is on the branch, its WAL chain terminal. No fsck error is excused: a
 * missing commit object with the branch still at the previous readable commit is not an error. */
async function checkScoped(args) {
  const root = path.resolve(args.root);
  const { repo, state } = layoutScoped(root);
  const gitDir = path.join(repo, '.git');
  const acked = Number(args.acked);
  const plan = readPlan(args.plan);
  const violations = [];
  const git = sandboxGit(root);
  const run = (argv) => { try { return { ok: true, out: git(['--git-dir', gitDir, ...argv], { stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }; } };
  // The reader may drain a whole tree; discard it instead of buffering.
  const runQuiet = (argv) => { try { git(['--git-dir', gitDir, ...argv], { stdio: ['ignore', 'ignore', 'pipe'] }); return { ok: true, out: '' }; } catch (e) { return { ok: false, out: `${e.stderr ?? ''}` }; } };
  const opened = fs.existsSync(gitDir) ? run(['rev-parse', '--git-dir']) : { ok: false, out: 'absent' };
  if (!opened.ok) {
    if (acked > 0) violations.push(`repository missing or unreadable after acknowledged operations: ${String(opened.out).trim().slice(0, 300)}`);
    return finish({ acked, violations });
  }
  const lastAck = plan.filter((p) => p.kind === 'ack' && p.i < acked).at(-1);
  const tipShown = run(['rev-parse', '--verify', '-q', SCOPED_REF]);
  const tip = tipShown.ok ? String(tipShown.out).trim() : null;
  const floor = lastAck?.next ?? plan.find((p) => p.kind === 'intent' && p.i === 0)?.expected ?? null;
  const ahead = Boolean(tip && floor && tip !== floor);
  if (lastAck) {
    if (!tip) violations.push(`${SCOPED_REF}: absent after acked ${lastAck.id} (${lastAck.next})`);
    else if (!run(['merge-base', '--is-ancestor', lastAck.next, SCOPED_REF]).ok) violations.push(`${SCOPED_REF}: ${tip} does not contain acked ${lastAck.id} (${lastAck.next})`);
  }
  // Reading the archive opens every tree and blob of a commit; the tip may be ahead of the last
  // acknowledgement and must be as readable as an acknowledged commit.
  for (const [label, commit] of [['acked ' + lastAck?.id, lastAck?.next], ['branch tip', ahead ? tip : null]]) {
    if (!commit) continue;
    const listed = run(['rev-list', '--objects', commit]);
    if (!listed.ok) violations.push(`${label}: objects not listable: ${String(listed.out).trim().slice(0, 300)}`);
    const read = runQuiet(['archive', '--format=tar', commit]);
    if (!read.ok) violations.push(`${label}: tree not fully readable: ${read.out.trim().slice(0, 300)}`);
  }
  const fsck = run(['fsck', '--full', '--no-dangling']);
  if (!fsck.ok) violations.push(`git fsck: ${String(fsck.out).trim().slice(0, 400)}`);
  const { index, loader } = await loaders(args.descriptor);
  let recovery;
  try { recovery = index.createGitRecovery({ stateRoot: state, repoPath: repo, trustedMain: repo, writer: WRITER }, loader); } catch (e) {
    violations.push(`WAL open: ${e.message.slice(0, 400)}`);
    return finish({ acked, violations });
  }
  for (const p of plan.filter((q) => q.kind === 'ack' && q.i < acked)) {
    try {
      const seen = recovery.inspectOperation({ operationId: p.id });
      if (JSON.stringify(seen).includes('"pending"')) violations.push(`${p.id}: acknowledged but pending in WAL`);
    } catch (e) { violations.push(`${p.id}: ${e.message.slice(0, 300)}`); }
  }
  return finish({ acked, ahead, violations });
  function finish(verdict) {
    process.stdout.write(JSON.stringify(verdict) + '\n');
    if (verdict.violations.length) process.exitCode = 1;
  }
}

/** Post-cut invariants on a replayed image, given the acknowledgements that reached the log
 * before the cut. Prints one JSON verdict; exits 1 on any violation. */
async function check(args) {
  if (args.kind === 'scoped') return checkScoped(args);
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
  // A pin delete interrupted by the cut leaves the chain at pin-release-attempt. The next release
  // re-issues the same exact-old delete, so such a chain is resumable while its pin still holds
  // the recorded candidate (or is already gone); any other pin value is evidence and a violation.
  const releaseChains = new Map();
  const opsDir = path.join(repo, 'fgos', 'git', 'operations');
  for (const id of fs.existsSync(opsDir) ? fs.readdirSync(opsDir) : []) {
    const last = fs.readdirSync(path.join(opsDir, id)).filter((f) => /^\d+\.json$/.test(f)).sort().at(-1);
    let record;
    try { record = last && JSON.parse(fs.readFileSync(path.join(opsDir, id, last), 'utf8')); } catch { continue; }
    if (record?.phase?.phase !== 'pin-release-attempt') continue;
    const pin = `refs/fgos/git-operations/${id}/candidate`;
    const shown = run(['--git-dir', repo, 'rev-parse', '--verify', '-q', pin]);
    const held = shown.ok ? String(shown.out).trim() : null;
    const candidate = record.phase.data?.expected?.oid;
    if (held !== null && held !== candidate) violations.push(`${id}: pin release not resumable, ${pin} holds ${held}, recorded ${candidate}`);
    else releaseChains.set(pin, id);
  }
  // Git leaves a zero-byte `<pin>.lock` when the cut lands inside that delete: legal crash residue
  // that the resumed release clears, so only badRefContent on such a lock is excused.
  const fsck = run(['--git-dir', repo, 'fsck', '--full', '--no-dangling']);
  if (!fsck.ok) {
    const residue = (line) => {
      const m = /^error: (refs\/fgos\/git-operations\/[^/]+\/candidate)\.lock: badRefContent\b/.exec(line);
      return Boolean(m && releaseChains.has(m[1]));
    };
    const rest = String(fsck.out).split('\n').filter((l) => l.trim() && !residue(l));
    if (rest.length) violations.push(`git fsck: ${rest.join('\n').trim().slice(0, 400)}`);
  }
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
 *  R4 no plain rename(2) ever installs a WAL record (rename overwrites);
 *  for a ScopedCommit, whose `next` is only its baseline (R2 cannot see its objects), every loose object
 *  created between its plan `intent` line and its outcome record:
 *  R5 its fan-out directory and `objects/` fsynced after the object is linked and before the outcome;
 *  R6 its file fsynced (under the temp name before the link, or its own name) before the outcome;
 *  R7 every blob and tree of them (all but the commit object) has its file, fan-out directory and `objects/`
 *     fsynced before the ref rename that moves the branch to name them. */
export function checkOrder(trace) {
  const list = calls(trace);
  const writes = new Map(), installs = [], fsyncs = [], refRenames = [], objectLinks = [], planIntents = [], violations = [];
  const cwds = new Map();
  // fgos-git installs through `/proc/self/fd/<dirfd>/<name>`; resolve those from openat results.
  const fds = new Map();
  const real = (pid, p) => {
    const m = p.match(/^\/proc\/self\/fd\/(\d+)(\/.*)?$/);
    if (!m) return p;
    const dir = fds.get(`${pid}:${m[1]}`) ?? fds.get(m[1]);
    return dir ? dir + (m[2] ?? '') : p;
  };
  list.forEach(({ pid, text }, at) => {
    const here = text.match(/AT_FDCWD<([^>]+)>/);
    if (here) cwds.set(pid, here[1]);
    const o = text.match(/^openat\(.*\) = (\d+)<([^>]+)>$/);
    if (o) { fds.set(`${pid}:${o[1]}`, o[2]); fds.set(o[1], o[2]); }
    const w = text.match(/^(?:write|pwrite64)\(\d+<([^>]+)>, "(.*)", \d+/);
    if (w) writes.set(w[1], (writes.get(w[1]) ?? '') + w[2]);
    if (w && path.basename(w[1]) === 'plan.jsonl' && w[2].includes('\\"kind\\":\\"intent\\"')) planIntents.push({ at, id: w[2].match(/\\"id\\":\\"([^"\\]+)\\"/)?.[1] });
    const lk = text.match(/^link\("([^"]+)", "([^"]+)"\) = 0/);
    if (lk) {
      const from = path.resolve(cwds.get(pid) ?? '/', lk[1]), to = path.resolve(cwds.get(pid) ?? '/', lk[2]);
      if (/\/objects\/[0-9a-f]{2}\/[0-9a-f]{38,62}$/.test(to)) objectLinks.push({ at, from, to });
    }
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
    const scoped = /\\"ScopedCommit\\"/.test(intent?.body ?? '');
    const row = { op, records: chain.map((r) => r.phase), next: next ?? null };
    if (scoped && outcome) {
      const from = planIntents.find((p) => p.id === op)?.at ?? intent.at;
      const made = objectLinks.filter((l) => l.at > from && l.at < outcome.at);
      row.objects = made.length;
      if (!made.length) violations.push(`R5 ${op}: no loose object linked between its plan intent and its outcome (trace incomplete)`);
      for (const l of made) {
        const oid = path.basename(path.dirname(l.to)) + path.basename(l.to);
        const fanout = path.dirname(l.to), objects = path.dirname(fanout);
        if (!fsyncedAfter(fanout, l.at, outcome.at) || !fsyncedAfter(objects, l.at, outcome.at)) violations.push(`R5 ${op}: ${oid.slice(0, 12)} fan-out directory or objects/ not fsynced between its link and the outcome`);
        // A temp file keeps its fsync under its own name; a file synced afterwards, under its final one.
        const synced = fsyncs.some((x) => x.at < outcome.at && (x.path === l.to || x.path === l.from || (path.basename(l.from).startsWith('tmp_obj_') && path.basename(x.path ?? '') === path.basename(l.from))));
        if (!synced) violations.push(`R6 ${op}: loose object ${oid.slice(0, 12)} file not fsynced before the outcome`);
      }
      const observed = outcome.body.match(/\\"observed\\":\\"([0-9a-f]+)\\"/)?.[1];
      const move = refRenames.filter((x) => x.at > from && x.at < outcome.at).at(-1);
      if (!observed || !move) violations.push(`R7 ${op}: ${observed ? 'no ref rename' : 'no observed commit'} between its plan intent and its outcome (trace incomplete)`);
      else {
        const staged = made.filter((l) => path.basename(path.dirname(l.to)) + path.basename(l.to) !== observed);
        row.stagedObjects = staged.length;
        for (const l of staged) {
          const oid = path.basename(path.dirname(l.to)) + path.basename(l.to);
          const fanout = path.dirname(l.to), objects = path.dirname(fanout);
          const named = (x) => x.path === l.to || x.path === l.from || (path.basename(l.from).startsWith('tmp_obj_') && path.basename(x.path ?? '') === path.basename(l.from));
          if (!fsyncs.some((x) => x.at < move.at && named(x))) violations.push(`R7 ${op}: staged object ${oid.slice(0, 12)} file not fsynced before the ref rename`);
          if (!fsyncedAfter(fanout, l.at, move.at) || !fsyncedAfter(objects, l.at, move.at)) violations.push(`R7 ${op}: staged object ${oid.slice(0, 12)} fan-out directory or objects/ not fsynced before the ref rename`);
        }
      }
    }
    if (prepared && next && !scoped) {
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
  const descriptor = args.descriptor ?? await stageDescriptor(root, { ...args, cleanup: true });
  const out = path.join(root, 'e1.strace');
  const plan = path.join(root, 'plan.jsonl');
  execFileSync('strace', ['-f', '-qq', '-yy', '-s', '4096', '-e', 'trace=write,pwrite64,fsync,fdatasync,rename,renameat,renameat2,link,linkat,openat,mkdir,mkdirat', '-o', out,
    process.execPath, SELF, 'workload', '--root', path.join(root, 'device'), '--descriptor', descriptor, '--plan', plan, '--kind', args.kind ?? 'publication', '--ops', String(args.ops ?? 12)], { stdio: 'inherit' });
  const verdict = checkOrder(fs.readFileSync(out, 'utf8'));
  verdict.trace = out;
  verdict.filesystem = execFileSync('findmnt', ['-T', root, '-n', '-o', 'FSTYPE'], { encoding: 'utf8' }).trim();
  process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
  if (verdict.violations.length) process.exitCode = 1;
}
/** A descriptor for the checkout's built addon (scripts/git-addon.mjs builds it), or for the
 * prebuilt `--addon` and `--host` binaries, staged beside it and exported to the workload. */
async function stageDescriptor(root, args = {}) {
  const file = path.join(root, 'addon-descriptor.json');
  if (args.addon) {
    if (!args.host) throw new Error('--addon needs --host');
    const { devHostManifest } = await import('../lib/dev-host-manifest.mjs');
    // A release manifest names its files relative to the release root, so stage inside the checkout.
    const staging = path.join(CHECKOUT, '.fgos/runtime/tmp', `e1-addon-${process.pid}`);
    fs.mkdirSync(staging, { recursive: true, mode: 0o700 });
    if (args.cleanup) process.on('exit', () => fs.rmSync(staging, { recursive: true, force: true }));
    const addon = path.join(staging, 'fgos.node'), host = path.join(staging, 'fgos');
    fs.copyFileSync(args.addon, addon); fs.chmodSync(addon, 0o644);
    fs.copyFileSync(args.host, host); fs.chmodSync(host, 0o755);
    const manifest = devHostManifest({ checkoutRoot: CHECKOUT, fgosBin: host, addonFile: addon });
    const manifestFile = path.join(staging, 'manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    Object.assign(process.env, { FGOS_HOST_BIN: host, FGOS_ACTIVE_RELEASE_PATH: CHECKOUT, FGOS_ACTIVE_MANIFEST_PATH: manifestFile });
    fs.writeFileSync(file, JSON.stringify({ manifest, releaseRoot: CHECKOUT }));
    return file;
  }
  const { ensureGitAddon } = await import('../git-addon.mjs');
  const built = ensureGitAddon();
  fs.writeFileSync(file, JSON.stringify({ manifest: JSON.parse(fs.readFileSync(built.manifest, 'utf8')), releaseRoot: CHECKOUT }));
  return file;
}

if (process.argv[1] === SELF) {
  const [mode, ...rest] = process.argv.slice(2);
  const args = options(rest);
  const modes = {
    workload, check, trace: traceMode,
    order: async (a) => { const v = checkOrder(fs.readFileSync(a.trace, 'utf8')); process.stdout.write(JSON.stringify(v, null, 2) + '\n'); if (v.violations.length) process.exitCode = 1; },
    descriptor: async (a) => { fs.mkdirSync(a.root, { recursive: true }); process.stdout.write(await stageDescriptor(a.root, a) + '\n'); },
  };
  if (!modes[mode]) { console.error(`usage: e1-power-cut.mjs ${Object.keys(modes).join('|')} ...`); process.exit(2); }
  await modes[mode](args);
}
