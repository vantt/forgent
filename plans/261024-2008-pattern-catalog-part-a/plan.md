---
title: "Collaboration degree, Part A: the pattern catalog in config, params per dispatch, one pinned resolution"
description: "Implements the owner-approved Part A spec: patterns declared in config over four code-held loops, tunable params and bounds, activity unit inheritance, the request door, the pin, solo verify, the rename and the config conversion."
status: proposed
priority: P2
effort: 72h
branch: "none yet: drafted in worktree cook-plan-a (detached at 24d8816ba); the fgos-cook case names its own branch"
tags: [runner, config, workflow, refactor, docs]
lane: COOK
spec: plans/261023-1619-collaboration-degree-spec/spec-draft.md
created: 2026-10-24
---

# Collaboration degree, Part A: implementation plan

Authority: `plans/261023-1619-collaboration-degree-spec/spec-draft.md` (owner-approved 2026-10-24 18:09). Nothing decided there is reopened (D1 settled (a); SC-R1..R12; `config-key-retired` refusal instead of in-memory translation; vocabulary D-ADR0073). Settled points also in `reports/config-keys-for-cfg.md` and the review reports of that folder. Scout notes, line drift and prior art: `reports/scout-facts.md`. Executor: `fgos-cook` (slices; see `core/skills/fgos-cook/references/reading-ak-plans.md`).

## Outcome and non-goals

Outcome: a pattern is a name in config (`runner.patterns.<name>`) over four code-held loops; one resolution at the run door picks, validates and pins the effective loop and params; light and serious applications stay distinguishable and auditable; the old `PRESETS`, `patternName`-as-loop, `runner.patterns.reviewed` tuning, `defaultRule` and `research-fan-out-gated` are gone in the same change (L10, RUL104). Non-goals: Part B (ledger folds, evaluator-kind, assessor, any new Workflow admission code), a fifth loop, `extends`, expressions in config, physical id renames (`wf-physical-rename`).

## Phases

| # | Phase | Depends on | Effort | Risk |
|---|---|---|---|---|
| 01 | [Move the loop engines to `loops/`](phase-01-move-loops-dir.md) | none | 2h | Low |
| 02 | [`activityUnitOf` export](phase-02-activity-unit-export.md) | none | 1.5h | Low |
| 03 | [Config declaration, retired keys, marker 2 (CFG gate)](phase-03-config-declaration.md) | 01 | 9h | High |
| 04 | [Loop param tables, seat rules, reserved ids, checker floors](phase-04-loop-params-and-seat-rules.md) | 01, 03 | 7h | Med-High |
| 05 | [Catalog and `resolveCollaboration`](phase-05-catalog-resolver.md) | 03, 04 | 9h | High |
| 06 | [Run door: resolve once, pin, resume, delete old door](phase-06-run-door-pin-resume.md) | 05 | 10h | High |
| 07 | [Solo verify and settle](phase-07-solo-verify.md) | 06 | 5h | Med-High |
| 08 | [CLI request door (`--params`, `--param`, `--reason`)](phase-08-cli-request-door.md) | 02, 06 | 5h | Medium |
| 09 | [Setup conversion and doctor on the one resolver](phase-09-setup-conversion-and-doctor.md) | 03, 05, 06 | 8h | Med-High |
| 10 | [Remaining consumers; rename proven complete](phase-10-remaining-consumers-and-rename-proof.md) | 05, 06, 09 | 5h | Medium |
| 11 | [Skills, how-tos, generated renders](phase-11-skills-howto-renders.md) | 06, 07, 08 | 4h | Low-Med |
| 12 | [Area specs, CHANGELOG, gates, landing](phase-12-area-specs-changelog-landing.md) | all | 6h | High at landing |

Run order is serial (one case worktree, one branch): 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12. Only 07 and 08 (and 02 against everything before 08) are file-disjoint, so they could swap or run as a pair if the frame ever allows parallel writers; the frame does not (never a wave of writers). File ownership by phase: `run.mjs` 03 (one line), 04 (two lines), 06, 07; `config.mjs` 03; `seat-resolver.mjs` 03, 04, 06; `bin/fgos.mjs` 08, 09; `registrations.mjs` 03 (tests only), 09; no file is edited by two phases at the same time.

```
01 -> 03 -> 04 -> 05 -> 06 -> 07 --------> 11 -> 12
 \                         \-> 08 ------/
  02 ---------------------------^   06 -> 09 -> 10 ----^
```

## The CFG gate (phase 03, first step)

Lead CFG has not answered on the schema, and Config landing C (the Node reader cutover) may or may not be on origin/main. Check `git fetch origin && git grep -n "config/facade.mjs" origin/main -- src/runner src/setup bin`: hits mean Branch A (reader wired), none means Branch B (today). A second check says whether CFG already declared the keys in `core/config-schema/runner.schema.yaml` and `core/config-standard/runner.yaml`. Those two files stay the only place keys are declared; no second registry. Phases 04 to 12 depend only on the effective `runnerConfig.patterns` and `runnerConfig.loops` shapes and on `shippedCatalog()`, so a flipped CFG detail changes data files or one loader function, never the plan. The nine open CFG points, the default taken for each and what a different answer changes are in the phase 03 table.

## Acceptance map (one owning proof per behavior, lowest layer; extend existing files)

| # | Behavior | Phase | Owning test |
|---|---|---|---|
| S1 | no selector in a case runs the activity's unit; pin shows `activity` | 06 (wiring through the verb 08) | `test/runner/execution/run-case-admission.test.mjs` (wiring `test/cli/fgos-case-doors.test.mjs`) |
| S2 | `activityUnitOf` null table; chain falls to `solo` | 02, 05 | `test/workflow/case-admission-port.test.mjs`; the chain half in `catalog.test.mjs` |
| S3 | `selector-conflict` before admission | 06 | `test/runner/execution/run.test.mjs` |
| S4 | config-only non-coding pattern; shipped `reviewed` still works | 05 (dry-bind wiring 06) | `test/runner/execution/patterns/catalog.test.mjs` (wiring `test/setup/seat-binding-dry-bind.test.mjs`) |
| S5 | layering, weakening refusals, reserved names, retired name | 05 | `catalog.test.mjs` |
| S6 | two-way defaults, activity params not inherited by another pattern | 05 | `catalog.test.mjs` |
| S7 | floors unioned with provenance; invariant and multiplicity codes | 04 | `test/runner/execution/seat-resolver.test.mjs` |
| S8 | validity on every carrier | 05 | `catalog.test.mjs` |
| S9 | bounds: application 05; validity at load 03; doctor warning 09 | 05, 03, 09 | `catalog.test.mjs`; `test/runner/dispatch-config-patterns.test.mjs`; `test/setup/registrations.test.mjs` |
| S10 | request forms, typing, conflicts, reason, resume refusal | 08 (reason to route event 06) | `test/runner/execution/run-request.test.mjs` (new module), `test/cli/run-verb.test.mjs` (verb behaviors), `run-case-admission.test.mjs` (route event) |
| S11 | pin keeps meaning; unusable pin; fence; schema-1 record resumes | 06 | `test/runner/execution/run.test.mjs`, decoder in `legacy-seat-read.test.mjs` |
| S12 | solo verify once, receipt, no repair, crash, no-command | 07 | `test/runner/execution/loops/solo.test.mjs` (wiring `run.test.mjs`) |
| S13 | reserved seat ids refused | 04 | `seat-resolver.test.mjs` |
| S14 | red-team default, prefix lookup, exact beats prefix, `[]` clears | 04 | `seat-resolver.test.mjs` |
| S15 | verify on panel/debate: capability not run, explicit refused | 06 | `run.test.mjs` |
| S16 | heavy request refused at admission | existing code; wiring 06 | `test/workflow/case-admission.test.mjs` (wiring `run-case-admission.test.mjs`) |
| S17 | solo-shaped seats on a reviewed activity; swap needs reason | 06 | `run-case-admission.test.mjs` |
| S18 | refusal and doctor failure (03, 09); setup conversion (09); standard converted and marker 1 and 2 (03); older release refuses (manual, 12); record resume (06) | 03, 09, 12, 06 | `dispatch-config-patterns.test.mjs`, `tier-fallback-config.test.mjs`, `test/setup/runner-config-conversion.test.mjs` (new module), `registrations.test.mjs`, manual evidence |
| S19 | rename complete, no live `PRESETS`, guards on new directories | 01 (guards), 10 (assertions) | `test/architecture.test.mjs` |
| S20 | legacy declared-operation solo-only refusal unchanged | 06 (kept) | `test/runner/driver-rununit.test.mjs:265,449` |
| S21 | explicit swap carries the activity pattern's invariants | 05 | `catalog.test.mjs` |
| extra | the config snapshot hash covers `loops`; `catalogLayersOf` answers per layer; skills and renders in sync | 03, 03, 11 | `config-snapshot-hash.test.mjs`, `dispatch-config-patterns.test.mjs`, `test/setup/skill-wrappers.test.mjs` |

Two table rows differ from the spec's owner column on purpose, under design principle 8 (lowest layer, new module gets its own file): the parse rules of S10 live in the new `run-request.test.mjs` and S18's conversion in the new `runner-config-conversion.test.mjs`; the spec's named files keep the verb-level and doctor-level wiring. Retired tests and their new owners: `presets.test.mjs` to `catalog.test.mjs` and `loops/role-tasks.test.mjs` (phase 06); the `resolveCheckers` cases of `reviewed.test.mjs` to `seat-resolver.test.mjs` (phase 04); the `acceptOutcomes` refusal moves with its check (phase 10).

## Rules for every slice (standing, not repeated per phase)

1. **Census.** The pre-commit hook refuses a commit that stages a shipped Node file without the regenerated census (`.githooks/pre-commit:454-484`, `test/githooks/census-drift.test.mjs`). Every slice that touches `src/**` or `bin/**` ends with `node scripts/git-one-door-scan.mjs --write-census` and lists `packages/git/contracts/mutation-census.v1.json` and, when files appear or move, `docs/architecture-manifest.json` in its `--writes`.
2. **Writes include the tests** the changed symbols reach: search `rg` for each changed symbol, error code and fixture under `test/` and `packages/*/rust/tests/` before fixing `--writes` (reading-ak-plans item 4). A test the worker edits outside `--writes` stays uncommitted.
3. **Heavy gates run sequentially**, never together (memory cap, jobs 4, `free -g` first): `npm test`, then `cargo test --workspace --no-fail-fast`. Known unrelated reds to ignore: fgctl-upgrade, fgctl-init-download-sources, dev-host concurrent-consumers, holder_lock_gate_passes, killed_move_repairs. Narrow first: `node scripts/run-tests.mjs <files>`.
4. **Test names say the behavior in plain words** and carry no plan, phase, audit or decision code (`scripts/check-decision-codes.mjs` ratchet; `core/instructions/` stable-artifacts rule). Weakening a proof is forbidden; retiring one names its new owner.
5. **Old path deleted with the move** (L10): a phase that replaces a mechanism moves every caller and deletes the old symbol in the same slice, or says in the phase file why a later phase does.
6. **The installed release runs the case.** The activated `fgos` does not inherit an activity's pattern yet, so the conductor passes `--pattern reviewed` by hand on writing slices, and never runs `npm run fgos:dev` against the case worktree's own `.fgos/config.json` (it holds the retired keys until phase 12 converts it; converting it earlier would make the installed release refuse it). Docs-only slices may use `--pattern solo` with `--verify` once phase 07 has landed on the branch's own code; before that use `reviewed`.
7. **Locked decisions go into `--input` of every slice they touch:** D1 (a) (a workflow's bound on params is its MUST rows; no numeric cap in workflows); SC-R1 to SC-R12 (spec 16.2); `config-key-retired` replaces in-memory translation; vocabulary D-ADR0073; "light means fewer people or a different topology, never a weaker receipt than the milestone guard" (not enforced for a solo unit with no verify command or an explicit swap until Part B's B6 and B9: RR-P6).

## Frame suggestion (the owner approves the numbers; the guide's defaults stay for `fallbackPerSeat` and `deviationsBeforeAsk`)

About 18 writing slices (01:1, 02:1, 03:3, 04:2, 05:2, 06:2, 07:1, 08:1, 09:2, 10:1, 11:1, 12a:1). `mutatingDispatches` 36 (writing slices plus one fix slice each); `dispatches` 45 (plus one `validate-plan`, one ambiguity check, three diagnoses, one integration check, three spare); `seatLaunchesPerDispatch` 12 (reviewed: producer, reviewer, red-team, times the loop's two rounds, times `fallbackPerSeat` 2; at `high` rigor three families are needed per round, see risk 3); `rigorFloor` `standard`, raised to `high` in phases 03, 04a, 05, 06, 07 and 09a (public contract, config write, receipt path, record format). Consent points: the frame; the landing (phase 12); any CFG-owned file edit when CFG has not landed it.

## Risks (top three; every phase file carries its own table)

1. **The fence refuses older releases (phase 12).** Converting this repository's `.fgos/config.json` and any machine's global file makes every older activated release refuse them until it is upgraded, by design (SC-R3, SC-R4, no alias). Mitigation: nothing converts before the landing; backup beside each converted file; the per-machine command tested on a copy; one board line; owner consent at the approve door; manual evidence of the refusal.
2. **CFG-owned data files and Rust proofs (phase 03).** The two data files are embedded in the Rust bundle and pinned by `authoring_equivalence.rs` and its fixture, which still hold the old shape; CFG may land conflicting edits; Branch B needs the bundled standard as a bottom layer through the existing merge (RR-P4 tension). Mitigation: the gate, board post first, merge `origin/main` at phase start and end, whoever lands second updates the fixture, proof first run unchanged (question U1).
3. **The run door and in-flight units (phase 06) and scarce families at `high`.** Resume must not change meaning for unpinned schema-1 records (decoder plus the runner view that keeps a tuned `checkersByRigor`), and `run.mjs` is a 1,600-line hot file shared with other lanes. At `high` rigor a round needs distinct families for producer, reviewer and red-team and a round halts when no replacement is eligible (RT-9). Mitigation: decoder tests with a critical-rigor snapshot, merge `origin/main` at phase boundaries, read the board's file-collision rows at lane start, restore the missing family before widening `fallbackPerSeat`.

## Red-team pass on this plan (Assumptions, Failure, Scope; run by the planner against the code, findings with evidence)

Blockers fixed in the phase files:

| Finding | Evidence | Fix |
|---|---|---|
| A-1 the pin's `pattern.layer` has no producer; merged config loses which file defined a name | `run.mjs:152-165` hashes only the merged `patterns`; `global-config.mjs:64` merges first | `catalogLayersOf(mainRoot)` in phase 03, used in phase 06 and by `checkCatalog` |
| A-2 resuming an unpinned schema-1 record would run the loops on an old-shape snapshot and drop a tuned `checkersByRigor` (the loops resolve seats again from `cfg`) | `loops/reviewed.mjs:147` calls `resolveSeats` with `cfg`; `core/config-standard/runner.yaml` sets `critical` to include `tester`, `seat-resolver.mjs:41-42` does not | `collaborationOfRecord` also returns the runner view with `patterns.reviewed` shown as `loops.reviewed`; a critical-rigor resume test (phase 06) |
| F-2 the census hook refuses every product-file commit with a stale census | `.githooks/pre-commit:454-484` | standing rule 1 and the census write in every code phase |
| F-3 converting the worktree's own config early would lock the installed release that runs the slices out; leaving it makes `fgos:dev` refuse | `.fgos/config.json` tracked, holds `defaultRule` and `reviewed` | standing rule 6; conversion only in phase 12 |

Accepted as stated risks (not blockers): F-1 the landing fence (risk 1); A-3 the fixture list may be incomplete (slice-time grep, and a missed fixture fails loudly with `config-key-retired` rather than ignoring tuning); A-4 "the Branch B fill equals Config's merge" is asserted by a proof in phase 03, not by Config itself (question U1); F-4 solo left `pending` after a crash (phase 07 risk table). Scope: no unrequested scope found. Each new module exists for a named contract (`run-request.mjs` the request door, `shipped-catalog.mjs` the bundled standard for the pure resolver, `runner-config-conversion.mjs` the setup conversion, `loops/verify.mjs` one door for `verifyCommandOf`); the doctor activity-unit check and the duplicate-pattern hint are spec items (8.1, 13.3); the test-ownership refinements are listed above, not hidden. Consistency sweep after the edits: the symbols `resolvePattern`, `PRESETS`, `runPattern`, `chosenPattern`, `checkerSeatsOf`, `KNOWN_PATTERNS` each have exactly one deleting phase (04, 06 or 10) in all twelve files.

### Lead decisions on the questions (COOK, 2026-10-24 20:35)

- **U1:** Branch B is accepted: it reuses the existing `mergeConfigDefaults` and adds no merger, and landing C deletes it. If CFG's landing C is on `origin/main` when phase 03 starts, Branch A is used instead. CFG is asked on the board. Reversal: CFG says the fill semantics differ from Config's merge.
- **U2:** move to the resolved loop, as spec 9.2 reads. Reversal: a shipped workflow changes behaviour in a test that the spec did not intend.
- **U3:** `param:<slot>` is accepted as the provenance class.
- **U4:** no; a solo run with no verify command reports nothing new.
- **U5:** decided at slice time; a small fixture of its own is allowed only if no existing CLI conductor-case fixture fits.
- **U6:** asked of CFG with U1; Branch A only.
- **U7:** the slice first checks for an existing host verb that lists releases and uses it; only if none exists does the warning stay unconditional, worded as advice.
- **U8:** owner question, asked with the plan.

## Unresolved questions

1. **U1 (CFG, owner):** Branch B puts the bundled standard under the project and global layers with the existing fill-missing merge (same documented semantics, one function, deleted by landing C). RR-P4 says a JS merger must not appear: confirm this is acceptable, or the catalog waits for landing C and phases 04 to 12 queue behind it.
2. **U2 (owner):** the literal loop-name comparisons in `seats.mjs`, `unit-handoff.mjs` and `definition.mjs` move to the resolved loop (spec 9.2 followed literally, so a pattern whose loop is `panel` counts as a panel), or stay loop-name checks with no behavior change?
3. **U3:** the spec's checker provenance has no class for a `minCheckers` value that wins from a non-invariant pattern or selector default; the plan adds `param:<slot>`.
4. **U4:** should a solo run with no verify command also report `verify: { ran: false, reason }`? Default no (the spec amends only the "solo runs a supplied verify" sentence).
5. **U5:** if no CLI-level conductor-case fixture can host the S1 wiring proof in one file, the wiring proof needs a small fixture of its own.
6. **U6 (CFG, Branch A only):** does the Config write door accept a file whose only fault is the retired keys? If not, CFG owns a repair row for them.
7. **U7:** doctor cannot enumerate installed releases from Node (Rust has `list_releases` in `packages/distribution`), so "while an older release exists" becomes an unconditional warning for catalog or `runner.loops` entries in the global file.
8. **U8 (owner):** consent to the landing moment of phase 12, which makes every older activated release refuse the repository's converted config until upgraded.
