import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { createGitPublication, createEventStore } from '../../src/git/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';
const require = createRequire(import.meta.url);
const built = ensureGitAddon();
const manifest = JSON.parse(fs.readFileSync(built.manifest));
const descriptor = { manifest, releaseRoot: root };
const options = { descriptor };
const addon = loadNativeAddon(options);

test('one combined load reports both crate versions and Node-API line', () => {
  assert.deepEqual(addon.versions(), { addon: '0.2.0', git: '0.2.0', eventStore: '0.2.0', napi: 8, contracts: { gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 } });
  assert.equal(loadNativeAddon(options), addon);
});
test('a second physical addon copy refuses at load, while a child owns its own marker', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-copy-'));
  try {
    const copy = path.join(temp, 'second.node');
    fs.copyFileSync(built.addon, copy);
    assert.throws(() => require(copy), /git-addon-second-load/);
    assert.equal(execFileSync(process.execPath, ['-e', 'console.log(require(process.argv[1]).versions().napi)', copy], { encoding: 'utf8' }).trim(), '8');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('a worker environment can load the same library instance', async () => {
  const worker = new Worker(`const {parentPort,workerData}=require('node:worker_threads'); parentPort.postMessage(require(workerData).versions());`, { eval: true, workerData: built.addon });
  const result = await new Promise((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); });
  assert.equal(result.napi, 8);
  await worker.terminate();
});
test('resolver refuses absent, unsafe, wrong-target and changed bytes before exposing calls', () => {
  for (const patch of [{ path: '../x.node' }, { target: 'wrong' }, { napiVersion: 99 }, { digest: '0'.repeat(64) }]) {
    assert.throws(() => loadNativeAddon({ descriptor: { releaseRoot: root, manifest: { components: { nativeAddon: { ...manifest.components.nativeAddon, ...patch } } } } }), /git-addon-unavailable/);
  }
  assert.throws(() => loadNativeAddon({ descriptor: { releaseRoot: root, manifest: {} } }), /git-addon-unavailable/);
});
test('real append and read run in a hot section without a child process; Git refuses there', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-store-'));
  const common = path.join(temp, 'common');
  fs.mkdirSync(path.join(common, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  const store = createEventStore(common, [{ v: 1, types: [{ type: 'example.created', domain: 'example', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }], options);
  const hot = path.join(temp, '.fgos');
  fs.mkdirSync(hot);
  try {
    withStateTx(hot, () => {
      assert.throws(() => execFileSync(process.execPath, ['-e', '']), { code: 'exec-under-hot-lock' });
      assert.throws(() => createGitPublication({}, options), /exec-under-hot-lock/);
      const appended = store.append('project', [{ eventType: 'example.created', schemaVersion: 1, payload: { n: 1 }, ts: '2026-10-18T07:00:00.000Z' }], {}, 'fixture-writer', 'fixture-machine', [60]);
      assert.equal(appended.ack.lastSeq, 1);
      const read = store.readInGate(appended.ack.origin, 'project', 0);
      assert.equal(read.events.length, 1);
      assert.equal(read.events[0].payload.n, 1);
    });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('Publication marshals object writes, reads, ordered walks and receipted CAS through the real port', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-publication-'));
  const repoPath = path.join(temp, 'repo');
  fs.mkdirSync(repoPath);
  execFileSync('git', ['init', '--bare', repoPath], { stdio: 'ignore' });
  fs.mkdirSync(path.join(repoPath, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(repoPath, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repoPath, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  let port;
  try {
    port = createGitPublication({ stateRoot: temp, repoPath, trustedMain: repoPath, reference: 'refs/fgos/events/fixture', writer: 'fixture' }, options);
    const blob = port.writeBlob({ bytes: [104, 105] });
    const tree = port.writeTree({ entries: [{ name: 'payload', mode: 0o100644, oid: blob }] });
    const identity = { name: 'Fixture', email: 'fixture@example.invalid' };
    const commit = port.writeCommit({ tree, parents: [], author: identity, committer: identity, authorDate: '1700000000 +0000', committerDate: '1700000000 +0000', message: 'fixture\n' });
    assert.deepEqual(port.readObject({ oid: blob, expectedType: 'blob' }).bytes, [104, 105]);
    const receipt = port.compareAndSwap({ expected: null, next: commit, operationId: 'fixture-cas-1' });
    assert.equal(receipt.attribution, 'thisInvocationWonCas');
    assert.equal(port.readRef({ name: 'refs/fgos/events/fixture' }).oid, commit);
    const walked = port.walkCommits({ tips: [commit], stop: [], maxCommits: 10, maxBytes: 10000 });
    assert.equal(walked.complete, true);
    assert.deepEqual(walked.commits, [{ oid: commit, parents: [], tree }]);
    const hot = path.join(temp, '.fgos'); fs.mkdirSync(hot);
    withStateTx(hot, () => assert.throws(() => port.readRef({ name: 'refs/fgos/events/fixture' }), { code: 'exec-under-hot-lock' }));
    port.close();
    assert.throws(() => port.writeBlob({ bytes: [] }), /publication-closed/);
  } finally { port?.close(); fs.rmSync(temp, { recursive: true, force: true }); }
});

test('staged release and npm-relative manifests resolve their own addon without PATH or cwd fallback', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-payload-'));
  try {
    const nodeSource = path.join(root, 'src/git/native.mjs');
    for (const channel of ['release', 'npm']) {
      const releaseRoot = path.join(temp, channel);
      const payload = channel === 'release' ? path.join(releaseRoot, 'libexec/legacy-node') : releaseRoot;
      for (const dir of ['src/git', 'src/run-supervisor', 'native']) fs.mkdirSync(path.join(payload, dir), { recursive: true });
      fs.copyFileSync(nodeSource, path.join(payload, 'src/git/native.mjs'));
      fs.copyFileSync(path.join(root, 'src/run-supervisor/payload-root.mjs'), path.join(payload, 'src/run-supervisor/payload-root.mjs'));
      const nativePath = path.join(payload, 'native/fgos.node');
      fs.copyFileSync(built.addon, nativePath);
      const host = path.join(releaseRoot, 'bin/fgos');
      fs.mkdirSync(path.dirname(host), { recursive: true }); fs.writeFileSync(host, 'fixture host');
      const record = { ...manifest.components.nativeAddon, path: path.relative(releaseRoot, nativePath) };
      fs.writeFileSync(path.join(channel === 'release' ? releaseRoot : payload, channel === 'release' ? 'manifest.json' : 'native-addon.json'), JSON.stringify({ entries: { fgos: 'bin/fgos' }, components: { legacyNode: { root: channel === 'release' ? 'libexec/legacy-node' : '.' }, nativeAddon: record } }));
      const script = `import {loadNativeAddon} from ${JSON.stringify(new URL(`file://${path.join(payload, 'src/git/native.mjs')}`).href)}; const a=loadNativeAddon({hostBin:${JSON.stringify(channel === 'release' ? host : null)}}); console.log(JSON.stringify({version:a.versions().napi,helper:a.helperExe}));`;
      const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: os.tmpdir(), encoding: 'utf8' }));
      assert.equal(result.version, 8);
      assert.equal(result.helper, host);
      if (channel === 'npm') {
        const descriptorPath = path.join(payload, 'native-addon.json');
        const probe = `import {loadNativeAddon} from ${JSON.stringify(new URL(`file://${path.join(payload, 'src/git/native.mjs')}`).href)}; try { loadNativeAddon({hostBin:null}); } catch(e) { console.log(e.code); }`;
        for (const value of ['{}', '{broken']) {
          fs.writeFileSync(descriptorPath, value);
          assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' }).trim(), 'git-addon-unavailable');
        }
        fs.rmSync(descriptorPath);
        assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' }).trim(), 'git-addon-not-shipped');
      }
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('inspection leaves WAL absent; setup and mapping use the shared Rust config writer', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-inspect-'));
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '--bare', repo], { stdio: 'ignore' });
  const git = (...args) => execFileSync('git', ['--git-dir', repo, ...args], { encoding: 'utf8' }).trim();
  git('config', 'remote.origin.url', '/fixture/remote');
  git('config', '--add', 'remote.origin.fetch', '+refs/heads/*:refs/remotes/origin/*');
  fs.mkdirSync(path.join(repo, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  let port;
  try {
    const facts = addon.inspectGit(temp, repo, repo);
    assert.equal(facts.journal.initialized, false);
    assert.equal(fs.existsSync(path.join(repo, 'fgos/git')), false);
    addon.initializeGitWal(temp, repo, repo);
    assert.equal(addon.inspectGit(temp, repo, repo).journal.initialized, true);
    fs.mkdirSync(path.join(repo, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
    port = createGitPublication({ stateRoot: temp, repoPath: repo, trustedMain: repo, reference: 'refs/fgos/events/fixture', writer: 'fixture' }, options);
    const refspecs = ['+refs/fgos/events/*:refs/fgos/remotes/origin/events/*', '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy'];
    port.ensureFetchMapping({ remote: 'origin', refspecs, operationId: 'mapping-one' });
    const installed = git('config', '--get-all', 'remote.origin.fetch');
    assert.equal(installed.split('\n').length, 3);
    addon.ensureGitFetchMapping(temp, repo, repo, 'origin', refspecs, 'mapping-two');
    assert.equal(git('config', '--get-all', 'remote.origin.fetch'), installed);
    assert.equal(port.fetchMappingProvenance({ remote: 'origin' }).remoteUrl, '/fixture/remote');
    const after = addon.inspectGit(temp, repo, repo);
    assert.equal(after.journal.pendingCount, 0);
    assert.equal(after.fetchRefspecs.length, 3);
    fs.writeFileSync(path.join(repo, 'config.lock'), 'native owner');
    assert.deepEqual(addon.inspectGit(temp, repo, repo).nativeLocks, ['config.lock']);
    assert.equal(fs.readFileSync(path.join(repo, 'config.lock'), 'utf8'), 'native owner');
  } finally { port?.close(); fs.rmSync(temp, { recursive: true, force: true }); }
});

test('native lock inspection includes symlink residue in a linked worktree git directory', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-linked-lock-'));
  const main = path.join(temp, 'main'), linked = path.join(temp, 'linked');
  try {
    execFileSync('git', ['init', '-q', main]);
    execFileSync('git', ['-C', main, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture']);
    execFileSync('git', ['-C', main, 'worktree', 'add', '-q', '--detach', linked]);
    const gitDir = execFileSync('git', ['-C', linked, 'rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim();
    fs.symlinkSync(path.join(temp, 'missing'), path.join(gitDir, 'index.lock'));
    assert.ok(addon.inspectGit(temp, linked, main).nativeLocks.includes('index.lock'));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('Windows lock-taking addon doors refuse by name before resolving paths', { skip: process.platform !== 'win32' }, () => {
  assert.throws(() => new addon.GitPublication('missing-state', 'missing-repo', 'missing-main', 'refs/fgos/events/test', 'test'), /git-lockscope-unavailable-windows/);
  assert.throws(() => addon.ensureGitFetchMapping('missing-state', 'missing-repo', 'missing-main', 'origin', ['+refs/fgos/events/*:refs/fgos/remotes/origin/events/*'], 'test'), /git-lockscope-unavailable-windows/);
});
