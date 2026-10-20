import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { eventStoreFacts, openStore, prepareStore } from '../../src/event-store/index.mjs';
import { checkEventStore } from '../../src/setup/event-store-checks.mjs';

// Owning proof of spec section 8 topologies (section 23.2 item 12), driven
// through the facade. Layout grammar, linked-worktree common-dir equality on
// one filesystem and Layout::from_common_dir(None) are owned by the crate
// (registry_identity_layout.rs); trust of worker gitfiles, separate-git-dir
// refusal at the Git port and the floor record by Git (inspect.rs, driver.rs).
// Non-git refusal is owned by facade.test.mjs (prepareStore) and
// test/setup/event-store-checks.test.mjs (event-store-open-root).
const built = ensureGitAddon();
const loaderOptions = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
const addon = loadNativeAddon(loaderOptions);
const floor = JSON.parse(fs.readFileSync(path.join(root, 'packages/git/contracts/git-floor.v1.json'), 'utf8'));
const linux = { skip: process.platform !== 'linux' };
const event = n => ({ eventType: 'topology.created', schemaVersion: 1, payload: { n }, ts: '2026-10-20T00:00:00.000Z' });

function world(t) {
  const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-topology-')));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const stateRoot = path.join(temp, 'state'); fs.mkdirSync(stateRoot, { mode: 0o700 });
  const contract = path.join(temp, 'contract.json');
  fs.writeFileSync(contract, JSON.stringify({ v: 1, types: [{ type: 'topology.created', domain: 'topology', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'protocol.file.allow=always', ...args], { encoding: 'utf8' }).trim();
  const repo = (dir, machineId, ...init) => {
    git(path.dirname(dir), 'init', '-q', ...init, dir);
    git(dir, 'config', 'fgos.machineId', machineId);
    git(dir, 'commit', '--allow-empty', '-qm', 'seed');
    return dir;
  };
  const open = (cwd, trustedMain) => {
    const resolved = addon.resolveEventStore(cwd, stateRoot, trustedMain);
    fs.mkdirSync(path.join(resolved.commonDir, 'fgos/events/locks'), { recursive: true, mode: 0o700 });
    // Git's publication WAL requires the activation fence that setup installs in the trusted main.
    const fence = path.join(trustedMain, '.fgos/locks/activation.lock');
    fs.mkdirSync(fence, { recursive: true });
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
    return openStore(resolved, resolved.machineId, [contract], loaderOptions);
  };
  const facts = (cwd, trustedMain) => eventStoreFacts(cwd, { stateRoot, trustedMain, loaderOptions });
  return { temp, stateRoot, git, repo, open, facts };
}

// Append, seal and read back through the facade: the full store path on this topology.
function roundTrip(store, n) {
  const appended = store.append('project', [event(n)], {}, 'topology', []);
  assert.equal(store.seal('project', []).segments, 1);
  assert.ok(store.read({ streams: ['project'] }, []).events.some(e => e.h === appended.events[0].h));
  return appended.ack;
}

// A directory on a different device from `base`, or null when the host has none.
function otherFilesystem(t, base) {
  const device = fs.statSync(base).dev;
  for (const candidate of ['/dev/shm', path.join(root, '.fgos/runtime/tmp')]) {
    try {
      if (fs.statSync(candidate).dev === device) continue;
      const dir = fs.realpathSync(fs.mkdtempSync(path.join(candidate, 'fgos-es-topology-xfs-')));
      t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
      return dir;
    } catch { /* Not writable here: try the next mount. */ }
  }
  return null;
}

function refuses(w, cwd, trustedMain, cause) {
  for (const invoke of [() => w.facts(cwd, trustedMain), () => prepareStore(cwd, { stateRoot: w.stateRoot, trustedMain, loaderOptions })]) {
    assert.throws(invoke, error => JSON.parse(error.message).cause === cause);
  }
}

test('plain repository: one open root in the common directory and a full round trip', linux, t => {
  const w = world(t);
  const plain = w.repo(path.join(w.temp, 'plain'), 'plain-machine');
  const facts = w.facts(plain, plain);
  assert.equal(facts.commonDir, path.join(plain, '.git'));
  assert.equal(facts.openRoot, path.join(plain, '.git/fgos/events'));
  assert.notEqual(facts.guarantee.exclusion, 'none');
  roundTrip(w.open(plain, plain), 1);
});

test('linked worktree on another filesystem shares the main clone store and origin', linux, t => {
  const w = world(t);
  const main = w.repo(path.join(w.temp, 'main'), 'linked-machine');
  const elsewhere = otherFilesystem(t, w.temp);
  if (!elsewhere) return t.skip(`no second writable filesystem on this host besides ${w.temp}`);
  const linked = path.join(elsewhere, 'linked');
  w.git(main, 'worktree', 'add', '--detach', '-q', linked);
  assert.notEqual(fs.statSync(linked).dev, fs.statSync(main).dev);
  for (const trusted of [main, linked]) assert.equal(w.facts(linked, trusted).openRoot, path.join(main, '.git/fgos/events'));
  const fromMain = roundTrip(w.open(main, main), 1);
  const fromLinked = roundTrip(w.open(linked, main), 2);
  assert.equal(fromLinked.origin, fromMain.origin);
  assert.equal(fromLinked.lastSeq, fromMain.lastSeq + 1);
  assert.equal(w.open(main, main).read({ streams: ['project'] }, []).events.length, 2);
});

test('bare repository with a worktree resolves the bare common directory when the bare is trusted', linux, t => {
  const w = world(t);
  const source = w.repo(path.join(w.temp, 'source'), 'source-machine');
  const bare = path.join(w.temp, 'bare.git');
  w.git(w.temp, 'clone', '-q', '--bare', source, bare);
  w.git(bare, 'config', 'fgos.machineId', 'bare-machine');
  const worktree = path.join(w.temp, 'bare-worktree');
  w.git(bare, 'worktree', 'add', '--detach', '-q', worktree);
  assert.equal(w.facts(worktree, bare).openRoot, path.join(bare, 'fgos/events'));
  const fromWorktree = roundTrip(w.open(worktree, bare), 1);
  assert.equal(roundTrip(w.open(bare, bare), 2).origin, fromWorktree.origin);
  // A worktree of a bare repository is not its own trusted main.
  refuses(w, worktree, worktree, 'untrusted-worktree');
});

test('submodule with its own git directory has its own store, separate from the superproject', linux, t => {
  const w = world(t);
  const superproject = w.repo(path.join(w.temp, 'super'), 'super-machine');
  const sub = w.repo(path.join(superproject, 'mod'), 'sub-machine');
  w.git(superproject, 'submodule', 'add', '-q', './mod', 'mod');
  assert.equal(w.facts(sub, sub).openRoot, path.join(sub, '.git/fgos/events'));
  const own = roundTrip(w.open(sub, sub), 1);
  const outer = roundTrip(w.open(superproject, superproject), 1);
  assert.notEqual(own.origin, outer.origin);
  assert.equal(w.open(superproject, superproject).read({ streams: ['project'] }, []).events.length, 1);
});

test('gitfile layouts (--separate-git-dir, absorbed submodule) are refused before any store exists', linux, t => {
  const w = world(t);
  const admin = path.join(w.temp, 'separate-admin');
  const separate = w.repo(path.join(w.temp, 'separate'), 'separate-machine', `--separate-git-dir=${admin}`);
  refuses(w, separate, separate, 'trusted-main-gitfile-unsupported');
  assert.equal(fs.existsSync(path.join(admin, 'fgos')), false);
  const superproject = w.repo(path.join(w.temp, 'super'), 'super-machine');
  const source = w.repo(path.join(w.temp, 'sub-source'), 'source-machine');
  w.git(superproject, 'submodule', 'add', '-q', source, 'absorbed');
  const absorbed = path.join(superproject, 'absorbed');
  assert.equal(fs.statSync(path.join(absorbed, '.git')).isFile(), true);
  refuses(w, absorbed, absorbed, 'trusted-main-gitfile-unsupported');
  refuses(w, absorbed, superproject, 'untrusted-worktree');
  assert.equal(fs.existsSync(path.join(superproject, '.git/modules/absorbed/fgos')), false);
});

test('the Git floor is read from Git: the installed git passes, a git below the floor refuses the store', linux, t => {
  const w = world(t);
  const plain = w.repo(path.join(w.temp, 'plain'), 'floor-machine');
  const facts = w.facts(plain, plain);
  assert.equal(facts.floor.minimum, floor.minimumVersion);
  assert.deepEqual(facts.floor.probes.map(p => p.name).sort(), [...floor.requiredProbes].sort());
  assert.equal(checkEventStore(plain, 'event-store-git-version', { stateRoot: w.stateRoot, trustedMain: plain, loaderOptions }).passed, true);
  // The floor verdict is process-wide, so the old git runs in a fresh process with its own state root.
  const real = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
  const bin = path.join(w.temp, 'old-git'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\nfor last; do :; done\nif [ "$last" = "--version" ]; then echo "git version 2.30.0"; exit 0; fi\nexec ${JSON.stringify(real)} "$@"\n`, { mode: 0o755 });
  const oldState = path.join(w.temp, 'old-state'); fs.mkdirSync(oldState, { mode: 0o700 });
  const probe = `
    const { prepareStore } = await import(${JSON.stringify(pathToFileURL(path.join(root, 'src/event-store/index.mjs')).href)});
    const { checkEventStore } = await import(${JSON.stringify(pathToFileURL(path.join(root, 'src/setup/event-store-checks.mjs')).href)});
    const options = { stateRoot: ${JSON.stringify(oldState)}, trustedMain: ${JSON.stringify(plain)}, loaderOptions: ${JSON.stringify(loaderOptions)} };
    let refused;
    try { prepareStore(${JSON.stringify(plain)}, options); } catch (error) { refused = error.message; }
    console.log(JSON.stringify({ refused, doctor: checkEventStore(${JSON.stringify(plain)}, 'event-store-git-version', options) }));`;
  const out = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } }));
  assert.match(out.refused, /git-floor-unsupported/);
  assert.equal(out.doctor.passed, false);
  assert.equal(fs.existsSync(path.join(plain, '.git/fgos/events/store.json')), false);
});
