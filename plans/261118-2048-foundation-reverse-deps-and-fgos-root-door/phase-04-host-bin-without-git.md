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
- Validation (reports/validation-261118-2104-validate-and-red-team.md, proof point 1) found no production start of the payload that reaches
  `resolveHostBin` without `FGOS_HOST_BIN`, so the walk-up form above is the one to build. The `nativeHelperExe`
  fallback applies only if the implementer finds new evidence; record it in the phase commit if so.
- Regenerate the Git mutation census and commit it with the phase.
- Fact check (lead, on `ba9d302ec`): `invokeHost` (`src/util/host-bin.mjs:62`) also calls `resolveMainCheckoutRoot`, to
  compute the `--dir` of a default `dirScope: 'main-checkout'` call, so dropping the `paths.mjs` import needs it too.
  Decided form (no new mechanism): `invokeHost` passes `path.resolve(dir)` as `--dir` and loses the `dirScope`
  option; the default-scope caller `src/observe/friction-client.mjs:64` (T3) resolves the main checkout itself with
  `resolveMainCheckoutRoot(dir) || dir` (T2, below it). `src/verbs/dispatch/inspect.mjs:42,79` also uses the default
  `invokeHost` but already passes `storeRoot` (`resolveMainCheckoutRoot(repoRoot) ?? repoRoot`, :76), so its answer is
  unchanged and it needs no edit (`src/runner/session.mjs` was deleted on main). Test callers with the default scope
  (`test/cli/helpers/fgos-cli-harness.mjs:190`, `test/e2e/pr-gate.test.mjs:99`, `test/runner/loop.test.mjs:34`,
  `test/state/retrospective-doors.test.mjs:253`): confirm each passes a main checkout and not a linked worktree, or
  wrap with `resolveMainCheckoutRoot`; the `dirScope: 'caller'` callers (`src/convention/convention-client.mjs:21,35`, `scripts/doc-health.mjs:193`)
  drop the option. Answers stay byte-identical.
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

Low after validation (behaviour change on unsupported channels only). Other `resolveHostBin` callers lose the main-checkout step when run from a linked worktree without `FGOS_HOST_BIN`: `src/event-store/maintenance.mjs:6,43,88` (childHost default), `src/run-supervisor/client.mjs:7,28`, `scripts/event-store/forge-probe.sh:26,34`, `test/e2e/self-improve-loop.test.mjs:18`; the implementer shows each has `FGOS_HOST_BIN` or runs in the main checkout. Rollback: revert the commit; the exception row returns with it.
