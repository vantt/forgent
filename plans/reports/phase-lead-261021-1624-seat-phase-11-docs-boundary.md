# Seat Binding docs, boundary row and errata: phase lead report

Branch `seat-p09`, on top of phase 10 (`bc8ccd4f0`). Nothing pushed, merged or activated.

## 1. What changed

- **`docs/specs/seat-binding.md`**: status implemented (`updated` 2026-10-21); the "today" contrasts in sections 1 to 12 now read "before Seat Binding" (the ones that are still true, such as the `prefer` shape and the tool-executor path, say so); section 13 notes that it is the evidence of the approved draft, the exec cost is now measured (release p95 4.23 ms against the 5.02 ms budget, debug host 6.76 ms outside it, three-seat panel 11.5 ms p50), and what is still unverified; section 15 and 16 updated, with an implementation pointer list (crate, golden contract, route, client, facade, lease, config, doctor rows, budget). No logic restated.
- **Errata, new section 17, each with evidence and the text fixed in place**:
  - E1 section 7.1: reviewed composition is by checker seat; `tester` is a `reviewer`-role seat with a non-verdict posture (`seat-resolver.mjs` `CHECKER_SEATS`).
  - E2 section 10.2: the `shape / synthesis` seat binds xai, not claude, under the "fewest peers of the family" spread rule (phase 01 report section 5).
  - E3 section 9 step 1: the drain predicate (only a live controller blocks; dead pre-seat records, `legacy-run`, no-`execution` records and open workflow runs are info), with the phase 00 counts.
  - E4 section 6: the write gate replays, the receipt is audited at settle, the doctor replay row is gone.
  - E5 section 5.1: a differing `$comment` is reported, not failed; an absent one is not drift.
  - E6: a lease conflict has its own failure code.
  Also corrected: section 9 step 8 (the doctor rows now named), section 9 step 2 (the fence proof).
- **`docs/platform/component-boundary.md`**: the Execution Core row no longer claims "ai làm / model / persona", drops the "planned" sentence and points to Seat Binding; new Seat Binding row (spec section 3 authority sentence, crate, route, client, depends only on `fgos-host-runtime`, agent seats only, account state through the provider-capacity port, no exec under the provider lock). Workflow row unchanged. Plan acceptance criterion 2 reviewed against the row: no JS computes tier, model, executor order, account order or fallback for an agent seat; `bind.mjs` collects `launchView` and `accountView` and asks the route.
- **Pointer edits**: `runner.md` (the rigor to tier section rewritten around the new contract; the data dictionary `tier` row; the D-ADR0072 status and boundary lines; the older decision records are history and untouched), `workflow.md` (the council-lite sketch declares seats instead of `panelist-N`), `work-state.md` (rigor no longer leads to a model), `reading-map.md` (status and source paths), `distribution.md` and the install how-to (the doctor rows: removed two, added `seat-binding-config`, `seat-binding-dry-bind`, `seat-binding-drain`).
- **CHANGELOG `[Unreleased]`**: setup conversion with backup and printed diff, global file untouched, rollback pair; panel/debate need `seats:`; seat-keyed records and the refusal of pre-seat records on resume; lease conflict code, receipt audit, no account inventory in new snapshots, second walker and `fallbackExecutors` removed; doctor rows added and removed; one line replaced where `model-policy-tier-coverage` was described. The lines for `rigorToTier`, rigor, `max-tier-cap`, refused raises and personas were already there.
- **Skill prose sweep**: no `rigorToTier` or `panelist-N` in `core/skills`, `domains` or the rules. One stale name, `resolveTierModel`, in `core/skills/_shared/executor-dispatch-fallback.md`, reworded; `npm run build:skills` regenerated only its two render copies (`.agents`, `plugins`). A handoff comment naming `panelist-2` now says `member-2`. `core/skills/fgos-cook` untouched. `docs/decisions/index.md` needs no regeneration (`fgos decision-index` reports no change).

## 2. Delta lines

Phases 09 to 11 together, against `22d02f15c`: Node src +465 / -314, Rust 0, tests +575 / -124 (phase 11 touches no src or test beyond one comment).

Whole Seat Binding wave against the merge-base with main (`105c73726`), as `git diff` reports it. It also counts the main commits merged into the track, so it overstates the wave; the directories the wave owns are listed separately:

| Part | Added | Removed | Net |
|---|---|---|---|
| Node src (src, bin, scripts, domains) | 4153 | 3376 | +777 |
| of which the runner, setup, workflow, convention, util, run-supervisor and client directories | 4108 | 3294 | +814 |
| Rust: `packages/seat-binding` (crate and golden contract) | 5406 | 0 | +5406 |
| Rust: `apps/fgos` route | 7 | 0 | +7 |
| Tests incl. fixtures | 7313 | 2603 | +4710 (fixtures +2181) |

Node src shrinks in the files that held the old authorities and grows by the new modules (client, resolver, ledger, conversion, doctor rows); the growth is about 80 lines net outside the crate.

## 3. Reviewer notes

- The spec says "implemented" and the CHANGELOG describes the new behaviour; both are true only once the track lands on main (phase 12).
- Main moved 55 commits since the merge-base; the files this phase edits changed on main only in `CHANGELOG.md` (one line). The main-into-track merge and the conversion drift check stay with the big lead.
- Plan criterion 1 grep result: only the allowed hits, plus `session-lead-inline` in `bind.mjs` (the inline lead stays for a unit that configured no candidate at all, by the ranking phase's decision) and the stale test titles in `scripts/check-decision-codes.baseline.json` and generated `mutation-census.v1.json` (not edited: the first is a ratchet that already fails with 374 unrelated findings, the second is written by the release build).
- `fgos convention check --all` lists 91 findings, none under files this wave added or changed.
- Component-boundary check: changed (Seat Binding row, Execution Core row).

## 4. Verification

- Tests run alone: skill, doctrine, wrapper, registration, architecture, handoff-refs and run tests (15 files) all pass; the docs and prepare-release tests pass. `npm test` not run.
- No Rust change in these phases.

## Addendum: pre-merge fix pass (commits 2e9ac5c98, 26284749a, fe7710af3)

Base: `84d12f2ca` (seat-p09 plus latest main, fast-forwarded).

### D1: one projection of a template into a unit

`unitFieldsOfTemplate` (`src/workflow/steps.mjs`) is the one projection. The runner, `seatedPanelUnits` (`--seats`) and `workflowUnitContract` (doctor, blind-steps row) call it and their copies are gone, so the doctor now binds the unit with its `persona`, `blind` and `prefer`, as the run does. Note: the doctor and `--seats` projections used to pass `{pattern, params}`; the runner never passed `params`, so the shared projection follows the runner. Proof (extending `seat-binding-dry-bind.test`): a unit with a persona and `blind` is bound with the persona's tier taste, and the three callers produce the same unit from a template.

### Work path asks Seat Binding

- `effectiveDispatchPolicy` (`plan.mjs`) now binds through `bind()` via `bindWorkSeat` (`bind.mjs`): a pinned executor (the caller's, else the operation's) is a hard override plus a `prefer`, a stated tier or effort is an override, rigor is `effectiveRigorOf` over the strongest explicit demand, and executor, tier, model and effort come from the binding. A caller that already bound the seat (tier and model given) is taken as given, as before. Deleted: the `claude` and global-executor default, `cells[family][0]` (`modelOfCell`), the no-config tier decision, the second rigor composition, `executorPreference`, and the `tierCellMissingDetail` use here.
- `executeExecutorCli` (`cli.mjs`) no longer picks tier or model: both come from the caller that bound the seat (the assignment runner does) or from the executor entry, else `seat-not-bound`. The raw door has no policy left, so I did not route it through `bind` (the lead's "do exactly that" cannot apply to a door that is only handed a bound seat).
- The executor the caller or the operation names reaches the crate as a pin; the crate validates it and decides tier, model and effort. If it refuses the pin, the Work path refuses by name (`pin-unsatisfiable`, or the crate's own refusal), never a Node fallback. The `claude` default survives only for a caller that bound tier and model itself and named no executor (the unit runner always names one).
- Refusals, named: no runner config and no bound tier and model (`runner-config-missing`), a pin the pool does not take (`pin-unsatisfiable`), a capability with no pool (`headless-no-executor`, as `fgos run`).
- Decision, flagged: a Work seat is bound with `session.postureAtLaunch`, so bind does not require a bwrap-capable invocation to admit an executor (the confinement authority judges posture when the assignment launches), and an executor with no invocation counts its own command as the one invocation whose effort levels are judged. Without it every fixture executor and every workspace using a plain default executor would be refused `posture-unavailable`. Unit-run seats do not use it.
- Behaviour a reviewer must know: the global default executor still runs, but only when a pool names its family (`tierFallback` or `prefer`). Unit-run seats and the `fgos run` path are unchanged, since they pass tier and model.

### Tests (retired with owners, migrated)

- Retired: dispatch.test (raw door picks a model through a tier cell, and the cross-provider variant; owners: crate golden vectors and the new `seat-not-bound` test), dispatch-plan-policy (no-registry, implicit-default-executor and governance-without-registry cases, behaviour removed; the no-config case is now `runner-config-missing`), dispatch-execute-for-capability (capability tier picking the raw-door model; owners: `bind.test`, golden vectors).
- Migrated: about 130 tests in 22 files now state a pool through `test/helpers/work-seat-config.mjs` (`bindable`, `bindableExecute`: `tierFallback` from the registered executors, the global executor serving the first family with cells) or pass the bound tier and model.
- `assignment-enumerator-guard` allow-lists the drain row's one listing of top-level unit directories (found by the guard; the row was added in phase 09).

### Safe-now trims

- `seat-policy.mjs` reuses `stripConfigComments`.
- Deleted `test/seat-binding/golden.test.mjs` (the Rust golden owns the 83 cases, `client.test` the wire), the tool-executor-seats snapshot and its test (refactor pin; the one behaviour is a golden case), and nine `bind-tier-composition` tests with a golden twin (the workflow-recommendation naming test stays).

### Delta lines vs `84d12f2ca`

| Part | Added | Removed | Net |
|---|---|---|---|
| Node src | 142 | 163 | -21 |
| Tests (fixtures included) | 212 | 1035 | -823 |
| Rust | 0 | 0 | 0 |

By commit: D1 src +31/-35 tests +40; trims src +2/-7 tests +4/-781; Work path src +109/-121 tests +168/-254.

### Verification

393 test files (runner, runner/execution, cli, e2e, direct, verbs, workflow, setup, seat-binding, parity, intake, scripts, docs, architecture) each run alone: all pass except `active-release-drift-check` (needs a release build; red on the base). `test/run-supervisor/terminal-cutover` fails the same way on the track checkout without these changes (checked), and `terminal-crash-matrix` uses the same harness (not checked); both need a real release host and a fake herdr. `npm test` and cargo not run.

### Work path divergence

Decision: option B (the named executor, else the runner's default executor, reaches the crate as a pin). The Work path (`effectiveDispatchPolicy`) still differs from `fgos run` here:
- It pins the runner's global default executor when nothing names one; `fgos run` lets the capability's pool choose. A capability with no `prefer` therefore works here (the pinned default serves it) and is refused by `fgos run` (`headless-no-executor`).
- It binds with `session.postureAtLaunch` (posture judged at launch; an executor with no invocation counts its own command as the one invocation whose effort levels are judged); `fgos run` requires a posture-capable invocation at bind time. The bind ask names no writes: posture does not affect admission under `postureAtLaunch`, so there is no placeholder write path.
- It always binds one headless producer seat (or the assignment's role) and takes no herdr or lead state from the session.
Unifying these means dropping the default-executor pin and the posture assumption. Option A would have needed about 130 tests in 22 files given a pool and posture-capable invocations, plus the confined launches those fixtures would start. Left as the SEAT-TRIM unification item; no doctor row.

### One-door fix for the drain row

`checkSeatBindingDrain` no longer lists the assignments tree: it takes unit runs from `listAssignmentRuns` (the layout owner), as `units-awaiting-resume` does, so the enumerator guard needs no allow-list entry (the entry added earlier is removed). A unit directory with no attempt directory yet is not seen; the drain predicate concerns units that have started attempts.
