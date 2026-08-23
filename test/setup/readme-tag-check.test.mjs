// readme-tag-check.test.mjs -- tsk-2t8: README.md's own "## Install"
// section recommends a specific pinned git tag; if that tag was never
// actually cut, the recommended install command fails for every new
// external user. `readme-install-tag-exists` (src/setup/registrations.mjs)
// is the doctor check that surfaces this instead of letting it regress
// silently.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { checkById, initRepo, mkTemp } from './helpers/setup-checks-harness.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function writeReadme(dir, body) {
  fs.writeFileSync(path.join(dir, 'README.md'), body);
}

test('readme-install-tag-exists passes when README.md does not exist', () => {
  const tmp = mkTemp('fgos-readme-tag-');
  const { passed, message } = checkById('readme-install-tag-exists').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /not found/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('readme-install-tag-exists passes when README.md has no pinned-tag install line', () => {
  const tmp = mkTemp('fgos-readme-tag-');
  writeReadme(tmp, '# my project\n\nnpm install -g my-project\n');
  const { passed, message } = checkById('readme-install-tag-exists').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /no pinned-tag/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('readme-install-tag-exists fails when the pinned tag is not a real git tag', () => {
  const tmp = initRepo('fgos-readme-tag-missing-');
  writeReadme(tmp, '# my project\n\n```bash\nnpm install -g github:owner/repo#v9.9.9\n```\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp });
  execFileSync('git', ['commit', '-qm', 'add readme'], { cwd: tmp });
  const { passed, message } = checkById('readme-install-tag-exists').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /"v9\.9\.9"/);
  assert.match(message, /does not exist/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('readme-install-tag-exists passes when the pinned tag is a real git tag', () => {
  const tmp = initRepo('fgos-readme-tag-real-');
  writeReadme(tmp, '# my project\n\n```bash\nnpm install -g github:owner/repo#v1.2.3\n```\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp });
  execFileSync('git', ['commit', '-qm', 'add readme'], { cwd: tmp });
  execFileSync('git', ['tag', 'v1.2.3'], { cwd: tmp });
  const { passed, message } = checkById('readme-install-tag-exists').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /"v1\.2\.3" exists/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('readme-install-tag-exists against this real repo: reports the actual current state honestly', () => {
  // Proof, not assertion either way -- this repo's own README currently
  // pins v0.1.0, and only `pre-tsk-3ce` exists as a real tag (tsk-2t8's
  // own filed evidence). Assert on whichever the real state is, from the
  // real git tag list, rather than hardcoding an expectation that would
  // silently go stale the day someone actually cuts v0.1.0.
  const pinnedTag = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8').match(/#v(\d+\.\d+\.\d+)/);
  assert.ok(pinnedTag, 'README.md must still have a pinned-tag install line for this test to mean anything');
  const realTagExists = execFileSync('git', ['tag', '-l', `v${pinnedTag[1]}`], { cwd: REPO_ROOT, encoding: 'utf8' }).trim() === `v${pinnedTag[1]}`;
  const { passed } = checkById('readme-install-tag-exists').check(REPO_ROOT);
  assert.equal(passed, realTagExists, 'the check must agree with a direct git tag -l lookup against the real repo');
});
