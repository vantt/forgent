# Phase 2f result: BLOCKED, nothing changed

Row: `doctor-readiness-registry` (door row at
`packages/component-authority/model/doors/doctor-readiness-registry.json`).
Base: `207b6459d`. Working tree left clean (`git status --porcelain` empty); no file written, no file deleted.

## Step 1 fails: the debt is still live

The phase's own first step is a gate:

> 1. Confirm both debt files are gone and no `bridge:` row is left in
> `packages/distribution/contracts/doctor-registry.v1.json`.
> 2. Remove the debt entries. **If a file is still there, stop and report which step still owns it.**

Both hold. Neither condition is met:

| Check | Required | Actual (at `207b6459d`, and on `origin/main`) |
|---|---|---|
| `src/setup/registrations.mjs` gone | gone | **present**, 50 138 B, 1 069 lines, tracked |
| `src/setup/checks.mjs` gone | gone | **present**, 793 B, 22 lines, tracked |
| `bridge:` rows left in `doctor-registry.v1.json` | none | **14 rows** (7 × `bridge:S6b`, 7 × `bridge:S7`) |

The `bridge:` split, read from `packages/distribution/contracts/doctor-registry.v1.json` (101 rows + 23 fixes):

| Owner | id | kind | body still in `registrations.mjs` |
|---|---|---|---|
| `bridge:S6b` | `runner-patterns-config` | row | yes |
| `bridge:S6b` | `workflow-capabilities-configured` | row | yes |
| `bridge:S6b` | `seat-binding-dry-bind` | row | yes |
| `bridge:S6b` | `blind-steps-use-proven-pools` | row | yes |
| `bridge:S6b` | `workflow-case-binding-sentinel` | row | yes |
| `bridge:S6b` | `workflow-case-bindings` | row | yes |
| `bridge:S6b` | `workflow-case-bindings` | fix | yes |
| `bridge:S7` | `domain-registry-compiled` | row | yes |
| `bridge:S7` | `work-classification-vocabulary` | row | yes |
| `bridge:S7` | `work-step-vocabulary` | row | yes |
| `bridge:S7` | `work-recorded-conflicts` | row | yes |
| `bridge:S7` | `root-drift` | row | yes |
| `bridge:S7` | `delivered-not-on-trunk` | row | yes |
| `bridge:S7` | `worker-slots-ceiling-usable` | row | yes |

Every one of the 14 ids still has a live `id: '<id>'` body in `src/setup/registrations.mjs`. The row's own
`reason` says exactly why: "the bodies of the rows and fixes of the layers Node still owns, keyed by id
(bridge:S6b and bridge:S7 in the registry; S6a removed its own); **each step removes its own**".

## Which step still owns it

The row's `retiredBy` names `S7`, and the phase's *Waits* section names the two steps that must land first:

- **S6b (Workflow)** — program plan `plans/261114-2051-rust-verb-migration-program/plan.md:83`. Exit condition
  "tier-6 Node deleted". `src/workflow/` is still present (32 entries) and `workflow` is still
  `"route_kind": "legacy-cli"` in `packages/host-runtime/contracts/command-routes.json:1740-1748`. **Not landed.**
- **S7 (Work)** — same plan, `:84`. Exit condition "zero `legacy-cli` routes" and "delete the bridge module
  `src/setup/doctor-bridge.mjs` and its host caller". `src/runner/merge.mjs`, `src/state/store.mjs` and
  `src/state/replay.mjs` are all still present. **Not landed.**

The program plan records a landing commit only for S2 (`dfcec566b`), S3 (`5723d8453`) and S4 (`ec27d2be8`); S6b
and S7 have no landing note, and no detailed plan of their own exists yet (`ls plans/` shows only
`261118-1341-s6a-execution-tier-rust` and `261118-1455-s6a-worktree-door` for the S6 family). So the two steps
that own this retirement have not started, which is what the phase's *Waits* predicted when it said the phase
"stays `draft` until both steps land".

## Why the debt cannot be dropped from this phase's one file

I checked the alternative reading — that the door row could simply drop its `debt` array, since the phase's
"Files it may write" is only the row — and proved it turns the phase's own Verify red rather than green. Running
the row through the real guard (`checkDoors` exported from `test/architecture.test.mjs`) with `debt` removed,
against the two files as they stand on disk:

```
[doctor readiness registry] src/setup/registrations.mjs:63 does the job outside its door
[doctor readiness registry] src/setup/checks.mjs:11 does the job outside its door
[doctor readiness registry] packages/distribution/rust/src/doctor.rs no longer matches (stale): drop it from the row
[doctor readiness registry] apps/fgos/src/wiring/doctor/** no longer matches (stale): drop it from the row
```

The first two are the live `registerCheck`/`registerFix`/`DOCTOR_CHECKS`/`FIX_REGISTRATIONS` definitions the
patterns still match, and the last two are the survivor entries going stale because the only files that carry
those patterns are the ones the debt was hiding. So the `debt` array is load-bearing: removing it without
deleting the files fails acceptance criterion 4's own check. This is precisely CA-D2's "no twin": the debt goes
only in the commit that moves the callers to the survivor and deletes the copy.

## Callers outside this phase's files (why deleting the files is not this phase's move even if they were empty)

For the phase 11 record, the current importers of the two debt files, re-read today:

**Product (non-test) code:**
- `src/setup/doctor-bridge.mjs:164` — `await import('./registrations.mjs')`, the rows bridge itself.
- `src/verbs/merge/iron-law-level.mjs:11` — imports `IRON_LAW_LEVELS`, `DEFAULT_IRON_LAW_LEVEL`.
- `src/setup/checks.mjs:22` — the re-export shim re-exporting 12 names from `registrations.mjs`.
- `src/setup/workflow-case-checks.mjs` registers its bodies through `registrations.mjs`.
- (comment-only references, not imports: `bin/fgos.mjs:60`, `src/state/knowledge-registry.mjs:34`,
  `src/runner/agent-roster.mjs:4`.)

**Tests:** `test/setup/registrations.test.mjs`, `test/setup/checks*`, `test/setup/helpers/setup-checks-harness.mjs`,
`test/setup/packaged-definitions.test.mjs`, `test/setup/agent-hooks.test.mjs`,
`test/setup/seat-binding-dry-bind.test.mjs`, `test/setup/blind-steps-proven-pools-check.test.mjs`,
`test/setup/workflow-case-checks.test.mjs`, `test/setup/doctor-bridge.test.mjs`,
`test/setup/yaml-parse-failures.test.mjs`, `test/scripts/build-domain-registry.test.mjs`,
`test/state/domain-registry-compiled.test.mjs`, `test/state/events-legacy-absence.test.mjs:52,59` (which asserts
this file's contents), `test/helpers/packaged-definitions.mjs`, `test/runner/dispatch-governance-operability.test.mjs`.

Every one is outside the phase's single writable file, which is the phase's second stated stop condition
("A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not
widen."). This matches the earlier finding in `reports/unit-261123-0819-p02-result.md`, which reached the same
BLOCKED verdict for this row and named the same seven outside importers.

## Verify

`node --test test/architecture.test.mjs` — run through the repo's launcher, `node scripts/run-tests.mjs
test/architecture.test.mjs`, because a bare `node --test` cannot load the combined native addon in this checkout
and fails one unrelated guard (`A4 boundary guard: … name no domain or Workflow step literal`) with
`git-addon-not-shipped`. That failure reproduces identically on the untouched main checkout
`/home/vantt/projects/forgent`, so it is environmental, not caused by this phase.

Through the launcher: **88 tests, 88 pass, 0 fail.** The owning proof of acceptance criterion 4 is the test
`every door row holds: patterns appear only in allowed or debt files, and no entry is stale`
(`test/architecture.test.mjs:1971`); it passes today *because the debt array is still there*, which is the point —
it goes red the moment the debt is removed without deleting the files.

No `debt` was removed, so the phase's second Verify condition ("no `debt` in the row") is **not** met and cannot be
met until S6b and S7 land.

## Deleted paths and last SHAs

**None.** Nothing was deleted, so there is no last-SHA record to hand to phase 11 for this phase. For the record,
the two files' last SHAs on this branch are `src/setup/registrations.mjs` → `cff06aad9` (2026-11-22 18:18) and
`src/setup/checks.mjs` → `cc4fe3739` (2026-11-19 17:03).

## Decision-history line for phase 11

None: no copy was retired, so no settled decision is left behind by this phase. The line phase 11 should write
belongs to whichever of S6b / S7 finally deletes `src/setup/registrations.mjs` and `src/setup/checks.mjs` and moves
the last Node doctor body into `packages/distribution/rust/src/doctor.rs`.

## Concerns / what would unblock this

1. **The phase's Wait is real and unmet.** S6b and S7 have no detailed plan and no landing commit; the phase
   correctly sits `draft`. This unit confirms the plan table's `draft` for 2f rather than contradicting it —
   whoever scheduled this phase into wave 1 dispatched it ahead of its own gate.
2. **Nothing about this row is deliverable inside its one-file footprint.** Even after S6b/S7 empty the body map,
   deleting the two files moves ~15 test callers and 2 product callers, none of which the phase may write. Phase
   2f's footprint (`packages/component-authority/model/doors/doctor-readiness-registry.json` alone) can only carry
   the final `debt`-array edit *after* those deletions, i.e. as a follow-up commit in the step that deletes them.
   The honest fix is for 2f to either gain those callers in its footprint or to be absorbed into the S6b/S7 step
   that retires the file — a planner/owner call, not a unit's.
3. **The bare `node --test` addon failure is a real friction** but pre-existing and unrelated; noted for the
   harness rather than the plan.

Status: BLOCKED
Summary: Step 1 fails — both debt files (`src/setup/registrations.mjs` cff06aad9, `src/setup/checks.mjs` cc4fe3739) still exist and 14 `bridge:S6b`/`bridge:S7` rows remain, so S6b and S7 still own this retirement; nothing changed.
Concerns/Blockers: Blocked on Rust migration steps S6b (Workflow) and S7 (Work), neither of which has a detailed plan or a landing commit. Even after they land, deleting the two files moves ~17 callers outside this phase's one-file footprint (`src/setup/doctor-bridge.mjs`, `src/verbs/merge/iron-law-level.mjs`, `src/setup/checks.mjs` shim, and ~13 test files), so phase 2f cannot retire the debt without widening or being absorbed into the S6b/S7 step.
