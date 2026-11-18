# Phase 04: host binary lookup without a Git root

Wave 4. Depends on 3. Capability `code:implement`. Effort 0.5d. Removes exception E3 (phase 01 F1).

## Context

`resolveHostBin(dir)` (`src/util/host-bin.mjs`, T0) asks Git for the main checkout root (`resolveMainCheckoutRoot`,
T2) to find the activation of `.fgos/installation`. On every supported path the Rust host sets `FGOS_HOST_BIN` to
itself for its Node child (`apps/fgos/src/legacy_exec.rs:258-265`), and `resolveActiveHostBin` returns that first, so
the Git step only runs on channels AGENTS.md already calls unsupported for state writes, and in tests without the
variable. A T0 leaf cannot ask Git, and the layer below cannot be made to know the layer above.

## Requirements

- `resolveHostBin(dir)` becomes: `FGOS_HOST_BIN` (unchanged rule) -> the activation at the nearest
  `.fgos/installation` at or above `dir`, through the existing `resolveActiveHostBin` of `src/util/host-bin-path.mjs`
  (a `.fgos` path argument still names its project, as the current test pins). It no longer imports
  `src/runner/paths.mjs`.
- If validating's proof point (plan risk map, row 1) finds a production start of the payload that runs from a linked
  worktree without `FGOS_HOST_BIN`, the second step is instead `nativeHelperExe(nativeDoor())` from
  `src/native/door.mjs` (T0: the verified host of the release whose addon this payload loaded), then the activation
  walk. Either form adds no mechanism; validating records which one holds and why.
- Manifest: delete the `tierExceptions` row `host-bin.mjs -> paths.mjs`. The list is now `[]`; keep the key with an
  empty array (the test reads it), unless the test is changed to treat a missing key as empty in the same commit.
- `src/util/host-bin-path.mjs` stays the bootstrap reader (it runs before any door can load); its debt reason in the
  "resolve the invocation root" row is rewritten to say exactly that, retiring with the Node payload (S7).

## Proof

Owning proof: `test/util/host-bin.test.mjs` (FGOS_HOST_BIN first, null for a project with no activation, the project's
own active release, a `.fgos` path names its project). Extend with one case only if the chosen second step adds a
behaviour the four cases do not pin (for example: from a directory below an activated project, the walk finds it).
The removed main-checkout behaviour had no test (checked: no linked-worktree case in `test/util/host-bin*.test.mjs`).

## Validation

- `node --test test/util/host-bin.test.mjs test/util/host-bin-path.test.mjs test/architecture.test.mjs` through the
  repo test runner.
- `npm run fgos:dev -- convention name --kind report --slug x --json` from a linked worktree still answers (the dev
  door sets `FGOS_HOST_BIN`).

## Risk and rollback

Medium (behaviour change on unsupported channels). Rollback: revert the commit; the exception row returns with it.
