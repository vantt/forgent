import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { previousReleaseTag } from '../../scripts/previous-release-tag.mjs';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'previous-release-tag.mjs');

// Every tag this repository carries, release and not.
const REPO_TAGS = [
  'archive/doc-260925-citations',
  'documentation-authority-phase-00-20260925',
  'documentation-authority-phase-04-20261007',
  'pre-tsk-3ce',
  'v0.1.0',
  'v0.2.0-rc.1',
  'v0.2.0-rc.2',
  'v0.2.0-rc.3',
  'v0.2.0-rc.4',
  'v0.2.0-rc.5',
];

test('the previous release of the current tree is v0.2.0-rc.5, whatever the non-release tags are', () => {
  assert.equal(previousReleaseTag(REPO_TAGS, 'v0.2.0-assets-check'), 'v0.2.0-rc.5');
  assert.equal(previousReleaseTag([...REPO_TAGS].reverse(), 'v0.2.0'), 'v0.2.0-rc.5');
  assert.equal(previousReleaseTag(REPO_TAGS, 'v0.2.0-rc.6'), 'v0.2.0-rc.5');
});

test('a release published later than the candidate is never its previous release', () => {
  // A hotfix of an older line cut after v0.2.0, and a newer version, both published.
  const published = ['v0.1.0', 'v0.1.5', 'v0.2.0', 'v0.3.0'];
  assert.equal(previousReleaseTag(published, 'v0.2.0'), 'v0.1.5');
  assert.equal(previousReleaseTag([...REPO_TAGS, 'v0.3.0', 'v0.2.1'], 'v0.2.0-assets-check'), 'v0.2.0-rc.5');
  assert.equal(previousReleaseTag([...REPO_TAGS, 'v0.3.0'], 'v0.2.0-rc.3'), 'v0.2.0-rc.2');
  assert.equal(previousReleaseTag(['v0.3.0'], 'v0.2.0'), null);
});

test('a candidate that is not a release version is refused', () => {
  assert.throws(() => previousReleaseTag(REPO_TAGS, 'main'), /semver/);
  assert.throws(() => previousReleaseTag(REPO_TAGS, ''), /semver/);
});

test('the candidate itself is never its own previous release', () => {
  assert.equal(previousReleaseTag([...REPO_TAGS, 'v0.2.0-rc.6'], 'v0.2.0-rc.6'), 'v0.2.0-rc.5');
});

test('release precedence follows semver: numeric fields numerically, a release above its prereleases', () => {
  const tags = ['v0.2.0-rc.9', 'v0.2.0-rc.10', 'v0.2.0', 'v0.1.9', 'v0.2.0-beta.1'];
  assert.equal(previousReleaseTag(tags, 'v0.3.0'), 'v0.2.0');
  assert.equal(previousReleaseTag(tags.filter((t) => t !== 'v0.2.0'), 'v0.3.0'), 'v0.2.0-rc.10');
  assert.equal(previousReleaseTag(['v0.2.0-beta.1', 'v0.2.0-rc.1'], 'v0.3.0'), 'v0.2.0-rc.1');
  assert.equal(previousReleaseTag(['v0.2.0-rc.1', 'v0.2.0-rc.1.1'], 'v0.3.0'), 'v0.2.0-rc.1.1');
});

test('a list with no release tag other than the candidate has no previous release', () => {
  assert.equal(previousReleaseTag(['archive/x', 'pre-tsk-3ce', 'v0.2.0'], 'v0.2.0'), null);
  assert.equal(previousReleaseTag([], 'v0.2.0'), null);
});

// A stand-in `gh` that prints the release list it is given, or fails.
function runCli(args, ghBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-prev-tag-'));
  try {
    fs.writeFileSync(path.join(dir, 'gh'), `#!/bin/sh\n${ghBody}\n`, { mode: 0o755 });
    return spawnSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}` },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the command prints the previous tag; exit 3 means no earlier release; a failing gh is exit 1, never a skip', { skip: process.platform === 'win32' }, () => {
  const listed = runCli(['--candidate', 'v0.2.0-assets-check', '--repo', 'o/r'], 'printf "v0.1.0\\nv0.2.0-rc.5\\nv0.2.0-rc.4\\n"');
  assert.equal(listed.status, 0, listed.stderr);
  assert.equal(listed.stdout, 'v0.2.0-rc.5\n');

  const first = runCli(['--candidate', 'v0.1.0'], 'printf "v0.1.0\\n"');
  assert.equal(first.status, 3);
  assert.match(first.stderr, /No release earlier than v0\.1\.0/);

  const broken = runCli(['--candidate', 'v0.2.0'], 'echo "HTTP 401" >&2; exit 1');
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /Cannot list the published releases.*HTTP 401/);

  assert.equal(runCli([], 'true').status, 1);
  const refused = runCli(['--candidate', 'not-a-version'], 'printf "v0.2.0\\n"');
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /semver/);
});
