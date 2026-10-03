// commit-unit-work.mjs — the runner commits a producer's work, the producer never does.
//
// A confined producer can write files in its Unit worktree and its outbox, and
// nothing under git's metadata (its own gitdir and the shared common dir are
// read-only): a worker able to write there could move any branch ref or
// overwrite objects of the whole repository. So after a producer round passes,
// this trusted code, running outside the confinement, stages and commits what
// the worker left in the worktree.

import { execFileSync } from 'node:child_process';

function git(cwd, args, env) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function hasConfigured(cwd, key) {
  try {
    return git(cwd, ['config', '--get', key]).trim() !== '';
  } catch {
    return false;
  }
}

/** First non-empty line of the agent's own summary, bounded: a commit subject, not a report. */
function subjectFrom(summary, unitId) {
  const line = String(summary ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? '';
  const subject = line.length > 100 ? `${line.slice(0, 97)}...` : line;
  return subject || `unit ${unitId}: producer changes`;
}

/**
 * Stage and commit everything the producer left in `worktree`.
 *
 * `.fgos/` is never staged: fgOS state is written through its own door and a
 * worker branch must not carry it.
 *
 * @returns {{ status: 'committed', sha: string, subject: string, files: string[] }
 *   | { status: 'no-changes' }
 *   | { status: 'failed', error: string }}
 */
export function commitUnitWork({ worktree, unitId, summary }) {
  try {
    git(worktree, ['add', '-A', '--', '.', ':(exclude).fgos']);
    const staged = git(worktree, ['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
    if (staged.length === 0) return { status: 'no-changes' };

    const subject = subjectFrom(summary, unitId);
    // Use the repository's own identity; only fill the gap when it has none.
    const identity = {};
    if (!hasConfigured(worktree, 'user.name')) {
      identity.GIT_AUTHOR_NAME = identity.GIT_COMMITTER_NAME = 'fgOS runner';
    }
    if (!hasConfigured(worktree, 'user.email')) {
      identity.GIT_AUTHOR_EMAIL = identity.GIT_COMMITTER_EMAIL = 'runner@fgos.local';
    }
    git(worktree, ['commit', '-q', '-m', subject], identity);
    const sha = git(worktree, ['rev-parse', 'HEAD']).trim();
    return { status: 'committed', sha, subject, files: staged };
  } catch (err) {
    const detail = err.stderr ? String(err.stderr).trim() : err.message;
    return { status: 'failed', error: detail };
  }
}
