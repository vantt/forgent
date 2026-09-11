import { execFileSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const installScript = path.join(repoRoot, 'install.sh');

// The fixture HTTP server below runs in this same process's event loop.
// spawnSync would block that event loop for the whole child lifetime,
// deadlocking against install.sh's own curl requests back to this server --
// spawn (async) + a completion promise keeps the event loop free to answer
// them.
function runInstallScript(env) {
  return new Promise((resolve) => {
    const child = spawn('sh', [installScript], { cwd: repoRoot, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

describe('install.sh e2e installer suite', () => {
  const version = 'v1.0.0';
  const target = 'x86_64-unknown-linux-gnu';
  const tarballName = `fgctl-${version}-${target}.tar.gz`;
  const marker = 'fgctl-fixture-marker-e2e-proof';

  let server;
  let baseUrl;
  let port;
  let validTarball;
  let tamperedTarball;
  let shaSumsContent;
  let tamperActive = false;

  before(async () => {
    // 1. Build fixture tarball containing fake fgctl binary
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tar-src-'));
    const fixtureOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tar-out-'));
    try {
      const fgctlPath = path.join(fixtureDir, 'fgctl');
      fs.writeFileSync(fgctlPath, `#!/bin/sh\necho "${marker}"\n`, { mode: 0o755 });
      const tarPath = path.join(fixtureOutDir, tarballName);
      execFileSync('tar', ['-czf', tarPath, '-C', fixtureDir, 'fgctl']);
      validTarball = fs.readFileSync(tarPath);
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
      fs.rmSync(fixtureOutDir, { recursive: true, force: true });
    }

    // Tampered tarball with one corrupted byte
    tamperedTarball = Buffer.from(validTarball);
    tamperedTarball[Math.floor(tamperedTarball.length / 2)] ^= 0xff;

    // Correct SHA256SUMS
    const hash = crypto.createHash('sha256').update(validTarball).digest('hex');
    shaSumsContent = `${hash}  ${tarballName}\n`;

    // 2. Start HTTP server on 127.0.0.1
    server = http.createServer((req, res) => {
      const url = req.url || '';
      if (url === '/releases/latest' || url === '/releases/latest/') {
        res.writeHead(302, {
          Location: `http://127.0.0.1:${port}/releases/tag/${version}`,
        });
        res.end();
        return;
      }
      if (url === `/releases/tag/${version}`) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
      }
      if (url.endsWith(tarballName)) {
        res.writeHead(200, {
          'Content-Type': 'application/gzip',
          'Content-Length': tamperActive ? tamperedTarball.length : validTarball.length,
        });
        res.end(tamperActive ? tamperedTarball : validTarball);
        return;
      }
      if (url.endsWith('/SHA256SUMS') || url === '/SHA256SUMS') {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(shaSumsContent),
        });
        res.end(shaSumsContent);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Case 1: explicit FGCTL_VERSION installs successfully (exercises R4 alone)', async () => {
    tamperActive = false;
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case1-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case1-home-'));

    try {
      const res = await runInstallScript({
        PATH: process.env.PATH,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_VERSION: version,
        FGCTL_ALLOW_ROOT: '1',
      });

      assert.equal(res.status, 0, `install.sh failed: stdout=${res.stdout} stderr=${res.stderr}`);

      const installedBin = path.join(tempInstallDir, 'fgctl');
      assert.ok(fs.existsSync(installedBin), 'fgctl binary should exist in FGCTL_INSTALL_DIR');

      const binOutput = execFileSync(installedBin, { encoding: 'utf8' }).trim();
      assert.equal(binOutput, marker, 'Installed fgctl must run and print marker');
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  test('Case 2: omit FGCTL_VERSION against server with /releases/latest redirect (exercises R3 resolution)', async () => {
    tamperActive = false;
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case2-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case2-home-'));

    try {
      const res = await runInstallScript({
        PATH: process.env.PATH,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_ALLOW_ROOT: '1',
      });

      assert.equal(res.status, 0, `install.sh failed: stdout=${res.stdout} stderr=${res.stderr}`);

      const installedBin = path.join(tempInstallDir, 'fgctl');
      assert.ok(fs.existsSync(installedBin), 'fgctl binary should exist in FGCTL_INSTALL_DIR');

      const binOutput = execFileSync(installedBin, { encoding: 'utf8' }).trim();
      assert.equal(binOutput, marker, 'Installed fgctl must run and print marker');
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  test('Case 3: tamper one byte of served tarball asserts non-zero exit with NOTHING installed', async () => {
    tamperActive = true;
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case3-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case3-home-'));

    try {
      const res = await runInstallScript({
        PATH: process.env.PATH,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_VERSION: version,
        FGCTL_ALLOW_ROOT: '1',
      });

      assert.notEqual(res.status, 0, 'install.sh must exit non-zero on checksum failure');
      assert.match(res.stderr, /checksum verification failed/, 'stderr should report checksum verification failure');

      const installedBin = path.join(tempInstallDir, 'fgctl');
      assert.ok(!fs.existsSync(installedBin), 'fgctl must NOT be installed when checksum verification fails');
      const files = fs.readdirSync(tempInstallDir);
      assert.equal(files.length, 0, 'FGCTL_INSTALL_DIR must remain empty when checksum verification fails');
    } finally {
      tamperActive = false;
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  test('Case 4: set FGCTL_TARGET to an unsupported value asserts refusal message names it', async () => {
    tamperActive = false;
    const unsupportedTarget = 'unsupported-arm64-custom-os';
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case4-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case4-home-'));

    try {
      const res = await runInstallScript({
        PATH: process.env.PATH,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_VERSION: version,
        FGCTL_TARGET: unsupportedTarget,
        FGCTL_ALLOW_ROOT: '1',
      });

      assert.notEqual(res.status, 0, 'install.sh must exit non-zero for unsupported target');
      const combinedOutput = `${res.stdout}\n${res.stderr}`;
      assert.ok(
        combinedOutput.includes(unsupportedTarget),
        `Refusal message must name unsupported target '${unsupportedTarget}', got: ${combinedOutput}`
      );
      assert.match(combinedOutput, /x86_64-unknown-linux-gnu/, 'Refusal message must list supported targets');

      const installedBin = path.join(tempInstallDir, 'fgctl');
      assert.ok(!fs.existsSync(installedBin), 'fgctl must NOT be installed for unsupported target');
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  test('Case 6: every network call is bounded by a connect/total timeout (no unbounded hang)', () => {
    const source = fs.readFileSync(installScript, 'utf8');
    assert.match(source, /CURL_TIMEOUT_ARGS="[^"]*--connect-timeout/, 'curl timeout args must set --connect-timeout');
    assert.match(source, /CURL_TIMEOUT_ARGS="[^"]*--max-time/, 'curl timeout args must set --max-time');
    assert.match(source, /WGET_TIMEOUT_ARGS="--timeout=/, 'wget timeout args must set --timeout=');
    // wget's --timeout is an IDLE timeout (resets on every byte received)
    // and it retries up to 20 times by default -- --tries=1 stops the
    // retry multiplication, and the external `timeout` command wrapper
    // below is the only genuine wall-clock backstop for the wget path.
    assert.match(source, /WGET_TIMEOUT_ARGS="[^"]*--tries=1/, 'wget timeout args must cap retries to 1');
    assert.match(source, /HARD_TIMEOUT_CMD="timeout \d/, 'a real wall-clock backstop via the external timeout command must be defined');
    // Every actual curl/wget invocation must reference the shared timeout
    // args, not just one of them -- a live server that never finishes
    // responding would otherwise still hang the specific call that omitted
    // them. Count exact invocation substrings rather than any line
    // mentioning "curl"/"wget" (comments, error messages, `command -v`
    // probes) to avoid false matches/misses on either side.
    const curlInvocations = (source.match(/curl -fsSL \$CURL_TIMEOUT_ARGS/g) || []).length;
    const wgetInvocations = (source.match(/wget[^\n]*\$WGET_TIMEOUT_ARGS/g) || []).length;
    const hardTimeoutUsages = (source.match(/\$HARD_TIMEOUT_CMD (curl|wget)/g) || []).length;
    assert.equal(curlInvocations, 2, 'expected exactly two curl invocations carrying the shared timeout args (download + latest resolution)');
    assert.equal(wgetInvocations, 2, 'expected exactly two wget invocations carrying the shared timeout args (download + latest resolution)');
    assert.equal(hardTimeoutUsages, 4, 'expected all four curl/wget call sites to be wrapped by the hard timeout backstop');
  });

  test('Case 7: a tarball whose fgctl entry is a symlink to an external file is refused, nothing installed', async () => {
    tamperActive = false;
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case7-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case7-home-'));
    const secretDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case7-secret-'));
    const symlinkFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case7-fixture-'));
    const symlinkTarballName = `fgctl-${version}-${target}.tar.gz`;

    try {
      // A file OUTSIDE the tarball whose content must never end up installed.
      const secretPath = path.join(secretDir, 'external-secret');
      const secretContent = 'this-must-never-be-installed-as-fgctl';
      fs.writeFileSync(secretPath, secretContent);

      fs.symlinkSync(secretPath, path.join(symlinkFixtureDir, 'fgctl'));
      const symlinkTarPath = path.join(symlinkFixtureDir, symlinkTarballName);
      // Build the archive WITHOUT dereferencing (-h), so `fgctl` is stored as
      // an actual symlink entry, matching a real malicious tarball.
      execFileSync('tar', ['-czf', symlinkTarPath, '-C', symlinkFixtureDir, 'fgctl']);
      const symlinkTarball = fs.readFileSync(symlinkTarPath);
      const symlinkHash = crypto.createHash('sha256').update(symlinkTarball).digest('hex');

      // Serve this malicious tarball for the duration of this one test via a
      // second, disposable server (keeps the shared `before()` fixtures
      // untouched for every other case).
      const evilServer = http.createServer((req, res) => {
        const url = req.url || '';
        if (url.endsWith(symlinkTarballName)) {
          res.writeHead(200, { 'Content-Type': 'application/gzip', 'Content-Length': symlinkTarball.length });
          res.end(symlinkTarball);
          return;
        }
        if (url.endsWith('/SHA256SUMS')) {
          const content = `${symlinkHash}  ${symlinkTarballName}\n`;
          res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(content) });
          res.end(content);
          return;
        }
        res.writeHead(404);
        res.end('Not found');
      });
      const evilBaseUrl = await new Promise((resolve) => {
        evilServer.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${evilServer.address().port}`));
      });

      try {
        const res = await runInstallScript({
          PATH: process.env.PATH,
          HOME: tempHome,
          FGCTL_INSTALL_DIR: tempInstallDir,
          FGCTL_ASSET_BASE_URL: evilBaseUrl,
          FGCTL_VERSION: version,
          FGCTL_ALLOW_ROOT: '1',
        });

        assert.notEqual(res.status, 0, 'install.sh must refuse a symlinked fgctl entry');
        assert.match(res.stderr, /symlink/i, 'refusal message should mention the symlink refusal');

        const installedBin = path.join(tempInstallDir, 'fgctl');
        assert.ok(!fs.existsSync(installedBin), 'nothing must be installed when fgctl is a symlink payload');
      } finally {
        await new Promise((resolve) => evilServer.close(resolve));
      }
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
      fs.rmSync(secretDir, { recursive: true, force: true });
      fs.rmSync(symlinkFixtureDir, { recursive: true, force: true });
    }
  });

  test('Case 5: refuses to run as root without FGCTL_ALLOW_ROOT=1, and proceeds with it set', async () => {
    tamperActive = false;
    const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case5-install-'));
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case5-home-'));
    const fakeBinDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-case5-fakebin-'));

    try {
      // Shadow `id` with a fake root reply -- prepended onto PATH so
      // install.sh's own `id -u` call resolves to this script instead of
      // the real one, without actually running the test suite as root.
      const fakeIdPath = path.join(fakeBinDir, 'id');
      fs.writeFileSync(fakeIdPath, '#!/bin/sh\nif [ "$1" = "-u" ]; then echo 0; else echo "uid=0(root) gid=0(root)"; fi\n', {
        mode: 0o755,
      });
      const rootPath = `${fakeBinDir}:${process.env.PATH}`;

      const refused = await runInstallScript({
        PATH: rootPath,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_VERSION: version,
      });
      assert.notEqual(refused.status, 0, 'install.sh must refuse to run as root by default');
      assert.match(refused.stderr, /root/i, 'refusal message should mention root');
      assert.ok(!fs.existsSync(path.join(tempInstallDir, 'fgctl')), 'nothing installed on root refusal');

      const allowed = await runInstallScript({
        PATH: rootPath,
        HOME: tempHome,
        FGCTL_INSTALL_DIR: tempInstallDir,
        FGCTL_ASSET_BASE_URL: baseUrl,
        FGCTL_VERSION: version,
        FGCTL_ALLOW_ROOT: '1',
      });
      assert.equal(allowed.status, 0, `install.sh with FGCTL_ALLOW_ROOT=1 must succeed: ${allowed.stderr}`);
      assert.ok(fs.existsSync(path.join(tempInstallDir, 'fgctl')), 'fgctl installed once root is explicitly allowed');
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
      fs.rmSync(fakeBinDir, { recursive: true, force: true });
    }
  });
});
