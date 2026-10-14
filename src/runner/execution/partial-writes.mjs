// src/runner/execution/partial-writes.mjs -- did a seat of a writing unit change the worktree before
// it stopped?
//
// A seat that hit a provider limit half way may already have written, renamed or deleted files. Run
// again on top of that, a fresh worker meets half-done work it did not make. So before every attempt
// of a writing unit the runner records what the worktree looks like (HEAD and the content of every
// path git sees as changed), and after a provider limit it compares: any difference means the seat
// is not run again by itself.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { changedPaths, gitContext } from './commit-unit-work.mjs';

const inStore = (p) => p === '.fgos' || p.startsWith('.fgos/');

/** A path's content: its sha256, `link:<target>` for a symlink, or null when it does not exist. */
function contentOf(file) {
  let stat;
  try { stat = fs.lstatSync(file); } catch { return null; }
  if (stat.isSymbolicLink()) return `link:${fs.readlinkSync(file)}`;
  if (!stat.isFile()) return `type:${stat.mode & fs.constants.S_IFMT}`;
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * What the worktree holds now: HEAD and the content of every changed path (staged, unstaged and
 * untracked, a rename as its two halves). Paths git ignores are not seen.
 *
 * @returns {{ head: string|null, files: Record<string, string|null> }}
 */
export function worktreeSnapshot({ worktree, repoRoot }) {
  const ctx = gitContext({ worktree, repoRoot });
  let head = null;
  try {
    head = execFileSync('git', [...ctx.prefix, 'rev-parse', '--verify', '-q', 'HEAD'], { cwd: ctx.cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch { /* an unborn branch has no HEAD */ }
  const files = {};
  for (const p of changedPaths(ctx).filter((p) => !inStore(p)).sort()) files[p] = contentOf(path.join(ctx.cwd, p));
  return { head, files };
}

/**
 * The paths whose content differs between `before` and now, and whether HEAD moved.
 *
 * @returns {{ paths: string[], headMoved: boolean }}
 */
export function writesSince(before, { worktree, repoRoot }) {
  const now = worktreeSnapshot({ worktree, repoRoot });
  const all = new Set([...Object.keys(before.files ?? {}), ...Object.keys(now.files)]);
  const paths = [...all].filter((p) => (before.files?.[p] ?? null) !== (now.files[p] ?? null)
    // A path dirty in only one snapshot changed even when its content reads the same (a file put
    // back, or one that became clean again by a commit the worker made).
    || Object.hasOwn(before.files ?? {}, p) !== Object.hasOwn(now.files, p)).sort();
  return { paths, headMoved: (before.head ?? null) !== now.head };
}
