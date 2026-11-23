# Wave 1 parked: fix units refused by a runner binding mismatch

Lead: head:lead-forgent-261123-0726-contra-e554b. Date: 2026-11-23.

## What ran

| Phase | Unit ticket | Result | Branch tip | Worktree (kept) |
|---|---|---|---|---|
| 1 | c-1705-1795394412845 | pass (unit-run-1795394413266-1b61ce99) | 44f4ff356 | forgent-worktrees/261123-0726-contract-check-in-confined-heads-p01 |
| 3 | c-1713-1795394413044 | pass (unit-run-1795394413424-bfdecb6d) | 5ce83a597 | forgent-worktrees/261123-0726-contract-check-in-confined-heads-p03 |

Both branches were reviewed by an independent reviewer subagent against their phase files. Neither was landed.

## Phase 1 review: blocking

1. The leaf `ensureGitAddon` name was given to the new reuse-or-build function, and the old build function was renamed `buildGitAddon`.
   `scripts/run-tests.mjs` and `scripts/test-select-mutate.mjs` import `ensureGitAddon` from the leaf, so the test
   launcher silently moved off always-build. That breaks phase step 4. The digest also misses `rust-toolchain.toml`
   and `.cargo/config`, and the verify-load in the launcher process can leave old bytes loaded after a rebuild. The
   fix, which stays inside the footprint: `ensureGitAddon` in the leaf keeps meaning build, and the reuse-or-build
   function gets its own name, which `scripts/git-addon.mjs` re-exports as `ensureGitAddon`.
2. The new test fails when `CARGO_TARGET_DIR` is set in the caller's environment. Its cargo stub exits 0, so it never
   exercises cargo's read-only error. The fix: clear the cargo env in the probe, make the stub fail with the
   `os error 30` text, and skip the case as root.

There are non-blocking findings too. The unwritable detection falls back to `true` on an unrecognised probe error.
Cargo output is captured with a 1 MB buffer. Two alias exports are unused. The error message does not name the staged
directory.

## Phase 3 review: blocking

1. The regex `/Original id:\s*([^\s.]+)/i` is not anchored. It already reads the prose "`Original id: X.`" in
   `plans/backlog/p-mtqil2rpyy-*.md` as an id. The fix is to anchor it to its own line, case-sensitive.
2. The reviewer wants the shared reader beside `parseBacklogItem` in `packages/portfolio/item.mjs`. **Lead decision:
   not taken.** That file is outside this plan's footprint, so the shared reader stays in
   `scripts/identity-ids-unique.mjs`, imported by the reconciliation script. Two further facts: `parseBacklogItem`
   refuses 149 of the 479 real items because their old-format ids fail its id regex, and the portfolio reader does not
   see Original ids. If that matters, it is a separate backlog item.

Non-blocking findings: the backlog id in the test comment, the unrequested meta keys, and a double section that is
not flagged. At land, the lead must regenerate the mutation census (`node scripts/git-one-door-scan.mjs --write-census`),
because `test/setup/git-mutation-census.test.mjs` is red on the branch until then.

## Why parked

Every fix unit since 08:01 failed before work started, with exit-4:

`binding mismatch: recomputed { executor: gemini, pool: gemini } does not match assignment { executor: deepseek, pool: thehive } -- refused`

| Ticket | Phase | Provider flag |
|---|---|---|
| c-31242-1795395663600 | 1 | `--provider gemini` |
| c-31646-1795395672795 | 1 | `--provider gemini` (retry) |
| c-32009-1795395681906 | 1 | none |
| c-32883-1795395709419 | 3 | `--provider gemini` |

The first units of wave 1 (00:40) bound and ran fine. The fault is in the run door's binding, outside this plan.
It was raised to the supervisor (event `0d234d8e6256532d`). The fix briefs are in `briefs/phase-01-fix.txt` and `briefs/phase-03-fix.txt`. On resume, rerun one fix unit per
phase in the kept worktrees, have the result reviewed again, then land.

Phase 3 step 5 still waits on owner question `q-tvhmli3fns`.
