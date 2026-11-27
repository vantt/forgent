---
contract: plan-v1
title: "Claiming a plan: one host record on origin decides which machine runs it, and an admission either reaches origin or is undone"
status: withdrawn
priority: P1
host: fg-server-sqs7es
blockedBy:
  - 261126-2324-changelog-fragments-and-skill-surface-regeneration
base: 7b5c0f025ee8ccdee3c98a9f9a7ef936c58ebea0
footprint:
  - plans/261127-1536-plan-claim-who-and-where/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - packages/git/rust/src/inspect.rs
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/src/wake.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/src/keeper.rs
  - packages/supervision/rust/tests/keeper.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - docs/platform/supervision/spec.md
  - changelog.d/261127-1536-plan-claim-who-and-where.md
source:
  - plans/discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md
  - p-p5k2htczq3
created: 2026-11-27
---

# Claiming a plan: who runs it, on which machine

**Withdrawn as a duplicate (2026-11-27).** Two planner sessions wrote a plan for the same discussion at the same
time. [261127-1535-plan-claim-who-and-where](../261127-1535-plan-claim-who-and-where/plan.md) landed first and is
the plan that runs; this one is kept for history only and must not be admitted.

Answers the settled discussion
[ds-izibwo45vm](../discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md) (decisions D2, D4-D9; D1 and
D3 are superseded there and are not built). The owner pinned this plan to fg-server (`host: fg-server-sqs7es`,
discussion hand-off "Placement of this plan").

## Outcome

Which machine runs a plan is decided from one record every machine reads: `host` in `plan.md` on origin (D8, D9).
A plan that names a `host` while `ready` is admitted only by that machine; a plan with no `host` is claimed by the
first machine whose admission push reaches origin (D7). Admission writes `status: running`, `lead`, `base` and
`host: <Identity machine id>` in one commit (D2), so origin shows at once which lead runs the plan and where. No
other machine admits it, watches it as its own or restarts its lead (D4). An admission commit either reaches origin
or is undone; it never sits on one machine's local main (D5, D6).

## Acceptance criteria

1. `plan-v1` accepts an optional `host` on `ready` and `running` plans. `node scripts/plan-contract-check.mjs` warns
   (never fails) when the id is unknown to Identity, through the local machine id or the shared directory; proven in
   `test/scripts/plan-contract-check.test.mjs`. Admission on machine M admits a `ready` plan only when `host` is
   absent or equal to M, holds any other as `held-other-machine:<host>`, and writes `status: running`, `lead`, `base`
   and `host: M` in one commit; proven in `packages/supervision/rust/tests/portfolio.rs` and
   `packages/supervision/rust/tests/wake.rs`.
2. A paths land whose push the Git door refuses before sending anything (`resource-recovery-required`,
   `resource-busy`) undoes its local commit and restores the path. A test in `packages/supervision/rust/tests/land.rs`
   reproduces the 2026-11-27 shape: commit, pre-send refusal, local main equal to origin afterwards.
3. A catch-up that finds local main ahead only by this checkout's own earlier land-door commit pushes it instead of
   refusing `write-branch-ahead`. `packages/supervision/rust/tests/land.rs` proves why ded8d6557 was not recognised as
   its own and covers that case.
4. Two machines admitting the same plan end with exactly one claim on origin; the loser restores its bytes and reads
   the plan as running on the winner's machine. Proven with two clones of one bare remote in
   `apps/fgos/tests/supervision_verbs.rs`.
5. `supervisor plans` and the keeper never start or restart the lead of a running plan whose `host` is another
   machine, and show it as running elsewhere. A running plan with no `host` belongs to this machine only while its
   lead is live here; otherwise it is held as `host-unnamed` and raised, never restarted. Proven in
   `packages/supervision/rust/tests/wake.rs` (and `keeper.rs` if the keeper can start a lead role).
6. The planner skill writes `host` when the discussion or the owner names a machine and leaves it out otherwise; the
   secretary may set or change `host` on a `ready` plan through its portfolio land; only admission writes `host` on a
   `running` plan. Read in `domains/coding/skills/fgos-coding-planning/SKILL.md`,
   `core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md` and
   `core/skills/_shared/plan-contract.md`.
7. `docs/platform/supervision/spec.md` (admission rules, reason codes, shared entities) states 1-6, a changelog
   fragment names the change, and `npm test` and `cargo test --workspace` are green.

## Non-goals

- Forcing every plan to name a machine (discussion option B). An unpinned plan stays claimable by any machine.
- Automatic moving of a pinned plan when its machine is down. A person or the secretary changes `host`.
- Moving or reassigning plans already running.
- Any change to branch lands of leads.
- Cleaning up the pending Git operation that blocked the push on 2026-11-27; that belongs to `fgos git recover`.
- Any per-machine config key for placement (D9 drops `supervisor.admitPlans`), any new lock (D7) or new push
  mechanism (D6, L10, RUL104).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `host` key in `plan-v1` frontmatter (an Identity machine id) | `admission` | extends the plan record admission already reads (`Plan` in `portfolio.rs`) and the contract check; `supervision/plan-vocabulary.v1` lists no frontmatter keys and stays unchanged. The id is read from `identity` (`packages/identity/rust/src/machine.rs`), never a hostname |
| Hold reasons `held-other-machine:<host>` and `host-unnamed` | `admission` | same classifier as `held-blocked` (`admission_hold`) and the `leadUnnamed` view; no new door |
| Pre-send push refusal undoes the paths land's local commit | `supervision` | fixes `paths_commit`/`push_local` in `land.rs`; reuses `undo_commit`; no new mechanism |
| Catch-up recognises this checkout's own leftover land-door commit | `supervision`, `git` | fixes recognition where it failed (`sync_target` `pushed_orphan` or `main_checkout_scoped_commits`); survivor: existing `pushed_orphan` path; retired: nothing |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Push outcomes of the paths land](phase-01-push-outcomes.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, packages/git/rust/src/inspect.rs, plans/261127-1536-plan-claim-who-and-where/reports/push-outcomes-cause.md | 1 | draft |
| 2 | [Host on the plan record](phase-02-host-field.md) | - | packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/portfolio.rs, apps/fgos/src/wiring/supervision.rs, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, core/skills/_shared/plan-contract.md | 1 | draft |
| 3 | [Machine-aware admission and watching](phase-03-machine-aware.md) | 2 | packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/wake.rs, packages/supervision/rust/src/keeper.rs, packages/supervision/rust/tests/keeper.rs, apps/fgos/src/wiring/supervision.rs, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-secretary/SKILL.md, domains/coding/skills/fgos-coding-planning/SKILL.md, plans/261127-1536-plan-claim-who-and-where/reports/keeper-lead-start.md | 2 | draft |
| 4 | [Two-clone race, spec and integration](phase-04-race-spec-integration.md) | 1, 3 | apps/fgos/tests/supervision_verbs.rs, docs/platform/supervision/spec.md, changelog.d/261127-1536-plan-claim-who-and-where.md, plans/261127-1536-plan-claim-who-and-where/reports/integration.md | 3 | draft |

Checked with `node scripts/plan-contract-check.mjs --plan plans/261127-1536-plan-claim-who-and-where` and
`fgos resource-check --plan plans/261127-1536-plan-claim-who-and-where`. Phases 1 and 2 share wave 1, and their
footprints do not overlap. Phase 3 comes after phase 2 because it reads `Plan.host`; both write `apps/fgos/src/wiring/supervision.rs`, in different waves. Phase 4 holds the race test,
which needs phases 1 and 3, plus the spec, the changelog fragment and the full gate. The plan is `blockedBy` the
running changelog-fragments plan because that plan's footprint holds `land.rs` and `tests/land.rs`. Its phase 1 is
done and only its integration phase remains. Generated skill copies under `.agents/skills/` are regenerated by the
land door once that plan lands, so they are not in this footprint.

## Owner questions

None. Every decision this plan needs is settled in the discussion (D2, D4-D9) and its hand-off.

## Risks and rollback

- **The pin is not enforced until phase 3 lands.** Nothing today stops another machine's keeper from admitting this
  plan once it is `ready` and unblocked; only fg-server's keeper should admit it. The planner session that wrote
  this plan ran on fg-server2 (`fg-server2-jdp2bv`); the supervisor on any other machine must leave it alone.
- **Phase 1 proof point (medium).** The cause of the second hole (why ded8d6557 was not recognised as this
  checkout's own) is not yet proven. Candidates read from code: the WAL scan bound in
  `main_checkout_scoped_commits` dropped the chain, the commit's chain carried no `Commit` outcome, the `break` on
  the first unrecognised commit, or the catch-up not holding the merge slot. Phase 1 proves the cause with a failing
  test before changing code.
- **Two-clone race (medium).** It relies on the existing rejection-undo plus `main-checkout-dirty-overlap`. If the
  test shows a last-writer-wins path, phase 4 stops and reports instead of adding a lock (D7).
- **Rollback.** Each phase lands as its own commit; revert that commit. A `host` key left in a plan file is ignored
  by older code, because `read_plan` and the contract check tolerate unknown keys.
