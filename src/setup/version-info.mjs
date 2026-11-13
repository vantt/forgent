// version-info.mjs — resolves the running fgOS build's own package version and git commit for the
// `cli-version-visible` doctor check. The `fgos version` verb is native (the host answers it, verb
// list included), so this module knows nothing of verbs: it only reads its own package.json and
// asks Git Inspect for its own commit.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function resolveCliVersionInfo({ packageRoot = PACKAGE_ROOT } = {}) {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageVersion = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  let gitCommit = null;
  try {
    // The first 12 hex digits of the full commit id; never Git's own
    // abbreviation, whose length depends on the repository.
    const head = createGitInspect(gitPortOptions(packageRoot)).resolveCommit({ name: 'HEAD' });
    if (typeof head === 'string') gitCommit = head.slice(0, 12);
  } catch {
    // Not a git checkout (a real npm/tarball install has no .git) -- no
    // commit to report, never thrown as an error.
  }
  return { packageVersion, gitCommit };
}
