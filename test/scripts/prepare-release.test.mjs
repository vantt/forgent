import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseReleaseVersion,
  updateChangelogText,
  updatePackageJsonText,
  updatePackageLockText,
  prepareRelease,
} from '../../scripts/prepare-release.mjs';

function tmpRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prepare-release-'));
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({ name: 'forgent', version: '0.1.0' }, null, 2)}\n`);
  fs.writeFileSync(
    path.join(root, 'package-lock.json'),
    `${JSON.stringify({ name: 'forgent', version: '0.1.0', packages: { '': { name: 'forgent', version: '0.1.0' } } }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(root, 'CHANGELOG.md'),
    '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- Something new.\n\n## [v0.1.0] - 2026-01-01\n\n### Added\n\n- Bootstrap.\n',
  );
  return root;
}

test('parseReleaseVersion normalizes tags and prerelease tags', () => {
  assert.deepEqual(parseReleaseVersion('0.2.0'), { baseVersion: '0.2.0', prerelease: '', tag: 'v0.2.0' });
  assert.deepEqual(parseReleaseVersion('v0.2.0-preview.1'), {
    baseVersion: '0.2.0',
    prerelease: 'preview.1',
    tag: 'v0.2.0-preview.1',
  });
  assert.throws(() => parseReleaseVersion('0.2'), /semver/);
  assert.throws(() => parseReleaseVersion('01.2.3'), /semver/);
});

test('package and lockfile version updates keep the npm package on the tag base version', () => {
  assert.match(updatePackageJsonText('{"name":"forgent","version":"0.1.0"}\n', '0.2.0'), /"version": "0.2.0"/);
  const lock = JSON.parse(
    updatePackageLockText('{"name":"forgent","version":"0.1.0","packages":{"":{"version":"0.1.0"}}}\n', '0.2.0'),
  );
  assert.equal(lock.version, '0.2.0');
  assert.equal(lock.packages[''].version, '0.2.0');
});

test('updateChangelogText moves Unreleased entries under the release heading', () => {
  const next = updateChangelogText(
    '# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- Bug.\n\n## [v0.1.0] - 2026-01-01\n\n### Added\n\n- Bootstrap.\n',
    'v0.2.0',
    '2026-09-18',
  );
  assert.match(next, /## \[Unreleased\]\n\n## \[v0\.2\.0\] - 2026-09-18\n\n### Fixed\n\n- Bug\./);
  assert.match(next, /## \[v0\.1\.0\] - 2026-01-01/);
});

test('prepareRelease writes package files and changelog, but never tags', () => {
  const root = tmpRepo();
  const result = prepareRelease({
    repoRoot: root,
    version: 'v0.2.0-preview.1',
    date: '2026-09-18',
    skipCleanCheck: true,
  });

  assert.equal(result.tag, 'v0.2.0-preview.1');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version, '0.2.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages[''].version, '0.2.0');
  assert.match(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), /## \[v0\.2\.0-preview\.1\] - 2026-09-18/);
  assert.deepEqual(result.nextCommands, [
    'git add package.json package-lock.json CHANGELOG.md',
    'git commit -m "chore: prepare v0.2.0-preview.1"',
    'git tag v0.2.0-preview.1',
    'git push origin HEAD v0.2.0-preview.1',
  ]);
});

test('prepareRelease dry-run validates and reports files without writing them', () => {
  const root = tmpRepo();
  const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  const result = prepareRelease({
    repoRoot: root,
    version: 'v0.2.0',
    date: '2026-09-18',
    skipCleanCheck: true,
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.deepEqual(result.changedFiles, ['package.json', 'package-lock.json', 'CHANGELOG.md']);
  assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), before);
});
