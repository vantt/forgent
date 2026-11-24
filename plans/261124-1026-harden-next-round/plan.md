---
contract: plan-v1
title: "HARDEN next round: harden every layer still in Node with the HARDEN per-layer loop, Work last"
status: draft
priority: P1
blockedBy:
  - 261121-2110-component-authority-doors
  - 261122-2108-delete-dead-node-execution-closure
base: c9f44c83e8f7526dce369961b146b426fe449cc2
footprint:
  - plans/261124-1026-harden-next-round/**
  - packages/component-authority/model/doors/skill-generated-stamp.yaml
  - packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml
  - packages/component-authority/model/doors/kernel-lock-primitive.yaml
  - packages/component-authority/model/doors/run-bounded-child.yaml
  - packages/component-authority/model/doors/no-node-from-native-packaging.yaml
  - packages/component-authority/model/doors/process-control-signal.yaml
  - packages/component-authority/model/doors/main-checkout-activity-beacon.yaml
  - packages/component-authority/model/doors/delete-guard-keyword-list.yaml
  - packages/component-authority/model/doors/agent-hook-table.yaml
  - packages/component-authority/model/doors/read-and-clear-a-hot-mutex-record.yaml
  - packages/component-authority/model/doors/canonical-json-bytes.yaml
  - packages/component-authority/model/doors/retired-node-s5-hook-script.yaml
source:
  - plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md
  - p-2qle2tjflb
  - p-vwpnx4gpow
  - p-gikx34d7bh
created: 2026-11-24
---

# HARDEN next round

Mode: skeleton (high-risk program). This is a skeleton plan in the shape of HARDEN (`261021-1118`): one phase per
unfinished layer, each phase running the HARDEN per-layer loop and opening its own sub-plan. Every decision below is
cited by its id from `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md` §4 (D1, D6–D27); none is
reopened here. The discussion's §6 holds the frame, the loop table and the inventory; the phase files point to it
instead of copying it.

## Outcome

When the last phase closes:

- every unfinished layer (T2–T3 session, T8 supervision, T6 Workflow, T9 host/surface/packaging/report, T7 Work) has
  a settled target shape (authority, contracts and ports, one door per job, Rust/Node boundary, delete list) written
  into its component specs and the component-authority model (D7, D14);
- each layer's net size is ≤ 0, or every increase names the deletion that pays for it;
- no Node logic is left: no `legacy-cli` route and no `legacy-node` payload remain;
- program steps S6b and S7 of `261114-2051` are delivered as phases T6 and T7 here, with one owner (D18).

## Acceptance criteria

Per layer phase (the HARDEN close conditions, D7, D11), recorded in that phase's close report under `reports/`:

1. A before/after table (step 1 vs step 8) on this machine and the same load class.
2. No High-or-above finding left unreproduced.
3. Net Δ ≤ 0 (Node + Rust + test, that phase's commits only), or each increase names the deletion that pays for it.
4. `fgos doctor` and the smoke run green on the activated release on this machine (D11).
5. `npm test` and `cargo test --workspace` green on main after the phase's sub-plan lands.

For the program (phase 6):

6. Every door row whose `retiredBy` names S6b or S7 is closed (D21):
   `grep -lE '^retiredBy:.*\b(S7|S6b)\b' packages/component-authority/model/doors/*.yaml` returns nothing, and none
   of those jobs remains in `NAMED_DOOR_DEBT` (`test/architecture.test.mjs`).
7. `grep -c '"legacy-cli"' packages/host-runtime/contracts/command-routes.json` returns 0 (56 at `base`).
8. `git ls-files 'src/*.mjs' 'bin/*.mjs'` prints nothing (322 files at `base`).
9. Every HARDEN carry-over in the discussion's §3 (H1–H7, C5) is closed or declined by the owner, each with its
   source, in `reports/program-close.md`.

Door-row owners (phase 0 step 0, backlog `p-gikx34d7bh`, D21, D22):

10. Every door row names exactly one owner first, none points to a closed plan or a report, and the guard is green:
    - `grep -h '^retiredBy' packages/component-authority/model/doors/*.yaml | grep -vE '^retiredBy: "?(p-[a-z0-9]{10}|[0-9]{6}-[0-9]{4}-[a-z0-9-]+#|S6b|S7)'`
      prints nothing (`S6b` and `S7` are phases T6 and T7 of this plan, D18; step 5 of phase 0 gives each its phase);
    - `grep -hE '^retiredBy:.*(261121-2110|reports/)' packages/component-authority/model/doors/*.yaml` prints nothing;
    - `node --test test/architecture.test.mjs` passes (the `NAMED_DOOR_DEBT` guard).
    Each owner closes its rows in its own acceptance: phases 1, 4 and 5 here name theirs; `261122-2108` phases 8 and
    11 and backlog rows `p-6ectcp6jyg` and `p-tvwy24txpj` remove theirs in their own done-when.

## Non-goals

- The domain-agnostic item component: discussion `ds-ubqlutna6r` and its own plan (D19).
- Re-running T0, T1, T4 and T5: HARDEN closed them; their Node facades are deleted with their last caller (D1).
- The dead tier-5 closure and doors 12c: plan `261122-2108` (D22).
- `p-nwife3i4kc` (checkout crate): a small plan of its own (D23).
- The control-group bug rows of D20: fast track, outside this plan.
- Debt coordination across plans: the secretary and the supervisor, no plan (D23).
- New features or verbs: proposed additions go to the owner once per layer (RUL104).
- Editing other plans. The program rows S6b and S7 of `261114-2051` should point here (D18); that edit belongs to
  the secretary or that plan's own planner, since this planner writes only its own plan directory.

## Prior art (reused, missing)

Reused, not redesigned: the per-layer loop, its outputs and close rules of `261021-1118` ("The per-layer loop",
steps 1–9) and its skeleton shape (one layer phase, one sub-plan each); the §5 inventory method and §6 inventory of
`ds-wham5txfkv` as the step 0 input (D9); the component-authority model and `fgos authority locate` for the
system-wide job → doors map (D15); `NAMED_DOOR_DEBT` and the door rows' `retiredBy` as the debt ledger (D22–D25);
`fgos convention path --kind plan` for every sub-plan directory.

Missing, added here as process only: the triage column (council weight full/light/skip, D13), the system-wide
one-door map (D15), and the debt-by-severity order inside each sub-plan (D24, D25). None is a new mechanism in code.

## Authority map

The skeleton itself introduces no code. Each new artifact or move it schedules maps to an existing model row (checked
with `fgos authority locate`, 2026-11-24). Each sub-plan writes its own Authority map for what its council settles.

| New thing | Model row | Note |
|---|---|---|
| System-wide job → doors map (phase 0 report, refreshed at each layer close) | `component-authority` | A report read from `owns`, `mustNotOwn`, `decision-kinds.yaml`, `contracts.yaml` and `doors/`; a job the model lacks goes to the model's owner first (D15). No new contract |
| Council-weight triage per component (phase 0 report) | `component-authority/model.v1` | Read-only judgement over the model rows (D13) |
| Session layer target shape and delete-guard verdict | `session-host`, `session-rotation`, `git` | Settled by the T2–T3 council (D12) |
| Supervision target shape | `supervision` | T8 council or light sub-plan (N4) |
| Workflow target shape (S6b) | `workflow`, `work-driver` | T6 council |
| Host, surface, packaging and report target shapes | `host-surface`, `packaging-distribution`, `learning-docs-registry`, `host-invocation-routing` | T9 council; door `node-rows-bridge` and `no-node-from-native-packaging` close here (D22) |
| Work target shape (S7), keep/shrink/delete | `work-state`, `runner` | Decision 78 council (D18) |
| Removal of `legacy-cli` routes and the `legacy-node` payload | `host-invocation-routing`, `docs.host-invocation-routing/legacy-payload` | survivor: `host-invocation-routing` (Rust host); retired: `bin/fgos.mjs`, `src/**/*.mjs`, every `legacy-cli` row of `packages/host-runtime/contracts/command-routes.json` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 0 | [Recount, triage and one-door map (gated); step 0 door-row owners (no gate)](phase-00-recount-triage-door-map.md) | - | plans/261124-1026-harden-next-round/reports/phase-00, packages/component-authority/model/doors/ (the twelve `retiredBy` lines of step 0) | 1 | draft |
| 1 | [Layer T2–T3 session](phase-01-layer-t2-t3-session.md) | 0 | plans/261124-1026-harden-next-round/reports/phase-01 | 2 | draft |
| 2 | [Layer T8 supervision](phase-02-layer-t8-supervision.md) | 1 | plans/261124-1026-harden-next-round/reports/phase-02 | 3 | draft |
| 3 | [Layer T6 Workflow (program step S6b)](phase-03-layer-t6-workflow.md) | 2 | plans/261124-1026-harden-next-round/reports/phase-03 | 4 | draft |
| 4 | [Layer T9 host, surface, packaging and report](phase-04-layer-t9-host-surface-packaging.md) | 3 | plans/261124-1026-harden-next-round/reports/phase-04 | 5 | draft |
| 5 | [Layer T7 Work, last (program step S7)](phase-05-layer-t7-work.md) | 4 | plans/261124-1026-harden-next-round/reports/phase-05 | 6 | draft |
| 6 | [Program close](phase-06-program-close.md) | 5 | plans/261124-1026-harden-next-round/reports/program-close.md | 7 | draft |

Wave reading (checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`): the phases are
strictly serial by decision, not by file overlap. A layer's council opens only after the layer below closes (D7, D8,
D17), so each layer sits in its own wave in the order T2–T3 → T8 → T6 → T9 → T7. The skeleton's own footprints are
each phase's report directory and are disjoint. The code each layer changes is owned by that layer's sub-plan, which
carries its own footprint, `blockedBy` and Authority map and is admitted on its own; cross-plan overlap is checked
there, not here. Phase 6 is the integration phase: it re-runs the full gate on the combined tree and the program
acceptance.

Deviation from the one-to-two-day phase size: a layer phase is a HARDEN layer loop. Its own work (baseline, council,
arbitration, owner ask, re-measure, close) fits a short leader; the implementation runs in its sub-plan's phases,
which are sized there. This is the HARDEN precedent (`261021-1118` phases 01–07).

Gates that hold only some phases:

- Phase 0 step 0 (one owner on twelve door rows) has no gate and runs first, the two high rows leading. This planner
  cannot write the model, and the plan is not admitted until the owner approves it, so step 0 runs as one supervisor
  chore (`fgos run` with `--writes` on the twelve files, in a linked worktree), the table in the phase file being
  its whole brief. Its files sit inside `261122-2108`'s footprint (`packages/component-authority/model/**`), and
  `261122-2108` phases 8 and 11 rewrite `retiredBy` lines of the same model: step 0 changes only the twelve lines
  named, so whichever lands second rebases a one-line conflict at most.
- Phase 0 waits for doors `261121-2110` to close (12a, 12b, 12d) and `261122-2108` to land with 12c folded in (O7,
  D6, D22, D27). That is the plan's `blockedBy`.
- Phase 1 takes its baseline after the D20 control-group bug rows have landed; a row still open becomes an input.
  Its steps 1–3 need no other wait (D12).
- Phase 5 opens only after `ds-ubqlutna6r` is settled and its plan has landed (D19). That plan does not exist yet, so
  it cannot be listed in `blockedBy`; phase 5's file holds the gate, and the lead adds the plan dir to `blockedBy` of
  the T7 sub-plan once it exists.

Debt inside a phase follows D24–D26: the sub-plan orders its debts by severity; a debt whose surviving door is
already settled may be repaid alone ahead of its layer on the fast track (steps 1 and 4–9); a debt that meets a
boundary question stops and waits for its layer phase.

## Owner questions

None. Every open point is a gate with a named condition (above), and each layer phase asks the owner once, in a batch,
at its own step 3 (D7). There is no question the planner must ask before phase 0.

## Risks and rollback

| Risk | Effect | Proof point / mitigation |
|---|---|---|
| Doors or `261122-2108` stall | Phase 0 never opens | Both are on the supervision queue (D22); the secretary orders them. Nothing here moves them |
| Phase 0 recount differs widely from §6 | Phase scopes shift | Phase 0 is read-only and its report re-assigns rows; layer phases read the report, not §6 |
| A council finds a boundary that crosses into a later layer | Rework | D14 and D25: boundary first; cross-layer debt waits for its own layer |
| `ds-ubqlutna6r` never settles | Phase 5 cannot open, program acceptance 7–8 unmet | Phases 0–4 still close and deliver; the T7 gate is visible in its phase file |
| Net Δ > 0 in a layer (as HARDEN T6, T9) | Close condition fails | Close requires each increase to name the deletion that pays for it; otherwise the layer does not close |
| Tests or doctor red after a land | Release on this machine broken | Step 7 lands on this machine first (D11); `fgctl repair` reactivates the previous release |

Rollback: each layer's code lands through its own sub-plan and reverts there. The skeleton writes only reports under
its directory; reverting a phase is reverting its report commit and setting its row back to `ready`.
