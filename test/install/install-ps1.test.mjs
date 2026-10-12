import { execFileSync, spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const installScript = path.join(repoRoot, 'scripts', 'install.ps1');

// Windows PowerShell on Windows; PowerShell 7 (preinstalled on the CI Linux image) elsewhere.
function findPowerShell() {
  for (const exe of process.platform === 'win32' ? ['powershell.exe', 'pwsh'] : ['pwsh']) {
    const probe = spawnSync(exe, ['-NoProfile', '-Command', 'exit 0'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return exe;
  }
  return null;
}
const powershell = findPowerShell();

// install.ps1 talks to the fixture server living in this process's event loop, so the
// child must run asynchronously (a blocking spawn would deadlock against it).
function runInstaller(env) {
  return new Promise((resolve) => {
    const child = spawn(powershell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', installScript], {
      cwd: repoRoot,
      env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

function buildTarball(dir, tarballName, entries) {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ps1-src-'));
  try {
    for (const [name, content] of Object.entries(entries)) {
      fs.mkdirSync(path.dirname(path.join(src, name)), { recursive: true });
      fs.writeFileSync(path.join(src, name), content);
    }
    // Relative names with the archive written from inside the directory, so a GNU tar
    // never reads a drive letter as a remote host.
    execFileSync('tar', ['-czf', path.join('..', path.basename(dir), tarballName), ...Object.keys(entries)], { cwd: src });
  } finally {
    fs.rmSync(src, { recursive: true, force: true });
  }
  return fs.readFileSync(path.join(dir, tarballName));
}

describe('install.ps1 e2e installer suite', { skip: powershell ? false : 'no PowerShell on this machine' }, () => {
  const version = 'v1.0.0';
  const target = 'x86_64-pc-windows-msvc';
  const tarballName = `fgctl-${version}-${target}.tar.gz`;
  const marker = 'fgctl-fixture-marker-ps1-proof';

  let server;
  let baseUrl;
  let port;
  let served;
  let sums;
  let fixtureDir;

  before(async () => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ps1-fixture-'));
    const valid = buildTarball(fixtureDir, tarballName, { 'fgctl.exe': marker });
    served = { tarball: valid, tampered: false };
    sums = () => `${crypto.createHash('sha256').update(valid).digest('hex')}  ${tarballName}\n`;

    server = http.createServer((req, res) => {
      const url = req.url || '';
      if (url === '/releases/latest' || url === '/releases/latest/') {
        res.writeHead(302, { Location: `http://127.0.0.1:${port}/releases/tag/${version}` });
        res.end();
        return;
      }
      if (url === `/releases/tag/${version}`) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
      }
      if (url.endsWith(tarballName)) {
        const body = Buffer.from(served.tarball);
        if (served.tampered) body[Math.floor(body.length / 2)] ^= 0xff;
        res.writeHead(200, { 'Content-Type': 'application/gzip', 'Content-Length': body.length });
        res.end(body);
        return;
      }
      if (url.endsWith('/SHA256SUMS')) {
        const body = served.sums ?? sums();
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(body) });
        res.end(body);
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
    if (server) await new Promise((resolve) => server.close(resolve));
    if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  async function withDirs(fn) {
    const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ps1-install-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ps1-home-'));
    served.tampered = false;
    delete served.sums;
    try {
      await fn({
        installDir,
        env: {
          ...process.env,
          HOME: home,
          USERPROFILE: home,
          FGCTL_INSTALL_DIR: installDir,
          FGCTL_ASSET_BASE_URL: baseUrl,
          FGCTL_TARGET: target,
          FGCTL_ALLOW_ROOT: '1',
        },
      });
    } finally {
      fs.rmSync(installDir, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  }

  test('an explicit FGCTL_VERSION installs fgctl.exe byte for byte and says how to reach it', async () => {
    await withDirs(async ({ installDir, env }) => {
      const res = await runInstaller({ ...env, FGCTL_VERSION: version });
      assert.equal(res.status, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
      assert.equal(fs.readFileSync(path.join(installDir, 'fgctl.exe'), 'utf8'), marker);
      assert.deepEqual(fs.readdirSync(installDir), ['fgctl.exe'], 'no temp file left behind');
      assert.match(res.stdout, /is not in your PATH/);
      assert.match(res.stdout, /Next step:\s+fgctl init/);
    });
  });

  test('without FGCTL_VERSION the latest release is the one /releases/latest redirects to', async () => {
    await withDirs(async ({ installDir, env }) => {
      const res = await runInstaller(env);
      assert.equal(res.status, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
      assert.equal(fs.readFileSync(path.join(installDir, 'fgctl.exe'), 'utf8'), marker);
    });
  });

  test('a tampered tarball is refused with a non-zero exit and nothing installed', async () => {
    await withDirs(async ({ installDir, env }) => {
      served.tampered = true;
      const res = await runInstaller({ ...env, FGCTL_VERSION: version });
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /checksum verification failed/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a SHA256SUMS without the tarball entry is refused, even when a sibling name contains it', async () => {
    await withDirs(async ({ installDir, env }) => {
      served.sums = `${'a'.repeat(64)}  ${tarballName}.sig\n${'b'.repeat(64)}  other-${tarballName}\n`;
      const res = await runInstaller({ ...env, FGCTL_VERSION: version });
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /no checksum entry found/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('an unsupported FGCTL_TARGET is refused, naming it and the supported target', async () => {
    await withDirs(async ({ installDir, env }) => {
      const res = await runInstaller({ ...env, FGCTL_VERSION: version, FGCTL_TARGET: 'unsupported-arm64-custom-os' });
      assert.notEqual(res.status, 0);
      const output = `${res.stdout}\n${res.stderr}`;
      assert.match(output, /unsupported-arm64-custom-os/);
      assert.match(output, /x86_64-pc-windows-msvc/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a tag with path characters is refused before any request', async () => {
    await withDirs(async ({ installDir, env }) => {
      const res = await runInstaller({ ...env, FGCTL_VERSION: '../evil' });
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /invalid release tag/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a file:// asset base installs without a server', async () => {
    await withDirs(async ({ installDir, env }) => {
      fs.writeFileSync(path.join(fixtureDir, 'SHA256SUMS'), sums());
      const res = await runInstaller({
        ...env,
        FGCTL_VERSION: version,
        FGCTL_ASSET_BASE_URL: new URL(`file://${process.platform === 'win32' ? '/' : ''}${fixtureDir.split(path.sep).join('/')}`).href,
      });
      assert.equal(res.status, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
      assert.equal(fs.readFileSync(path.join(installDir, 'fgctl.exe'), 'utf8'), marker);
    });
  });

  test('a tarball whose fgctl.exe is a symlink is refused, nothing installed', { skip: process.platform === 'win32' ? 'creating a symlink needs a privilege Windows runners lack' : false }, async () => {
    await withDirs(async ({ installDir, env }) => {
      const evilDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-ps1-evil-'));
      try {
        const secret = path.join(evilDir, 'secret');
        fs.writeFileSync(secret, 'this-must-never-be-installed');
        const stage = path.join(evilDir, 'stage');
        fs.mkdirSync(stage);
        fs.symlinkSync(secret, path.join(stage, 'fgctl.exe'));
        const evilTar = path.join(evilDir, tarballName);
        execFileSync('tar', ['-czf', evilTar, '-C', stage, 'fgctl.exe']);
        const evil = fs.readFileSync(evilTar);
        const original = { tarball: served.tarball };
        served.tarball = evil;
        served.sums = `${crypto.createHash('sha256').update(evil).digest('hex')}  ${tarballName}\n`;
        try {
          const res = await runInstaller({ ...env, FGCTL_VERSION: version });
          assert.notEqual(res.status, 0);
          assert.match(res.stderr, /symlink/i);
          assert.deepEqual(fs.readdirSync(installDir), []);
        } finally {
          served.tarball = original.tarball;
        }
      } finally {
        fs.rmSync(evilDir, { recursive: true, force: true });
      }
    });
  });
});

describe('install.ps1 source contract', () => {
  const source = fs.readFileSync(installScript, 'utf8');

  test('every network call is bounded by a timeout', () => {
    const calls = source.match(/Invoke-WebRequest[^\n]*/g) ?? [];
    assert.ok(calls.length >= 2, 'expected the download and latest-resolution calls');
    for (const call of calls) assert.match(call, /-TimeoutSec 120/, call);
  });

  test('it never touches PATH itself and never needs elevation', () => {
    // The only mention of changing the user's PATH is text the script prints for the user to run.
    for (const line of source.split('\n').filter((l) => l.includes('SetEnvironmentVariable'))) {
      assert.match(line.trim(), /^Write-Host /, line);
    }
    assert.doesNotMatch(source, /Start-Process[^\n]*-Verb RunAs/);
    assert.match(source, /FGCTL_ALLOW_ROOT/);
  });

  test('the supported target list names only the Windows target', () => {
    assert.match(source, /\$supportedTargets = @\('x86_64-pc-windows-msvc'\)/);
  });
});
