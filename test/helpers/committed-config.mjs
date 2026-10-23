import './process-tmp-root.mjs';
// The repository's own committed .fgos/config.json, read from git and never off the working tree:
// a worker worktree carries no .fgos/ at all, and a working-tree read would pass on an uncommitted
// edit the repository's history does not have.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeRawProjectConfig } from './config-fixture.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let text = null;
const committedConfigText = () => (text ??= execFileSync('git', ['show', 'HEAD:.fgos/config.json'], { cwd: REPO_ROOT, encoding: 'utf8' }));

/** The committed config's `runner` section, parsed as written (no global overlay, no defaults). */
export function committedRunnerConfig() {
  return JSON.parse(committedConfigText()).runner;
}

/** A project directory holding only the committed config, for tests that read it through the config loader. */
export function committedConfigDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-committed-config-'));
  writeRawProjectConfig(dir, committedConfigText());
  return dir;
}
