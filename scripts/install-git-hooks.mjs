#!/usr/bin/env node
// install-git-hooks.mjs -- wires this repo's .githooks/pre-commit hook (D2,
// str65-worktree-isolation-enforcement) into a fresh dev clone automatically,
// via package.json's `prepare` lifecycle script. When this checkout has no
// `.git` entry (installed as a dependency, e.g. `npm install <github-url>`,
// per docs/specs/distribution.md -- no .git is retained in that case), it
// no-ops silently: never throws, never fails the install.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Sets core.hooksPath to .githooks for the given repo root, if (and only
 * if) a `.git` entry exists there (a directory for a plain clone, a file
 * for a linked worktree -- existsSync is true for both). Idempotent: safe
 * to run repeatedly (e.g. every `npm install`/`npm pack`).
 */
export function installGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return;
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: repoRoot });
}

function runCli() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  installGitHooks(repoRoot);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
