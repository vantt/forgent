import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  RELEASE_TARGETS,
  releaseTargetForHost,
  releaseTargetByTriple,
  manifestTargetForHost,
} from '../../src/util/release-targets.mjs';
import { REPO_ROOT, buildRustDistribution, runnerShimContent } from '../../scripts/build-rust-distribution.mjs';
import { checkRustHostTargetSupported } from '../../src/setup/registrations.mjs';

test('the release target table names exactly the Linux and Windows triples', () => {
  assert.deepEqual(
    RELEASE_TARGETS.map((t) => t.triple),
    ['x86_64-unknown-linux-gnu', 'x86_64-pc-windows-msvc'],
  );
  assert.equal(releaseTargetForHost('linux', 'x64').triple, 'x86_64-unknown-linux-gnu');
  assert.equal(releaseTargetForHost('win32', 'x64').triple, 'x86_64-pc-windows-msvc');
  assert.equal(releaseTargetForHost('darwin', 'arm64'), null);
  assert.equal(releaseTargetForHost('win32', 'arm64'), null);
  assert.equal(releaseTargetByTriple('x86_64-pc-windows-msvc').exeSuffix, '.exe');
  assert.equal(releaseTargetByTriple('nope'), null);
});

test('a release tree declares the manifest target of the host that built it', () => {
  assert.deepEqual(manifestTargetForHost('linux', 'x64'), { os: 'linux', arch: 'x64', libc: 'glibc' });
  assert.deepEqual(manifestTargetForHost('win32', 'x64'), { os: 'windows', arch: 'x64' });
  // A host with no published release still builds a tree, declared as Linux as before.
  assert.deepEqual(manifestTargetForHost('darwin', 'arm64'), { os: 'linux', arch: 'x64', libc: 'glibc' });
  // Callers cannot corrupt the table through the returned object.
  manifestTargetForHost('linux', 'x64').os = 'changed';
  assert.equal(manifestTargetForHost('linux', 'x64').os, 'linux');
});

test('rust-host-target-supported approves both published targets and refuses the rest', () => {
  assert.equal(checkRustHostTargetSupported('linux', 'x64').passed, true);
  const win = checkRustHostTargetSupported('win32', 'x64');
  assert.equal(win.passed, true);
  assert.match(win.message, /x86_64-pc-windows-msvc/);
  const mac = checkRustHostTargetSupported('darwin', 'arm64');
  assert.equal(mac.passed, false);
  assert.match(mac.message, /not an approved rust host target/);
  assert.match(mac.message, /x86_64-unknown-linux-gnu, x86_64-pc-windows-msvc/);
});

test('the release tree runner launcher exists in sh and cmd forms, each relative to its own location', () => {
  const sh = runnerShimContent('sh');
  assert.ok(sh.startsWith('#!/bin/sh\n'));
  assert.ok(sh.includes('libexec/legacy-node/bin/fgos-runner.mjs'));
  assert.ok(!sh.includes('\r'));

  const cmd = runnerShimContent('cmd');
  assert.ok(cmd.startsWith('@echo off\r\n'));
  assert.ok(cmd.includes('%~dp0..\\libexec\\legacy-node\\bin\\fgos-runner.mjs'));
  assert.ok(cmd.endsWith('\r\n'));
  assert.ok(!cmd.replace(/\r\n/g, '').includes('\n'), 'every line break is CRLF');
  assert.ok(!cmd.includes('#!/bin/sh'));
});

test('only a Windows-built release tree carries the cmd launcher and the .exe host entry', (t) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-targets-'));
  try {
    buildRustDistribution({ outDir: path.join(out, 'tree'), repoRoot: REPO_ROOT });
    const bin = path.join(out, 'tree', 'bin');
    const hasCmd = fs.existsSync(path.join(bin, 'fgos-runner.cmd'));
    const hasExe = fs.existsSync(path.join(bin, 'fgos.exe'));
    assert.equal(hasCmd, process.platform === 'win32');
    assert.equal(hasExe, process.platform === 'win32');
    assert.ok(fs.existsSync(path.join(bin, 'fgos')), 'bin/fgos stays the manifest entry on every host');
    assert.ok(fs.existsSync(path.join(bin, 'fgos-runner')));
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'tree', 'manifest.json'), 'utf8'));
    const files = manifest.files.map((f) => f.path);
    assert.equal(files.includes('bin/fgos-runner.cmd'), hasCmd, 'the cmd launcher is digest-covered when staged');
    assert.equal(files.includes('bin/fgos.exe'), hasExe);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
