import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ensureHostBin, ensureGitAddon as buildAddon, gitAddonSourceDigest} from '../../scripts/run-tests.mjs';
import {pathToFileURL} from 'node:url';
import {ensureGitAddon, root} from '../helpers/git-addon.mjs';
import {buildRustDistribution, nativeAddonLibraryName, nativeAddonComponent, computeArtifactDigest, gitCapabilitiesForHost} from '../../scripts/build-rust-distribution.mjs';
const built = ensureGitAddon();

test('test addon descriptor uses the release capability producer', () => {
  const manifest = JSON.parse(fs.readFileSync(built.manifest));
  assert.deepEqual(manifest.components.nativeAddon.capabilities, gitCapabilitiesForHost());
});

test('release staging carries a real combined addon resolved from its release manifest', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-release-addon-'));
  const oldTarget = process.env.CARGO_TARGET_DIR;
  try {
    const repo = path.join(temp, 'repo');
    fs.mkdirSync(path.join(repo, 'bin'), {recursive: true});
    fs.writeFileSync(path.join(repo, 'bin/fgos.mjs'), 'console.log("fixture");');
    fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({type: 'module', files: ['bin', 'src']}));
    // The loader reaches the holder-lock facade through its handover import, so the payload carries the whole source tree.
    fs.cpSync(path.join(root, 'src'), path.join(repo, 'src'), {recursive: true});
    fs.copyFileSync(path.join(root, 'Cargo.lock'), path.join(repo, 'Cargo.lock'));
    const output = path.join(temp, 'cargo');
    fs.mkdirSync(path.join(output, 'release'), {recursive: true});
    const host = path.join(output, 'release', process.platform === 'win32' ? 'fgos.exe' : 'fgos');
    fs.writeFileSync(host, 'fixture host');
    fs.copyFileSync(built.addon, path.join(output, 'release', nativeAddonLibraryName()));
    process.env.CARGO_TARGET_DIR = output;
    const release = path.join(temp, 'release');
    const result = buildRustDistribution({repoRoot: repo, outDir: release});
    const manifest = JSON.parse(fs.readFileSync(result.manifestPath));
    const addon = manifest.components.nativeAddon;
    assert.equal(addon.napiVersion, 8);
    assert.deepEqual(addon.capabilities, gitCapabilitiesForHost());
    assert.equal(addon.target, `${process.platform}-${process.arch}`);
    assert.equal(Object.keys(addon.crateChecksums).length, 3);
    assert.deepEqual(manifest.capabilities, gitCapabilitiesForHost());
    assert.equal(manifest.files.find(f => f.path === addon.path).digest, `sha256:${addon.digest}`);
    const {artifactDigest, ...payload} = manifest;
    assert.equal(artifactDigest, computeArtifactDigest(payload));
    const loader = pathToFileURL(path.join(release, 'libexec/legacy-node/src/git/native.mjs')).href;
    const probe = `import {loadNativeAddon} from ${JSON.stringify(loader)}; console.log(loadNativeAddon({hostBin:${JSON.stringify(path.join(release, 'bin/fgos'))}}).versions().napi);`;
    assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', probe], {cwd: os.tmpdir(), encoding: 'utf8'}).trim(), '8');
    const storeLoader = pathToFileURL(path.join(release, 'libexec/legacy-node/src/event-store/native.mjs')).href;
    const storeProbe = `import {eventStoreAddonAvailable} from ${JSON.stringify(storeLoader)}; console.log(eventStoreAddonAvailable({hostBin:${JSON.stringify(path.join(release, 'bin/fgos'))}}));`;
    assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', storeProbe], {cwd: os.tmpdir(), encoding: 'utf8'}).trim(), 'true', 'the staged release carries the Event Store exports');
    fs.writeFileSync(path.join(repo, 'Cargo.lock'), '');
    assert.throws(() => nativeAddonComponent(built.addon, 'native/fgos.node', repo), /three locked napi/);
    fs.rmSync(path.join(output, 'release', nativeAddonLibraryName()));
    assert.throws(() => buildRustDistribution({repoRoot: repo, outDir: path.join(temp, 'missing')}), /Compiled native addon not found/);
  } finally {
    if (oldTarget === undefined) delete process.env.CARGO_TARGET_DIR;
    else process.env.CARGO_TARGET_DIR = oldTarget;
    fs.rmSync(temp, {recursive: true, force: true});
  }
});

test('addon test builder respects Cargo target/home and defaults to the normal output directory', {skip: process.platform === 'win32'}, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-env-'));
  try {
    const repo = path.join(temp, 'checkout');
    fs.mkdirSync(repo);
    fs.copyFileSync(path.join(root, 'Cargo.toml'), path.join(repo, 'Cargo.toml'));
    fs.copyFileSync(path.join(root, 'Cargo.lock'), path.join(repo, 'Cargo.lock'));
    // Source fingerprints use the actual source tree; symlinks are only test inputs.
    fs.symlinkSync(path.join(root, 'packages'), path.join(repo, 'packages'), 'dir');
    fs.symlinkSync(path.join(root, 'apps'), path.join(repo, 'apps'), 'dir');
    const builder = path.join(temp, 'cargo');
    fs.writeFileSync(builder, `#!${process.execPath}
const fs = require('node:fs'), path = require('node:path');
fs.writeFileSync(process.env.CARGO_ENV_RECORD, JSON.stringify({target:process.env.CARGO_TARGET_DIR, home:process.env.CARGO_HOME}));
const output=path.join(process.env.CARGO_TARGET_DIR, 'debug');
fs.mkdirSync(output,{recursive:true});
fs.copyFileSync(process.env.ADDON_TEST_BYTES,path.join(output,${JSON.stringify(nativeAddonLibraryName())}));
fs.copyFileSync(process.env.HOST_TEST_BYTES,path.join(output,'fgos'));
`, {mode: 0o755});
    // A release host inherited from the session must never be staged.
    const inherited = path.join(temp, 'release-fgos');
    fs.writeFileSync(inherited, '#!/bin/sh\necho release\n', {mode: 0o755});
    for (const custom of [false, true]) {
      const record = path.join(temp, `env-${custom}.json`);
      const env = {...process.env, PATH: `${temp}${path.delimiter}${process.env.PATH}`, CARGO_ENV_RECORD: record, ADDON_TEST_BYTES: built.addon, HOST_TEST_BYTES: built.hostBin};
      env.FGOS_HOST_BIN = inherited;
      delete env.CARGO_TARGET_DIR;
      delete env.CARGO_HOME;
      if (custom) {
        env.CARGO_TARGET_DIR = path.join(temp, 'external-output');
        env.CARGO_HOME = path.join(temp, 'cargo-home');
        fs.mkdirSync(env.CARGO_HOME);
        fs.writeFileSync(path.join(env.CARGO_HOME, 'sentinel'), 'unchanged');
      }
      const result = buildAddon(env, repo);
      const observed = JSON.parse(fs.readFileSync(record));
      assert.equal(observed.target, custom ? env.CARGO_TARGET_DIR : path.join(repo, 'target'));
      assert.equal(observed.home, env.CARGO_HOME);
      assert.equal(result.cargoEnv.CARGO_HOME, env.CARGO_HOME);
      assert.ok(result.addon.startsWith(`${repo}${path.sep}`), 'external Cargo outputs are copied into the confined dev payload');
      const manifest = JSON.parse(fs.readFileSync(result.manifest));
      assert.ok(!manifest.entries.fgos.split(/[\\/]/).includes('..'));
      assert.equal(path.join(repo, manifest.entries.fgos), result.hostBin);
      assert.deepEqual(fs.readFileSync(result.hostBin), fs.readFileSync(built.hostBin), 'the staged host is the one Cargo built from the checkout, never the inherited FGOS_HOST_BIN');
      assert.equal(env.FGOS_HOST_BIN, result.hostBin);
      assert.equal(env.FGOS_ACTIVE_MANIFEST_PATH, result.manifest);
      const original = fs.readFileSync(result.manifest);
      const sibling = path.join(temp, `sibling-${custom}`);
      fs.mkdirSync(sibling);
      for (const file of ['Cargo.toml', 'Cargo.lock']) fs.copyFileSync(path.join(repo, file), path.join(sibling, file));
      fs.symlinkSync(path.join(root, 'packages'), path.join(sibling, 'packages'), 'dir');
      fs.symlinkSync(path.join(root, 'apps'), path.join(sibling, 'apps'), 'dir');
      fs.symlinkSync(path.join(repo, '.fgos'), path.join(sibling, '.fgos'), 'dir');
      const siblingResult = buildAddon({ ...env }, sibling);
      assert.notEqual(fs.realpathSync(siblingResult.manifest), fs.realpathSync(result.manifest), 'shared .fgos keeps distinct checkout manifests');
      assert.deepEqual(fs.readFileSync(result.manifest), original, 'a parallel checkout does not overwrite this manifest');
      if (custom) assert.deepEqual(fs.readdirSync(env.CARGO_HOME), ['sentinel']);
    }
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});

test('the staged addon digest covers every workspace member, the host sources included, so a changed host is rebuilt', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-addon-digest-'));
  try {
    const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(repo, file)), {recursive: true}); fs.writeFileSync(path.join(repo, file), text); };
    write('Cargo.toml', '[workspace]\nmembers = [\n    "packages/git/rust",\n    "apps/fgos",\n]\n');
    write('Cargo.lock', '');
    write('packages/git/rust/src/lib.rs', '// git\n');
    write('apps/fgos/src/main.rs', 'fn main() {}\n');
    const before = gitAddonSourceDigest(repo);
    write('apps/fgos/README.md', 'not a source\n');
    assert.equal(gitAddonSourceDigest(repo), before, 'only .rs, .toml and .json files count');
    write('apps/fgos/src/main.rs', 'fn main() { println!(); }\n');
    assert.notEqual(gitAddonSourceDigest(repo), before, 'a host source change changes the digest');
  } finally { fs.rmSync(repo, {recursive: true, force: true}); }
});

test('development host carries and loads the addon from its per-invocation manifest', {skip: process.platform === 'win32'}, () => {
  const host = ensureHostBin(process.env, root);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dev-addon-'));
  try {
    const repo = path.join(temp, 'checkout');
    fs.cpSync(path.join(root, 'src'), path.join(repo, 'src'), {recursive: true});
    // The distribution builder and the libraries it imports (its one-door census step among them).
    for (const file of ['scripts/run-rust-dev-host.mjs', 'scripts/build-rust-distribution.mjs', 'scripts/git-one-door-scan.mjs', 'scripts/lib/js-source-lexer.mjs', 'scripts/lib/git-spawn-match.mjs', 'scripts/lib/git-dir-layout.mjs', 'Cargo.lock']) {
      fs.mkdirSync(path.dirname(path.join(repo, file)), {recursive: true});
      fs.copyFileSync(path.join(root, file), path.join(repo, file));
    }
    fs.writeFileSync(path.join(repo, 'package.json'), '{"type":"module"}');
    fs.mkdirSync(path.join(repo, 'bin'));
    fs.writeFileSync(path.join(repo, 'bin/fgos.mjs'), `import fs from 'node:fs'; import {loadNativeAddon} from '../src/git/native.mjs'; const m=JSON.parse(fs.readFileSync(process.env.FGOS_ACTIVE_MANIFEST_PATH)); console.log(JSON.stringify({versions:loadNativeAddon().versions(),component:m.components.nativeAddon,files:m.files}));`);
    const cargo = path.join(temp, 'cargo');
    fs.writeFileSync(cargo, `#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');
const output=path.join(process.env.CARGO_TARGET_DIR,'debug');fs.mkdirSync(output,{recursive:true});
fs.copyFileSync(process.env.DEV_ADDON_HOST,path.join(output,'fgos'));fs.chmodSync(path.join(output,'fgos'),0o755);
fs.copyFileSync(process.env.DEV_ADDON_BYTES,path.join(output,${JSON.stringify(nativeAddonLibraryName())}));
`, {mode: 0o755});
    const output = execFileSync(process.execPath, [path.join(repo, 'scripts/run-rust-dev-host.mjs'), 'list'], {
      cwd: temp, encoding: 'utf8', env: {...process.env, PATH: `${temp}${path.delimiter}${process.env.PATH}`, INIT_CWD: temp, CARGO_TARGET_DIR: path.join(temp, 'output'), DEV_ADDON_HOST: host, DEV_ADDON_BYTES: built.addon},
    });
    const result = JSON.parse(output);
    assert.equal(result.versions.napi, 8);
    assert.equal(result.component.napiVersion, 8);
    assert.deepEqual(result.component.capabilities, gitCapabilitiesForHost());
    assert.equal(result.files.find(f => f.path === result.component.path).digest, `sha256:${result.component.digest}`);
    assert.deepEqual(fs.readdirSync(path.join(repo, '.fgos/runtime/dev-host')), []);
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});

test('only registered Linux releases advertise C5 and fence-backed Git WAL capability', () => {
  assert.deepEqual(gitCapabilitiesForHost('linux', 'x64'), ['git-wal-v1']);
  assert.deepEqual(gitCapabilitiesForHost('win32', 'x64'), []);
  assert.deepEqual(gitCapabilitiesForHost('darwin', 'arm64'), []);
});
