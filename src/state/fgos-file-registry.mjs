// fgos-file-registry.mjs — single source of truth for well-known FILE paths
// under `.fgos/` (plans/260825-0842-fgos-logs-dir-bucketing, phase-03).
// Kernel layer: pure `path.join`/`path.basename` only, no fs, no git, no
// cwd knowledge -- every domain/kernel module that needs a `.fgos/` file
// path can import this without violating the one-directional-layer rule
// (test/architecture.test.mjs), unlike `src/runner/paths.mjs` (infra:
// resolveMainCheckoutRoot etc. shell out to git), which only entry/
// use-case/infra-layer callers may import.
//
// Before this module, well-known files (state.json, tool-status.local.json,
// the truncation-guard mark, 5 diagnostic logs) each had their path built
// independently in every module AND every test that touched them -- moving
// state.json into a bucket once broke 51 tests across 21 files that had
// each hardcoded their own copy, for no reason other than no shared
// resolver existed to import. One resolver + a lookup table, not one
// function per file: a new file is one table row, never a new function to
// remember to import. `FGOS_FILE` gives callers autocomplete/typo-safety in
// place of a raw string literal.

import path from 'node:path';

export const FGOS_FILE = {
  STATE: 'state',
  TOOL_STATUS: 'toolStatus',
  GUARD_MARK: 'guardMark',
  APPROVE_FAULT_LOG: 'approveFaultLog',
  MAIN_CHECKOUT_GUARD_WARNINGS: 'mainCheckoutGuardWarnings',
  CHANGELOG_NAG_HISTORY: 'changelogNagHistory',
  ENTROPY_HISTORY: 'entropyHistory',
  INVOCATION_FAULTS: 'invocationFaults',
};

const FGOS_FILE_RESOLVERS = {
  [FGOS_FILE.STATE]: (fgosDir) => path.join(fgosDir, 'cache', 'state.json'),
  [FGOS_FILE.TOOL_STATUS]: (fgosDir) => path.join(fgosDir, 'runtime', 'tool-status.local.json'),
  [FGOS_FILE.GUARD_MARK]: (fgosDir) => path.join(fgosDir, 'runtime', 'events-jsonl.truncation-guard.json'),
  [FGOS_FILE.APPROVE_FAULT_LOG]: (fgosDir) => path.join(fgosDir, 'logs', 'approve-post-success-faults.jsonl'),
  [FGOS_FILE.MAIN_CHECKOUT_GUARD_WARNINGS]: (fgosDir) => path.join(fgosDir, 'logs', 'main-checkout-guard-warnings.jsonl'),
  [FGOS_FILE.CHANGELOG_NAG_HISTORY]: (fgosDir) => path.join(fgosDir, 'logs', 'changelog-nag-history.jsonl'),
  [FGOS_FILE.ENTROPY_HISTORY]: (fgosDir) => path.join(fgosDir, 'logs', 'entropy-history.jsonl'),
  [FGOS_FILE.INVOCATION_FAULTS]: (fgosDir) => path.join(fgosDir, 'logs', 'invocation-faults.jsonl'),
};

/**
 * Resolve a well-known `.fgos/` file path. `fgosDir` must already be the
 * `.fgos` directory (see `resolveFgosDir`/`fgosDirFromRoot`,
 * `src/runner/paths.mjs`). Throws on an unknown `kind` -- a typo must fail
 * loud, never silently resolve to `undefined` and surface as a confusing
 * ENOENT three call frames away.
 */
export function resolveFgosFile(fgosDir, kind) {
  const resolver = FGOS_FILE_RESOLVERS[kind];
  if (!resolver) throw new Error(`resolveFgosFile: unknown kind "${kind}"`);
  return resolver(fgosDir);
}

/**
 * Accepts either an already-resolved `.fgos` dir OR its parent (repo root)
 * and returns the `.fgos` dir either way -- a pure basename check, never
 * git, for the small number of callers that legitimately receive both
 * shapes from their own two call sites (main-checkout-guard-warnings.mjs).
 * Not a substitute for `resolveFgosDir`/`resolveMainCheckoutRoot`
 * (`src/runner/paths.mjs`): those actually FIND `.fgos` from a cwd via
 * git; this only disambiguates a value the caller already has in hand.
 */
export function normalizeFgosDir(dir) {
  return path.basename(dir) === '.fgos' ? dir : path.join(dir, '.fgos');
}
