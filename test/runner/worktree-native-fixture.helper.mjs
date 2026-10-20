import '../helpers/process-tmp-root.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
// Real activation fence used by the native mutation ports. No Git behavior is mocked.
export function activateGitFixture(repo) {
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
}

// Fixture teardown intentionally discards test data after the behavioral assertions.
export function discardFixtureWorktree(repo, worktree) {
  execFileSync('git', ['worktree', 'remove', '--force', worktree], { cwd: repo, stdio: 'pipe' });
}
