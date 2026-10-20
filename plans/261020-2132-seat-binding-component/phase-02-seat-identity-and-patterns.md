# Phase 02: seat identity, storage keys, one seat resolver, patterns as seats, core workflows

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). Parallel with 01 only (03 and 04 start after 02 merges: shared `run.mjs` and `docs/architecture-manifest.json`). Works on today's Node `bind()`; no crate needed.

## Context

- Spec §5.1 (workflow declares `seats:`), §6.1 (seat contract, composition), §6.2 (launch order), §6.3 (independence table: only the role/posture side here), §8 step 1 (records).
- Today: role ledger keyed by role `src/runner/execution/role-ledger.mjs:20-34`; panel roles `patterns/panel.mjs:26-33` (`panelist-N`, `params.role`, `members`); debate roles `patterns/debate.mjs:35-43`; `CHECKER_ROLES` `bind.mjs:19-24`; stance `patterns/role-tasks.mjs` (~:100 `kind === 'panelist'`); launch counting `src/runner/execution/case-admission-port.mjs:17,66-77`; `unit-summary.mjs:67,84-88`; handoff refs `handoff-refs.mjs:12-13`; `--seats` `src/workflow/seats.mjs:124,172`.
- Do not touch `src/workflow/case-admission-port.mjs` or `case-projection.mjs` (settle-milestones lane) or `core/skills/fgos-cook/**` (COOK P5).

## Requirements

- Every bind ask/result and every attempt record carries `seat` (unique in unit), `role` (one of `producer, synthesizer, reviewer, red-team, judge`) and `posture` (`readOnly`, `forceOutOfProcess`, panel-member stance). Write/launch behaviour reads posture, never role; `CHECKER_ROLES` and `isCheckerOrPanelRole` are deleted.
- One seat resolver (`src/runner/execution/seat-resolver.mjs`, new) returns the ordered seat list for execution, `dry-bind`, doctor and admission launch counting; validates unique seat ids, role vocabulary and pattern multiplicities. Composition per §6.1: solo → `producer`; reviewed → `producer` + one seat per checker role from `checkersByRigor[effectiveRigor] ∪ minCheckers`, seat id = role name unless declared; panel/debate → `seats:` required.
- Checker names: `checkersByRigor` and `minCheckers` entries (`VALID_CHECKER_ROLES`, `src/runner/dispatch/config.mjs:1383`, used at :1350, :1438) are checker **seat** names; resolver maps `reviewer`→role `reviewer`, `red-team`→role `red-team`, `tester`→role `reviewer` (plan decision 8). The set is renamed `VALID_CHECKER_SEATS` with that mapping beside it.
- Remove `params.members`, `params.role`, `params.synthesizeRole`, `panelist-N` `roleTasks` keys, role `panelist`; `roleTasks` and `workflow start --seats` keyed by seat. Debate: `thesis`/`antithesis` = seats with role `producer`, `judge` = seat with role `judge`.
- Storage keyed by `unitRun + seat + round + attempt`: seat ledger (rename `role-ledger.mjs` → `seat-ledger.mjs`, same pure shape), assignment dirs, `unit.json` seats, panel/debate resume, handoff refs, unit summary.
- Launch order §6.2: bind and publish each seat to the ledger before the next seat binds; parallel launch only after the whole batch is bound. Keep it explicit (not reliant on one synchronous stretch, `role-ledger.mjs:13-17`), because 04's facade is a subprocess.
- Stance from panel-member posture.
- Record fence: `unit.json` gains `seatSchema: 1`; resume of a record without it is refused `record-predates-seat-binding`.
- Workflow schema (`src/workflow/definition.mjs`, `guide-schema.mjs`) accepts `seats: [{seat, role, persona?, tier?}]` (tier validated against the vocabulary; read only from 06) and refuses `prefer`, `executor`, `overrides` on a workflow unit, including `--units` files (plan decision 7).
- Core workflows converted to explicit `seats:` for every panel/debate unit: `architecture-advisory.yaml` (shape-proposals per spec §9.2, `system` seat with `tier: frontier`; existing lens texts move to seat-keyed `roleTasks`; personas only where a persona file already exists), `nominal-group.yaml`, `group-cognition.yaml` (panel + debate per §9.3, judge `tier: flagship`), `council-lite.yaml`, `business-discussion.yaml`, `delphi.yaml` (two units). Presets in `patterns/presets.mjs` (`consult`, `research-fan-out`, `rfc`) converted the same way.

## Files

- Create: `src/runner/execution/seat-resolver.mjs`, `src/runner/execution/seat-ledger.mjs` (replaces `role-ledger.mjs`, deleted).
- Modify: `src/runner/dispatch/config.mjs` (checker seat names only, :1350-1440), `bind.mjs` (posture only), `run.mjs`, `dry-bind.mjs`, `handoff-refs.mjs`, `unit-summary.mjs`, `case-admission-port.mjs` (execution), `unit.mjs`, `unit-state.mjs`, `patterns/{panel,debate,reviewed,solo,role-tasks,presets,index}.mjs`, `src/workflow/{seats,seat-providers,definition,guide-schema,unit-handoff,units-source}.mjs`, `src/setup/{workflow-pool-independence,blind-steps-proven-pools}.mjs` (resolver only), `core/workflows/*.yaml`, `docs/architecture-manifest.json` (new modules).
- Tests: `test/runner/execution/{run,bind,unit-summary,handoff-refs,run-case-admission}.test.mjs`, `test/runner/execution/patterns/*`, `test/workflow/*` touched by seat keys.

## Steps

1. Resolver + ledger with unit tests (multiplicities, unique ids, composition per pattern).
2. Move patterns onto resolver output; delete role-name branches and `CHECKER_ROLES`.
3. Re-key storage; add `seatSchema` and the resume refusal.
4. Workflow schema and core workflow conversion; `--seats` by seat.
5. Explicit bind-publish-launch ordering with a test that interleaves an async bind.

## Tests (proofs owned)

- Two producer seats resume separately (panel with 3 producers, kill after 1, resume).
- Panel producers never inline, never write (posture), ordered concurrent bind with soft spread.
- Stance recorded with explicit seats.
- `record-predates-seat-binding` on a pre-fence `unit.json`.
- Every core workflow loads and dry-binds (current Node bind).

## Risks / rollback

- H×M: a role-keyed path missed → two seats share a slot. Mitigation: phase 00 list; test with three `producer` seats in every pattern that allows it.
- Assignment dir names change for panel seats only (solo/reviewed seat id = role name keeps paths). Drain (09) covers in-flight records.
- Rollback: revert the merge on the track.
