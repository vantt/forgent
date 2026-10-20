// src/runner/execution/partial-writes.mjs -- did a seat of a writing unit change the worktree before
// it stopped?
//
// A seat that hit a provider limit half way may already have written, renamed or deleted files. Run
// again on top of that, a fresh worker meets half-done work it did not make. So before every attempt
// of a writing unit the runner records what the worktree looks like (HEAD and the content of every
// path git sees as changed), and after a provider limit it compares: any difference means the seat
// is not run again by itself.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**.

import path from 'node:path';
import { createGitInspect } from '../../git/inspect.mjs';
import { resolveStateRoot } from '../../holder-lock/index.mjs';

/** Typed snapshot translation; byte parsing and fingerprints belong to Git. */
export function worktreeSnapshot({ worktree, repoRoot, loaderOptions }) {
  const port = createGitInspect({ stateRoot: resolveStateRoot({ fgosDir: path.join(repoRoot, '.fgos') }).stateRoot,
    repoPath: worktree, trustedMain: repoRoot }, loaderOptions);
  const snapshot = port.snapshotWrites({ paths: [], maxBytes: Number.MAX_SAFE_INTEGER });
  const files = {};
  for (const entry of snapshot.files) {
    const p = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(entry.path));
    if (p === '.fgos' || p.startsWith('.fgos/')) continue;
    const f = entry.fingerprint;
    files[p] = f.kind === 'missing' ? null : f.kind === 'file' ? f.sha256
      : f.kind === 'link' ? `link:${Buffer.from(f.target).toString('utf8')}`
      : f.kind === 'type' ? `type:${f.mode}` : `unreadable:${f.size}:${f.mtime}`;
  }
  return { head: snapshot.head, files };
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
