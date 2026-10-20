# Phase 02: seat identity, storage keys, one seat resolver, patterns as seats, core workflows

Owner: Sonnet lead in a worktree from the track. Size XL (2.5d; grew from L with [RT-6], [RT-7], [RT-8], [RT-13], [RT-14]). Parallel with 01 only; 03 and 04 start after 02 merges (shared `run.mjs`, `docs/architecture-manifest.json`, Convention contracts). Works on today's Node `bind()`; no crate needed.

## Context

- Spec `docs/specs/seat-binding.md` §6.1 (workflow declares `seats:`), §7.1 (seat contract, composition), §7.2 (launch order), §7.3 (independence, role/posture side), §9 step 1 (records) [RT-16b].
- Today: ledger `role-ledger.mjs:20-34`; panel roles `patterns/panel.mjs:26-33`; debate `patterns/debate.mjs:35-43`; `CHECKER_ROLES` `bind.mjs:19-24`; stance `role-tasks.mjs` (~:100); launch counting `src/runner/execution/case-admission-port.mjs:17,66-77` (counts panel roles; it has no role-name branch [P00-C9]); `--seats` `src/workflow/seats.mjs:124,172`. Work list of role-keyed readers: phase 00 report §3.10 (complete, re-grepped), which adds `settlement.mjs:290,568,776,795`, `assignment-runner.mjs:1172,1804,2396,2567`, `seat-providers.mjs:24`, `patterns/solo.mjs:28-30`, `run.mjs:76`, `bin/fgos.mjs:743`. Role-name branches per §3.11: `bind.mjs:19-24`, `config.mjs:1383`, `registrations.mjs:591`, `panel.mjs:28-34`, `debate.mjs:35-41`, `role-tasks.mjs:100`, `agent-result-claim-contract.mjs:25-27`, `case-projection.mjs:242-246` (verdict regex: why `tester` gives no verdict receipt), `settlement.mjs:290`, `unit-sync.mjs:76,109`, `unit-summary.mjs:64-71` [P00-C9]. Not role readers, removed from the list: `work-dispatch.mjs:377-384` (ref-path guard) and `case-admission.mjs:108,173` (doc comment; reads only the unit id) [P00-C8]; they stay format consumers for the RT-7 seat id rule.
- Parallel lanes: `core/skills/fgos-cook/**` (COOK P5) untouched. `src/workflow/case-projection.mjs` is touched here only at :242-246 [RT-6], **after** the settle-milestones lane has merged to main and been merged into the track; coordinate with that lane, do not declare the file untouched. `src/workflow/case-admission-port.mjs` stays untouched.

## Requirements

- Every bind ask/result and attempt record carries `seat` (unique in unit), `role` (one of `producer, synthesizer, reviewer, red-team, judge`) and `posture` (`readOnly`, `forceOutOfProcess`, panel-member stance, verdict/non-verdict). Write/launch behaviour reads posture, never role; `CHECKER_ROLES` and `isCheckerOrPanelRole` deleted.
- [RT-7] Seat id rule, owned by Convention (`packages/convention/contracts/convention.rules.v1.json` + golden): charset `^[a-z][a-z0-9-]{0,39}$`, reserved names (`runs`, `outbox`, `inbox`, `.`/`..`, any name the assignment layout uses as a directory), enforced in the resolver and in the workflow schema; traversal test (`../x`, `a/b`, reserved names) on every path/ref builder (`run.mjs:1040,1355`, `case-admission.mjs:173`, `unit-run-history.mjs:47-48`).
- One seat resolver (`src/runner/execution/seat-resolver.mjs`, new) returns the ordered seat list for execution, `dry-bind`, doctor and admission launch counting; validates unique ids, role vocabulary, multiplicities.
- [RT-13] The resolver is the **one authority for effective rigor and checker composition**: `effectiveRigorOf(unit, runnerConfig)` = stronger of capability rigor (exact key, else `<prefix>:*`) and unit rigor. Delete the Node duplicates `patterns/reviewed.mjs:45,91`, `dispatch/plan.mjs:415`, `dispatch/cli.mjs:576`, `assignment-policy.mjs:287` (06 removes the last one with the rest of that file; until then it calls `effectiveRigorOf`). [P00-C14] Also route through `effectiveRigorOf`: `work-dispatch.mjs:348-365` (`workRigorFor`: operation rigor, then item rigor, then `risk: heavy`, which become its inputs), `loop.mjs:1608-1609`, operation policy rigor of domain workflows (`domains/coding/workflows/feature.yaml:64`, an input), and admission's guide-floor comparison (`case-admission.mjs:231-233` compares the floor from `case-start.mjs:52-57` against `effectiveRigorOf`, it computes nothing). The rigor-derived effort default (`assignment-policy.mjs:81,382`) is deleted in 06 with that file; 07 makes effort cell-only. The crate receives effective rigor as input.
- [RT-8] Composition **by checker seat**: solo → seat `producer`; reviewed → seat `producer` + one checker seat per entry of `checkersByRigor[effectiveRigor] ∪ minCheckers` (entries are checker seat names); panel/debate → `seats:` required. Seat→role mapping beside the set: `reviewer`→`reviewer`, `red-team`→`red-team`, `tester`→`reviewer` (role used for taste lookup only). `tester` keeps today's result contract and receipt treatment through its posture, which is non-verdict (`agent-result-claim-contract.mjs:25-27`, `case-projection.mjs:245`). Rename `VALID_CHECKER_ROLES` (`config.mjs:257,1383`) to `VALID_CHECKER_SEATS` and merge the second checker set at `registrations.mjs:591` into it (one set). Spec errata noted for 11.
- Remove `params.members`, `params.role`, `params.synthesizeRole`, `panelist-N` `roleTasks` keys and role `panelist`; `roleTasks` and `workflow start --seats` keyed by seat. Debate: `thesis`/`antithesis` = seats with role `producer`, `judge` = seat with role `judge`.
- Storage keyed by `unitRun + seat + round + attempt`: seat ledger (`role-ledger.mjs` → `seat-ledger.mjs`), assignment dirs, `unit.json` seats, panel/debate resume, handoff refs, unit summary, and **every reader in phase 00's role-keyed list** [RT-6] (incl. `unit-sync.mjs:76,109` role `sync` → seat `sync`).
- [RT-6] **One legacy read path**: `src/runner/execution/legacy-seat-read.mjs` (new) maps settled role-keyed panel/debate records to seats for readers only (summaries, history, observe, `unit-summary.read.v2.json:55` consumers, `packages/observe/rust/src/metrics_cli/discussions.rs:170`); golden tests on a pre-fence panel record (`panelist-1..3` + synthesizer) and a pre-fence debate record. It is the only place `panelist-` may appear after the wave. [P00-C2, D-a, D-b, D-f] It also covers every pre-fence record the wave leaves behind: the 28 `awaiting-resume` and 2 `legacy-run` `running` records and the 81 records without an `execution` field on forgentX stay **readable** (history, summaries, observe) and are refused on resume by name. Handoff refs of the 4 parked workflow runs (`unit-run:<id>/panelist-N`, `…/synthesizer`, phase 00 §8.3) resolve through this path when their gates are answered after landing, so a parked gate is not a drain blocker.
- [RT-14] Launch order §7.2, explicit: per unit run, ledger-read → bind → publish is serialized through one promise queue (not reliant on one synchronous stretch, `role-ledger.mjs:13-17`); parallel launch only after the batch is bound. 08 reuses this queue for lease-conflict rebinds.
- Stance from panel-member posture.
- Record fence: `unit.json` gains `seatSchema: 1`; resume of a record without it (any `execution.status`, or no `execution` field) is refused `record-predates-seat-binding` [D-a, D-b, D-f]. No abandon verb is added (RUL104). (The pre-wave phase made the current release refuse records **with** it [RT-15].)
- Workflow schema (`definition.mjs`, `guide-schema.mjs`) accepts `seats: [{seat, role, persona?, tier?}]` (tier validated; read from 06) and refuses `prefer`, `executor`, `overrides` on a workflow unit. [RT-11] `seats[].tier` is honoured only for registered, loader-sourced definitions; a `--units`/`--unit` file carrying `seats[].tier` is refused (`units-source.mjs:97` tags the source).
- Core workflows converted to explicit `seats:` for every panel/debate unit: `architecture-advisory.yaml` (shape-proposals per spec §10.2, `system` seat `tier: frontier`; lens texts to seat-keyed `roleTasks`; personas only where a persona file exists), `nominal-group.yaml`, `group-cognition.yaml` (panel + debate per §10.3, judge `tier: flagship`), `council-lite.yaml`, `business-discussion.yaml`, `delphi.yaml` (two units). Presets `patterns/presets.mjs` (`consult`, `research-fan-out`, `rfc`) likewise.

## Files

- Create: `src/runner/execution/{seat-resolver,seat-ledger,legacy-seat-read}.mjs`.
- Delete: `src/runner/execution/role-ledger.mjs`.
- Modify: `src/runner/dispatch/config.mjs` (checker seat set only), `bind.mjs` (posture only), `run.mjs`, `dry-bind.mjs`, `handoff-refs.mjs`, `unit-summary.mjs`, `unit-run-history.mjs`, `unit-sync.mjs`, `account-rotation.mjs` (:78 key only), `case-admission-port.mjs` (execution), `unit.mjs`, `unit-state.mjs`, `patterns/**`, `src/runner/dispatch/{assignment-layout,plan,cli}.mjs` (keys / rigor call only), `agent-result-claim-contract.mjs` (posture), `src/workflow/{seats,seat-providers,definition,guide-schema,unit-handoff,units-source,ref-digests,case-start,runner}.mjs`, `src/workflow/case-admission.mjs` (floor comparison via `effectiveRigorOf` only [P00-C8, P00-C14]), `src/runner/dispatch/settlement.mjs` (role keys :290,568,776,795 [P00-C9]), `src/runner/dispatch/assignment-runner.mjs` (role keys :1172,1804,2396,2567 only), `bin/fgos.mjs` (:743 only) [P00-C9], `src/runner/work-dispatch.mjs` (`workRigorFor` → `effectiveRigorOf` [P00-C14]), `src/workflow/case-projection.mjs` (:242-246, after settle-milestones), `src/setup/{registrations,workflow-pool-independence,blind-steps-proven-pools}.mjs` (keys, :591 set, :638), `packages/convention/**` (seat id rule), `packages/run-result/contracts/unit-summary.read.v2.json` and `packages/observe/rust/src/metrics_cli/discussions.rs` (seat keys + legacy mapping), `core/workflows/*.yaml`, `docs/architecture-manifest.json`.
- Tests: `test/runner/execution/{run,bind,unit-summary,handoff-refs,run-case-admission}.test.mjs`, pattern tests, `test/workflow/*` touched by seat keys, observe Rust tests, new legacy golden test.

## Steps

1. Convention seat id rule + vectors.
2. Resolver (rigor, composition, multiplicities) + ledger + serialized queue, with unit tests.
3. Patterns onto resolver output; delete role-name branches.
4. Re-key storage and every reader; legacy read path + goldens; `seatSchema` and resume refusal.
5. Workflow schema; core workflows; `--seats` by seat.

## Tests (proofs owned)

- Two producer seats resume separately (three `producer` seats, kill after 1, resume).
- Panel producers never inline, never write (posture); ordered concurrent bind with soft spread (interleaved async bind).
- Stance recorded with explicit seats.
- `record-predates-seat-binding`; legacy panel/debate record still summarised; seat id traversal refused.
- `--units` file with `seats[].tier` refused.
- Every core workflow loads and dry-binds (current Node bind).

## Risks / rollback

- H×M a role-keyed path missed → phase 00 list + three-`producer` tests. Assignment dir names change for panel/debate seats only (solo/reviewed ids = today's role names).
- M×M conflict with settle-milestones on `case-projection.mjs` → touch only after it lands.
- Rollback: revert on the track.
