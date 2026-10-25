import './process-tmp-root.mjs';
// The repository's own committed config, read from git and never off the working tree:
// a worker worktree carries no .fgos/ at all, and a working-tree read would pass on an uncommitted
// edit the repository's history does not have. The committed file holds only what this repository
// changes from the standard, so its effective value is read through the config door over a copy.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../src/config/facade.mjs';
import { writeRawProjectConfig } from './config-fixture.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let text = null;
const committedConfigText = () => (text ??= execFileSync('git', ['show', 'HEAD:.fgos/config.yaml'], { cwd: REPO_ROOT, encoding: 'utf8' }));

/** A project directory holding the committed config file, for tests that read it through the runner loader. */
export function committedConfigDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-committed-config-'));
  writeRawProjectConfig(dir, committedConfigText());
  return dir;
}

let runner = null;
/** The committed config's effective `runner` section: the standard under the committed file, no machine's global file. */
export function committedRunnerConfig() {
  if (!runner) {
    const dir = committedConfigDir();
    runner = readConfig({ projectRoot: dir, globalDir: path.join(dir, 'no-global'), sections: ['runner'] }).value.runner;
  }
  return structuredClone(runner);
}
