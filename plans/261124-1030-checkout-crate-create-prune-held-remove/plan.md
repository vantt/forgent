---
contract: plan-v1
title: "The checkout crate creates at any branch, path and base, prunes a missing checkout and removes under a held custody handle; the four Node checkout copies move onto it"
status: draft
priority: P1
blockedBy:
  - 261121-2110-component-authority-doors
base: 5044d4cf44accb7dd04893bf8a98f49bd08388da
footprint:
  - plans/261124-1030-checkout-crate-create-prune-held-remove/**
  - packages/execution/checkout/src/**
  - packages/execution/checkout/tests/**
  - packages/git/node-addon/src/checkout.rs
  - src/runner/worktree.mjs
  - src/runner/repo-locks.mjs
  - src/workflow/unit-handoff.mjs
  - src/runner/merge.mjs
  - scripts/lib/git-ports.mjs
  - scripts/run-tests.mjs
  - scripts/lib/test-file-watchdog.mjs
  - test/workflow/unit-handoff.test.mjs
  - test/runner/repo-locks-multiprocess.test.mjs
  - test/runner/worktree-ports.test.mjs
  - test/runner/worktree.test.mjs
  - test/runner/merge.test.mjs
  - test/runner/merge-land.test.mjs
  - test/scripts/run-tests.test.mjs
  - packages/component-authority/model/doors/checkout-make-provision-remove.yaml
  - test/architecture.test.mjs
  - packages/git/contracts/mutation-census.v1.json
  - test/suite-baseline.json
  - docs/platform/git/spec.md
  - docs/platform/runner/spec.md
source:
  - p-nwife3i4kc
  - p-fdkdy26tba
  - plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md
created: 2026-11-24
---

# Checkout crate: create at branch/path/base, prune a missing checkout, remove under held custody

Mode: standard (small, a debt repaid alone). Decisions are cited from
`plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md` §4. This is the plan D23 gives `p-nwife3i4kc`:
a P1 debt whose surviving door already exists and is settled (`fgos-checkout`, door
`checkout-make-provision-remove`), so it is repaid alone, ahead of its layer phase, picked by severity (high: four
live Node copies that make or remove a worktree and can disagree with the crate; D24, D25). It runs the fast track of
D26: step 1 (baseline), step 4 (this plan, with its delete list and tests to retire), steps 5–6 (implement, then an
independent verify), step 7 (land, activate, doctor and smoke on this machine, D11), step 8 (re-measure) and step 9
(close: net Δ ≤ 0 and the guard entry gone). It skips the council and the owner ask. **If a boundary question
appears** (for example, who owns custody of a Land candidate), the work stops at that point and the debt waits for
phase T2–T3 of HARDEN next round (D26). Backlog `p-fdkdy26tba` (the second worktree creator in unit handoff) is the
same debt and is folded in, as its row asks.

## Outcome

`fgos-checkout` is the one door that makes, prunes and removes linked checkouts for every Node caller:

- it creates a checkout at a caller-given branch, path and base, not only `fgw/<id>` branches;
- it prunes the registration of a checkout whose directory is gone;
- its remove accepts a custody hold the caller already holds (the `dispatch-cwd` custody Land holds), instead of
  taking its own.

The four Node copies move onto it and are deleted in the same change (L10, design principle 1):
`createWorktreeCheckoutSync`, `addWorktreeSync` and `addWorktree` in `src/runner/repo-locks.mjs`; the `wf/<run>/<unit>`
create in `src/workflow/unit-handoff.mjs`; Land's catch-up create and remove in `src/runner/merge.mjs`; and
`pruneMissingCheckouts` in `scripts/lib/git-ports.mjs`. The four `debt` entries of door row
`checkout-make-provision-remove.yaml` are gone, and the job leaves `NAMED_DOOR_DEBT`.

## Acceptance criteria

1. `packages/component-authority/model/doors/checkout-make-provision-remove.yaml` has no `debt` key and no
   `retiredBy` key, and `test/architecture.test.mjs` no longer lists `make, provision and remove a checkout` in
   `NAMED_DOOR_DEBT`; `node --test test/architecture.test.mjs` passes.
2. `rg -n "createWorktreeCheckoutSync|addWorktreeSync|\baddWorktree\b|pruneMissingCheckouts|createGitWorktree\(" src scripts bin`
   finds no definition or call outside the checkout door's allowed files.
3. `cargo test -p fgos-checkout` is green, including one test each for create at a given branch, path and base, for
   prune of a missing checkout, and for remove under a held custody hold (crate name from
   `packages/execution/checkout/Cargo.toml`).
4. `node --test test/workflow/unit-handoff.test.mjs test/runner/merge.test.mjs test/runner/merge-land.test.mjs test/scripts/run-tests.test.mjs test/setup/git-mutation-census.test.mjs`
   passes.
5. `npm test` and `cargo test --workspace` are green, run one at a time, on the merged tree.
6. `reports/close.md` holds the before/after table (step 1 vs step 8, this machine, same load class), the net Δ
   (Node + Rust + test) ≤ 0 or the deletion that pays for each increase, and doctor and smoke green on the activated
   release on this machine.

## Non-goals

- No change to `fgw/<id>`, dispatch or claim checkouts beyond what the shared create path needs.
- No new verb, flag or config key (RUL104); the new crate entries are reached through the existing addon namespace
  `checkout` and `src/runner/worktree.mjs`.
- No move of Land itself into Rust; only its checkout create and remove calls change (Land moves with phase T7).
- The other machines: the owner lands them (D11).
- Other door rows and debts.

## Prior art (reused, missing)

Reused: `fgos-checkout`'s `create` (its `CreateRequest` already carries `path`, `branch` and `base`, so phase 1 checks
whether "create at branch/path/base" needs only an addon entry); its `orphan.rs`, which already prunes a missing
worktree through the Git port's `prune_missing_worktree` during reclaim; its `remove` with `delivered_to`; the addon
namespace `checkout` (`packages/git/node-addon/src/checkout.rs`) and its Node bridge in `src/runner/worktree.mjs`;
the door row and its guard. Evidence for the gap: `plans/261121-2110-component-authority-doors/reports/unit-261123-2305-p6-result.md`.
Missing: a public create entry for an arbitrary branch, path and base; a public prune entry; a remove that takes a
held custody hold.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Create at a given branch, path and base (crate and addon entry) | `checkout-make-provision-remove` | survivor: `checkout-make-provision-remove` (`fgos-checkout`); retired: `src/runner/repo-locks.mjs` creation helpers, the create in `src/workflow/unit-handoff.mjs`, Land's create in `src/runner/merge.mjs` |
| Prune the registration of a missing checkout (crate and addon entry) | `checkout-make-provision-remove` | survivor: `checkout-make-provision-remove`; retired: `pruneMissingCheckouts` in `scripts/lib/git-ports.mjs` |
| Remove under a held custody hold | `checkout-make-provision-remove` | survivor: `checkout-make-provision-remove`; retired: Land's direct Git-port remove in `src/runner/merge.mjs` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Facts and baseline](phase-01-facts-and-baseline.md) | - | plans/261124-1030-checkout-crate-create-prune-held-remove/reports/facts.md | 1 | ready |
| 2 | [Crate and addon entries](phase-02-crate-and-addon.md) | 1 | packages/execution/checkout/src/**, packages/execution/checkout/tests/**, packages/git/node-addon/src/checkout.rs, src/runner/worktree.mjs, test/runner/worktree-ports.test.mjs, test/runner/worktree.test.mjs | 2 | draft |
| 3 | [Move the four callers and delete the copies](phase-03-move-callers.md) | 2 | src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs, scripts/run-tests.mjs, scripts/lib/test-file-watchdog.mjs, test/workflow/unit-handoff.test.mjs, test/runner/repo-locks-multiprocess.test.mjs, test/runner/merge.test.mjs, test/runner/merge-land.test.mjs, test/scripts/run-tests.test.mjs, packages/component-authority/model/doors/checkout-make-provision-remove.yaml, test/architecture.test.mjs, packages/git/contracts/mutation-census.v1.json, test/suite-baseline.json, docs/platform/git/spec.md, docs/platform/runner/spec.md | 3 | draft |
| 4 | [Integration, land, activate and close](phase-04-integration-and-close.md) | 3 | plans/261124-1030-checkout-crate-create-prune-held-remove/reports/close.md | 4 | draft |

Every phase uses capability `code:implement`, except phases 1 and 4, which use `code:test` (evidence and the gate).

Wave reading (checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`): the phases are
serial, because each needs the one before it. Phase 3 is one phase on purpose: the four callers, the door row, the
guard and the census change together, so no tree has a deleted copy with a stale census or a guard entry left
behind. The hot files (the door row, `test/architecture.test.mjs`, the census, `test/suite-baseline.json`) have one
writer, phase 3.

Order against other plans: the doors plan (`261121-2110`, running) also writes
`packages/component-authority/**`, `test/architecture.test.mjs` and `test/workflow/unit-handoff*`, so it is in
`blockedBy`; D22 closes it after 12b and 12d. `261122-2108-delete-dead-node-execution-closure` (draft, also waiting
for doors) shares the model, the guard, the census and `test/workflow/**`. Whichever of the two turns `ready` first
runs first, and the other adds it to `blockedBy` at its own flip; the secretary and the supervisor choose by severity
(D23, D24).

When doors is `done`: rebase `base:` onto `main`, rerun the check, set the plan and its phase rows to `ready`, and land
`plan.md` alone. Phase 1 writes only its report and is `ready` now.

## Owner questions

None. A boundary question found during the work is not asked here; it stops the work and the debt waits for its
layer phase (D26).

## Risks and rollback

| Risk | Level | Proof point |
|---|---|---|
| Land's held custody does not map onto the crate's remove without changing who holds `dispatch-cwd` | medium | phase 1 reads both hold paths; if the answer needs a new custody owner, it is a boundary question and the work stops (D26) |
| Unit handoff relies on a refusal rule the crate's create lacks (or the reverse) | medium | phase 1 lists each copy's refusal rules beside the crate's; phase 2 adds a crate test per rule kept |
| The test launcher's prune runs where the addon is not loaded | low | phase 1 checks how `scripts/run-tests.mjs` loads the addon; phase 3 keeps the launcher's existing load path |
| Census or guard drift | low | phase 3 regenerates the census and runs `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` |

Rollback: each phase lands as one commit; `git revert` of phase 3, then phase 2, restores the copies with their debt
entries. A bad release on this machine is rolled back with `fgctl repair`.
