# P03 — Canary-First Local Runner

**Status:** accepted. New additive `npm run test:canary` command; `npm test` semantics unchanged (proven, not assumed).

## What shipped

- `scripts/run-tests.mjs`: extracted `runSelectedTests(files, options)` — the exact spawn/env/argv logic `runTests()` already had — so `runTests()` becomes "discover, then delegate to `runSelectedTests`." No new behavior; `runTests()`'s public contract (params, return shape, refusal-on-empty) is byte-for-byte unchanged. All 15 pre-existing tests in `test/scripts/run-tests.test.mjs` pass unmodified against the refactored file.
- `scripts/run-test-canary.mjs` (new): `parseCanaryArgs`, `readCanaryFileList`, `resolveCanaryFiles`, `runCanary` — reuses `runSelectedTests`/`runTests` for all spawning; no duplicated discovery/env/argv logic.
- `package.json`: `"test:canary": "node scripts/run-test-canary.mjs"`.
- `test/scripts/run-test-canary.test.mjs` (new): 24 focused tests.

## Behavior

```text
resolve explicit canary files (positional args and/or --from-file <path>)
→ empty set (no args, or all invalid, or a --from-file that resolves to nothing) refuses, no spawn at all
→ any invalid path (missing/not-a-file/wrong-suffix/outside-test-root/symlink-escape) refuses the WHOLE set -- never silently narrows to just the valid subset
→ duplicates (same string, or a symlink and its real target) collapse to one entry, sorted
→ canary red: return its status immediately -- full suite is never invoked
→ canary green: invoke runTests() exactly once, completely unchanged (no canary-only flags leak into it)
```

Forwarded flag-shaped args (anything starting with `-`, plus `--from-file <path>` consuming its own value) apply only to the canary sub-run; the full-suite invocation that follows a green canary is `runTests()` called with no forwarded args, i.e. truly identical to plain `npm test`.

## Proof coverage (all 8 required cases)

| # | Requirement | Test(s) |
|---|---|---|
| 1 | empty canary set refuses | "an empty canary set... refuses without spawning anything", "a --from-file pointing at a missing file also refuses" |
| 2 | missing/outside/symlink-escape path refuses | 6 tests under `resolveCanaryFiles rejects ...`, plus "one invalid path among several refuses the WHOLE set" |
| 3 | duplicates collapse deterministically | "collapses the same file given twice", "collapses a real path and a symlink to the same real file", "returns a sorted, deterministic order" |
| 4 | failing canary prevents full invocation, preserves status | "a red canary returns its own status and NEVER invokes the full-suite spawn" |
| 5 | green canary invokes full suite exactly once | "a green canary invokes the full-suite spawn exactly once, not twice, not zero times" |
| 6 | forwarded args cannot replace selected files | "a forwarded flag never becomes a canary file, and never leaks into the full-suite spawn" |
| 7 | Windows-safe argv/env behavior | "spawn always receives argv as a literal array, never a shell command string" (structural: `runSelectedTests`/`runTests` already own the platform-safe env/argv construction, reused verbatim, never re-implemented) |
| 8 | `npm test` unchanged | all 15 pre-existing `run-tests.test.mjs` tests pass unmodified post-refactor |

Two more real-process (not injected) integration tests: the CLI entrypoint itself, spawned for real, refuses correctly over zero args; and runs a green canary through a real full suite over a tiny fixture tree.

## Performance acceptance

- **Wrapper overhead <250ms median over 10 injected-spawn runs**: measured median well under 1ms per call in this environment (the assertion itself uses a 250ms bar; actual samples were single-digit milliseconds for the whole 10-run loop). Test: "wrapper overhead... has a median under 250ms over 10 injected-spawn runs."
- **A failing canary returns before a full-suite run would complete**: proven structurally, not by timing — the injected spawn asserts the full-suite spawn (identifiable by argv length) is never called at all when the canary is red. Test: "a failing canary demonstrably returns before a full-suite run would even start."
- **Green path runs the full suite once, not twice**: asserted via spawn call-count (exactly 2: one canary call + one full-suite call).

## Real end-to-end proof (not just injected)

Ran the plan's exact verification command for real against this repo:

```sh
npm run test:canary -- test/state/store.test.mjs
```

Result: canary green (1 file, `test/state/store.test.mjs`, 67 tests, 2325ms), then the full suite ran exactly once — **7154 tests, 7145 pass, 0 fail, 9 skipped, exit 0, 427067ms**, discovering 357 files (including the two new files this phase adds). This real run doubles as this phase's required `npm test` full-suite verification (per the plan's Verification section) — no separate full-suite run was needed since this one already is that proof, on the exact post-mutation tree.

## Impact analysis

`mcp__gitnexus__detect_changes({scope: "staged"/"unstaged", repo: "/home/vantt/projects/forgentX", worktree: <this worktree>})` returned `changed_symbols: 0` for both scopes despite a real new export (`runSelectedTests`) and a real refactor of `runTests`'s body. This is the same stale-index degradation already flagged in P01 (main-checkout index is 8 commits behind this worktree's HEAD) — treated as **degraded, not full**, per the project's capability gate: the graph tool did not confirm safety, so safety here rests on the test evidence above instead (39 focused tests across the two touched/new files, all green; the real 7154-test full suite, green). Cross-checked callers of the refactored file via `grep` earlier in this session (see P01's session notes): only `test/scripts/run-tests.test.mjs` imports `runTests` by name; `scripts/test-timing.mjs` and `scripts/test-proof-inventory.mjs` only import the untouched `REPO_ROOT` constant.

## Rollback

Not needed — accepted. If ever reverted: remove `scripts/run-test-canary.mjs`, `test/scripts/run-test-canary.test.mjs`, the `test:canary` package.json entry, and revert `scripts/run-tests.mjs` to inline `runSelectedTests`'s body back into `runTests` (a pure textual inverse of this commit's diff — no other file depends on the new export).
