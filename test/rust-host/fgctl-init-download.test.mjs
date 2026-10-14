import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { useReleaseFixture, fixture, runFgctl, RELEASE_TARGET, makeDownloadProject, makeReleaseAssets, readActivation, writePinFor } from './fgctl-init-fixture.mjs';

useReleaseFixture();

test('download: FGCTL_VERSION installs that exact tag from the asset base, verified against SHA256SUMS', () => {
  const t = makeDownloadProject('dl-version');
  try {
    const assets = path.join(t.root, 'assets');
    makeReleaseAssets(assets, 'v0.0.1-rc.1');
    const res = runFgctl(['init'], {
      cwd: t.proj,
      stateHome: t.state,
      env: {
        HOME: t.home,
        FGCTL_VERSION: 'v0.0.1-rc.1',
        FGCTL_TARGET: RELEASE_TARGET,
        FGCTL_ASSET_BASE_URL: pathToFileURL(assets).href,
      },
    });
    assert.equal(res.status, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
    assert.match(res.stderr, new RegExp(`downloaded and verified fgos-v0\\.0\\.1-rc\\.1-${RELEASE_TARGET}\\.tar\\.gz`));
    assert.equal(readActivation(t.proj).artifactDigest, fixture.digest);
    const pin = JSON.parse(fs.readFileSync(path.join(t.proj, '.fgos', 'distribution.json'), 'utf8'));
    assert.equal(pin.projectRuntime.releaseVersion, 'v0.0.1-rc.1', 'the downloaded tag is recorded in the pin');
    assert.equal(pin.projectRuntime.artifactDigest, fixture.digest);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test('download: a pin with a tag re-acquires that release on an empty machine store (teammate flow)', () => {
  const first = makeDownloadProject('dl-teammate-a');
  const second = makeDownloadProject('dl-teammate-b');
  try {
    const assets = path.join(first.root, 'assets');
    makeReleaseAssets(assets, 'v0.0.3');
    const env = (t) => ({
      HOME: t.home,
      FGCTL_TARGET: RELEASE_TARGET,
      FGCTL_ASSET_BASE_URL: pathToFileURL(assets).href,
    });
    const initial = runFgctl(['init'], {
      cwd: first.proj,
      stateHome: first.state,
      env: { ...env(first), FGCTL_VERSION: 'v0.0.3' },
    });
    assert.equal(initial.status, 0, initial.stderr);

    // The teammate clones the repository: only the tracked pin comes along.
    fs.mkdirSync(path.join(second.proj, '.fgos'), { recursive: true });
    fs.copyFileSync(
      path.join(first.proj, '.fgos', 'distribution.json'),
      path.join(second.proj, '.fgos', 'distribution.json'),
    );
    const res = runFgctl(['init'], { cwd: second.proj, stateHome: second.state, env: env(second) });
    assert.equal(res.status, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
    assert.match(res.stderr, /pinned release v0\.0\.3 is not staged on this machine; downloading it/);
    assert.equal(readActivation(second.proj).artifactDigest, fixture.digest);
  } finally {
    fs.rmSync(first.root, { recursive: true, force: true });
    fs.rmSync(second.root, { recursive: true, force: true });
  }
});

test('download: a pinned tag whose download does not match the pinned digest is refused', () => {
  const t = makeDownloadProject('dl-pin-digest-mismatch');
  try {
    const assets = path.join(t.root, 'assets');
    makeReleaseAssets(assets, 'v0.0.4');
    fs.mkdirSync(path.join(t.proj, '.fgos'), { recursive: true });
    fs.writeFileSync(
      path.join(t.proj, '.fgos', 'distribution.json'),
      JSON.stringify({
        schemaVersion: 1,
        projectRuntime: {
          policy: 'exact-digest',
          artifactDigest: `sha256:${'a'.repeat(64)}`,
          releaseVersion: 'v0.0.4',
          channel: null,
          allowPrerelease: false,
        },
      }),
    );
    const res = runFgctl(['init'], {
      cwd: t.proj,
      stateHome: t.state,
      env: {
        HOME: t.home,
        FGCTL_TARGET: RELEASE_TARGET,
        FGCTL_ASSET_BASE_URL: pathToFileURL(assets).href,
      },
    });
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /pin-mismatch/);
    assert.ok(!fs.existsSync(path.join(t.proj, '.fgos', 'installation')), 'nothing may be activated');
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});


test('download: a pin tag without the leading v is normalized to the v-prefixed release tag', () => {
  const t = makeDownloadProject('dl-bare-tag');
  try {
    const assets = path.join(t.root, 'assets');
    makeReleaseAssets(assets, 'v0.0.5');
    writePinFor(t.proj, '0.0.5');
    const res = runFgctl(['init'], {
      cwd: t.proj,
      stateHome: t.state,
      env: { HOME: t.home, FGCTL_TARGET: RELEASE_TARGET, FGCTL_ASSET_BASE_URL: pathToFileURL(assets).href },
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stderr, /downloaded and verified fgos-v0\.0\.5-/);
    assert.equal(readActivation(t.proj).artifactDigest, fixture.digest);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test('download: a pinned tag that cannot be downloaded says so and names FGCTL_VERSION and FGCTL_FROM', () => {
  const t = makeDownloadProject('dl-pin-unreachable');
  try {
    writePinFor(t.proj, 'v0.0.6');
    const res = runFgctl(['init'], {
      cwd: t.proj,
      stateHome: t.state,
      env: { HOME: t.home, FGCTL_TARGET: RELEASE_TARGET, FGCTL_ASSET_BASE_URL: 'http://127.0.0.1:1' },
    });
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /pinned release v0\.0\.6 could not be downloaded/);
    assert.match(res.stderr, /FGCTL_VERSION/);
    assert.match(res.stderr, /FGCTL_FROM/);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test('download: a local install writes a digest-only pin (a manifest version is not a download tag)', () => {
  const t = makeDownloadProject('dl-local-pin');
  try {
    const res = runFgctl(['init', '--from', fixture.releaseDir], { cwd: t.proj, stateHome: t.state, env: { HOME: t.home } });
    assert.equal(res.status, 0, res.stderr);
    const pin = JSON.parse(fs.readFileSync(path.join(t.proj, '.fgos', 'distribution.json'), 'utf8'));
    assert.equal(pin.projectRuntime.releaseVersion, null);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

for (const [mode, expected] of [
  ['wrong', /checksum verification failed/],
  ['missing', /no checksum entry found/],
]) {
  test(`download: a ${mode} SHA256SUMS entry refuses init and writes nothing`, () => {
    const t = makeDownloadProject(`dl-${mode}`);
    try {
      const assets = path.join(t.root, 'assets');
      makeReleaseAssets(assets, 'v0.0.1', { sums: mode });
      const res = runFgctl(['init'], {
        cwd: t.proj,
        stateHome: t.state,
        env: {
          HOME: t.home,
          FGCTL_VERSION: 'v0.0.1',
          FGCTL_TARGET: RELEASE_TARGET,
          FGCTL_ASSET_BASE_URL: pathToFileURL(assets).href,
        },
      });
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, expected);
      assert.ok(!fs.existsSync(path.join(t.proj, '.fgos', 'installation')), 'no installation may be created');
      assert.ok(!fs.existsSync(path.join(t.proj, '.fgos', 'distribution.json')), 'no pin may be written');
    } finally {
      fs.rmSync(t.root, { recursive: true, force: true });
    }
  });
}

