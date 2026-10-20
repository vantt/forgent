// version.mjs — resolves the running fgOS build's own package version, git
// commit, and dispatched verb set. Shared by the `fgos version` verb
// (bin/fgos.mjs) and the `cli-version-visible` doctor check
// (src/setup/registrations.mjs) so neither can drift from the other
// (tsk-2ej: closes the friction of having no hook-safe, scriptable way to
// tell an old globally-installed build from a current checkout).
//
// Pure data resolution only — this module never imports verb logic, only
// reads its own package.json and asks Git Inspect for its own commit.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { COMMAND_REGISTRY } from './command-registry.mjs';

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
  const verbs = COMMAND_REGISTRY.map((entry) => entry.name).sort();
  return { packageVersion, gitCommit, verbs };
}
