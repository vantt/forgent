// The project launcher: one `fgos` on PATH that runs each project's own activated fgos.
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

// A stand-in for a project's activated fgos that names itself and the directory it ran in.
function putProject(dir, name) {
  const bin = path.join(dir, '.fgos', 'installation', 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const file = path.join(bin, 'fgos');
  fs.writeFileSync(file, `#!/bin/sh\necho "${name} args=$* cwd=$PWD"\n`, { mode: 0o755 });
}

function run(file, args, cwd) {
  return spawnSync(file, args, { cwd, encoding: 'utf8', stdin: 'ignore' });
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

test('each project runs its own activated fgos, from any subdirectory, and the nearest project wins', { skip: !POSIX }, () => {
  const sb = sandbox();
  try {
    putFgctl(sb.bin);
    const launcher = writeLauncher(path.join(sb.bin, 'fgos'));
    const a = path.join(sb.root, 'a');
    const b = path.join(sb.root, 'b');
    const inner = path.join(a, 'inner');
    for (const dir of [a, b, inner]) fs.mkdirSync(dir, { recursive: true });
    putProject(a, 'project-a');
    putProject(b, 'project-b');
    putProject(inner, 'project-inner');
    fs.mkdirSync(path.join(a, 'src', 'deep'), { recursive: true });

    assert.match(run(launcher, ['doctor'], path.join(a, 'src', 'deep')).stdout, /^project-a args=doctor /);
    assert.match(run(launcher, ['version'], b).stdout, /^project-b args=version /);
    assert.match(run(launcher, [], inner).stdout, /^project-inner /);
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
    const result = run(launcher, ['doctor'], elsewhere);
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
test('the cmd launcher runs the nearest project fgos.cmd from a subdirectory and refuses outside a project', { skip: POSIX }, () => {
  const sb = sandbox();
  try {
    const launcher = writeLauncher(path.join(sb.bin, 'fgos.cmd'));
    const project = path.join(sb.root, 'proj');
    const batBin = path.join(project, '.fgos', 'installation', 'bin');
    fs.mkdirSync(batBin, { recursive: true });
    fs.writeFileSync(path.join(batBin, 'fgos.cmd'), '@echo project-cmd %*\r\n');
    const sub = path.join(project, 'src');
    fs.mkdirSync(sub);

    const inside = spawnSync('cmd.exe', ['/d', '/c', launcher, 'doctor', '--fix'], { cwd: sub, encoding: 'utf8' });
    assert.match(inside.stdout, /project-cmd doctor --fix/);

    const elsewhere = path.join(sb.root, 'elsewhere');
    fs.mkdirSync(elsewhere);
    const outside = spawnSync('cmd.exe', ['/d', '/c', launcher, 'doctor'], { cwd: elsewhere, encoding: 'utf8' });
    assert.equal(outside.status, 127);
    assert.match(outside.stderr, /no \.fgos\\installation found/);
  } finally {
    sb.cleanup();
  }
});
