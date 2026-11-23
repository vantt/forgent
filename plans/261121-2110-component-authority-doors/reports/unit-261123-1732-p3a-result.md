# Phase 3a result: write-scope callers moved onto the Rust rule

Commit subject: `refactor(write-scope): move head-request and workflow definition onto the writeScope door`

## Changes
- `src/session-host/head-request.mjs`: dropped the import of `runner/dispatch/write-scope.mjs`; `canonicalizeWriteEntry` and `matchesWriteScope` are now two local one-liners over `nativeDoor().writeScope('canonicalize' | 'matches', ...)`. `entryWithin` and `covered` are unchanged (`covered` already catches a refusal).
- `src/workflow/definition.mjs`: `normalizeWriteScope` now calls `nativeDoor().writeScope('canonicalizeAll', { scope })`, keeping the old "writes must be an array" refusal text with an explicit `Array.isArray` guard. Header comment updated.

Survivor: `packages/write-scope/src/lib.rs` via the addon `writeScope` namespace. Nothing deleted in this phase; `src/runner/dispatch/write-scope.mjs` (still at 57087d7bd32dcfefd97eb51f4bfa58613f4e0a81) and the row's `debt` stay for phase 3a2.

## Owning tests (not run)
- `test/session-host/head-request.test.mjs` owns head-request write-grant coverage.
- `test/workflow/definition.test.mjs` owns definition `writes` normalization.
- `test/git/write-scope-parity.test.mjs` owns the rule itself (JS port vs Rust); untouched.
- Retired behaviour: none (the JS port is not retired here).

## Not run
I was refused node and cargo. The lead must run: `rg -n "dispatch/write-scope" src/session-host src/workflow` (expect empty), `node --test test/workflow/definition.test.mjs test/session-host/head-request.test.mjs test/architecture.test.mjs`.

## Risk to check
Error message text from the native `canonicalizeAll` may differ from the JS port's `writes[i]: ...` wording; `definition.test.mjs` assertions on message text would reveal it. If so, that is outside my scope to resolve (tests) — report back.

## Phase 11 decision-history line
Footprint write-scope: `head-request` and workflow `definition` read write entries through the Rust write-scope package (addon `writeScope`), not the dispatch JS port; the port's remaining consumers are removed in phase 3a2.

Status: DONE_WITH_CONCERNS
Summary: Both live callers now use the nativeDoor writeScope operations; no reference to dispatch/write-scope remains in either file.
Concerns: node/cargo were refused so no test was run; error-message wording from the native canonicalizeAll is unverified.

## Fix round
- `head-request.mjs`: the two `../native/door.mjs` imports are one (`installOnce, nativeDoor, replaceDurably`); the write-scope wrappers sit below all imports. `covered()` rethrows errors whose code starts `git-addon-` (missing/unsafe addon) and only turns write-scope refusals into `false`.
- `definition.mjs`: header says two pure leaves and names the native writeScope door; `normalizeWriteScope` returns `[]` for an empty array without calling the door and rethrows `git-addon-` errors unchanged instead of wrapping them as a writes error.
- Not run: no tests executed.

Status: DONE
Summary: Merged imports, addon-unavailable errors propagate in both callers, empty writes skip the door, header comment corrected.
