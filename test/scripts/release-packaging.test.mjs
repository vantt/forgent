import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { assetName, checksumLines } from '../../scripts/package-release-assets.mjs';
import { RELEASE_TARGETS } from '../../src/util/release-targets.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflows = path.join(repoRoot, '.github', 'workflows');
// Line endings are normalized: a Windows checkout may convert them.
const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8').replace(/\r\n/g, '\n');

test('asset names follow <kind>-<tag>-<target>.tar.gz for every published target', () => {
  assert.equal(
    assetName('fgos', 'v0.2.0-rc.2', 'x86_64-pc-windows-msvc'),
    'fgos-v0.2.0-rc.2-x86_64-pc-windows-msvc.tar.gz',
  );
  assert.equal(
    assetName('fgctl', 'v0.2.0-rc.2', 'x86_64-unknown-linux-gnu'),
    'fgctl-v0.2.0-rc.2-x86_64-unknown-linux-gnu.tar.gz',
  );
  for (const { triple } of RELEASE_TARGETS) {
    assert.match(assetName('fgos', 'v1.0.0', triple), /^fgos-v1\.0\.0-[a-z0-9_]+-[a-z]+-[a-z]+(-[a-z]+)?\.tar\.gz$/);
  }
});

test('checksum lines are sha256sum-style, one per file, sorted by name', () => {
  const a = 'a'.repeat(64);
  const b = 'b'.repeat(64);
  assert.equal(
    checksumLines([
      { name: 'fgos-v1-t.tar.gz', sha256: b },
      { name: 'fgctl-v1-t.tar.gz', sha256: a },
    ]),
    `${a}  fgctl-v1-t.tar.gz\n${b}  fgos-v1-t.tar.gz\n`,
  );
});

test('release workflows: publishing lives only in release.yml under the tag trigger', () => {
  const release = read('.github', 'workflows', 'release.yml');
  assert.match(release, /tags:\s*\n\s*- "v\*"/);
  assert.match(release, /gh release create/);
  assert.match(release, /uses: \.\/\.github\/workflows\/release-assets\.yml/);

  for (const file of fs.readdirSync(workflows)) {
    if (file === 'release.yml') continue;
    const text = fs.readFileSync(path.join(workflows, file), 'utf8').replace(/\r\n/g, '\n');
    assert.doesNotMatch(text, /gh release (create|upload|edit)/, `${file} must not publish`);
    assert.doesNotMatch(text, /contents:\s*write/, `${file} must not hold write permission`);
    assert.doesNotMatch(text, /tags:/, `${file} must not run on tags`);
  }
});

test('release assets workflow builds Linux on ubuntu-22.04 and Windows on windows-latest, never newer Linux', () => {
  const assets = read('.github', 'workflows', 'release-assets.yml');
  assert.match(assets, /os: ubuntu-22\.04\n\s+target: x86_64-unknown-linux-gnu/);
  assert.match(assets, /os: windows-latest\n\s+target: x86_64-pc-windows-msvc/);
  assert.doesNotMatch(assets, /ubuntu-latest/);
  assert.match(assets, /scripts\/check-glibc-ceiling\.sh target\/release\/fgos target\/release\/fgctl/);
  assert.match(assets, /ci-external-consumer\.ps1/);
  const targetsInWorkflow = [...assets.matchAll(/target: ([a-z0-9_-]+)/g)].map((m) => m[1]).sort();
  assert.deepEqual(targetsInWorkflow, RELEASE_TARGETS.map((t) => t.triple).sort());
});

test('the branch check workflow runs the shared assets workflow on push and publishes nothing', () => {
  const check = read('.github', 'workflows', 'release-assets-check.yml');
  assert.match(check, /branches: \[feat\/windows-release\]/);
  assert.match(check, /uses: \.\/\.github\/workflows\/release-assets\.yml/);
});

test('glibc ceiling check passes at the ceiling and fails above it, per binary', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-glibc-ceiling-'));
  try {
    const binDir = path.join(dir, 'bin');
    fs.mkdirSync(binDir);
    // A stand-in objdump: prints the dynamic symbols recorded next to the "binary".
    fs.writeFileSync(
      path.join(binDir, 'objdump'),
      '#!/bin/sh\n[ "$1" = "-T" ] || exit 2\ncat "$2.symbols"\n',
      { mode: 0o755 },
    );
    const fixture = (name, symbols) => {
      const bin = path.join(dir, name);
      fs.writeFileSync(bin, 'binary');
      fs.writeFileSync(`${bin}.symbols`, symbols);
      return bin;
    };
    const ok = fixture('ok', '0 DF *UND* 0 (GLIBC_2.17) memcpy\n0 DF *UND* 0 (GLIBC_2.35) pthread_x\n0 DF *UND* 0 (GLIBC_2.2.5) read\n');
    const tooNew = fixture('too-new', '0 DF *UND* 0 (GLIBC_2.34) a\n0 DF *UND* 0 (GLIBC_2.39) b\n');
    const none = fixture('none', 'no versioned symbols here\n');
    const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH}` };
    const script = path.join(repoRoot, 'scripts', 'check-glibc-ceiling.sh');
    const run = (args, extra = {}) => spawnSync('sh', [script, ...args], { encoding: 'utf8', env: { ...env, ...extra } });

    const pass = run([ok, none]);
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /needs at most GLIBC_2\.35/);

    const fail = run([ok, tooNew]);
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /too-new needs GLIBC_2\.39, above the ceiling GLIBC_2\.35/);

    // 2.9 < 2.35 under a version sort, not a string sort.
    const versionSort = fixture('version-sort', '0 DF *UND* 0 (GLIBC_2.9) a\n');
    assert.equal(run([versionSort]).status, 0);
    // The ceiling is a parameter.
    assert.equal(run([tooNew], { GLIBC_CEILING: '2.39' }).status, 0);
    assert.equal(run([]).status, 1);
    assert.equal(run([path.join(dir, 'missing')]).status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
