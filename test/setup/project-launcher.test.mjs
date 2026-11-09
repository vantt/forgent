// The project launcher: one `fgos` on PATH that runs each project's own activated fgos.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { inspectLauncher, writeLauncher, launcherFileName, LAUNCHER_MARKER } from '../../src/setup/project-launcher.mjs';
import { checkProjectLauncher, fixProjectLauncher } from '../../src/setup/registrations.mjs';

const POSIX = process.platform !== 'win32';

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-launcher-'));
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  return { root, bin, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function putFgctl(bin) {
  const file = path.join(bin, process.platform === 'win32' ? 'fgctl.exe' : 'fgctl');
  fs.writeFileSync(file, POSIX ? '#!/bin/sh\nexit 0\n' : 'x', { mode: 0o755 });
}

const DIGEST_A = `sha256:${'a'.repeat(64)}`;
const DIGEST_B = `sha256:${'b'.repeat(64)}`;

// A release fgctl staged into the machine store: a stand-in host that names itself and where it ran.
function putRelease(stateRoot, dirName, name) {
  const bin = path.join(stateRoot, 'releases', dirName, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'fgos'), `#!/bin/sh\necho "${name} args=$* cwd=$PWD"\n`, { mode: 0o755 });
}

// A project activation in the shape fgctl writes it (pretty JSON, one key per line).
function putActivation(dir, fields) {
  const installation = path.join(dir, '.fgos', 'installation');
  fs.mkdirSync(installation, { recursive: true });
  fs.writeFileSync(path.join(installation, 'activation.json'), `${JSON.stringify({ schemaVersion: 1, ...fields }, null, 2)}\n`);
}

// What a hostile repository can commit: its own executable shim beside the activation (Git keeps the exec bit).
function plantShim(dir) {
  const bin = path.join(dir, '.fgos', 'installation', 'bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'fgos'), '#!/bin/sh\necho PLANTED\n', { mode: 0o755 });
}

// The launcher sees PATH plus the variables named here: never this machine's HOME, state root or XDG.
function run(file, args, cwd, extra = {}) {
  return spawnSync(file, args, { cwd, encoding: 'utf8', stdin: 'ignore', env: { PATH: process.env.PATH, ...extra } });
}

test('a release install with fgctl on PATH and no fgos: the launcher is written beside fgctl and then reads as ready', () => {
  const sb = sandbox();
  try {
    putFgctl(sb.bin);
    const before = inspectLauncher({ pathEnv: sb.bin });
    assert.equal(before.state, 'missing');
    assert.equal(before.file, path.join(sb.bin, launcherFileName()));

    assert.equal(checkProjectLauncher({ pathEnv: sb.bin, sourceCheckout: false }).passed, false);
    const fixed = fixProjectLauncher({ pathEnv: sb.bin });
    assert.equal(fixed.fixed, true);

    assert.equal(inspectLauncher({ pathEnv: sb.bin }).state, 'ready');
    assert.equal(checkProjectLauncher({ pathEnv: sb.bin, sourceCheckout: false }).passed, true);
    assert.equal(fixProjectLauncher({ pathEnv: sb.bin }).fixed, false);
  } finally {
    sb.cleanup();
  }
});

test('each project runs the release it activated from the machine store, from any subdirectory, and the nearest project wins', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    putFgctl(sb.bin);
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const state = path.join(sb.root, 'state');
    putRelease(state, DIGEST_A, 'release-a');
    putRelease(state, DIGEST_B, 'release-b');
    const a = path.join(sb.root, 'a');
    const b = path.join(sb.root, 'b');
    const inner = path.join(a, 'inner');
    for (const dir of [a, b, inner]) fs.mkdirSync(dir, { recursive: true });
    putActivation(a, { status: 'ready', artifactDigest: DIGEST_A, releasePath: path.join(state, 'releases', DIGEST_A) });
    putActivation(b, { status: 'ready', artifactDigest: DIGEST_B, releasePath: path.join(state, 'releases', DIGEST_B) });
    putActivation(inner, { status: 'ready', artifactDigest: DIGEST_B, releasePath: path.join(state, 'releases', DIGEST_B) });
    fs.mkdirSync(path.join(a, 'src', 'deep'), { recursive: true });

    const env = { FGOS_STATE_ROOT: state };
    assert.match(run(launcher, ['doctor'], path.join(a, 'src', 'deep'), env).stdout, /^release-a args=doctor /);
    assert.match(run(launcher, ['version'], b, env).stdout, /^release-b args=version /);
    assert.match(run(launcher, [], inner, env).stdout, /^release-b /);
  } finally {
    sb.cleanup();
  }
});

test('a committed .fgos/installation never runs: the launcher executes only a release in the machine store and refuses anything else by name', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const state = path.join(sb.root, 'state');
    putRelease(state, DIGEST_A, 'release-a');
    const env = { HOME: path.join(sb.root, 'home'), FGOS_STATE_ROOT: state };
    const clone = path.join(sb.root, 'clone');
    fs.mkdirSync(clone);
    plantShim(clone);
    // A planted shim with no activation is not a project at all.
    const bare = run(launcher, ['doctor'], clone, env);
    assert.equal(bare.status, 127);
    assert.doesNotMatch(bare.stdout, /PLANTED/);

    const evil = path.join(clone, 'evil-release');
    fs.mkdirSync(path.join(evil, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(evil, 'bin', 'fgos'), '#!/bin/sh\necho PLANTED\n', { mode: 0o755 });
    const outOfStore = `sha256:../../${path.relative(path.join(state, 'releases'), evil)}`;
    const hostile = [
      ['a digest the store does not hold', { status: 'ready', artifactDigest: DIGEST_B, releasePath: evil }, /release sha256:b{64} is not in this machine's release store/],
      ['a digest that walks out of the store', { status: 'ready', artifactDigest: outOfStore, releasePath: evil }, /artifactDigest is not sha256 and 64 lowercase hex digits/],
      ['a digest in upper case', { status: 'ready', artifactDigest: `sha256:${'A'.repeat(64)}` }, /artifactDigest is not sha256/],
      ['a release path and no digest', { status: 'ready', releasePath: evil }, /artifactDigest is not sha256/],
      ['a status other than ready', { status: 'staging', artifactDigest: DIGEST_A }, /status is not ready \(staging\)/],
    ];
    for (const [label, fields, reason] of hostile) {
      putActivation(clone, fields);
      const result = run(launcher, ['doctor'], clone, env);
      assert.equal(result.status, 126, label);
      assert.doesNotMatch(result.stdout, /PLANTED/, label);
      assert.match(result.stderr, reason, label);
      assert.match(result.stderr, /refusing .*clone\/\.fgos\/installation\/activation\.json: .*run 'fgctl init' in the project.*'fgctl verify'/, label);
    }

    // The same clone activated for real runs the store release, never the planted shim or the named release path.
    putActivation(clone, { status: 'ready', artifactDigest: DIGEST_A, releasePath: evil });
    const real = run(launcher, ['doctor'], clone, env);
    assert.equal(real.status, 0, real.stderr);
    assert.match(real.stdout, /^release-a args=doctor /);
  } finally {
    sb.cleanup();
  }
});

test('a state root that is not absolute is refused, so a store planted inside the project never runs', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const clone = path.join(sb.root, 'clone');
    // The relative fallback `.local/state/fgos` resolves inside the clone, which ships its own "release".
    const planted = path.join(clone, '.local', 'state', 'fgos', 'releases', DIGEST_A, 'bin');
    fs.mkdirSync(planted, { recursive: true });
    fs.writeFileSync(path.join(planted, 'fgos'), '#!/bin/sh\necho PLANTED\n', { mode: 0o755 });
    putActivation(clone, { status: 'ready', artifactDigest: DIGEST_A });
    const cases = [
      ['HOME set but empty', { HOME: '' }],
      ['no HOME and no USERPROFILE', {}],
      ['a relative FGOS_STATE_ROOT', { FGOS_STATE_ROOT: '.local/state/fgos', HOME: path.join(sb.root, 'home') }],
      ['a relative XDG_STATE_HOME', { XDG_STATE_HOME: '.local/state', HOME: path.join(sb.root, 'home') }],
    ];
    for (const [label, env] of cases) {
      const result = run(launcher, ['doctor'], clone, env);
      assert.equal(result.status, 126, label);
      assert.doesNotMatch(result.stdout, /PLANTED/, label);
      assert.match(result.stderr, /the state root \.local\/state\/fgos is not an absolute path/, label);
    }
  } finally {
    sb.cleanup();
  }
});

test('the launcher finds the machine store from the same state-root inputs as the host, in either release directory spelling', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const project = path.join(sb.root, 'project');
    fs.mkdirSync(project);
    putActivation(project, { status: 'ready', artifactDigest: DIGEST_A });
    const home = path.join(sb.root, 'home');
    const cases = [
      ['pinned', { FGOS_STATE_ROOT: path.join(sb.root, 'pinned'), FGOS_STATE_HOME: path.join(sb.root, 'other'), HOME: home }, path.join(sb.root, 'pinned')],
      ['blank-pin', { FGOS_STATE_ROOT: '  ', FGOS_STATE_HOME: path.join(sb.root, 'fsh'), HOME: home }, path.join(sb.root, 'fsh')],
      ['xdg', { XDG_STATE_HOME: path.join(sb.root, 'xdg'), HOME: home }, path.join(sb.root, 'xdg', 'fgos')],
      ['home', { HOME: home }, path.join(home, '.local', 'state', 'fgos')],
    ];
    for (const [label, env, stateRoot] of cases) {
      putRelease(stateRoot, label === 'home' ? `sha256-${'a'.repeat(64)}` : DIGEST_A, `release-${label}`);
      const result = run(launcher, ['version'], project, env);
      assert.equal(result.status, 0, `${label}: ${result.stderr}`);
      assert.match(result.stdout, new RegExp(`^release-${label} args=version `), label);
    }
  } finally {
    sb.cleanup();
  }
});

test('outside any project the launcher refuses with a fix and exit 127', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const elsewhere = path.join(sb.root, 'elsewhere');
    fs.mkdirSync(elsewhere);
    const result = run(launcher, ['doctor'], elsewhere, { HOME: path.join(sb.root, 'home') });
    assert.equal(result.status, 127);
    assert.match(result.stderr, /no \.fgos\/installation found above .*fgctl init/);
  } finally {
    sb.cleanup();
  }
});

test('a foreign fgos earlier on PATH is reported and never overwritten', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    putFgctl(sb.bin);
    const other = path.join(sb.root, 'other');
    fs.mkdirSync(other);
    const foreign = path.join(other, 'fgos');
    fs.writeFileSync(foreign, '#!/bin/sh\necho npm-global\n', { mode: 0o755 });

    const pathEnv = [other, sb.bin].join(path.delimiter);
    assert.equal(inspectLauncher({ pathEnv }).state, 'foreign');
    assert.equal(checkProjectLauncher({ pathEnv, sourceCheckout: false }).passed, false);
    const result = fixProjectLauncher({ pathEnv });
    assert.equal(result.fixed, false);
    assert.equal(fs.readFileSync(foreign, 'utf8'), '#!/bin/sh\necho npm-global\n');
    assert.equal(fs.existsSync(path.join(sb.bin, 'fgos')), false);
  } finally {
    sb.cleanup();
  }
});

test('an out-of-date launcher is rewritten; neither fgctl nor fgos on PATH is reported with the way out', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    putFgctl(sb.bin);
    const file = path.join(sb.bin, 'fgos');
    fs.writeFileSync(file, `#!/bin/sh\n# ${LAUNCHER_MARKER}\nexit 1\n`, { mode: 0o755 });
    assert.equal(inspectLauncher({ pathEnv: sb.bin }).state, 'stale');
    assert.equal(fixProjectLauncher({ pathEnv: sb.bin }).fixed, true);
    assert.equal(inspectLauncher({ pathEnv: sb.bin }).state, 'ready');

    const empty = path.join(sb.root, 'empty');
    fs.mkdirSync(empty);
    assert.equal(inspectLauncher({ pathEnv: empty }).state, 'no-fgctl');
    const check = checkProjectLauncher({ pathEnv: empty, sourceCheckout: false });
    assert.equal(check.passed, false);
    assert.match(check.message, /add the directory fgctl was installed into/);
    assert.equal(fixProjectLauncher({ pathEnv: empty }).fixed, false);
  } finally {
    sb.cleanup();
  }
});

test('from a source checkout the check needs no launcher', () => {
  assert.equal(checkProjectLauncher({ pathEnv: '', sourceCheckout: true }).passed, true);
});

// The batch launcher is exercised for real on Windows only (cmd.exe); the focused Windows job runs this file.
test('the cmd launcher runs the store release the nearest activation names, never a planted fgos.cmd, and refuses outside a project', { skip: POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos.cmd'));
    const state = path.join(sb.root, 'state');
    // A stand-in release host: a copy of cmd.exe, so `fgos.exe /d /c echo <text>` prints the text.
    const releaseBin = path.join(state, 'releases', `sha256-${'a'.repeat(64)}`, 'bin');
    fs.mkdirSync(releaseBin, { recursive: true });
    fs.copyFileSync(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', path.join(releaseBin, 'fgos.exe'));
    const project = path.join(sb.root, 'proj');
    const batBin = path.join(project, '.fgos', 'installation', 'bin');
    fs.mkdirSync(batBin, { recursive: true });
    fs.writeFileSync(path.join(batBin, 'fgos.cmd'), '@echo PLANTED %*\r\n');
    const sub = path.join(project, 'src');
    fs.mkdirSync(sub);
    const env = Object.assign({}, process.env, { FGOS_STATE_ROOT: state });
    const runCmd = (args, cwd) => spawnSync('cmd.exe', ['/d', '/c', launcher, ...args], { cwd, encoding: 'utf8', env });

    putActivation(project, { status: 'ready', artifactDigest: DIGEST_A });
    const inside = runCmd(['/d', '/c', 'echo', 'release-ran'], sub);
    assert.match(inside.stdout, /release-ran/);
    assert.doesNotMatch(inside.stdout, /PLANTED/);

    putActivation(project, { status: 'ready', artifactDigest: DIGEST_B });
    const missing = runCmd(['doctor'], sub);
    assert.equal(missing.status, 126);
    assert.doesNotMatch(missing.stdout, /PLANTED/);
    assert.match(missing.stderr, /is not in this machine's release store.*fgctl init/);

    putActivation(project, { status: 'ready', artifactDigest: 'sha256:..\\..\\evil' });
    const traversal = runCmd(['doctor'], sub);
    assert.equal(traversal.status, 126);
    assert.match(traversal.stderr, /artifactDigest is not sha256/);

    // A relative state root would resolve inside the project, which can ship its own releases\.
    putActivation(project, { status: 'ready', artifactDigest: DIGEST_A });
    const plantedStore = path.join(sub, 'store', 'releases', `sha256-${'a'.repeat(64)}`, 'bin');
    fs.mkdirSync(plantedStore, { recursive: true });
    fs.copyFileSync(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', path.join(plantedStore, 'fgos.exe'));
    const relative = spawnSync('cmd.exe', ['/d', '/c', launcher, '/d', '/c', 'echo', 'PLANTED'], { cwd: sub, encoding: 'utf8', env: Object.assign({}, env, { FGOS_STATE_ROOT: 'store' }) });
    assert.equal(relative.status, 126);
    assert.doesNotMatch(relative.stdout, /PLANTED/);
    assert.match(relative.stderr, /the state root store is not an absolute path/);

    const elsewhere = path.join(sb.root, 'elsewhere');
    fs.mkdirSync(elsewhere);
    const outside = runCmd(['doctor'], elsewhere);
    assert.equal(outside.status, 127);
    assert.match(outside.stderr, /no \.fgos\\installation found/);
  } finally {
    sb.cleanup();
  }
});
