import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ensureHostBin, ensureGitAddon as buildAddon, gitAddonDirectory, gitAddonSourceDigest, GIT_ADDON_SOURCE_DIGEST_FILE} from '../../scripts/lib/git-addon-stage.mjs';
import {archiveDirectory, ARCHIVE_SHA256} from '../../scripts/ort-static.mjs';
import {devHostManifest} from '../../scripts/lib/dev-host-manifest.mjs';
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
    // The builder asks this host for the source payload (`fgos internal source-payload`), so it is the suite's real host.
    fs.copyFileSync(process.env.FGOS_HOST_BIN, host);
    fs.writeFileSync(path.join(output, 'release', process.platform === 'win32' ? 'fgctl.exe' : 'fgctl'), 'fixture fgctl');
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
    const storeProbe = `import {loadNativeAddon} from ${JSON.stringify(loader)}; const native = loadNativeAddon({hostBin:${JSON.stringify(path.join(release, 'bin/fgos'))}});
      console.log(['resolveEventStore', 'openStore', 'eventStoreFacts', 'maintainEventStore', 'eventStoreBranchKey'].every(name => typeof native[name] === 'function')
        && ['read', 'append', 'admitWrites', 'promote', 'maintenance', 'status', 'legacyLayout'].every(name => typeof native.EventStore?.prototype?.[name] === 'function'));`;
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
    fs.symlinkSync(path.join(root, 'bin'), path.join(repo, 'bin'), 'dir');
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
      // A concurrent stage in the same checkout must not touch a file whose bytes did not change: the
      // leak check of the first run reads every staged file's mtime.
      const digestFile = path.join(path.dirname(result.addon), GIT_ADDON_SOURCE_DIGEST_FILE);
      const settled = new Date(Date.now() - 60_000);
      fs.utimesSync(digestFile, settled, settled);
      buildAddon({ ...env }, repo);
      assert.equal(fs.statSync(digestFile).mtimeMs, settled.getTime(), 'a second stage of unchanged sources leaves the source digest untouched');
      const sibling = path.join(temp, `sibling-${custom}`);
      fs.mkdirSync(sibling);
      for (const file of ['Cargo.toml', 'Cargo.lock']) fs.copyFileSync(path.join(repo, file), path.join(sibling, file));
      fs.symlinkSync(path.join(root, 'packages'), path.join(sibling, 'packages'), 'dir');
      fs.symlinkSync(path.join(root, 'apps'), path.join(sibling, 'apps'), 'dir');
      fs.symlinkSync(path.join(root, 'bin'), path.join(sibling, 'bin'), 'dir');
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
    for (const file of ['scripts/run-rust-dev-host.mjs', 'scripts/lib/dev-host-manifest.mjs', 'scripts/lib/git-addon-stage.mjs', 'scripts/build-rust-distribution.mjs', 'scripts/git-one-door-scan.mjs', 'scripts/lib/js-source-lexer.mjs', 'scripts/lib/rust-source.mjs', 'scripts/lib/git-spawn-match.mjs', 'scripts/lib/git-dir-layout.mjs', 'Cargo.lock']) {
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

test('only registered Linux and Windows releases advertise C5 and fence-backed Git WAL capability', () => {
  assert.deepEqual(gitCapabilitiesForHost('linux', 'x64'), ['git-wal-v1']);
  assert.deepEqual(gitCapabilitiesForHost('win32', 'x64'), ['git-wal-v1']);
  assert.deepEqual(gitCapabilitiesForHost('darwin', 'arm64'), []);
});

test('a script reuses a fresh staged addon without cargo and names a stale one it cannot rebuild', {skip: process.platform === 'win32' || process.getuid?.() === 0}, () => {
  // No existing test covers this: the test above exercises only the build path (buildAddon with a builder stub).
  // This proof verifies that ensureAddonForScript reuses a fresh staged addon without invoking cargo,
  // and when the addon is stale and target/ is unwritable, throws an error naming the stale addon and recovery command.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-script-reuse-'));
  try {
    const repo = path.join(temp, 'checkout');
    fs.mkdirSync(repo);
    fs.copyFileSync(path.join(root, 'Cargo.toml'), path.join(repo, 'Cargo.toml'));
    fs.copyFileSync(path.join(root, 'Cargo.lock'), path.join(repo, 'Cargo.lock'));
    fs.symlinkSync(path.join(root, 'packages'), path.join(repo, 'packages'), 'dir');
    fs.symlinkSync(path.join(root, 'apps'), path.join(repo, 'apps'), 'dir');
    fs.symlinkSync(path.join(root, 'bin'), path.join(repo, 'bin'), 'dir');
    fs.symlinkSync(path.join(root, 'scripts'), path.join(repo, 'scripts'), 'dir');
    fs.symlinkSync(path.join(root, 'src'), path.join(repo, 'src'), 'dir');

    // A stub cargo in PATH that records any execution
    const cargoRecord = path.join(temp, 'cargo-called.log');
    const cargoStub = path.join(temp, 'cargo');
    const targetDir = path.join(repo, 'target');
    // The stub fails the way cargo does on a read-only target directory.
    fs.writeFileSync(cargoStub, `#!${process.execPath}
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(cargoRecord)}, 'cargo called\\n');
process.stderr.write(${JSON.stringify(`error: failed to open: ${targetDir}/debug/.cargo-build-lock\n\nCaused by:\n  Read-only file system (os error 30)\n`)});
process.exit(101);
`, {mode: 0o755});

    // Stage a fresh addon for repo
    const addonDir = gitAddonDirectory(repo);
    fs.mkdirSync(addonDir, {recursive: true});
    const addon = path.join(addonDir, 'fgos.node');
    fs.copyFileSync(built.addon, addon);
    const hostBin = path.join(addonDir, 'fgos');
    fs.copyFileSync(built.hostBin, hostBin);
    fs.chmodSync(hostBin, 0o755);
    const manifest = path.join(addonDir, 'manifest.json');
    const manifestContent = `${JSON.stringify(devHostManifest({checkoutRoot: repo, fgosBin: hostBin, addonFile: addon}), null, 2)}\n`;
    fs.writeFileSync(manifest, manifestContent);
    const digestFile = path.join(addonDir, GIT_ADDON_SOURCE_DIGEST_FILE);
    fs.writeFileSync(digestFile, gitAddonSourceDigest(repo));

    const runProbe = (mode) => {
      const probe = `
import assert from 'node:assert/strict';
import { ensureAddonForScript } from './scripts/lib/git-addon-stage.mjs';

const env = { ...process.env };
delete env.FGOS_ACTIVE_MANIFEST_PATH;
delete env.FGOS_HOST_BIN;
delete env.FGOS_ACTIVE_RELEASE_PATH;

if (process.argv[1] === 'fresh') {
  ensureAddonForScript(env, ${JSON.stringify(repo)});
  console.log(JSON.stringify({
    FGOS_HOST_BIN: env.FGOS_HOST_BIN,
    FGOS_ACTIVE_RELEASE_PATH: env.FGOS_ACTIVE_RELEASE_PATH,
    FGOS_ACTIVE_MANIFEST_PATH: env.FGOS_ACTIVE_MANIFEST_PATH,
  }));
} else if (process.argv[1] === 'stale') {
  try {
    ensureAddonForScript(env, ${JSON.stringify(repo)});
    assert.fail('should have thrown');
  } catch (err) {
    console.log(JSON.stringify({ message: err.message }));
  }
}
`;
      // The caller's cargo settings must not steer the probe: the target is always the read-only directory.
      const childEnv = {...process.env, PATH: `${temp}${path.delimiter}${process.env.PATH}`, CARGO_TARGET_DIR: targetDir};
      delete childEnv.CARGO_BUILD_TARGET_DIR;
      return execFileSync(process.execPath, ['--input-type=module', '-e', probe, mode], {
        cwd: repo,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        env: childEnv,
      });
    };

    // 1. Fresh case: stub cargo is not called, env trio is set
    const freshOut = JSON.parse(runProbe('fresh'));
    assert.equal(freshOut.FGOS_HOST_BIN, hostBin);
    assert.equal(freshOut.FGOS_ACTIVE_RELEASE_PATH, repo);
    assert.equal(freshOut.FGOS_ACTIVE_MANIFEST_PATH, manifest);
    assert.equal(fs.existsSync(cargoRecord), false, 'cargo stub was not called for fresh staged addon');

    // 2. Stale case with an unwritable target directory: named error thrown
    fs.writeFileSync(digestFile, 'stale-source-digest');
    fs.mkdirSync(targetDir, {recursive: true});
    // A directory at the archive path makes the archive step fail without touching the network.
    fs.mkdirSync(path.join(archiveDirectory(repo), 'libonnxruntime.a'), {recursive: true});
    fs.chmodSync(targetDir, 0o555);

    // 2a. No ort cache and an unwritable target: the pre-cargo archive step fails, still the named error
    try {
      const noCacheOut = JSON.parse(runProbe('stale'));
      assert.match(noCacheOut.message, /staged addon for this checkout is missing or stale/i);
      assert.ok(noCacheOut.message.includes(gitAddonDirectory(repo)), 'the error names the staged addon directory');
      if (process.platform === 'linux' && process.arch === 'x64') {
        assert.equal(fs.existsSync(cargoRecord), false, 'cargo was not reached without an ort cache');
      } else {
        fs.rmSync(cargoRecord, {force: true});
      }
    } finally {
      fs.chmodSync(targetDir, 0o755);
    }

    // 2b. Verified ort cache present: cargo runs once and fails read-only
    const ortDir = archiveDirectory(repo);
    const ortFile = path.join(ortDir, 'libonnxruntime.a');
    fs.rmSync(ortFile, {recursive: true, force: true});
    fs.mkdirSync(ortDir, {recursive: true});
    fs.writeFileSync(ortFile, 'seeded archive');
    const ortStat = fs.statSync(ortFile);
    fs.writeFileSync(`${ortFile}.verified`, `${ARCHIVE_SHA256} ${ortStat.size} ${ortStat.mtimeMs}\n`);
    fs.chmodSync(targetDir, 0o555);

    try {
      const staleOut = JSON.parse(runProbe('stale'));
      assert.match(staleOut.message, /staged addon for this checkout is missing or stale/i);
      assert.match(staleOut.message, /node scripts\/git-addon\.mjs/);
      assert.ok(staleOut.message.includes(gitAddonDirectory(repo)), 'the error names the staged addon directory');
      assert.equal(fs.readFileSync(cargoRecord, 'utf8'), 'cargo called\n', 'cargo ran once and failed read-only');
    } finally {
      fs.chmodSync(targetDir, 0o755);
    }
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
});
