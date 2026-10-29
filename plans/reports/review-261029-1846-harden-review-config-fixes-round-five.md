# HARDEN review, config fixes round five (COOK, main 4c2882575)

Commits reviewed: d8ddc485e, 11cef5907, 69d33700b. Prior round: review-261029-1547-harden-review-config-fixes-round-four.md.

## Verdict: PASS (with two low-severity follow-ups, none blocking)

Both asks are done. No test-only switch is left in production code. One real gap: a missing-key catalog error still gets no file and line (finding 1).

## The asks

| Ask | State | Evidence |
|---|---|---|
| 2a doctor names file and line of a catalog error, reusing `attributeRunnerConfigError` | done | `src/setup/registrations.mjs:552-556` wraps each catalog problem in `RunnerConfigError` and calls the existing locator; no new locator. `CollaborationError` carries `path` (`catalog-entries.mjs`, `checkParamDomain` + every `checkCatalog` push). Proved below. |
| 2a CHANGELOG | done | `CHANGELOG.md:11` now says "file and line ... in the runner and in `fgos doctor`"; matches behavior for the cases below. |
| 3a each seat error states its text once | done | `seat-resolver.mjs:256-262` single `fail(displayed, at, detail, code)`; message is derived as `displayed + detail`, so the text is written once. Both fields still exist on the error (`message`, `detail`), derived, not duplicated literals. |
| 3a delete `catalogLayersOf` | done | `grep -rn catalogLayersOf src bin test docs CHANGELOG.md` returns nothing. `shipped-catalog.mjs` lost the function and the `RESERVED_PATTERN_NAMES` import. |
| 3a drop map/scalar `layers` from `checkCatalog` and `resolveLayer` | done | `resolveLayer(origins, ...)` returns null for a non-array; `checkCatalog` reads only `options.origins`. `grep "layers:"` in src and test finds no caller. |
| No test-only branch (69d33700b) | done | `grep filterOrigins\|run?.origins\|run.origins` in src, bin, test: nothing. `registrations.mjs:544` is `const origins = cfg?.origins ?? [];`. The no-origin test now stubs `nativeDoor().config.snapshot` and restores it in `finally` (`test/setup/registrations.test.mjs`); the seam lives in the test only. |
| Retired tests name a new owner | partial | Two `catalogLayersOf` tests were removed. The second is reworked into a named test ("a global bad loop and a project promise report global ...") that now asserts `resolveLayer(origins, ...)`, so its owner is explicit. The first (project beats global beats shipped per pattern) is deleted with the function; the behavior is gone, but neither the commit body (empty for all three commits) nor a comment says so. The origin-priority rule stays proven by `resolveLayer` tests, so this is a documentation gap only. |
| Census changes | done | d8ddc485e: 1 payloadDigest and 3 file digests changed. 11cef5907 and 69d33700b: digests plus `line` and `spawn ... registrations.mjs:N` number shifts only (checked by normalizing digits: add/remove pairs match). No row added or removed. |

## Proof that doctor yields file and line

Detached worktree, temporary probe test file (reverted, `git status` clean), real project config, real addon. Output of `runner-patterns-config`:

- unknown key `solo.defaults.unknownKey` gives `runner config (<repo>/.fgos/config.yaml:8 patterns.solo.defaults.unknownKey) pattern "solo" default parameter "unknownKey" is not read by loop "solo" (source layer: project)`.
- shipped loop changed (`reviewed.loop: solo`) gives `runner config (<repo>/.fgos/config.yaml:7 patterns.reviewed.loop) pattern "reviewed" cannot change shipped loop ...`.
- bad checker list entry, bad seat role, non-object pattern: the config schema check fires first and already gives `project:config.yaml:10:13 ...[1] (enum)` (file, line, column). These never reach `checkCatalog`.
- The committed test `attributes catalog defaults problem to file and line or layer text` covers project, global (`~/.fgos/config.yaml:N`) and no-origin fallback.

## New findings

### Low

1. **Missing-key catalog errors still carry no line.** `registrations.mjs:552-556` falls back to the plain message when the locator finds nothing. Scenario: project file defines `patterns.mine: {loop: solo}` without `promise`. The probe printed only `custom pattern "mine" must declare a non-empty "promise" (source layer: project)`. No file, no line, because the pushed path `runner.patterns.mine.promise` has no origin leaf and `resolveOriginLocations` (`src/runner/dispatch/config.mjs:128-166`) walks ancestors only for dotted container prefixes that are recorded as origins, and the container `runner.patterns.mine` is not one. The new CHANGELOG sentence promises file and line for a runner-only error, so this case is under-delivered. Fix would be in the locator's descendant step, not a new mechanism. Reasonable to record as a follow-up item rather than block.
2. **Retired-key line has file but no line** (`<repo>/.fgos/config.yaml: runner.patterns.reviewed.maxRounds was retired ...`). Same locator limit (path is not an origin leaf of a retired scalar the same way); pre-existing text, test `a retired key in the project file fails naming the file ...` still passes. Mention only.

### Nit

3. Doubled provenance: the attributed message carries both the file:line and the old `(source layer: project)` suffix, because the adapter has no `detail`, so `err.detail ?? err.message` falls back to the full message. Harmless, but the layer text is now redundant wherever a location resolves.
4. Scalar-layer leftovers: `extractLayerName` (`catalog-entries.mjs:90`) still has a `typeof val === 'string'` branch and `resolveLayer` still matches the short form `name.field` / bare `name` path. Both served the removed map/scalar input; the only caller now passes origin objects with full `runner.patterns.*` paths. L10 says no old path left; this is dead weight, not a bug. `extractLayerName` has no caller outside the file.

## RUL104 check

Net diff in `d8ddc485e` is -43 lines (191 added, 234 removed); the seat-resolver change shrinks the file. 11cef5907 adds one `path` field and one adapter wrapper, no new module. Nothing grew beyond need.

## Tests run (detached worktree harden-review-r5, via `runChosenTests`)

`test/setup/registrations.test.mjs`, `test/runner/execution/patterns/catalog.test.mjs`, `test/runner/execution/seat-resolver.test.mjs`, `test/runner/dispatch-config-patterns.test.mjs`: 170 tests, 170 pass, 0 fail, 0 skipped. Plus one temporary probe test (7 catalog cases, pass 1, removed). No `npm test` or workspace cargo run.

## Cleanup

Worktree removed after this report; main checkout untouched except this file.

## Unresolved

- Whether finding 1 should widen the locator (affects the runner's own error text too) or only narrow the CHANGELOG wording: owner call.

## HARDEN decision on finding 1

This is not an owner question. A missing key has no line of its own, so the locator should fall back to the nearest parent that exists, which is the pattern entry `patterns.<name>`. That reuses the same locator, adds no mechanism, and keeps the CHANGELOG sentence true. The runner's error text gains a location as well, and that is the intended behaviour. Findings 2 to 4 go to COOK in the same round: finding 2 uses the same parent fallback; finding 3 drops the `(source layer: ...)` suffix when a file and line are known; finding 4 deletes the string branch and the short-path match. The test deleted with `catalogLayersOf` (project beats global beats shipped, per pattern) needs a named owner, or a note that the behaviour is owned by the layered resolver's own tests.
