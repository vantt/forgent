// test/helpers/git-fixture.mjs — the one fixture Git repository the CLI, e2e and runner tests build on
//
// Fixture setup only: the native mutation ports require an activated checkout, so a fixture writes the
// real activation fence production's activation leaves behind. No Git behaviour is mocked, and the
// fence stays mandatory in production.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function activateGitFixture(repo) {
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
}

/** A fresh repository at `dir` with one seed commit, the store's local paths
 * ignored the way this repository ignores them (or as `ignore` says), and the
 * activation fence. */
export function initFixtureRepo(dir, { branch, message = 'seed', ignore = '.fgos/cache/\n.fgos/runtime/\n.fgos/locks/\n' } = {}) {
  execFileSync('git', ['init', '-q', ...(branch ? ['-b', branch] : [])], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, '.gitignore'), ignore);
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', message], { cwd: dir });
  activateGitFixture(dir);
  return dir;
}
