# Lead report: HARDEN T5 phase 14, lot 2 (execution core files)

- Worktree `harden-t5-p14-lot2`, branch `harden/t5-p14-lot2`, based on `origin/main` `7055cf874`. Owner decision 69.
- Refactor only. No behaviour, error text, error code, return shape or saved format changed.

## Line counts

| File | Before | After | Change | Target |
|---|---|---|---|---|
| `bind.mjs` | 590 | 514 | -76 | ≤ 515 (hard limit 520) |
| `run.mjs` | 975 | 858 | -117 | ≤ 865 |
| `unit-run-start.mjs` | 526 | 447 | -79 | ≤ 475 |
| `seat-resolver.mjs` | 508 | 395 | -113 | ≤ 458 |
| `handoff-refs.mjs` | 325 | 262 | -63 | ≤ 285 |
| `unit.mjs` | 365 | 280 | -85 | ≤ 335 |
| `legacy-seat-read.mjs` | 214 | 163 | -51 | ≤ 194 |
| **Lot total** | 3 503 | 2 919 | **-584** | -375 |

`src/runner/execution` goes from 7 590 to 7 006 with this lot alone; lot 3 (landed first) closes the remaining 6 lines. No function in these seven files is over 200 lines. Node -584, Rust 0, tests 0.

## Code changes beyond trimming comments

- `bind.mjs`: one helper `runnerCommandOf` reads the runner's default command for both `getProviderFamily` and `commandOf`; `bind()` returns `explainSeat(..., { chain: false }).binding` instead of its own `decide()` copy (still one crate call, same refusal shape); `crateOverrideOf` computed once; `readInventory` folded into `accountViewOf`.
- `handoff-refs.mjs`: one `copyDigestOf` replaces two copies of the copy-failed digest read.
- `seat-resolver.mjs`: `checkerPlanOf` reads both checker tables through `rowOf` and the requested contributions through one `slotContribution`; throw order unchanged.
- `unit.mjs`: `dependsOn`, `inputs`, `expectedOutputs` built with `map`, same messages in the same order.
- `run.mjs`, `unit-run-start.mjs`, `legacy-seat-read.mjs`: literals and single-statement ifs folded, no logic change.
- Exports with no importer anywhere removed: `identityOf` is private to `bind.mjs`; `bind.mjs` no longer re-exports `canApplyPosture` (callers import it from `dispatch/confinement/policies.mjs`).
- Dated stories, labels and repeated JSDoc removed; each invariant that still holds kept as one line.

## Tests

- Focused run (52 files: every test importing a touched module, `architecture.test.mjs`): 774/774 pass, no `run-tests: ERROR`. A first focused run was invalid (111 `git-addon-unavailable: digest mismatch`) because `git-one-door-scan --write-census` restaged the addon during the run; the clean re-run is the evidence.
- Full suite: 8 597 tests, 8 564 pass, 32 skipped, 1 fail (the known frozen V7n addendum test), no ERROR lines.
- Census regenerated, 0 undeclared. No test added, retired or edited.

## Notes

- Impact analysis: `fgos tool query` cannot run inside the worktree (no `.fgos/installation`); callers checked with grep; changed exports kept their signatures.
- No red rows exist for this phase; behaviour is held by the existing tests.
- A stray 3 GB Cargo output folder built by the census scan inside the worktree was removed.

Status: DONE
