// tsk-2gw: verifies the fix landed at `fgw/tsk-1wd` (commit ffd211a,
// docs/backlog.md row p-4b7dd2ed) still holds -- `docs/history/` must
// never be excluded from git, since `fgos-coding-exploring`'s own hard
// rule requires committing `CONTEXT.md` to the item's `fgw/<id>` branch,
// and an ignored path can never be committed there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function isIgnored(relPath) {
  try {
    execFileSync('git', ['check-ignore', '-q', relPath], { cwd: repoRoot });
    return true; // exit 0 -- the path IS ignored
  } catch (err) {
    if (err.status === 1) return false; // exit 1 -- the path is NOT ignored
    throw err; // any other exit code is a real error (e.g. bad git invocation)
  }
}

test('docs/history/ is never git-ignored -- CONTEXT.md must be committable to a fgw/<id> branch', () => {
  assert.equal(isIgnored('docs/history/some-feature/CONTEXT.md'), false);
  assert.equal(isIgnored('docs/history/some-feature/plan.md'), false);
  assert.equal(isIgnored('docs/history/some-feature/RESEARCH.md'), false);
});

test('docs/history/ itself (the directory) is never git-ignored', () => {
  assert.equal(isIgnored('docs/history/'), false);
});
