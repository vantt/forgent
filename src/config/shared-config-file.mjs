// shared-config-file.mjs -- the shared project config file (`.fgos/config.json`,
// tsk-2ta D1 amended / tsk-5vf D1): one JSON file, one top-level section per
// module (each module's own `registerConfigDefault` `key`, tsk-2cs D3/D6).
// Falls back to reading the legacy `.fgos-runner.json` -- wrapped as the
// `runner` section -- when the new file does not exist yet. `fgos setup` is
// what performs the real move/write (D2); this module never writes on its
// own from a read (RUL9's doctor-never-writes discipline, extended here to
// every read-only caller of this module).
//
// Same resolution model `.fgos-runner.json` always used: `dir` is whatever
// project root the caller already resolved (repoRoot for the runner path,
// cwd for doctor checks) -- no extra main-checkout indirection. Unlike
// `.fgos/state.json`/`events.jsonl`, this file is NOT in `.gitignore` (same
// as `.fgos-runner.json` today), so it is a normal git-tracked file: every
// worktree checkout carries its own copy via ordinary `git checkout`, the
// same way `.fgos-runner.json` always has.

import fs from 'node:fs';
import path from 'node:path';

export function sharedConfigFilePath(dir) {
  return path.join(dir, '.fgos', 'config.json');
}

export function legacyRunnerConfigPath(dir) {
  return path.join(dir, '.fgos-runner.json');
}

/**
 * Read the shared config file at `dir`. Falls back to the legacy
 * `.fgos-runner.json`, wrapped as `{ runner: <parsed content> }`, when the
 * shared file doesn't exist yet -- never deletes or rewrites the old file.
 * Returns `{}` when neither exists. Invalid JSON in whichever file is
 * actually read throws, matching `loadGlobalConfig`'s existing discipline.
 */
export function readSharedConfig(dir) {
  const sharedPath = sharedConfigFilePath(dir);
  if (fs.existsSync(sharedPath)) {
    const raw = fs.readFileSync(sharedPath, 'utf8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`cannot parse shared config at "${sharedPath}": ${err.message}`);
    }
  }
  const legacyPath = legacyRunnerConfigPath(dir);
  if (fs.existsSync(legacyPath)) {
    const raw = fs.readFileSync(legacyPath, 'utf8');
    try {
      return { runner: JSON.parse(raw) };
    } catch (err) {
      throw new Error(`cannot parse legacy runner config at "${legacyPath}": ${err.message}`);
    }
  }
  return {};
}

/**
 * Write `config` to the shared config file at `dir`, creating `.fgos/` if
 * needed. The only write path in this module -- callers decide WHEN to
 * write (`fgos setup`'s bootstrap, or the runner's own first-run default),
 * never triggered implicitly by a read.
 */
export function writeSharedConfig(dir, config) {
  const sharedPath = sharedConfigFilePath(dir);
  fs.mkdirSync(path.dirname(sharedPath), { recursive: true });
  fs.writeFileSync(sharedPath, `${JSON.stringify(config, null, 2)}\n`);
}
