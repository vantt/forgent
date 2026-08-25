// test/state/fgos-logs-bucket.test.mjs — phase-01,
// plans/260825-0842-fgos-logs-dir-bucketing: 5 diagnostic/telemetry jsonl
// files (approve-post-success-faults.jsonl, main-checkout-guard-warnings.jsonl,
// changelog-nag-history.jsonl, entropy-history.jsonl, invocation-faults.jsonl)
// moved from `.fgos/` root into the already-gitignored `.fgos/logs/` bucket
// (D4, worker-dispatch-log) -- none of these is the event log D1 protects;
// each was git-tracked at root only by omission, causing `git status` to
// stay dirty on nearly every command. Proves the retirement is real, same
// pattern as events-legacy-absence.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const MOVED_BASENAMES = [
  'approve-post-success-faults.jsonl',
  'main-checkout-guard-warnings.jsonl',
  'changelog-nag-history.jsonl',
  'entropy-history.jsonl',
  'invocation-faults.jsonl',
];

for (const basename of MOVED_BASENAMES) {
  test(`.fgos/${basename} is no longer git-tracked at the old root path`, () => {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', `.fgos/${basename}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0, `.fgos/${basename} must not still be tracked at the pre-migration path`);
  });

  test(`.fgos/logs/${basename} is gitignored`, () => {
    const result = spawnSync('git', ['check-ignore', `.fgos/logs/${basename}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `.fgos/logs/${basename} must be covered by the .fgos/logs/ gitignore rule`);
  });
}

test('.gitattributes no longer declares merge=union for the 5 moved diagnostic logs', () => {
  const raw = fs.readFileSync(path.join(REPO_ROOT, '.gitattributes'), 'utf8');
  for (const basename of MOVED_BASENAMES) {
    assert.doesNotMatch(
      raw,
      new RegExp(`\\.fgos/${basename.replace(/\./g, '\\.')}\\s+merge=union`),
      `merge=union for .fgos/${basename} must be gone -- the file is gitignored now, git merge never sees it`,
    );
  }
});
