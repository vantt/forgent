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
// 5 diagnostic logs) each had their path built
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
  PORTING_STATE: 'portingState',
  TOOL_STATUS: 'toolStatus',
  APPROVE_FAULT_LOG: 'approveFaultLog',
  INVOCATION_FAULTS: 'invocationFaults',
  COORDINATION_SCHEMA_FAULTS: 'coordinationSchemaFaults',
  CLAIMS_DIR: 'claimsDir',
  OBSERVE_DIR: 'observeDir',
};

const FGOS_FILE_RESOLVERS = {
  [FGOS_FILE.STATE]: (fgosDir) => path.join(fgosDir, 'cache', 'state.json'),
  [FGOS_FILE.PORTING_STATE]: (fgosDir) => path.join(fgosDir, 'cache', 'porting-state.json'),
  [FGOS_FILE.TOOL_STATUS]: (fgosDir) => path.join(fgosDir, 'runtime', 'tool-status.local.json'),
  [FGOS_FILE.APPROVE_FAULT_LOG]: (fgosDir) => path.join(fgosDir, 'logs', 'approve-post-success-faults.jsonl'),
  [FGOS_FILE.INVOCATION_FAULTS]: (fgosDir) => path.join(fgosDir, 'logs', 'invocation-faults.jsonl'),
  [FGOS_FILE.COORDINATION_SCHEMA_FAULTS]: (fgosDir) => path.join(fgosDir, 'logs', 'coordination-schema-faults.jsonl'),
  [FGOS_FILE.CLAIMS_DIR]: (fgosDir) => path.join(fgosDir, 'runtime', 'claims'),
  [FGOS_FILE.OBSERVE_DIR]: (fgosDir) => path.join(fgosDir, 'observe'),
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
