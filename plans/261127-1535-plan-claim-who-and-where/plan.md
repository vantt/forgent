---
contract: plan-v1
title: "Claiming a plan: who runs it, on which machine, recorded on origin at once"
description: "A plan's host field on origin is the one placement record. Admission on machine M admits only a plan whose host is absent or M, writes host with status running, and never leaves its commit unpushed: a paths land undoes its commit when the push is refused before sending, and a catch-up pushes this checkout's own leftover land commit. Running plans of another machine are never restarted here."
status: running
priority: P1
host: fg-server-sqs7es
blockedBy: []
base: 90a398dc7ccac053e7cb00e6c8f3579994e65b23
source:
  - plans/discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md
  - p-p5k2htczq3
created: 2026-11-27
footprint:
  - plans/261127-1535-plan-claim-who-and-where/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/src/wake.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/src/keeper.rs
  - packages/supervision/rust/tests/land.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/tests/keeper.rs
  - packages/git/rust/src/inspect.rs
  - packages/git/rust/tests/**
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - docs/platform/supervision/spec.md
  - core/skills/_shared/plan-contract.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - .agents/skills/_shared/plan-contract.md
  - .agents/skills/fgos-coding-planning/SKILL.md
  - .agents/skills/fgos-secretary/SKILL.md
  - plugins/fgOS/skills/_shared/plan-contract.md
  - plugins/fgOS/skills/fgos-coding-planning/SKILL.md
  - plugins/fgOS/skills/fgos-secretary/SKILL.md
  - CHANGELOG.md
  - packages/git/rust/src/land.rs
lead: head:lead-forgent-261127-1535-plan-c-854fd
---

# Claiming a plan: who runs it, on which machine, recorded on origin at once

Answers the settled discussion `ds-izibwo45vm` (decisions D2, D4-D9 there; D1 and D3 are superseded by D8 and D9).
Placement of this plan itself: the owner pinned it to fg-server (`host: fg-server-sqs7es`, owner chat 2026-11-27
15:35). Until phase 3 lands, fg-server's keeper admits it and no other machine should.

## Outcome

`host` in `plan.md` on origin is the one placement record, an Identity machine id (D2, D8). A `ready` plan that names
a `host` is admitted only by that machine; one with no `host` is claimed by the first machine whose admission push
reaches origin (D7). Admission writes `status: running`, `lead`, `base` and `host` in one commit, and that commit
either reaches origin or is undone (D5, D6). No machine starts, watches or restarts the lead of a plan running on
another machine (D4). No per-machine config key decides placement (D9).

## Acceptance criteria

1. `plan-v1` accepts an optional `host` on `ready` and `running` plans; `node scripts/plan-contract-check.mjs` warns
   (never errors) when the id is unknown to Identity, locally or in the shared directory
   (`test/scripts/plan-contract-check.test.mjs`). Admission on M holds a `ready` plan whose `host` is another machine
   as `held-other-machine:<host>` and writes `status`, `lead`, `base` and `host: M` in one commit
   (`cargo test -p fgos-supervision --test wake`, `--test portfolio`).
2. A paths land whose push the Git door refuses before sending anything undoes its local commit and the caller's
   bytes are restored; the test reproduces the 2026-11-27 shape (commit, pre-send `resource-recovery-required`, local
   main equal to origin afterwards) in `packages/supervision/rust/tests/land.rs`.
3. A catch-up that finds local main ahead only by this checkout's own earlier land-door commit pushes it instead of
   refusing; a test first reproduces why ded8d6557 was not recognised as its own, then covers that case
   (`packages/supervision/rust/tests/land.rs`, plus `packages/git/rust/tests/` if recognition lives there).
4. Two clones of one bare remote admitting the same plan end with exactly one claim on origin; the loser's bytes are
   restored and it reads the plan as running on the winner's machine (`cargo test -p fgos --test supervision_verbs`).
5. `supervisor plans` and the keeper never start or restart the lead of a running plan whose `host` is another
   machine, and show it as running elsewhere; a running plan with no `host` and no live lead here is held
   `host-unnamed` and raised, never restarted (`--test wake`, `--test keeper`, `--test supervision_verbs`).
6. The planner skill writes `host` only when the discussion or the owner names a machine; the secretary skill says it
   may set or change `host` on a `ready` plan through its portfolio land; a paths land that changes `host` on a plan
   already `running` at the tip is refused `host-change-refused`, except the admission commit itself
   (`packages/supervision/rust/tests/land.rs`).
7. `docs/platform/supervision/spec.md` states 1-6 (admission rules, reason codes, shared entities); `CHANGELOG.md`
   names the change; `npm test` and `cargo test --workspace` are green on the merged tree.

## Non-goals

- Forcing every plan to name a machine (discussion option B). An unpinned plan stays claimable by any machine.
- Moving a pinned plan automatically when its machine is down; a person or the secretary changes `host`.
- Moving or reassigning plans already running; branch lands of leads.
- A new lock or a new push mechanism (D7, L10, RUL104): the existing rejection-undo, `main-checkout-dirty-overlap`
  and `admission-plan-stale` make origin the lock.
- A per-machine allow-list such as `supervisor.admitPlans` (D9, supersedes D3).
- Cleaning up the pending Git operation that blocked the push on 2026-11-27; that is `fgos git recover`.

## Authority map

`fgos authority locate` answered `admission` for the admission sentences, but that row is documentation admission
(`docs/platform/documentation/subcomponents/admission/`), not plan admission. Plan admission, the keeper, the
portfolio and the paths land all live in `packages/supervision/rust/`, owned by the `supervision` row. The discussion's
"owning component `admission`" is read as this, not as the documentation row.

| New thing | Model row | Note |
|---|---|---|
| `host` frontmatter key on plans (placement record) | supervision | extends the plan record read by `portfolio.rs`; the contract check accepts it; no new contract file, `supervision/plan-vocabulary.v1` lists statuses and columns only |
| Hold reasons `held-other-machine:<host>` and `host-unnamed` | supervision | extend the existing `admission_hold` and `leadUnnamed` patterns; no new mechanism |
| Pre-send push refusal undoes the paths land commit | supervision | changes the push-outcome branch in `land.rs` `paths_commit`; classifies by the Git door's `ResultCode`, keeps only `RemoteOutcomeUnknown` |
| Catch-up recognises its own leftover land commit | supervision | fix where recognition failed (`sync_target` / `main_checkout_scoped_commits`, the latter owned by `git`); no new path (D6) |
| `host-change-refused` land refusal | supervision | extends the land door's frontmatter guard family (`footprint-change-refused`) |
| Machine id read for admission | identity | read through `fgos_identity::machine`, never a hostname (D2) |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Push outcomes of the paths land](phase-01-push-outcomes-of-the-paths-land.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, packages/git/rust/src/inspect.rs, packages/git/rust/tests/** | 1 | done |
| 2 | [Host on the plan record](phase-02-host-on-the-plan-record.md) | - | packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/portfolio.rs, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, `packages/git/rust/src/land.rs` | 1 | draft |
| 3 | [Machine-aware admission and watching](phase-03-machine-aware-admission-and-watching.md) | 1, 2 | packages/supervision/rust/src/wake.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/src/keeper.rs, packages/supervision/rust/tests/wake.rs, packages/supervision/rust/tests/keeper.rs, packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, packages/supervision/rust/src/portfolio.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs | 2 | draft |
| 4 | [Doctrine: spec and skills](phase-04-doctrine-spec-and-skills.md) | 2 | docs/platform/supervision/spec.md, core/skills/_shared/plan-contract.md, domains/coding/skills/fgos-coding-planning/SKILL.md, core/skills/fgos-secretary/SKILL.md, .agents/skills/_shared/plan-contract.md, .agents/skills/fgos-coding-planning/SKILL.md, .agents/skills/fgos-secretary/SKILL.md, plugins/fgOS/skills/_shared/plan-contract.md, plugins/fgOS/skills/fgos-coding-planning/SKILL.md, plugins/fgOS/skills/fgos-secretary/SKILL.md | 2 | draft |
| 5 | [Integrate and gate](phase-05-integrate-and-gate.md) | 1, 2, 3, 4 | CHANGELOG.md, plans/261127-1535-plan-claim-who-and-where/reports/** | 3 | draft |

Phase 1 lands first in practice: it removes the stranding on every head write, not only admission. Phases 1 and 2
share no file. Phase 3 writes `land.rs` and `portfolio.rs` after phases 1 and 2 own them in wave 1. The generated
skill surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`) are hot files with one writer, phase 4, regenerated by
`npm run build:skills`. `CHANGELOG.md` is written only in phase 5. Each phase's capability is `code:implement`;
phase 5 is `code:test`.

## Owner questions

None. Placement (C) and the machine name (Identity) were settled by the owner in chat, 2026-11-27.

## Risks and rollback

- **Misclassified push error (phase 1).** Undoing a commit whose push may have reached origin would lose the claim
  and leave origin ahead. Proof point: phase 1 reads `transfer_refs_with` in `packages/git/rust/src/remote.rs` and
  confirms every error after the transfer starts is `ResultCode::RemoteOutcomeUnknown`; if any is not, it keeps the
  commit for that code and says so in the phase report.
- **Recognition cause unproven (phase 1).** The WAL scan returns an empty list on any open or scan error, so several
  causes fit the 07:33:07Z refusal (pruned chain, unreadable WAL beside the dead pending chain, a worktree path that
  differs in the sandbox). The phase reproduces the cause before it fixes; a fix that guesses is rejected at review.
- **Running plans without `host`.** Every plan running before phase 3 has no `host`; under D4 each is this machine's
  only while its lead is live here. A dead lead of such a plan is held `host-unnamed` and raised instead of being
  restarted. That is the intended conservative change; the supervisor or secretary sets the machine by hand.
- **Rollback.** Each phase is one branch; revert its merge commit on main. Reverting phase 2 or 3 alone leaves
  `host` keys in plan files, which the old reader ignores.
