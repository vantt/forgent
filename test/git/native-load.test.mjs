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
  assert.deepEqual(addon.versions(), { addon: '0.2.0', git: '0.2.0', eventStore: '0.2.0', napi: 8 });
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

test('Publication marshals object writes, reads, ordered walks and receipted CAS through the real port', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-publication-'));
  const repoPath = path.join(temp, 'repo');
  fs.mkdirSync(repoPath);
  execFileSync('git', ['init', '--bare', repoPath], { stdio: 'ignore' });
  fs.mkdirSync(path.join(repoPath, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
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
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
