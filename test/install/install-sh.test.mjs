import '../helpers/process-tmp-root.mjs';
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

describe('install.sh e2e installer suite', { skip: process.platform === 'win32' ? 'install.sh is a POSIX-only shell installer' : false }, () => {
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
        FGCTL_TARGET: target,
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
        FGCTL_TARGET: target,
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
      assert.match(combinedOutput, /cargo build --release/, 'Refusal message must point at the source build');

      const installedBin = path.join(tempInstallDir, 'fgctl');
      assert.ok(!fs.existsSync(installedBin), 'fgctl must NOT be installed for unsupported target');
    } finally {
      fs.rmSync(tempInstallDir, { recursive: true, force: true });
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  test('Case 6: every network call is bounded by a connect/total timeout and a size cap (no unbounded hang)', () => {
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
    // A file download carries a byte cap and may only be redirected to https.
    assert.match(source, /--max-filesize "\$/, 'a download must pass curl --max-filesize');
    assert.match(source, /--proto-redir =https/, 'a redirect may only lead to https');
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
          FGCTL_TARGET: target,
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
        FGCTL_TARGET: target,
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
        FGCTL_TARGET: target,
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

// ---------------------------------------------------------------------------
// Safety and shape of the installer: every case below runs against a file://
// mirror or a recording stand-in for curl, with HOME and every XDG directory
// redirected, so nothing reaches the network or the real ~/.local/bin.
// ---------------------------------------------------------------------------

const target = 'x86_64-unknown-linux-gnu';
const hostTools = ['id', 'uname', 'mktemp', 'tar', 'awk', 'cut', 'tr', 'rm', 'mkdir', 'cp', 'chmod', 'mv', 'wc', 'cat', 'date', 'dirname', 'basename', 'head', 'sed', 'grep', 'timeout', 'ls', 'sleep', 'gzip'];
const withHash = [...hostTools, 'sha256sum'];

function writeFixtureTar(dir, name, entries, { transform } = {}) {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-fx-src-'));
  try {
    for (const [entry, content] of Object.entries(entries)) {
      const file = path.join(src, entry);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, { mode: 0o755 });
    }
    const args = ['-czf', path.join(dir, name)];
    if (transform) args.push('-P', `--transform=${transform}`);
    execFileSync('tar', [...args, ...Object.keys(entries)], { cwd: src });
  } finally {
    fs.rmSync(src, { recursive: true, force: true });
  }
}

function sha256Of(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** A release directory holding one fgctl tarball and its SHA256SUMS; returns its file:// URL. */
function makeMirror({ version = 'v0.2.0', entries = { fgctl: '#!/bin/sh\necho fixture-fgctl\n' }, transform, sums } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-mirror-'));
  const name = `fgctl-${version}-${target}.tar.gz`;
  writeFixtureTar(dir, name, entries, { transform });
  const hash = sha256Of(path.join(dir, name));
  fs.writeFileSync(path.join(dir, 'SHA256SUMS'), sums ? sums(name, hash) : `${hash}  ${name}\n`);
  return { dir, name, url: `file://${dir}` };
}

function isolatedEnv(home, installDir, extra = {}) {
  return {
    PATH: process.env.PATH,
    HOME: home,
    XDG_CONFIG_HOME: path.join(home, '.config'),
    XDG_DATA_HOME: path.join(home, '.local', 'share'),
    XDG_STATE_HOME: path.join(home, '.local', 'state'),
    XDG_CACHE_HOME: path.join(home, '.cache'),
    FGCTL_INSTALL_DIR: installDir,
    FGCTL_TARGET: target,
    FGCTL_ALLOW_ROOT: '1',
    ...extra,
  };
}

/** A PATH directory holding only the named host tools, so a missing tool can be simulated. */
function toolDir(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-tools-'));
  for (const name of names) {
    const found = execFileSync('sh', ['-c', `command -v ${name} || true`], { encoding: 'utf8' }).trim();
    if (found) fs.symlinkSync(found, path.join(dir, name));
  }
  return dir;
}

/** A stand-in curl in `dir` that logs its arguments and serves files from `mirrorDir`. */
function fakeCurl(dir, mirrorDir) {
  const log = path.join(dir, 'curl.log');
  fs.writeFileSync(log, '');
  fs.writeFileSync(
    path.join(dir, 'curl'),
    `#!/bin/sh
echo "$*" >> "${log}"
out=""; url=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift ;;
    -w) shift ;;
    --connect-timeout|--max-time|--max-filesize|--proto|--proto-redir) shift ;;
    -*) ;;
    *) url="$1" ;;
  esac
  shift
done
case "$url" in
  */releases/latest) printf '%s' 'https://github.com/vantt/forgent/releases/tag/v0.2.0'; exit 0 ;;
esac
cp "${mirrorDir}/\${url##*/}" "$out"
`,
    { mode: 0o755 },
  );
  return { log: () => fs.readFileSync(log, 'utf8') };
}

function runSh(env, args = [], script = installScript) {
  return new Promise((resolve) => {
    const child = spawn('/bin/sh', [script, ...args], { cwd: repoRoot, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

async function inSandbox(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-sandbox-'));
  const home = path.join(root, 'home');
  const installDir = path.join(root, 'bin');
  fs.mkdirSync(home);
  fs.mkdirSync(installDir);
  try {
    await fn({ root, home, installDir });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** Runs `fn` with a tool directory (and recording curl serving `mirrorDir`) that is removed afterwards. */
async function withTools(names, mirrorDir, fn) {
  const tools = toolDir(names);
  try {
    await fn({ tools, curl: fakeCurl(tools, mirrorDir) });
  } finally {
    fs.rmSync(tools, { recursive: true, force: true });
  }
}

describe('install.sh safety and shape', { skip: process.platform === 'win32' ? 'install.sh is a POSIX-only shell installer' : false }, () => {
  const mirrors = [];
  const mirror = (options) => {
    const made = makeMirror(options);
    mirrors.push(made.dir);
    return made;
  };
  after(() => {
    for (const dir of mirrors) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('the script parses and ends with main "$@" so a cut-short download runs nothing', () => {
    execFileSync('sh', ['-n', installScript]);
    const lines = fs.readFileSync(installScript, 'utf8').trimEnd().split('\n');
    assert.equal(lines[lines.length - 1], 'main "$@"');
    assert.equal(lines.filter((l) => l === 'main "$@"').length, 1);
  });

  test('a script cut at any line installs nothing', async () => {
    const made = mirror();
    const lines = fs.readFileSync(installScript, 'utf8').split('\n');
    const cuts = [3, 10, 25, Math.floor(lines.length / 3), Math.floor(lines.length / 2), lines.length - 40, lines.length - 12, lines.length - 3];
    for (const cut of cuts) {
      await inSandbox(async ({ root, home, installDir }) => {
        const truncated = path.join(root, 'cut-install.sh');
        fs.writeFileSync(truncated, `${lines.slice(0, cut).join('\n')}\n`);
        await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }), [], truncated);
        assert.deepEqual(fs.readdirSync(installDir), [], `a script cut at line ${cut} must install nothing`);
      });
    }
  });

  test('--help exits 0 and names the options; an unknown option is a usage error that installs nothing', async () => {
    await inSandbox(async ({ home, installDir }) => {
      const help = await runSh(isolatedEnv(home, installDir), ['--help']);
      assert.equal(help.status, 0, help.stderr);
      assert.match(help.stdout, /--version/);
      assert.match(help.stdout, /FGCTL_VERSION/);
      assert.match(help.stdout, /FGCTL_ASSET_BASE_URL/);
      const bad = await runSh(isolatedEnv(home, installDir), ['--nope']);
      assert.equal(bad.status, 2);
      assert.match(bad.stderr, /--nope/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a release tag is accepted with or without the leading v, by env or by --version', async () => {
    const made = mirror({ version: 'v0.2.0' });
    for (const [label, env, args] of [
      ['FGCTL_VERSION=0.2.0', { FGCTL_VERSION: '0.2.0' }, []],
      ['FGCTL_VERSION=v0.2.0', { FGCTL_VERSION: 'v0.2.0' }, []],
      ['--version 0.2.0', {}, ['--version', '0.2.0']],
      ['--version v0.2.0', {}, ['--version', 'v0.2.0']],
    ]) {
      await inSandbox(async ({ home, installDir }) => {
        const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, ...env }), args);
        assert.equal(res.status, 0, `${label}: ${res.stderr}`);
        assert.ok(fs.existsSync(path.join(installDir, 'fgctl')), label);
      });
    }
  });

  test('a tag with path characters is refused before any request', async () => {
    const made = mirror();
    await inSandbox(async ({ home, installDir }) => {
      await withTools(withHash, made.dir, async ({ tools, curl }) => {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_VERSION: '../evil' }));
        assert.notEqual(res.status, 0);
        assert.match(res.stderr, /invalid release tag/);
        assert.equal(curl.log(), '');
      });
    });
  });

  test('"latest" is resolved from the default repository only, and the tag it names is downloaded from there', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      await withTools(withHash, made.dir, async ({ tools, curl }) => {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools }));
        assert.equal(res.status, 0, res.stderr);
        const calls = curl.log();
        assert.match(calls, /https:\/\/github\.com\/vantt\/forgent\/releases\/latest/);
        assert.match(calls, /https:\/\/github\.com\/vantt\/forgent\/releases\/download\/v0\.2\.0\/fgctl-v0\.2\.0-x86_64-unknown-linux-gnu\.tar\.gz/);
        assert.match(calls, /--max-filesize \d+/);
        assert.match(calls, /--proto-redir =https/);
      });
    });
  });

  test('FGCTL_ASSET_BASE_URL names an asset directory, so with no version the installer asks for one instead of guessing', async () => {
    const made = mirror();
    await inSandbox(async ({ home, installDir }) => {
      await withTools(withHash, made.dir, async ({ tools, curl }) => {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: 'https://mirror.example/assets' }));
        assert.notEqual(res.status, 0);
        assert.match(res.stderr, /FGCTL_VERSION/);
        assert.equal(curl.log(), '', 'no request may be made');
      });
    });
  });

  test('plain http is refused unless the host is loopback, before any request is made', async () => {
    const made = mirror();
    const refused = [
      'http://192.0.2.1/assets',
      'http://example.com/assets',
      'http://127.0.0.1.evil.example/assets',
      'http://127.0.0.1@evil.example/assets',
      'http://localhost.evil.example/assets',
      'http://127.0.0/assets',
      'http://[::2]/assets',
      'http://evil.example\\@127.0.0.1/assets',
      'ftp://127.0.0.1/assets',
    ];
    for (const base of refused) {
      await inSandbox(async ({ home, installDir }) => {
        await withTools(withHash, made.dir, async ({ tools, curl }) => {
          const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: base, FGCTL_VERSION: 'v0.2.0' }));
          assert.notEqual(res.status, 0, base);
          assert.match(res.stderr, /https/, `${base}: ${res.stderr}`);
          assert.equal(curl.log(), '', `${base} must not reach curl`);
          assert.deepEqual(fs.readdirSync(installDir), []);
        });
      });
    }
  });

  test('a loopback http mirror is allowed under every loopback spelling', async () => {
    const made = mirror({ version: 'v0.2.0' });
    for (const host of ['127.0.0.1', '127.1.2.3', 'localhost', '[::1]']) {
      await inSandbox(async ({ home, installDir }) => {
        await withTools(withHash, made.dir, async ({ tools, curl }) => {
          const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: `http://${host}:8123/assets`, FGCTL_VERSION: 'v0.2.0' }));
          assert.equal(res.status, 0, `${host}: ${res.stderr}`);
          assert.ok(curl.log().includes(`http://${host}:8123/assets/fgctl-v0.2.0`), curl.log());
        });
      });
    }
  });

  test('with only wget, https downloads work and carry a redirect cap, and a loopback http URL is refused', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      const tools = toolDir(withHash);
      const log = path.join(tools, 'wget.log');
      fs.writeFileSync(
        path.join(tools, 'wget'),
        `#!/bin/sh\necho "$*" >> "${log}"\nout=""; url=""\nwhile [ $# -gt 0 ]; do case "$1" in -O) out="$2"; shift ;; -*) ;; *) url="$1" ;; esac; shift; done\ncp "${made.dir}/\${url##*/}" "$out"\n`,
        { mode: 0o755 },
      );
      try {
        const ok = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: 'https://mirror.example/assets', FGCTL_VERSION: 'v0.2.0' }));
        assert.equal(ok.status, 0, ok.stderr);
        assert.match(fs.readFileSync(log, 'utf8'), /--max-redirect=5/);
        const refused = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: 'http://127.0.0.1:8123/assets', FGCTL_VERSION: 'v0.2.0' }));
        assert.notEqual(refused.status, 0);
        assert.match(refused.stderr, /install curl/);
      } finally {
        fs.rmSync(tools, { recursive: true, force: true });
      }
    });
  });

  test('a file:// mirror needs no network tool at all', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      const tools = toolDir(withHash);
      try {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
        assert.equal(res.status, 0, res.stderr);
      } finally {
        fs.rmSync(tools, { recursive: true, force: true });
      }
    });
  });

  test('a machine with no SHA-256 tool is told which tools to install, not that the checksum failed', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      const tools = toolDir(hostTools);
      try {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
        assert.notEqual(res.status, 0);
        assert.match(res.stderr, /sha256sum/);
        assert.match(res.stderr, /openssl/);
        assert.doesNotMatch(res.stderr, /checksum verification failed/);
        assert.deepEqual(fs.readdirSync(installDir), []);
      } finally {
        fs.rmSync(tools, { recursive: true, force: true });
      }
    });
  });

  test('openssl alone is enough to verify the download', { skip: execFileSync('sh', ['-c', 'command -v openssl || true'], { encoding: 'utf8' }).trim() ? false : 'no openssl on this machine' }, async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      const tools = toolDir([...hostTools, 'openssl']);
      try {
        const res = await runSh(isolatedEnv(home, installDir, { PATH: tools, FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
        assert.equal(res.status, 0, res.stderr);
        assert.ok(fs.existsSync(path.join(installDir, 'fgctl')));
      } finally {
        fs.rmSync(tools, { recursive: true, force: true });
      }
    });
  });

  test('a SHA256SUMS that lists the tarball twice is refused', async () => {
    const made = mirror({ version: 'v0.2.0', sums: (name, hash) => `${hash}  ${name}\n${'0'.repeat(64)}  ${name}\n` });
    await inSandbox(async ({ home, installDir }) => {
      const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /more than once/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('an archive that tries to leave its directory, or has no fgctl at its root, is refused', async () => {
    const cases = [
      ['a ../ member', { entries: { fgctl: 'bin', stray: 'x' }, transform: 's,^stray$,../stray,' }, /unsafe path/],
      ['an absolute member', { entries: { fgctl: 'bin', stray: 'x' }, transform: 's,^stray$,/tmp/stray,' }, /unsafe path/],
      ['fgctl only below a directory', { entries: { 'bin/fgctl': 'bin' } }, /fgctl/],
    ];
    for (const [label, options, pattern] of cases) {
      const made = mirror({ version: 'v0.2.0', ...options });
      await inSandbox(async ({ home, installDir }) => {
        const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
        assert.notEqual(res.status, 0, label);
        assert.match(res.stderr, pattern, label);
        assert.deepEqual(fs.readdirSync(installDir), [], label);
      });
    }
  });

  test('an archive holding a symlink beside a valid fgctl is refused', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-links-'));
    mirrors.push(dir);
    const name = `fgctl-v0.2.0-${target}.tar.gz`;
    const src = path.join(dir, 'src');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'fgctl'), '#!/bin/sh\n', { mode: 0o755 });
    fs.symlinkSync('/nonexistent-target', path.join(src, 'extra'));
    execFileSync('tar', ['-czf', path.join(dir, name), 'fgctl', 'extra'], { cwd: src });
    fs.writeFileSync(path.join(dir, 'SHA256SUMS'), `${sha256Of(path.join(dir, name))}  ${name}\n`);
    await inSandbox(async ({ home, installDir }) => {
      const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: `file://${dir}`, FGCTL_VERSION: 'v0.2.0' }));
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /link/i);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a download larger than its cap is refused and installs nothing', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      // SHA256SUMS larger than its own (1 MiB) cap.
      fs.writeFileSync(path.join(made.dir, 'SHA256SUMS'), 'x'.repeat(1024 * 1024 + 1));
      const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /larger than/);
      assert.deepEqual(fs.readdirSync(installDir), []);
    });
  });

  test('a candidate binary that does not run is never activated and the previous fgctl stays', async () => {
    const made = mirror({ version: 'v0.2.0', entries: { fgctl: '#!/bin/sh\n[ "$1" = "--version" ] && exit 3\necho new\n' } });
    await inSandbox(async ({ home, installDir }) => {
      fs.writeFileSync(path.join(installDir, 'fgctl'), '#!/bin/sh\necho previous\n', { mode: 0o755 });
      const res = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /does not run/);
      assert.equal(fs.readFileSync(path.join(installDir, 'fgctl'), 'utf8'), '#!/bin/sh\necho previous\n');
      assert.deepEqual(fs.readdirSync(installDir), ['fgctl'], 'no temp file left behind');
    });
  });

  test('the next steps are the three first-contact commands, with fgctl by absolute path when its directory is not on PATH', async () => {
    const made = mirror({ version: 'v0.2.0' });
    await inSandbox(async ({ home, installDir }) => {
      const off = await runSh(isolatedEnv(home, installDir, { FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
      assert.equal(off.status, 0, off.stderr);
      assert.match(off.stdout, /export PATH=/);
      assert.ok(off.stdout.includes(`${installDir}/fgctl init`), off.stdout);
      assert.match(off.stdout, /fgos run "<prompt>"/);
      fs.rmSync(path.join(installDir, 'fgctl'));
      const on = await runSh(isolatedEnv(home, installDir, { PATH: `${installDir}:${process.env.PATH}`, FGCTL_ASSET_BASE_URL: made.url, FGCTL_VERSION: 'v0.2.0' }));
      assert.equal(on.status, 0, on.stderr);
      assert.doesNotMatch(on.stdout, /export PATH=/);
      assert.match(on.stdout, /^\s+fgctl init$/m);
    });
  });
});
