# plan.md: tsk-396 — merge-before-gate ordering in approve

Decisions this plan honors: `CONTEXT.md` D1 (scope retarget to the RUL58
acceptance-evidence gate), D2 (include the `--github` transport).

## Mode

**high-risk.** Flags counted:

| Flag | Applies | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | no schema/field change |
| audit/security | **yes** | the bug is a state/reality mismatch between main's real content and the item's recorded status — exactly the trust guarantee fgOS's whole event-log/audit design exists to hold |
| external systems | **yes** (via D2) | `--github` transport calls the real GitHub API server-side merge |
| public contracts | **yes** | changes where/how `approve`'s pre-merge refusal surfaces for a runner-sourced item with an unmet acceptance clause — currently an uncaught post-merge `StoreError`, becoming a structured pre-merge refusal consistent with the existing Iron Law gate's shape |
| cross-platform | no | — |
| existing covered behavior | **yes** | `approve`/`mergeRunnerItem` are covered by 51+ tests in `test/runner/merge.test.mjs` plus the runner-sourced-approve suite in `test/cli/fgos.test.mjs` |
| weak proof around the area | **yes** | confirmed zero test coverage of the actual buggy path — the one existing acceptance+approve test (`fgos.test.mjs:6770`) uses a plain (non-runner-sourced) item, which never calls `mergeRunnerItem` at all, so it can't reproduce this bug |
| multi-domain | no | — |

5 flags, one of them (audit/security) a named hard-gate on its own —
high-risk on either count independently. A `standard` plan would not
honestly cover this: three call sites, one of them touching an external
API with an irreversible action, in code with real existing coverage
that must not regress.

## Approach

**Chosen path**: extract the RUL58 acceptance-evidence check
(`src/state/store.mjs:512-519`, currently inline in `moveWork`) into a
standalone, pure, exported validator. Call it as a pre-flight guard,
before any merge mutation, at all three `approve` call sites in
`bin/fgos.mjs`. `moveWork`'s own inline check stays exactly as-is,
calling the same extracted function — unchanged behavior for the doors
that don't go through this pre-flight (`return`'s `doing -> delivered`,
the mechanical `blocked -> delivered` retry), and a defense-in-depth
backstop if a future caller ever reaches `moveWork` without going
through `approve`'s pre-flight.

**Alternatives rejected**:
- *Leave the check where it is, rely on `tsk-3yl`'s idempotency alone.*
  Rejected per D1/D2 — the user explicitly chose to retarget and fix the
  ordering, not accept idempotency as sufficient. Idempotency prevents a
  second bad merge on retry; it does nothing for an acceptance clause
  that's permanently unmet (item stuck at `awaiting-approval` forever
  with code already on main/GitHub).
- *Make the merge itself provisional/reversible until the gate passes*
  (CONTEXT.md's originally-stated alternative bar). Rejected as the
  chosen path for the `--github` transport specifically — a GitHub
  server-side merge cannot be made provisional or auto-reverted; a
  pre-flight check is the only shape that actually satisfies "the gate
  runs before the merge" for that transport. For consistency, the same
  shape (check-before-merge, not merge-then-maybe-revert) is used for
  the two local paths too, rather than mixing two different fix shapes
  for what CONTEXT.md treats as one bug.
- *Duplicate the acceptance-evidence logic inline at each of the three
  call sites instead of extracting a shared function.* Rejected — three
  independent copies of the same validation is exactly the kind of
  drift this bug's own root cause (a check living in the wrong place)
  warns against; extraction is the DRY-consistent shape and keeps
  `moveWork` and `approve` provably checking the same thing.

**Order** (`tsk-396` has no `deps`; `fgos graph --json`'s
`criticalPath`/`topUnblock` don't rank it — confirmed independent, no
ordering constraint from other work):

1. Extract the validator in `store.mjs`; `moveWork` calls it — pure
   refactor, zero behavior change. Lowest risk, foundational for the
   next two steps.
2. Wire the pre-flight into the two local merge paths (leaf→root
   ~line 2223, root→main ~line 2297) in `bin/fgos.mjs`.
3. Wire the pre-flight into the `--github` path (~line 2108-2137).
   Ordered last — highest individual risk (external API, irreversible
   action, needs the `FGOS_GH_COMMAND` fake-gh test harness).

## Impact-analysis posture

`impact-analysis: full` (GitNexus registered and `present` — `fgos tool
query --capability impact-analysis --status present`, confirmed during
`fgos-coding-exploring`). Per `CLAUDE.md`'s MUST rule, `fgos-coding-implement` runs
`impact({target: "moveWork", direction: "upstream"})` and
`impact({target: "mergeRunnerItem", direction: "upstream"})` before
editing either symbol, and reports blast radius before proceeding — not
optional at build time given both are shared, heavily-called symbols.

## Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `store.mjs` validator extraction | low | existing acceptance-clause test suite (`store.test.mjs`, `fgos.test.mjs:6606-6784`) stays green, unmodified — pure refactor, no new test needed for this step alone |
| Local pre-flight wiring (leaf→root, root→main) | medium | new integration test: runner-sourced item, real `fgw/<id>` branch, acceptance clause with missing evidence, real `approve` call — assert refusal, assert **no new commit lands on the target branch** (`git log` unchanged before/after), assert item status stays `awaiting-approval` |
| `--github` pre-flight wiring | medium-high (external API, irreversible on failure) | new test using the existing `FGOS_GH_COMMAND` fake-gh harness (`fgos.test.mjs:4889+` pattern) — acceptance clause missing evidence, fake `gh` configured to succeed — assert the fake `gh merge` is **never invoked**, item stays `awaiting-approval` |
| Interaction with `tsk-3yl` idempotency (`isAlreadyMerged`) | low | existing `merge.test.mjs` idempotency tests stay green, unmodified — pre-flight now prevents ever reaching the broken case, idempotency remains the backstop for other failure classes reaching `mergeRunnerItem` mid-flight |
| `moveWork`'s own doors not covered by `approve`'s pre-flight (`return`'s `doing -> delivered`, mechanical `blocked -> delivered` retry) | low | out of scope per CONTEXT.md's feature boundary — these doors don't call `mergeRunnerItem`/`mergeGitHubPR` in the pattern this item targets; existing tests for those doors (`fgos.test.mjs:6720-6767`) stay green, unmodified, confirming no regression |

## Concrete cases to prove against

- Acceptance clause present, evidence present → merge proceeds exactly
  as today (no regression on the common/happy path).
- Acceptance clause present, evidence missing, local merge path → no
  git mutation attempted, refusal message matches today's wording
  (`store.mjs:516-518`'s existing error text), item stays
  `awaiting-approval`.
- Acceptance clause present, evidence missing, `--github` path → no
  `gh` merge call attempted, same refusal shape.
- `acceptance` absent or empty array → pre-flight is a complete no-op
  (mirrors D4 in the original `str73-done-flip-cos-check`/status-refactor
  design) — merge proceeds unaffected.
- Existing Iron Law gate (already pre-merge, line 2081) still runs
  first, unaffected by this change — no reordering relative to it.

## Assumptions

- No other door into `delivered` besides the three named call sites
  performs a real merge before `moveWork` — confirmed by reading the
  full `approve` command body (`bin/fgos.mjs:2139-2329`); the pull/legacy
  path (line 2311+) never merges (code already on main per D4), so it's
  unaffected by definition, not by omission.
