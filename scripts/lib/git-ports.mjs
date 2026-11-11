// git-ports.mjs -- the one way an outer script reaches the repository it runs on (Git spec §13: outer
// scripts read through Inspect and write through the typed ports, never a `git` child of their own).
//
// Under a host (`fgos`, `npm run fgos:dev`, the test launcher) the payload's own addon loads. A script
// run as plain `node scripts/<name>.mjs` from a source checkout has no activated payload, so it stages
// this checkout's addon the same way the test launcher does before it opens the port.

import crypto from 'node:crypto';
import fs from 'node:fs';
import { createGitInspect, gitPortOptions } from '../../src/git/inspect.mjs';
import { createGitScopedCommit } from '../../src/git/scoped-commit.mjs';
import { createGitWorktree } from '../../src/git/worktree.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { ensureGitAddon } from '../git-addon.mjs';
import { repositoryDirs, repositoryFiles } from './git-dir-layout.mjs';

/** Makes the Git addon loadable for this process: the host's payload when one runs us, else this checkout's staged copy. */
export function ensureScriptAddon(env = process.env) {
  try {
    loadNativeAddon();
  } catch (err) {
    if (err.code !== 'git-addon-not-shipped') throw err;
    ensureGitAddon(env);
  }
}

function openPort(open, env) {
  ensureScriptAddon(env);
  return open();
}

export function inspectRepo(cwd = process.cwd(), env = process.env) {
  return openPort(() => createGitInspect(gitPortOptions(cwd)), env);
}

/** Tracked and untracked non-ignored paths under `root`, relative to it; null outside a repository.
 * A guard that judges only what the repository owns keeps the files in this set. */
export function ownedFileSet(root, env = process.env) {
  return repositoryDirs(root) ? repositoryFiles(root, inspectRepo(root, env)) : null;
}

/** ScopedCommit on the checkout at `cwd`, as the resolved session writer. */
export function scopedCommitRepo(cwd = process.cwd(), env = process.env) {
  return openPort(() => createGitScopedCommit(gitPortOptions(cwd, { mutation: true })), env);
}

/**
 * Remove the registration of every listed linked checkout whose directory is gone, through the Worktree
 * port's prune: it removes only a registration the Git component itself created, and refuses anything
 * else with a cause. A checkout that still exists is left alone. Returns each entry with `removed` and,
 * when it stayed, `reason`; never throws, so a cleanup path reports instead of failing.
 */
export function pruneMissingCheckouts(cwd, registrations, { env = process.env, prune } = {}) {
  const pruneOne = prune ?? ((checkout) => openPort(() => {
    const options = gitPortOptions(cwd, { mutation: true });
    createGitWorktree({ ...options, repoPath: options.trustedMain }).prune({ path: checkout, operationId: crypto.randomUUID() });
  }, env));
  return registrations.map((entry) => {
    if (fs.existsSync(entry.checkout)) return { ...entry, removed: false, reason: 'checkout-present' };
    try {
      pruneOne(entry.checkout);
      return { ...entry, removed: true };
    } catch (err) {
      return { ...entry, removed: false, reason: err.code ?? err.message };
    }
  });
}

/** The main checkout's root, from whichever checkout of the repository `cwd` sits in. */
export function mainCheckoutRoot(cwd = process.cwd()) {
  return inspectRepo(cwd).resolveRepo().trustedMainRoot;
}

/** Every `status` entry, all pages, with `path` decoded to a string. */
export function statusEntries(port, untracked = 'all') {
  const entries = [];
  let cursor;
  do {
    const page = port.status({ untracked, maxEntries: 4096, cursor });
    entries.push(...page.entries.map(e => ({ ...e, path: Buffer.from(e.path).toString('utf8') })));
    cursor = page.nextCursor;
  } while (cursor);
  return entries;
}
