// shared-config-file.mjs -- the shared project config file (`.fgos/config.json`,
// tsk-2ta D1 amended / tsk-5vf D1): one JSON file, one top-level section per
// module (each module's own `registerConfigDefault` `key`, tsk-2cs D3/D6).
// The legacy runner config file was retired (tsk-5hv D1) -- this is now
// the sole config source, no fallback. `fgos setup` is what performs the real
// write (D2); this module never writes on its own from a read (RUL9's
// doctor-never-writes discipline, extended here to every read-only caller
// of this module).
//
// `dir` is whatever project root the caller already resolved (repoRoot for
// the runner path, cwd for doctor checks) -- no extra main-checkout
// indirection. This file is NOT in `.gitignore`, so it is a normal
// git-tracked file: every worktree checkout carries its own copy via
// ordinary `git checkout`.

import fs from 'node:fs';
import path from 'node:path';

export function sharedConfigFilePath(dir) {
  return path.join(dir, '.fgos', 'config.json');
}

/**
 * Read the shared config file at `dir`. Returns `{}` when it doesn't
 * exist. Invalid JSON throws, matching `loadGlobalConfig`'s existing
 * discipline.
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
  return {};
}

// The repo-invariant check commands: deterministic, pure-read checks whose
// pass/fail never depends on which item is being worked. They run alongside
// an item's own `verify` at `return` and post-merge, so a repo-wide
// invariant broken by item A cannot land on main unnoticed and stay red
// across later merges (docs/history/tsk-516-approve-reverify-scope/
// CONTEXT.md D2/D3/D4).
//
// Declared here, in the config layer, rather than hardcoded in the runner:
// fgOS is a platform, and a project using it has its own invariant command,
// not this repo's test layout (D6). This constant is only the default that
// `fgos setup` writes -- the runner reads whatever the project's own config
// actually says, and an absent section means no invariant check runs at all,
// leaving behavior identical to before this existed.
//
// Lives in this domain-layer module (not next to its `registerConfigDefault`
// call in the use-case layer) so both the use-case registration and the
// infra-layer runner import it DOWNWARD -- an infra->use-case import would
// break the one-way-down rule test/architecture.test.mjs enforces, which is
// the very invariant this feature exists to protect.
export const DEFAULT_INVARIANT_CHECK_COMMANDS = ['node --test test/architecture.test.mjs'];

/**
 * The invariant-check commands configured at `dir`, as a list of real
 * command strings. Returns `[]` for every shape that isn't a genuine list
 * of non-empty strings -- an absent section, a malformed one, or a list
 * with nothing runnable in it. Never falls back to
 * `DEFAULT_INVARIANT_CHECK_COMMANDS`: that default belongs to what `fgos
 * setup` WRITES, never to what a reader silently assumes -- otherwise a
 * project that deliberately configured no invariant checks would still get
 * this repo's own test command imposed on it.
 */
export function readInvariantCheckCommands(dir) {
  const section = readSharedConfig(dir).invariantChecks;
  if (!section || typeof section !== 'object' || Array.isArray(section)) return [];
  if (!Array.isArray(section.commands)) return [];
  return section.commands.filter((command) => typeof command === 'string' && command.trim() !== '');
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

/**
 * `readSharedConfig` that degrades to `{}` instead of throwing on a file that
 * is present but not valid JSON.
 *
 * The shared config is explicitly an edit-the-file-by-hand surface, so a
 * half-typed edit is an ordinary state, not an exceptional one. A reader that
 * only wants one optional setting should behave the way it behaves when the
 * setting is absent — `readGateBypassLevel` has wrapped this call in exactly
 * this try/catch since it was written, for exactly this reason.
 *
 * Use this for an OPTIONAL setting whose absence is already meaningful. Do NOT
 * use it where the caller's whole job is to report on the file's health:
 * `fgos doctor`'s own checks must see the parse failure, not a tidy empty
 * object, or the one command that exists to name the problem would hide it.
 */
export function readSharedConfigOrEmpty(dir) {
  try {
    return readSharedConfig(dir);
  } catch {
    return {};
  }
}
