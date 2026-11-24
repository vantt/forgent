# Phase 1: Facts and baseline

Capability: `code:test`. Read-only; writes one report.

## Inputs

- `plan.md` of this plan, and backlog rows `p-nwife3i4kc` and `p-fdkdy26tba` (`plans/backlog/`).
- `packages/execution/checkout/src/create.rs`, `remove.rs`, `orphan.rs`, `work_create.rs`, `lib.rs`.
- `packages/git/node-addon/src/checkout.rs`, `src/runner/worktree.mjs`.
- The four copies: `src/runner/repo-locks.mjs` (`createWorktreeCheckoutSync`, `addWorktreeSync`, `addWorktree`),
  `src/workflow/unit-handoff.mjs` (the call near line 343), `src/runner/merge.mjs` (`createGitWorktree` and the
  `worktrees.create` and `worktrees.remove` calls near lines 675–733), `scripts/lib/git-ports.mjs`
  (`pruneMissingCheckouts`) and its callers `scripts/run-tests.mjs` and `scripts/lib/test-file-watchdog.mjs`.
- `packages/component-authority/model/doors/checkout-make-provision-remove.yaml`.
- `plans/261121-2110-component-authority-doors/reports/unit-261123-2305-p6-result.md`.

## Files it may write

`plans/261124-1030-checkout-crate-create-prune-held-remove/reports/facts.md`

## Steps

1. For each copy, write what it does: branch naming, path, base, the holds it takes or expects to hold, the refusal
   rules, provisioning, and the callers.
2. For each, say what the crate already offers. `CreateRequest` already has `path`, `branch` and `base`; say whether
   only an addon entry is missing. Say whether `orphan.rs`'s `prune_missing` can become a public entry as it is.
   Say how `remove` takes its holds and what Land's held `dispatch-cwd` custody needs.
3. Name any boundary question (a new custody owner, a different refusal policy). If there is one, stop: write it in
   the report, set this plan's phase rows 2–4 to `draft` with a note, and tell the supervisor; the debt waits for
   phase T2–T3 of HARDEN next round.
4. Baseline (step 1 of the loop): on current `main`, on this machine, record the wall time of
   `node --test test/workflow/unit-handoff.test.mjs test/runner/merge.test.mjs test/runner/merge-land.test.mjs`
   and of `cargo test -p fgos-checkout`, the line counts (Node, Rust, test) of the files in this plan's footprint, the
   test counts, and the main SHA.
5. List the tests to retire: each test that proves only a copy, with the crate test that will own its behaviour.

## Verify

`reports/facts.md` answers steps 1–5 with a file and line for each claim, and either names no boundary question or
stops as step 3 says.

## Rollback

Delete the report.
