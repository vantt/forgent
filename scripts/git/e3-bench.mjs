#!/usr/bin/env node
// Experiment E3: cost of the combined N-API addon against the owner-set budgets
// (plans/261018-0914-git-component-fgos-git/e3-budgets.md). Every Node-reachable
// workload goes Node -> src/git facade -> combined addon -> fgos-git. The Rust
// example `e3_fixture` only builds WAL states Node cannot reach (interrupted
// publications, a 10,000-record backlog) and times the controller's Rust scan.
//
//   node scripts/git/e3-bench.mjs run [--root <fresh dir>] [--out <json>]
//        [--addon <.node>] [--fixture <e3_fixture>] [--fgctl <fgctl>] [--host <fgos>] [--samples N]
//
// Without --addon/--fixture/--fgctl it compiles them in release mode with cargo,
// using CARGO_TARGET_DIR from the environment (default <checkout>/target).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { gitVersion, sandboxGit } from '../lib/sandbox-git.mjs';

const SELF = fileURLToPath(import.meta.url);
const CHECKOUT = path.resolve(path.dirname(SELF), '../..');
const WRITER = 'e3-writer';
const IDENTITY = { name: 'E3', email: 'e3@fgos.invalid' };
const DATE = '1792300000 +0700';

export function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
function stats(ms) {
  const round = (v) => Math.round(v * 100) / 100;
  return { n: ms.length, p50: round(percentile(ms, 0.5)), p95: round(percentile(ms, 0.95)), p99: round(percentile(ms, 0.99)), max: round(Math.max(...ms)), mean: round(ms.reduce((a, b) => a + b, 0) / ms.length) };
}
function time(fn) { const t = performance.now(); const value = fn(); return [performance.now() - t, value]; }
// Land's prepare and publish wait on the event loop, so they are timed to settlement.
async function timeAsync(fn) { const t = performance.now(); const value = await fn(); return [performance.now() - t, value]; }
function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  return out;
}
// Every fixture repository lives under the mode's fresh root; Git reaches it only through the named
// sandbox door, bound once the root exists. The checkout itself is read through Inspect.
let git = () => { throw new Error('e3-bench: sandbox root not bound'); };
const bindSandbox = (root) => { git = sandboxGit(root); return root; };
const checkoutInspect = ({ index, loader }, state) => index.createGitInspect({ stateRoot: state, repoPath: CHECKOUT, trustedMain: CHECKOUT }, loader);
function privateDir(dir) { fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); fs.chmodSync(dir, 0o700); return fs.realpathSync(dir); }

/** A bare repository the Publication port accepts: event-seal dir and the activation fence. */
function bareRepo(dir) {
  git(['init', '-q', '--bare', dir]);
  return prepareRepo(fs.realpathSync(dir), fs.realpathSync(dir));
}
function prepareRepo(trustedMain, common) {
  fs.mkdirSync(path.join(common, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  const fence = path.join(trustedMain, '.fgos/locks/activation.lock');
  if (!fs.existsSync(path.join(fence, 'TOMBSTONE'))) {
    fs.mkdirSync(fence, { recursive: true });
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ at: 'e3 fixture', v: 1, lock: 'activation', by: 'fgos git' }) + '\n');
  }
  return trustedMain;
}
/** Allocated bytes (st_blocks) and inode count of a tree, the root itself excluded. */
function footprint(dir) {
  let bytes = 0, inodes = 0;
  const walk = (d) => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      const st = fs.lstatSync(p);
      bytes += st.blocks * 512; inodes++;
      if (e.isDirectory()) walk(p);
    }
  };
  walk(dir);
  return { bytes, inodes };
}

async function loaders(descriptorFile) {
  const { loadNativeAddon } = await import('../../src/git/native.mjs');
  const index = await import('../../src/git/index.mjs');
  const descriptor = JSON.parse(fs.readFileSync(descriptorFile, 'utf8'));
  return { loadNativeAddon, index, loader: { descriptor } };
}
function commitFor(port, label, parents) {
  const blob = port.writeBlob({ bytes: [...Buffer.from(label)] });
  const tree = port.writeTree({ entries: [{ name: 'seal.json', mode: 0o100644, oid: blob }] });
  return port.writeCommit({ tree, parents, author: IDENTITY, committer: IDENTITY, authorDate: DATE, committerDate: DATE, message: `${label}\n` });
}
function errorCode(error) {
  try { return JSON.parse(error.message).cause ?? JSON.parse(error.message).code; } catch { return error.code ?? error.message.split(':')[0]; }
}

// ---- child modes -------------------------------------------------------------

/** One fresh process: module import, addon load + first call, first publication. */
async function loadProbe(args) {
  const t0 = performance.now();
  const { loadNativeAddon, index, loader } = await loaders(args.descriptor);
  const t1 = performance.now();
  const addon = loadNativeAddon(loader);
  const t2 = performance.now();
  const port = index.createGitPublication({ stateRoot: args.state, repoPath: args.repo, trustedMain: args.repo, reference: 'refs/fgos/events/e3-load', writer: WRITER }, loader);
  port.readRef({ name: 'refs/fgos/events/e3-load' });
  const t3 = performance.now();
  port.close();
  process.stdout.write(JSON.stringify({ importMs: t1 - t0, loadAndFirstCallMs: t2 - t1, firstPublicationMs: t3 - t2, napi: addon.versions().napi }));
}

/** Live writer for the rollback scenario; started through a release's bin/fgos.mjs. */
async function writer(args) {
  const { index, loader } = await loaders(args.descriptor);
  const port = index.createGitPublication({ stateRoot: args.state, repoPath: args.repo, trustedMain: args.repo, reference: args.ref, writer: WRITER }, loader);
  let stop = false, tip = null, n = 0;
  process.on('SIGTERM', () => { stop = true; });
  process.stdout.write('ready\n');
  while (!stop) {
    const next = commitFor(port, `writer ${process.pid} ${n}`, tip ? [tip] : []);
    const id = `w-${process.pid}-${n++}`;
    const receipt = port.compareAndSwap({ expected: tip, next, operationId: id });
    fs.appendFileSync(args.log, JSON.stringify({ id, next, attribution: receipt.attribution }) + '\n');
    tip = next;
    await new Promise((resolve) => setImmediate(resolve));
  }
  port.close();
}
async function idle() {
  const alive = setInterval(() => {}, 1 << 30);
  process.stdout.write('ready\n');
  await new Promise((resolve) => process.on('SIGTERM', resolve));
  clearInterval(alive);
}

/** Subprocess census: markers bracket each operation in an strace log. */
async function census(args) {
  const { index, loader } = await loaders(args.descriptor);
  const mark = (label) => { try { fs.accessSync(`/nonexistent-e3-marker/${label}`); } catch {} };
  // This subprocess owns fresh fixture repositories too: --repo/--remote
  // must never turn a raw legacy baseline into a write to a caller's repo.
  const root = fs.mkdtempSync(path.join(args.state, 'e3-census-'));
  bindSandbox(root);
  const local = bareRepo(path.join(root, 'local.git'));
  const remote = bareRepo(path.join(root, 'remote.git'));
  git(['--git-dir', local, 'remote', 'add', 'origin', remote]);
  const port = index.createGitPublication({ stateRoot: args.state, repoPath: local, trustedMain: local, reference: 'refs/fgos/events/e3-census', writer: WRITER }, loader);
  const grant = { name: 'origin', pinnedUrl: remote };
  let tip = null;
  for (let r = 0; r < 3; r++) {
    const bytes = [...crypto.randomBytes(1024)];
    mark(`writeBlob-new-${r}-begin`); port.writeBlob({ bytes }); mark(`writeBlob-new-${r}-end`);
    mark(`writeBlob-existing-${r}-begin`); port.writeBlob({ bytes }); mark(`writeBlob-existing-${r}-end`);
    const next = commitFor(port, `census ${r}`, tip ? [tip] : []);
    const id = `census-${r}`;
    mark(`cas-changing-${r}-begin`); port.compareAndSwap({ expected: tip, next, operationId: id }); mark(`cas-changing-${r}-end`);
    mark(`cas-noop-${r}-begin`); port.compareAndSwap({ expected: tip, next, operationId: id }); mark(`cas-noop-${r}-end`);
    tip = next;
    mark(`push-objects-${r}-begin`); port.pushRefs({ remote: 'origin', refs: [['refs/fgos/events/e3-census', 'refs/fgos/events/e3-census']], remoteGrant: grant }); mark(`push-objects-${r}-end`);
    const seeded = commitFor(port, `census seeded ${r}`, [tip]);
    git(['--git-dir', local, 'push', '-q', remote, `${seeded}:refs/seed/census-${r}`]);
    port.compareAndSwap({ expected: tip, next: seeded, operationId: `census-seeded-${r}` });
    tip = seeded;
    mark(`push-no-objects-${r}-begin`); port.pushRefs({ remote: 'origin', refs: [['refs/fgos/events/e3-census', 'refs/fgos/events/e3-census']], remoteGrant: grant }); mark(`push-no-objects-${r}-end`);
  }
  port.close();
}

/** Reassemble interrupted strace calls before counting: another thread may
 * run between a syscall's entry and its successful return. */
export function operationCensus(trace, phases, realGit) {
  const pending = new Map(), opened = new Map(), nativeAcquirers = new Set();
  let phase;
  for (const raw of trace.split('\n')) {
    const row = raw.match(/^(\d+)\s+(.*)$/);
    if (!row) continue;
    const pid = row[1];
    let call = row[2], at = phase;
    if (call.includes('<unfinished ...>')) {
      pending.set(pid, {call:call.replace('<unfinished ...>', ''), phase});
      continue;
    }
    if (call.startsWith('<... ')) {
      const prior = pending.get(pid);
      if (!prior) continue;
      call = prior.call + call.slice(call.indexOf('resumed>') + 8);
      at = prior.phase;
      pending.delete(pid);
    }
    const marker = call.match(/nonexistent-e3-marker\/([a-z0-9-]+)-(begin|end)/);
    if (marker) { phase = marker[2] === 'begin' ? marker[1] : undefined; continue; }
    const open = call.match(/^openat\(.*= (\d+)<([^>]+)>$/);
    if (open) opened.set(`${pid}:${open[1]}`, {path:open[2], acquired:false});
    const close = call.match(/^close\((\d+)/);
    if (close) opened.delete(`${pid}:${close[1]}`);
    if (!at) continue;
    const result = phases[at];
    const exec = call.match(/^execve\("([^"]+)".*= 0$/);
    if (exec && call.includes('"lock-fd"') && call.includes('"--try"')) nativeAcquirers.add(pid);
    if (exec && (exec[1] === realGit || /^git(?:-|$)/.test(path.basename(exec[1])))) {
      result.gitExecs.push(call);
    }
    const lock = call.match(/^flock\((\d+)<([^>]+)>, LOCK_EX.*= 0$/);
    if (lock && /\/\.fgos\/locks\/[^/]+\.lock$/.test(lock[2])) {
      result.exclusiveLockCalls.push(call);
      // A successful EX on a freshly opened description is an acquisition.
      // Reassertions on inherited/previously acquired descriptions validate
      // borrowing; count them separately instead of inflating acquisitions.
      const key = `${pid}:${lock[1]}`;
      if (nativeAcquirers.has(pid) && !opened.has(key)) {
        opened.set(key, {path:lock[2], acquired:false});
      }
      const description = opened.get(key);
      if (description && description.path === lock[2] && !description.acquired) {
        description.acquired = true;
        result.holderLockAcquisitions.push({pid:Number(pid), path:lock[2], call});
      }
    }
  }
  for (const result of Object.values(phases)) {
    result.gitExecCount = result.gitExecs.length;
    result.holderLockAcquisitionCount = result.holderLockAcquisitions.length;
    result.exclusiveLockCallCount = result.exclusiveLockCalls.length;
  }
  return phases;
}

/** Narrow diagnostic census, not an E3 timing run. Trace the existing paired
 * fixtures without a driver switch or containment bypass. Host mode requires
 * Linux + strace; --observer wrapper counts direct Git launches for the suite. */
async function scopedCensus(args) {
  const root = privateDir(path.resolve(args.root));
  const realGit = fs.realpathSync(process.env.PATH.split(path.delimiter)
    .map(p => path.join(p, 'git')).find(p => fs.existsSync(p)));
  const descriptor = args.descriptor ?? await stageAddon(root, fs.realpathSync(args.addon));
  if (args.observer === 'wrapper') {
    const bin = privateDir(path.join(root, 'counting-bin'));
    const log = path.join(root, 'git-execs.log');
    const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
    fs.writeFileSync(log, '');
    fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh
printf '%s\\t' "$@" >> ${quote(log)}
printf '\\n' >> ${quote(log)}
exec ${quote(realGit)} "$@"
`, {mode:0o755});
    const result = execFileSync(process.execPath, [SELF, 'scoped-census-worker',
      '--root', root, '--descriptor', descriptor, '--log', log], {
      encoding:'utf8', env:{...process.env, PATH:bin + path.delimiter + process.env.PATH},
    });
    process.stdout.write(result);
    return;
  }
  const trace = path.join(root, 'operations.strace');
  const result = execFileSync('strace', ['-f', '-qq', '-yy', '-s', '65535', '-e',
    'trace=execve,openat,close,flock,access,faccessat,faccessat2', '-o', trace,
    process.execPath, SELF, 'scoped-census-worker', '--root', root, '--descriptor', descriptor], {
    encoding:'utf8', env:process.env,
  });
  const output = JSON.parse(result);
  operationCensus(fs.readFileSync(trace, 'utf8'), output.phases, realGit);
  output.lockCensus = 'fresh-description successful exclusive acquisitions; all successful exclusive validation calls also listed; inherited custody acquired outside phases';
  output.trace = trace;
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}
async function scopedCensusWorker(args) {
  const phases = {};
  let offset = 0;
  const observer = {
    begin(label) {
      phases[label] = {gitExecs:[], holderLockAcquisitions:[], exclusiveLockCalls:[]};
      if (args.log) offset = fs.statSync(args.log).size;
      try { fs.accessSync(`/nonexistent-e3-marker/${label}-begin`); } catch {}
    },
    end(label) {
      if (args.log) {
        const calls = fs.readFileSync(args.log).subarray(offset).toString('utf8')
          .split('\n').filter(Boolean).map(line => JSON.stringify(line.split('\t').slice(0, -1)));
        phases[label] = {gitExecs:calls, gitExecCount:calls.length};
      }
      try { fs.accessSync(`/nonexistent-e3-marker/${label}-end`); } catch {}
    },
  };
  bindSandbox(args.root);
  const { index, loader } = await loaders(args.descriptor);
  const rows = await typedOperationRows(args.root, privateDir(path.join(args.root, 'state')), index, loader, 1, observer);
  process.stdout.write(JSON.stringify({phases, diagnosticTimings:rows}));
}

// Paired fresh fixtures keep the legacy and typed writers on identical bytes,
// branch topology, disk and custody. Fixture setup is outside every sample.
async function typedOperationRows(root, state, index, loader, samples, observer = {begin() {}, end() {}}) {
  const { acquireSync, createLockScope } = await import('../../src/holder-lock/index.mjs');
  // Preserve E3's old-core control after its production retirement. This
  // immutable history fixture is materialized only inside the experiment root;
  // it is never a production import or a second shipped writer.
  const baselinePath = 'src/runner/execution/commit-unit-work.mjs';
  const [found] = checkoutInspect({ index, loader }, state).pathsAtRevision({ revision: '512e8cd2a68300848bf13859d46872f7fbe94951', paths: [[...Buffer.from(baselinePath)]], maxBlobBytes: 1 << 20 });
  if (found.value.kind !== 'present') throw new Error(`e3-bench: ${baselinePath} at the baseline commit: ${found.value.kind}`);
  const baseline = Buffer.from(found.value.bytes).toString('utf8');
  const baselineFile = path.join(root, 'legacy-unit-commit-baseline.mjs');
  fs.writeFileSync(baselineFile, baseline.replace(/from '([^']+)'/g, (all, specifier) =>
    specifier.startsWith('.') ? `from '${pathToFileURL(path.resolve(CHECKOUT, path.dirname(baselinePath), specifier)).href}'` : all));
  const { commitUnitWork } = await import(pathToFileURL(baselineFile).href);
  const { landRunnerItem } = await import('../../src/runner/merge.mjs');
  const make = label => {
    const repo = path.join(root, label); git(['init', '-q', '--initial-branch=main', repo]);
    git(['-C', repo, 'config', 'user.name', IDENTITY.name]); git(['-C', repo, 'config', 'user.email', IDENTITY.email]);
    // Land seals the project before it publishes, and the seal needs the checkout's machine id.
    git(['-C', repo, 'config', 'fgos.machineId', 'e3-bench']);
    fs.writeFileSync(path.join(repo, 'payload'), 'base\n'); git(['-C', repo, 'add', 'payload']); git(['-C', repo, 'commit', '-qm', 'base']);
    prepareRepo(repo, path.join(repo, '.git'));
    return repo;
  };
  const scoped = { legacy: [], port: [] }, land = { legacy: [], port: [] };
  const prepare = [], publish = [];
  for (let i = 0; i < samples; i++) for (const mode of (i % 2 ? ['port', 'legacy'] : ['legacy', 'port'])) {
    const repo = make(`typed-commit-${mode}-${i}`), linked = `${repo}-linked`;
    git(['-C', repo, 'worktree', 'add', '-qb', 'producer', linked]);
    const claim = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir:path.join(repo,'.fgos'), cwd:linked });
    if (claim.result !== 'acquired') throw new Error(`typed custody: ${claim.result}`);
    try {
      fs.writeFileSync(path.join(linked, 'payload'), 'producer\n');
      let elapsed, out;
      if (mode === 'legacy') {
        observer.begin('scoped-legacy');
        [elapsed, out] = time(() => commitUnitWork({ worktree:linked, repoRoot:repo, custody:claim.handle, unitId:`e3-${i}`, summary:'E3 commit', scope:['payload'] }));
        observer.end('scoped-legacy');
      } else {
        const port = index.createGitScopedCommit({stateRoot:state,repoPath:linked,trustedMain:repo,writer:WRITER},loader);
        // Preflight precedes producer edits in the real consumer flow.
        fs.writeFileSync(path.join(linked,'payload'),'base\n');
        observer.begin('scoped-preflight');
        const [preMs, baseline] = time(() => port.preflight({},[claim.handle]));
        observer.end('scoped-preflight');
        fs.writeFileSync(path.join(linked,'payload'),'producer\n');
        observer.begin('scoped-commit');
        [elapsed,out] = time(() => port.commit({operationId:`e3-${i}`,baseline,request:{writes:['payload'],message:'E3 commit',cutoverGrant:null}},[claim.handle]));
        observer.end('scoped-commit');
        elapsed += preMs;
      }
      if (out.status !== 'committed') throw new Error(JSON.stringify(out));
      scoped[mode].push(elapsed);
    } finally { claim.handle.release(); }
    const main = make(`typed-land-${mode}-${i}`);
    const target = git(['-C',main,'rev-parse','HEAD']);
    git(['-C',main,'checkout','-qb','source']); fs.writeFileSync(path.join(main,'payload'),'producer\n'); git(['-C',main,'commit','-qam','producer']);
    const source = git(['-C',main,'rev-parse','HEAD']); git(['-C',main,'checkout','-q','main']);
    let elapsed;
    if (mode === 'legacy') {
      const start = performance.now();
      // Identical already-verified source tree lets the existing merge path
      // omit verify through its normal immutable-tree check.
      const previousTmpdir = process.env.TMPDIR;
      let out;
      try {
        // The existing merge path chooses os.tmpdir(): keep its candidate on
        // the same fixture disk through the ordinary OS temp-directory input.
        process.env.TMPDIR = root;
        observer.begin('land-legacy');
        out = await landRunnerItem(main,{id:`e3-${i}`,branchHeadAtReturn:source},{branch:'source',ownFileSet:['payload']});
        observer.end('land-legacy');
      } finally {
        if (previousTmpdir === undefined) delete process.env.TMPDIR;
        else process.env.TMPDIR = previousTmpdir;
      }
      elapsed = performance.now() - start;
      if (out.outcome !== 'merged') throw new Error(JSON.stringify(out));
    } else {
      const port = index.createGitLand({stateRoot:state,repoPath:main,trustedMain:main,writer:WRITER},loader);
      try {
        observer.begin('land-prepare');
        const [prepareMs,prepared] = await timeAsync(() => port.prepare({operationId:`land-${i}`,request:{source,target,destination:'refs/heads/main',message:'E3 merge',squash:false,footprint:['payload'],subtree:null,files:[]}}));
        observer.end('land-prepare');
        const candidate = prepared.candidate;
        if (!candidate) throw new Error("Land preparation returned no candidate");
        const evidence = {source:candidate.source,target:candidate.target,candidate:candidate.candidate,treeDigest:candidate.treeDigest,evidenceDigest:'e3-verified-fixture'};
        observer.begin('land-publish');
        const [publishMs] = await timeAsync(() => port.publish(evidence));
        observer.end('land-publish');
        prepare.push(prepareMs); publish.push(publishMs);
        elapsed = prepareMs + publishMs;
      } finally { port.close(); }
    }
    if (fs.readFileSync(path.join(main,'payload'),'utf8') !== 'producer\n') throw new Error('land checkout mismatch');
    land[mode].push(elapsed);
  }
  // The budgets are absolute (e3-budgets.md); the ratio to the legacy path is reported, not budgeted.
  const row = (runs, budgetMs) => {
    const legacy = stats(runs.legacy), port = stats(runs.port);
    return {legacy,port,budgetP95Ms:budgetMs,p95Ratio:port.p95 / legacy.p95,passed:port.p95 <= budgetMs,fixture:'one tracked payload; fresh linked producer / source descendant; same filesystem',verifyExcluded:true};
  };
  return {scopedCommit:row(scoped,250),land:{...row(land,1600),prepare:stats(prepare),publish:stats(publish)}};
}

// ---- the experiment ------------------------------------------------------------

function compileArtifacts() {
  const env = { ...process.env };
  const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--format-version', '1', '--no-deps'], { cwd: CHECKOUT, env, encoding: 'utf8' }));
  execFileSync('cargo', ['build', '--release', '--locked', '-p', 'fgos-node-addon', '--lib', '--example', 'e3_fixture'], { cwd: CHECKOUT, env, stdio: 'inherit' });
  execFileSync('cargo', ['build', '--release', '--locked', '-p', 'fgctl', '-p', 'fgos'], { cwd: CHECKOUT, env, stdio: 'inherit' });
  const release = path.join(metadata.target_directory, 'release');
  return { addon: path.join(release, 'libfgos_node_addon.so'), fixture: path.join(release, 'examples/e3_fixture'), fgctl: path.join(release, 'fgctl'), host: path.join(release, 'fgos') };
}

/**
 * Stage the addon and host the way a dev checkout's manifest names them (the shape `npm test` and
 * `npm run fgos:dev` use): the typed rows load it through the written descriptor, and product code
 * that loads the addon on its own (the legacy Land path) finds the same file through
 * FGOS_HOST_BIN and the FGOS_ACTIVE_RELEASE_PATH/FGOS_ACTIVE_MANIFEST_PATH pair, so one process never loads two addons. The staging
 * sits inside the checkout because that manifest's paths are relative to the payload root; it is
 * removed when this process exits.
 */
async function stageAddon(root, addonFile, hostFile = process.env.FGOS_HOST_BIN) {
  if (!hostFile) throw new Error('e3-bench: staging the addon needs the built fgos host (--host or FGOS_HOST_BIN)');
  const { devHostManifest } = await import('../lib/dev-host-manifest.mjs');
  const staging = privateDir(path.join(CHECKOUT, '.fgos/runtime/e3-bench', `addon-${process.pid}-${crypto.randomUUID()}`));
  process.on('exit', () => fs.rmSync(staging, { recursive: true, force: true }));
  const file = path.join(staging, 'fgos.node');
  fs.copyFileSync(addonFile, file);
  fs.chmodSync(file, 0o644);
  const host = path.join(staging, 'fgos');
  fs.copyFileSync(hostFile, host);
  fs.chmodSync(host, 0o755);
  const manifest = devHostManifest({ checkoutRoot: CHECKOUT, fgosBin: host, addonFile: file });
  const manifestFile = path.join(staging, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  process.env.FGOS_HOST_BIN = host;
  process.env.FGOS_ACTIVE_RELEASE_PATH = CHECKOUT;
  process.env.FGOS_ACTIVE_MANIFEST_PATH = manifestFile;
  const descriptorFile = path.join(root, 'addon-descriptor.json');
  fs.writeFileSync(descriptorFile, JSON.stringify({ manifest, releaseRoot: CHECKOUT }));
  return descriptorFile;
}

function environment(root, inspect) {
  const cpu = os.cpus();
  const read = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch { return null; } };
  return {
    host: os.hostname(), cpu: `${cpu[0].model} x${cpu.length}`, governor: read('/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor'),
    kernel: os.release(), memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    filesystem: execFileSync('findmnt', ['-T', root, '-n', '-o', 'SOURCE,FSTYPE,OPTIONS'], { encoding: 'utf8' }).trim(),
    device: read('/sys/block/nvme0n1/device/model'),
    git: gitVersion(root), node: process.version, rustc: execFileSync('rustc', ['--version'], { encoding: 'utf8' }).trim(),
    loadavg: os.loadavg(), checkoutHead: inspect.resolveCommit({ name: 'HEAD' }), at: new Date().toISOString(),
  };
}

// fsync state of the disk. One plain 4 KiB overwrite + fsync probe has two stable modes on a host
// (measured on the owner's NVMe: 5.2 ms and 7.5 ms, a ratio of 1.44); push time follows them. The fast
// mode is the lowest probe this process has seen, so no host number is hardcoded; a probe above
// FSYNC_MODE_RATIO times that floor (midway between 1 and the observed 1.44) is in the slow mode.
const FSYNC_MODE_RATIO = 1.2;
let fsyncFloorMs = Infinity;
function fsyncProbe(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'fsync-probe'), fd = fs.openSync(file, 'w'), block = Buffer.alloc(4096, 1), ms = [];
  for (let i = 0; i < 200; i++) { fs.writeSync(fd, block, 0, 4096, 0); const t = performance.now(); fs.fsyncSync(fd); ms.push(performance.now() - t); }
  fs.closeSync(fd); fs.unlinkSync(file);
  const p50 = percentile(ms, 0.5);
  fsyncFloorMs = Math.min(fsyncFloorMs, p50);
  return Math.round(p50 * 100) / 100;
}
/** A round is fsync-fast only if the probes taken before and after it are all in the floor's mode. */
export function classifyFsync(probes, floor) {
  return probes.every((p) => p <= FSYNC_MODE_RATIO * floor) ? 'fsync-fast' : 'fsync-slow';
}
/** Push budgets apply only to an fsync-fast round; a slow round is reported, not judged (e3-budgets.md). */
export function pushVerdict(p95, budgetMs, fsyncClass) {
  return fsyncClass === 'fsync-slow' ? 'not-judged: fsync-slow' : p95 <= budgetMs ? 'passed' : 'failed';
}
/** pushRow paired with the fsync probe before and after it, so a flip during the round is caught. */
function judgedPushRow(root, open, samples) {
  const before = fsyncProbe(root), row = pushRow(root, open, samples), after = fsyncProbe(root);
  const fsyncClass = classifyFsync([before, after], fsyncFloorMs);
  const judge = (r, budgetMs) => ({ ...r, budgetP95Ms: budgetMs, p95OverBudget: Math.round(r.p95 / budgetMs * 100) / 100, verdict: pushVerdict(r.p95, budgetMs, fsyncClass) });
  return { fsync: { beforeMs: before, afterMs: after, floorMs: Math.round(fsyncFloorMs * 100) / 100, class: fsyncClass }, withObjects: judge(row.withObjects, 250), withoutObjects: judge(row.withoutObjects, 150) };
}

/** Local transport push of one ref, with and without new objects, on fresh repositories under root. */
function pushRow(root, open, samples) {
  const local = bareRepo(path.join(root, 'push-local.git'));
  const remote = bareRepo(path.join(root, 'push-remote.git'));
  git(['--git-dir', local, 'remote', 'add', 'origin', remote]);
  const reference = 'refs/fgos/events/e3-push';
  const port = open(local, reference);
  const grant = { name: 'origin', pinnedUrl: remote };
  let tip = null, n = 0;
  const advance = (seed) => {
    const next = commitFor(port, `push ${n} ${crypto.randomUUID()}`, tip ? [tip] : []);
    if (seed) git(['--git-dir', local, 'push', '-q', remote, `${next}:refs/seed/${n}`]);
    port.compareAndSwap({ expected: tip, next, operationId: `push-cas-${n++}` });
    tip = next;
  };
  const push = (seed) => {
    advance(seed);
    const [ms, result] = time(() => port.pushRefs({ remote: 'origin', refs: [[reference, reference]], remoteGrant: grant }));
    if (result.refs[0].outcome.kind !== 'accepted') throw new Error(`push not accepted: ${JSON.stringify(result)}`);
    return ms;
  };
  for (let i = 0; i < 10; i++) { push(false); push(true); }
  const withObjects = [], withoutObjects = [];
  for (let i = 0; i < samples; i++) { withObjects.push(push(false)); withoutObjects.push(push(true)); }
  if (git(['--git-dir', remote, 'rev-parse', reference]) !== tip) throw new Error('remote tip differs');
  port.close();
  return { withObjects: stats(withObjects), withoutObjects: stats(withoutObjects) };
}

async function run(args) {
  const samples = Number(args.samples ?? 500);
  const root = args.root ? path.resolve(args.root) : path.join(CHECKOUT, '.fgos/runtime/e3-bench', new Date().toISOString().replace(/[:.]/g, '-'));
  if (fs.existsSync(root)) throw new Error(`root must be fresh: ${root}`);
  bindSandbox(privateDir(root));
  const fstype = execFileSync('findmnt', ['-T', root, '-n', '-o', 'FSTYPE'], { encoding: 'utf8' }).trim();
  if (fstype !== 'ext4') throw new Error(`E3 runs on ext4, not ${fstype}`);
  const artifacts = args.addon && args.fixture && args.fgctl ? { addon: args.addon, fixture: args.fixture, fgctl: args.fgctl, host: args.host ?? process.env.FGOS_HOST_BIN } : compileArtifacts();
  if (!artifacts.host) throw new Error('E3 Node loans require --host <built fgos> or FGOS_HOST_BIN');
  process.env.FGOS_HOST_BIN = fs.realpathSync(artifacts.host);
  for (const k of Object.keys(artifacts)) artifacts[k] = fs.realpathSync(artifacts[k]);
  const descriptor = await stageAddon(root, artifacts.addon);
  const state = privateDir(path.join(root, 'state'));
  const typedLoader = await loaders(descriptor);
  const results = { environment: environment(root, checkoutInspect(typedLoader, state)), artifacts, rows: {} };
  const say = (row, value) => { results.rows[row] = value; console.error(`${row}: ${JSON.stringify(value)}`); };
  const fixture = (...a) => JSON.parse(execFileSync(artifacts.fixture, a, { encoding: 'utf8', maxBuffer: 64 << 20 }));

  const typedRows = await typedOperationRows(root, state, typedLoader.index, typedLoader.loader, Number(args.typedSamples ?? 30));
  say('scopedCommit', typedRows.scopedCommit);
  say('land', typedRows.land);

  // Addon load and first call: one fresh process each.
  {
    const repo = bareRepo(path.join(root, 'load.git'));
    const probe = () => JSON.parse(execFileSync(process.execPath, [SELF, 'load-probe', '--descriptor', descriptor, '--state', state, '--repo', repo], { encoding: 'utf8' }));
    for (let i = 0; i < 5; i++) probe();
    const runs = Array.from({ length: 50 }, probe);
    say('addonLoad', { loadAndFirstCall: stats(runs.map(r => r.loadAndFirstCallMs)), moduleImport: stats(runs.map(r => r.importMs)), firstPublication: stats(runs.map(r => r.firstPublicationMs)) });
  }

  const { index, loader } = await loaders(descriptor);
  const open = (repo, reference) => index.createGitPublication({ stateRoot: state, repoPath: repo, trustedMain: repo, reference, writer: WRITER }, loader);

  // The Publication rows own Rust handles. This row deliberately acquires a
  // Node handle and lends it through the opaque addon path on every Git call.
  {
    const { acquireSync, createLockScope } = await import('../../src/holder-lock/index.mjs');
    const main = path.join(root, 'node-loan'), linked = path.join(root, 'node-loan-linked');
    git(['init', '-q', '--initial-branch=trunk', main]);
    git(['-C', main, 'config', 'user.name', IDENTITY.name]);
    git(['-C', main, 'config', 'user.email', IDENTITY.email]);
    fs.writeFileSync(path.join(main, 'payload'), 'base');
    git(['-C', main, 'add', 'payload']);git(['-C', main, 'commit', '-qm', 'base']);
    git(['-C', main, 'worktree', 'add', '-qb', 'producer', linked]);
    prepareRepo(main, path.join(main, '.git'));
    const claim = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: path.join(main, '.fgos'), cwd: linked });
    if (claim.result !== 'acquired') throw new Error(`Node loan custody: ${claim.result}`);
    try {
      const port = index.createGitScopedCommit({stateRoot:state,repoPath:linked,trustedMain:main,writer:WRITER},loader);
      for (const aged of [false, true]) {
        // Keep the acquired Node handle and its original reach floor alive.
        // Advance PID allocation after acquisition as a long-lived runner does.
        const ageStarted = performance.now();
        const shortProcesses = aged ? 1500 : 0;
        for (let n = 0; n < shortProcesses; n++) execFileSync('true');
        const agedForMs = performance.now() - ageStarted;
        const changing=[], preflight=[];
        for (let n=0;n<samples+20;n++) {
          const [beforeMs, baseline]=time(()=>port.preflight({},[claim.handle]));
          fs.writeFileSync(path.join(linked,'payload'),`producer ${aged} ${n}`);
          const [commitMs,result]=time(()=>port.commit({operationId:`node-loan-${aged}-${n}`,baseline,request:{writes:['payload'],message:'E3 Node loan',cutoverGrant:null}},[claim.handle]));
          if(result.status!=='committed') throw new Error(`Node loan commit: ${JSON.stringify(result)}`);
          if(n>=20){changing.push(commitMs);preflight.push(beforeMs);}
        }
        say(aged ? 'nodeLoanScopedCommitAgedFloor' : 'nodeLoanScopedCommit',{
          authority:'Node dispatch-cwd -> opaque addon loan', shortProcesses, agedForMs,
          changing:stats(changing),preflight:stats(preflight),
        });
      }
    } finally { claim.handle.release(); }
  }

  // Today's Node writer shape (one execFileSync git per step) on the same disk:
  // the "current Node writers" comparison and context for the DC tmpfs baseline.
  {
    const repo = bareRepo(path.join(root, 'spawn.git'));
    const raw = (n, fn) => { for (let i = 0; i < 20; i++) fn(i); return stats(Array.from({ length: n }, (_, i) => time(() => fn(i + 20))[0])); };
    const commits = [];
    for (let i = 0; i < 221; i++) {
      const tree = git(['--git-dir', repo, 'mktree'], { input: '' });
      commits.push(git(['--git-dir', repo, 'commit-tree', tree, ...(i ? ['-p', commits[i - 1]] : []), '-m', `raw ${i}`], { env: { ...process.env, GIT_AUTHOR_NAME: 'E3', GIT_AUTHOR_EMAIL: 'e3@fgos.invalid', GIT_COMMITTER_NAME: 'E3', GIT_COMMITTER_EMAIL: 'e3@fgos.invalid' } }));
    }
    say('rawSpawnBaseline', {
      hashObjectWrite: raw(200, () => git(['--git-dir', repo, 'hash-object', '-w', '--stdin'], { input: crypto.randomBytes(1024) })),
      revParse: raw(200, () => git(['--git-dir', repo, 'rev-parse', '--git-dir'])),
      updateRefCas: raw(200, (i) => git(['--git-dir', repo, 'update-ref', '--no-deref', 'refs/fgos/events/raw', commits[i + 1], i ? commits[i] : '0'.repeat(40)])),
    });
  }

  // writeBlob new / existing.
  {
    const repo = bareRepo(path.join(root, 'blob.git'));
    const port = open(repo, 'refs/fgos/events/e3-blob');
    const blobs = Array.from({ length: samples + 50 }, () => [...crypto.randomBytes(1024)]);
    blobs.slice(0, 50).forEach(bytes => port.writeBlob({ bytes }));
    const fresh = blobs.slice(50).map(bytes => time(() => port.writeBlob({ bytes }))[0]);
    const existing = blobs.slice(50).map(bytes => time(() => port.writeBlob({ bytes }))[0]);
    port.close();
    say('writeBlob', { payloadBytes: 1024, new: stats(fresh), existing: stats(existing) });
  }

  // compareAndSwap changing, the no-op replay, WAL amplification, retention growth.
  {
    const repo = bareRepo(path.join(root, 'cas.git'));
    const reference = 'refs/fgos/events/e3-cas';
    const port = open(repo, reference);
    let tip = null, n = 0;
    const done = [];
    const step = () => {
      const next = commitFor(port, `cas ${n}`, tip ? [tip] : []);
      const id = `cas-${n++}`;
      const [ms, receipt] = time(() => port.compareAndSwap({ expected: tip, next, operationId: id }));
      if (receipt.attribution !== 'thisInvocationWonCas') throw new Error(`unexpected receipt ${JSON.stringify(receipt)}`);
      done.push({ id, expected: tip, next });
      tip = next;
      return ms;
    };
    for (let i = 0; i < 20; i++) step();
    const wal = path.join(repo, 'fgos/git'), pins = path.join(repo, 'refs/fgos/git-operations');
    const before = { wal: footprint(wal), pins: footprint(pins) };
    const casSamples = Number(args.casSamples ?? 300);
    const changing = Array.from({ length: casSamples }, step);
    const after = { wal: footprint(wal), pins: footprint(pins) };
    const per = (k, f) => (after[k][f] - before[k][f]) / casSamples;
    const noop = done.slice(20).map(({ id, expected, next }) => {
      const [ms, receipt] = time(() => port.compareAndSwap({ expected, next, operationId: id }));
      if (receipt.operationId !== id) throw new Error('no-op replay returned another operation');
      return ms;
    });
    say('compareAndSwap', { retainedAtStart: 20, changing: stats(changing), noopReplay: { ...stats(noop), retained: done.length } });
    say('walAmplification', { operations: casSamples, walBytesPerOp: per('wal', 'bytes'), walInodesPerOp: per('wal', 'inodes'), pinBytesPerOp: per('pins', 'bytes'), pinInodesPerOp: per('pins', 'inodes') });
    const windows = [{ retained: done.length, ...stats(Array.from({ length: 100 }, step)) }];
    while (done.length < Number(args.growthTarget ?? 1000)) step();
    windows.push({ retained: done.length, ...stats(Array.from({ length: 100 }, step)) });
    port.close();
    say('compareAndSwapRetentionGrowth', windows);
  }
  {
    const repo = bareRepo(path.join(root, 'compacted.git'));
    const before = footprint(path.join(repo, 'fgos/git'));
    const result = fixture('compacted', state, repo, '200', WRITER);
    const after = footprint(path.join(repo, 'fgos/git')), pins = footprint(path.join(repo, 'refs/fgos/git-operations'));
    say('walAmplificationAfterRustCompaction', { operations: 200, walBytesPerOp: (after.bytes - before.bytes) / 200, walInodesPerOp: (after.inodes - before.inodes) / 200, pinInodesLeft: pins.inodes, compactMsPerOp: result.compactMs / 200 });
  }

  // Diagnostic: the same workloads on the Rust port in-process (no Node-API),
  // on this host and, when bwrap is present, in a private PID namespace where
  // /proc lists only the probe's own processes.
  {
    const condition = (prefix) => {
      const repo = bareRepo(path.join(root, `rust-port-${prefix.length ? 'pidns' : 'host'}.git`));
      const command = [...prefix, artifacts.fixture, 'port', state, repo, '100', WRITER];
      const raw = JSON.parse(execFileSync(command[0], command.slice(1), { encoding: 'utf8', maxBuffer: 64 << 20 }));
      return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, stats(v)]));
    };
    const bwrap = spawnSync('bwrap', ['--version']).status === 0;
    say('rustPortInProcess', { host: { visibleProcesses: fs.readdirSync('/proc').filter(n => /^\d+$/.test(n)).length, ...condition([]) }, privatePidNamespace: bwrap ? condition(['bwrap', '--dev-bind', '/', '/', '--unshare-pid', '--proc', '/proc']) : 'bwrap unavailable' });
  }

  // Local transport push of one ref, with and without new objects.
  fsyncProbe(root);
  say('push', judgedPushRow(root, open, Number(args.pushSamples ?? 100)));

  // Git subprocess count per operation (strace census in a separate process).
  {
    const log = path.join(root, 'census.strace');
    execFileSync('strace', ['-f', '-qq', '-e', 'trace=execve,access,faccessat,faccessat2,fsync,fdatasync', '-o', log, process.execPath, SELF, 'census', '--descriptor', descriptor, '--state', state], { stdio: 'inherit' });
    const counts = {};
    let open = null;
    for (const line of fs.readFileSync(log, 'utf8').split('\n')) {
      const marker = line.match(/nonexistent-e3-marker\/([A-Za-z-]+)-(\d+)-(begin|end)/);
      if (marker) { open = marker[3] === 'begin' ? { op: marker[1], execs: [], fsyncs: 0 } : (counts[marker[1]] ??= [], counts[marker[1]].push(open), null); continue; }
      const exec = line.match(/execve\("([^"]+)"/);
      if (open && exec && !/= -1 E/.test(line)) open.execs.push(path.basename(exec[1]));
      // Count each fsync once: its start line (strace splits a call that
      // another thread interrupts into "<unfinished ...>" and "resumed").
      if (open && /\bf(data)?sync\(/.test(line) && !/resumed/.test(line)) open.fsyncs++;
    }
    const census = {};
    for (const [op, runs] of Object.entries(counts)) {
      const totals = runs.map(r => r.execs.length);
      const byBinary = {};
      for (const name of runs[runs.length - 1].execs) byBinary[name] = (byBinary[name] ?? 0) + 1;
      census[op] = { execvePerRun: totals, gitTopLevel: runs.map(r => r.execs.filter(n => n === 'git').length), fsyncPerRun: runs.map(r => r.fsyncs), lastRunByBinary: byBinary, nodeToAddonCalls: 1 };
    }
    say('subprocessCensus', census);
  }

  // Backlog scan: 10,000 pending operations (Intent records), then the attempt shape.
  for (const shape of ['intent', 'attempt']) {
    const repo = bareRepo(path.join(root, `backlog-${shape}.git`));
    const made = fixture('backlog', repo, '10000', shape, '8');
    const native = (await import('../../src/git/native.mjs')).loadNativeAddon(loader);
    for (let i = 0; i < 3; i++) native.inspectGit(state, repo, repo);
    let last;
    const nodeMs = Array.from({ length: 20 }, () => { const [ms, facts] = time(() => native.inspectGit(state, repo, repo)); last = facts; return ms; });
    const rust = fixture('scan', repo, '20');
    const disk = footprint(path.join(repo, 'fgos/git'));
    say(`backlog-${shape}`, { operations: made.created, recordsPerOperation: made.recordsPerOperation, fixtureSeconds: made.seconds, allocatedBytes: disk.bytes, inodes: disk.inodes, oldestUnresolved: last.journal.oldestUnresolved, nodeInspectGit: stats(nodeMs), complete: last.journal.complete, pendingCount: last.journal.pendingCount, errors: last.journal.errors.length, retainedBytes: last.journal.retainedBytes, rustScan: { ...stats(rust.ms), complete: rust.complete, unresolved: rust.unresolved, errors: rust.errors } });
  }

  // Reconciliation of 100 interrupted publications through the Node route.
  {
    const repo = bareRepo(path.join(root, 'reconcile.git'));
    const made = fixture('interrupted', state, repo, '100', WRITER);
    const native = (await import('../../src/git/native.mjs')).loadNativeAddon(loader);
    const pendingBefore = native.inspectGit(state, repo, repo).journal.pendingCount;
    const outcomes = {};
    const [ms] = time(() => {
      for (const op of made.operations) {
        const port = open(repo, op.reference);
        let outcome;
        try { outcome = `receipt:${port.recover({ operationId: op.id }).attribution}`; } catch (e) { outcome = `error:${errorCode(e)}`; }
        port.close();
        const key = `${op.step} -> ${outcome}`;
        outcomes[key] = (outcomes[key] ?? 0) + 1;
      }
    });
    const after = native.inspectGit(state, repo, repo).journal;
    say('reconciliation', { operations: made.operations.length, fixtureSeconds: made.seconds, totalMs: ms, perOperationMs: ms / made.operations.length, pendingBefore, pendingAfter: after.pendingCount, scanErrors: after.errors.length, outcomes });
  }

  // Rollback with a live writer through the real activation door (fgctl, C5).
  say('rollbackWithLiveProcesses', await rollback(root, artifacts.fgctl, descriptor, index, loader));

  const out = args.out ? path.resolve(args.out) : path.join(root, 'results.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(out);
}

async function rollback(root, fgctl, descriptor, index, loader) {
  const { computeArtifactDigest, classifyReleasePath, nativeAddonComponent } = await import('../build-rust-distribution.mjs');
  const staged = JSON.parse(fs.readFileSync(descriptor, 'utf8'));
  const addonSource = path.join(staged.releaseRoot, staged.manifest.components.nativeAddon.path);
  const base = privateDir(path.join(root, 'rollback'));
  const ws = path.join(base, 'ws');
  git(['init', '-q', ws]);
  const state = privateDir(path.join(base, 'state'));
  const sha = (b) => `sha256:${crypto.createHash('sha256').update(b).digest('hex')}`;
  // Fixture releases: bin/fgos.mjs hands its argv to this harness, so the live
  // writer's argv names the payload exactly as an installed release would.
  const candidate = (name, wal) => {
    const dir = path.join(base, name);
    const host = '#!/bin/sh\nexit 0\n', legacy = 'const [, , harness] = process.argv; await import(new URL(`file://${harness}`));\n';
    fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'libexec/legacy-node/bin'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'bin/fgos'), host, { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'libexec/legacy-node/bin/fgos.mjs'), legacy);
    // Both releases carry the addon exactly as the release producer stages it;
    // only the release-level git-wal-v1 capability tells them apart.
    const addonRelative = 'libexec/native/fgos.node';
    fs.mkdirSync(path.join(dir, path.dirname(addonRelative)), { recursive: true });
    fs.copyFileSync(addonSource, path.join(dir, addonRelative));
    fs.chmodSync(path.join(dir, addonRelative), 0o644);
    const nativeAddon = nativeAddonComponent(path.join(dir, addonRelative), addonRelative, CHECKOUT);
    const manifest = { schemaVersion: 1, entries: { fgos: 'bin/fgos' }, capabilities: wal ? ['git-wal-v1'] : [], components: { legacyNode: { root: 'libexec/legacy-node', entry: 'bin/fgos.mjs', digest: sha(legacy) }, nativeAddon }, requires: {}, stateSchemas: { read: ['1'], write: ['1'], migrations: [] }, target: { os: 'linux', arch: 'x64' }, files: [{ path: 'bin/fgos', kind: 'file', digest: sha(host), mode: '755', class: 'immutable-entry' }, { path: 'libexec/legacy-node/bin/fgos.mjs', kind: 'file', digest: sha(legacy), mode: '644', class: 'immutable-runtime' }, { path: addonRelative, kind: 'file', digest: `sha256:${nativeAddon.digest}`, mode: '644', class: classifyReleasePath(addonRelative) }] };
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ ...manifest, artifactDigest: computeArtifactDigest(manifest) }));
    return dir;
  };
  const oldRelease = candidate('old', false), newRelease = candidate('new', true);
  const controller = (from) => {
    const t = performance.now();
    const r = spawnSync(fgctl, ['upgrade', '--from', from], { cwd: ws, env: { ...process.env, FGOS_STATE_ROOT: state }, encoding: 'utf8' });
    const detail = (r.stderr || '').trim().split('\n').pop();
    return { ok: r.status === 0, ms: performance.now() - t, code: r.status === 0 ? 'completed' : (detail.match(/git-[a-z-]+/)?.[0] ?? detail), detail };
  };
  const init = spawnSync(fgctl, ['init', '--from', oldRelease], { cwd: ws, env: { ...process.env, FGOS_STATE_ROOT: state }, encoding: 'utf8' });
  if (init.status !== 0) return { error: `fgctl init failed: ${init.stderr}` };
  const forward = controller(newRelease);
  if (!forward.ok) return { error: `upgrade to WAL release failed: ${forward.code}` };
  // The fence must be the one fgctl placed, never a fixture tombstone.
  if (!fs.existsSync(path.join(ws, '.fgos/locks/activation.lock/TOMBSTONE'))) return { error: 'fgctl did not place the activation fence' };
  fs.mkdirSync(path.join(ws, '.git/fgos/events/locks'), { recursive: true, mode: 0o700 });
  const start = (release, mode, extra = []) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(release, 'libexec/legacy-node/bin/fgos.mjs'), SELF, mode, '--worktree', fs.realpathSync(ws), ...extra], { cwd: ws, stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.once('data', () => resolve(child));
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`${mode} exited early: ${code}`)));
  });
  const stopChild = (child) => new Promise((resolve) => { child.removeAllListeners('exit'); if (child.exitCode !== null || child.signalCode !== null) return resolve(); child.once('exit', resolve); child.kill('SIGTERM'); });
  const log = path.join(base, 'writer.jsonl');
  const reference = 'refs/fgos/events/e3-rollback';
  const live = await start(newRelease, 'writer', ['--descriptor', descriptor, '--state', privateDir(path.join(base, 'writer-state')), '--repo', fs.realpathSync(ws), '--ref', reference, '--log', log]);
  const attempts = [];
  for (let i = 0; i < 20; i++) {
    const back = controller(oldRelease);
    attempts.push({ direction: 'rollback-to-non-wal-release', ...back });
    if (back.ok) attempts.push({ direction: 'forward-to-wal-release', ...controller(newRelease) });
  }
  await stopChild(live);
  // With the WAL quiescent, a live payload whose release lacks git-wal-v1
  // must still stop the door (predecessor scan, not the pending check).
  const unproven = await start(oldRelease, 'idle');
  const refusedForUnproven = controller(oldRelease);
  await stopChild(unproven);
  const receipts = fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const port = index.createGitPublication({ stateRoot: privateDir(path.join(base, 'verify-state')), repoPath: fs.realpathSync(ws), trustedMain: fs.realpathSync(ws), reference, writer: WRITER }, loader);
  let lost = 0;
  // Recover observes the durable receipt without replaying a publication.
  for (const r of receipts) {
    try { const again = port.recover({ operationId: r.id }); if (again.operationId !== r.id || again.attribution !== 'thisInvocationWonCas' || again.localEffect.publishedOid !== r.next) lost++; } catch { lost++; }
  }
  const tipMatches = port.readRef({ name: reference }).oid === receipts[receipts.length - 1].next;
  port.close();
  const native = (await import('../../src/git/native.mjs')).loadNativeAddon(loader);
  const journal = native.inspectGit(state, fs.realpathSync(ws), fs.realpathSync(ws)).journal;
  const tally = {};
  for (const a of attempts) tally[`${a.direction}: ${a.code}`] = (tally[`${a.direction}: ${a.code}`] ?? 0) + 1;
  return { liveWriterReceipts: receipts.length, attempts: tally, controllerMs: stats(attempts.map(a => a.ms)), unprovenLivePayload: { outcome: refusedForUnproven.code, namesThatPid: refusedForUnproven.detail.includes(`pid ${unproven.pid} `) }, lostOrMismatchedReceipts: lost, tipMatchesLastReceipt: tipMatches, walScan: { complete: journal.complete, pending: journal.pendingCount, errors: journal.errors.length } };
}

const at = process.argv.indexOf(SELF);
const [mode, ...rest] = process.argv.slice(at >= 0 ? at + 1 : 2);
const args = options(rest);
/** The rollback row alone: --root <fresh dir> --addon <.node> --fgctl <fgctl> [--host <fgos>]. */
async function rollbackOnly(args) {
  const root = path.resolve(args.root);
  if (fs.existsSync(root)) throw new Error(`root must be fresh: ${root}`);
  bindSandbox(privateDir(root));
  const descriptor = await stageAddon(root, fs.realpathSync(args.addon), args.host ?? process.env.FGOS_HOST_BIN);
  const { index, loader } = await loaders(descriptor);
  const row = await rollback(root, fs.realpathSync(args.fgctl), descriptor, index, loader);
  console.log(JSON.stringify(row));
  // The owner budget: refused by the C5 door or completed, with no record lost or corrupt.
  if (row.error || row.lostOrMismatchedReceipts !== 0 || !row.tipMatchesLastReceipt) process.exitCode = 1;
}
/** The push row alone, repeated: --root <fresh dir> --addon <.node> --host <fgos> [--rounds N] [--pushSamples N]. */
async function pushOnly(args) {
  const root = path.resolve(args.root);
  if (fs.existsSync(root)) throw new Error(`root must be fresh: ${root}`);
  bindSandbox(privateDir(root));
  const host = fs.realpathSync(args.host ?? process.env.FGOS_HOST_BIN);
  process.env.FGOS_HOST_BIN = host;
  const descriptor = await stageAddon(root, fs.realpathSync(args.addon), host);
  const { index, loader } = await loaders(descriptor);
  const state = privateDir(path.join(root, 'state'));
  const open = (repo, reference) => index.createGitPublication({ stateRoot: state, repoPath: repo, trustedMain: repo, reference, writer: WRITER }, loader);
  for (let round = 0; round < Number(args.rounds ?? 1); round++) {
    const dir = path.join(root, `round-${round}`);
    const mhz = () => { const f = os.cpus().map(c => c.speed); return Math.round(f.reduce((a, b) => a + b, 0) / f.length); };
    const before = { loadavg: os.loadavg(), mhz: mhz() };
    const row = judgedPushRow(dir, open, Number(args.pushSamples ?? 100));
    const remote = path.join(dir, 'push-remote.git');
    const count = (sub, re) => { try { return fs.readdirSync(path.join(remote, sub)).filter(f => re.test(f)).length; } catch { return 0; } };
    const state = { ...footprint(remote), packs: count('objects/pack', /\.pack$/), looseRefs: footprint(path.join(remote, 'refs')).inodes };
    console.log(JSON.stringify({ round, before, after: { loadavg: os.loadavg(), mhz: mhz() }, remote: state, ...row }));
  }
}
const modes = { run, 'push-only': pushOnly, rollback: rollbackOnly, 'load-probe': loadProbe, writer, idle, census, 'scoped-census': scopedCensus, 'scoped-census-worker': scopedCensusWorker };
if (at >= 0) {
if (!modes[mode]) { console.error(`usage: e3-bench.mjs ${Object.keys(modes).join('|')} [options]`); process.exit(2); }
await modes[mode](args);
}
