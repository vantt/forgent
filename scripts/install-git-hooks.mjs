#!/usr/bin/env node
// install-git-hooks.mjs -- the `npm run setup:hooks` CLI entry point, wiring
// this repo's .githooks/pre-commit hook into a fresh dev clone. Thin shim:
// the real logic lives in src/setup/git-hooks.mjs (that layer ships with the
// npm package per package.json's "files"; scripts/ does not, and
// docs/architecture-manifest.json's import-direction check only tracks
// src/bin -- bin/fgos.mjs's own `fgos setup` wiring imports the same
// src/setup/git-hooks.mjs directly, never this file, per that same rule).
// Re-exported here so this script's own CLI form and `npm run setup:hooks`
// keep working unchanged.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installGitHooks } from '../src/setup/git-hooks.mjs';
import { nativeError } from '../src/git/native.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

export { installGitHooks } from '../src/setup/git-hooks.mjs';

function runCli() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  try {
    installGitHooks(repoRoot);
  } catch (error) {
    // A RepositoryConfig refusal is a typed report (code + cause), not a crash:
    // name it and fail; anything else is a real bug and keeps its stack.
    const report = nativeError(error);
    if (typeof report.code !== 'string') throw error;
    process.stderr.write(`install-git-hooks: Git RepositoryConfig refused to wire core.hooksPath in ${repoRoot}: ${report.cause ?? report.code} (${report.code})\n`);
    process.exitCode = 1;
  }
}

if (isMainModule(import.meta.url)) {
  runCli();
}
