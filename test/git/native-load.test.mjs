import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createHash } from 'node:crypto';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { loadNativeAddon as loadThroughDoor, nativeHelperExe, canonicalJson, replaceDurably, installOnce } from '../../src/native/door.mjs';
import { createGitPublication } from '../../src/git/index.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';
const require = createRequire(import.meta.url);
const built = ensureGitAddon();
const manifest = JSON.parse(fs.readFileSync(built.manifest));
const descriptor = { manifest, releaseRoot: root };
const options = { descriptor };
const addon = loadNativeAddon(options);

test('one combined load reports both crate versions and Node-API line', () => {
  assert.deepEqual(addon.versions(), { addon: '0.2.0', git: '0.2.0', eventStore: '0.2.0', napi: 8, process: 1, durableFile: '0.2.0', canonicalJson: 1, contracts: { gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 } });
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
test('the door and Git share one addon, one helper and one memo; a different file is refused by name before it is required', () => {
  assert.equal(loadThroughDoor(options), addon);
  assert.equal(nativeHelperExe(addon), fs.realpathSync(path.join(root, manifest.entries.fgos)));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-other-'));
  try {
    // Not an addon at all: only a refusal that precedes `require` can name the second load.
    fs.writeFileSync(path.join(temp, 'second.node'), 'not an addon');
    const other = { releaseRoot: temp, manifest: { components: { nativeAddon: { ...manifest.components.nativeAddon, path: 'second.node', digest: createHash('sha256').update('not an addon').digest('hex') } } } };
    for (const load of [loadThroughDoor, loadNativeAddon]) assert.throws(() => load({ descriptor: other }), { code: 'git-addon-second-load' });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('Git sees its helper and handover when the door loaded the addon first', () => {
  const script = `import {loadNativeAddon as door, nativeHelperExe as helper} from ${JSON.stringify(new URL('../../src/native/door.mjs', import.meta.url).href)};
    import {loadNativeAddon as git, nativeHelperExe} from ${JSON.stringify(new URL('../../src/git/native.mjs', import.meta.url).href)};
    const descriptor = JSON.parse(process.env.DESCRIPTOR); const first = door({descriptor}); const second = git({descriptor});
    console.log(JSON.stringify({same: first === second, helper: nativeHelperExe(second) === helper(first) && helper(first) !== null}));`;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, DESCRIPTOR: JSON.stringify(descriptor) } });
  assert.deepEqual(JSON.parse(out), { same: true, helper: true });
});
test('the door refuses a symlinked addon and a value that is not JSON, and writes files with the mode it is given', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-door-'));
  try {
    fs.symlinkSync(built.addon, path.join(temp, 'link.node'));
    assert.throws(() => loadThroughDoor({ descriptor: { releaseRoot: temp, manifest: { components: { nativeAddon: { ...manifest.components.nativeAddon, path: 'link.node' } } } } }), /addon is a symlink/);
    assert.equal(canonicalJson({ b: [1], a: undefined }), '{"b":[1]}');
    for (const bad of [undefined, 10n, [1, undefined], NaN, () => 1]) assert.throws(() => canonicalJson(bad), { code: 'canonical-json-not-json' });
    const cycle = {}; cycle.self = cycle;
    assert.throws(() => canonicalJson(cycle), { code: 'canonical-json-not-json' });
    assert.equal(installOnce(temp, 'once', 'a', 0o640), 'created');
    assert.equal(installOnce(temp, 'once', 'b', 0o640), 'already-exists');
    assert.equal(replaceDurably(temp, 'once', Buffer.from('c'), 0o640), 'created');
    assert.equal(fs.readFileSync(path.join(temp, 'once'), 'utf8'), 'c');
    assert.equal(fs.statSync(path.join(temp, 'once')).mode & 0o777, 0o640 & ~process.umask());
    assert.throws(() => replaceDurably(path.join(temp, 'missing'), 'x', 'c', 0o600), (e) => e.installed === 'none' && /durable-file-replaceDurably/.test(e.message));
    // A write that fails before the name is installed leaves no retained temporary behind, and the error names the step.
    fs.mkdirSync(path.join(temp, 'occupied'));
    fs.writeFileSync(path.join(temp, 'occupied', 'inner'), 'x');
    assert.throws(() => replaceDurably(temp, 'occupied', 'c', 0o600), (e) => e.installed === 'none' && /failed at name-installed \(installed: none\)/.test(e.message));
    assert.deepEqual(fs.readdirSync(temp).filter((n) => /^\.durable-file-.*\.tmp$/.test(n)), []);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('the door canonicalises the shared vectors to their exact bytes and still refuses every value JSON would silently change', () => {
  const vectors = JSON.parse(fs.readFileSync(path.join(root, 'packages/canonical-json/contracts/vectors/canonical.v1.json'), 'utf8'));
  let checked = 0;
  for (const { input, rawInput, canonical: expected } of vectors) {
    // A raw text that JSON.stringify would not give back (-0, 1.0, 1e20) is outside what a stringified value can carry.
    if (rawInput !== undefined && JSON.stringify(JSON.parse(rawInput)) !== rawInput) continue;
    assert.equal(canonicalJson(JSON.parse(rawInput ?? JSON.stringify(input))), expected);
    checked += 1;
  }
  assert.ok(checked >= 10, `only ${checked} vectors checked`);
  // JSON.stringify would turn each of these into null or drop it; the door names them instead.
  // eslint-disable-next-line no-sparse-arrays
  for (const bad of [[1, undefined], [1, , 2], NaN, 10n, () => 1, { a: [NaN] }, [Infinity]]) assert.throws(() => canonicalJson(bad), { code: 'canonical-json-not-json' });
});

test('real append and read run in a hot section without a child process; Git refuses there', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-store-'));
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '-q', repo]);
  execFileSync('git', ['-C', repo, 'config', 'fgos.machineId', 'fixture-machine']);
  const common = path.join(repo, '.git');
  fs.mkdirSync(path.join(common, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
  const contract = path.join(temp, 'contract.json');
  fs.writeFileSync(contract, JSON.stringify({ v: 1, types: [{ type: 'example.created', domain: 'example', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  const resolved = addon.resolveEventStore(repo, temp, repo);
  const store = openStore(resolved, resolved.machineId, [contract], options);
  const hot = path.join(temp, '.fgos');
  fs.mkdirSync(hot);
  try {
    withStateTx(hot, () => {
      assert.throws(() => execFileSync(process.execPath, ['-e', '']), { code: 'exec-under-hot-lock' });
      assert.throws(() => createGitPublication({}, options), /exec-under-hot-lock/);
      const appended = store.append('project', [{ eventType: 'example.created', schemaVersion: 1, payload: { n: 1 }, ts: '2026-10-18T07:00:00.000Z' }], {}, 'fixture-writer', [60]);
      assert.equal(appended.ack.lastSeq, 1);
      const read = store.readInGate(appended.ack.origin, 'project', 0);
      assert.equal(read.events.length, 1);
      assert.equal(read.events[0].payload.n, 1);
    }, { prefetched: { writer: 'fixture-writer' } });
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
    for (const channel of ['release', 'npm']) {
      const releaseRoot = path.join(temp, channel);
      const payload = channel === 'release' ? path.join(releaseRoot, 'libexec/legacy-node') : releaseRoot;
      for (const dir of ['src/git', 'src/run-supervisor', 'native']) fs.mkdirSync(path.join(payload, dir), { recursive: true });
      // Stage the actual source payload, including the loader's holder bridge
      // and its transitive dependencies, as both packaging channels do.
      fs.cpSync(path.join(root,'src'),path.join(payload,'src'),{recursive:true});
      const nativePath = path.join(payload, 'native/fgos.node');
      fs.copyFileSync(built.addon, nativePath);
      const host = path.join(releaseRoot, 'bin/fgos');
      fs.mkdirSync(path.dirname(host), { recursive: true }); fs.writeFileSync(host, 'fixture host');
      const record = { ...manifest.components.nativeAddon, path: path.relative(releaseRoot, nativePath) };
      fs.writeFileSync(path.join(channel === 'release' ? releaseRoot : payload, channel === 'release' ? 'manifest.json' : 'native-addon.json'), JSON.stringify({ entries: { fgos: 'bin/fgos' }, components: { legacyNode: { root: channel === 'release' ? 'libexec/legacy-node' : '.' }, nativeAddon: record } }));
      const script = `import {loadNativeAddon, nativeHelperExe} from ${JSON.stringify(new URL(`file://${path.join(payload, 'src/git/native.mjs')}`).href)}; const a=loadNativeAddon({hostBin:${JSON.stringify(channel === 'release' ? host : null)}}); console.log(JSON.stringify({version:a.versions().napi,helper:nativeHelperExe(a)}));`;
      const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: os.tmpdir(), encoding: 'utf8' }));
      assert.equal(result.version, 8);
      assert.equal(result.helper, host);
      if (channel === 'npm') {
        const descriptorPath = path.join(payload, 'native-addon.json');
        const probe = `import {loadNativeAddon} from ${JSON.stringify(new URL(`file://${path.join(payload, 'src/git/native.mjs')}`).href)}; try { loadNativeAddon({hostBin:null}); } catch(e) { console.log(e.code); }`;
        // The door never loads the release another payload's host names (FGOS_HOST_BIN is the staged checkout's here).
        const door = `import {selfRecord} from ${JSON.stringify(new URL(`file://${path.join(payload, 'src/runner/dispatch/process-identity.mjs')}`).href)}; try { console.log(typeof selfRecord().pid); } catch(e) { console.log(e.code + ': ' + e.message); }`;
        assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', door], { cwd: os.tmpdir(), encoding: 'utf8' }).trim(), 'number');
        for (const value of ['{}', '{broken']) {
          fs.writeFileSync(descriptorPath, value);
          assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' }).trim(), 'git-addon-unavailable');
        }
        fs.rmSync(descriptorPath);
        assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' }).trim(), 'git-addon-not-shipped');
        assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', door], { cwd: os.tmpdir(), encoding: 'utf8' }).trim(), 'process-door-not-shipped: process-door-not-shipped: onboard this project with fgctl init');
      }
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('inspection reports whether the controller activation fence stands', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-fence-'));
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '--bare', repo], { stdio: 'ignore' });
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  try {
    assert.equal(addon.inspectGit(temp, repo, repo).activationFence, false);
    fs.mkdirSync(fence, { recursive: true });
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
    assert.equal(addon.inspectGit(temp, repo, repo).activationFence, true);
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos 4.4', at: 'fixture' }));
    assert.equal(addon.inspectGit(temp, repo, repo).activationFence, false);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('inspection leaves WAL absent; setup and mapping use the shared Rust config writer', { skip: process.platform === 'win32' }, async () => {
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
    assert.deepEqual(facts.untrustedTransportConfig, []);
    git('config', 'http.https://github.com/.extraheader', 'AUTHORIZATION: secret');
    assert.deepEqual(addon.inspectGit(temp, repo, repo).untrustedTransportConfig, ['http.https://github.com/.extraheader']);
    git('config', '--unset', 'http.https://github.com/.extraheader');

    assert.equal(fs.existsSync(path.join(repo, 'fgos/git')), false);
    addon.initializeGitWal(temp, repo, repo);
    assert.equal(addon.inspectGit(temp, repo, repo).journal.initialized, true);
    fs.mkdirSync(path.join(repo, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
    port = createGitPublication({ stateRoot: temp, repoPath: repo, trustedMain: repo, reference: 'refs/fgos/events/fixture', writer: 'fixture' }, options);
    const refspecs = addon.gitFetchMappings('origin');
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
    const pinDir = path.join(repo, 'refs', 'fgos', 'git-operations', 'op-1');
    fs.mkdirSync(pinDir, { recursive: true });
    fs.writeFileSync(path.join(pinDir, 'candidate.lock'), '');
    assert.deepEqual(addon.inspectGit(temp, repo, repo).nativeLocks, ['config.lock', 'refs/fgos/git-operations/op-1/candidate.lock']);
    assert.ok(fs.existsSync(path.join(pinDir, 'candidate.lock')));
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
  for (const Port of [addon.GitRefs,addon.GitRemote]) assert.throws(()=>new Port('missing-state','missing-repo','missing-main','test'),/git-lock-handover-unsupported/);
  assert.throws(() => new addon.GitPublication('missing-state', 'missing-repo', 'missing-main', 'refs/fgos/events/test', 'test'), /git-lockscope-unavailable-windows/);
  assert.throws(() => addon.ensureGitFetchMapping('missing-state', 'missing-repo', 'missing-main', 'origin', ['+refs/fgos/events/*:refs/fgos/remotes/origin/events/*'], 'test'), /git-lockscope-unavailable-windows/);
});

test('umask 002 driver directories are created safely, repaired by setup, and diagnosed without chmod by doctor', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-driver-umask-'));
  const probe = `
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
    const path = require('node:path');
    const addon = require(process.argv[1]);
    const root = process.argv[2];
    const mode = p => fs.statSync(p).mode & 0o777;
    const fresh = path.join(root, 'fresh');
    assert.equal(process.umask(), 0o002);
    assert.equal(addon.prepareGitDriverDirectories(fresh), true);
    assert.equal(mode(fresh), 0o700);
    assert.equal(mode(path.join(fresh, 'git-empty-hooks')), 0o500);
    assert.equal(addon.prepareGitDriverDirectories(fresh), false);
    const old = path.join(root, 'fgos');
    fs.mkdirSync(old);
    fs.mkdirSync(path.join(old, 'git-empty-hooks'));
    assert.equal(mode(old), 0o775);
    const {checkGit, fixGitDriverDirectories, fixGitFetchMapping} = await import(process.argv[3]);
    process.env.FGOS_STATE_ROOT = old;
    const options = { descriptor: JSON.parse(process.argv[4]) };
    const before = checkGit(root, 'git-component-compatible', options);
    assert.equal(before.passed, false);
    assert.match(before.message, /mode 0775.*group.world writable.*fgos doctor --fix.*git-driver-directories/);
    assert.equal(mode(old), 0o775);
    const fixed = fixGitDriverDirectories(root, options);
    assert.equal(fixed.changed, true, fixed.message);
    assert.equal(mode(old), 0o755);
    assert.equal(mode(path.join(old, 'git-empty-hooks')), 0o500);
    const after = checkGit(root, 'git-component-compatible', options);
    assert.equal(after.passed, true, after.message);
    assert.equal(mode(root), 0o700);
    const {execFileSync} = require('node:child_process');
    const repo = path.join(root, 'repo');
    const git = (...args) => execFileSync('git', ['-C', repo, ...args], {encoding:'utf8'}).trim();
    execFileSync('git', ['init', '-q', repo]);
    git('remote', 'add', 'upstream', '/fixture/remote');
    git('remote', 'add', 'origin', '/fixture/origin');
    git('config', 'http.https://github.com/.extraheader', 'AUTHORIZATION: secret');
    const transport = checkGit(repo, 'git-transport-config', options);
    assert.equal(transport.passed, false);
    assert.match(transport.message, /persist-credentials: false/);
    assert.match(transport.message, /trusted global credential helper or GIT_CONFIG_GLOBAL/);
    assert.doesNotMatch(transport.message, /AUTHORIZATION: secret/);
    assert.equal(git('config', '--get', 'http.https://github.com/.extraheader'), 'AUTHORIZATION: secret');
    git('config', '--unset', 'http.https://github.com/.extraheader');
    assert.equal(checkGit(repo, 'git-transport-config', options).passed, true);
    git('config', 'credential.helper', 'untrusted-helper');
    const localHelper = checkGit(repo, 'git-transport-config', options);
    assert.equal(localHelper.passed, false);
    assert.match(localHelper.message, /persist-credentials: false/);
    git('config', '--unset', 'credential.helper');
    // A real global helper is permitted; private HOME keeps host config intact.
    const priorHome = process.env.HOME;
    const priorXdg = process.env.XDG_CONFIG_HOME;
    const trustedHome = path.join(root, 'trusted-home');
    fs.mkdirSync(trustedHome);
    fs.writeFileSync(path.join(trustedHome, '.gitconfig'), '[credential]\\nhelper = trusted-helper\\n');
    process.env.HOME = trustedHome;
    process.env.XDG_CONFIG_HOME = path.join(trustedHome, '.config');
    assert.equal(checkGit(repo, 'git-transport-config', options).passed, true);
    assert.equal(checkGit(repo, 'git-component-compatible', options).passed, true);
    const {createGitRemote} = await import(new URL('../git/index.mjs', process.argv[3]));
    const bare = path.join(root, 'bare');
    execFileSync('git', ['init', '-q', '--bare', bare]);
    git('remote', 'add', 'helper-proof', bare);
    const remotePort = createGitRemote({stateRoot:old,repoPath:repo,trustedMain:repo,writer:'fixture'}, options);
    assert.deepEqual(remotePort.inspectRemote({remoteGrant:{name:'helper-proof',pinnedUrl:bare},refs:['refs/heads/trunk']}), []);
    if (priorHome === undefined) delete process.env.HOME; else process.env.HOME = priorHome;
    if (priorXdg === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = priorXdg;

    const oldOrigin = addon.gitFetchMappings('origin').find(r => r.includes('legacy*')).replaceAll('*', '');
    git('config', '--add', 'remote.origin.fetch', oldOrigin);
    const fence = path.join(repo, '.fgos/locks/activation.lock');
    fs.mkdirSync(fence, {recursive:true});
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({at:'fixture',v:1,lock:'activation',by:'fgos git'}));
    fs.writeFileSync(path.join(repo, '.fgos/config.json'), JSON.stringify({eventStore:{remote:'upstream'}}));
    const obsolete = addon.gitFetchMappings('upstream').find(r => r.includes('legacy*')).replaceAll('*', '');
    git('config', '--add', 'remote.upstream.fetch', obsolete);
    assert.equal(checkGit(repo, 'git-publication-refspecs', options).passed, false);
    const mappingFix = fixGitFetchMapping(repo, options);
    assert.equal(mappingFix.changed, true, mappingFix.message);
    const mappingCheck = checkGit(repo, 'git-publication-refspecs', options);
    assert.equal(mappingCheck.passed, true, mappingCheck.message);
    assert.equal(git('config', '--get-all', 'remote.origin.fetch').includes(oldOrigin), false);
    git('config', '--add', 'remote.origin.fetch', oldOrigin);
    const originCheck = checkGit(repo, 'git-publication-refspecs', options);
    assert.equal(originCheck.passed, false);
    assert.match(originCheck.message, /obsolete exact legacy mapping.*plain fetch.*doctor --fix/);
    assert.equal(fixGitFetchMapping(repo, options).changed, true);
    assert.equal(git('config', '--get-all', 'remote.upstream.fetch').split('\\n').includes(obsolete), false);
    assert.equal(fixGitFetchMapping(repo, options).changed, false);
    git('config', '--add', 'remote.upstream.fetch', obsolete);
    assert.equal(checkGit(repo, 'git-publication-refspecs', options).passed, false);
    assert.equal(fixGitFetchMapping(repo, options).changed, true);
    assert.equal(checkGit(repo, 'git-publication-refspecs', options).passed, true);

    // Reserved legacy mirrors are diagnosed, never silently read as event tips.
    git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
    git('commit', '--allow-empty', '-qm', 'fixture');
    const badRef = 'refs/fgos/remotes/origin/legacy/events/m';
    git('update-ref', badRef, 'HEAD');
    const reserved = checkGit(repo, 'git-publication-refspecs', options);
    assert.equal(reserved.passed, false); assert.ok(reserved.message.includes(badRef));
    git('update-ref', '-d', badRef);

    const other = path.join(root, 'other');
    fs.mkdirSync(other);
    const link = path.join(root, 'symlink');
    fs.symlinkSync(old, link);
    assert.equal(addon.prepareGitDriverDirectories(link), false);
    process.env.FGOS_STATE_ROOT = link;
    assert.equal(checkGit(repo, 'git-component-compatible', options).passed, true);
    fs.chmodSync(old, 0o775);
    assert.equal(addon.prepareGitDriverDirectories(link), true);
    assert.equal(mode(old), 0o755);
    // A mis-pinned unrelated root is never chmodded.
    assert.throws(() => addon.prepareGitDriverDirectories(other), /refusing to chmod.*FGOS_STATE_ROOT/);
    assert.equal(mode(other), 0o775);
    fs.symlinkSync(other, path.join(other, 'git-empty-hooks'));
    assert.throws(() => addon.prepareGitDriverDirectories(other));
    const hooks = path.join(old, 'git-empty-hooks');
    fs.chmodSync(hooks, 0o700);
    fs.writeFileSync(path.join(hooks, 'foreign'), 'foreign');
    assert.throws(() => addon.prepareGitDriverDirectories(old), error => error.message.includes(hooks) && /inspect.*remove foreign.*doctor --fix/.test(error.message));
    assert.equal(mode(hooks), 0o700);
    fs.unlinkSync(path.join(hooks, 'foreign'));
    fs.chmodSync(hooks, 0o000);
    if (process.getuid() !== 0) {
      const unreadable = checkGit(repo, 'git-component-compatible', options);
      assert.equal(unreadable.passed, false); assert.ok(unreadable.message.includes(hooks));
      assert.match(unreadable.message, /restore owner read.search.*doctor --fix/);
      assert.throws(() => addon.prepareGitDriverDirectories(old), error => error.message.includes(hooks) && /restore owner read.search.*doctor --fix/.test(error.message));
    }
    fs.chmodSync(hooks, 0o700);
    assert.equal(addon.prepareGitDriverDirectories(old), true);
    fs.rmdirSync(hooks);
    fs.symlinkSync(other, hooks);
    assert.throws(() => addon.prepareGitDriverDirectories(old), error => error.message.includes(hooks));
    assert.equal(mode(other), 0o775);
    fs.unlinkSync(hooks);
    assert.equal(addon.prepareGitDriverDirectories(old), true);
    // A real driver floor record also identifies a custom named fgOS root.
    const custom = path.join(root, 'custom');
    fs.mkdirSync(custom, {mode:0o700});
    process.env.FGOS_STATE_ROOT = custom;
    assert.equal(checkGit(repo, 'git-component-compatible', options).passed, true);
    fs.copyFileSync(path.join(old, 'git-floor-verdict.json'), path.join(custom, 'git-floor-verdict.json'));
    fs.chmodSync(custom, 0o775);
    assert.equal(addon.prepareGitDriverDirectories(custom), true);
    assert.equal(mode(custom), 0o755);
  `;
  try {
    execFileSync('/bin/sh', ['-c', 'umask 002; exec "$@"', 'umask-probe', process.execPath, '--input-type=commonjs', '-e', `(async()=>{${probe}})().catch(e=>{console.error(e);process.exit(1)})`, built.addon, temp, new URL('../../src/setup/git-checks.mjs', import.meta.url).href, JSON.stringify(descriptor)], { encoding: 'utf8' });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
