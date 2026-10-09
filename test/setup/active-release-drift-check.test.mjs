import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/checks.mjs';
import { buildRustDistribution, hashFile, listLegacyNodeSourceFiles } from '../../scripts/build-rust-distribution.mjs';

const CLI = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));
const ID = 'active-release-matches-checkout';
const ACTIVATED_AT = '2026-10-06T12:00:00Z';
const ENV_KEYS = ['FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH'];

function put(root, relative, content) {
  const dest = path.join(root, relative);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content));
  return dest;
}

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-drift-'));
  const source = path.join(temp, 'checkout');
  const release = path.join(temp, 'release');
  const outside = path.join(temp, 'outside');
  fs.mkdirSync(outside);
  put(source, 'apps/fgos/Cargo.toml', '[package]\nname="fgos"\n');
  put(source, 'package.json', { name: 'drift-fixture', files: ['bin', 'src'] });
  put(source, 'bin/fgos.mjs', 'console.log("source");\n');
  put(source, 'src/one.mjs', 'export const one = 1;\n');
  put(source, 'src/two.mjs', 'export const two = 2;\n');
  const root = 'libexec/legacy-node';
  const manifest = {
    schemaVersion: 1,
    artifactDigest: `sha256:${'a'.repeat(64)}`,
    entries: { fgos: 'bin/fgos', fgosRunner: 'bin/fgos-runner' },
    components: { legacyNode: { root, entry: 'bin/fgos.mjs' } },
    files: listLegacyNodeSourceFiles(source).map((relative) => {
      const staged = put(release, `${root}/${relative}`, fs.readFileSync(path.join(source, relative)));
      return { path: `${root}/${relative}`, kind: 'file', digest: hashFile(staged) };
    }),
  };
  const writeManifest = () => put(release, 'manifest.json', manifest);
  const activate = () => put(source, '.fgos/installation/activation.json', {
    releasePath: release, artifactDigest: manifest.artifactDigest, activatedAt: ACTIVATED_AT,
  });
  writeManifest();
  activate();
  const cwd = process.cwd();
  const env = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  process.chdir(outside);
  t.after(() => {
    process.chdir(cwd);
    for (const key of ENV_KEYS) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
    fs.rmSync(temp, { recursive: true, force: true });
  });
  return { temp, source, release, outside, manifest, writeManifest, activate };
}

function run(source) {
  const entry = DOCTOR_CHECKS.find((check) => check.id === ID);
  assert.ok(entry, `${ID} registered`);
  const result = entry.check(source);
  assert.equal(typeof result.passed, 'boolean');
  assert.equal(typeof result.message, 'string');
  return result;
}

function counts(result, changed, missing, extra) {
  assert.match(result.message, new RegExp(`changed=${changed}, missing in release=${missing}, extra in release=${extra}`));
}

test('equal payload passes against explicit doctor dir, not cwd; check has no fix and writes nothing', (t) => {
  const f = fixture(t);
  put(f.outside, 'apps/fgos/Cargo.toml', 'unrelated cwd marker');
  put(f.outside, '.fgos/installation/activation.json', '{invalid cwd activation');
  const before = fs.readFileSync(path.join(f.source, '.fgos/installation/activation.json'), 'utf8');
  const result = run(f.source);
  assert.equal(result.passed, true, result.message);
  counts(result, 0, 0, 0);
  assert.match(result.message, /Node payload/);
  assert.match(result.message, /artifactDigest=sha256:a+/);
  assert.match(result.message, new RegExp(`activatedAt=${ACTIVATED_AT}`));
  assert.equal(FIX_REGISTRATIONS.some((fix) => fix.id === ID), false);
  assert.equal(fs.readFileSync(path.join(f.source, '.fgos/installation/activation.json'), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(path.join(f.source, '.fgos')), ['installation']);
});

test('working-tree edit including source bin/fgos.mjs reports changed and B/A guidance', (t) => {
  const f = fixture(t);
  put(f.source, 'bin/fgos.mjs', 'changed uncommitted entry');
  const result = run(f.source);
  assert.equal(result.passed, false);
  counts(result, 1, 0, 0);
  assert.match(result.message, /bin\/fgos\.mjs/);
  assert.match(result.message, /B:.*npm run fgos:dev/);
  assert.match(result.message, /A:.*plain fgos/);
  assert.match(result.message, /Rust.*not|not.*Rust/);
});

test('added source is missing in release and removed source is extra in release', (t) => {
  const f = fixture(t);
  put(f.source, 'src/added.mjs', 'added');
  fs.unlinkSync(path.join(f.source, 'src/two.mjs'));
  const result = run(f.source);
  assert.equal(result.passed, false);
  counts(result, 0, 1, 1);
  assert.match(result.message, /src\/added\.mjs/);
  assert.match(result.message, /src\/two\.mjs/);
});

test('drift examples are deterministic and capped at five paths', (t) => {
  const f = fixture(t);
  for (let i = 0; i < 8; i++) put(f.source, `src/new-${i}.mjs`, 'new');
  const result = run(f.source);
  counts(result, 0, 8, 0);
  assert.match(result.message, /src\/new-0\.mjs/);
  assert.match(result.message, /src\/new-4\.mjs/);
  assert.doesNotMatch(result.message, /src\/new-[567]\.mjs/);
});

test('outside source checkout skips even with explicit active release', (t) => {
  const f = fixture(t);
  process.env.FGOS_ACTIVE_RELEASE_PATH = f.release;
  put(f.outside, 'package.json', { files: ['not-fgos'] });
  const result = run(f.outside);
  assert.equal(result.passed, true);
  assert.match(result.message, /skipped.*outside.*source checkout/);
});

test('source without activation skips rather than borrowing cwd activation or a staged manifest', (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.source, '.fgos/installation/activation.json'));
  put(f.outside, '.fgos/installation/activation.json', { releasePath: f.release });
  put(f.source, 'manifest.json', f.manifest);
  const result = run(f.source);
  assert.equal(result.passed, true);
  assert.match(result.message, /skipped.*no activation/);
});

test('explicit development manifest root dot pointing at checkout skips', (t) => {
  const f = fixture(t);
  f.manifest.components.legacyNode.root = '.';
  const manifestPath = put(f.source, '.fgos/runtime/dev-host/manifest.json', f.manifest);
  process.env.FGOS_ACTIVE_RELEASE_PATH = f.source;
  process.env.FGOS_ACTIVE_MANIFEST_PATH = manifestPath;
  const result = run(f.source);
  assert.equal(result.passed, true);
  assert.match(result.message, /skipped.*development.*checkout/);
});

test('development manifest pointing at another checkout does not skip this checkout', (t) => {
  const f = fixture(t);
  f.manifest.components.legacyNode.root = '.';
  f.manifest.files = f.manifest.files.map((entry) => ({ ...entry, path: entry.path.replace('libexec/legacy-node/', '') }));
  for (const entry of f.manifest.files) put(f.release, entry.path, fs.readFileSync(path.join(f.source, entry.path)));
  f.writeManifest();
  process.env.FGOS_ACTIVE_RELEASE_PATH = f.release;
  put(f.source, 'src/one.mjs', 'changed');
  const result = run(f.source);
  assert.equal(result.passed, false);
  counts(result, 1, 0, 0);
});

test('linked worktree skips activation owned only by main, including inherited shim environment', (t) => {
  const f = fixture(t);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: f.source });
  execFileSync('git', ['add', 'apps', 'bin', 'src', 'package.json'], { cwd: f.source });
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture'], { cwd: f.source });
  const linked = path.join(f.temp, 'linked');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'linked', linked], { cwd: f.source });
  put(linked, 'src/one.mjs', 'different worktree');
  for (const explicit of [false, true]) {
    if (explicit) process.env.FGOS_ACTIVE_RELEASE_PATH = f.release;
    const result = run(linked);
    assert.equal(result.passed, true, result.message);
    assert.match(result.message, /skipped.*activation belongs to main/);
  }
  delete process.env.FGOS_ACTIVE_RELEASE_PATH;
  put(linked, '.fgos/installation/activation.json', { releasePath: f.release, activatedAt: ACTIVATED_AT });
  const owned = run(linked);
  assert.equal(owned.passed, false);
  counts(owned, 1, 0, 0);
});

test('inherited foreign release environment cannot override a dir-owned activation', (t) => {
  const f = fixture(t);
  const foreign = path.join(f.temp, 'foreign-release');
  put(foreign, 'manifest.json', '{invalid foreign manifest');
  process.env.FGOS_ACTIVE_RELEASE_PATH = foreign;
  process.env.FGOS_ACTIVE_MANIFEST_PATH = path.join(foreign, 'manifest.json');
  const owned = run(f.source);
  assert.equal(owned.passed, true, owned.message);
  counts(owned, 0, 0, 0);
  fs.unlinkSync(path.join(f.source, '.fgos/installation/activation.json'));
  const unbound = run(f.source);
  assert.equal(unbound.passed, true, unbound.message);
  assert.match(unbound.message, /skipped.*no activation/);
});

test('production dependencies, generated shims and neighboring legacy-root prefix are not source extras', (t) => {
  const f = fixture(t);
  for (const relative of ['libexec/legacy-node/node_modules/dep/index.mjs', 'bin/fgos', 'bin/fgos-runner', 'libexec/legacy-node-other/foreign.mjs']) {
    const staged = put(f.release, relative, 'staged only');
    f.manifest.files.push({ path: relative, kind: 'file', digest: hashFile(staged) });
  }
  // A layout placing packaging shims inside the payload must not hide bin/fgos.mjs.
  for (const relative of ['bin/fgos', 'bin/fgos-runner']) {
    const staged = put(f.release, `libexec/legacy-node/${relative}`, 'packaging shim');
    f.manifest.files.push({ path: `libexec/legacy-node/${relative}`, kind: 'file', digest: hashFile(staged) });
  }
  f.manifest.entries.fgos = 'libexec/legacy-node/bin/fgos';
  f.manifest.entries.fgosRunner = 'libexec/legacy-node/bin/fgos-runner';
  f.writeManifest();
  const result = run(f.source);
  assert.equal(result.passed, true, result.message);
  counts(result, 0, 0, 0);
});

test('declared dependency namespace is excluded without excluding selected source files', (t) => {
  const f = fixture(t);
  const pkg = { name: 'drift-fixture', files: ['bin', 'src', 'node_modules'] };
  put(f.source, 'package.json', pkg);
  put(f.source, 'node_modules/dep/index.mjs', 'checkout dependency');
  put(f.release, 'libexec/legacy-node/package.json', pkg);
  f.manifest.files.find((entry) => entry.path === 'libexec/legacy-node/package.json').digest =
    hashFile(path.join(f.source, 'package.json'));
  f.writeManifest();
  const result = run(f.source);
  assert.equal(result.passed, true, result.message);
  counts(result, 0, 0, 0);
});

for (const [name, mutate] of [
  ['invalid activation JSON', (f) => put(f.source, '.fgos/installation/activation.json', '{bad')],
  ['invalid manifest JSON', (f) => put(f.release, 'manifest.json', '{bad')],
  ['unreadable manifest path', (f) => { fs.unlinkSync(path.join(f.release, 'manifest.json')); fs.mkdirSync(path.join(f.release, 'manifest.json')); }],
  ['missing active manifest', (f) => fs.unlinkSync(path.join(f.release, 'manifest.json'))],
  ['missing manifest files', (f) => { delete f.manifest.files; f.writeManifest(); }],
  ['invalid digest', (f) => { f.manifest.files[0].digest = 'bad'; f.writeManifest(); }],
  ['duplicate manifest source', (f) => { f.manifest.files.push(f.manifest.files[0]); f.writeManifest(); }],
  ['source symlink', (f) => { fs.unlinkSync(path.join(f.source, 'src/one.mjs')); fs.symlinkSync(path.join(f.source, 'src/two.mjs'), path.join(f.source, 'src/one.mjs')); }],
  ['source intermediate symlink', (f) => { fs.renameSync(path.join(f.source, 'src'), path.join(f.source, 'real-src')); fs.symlinkSync('real-src', path.join(f.source, 'src')); }],
  ['declared empty directory intermediate symlink', (f) => { fs.mkdirSync(path.join(f.outside, 'empty')); fs.symlinkSync(f.outside, path.join(f.source, 'alias')); put(f.source, 'package.json', { files: ['bin', 'alias/empty'] }); }],
  ['broken source symlink', (f) => { fs.unlinkSync(path.join(f.source, 'src/one.mjs')); fs.symlinkSync('absent.mjs', path.join(f.source, 'src/one.mjs')); }],
  ['broken activation symlink', (f) => { const p = path.join(f.source, '.fgos/installation/activation.json'); fs.unlinkSync(p); fs.symlinkSync('absent.json', p); }],
  ['package symlink', (f) => { fs.renameSync(path.join(f.source, 'package.json'), path.join(f.source, 'real-package.json')); fs.symlinkSync('real-package.json', path.join(f.source, 'package.json')); }],
  ['manifest symlink', (f) => { fs.renameSync(path.join(f.release, 'manifest.json'), path.join(f.release, 'real-manifest.json')); fs.symlinkSync('real-manifest.json', path.join(f.release, 'manifest.json')); }],
  ['release source symlink', (f) => { const p = path.join(f.release, 'libexec/legacy-node/src/one.mjs'); fs.unlinkSync(p); fs.symlinkSync(path.join(f.source, 'src/one.mjs'), p); }],
  ['legacy root escape', (f) => { f.manifest.components.legacyNode.root = '../outside'; f.writeManifest(); }],
  ['manifest source escape', (f) => { f.manifest.files[0].path = 'libexec/legacy-node/../../outside/file'; f.writeManifest(); }],
  ['dependency-shaped manifest escape', (f) => { f.manifest.files.push({ path: 'libexec/legacy-node/node_modules/../../escape', kind: 'file', digest: `sha256:${'b'.repeat(64)}` }); f.writeManifest(); }],
  ['declared source escape', (f) => put(f.source, 'package.json', { files: ['../outside'] })],
  ['missing declared source', (f) => put(f.source, 'package.json', { files: ['bin', 'absent'] })],
  ['missing listed release source', (f) => fs.unlinkSync(path.join(f.release, 'libexec/legacy-node/src/one.mjs'))],
]) {
  test(`${name} fails check without throwing`, (t) => {
    const f = fixture(t);
    mutate(f);
    const result = run(f.source);
    assert.equal(result.passed, false, result.message);
  });
}

// Ignoring dependencies and packaging artifacts affects comparison, not safety.
// Even entries outside the legacy payload must obey the confined manifest tree.
for (const [namespace, relative, entryKey] of [
  ['dependency', 'libexec/legacy-node/node_modules/dep/index.mjs', null],
  ['payload shim', 'libexec/legacy-node/bin/fgos', 'fgos'],
  ['outer shim', 'bin/fgos-runner', 'fgosRunner'],
  ['neighboring payload prefix', 'libexec/legacy-node-other/foreign.mjs', null],
]) {
  for (const [fault, corrupt] of [
    ['malformed kind', (_f, entry) => { entry.kind = 'directory'; }],
    ['invalid digest', (_f, entry) => { entry.digest = 'invalid'; }],
    ['duplicate path', (f, entry) => { f.manifest.files.push({ ...entry }); }],
    ['symlink', (f, _entry, staged) => { fs.unlinkSync(staged); fs.symlinkSync(path.join(f.source, 'src/one.mjs'), staged); }],
    ['missing file', (_f, _entry, staged) => { fs.unlinkSync(staged); }],
  ]) {
    test(`excluded ${namespace} with ${fault} still fails manifest safety`, (t) => {
      const f = fixture(t);
      const staged = put(f.release, relative, 'excluded artifact');
      const entry = { path: relative, kind: 'file', digest: hashFile(staged) };
      f.manifest.files.push(entry);
      if (entryKey) f.manifest.entries[entryKey] = relative;
      corrupt(f, entry, staged);
      f.writeManifest();
      const result = run(f.source);
      assert.equal(result.passed, false, result.message);
    });
  }
}

test('unsafe source fails only this check and CLI doctor continues with normal and strict exits', (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.source, 'src/one.mjs'));
  fs.symlinkSync(path.join(f.source, 'src/two.mjs'), path.join(f.source, 'src/one.mjs'));
  const home = path.join(f.temp, 'home');
  fs.mkdirSync(home);
  const env = { ...process.env, HOME: home, FGOS_STATE_HOME: path.join(f.temp, 'state'), FGOS_ACTIVE_RELEASE_PATH: f.release,
    FGOS_ACTIVE_MANIFEST_PATH: path.join(f.release, 'manifest.json'), FGOS_CLAUDE_COMMAND: '/nonexistent/fixture-claude' };
  delete env.CLAUDE_CODE_SESSION_ID;
  delete env.CLAUDECODE;
  for (const strict of [false, true]) {
    const child = spawnSync(process.execPath, [CLI, 'doctor', '--dir', f.source, ...(strict ? ['--strict'] : [])], {
      cwd: f.outside, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000,
    });
    assert.equal(child.error, undefined);
    assert.equal(child.status, strict ? 1 : 0, child.stderr || child.stdout);
    const envelope = JSON.parse(child.stdout);
    const checks = envelope.data.checks;
    assert.equal(checks.find((entry) => entry.id === ID).passed, false);
    assert.ok(checks.findIndex((entry) => entry.id === ID) < checks.length - 1, 'later checks ran');
  }
});

test('real builder selection and staged production dependency payload agree with doctor', (t) => {
  const f = fixture(t);
  put(f.source, 'package.json', { name: 'drift-fixture', files: ['bin', 'src', 'bin/fgos.mjs'], dependencies: { dep: '1.0.0' } });
  put(f.source, 'node_modules/dep/package.json', { name: 'dep', version: '1.0.0', main: 'index.mjs' });
  put(f.source, 'node_modules/dep/index.mjs', 'export default "dependency";');
  put(f.source, 'target/release/fgos', '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(f.source, 'target/release/fgos'), 0o755);
  const built = path.join(f.temp, 'built');
  const result = buildRustDistribution({ outDir: built, repoRoot: f.source });
  const manifest = JSON.parse(fs.readFileSync(result.manifestPath, 'utf8'));
  assert.ok(manifest.files.some((entry) => entry.path === 'libexec/legacy-node/node_modules/dep/index.mjs'));
  assert.equal(manifest.files.filter((entry) => entry.path === 'libexec/legacy-node/bin/fgos.mjs').length, 1);
  put(f.source, '.fgos/installation/activation.json', { releasePath: built, artifactDigest: result.artifactDigest, activatedAt: ACTIVATED_AT });
  const checked = run(f.source);
  assert.equal(checked.passed, true, checked.message);
  counts(checked, 0, 0, 0);
  assert.match(checked.message, new RegExp(`artifactDigest=${result.artifactDigest}`));
});

test('per-machine agent hook file under a declared payload directory is not counted as drift', (t) => {
  const f = fixture(t);
  put(f.source, 'package.json', { name: 'drift-fixture', files: ['bin', 'src', '.agents'] });
  put(f.source, '.agents/keep.md', 'kept');
  f.manifest.files = listLegacyNodeSourceFiles(f.source).map((relative) => {
    const staged = put(f.release, `libexec/legacy-node/${relative}`, fs.readFileSync(path.join(f.source, relative)));
    return { path: `libexec/legacy-node/${relative}`, kind: 'file', digest: hashFile(staged) };
  });
  f.writeManifest();
  counts(run(f.source), 0, 0, 0);
  put(f.source, '.agents/hooks.json', '{"hooks":{}}');
  const result = run(f.source);
  assert.equal(result.passed, true, result.message);
  counts(result, 0, 0, 0);
});
