import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import { useReleaseFixture, FGCTL_BIN, fixture, runFgctl, waitForProcess, RELEASE_TARGET, makeDownloadProject, makeReleaseAssets, readActivation } from './fgctl-init-fixture.mjs';

useReleaseFixture();

test('download: --from beats FGCTL_FROM beats FGCTL_VERSION (the losing sources are never touched)', () => {
  const t = makeDownloadProject('dl-precedence');
  try {
    // Flag wins over a bogus FGCTL_FROM and an unreachable FGCTL_VERSION base.
    const viaFlag = runFgctl(['init', '--from', fixture.releaseDir], {
      cwd: t.proj,
      stateHome: t.state,
      env: {
        HOME: t.home,
        FGCTL_FROM: '/nonexistent/never-used',
        FGCTL_VERSION: 'v9.9.9',
        FGCTL_ASSET_BASE_URL: 'http://127.0.0.1:1',
      },
    });
    assert.equal(viaFlag.status, 0, viaFlag.stderr);
    assert.ok(!/downloading/.test(viaFlag.stderr), 'a local --from must not download');
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }

  const t2 = makeDownloadProject('dl-precedence-env');
  try {
    // FGCTL_FROM wins over FGCTL_VERSION and installs without any download.
    const viaEnv = runFgctl(['init'], {
      cwd: t2.proj,
      stateHome: t2.state,
      env: {
        HOME: t2.home,
        FGCTL_FROM: fixture.releaseDir,
        FGCTL_VERSION: 'v9.9.9',
        FGCTL_ASSET_BASE_URL: 'http://127.0.0.1:1',
      },
    });
    assert.equal(viaEnv.status, 0, viaEnv.stderr);
    assert.ok(!/downloading/.test(viaEnv.stderr), 'FGCTL_FROM must not download');
    assert.equal(readActivation(t2.proj).artifactDigest, fixture.digest);
  } finally {
    fs.rmSync(t2.root, { recursive: true, force: true });
  }
});

test('download: a committed pin beats "latest" (no network when nothing explicit is given)', () => {
  const t = makeDownloadProject('dl-pin');
  try {
    const first = runFgctl(['init', '--from', fixture.releaseDir], {
      cwd: t.proj,
      stateHome: t.state,
      env: { HOME: t.home },
    });
    assert.equal(first.status, 0, first.stderr);

    // The asset base is unreachable: a download attempt would fail the run.
    const again = runFgctl(['init'], {
      cwd: t.proj,
      stateHome: t.state,
      env: { HOME: t.home, FGCTL_ASSET_BASE_URL: 'http://127.0.0.1:1' },
    });
    assert.equal(again.status, 0, again.stderr);
    assert.ok(!/downloading/.test(again.stderr), 'a pinned workspace must not download');
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test('download: with no pin and nothing explicit, init resolves and installs the latest release', async () => {
  const t = makeDownloadProject('dl-latest');
  const assets = path.join(t.root, 'assets');
  const asset = makeReleaseAssets(assets, 'v0.0.2');
  const server = http.createServer((req, res) => {
    if (req.url === '/releases/latest') {
      res.writeHead(302, { Location: '/releases/tag/v0.0.2' });
      res.end();
    } else if (req.url === '/releases/tag/v0.0.2') {
      res.end('release page');
    } else if (req.url === `/${asset}` || req.url === '/SHA256SUMS') {
      res.end(fs.readFileSync(path.join(assets, req.url.slice(1))));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const proc = spawn(FGCTL_BIN, ['init'], {
      cwd: t.proj,
      env: {
        ...process.env,
        FGOS_STATE_HOME: t.state,
        HOME: t.home,
        FGCTL_TARGET: RELEASE_TARGET,
        FGCTL_ASSET_BASE_URL: `http://127.0.0.1:${server.address().port}`,
      },
    });
    const { code, stderr } = await waitForProcess(proc);
    assert.equal(code, 0, stderr);
    assert.match(stderr, /downloaded and verified fgos-v0\.0\.2-/);
    assert.equal(readActivation(t.proj).artifactDigest, fixture.digest);
    const pin = JSON.parse(fs.readFileSync(path.join(t.proj, '.fgos', 'distribution.json'), 'utf8'));
    assert.equal(pin.projectRuntime.releaseVersion, 'v0.0.2', 'the resolved latest tag is recorded in the pin');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});


test('fgctl init writes the sh and cmd launchers; verify names a missing one and repair rewrites it', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-shims-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-shims-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-shims-proj-'));
  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });
    const opts = { cwd: tempProj, stateHome: tempState, env: { HOME: tempHome } };

    const init = runFgctl(['init', '--from', fixture.releaseDir], opts);
    assert.equal(init.status, 0, `fgctl init: stdout=${init.stdout} stderr=${init.stderr}`);

    const binDir = path.join(tempProj, '.fgos', 'installation', 'bin');
    const names = fs.readdirSync(binDir).sort();
    assert.deepEqual(names, ['fgos', 'fgos-runner', 'fgos-runner.cmd', 'fgos.cmd']);

    for (const name of ['fgos', 'fgos-runner']) {
      assert.ok(fs.readFileSync(path.join(binDir, name), 'utf8').startsWith('#!/bin/sh\n'), name);
    }
    const cmdShim = fs.readFileSync(path.join(binDir, 'fgos.cmd'), 'utf8');
    assert.ok(cmdShim.startsWith('@echo off\r\n'));
    assert.ok(cmdShim.includes('bin\\fgos.exe'));
    assert.ok(!cmdShim.includes('#!/bin/sh'), 'the cmd launcher must not need sh');
    const runnerCmd = fs.readFileSync(path.join(binDir, 'fgos-runner.cmd'), 'utf8');
    assert.ok(runnerCmd.includes('bin\\fgos-runner.cmd'));
    assert.ok(runnerCmd.includes('call "%FGOS_SHIM_ENTRY%"'));

    const intact = runFgctl(['verify'], opts);
    assert.equal(intact.status, 0, `fgctl verify: ${intact.stdout}${intact.stderr}`);

    // A launcher this host needs goes missing: reported, and the intact release is not quarantined.
    fs.rmSync(path.join(binDir, 'fgos-runner'));
    const missing = runFgctl(['verify'], opts);
    assert.notEqual(missing.status, 0);
    assert.match(`${missing.stdout}${missing.stderr}`, /fgos-runner is missing; run fgctl repair/);
    assert.equal(fs.readdirSync(path.join(tempState, 'releases')).length, 1, 'the release must stay staged');
    assert.ok(
      !fs.existsSync(path.join(tempState, 'quarantine')) || fs.readdirSync(path.join(tempState, 'quarantine')).length === 0,
      'an intact release must not be quarantined over a launcher',
    );

    const repair = runFgctl(['repair'], opts);
    assert.equal(repair.status, 0, `fgctl repair: ${repair.stdout}${repair.stderr}`);
    assert.deepEqual(fs.readdirSync(binDir).sort(), ['fgos', 'fgos-runner', 'fgos-runner.cmd', 'fgos.cmd']);
    assert.equal(runFgctl(['verify'], opts).status, 0);

    // A hand-edited launcher is reported too.
    fs.writeFileSync(path.join(binDir, 'fgos'), '#!/bin/sh\necho hand-edited\n');
    const edited = runFgctl(['verify'], opts);
    assert.notEqual(edited.status, 0);
    assert.match(`${edited.stdout}${edited.stderr}`, /differs from the one this fgctl writes; run fgctl repair/);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});

test('the cmd launcher runs the activated fgos from a plain Windows shell', { skip: process.platform !== 'win32' ? 'needs cmd.exe' : false }, () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-cmdshim-home-'));
  const tempState = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-cmdshim-state-'));
  const tempProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-cmdshim-proj-'));
  try {
    execFileSync('git', ['init'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempProj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempProj });
    const opts = { cwd: tempProj, stateHome: tempState, env: { HOME: tempHome, USERPROFILE: tempHome } };
    const init = runFgctl(['init', '--from', fixture.releaseDir], opts);
    assert.equal(init.status, 0, `fgctl init: stdout=${init.stdout} stderr=${init.stderr}`);

    const cmdShim = path.join(tempProj, '.fgos', 'installation', 'bin', 'fgos.cmd');
    const res = spawnSync('cmd.exe', ['/d', '/c', cmdShim, 'version', '--runtime-json'], { cwd: tempProj, encoding: 'utf8' });
    assert.equal(res.status, 0, `fgos.cmd: stdout=${res.stdout} stderr=${res.stderr}`);
    const info = JSON.parse(res.stdout);
    assert.equal(info.data.host, 'rust');
    assert.equal(info.data.artifactDigest, fixture.digest);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempState, { recursive: true, force: true });
    fs.rmSync(tempProj, { recursive: true, force: true });
  }
});
