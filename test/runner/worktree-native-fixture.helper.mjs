import '../helpers/process-tmp-root.mjs';
import { execFileSync } from 'node:child_process';
// Real activation fence used by the native mutation ports. No Git behavior is mocked.
export { activateGitFixture } from '../helpers/git-fixture.mjs';

// Fixture teardown intentionally discards test data after the behavioral assertions.
export function discardFixtureWorktree(repo, worktree) {
  execFileSync('git', ['worktree', 'remove', '--force', worktree], { cwd: repo, stdio: 'pipe' });
}
