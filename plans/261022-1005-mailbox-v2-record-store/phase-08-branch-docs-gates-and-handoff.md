---
phase: 8
title: "Branch docs, full gates, review, hand-off"
status: pending
depends_on: [7]
---

# Phase 8: Branch docs, full gates, review, hand-off

## Requirements

1. **Branch spec `docs/platform/agent-mailbox/spec.md`:**
   - header `Implementation status`: V2 built on the branch;
   - §4.1 table and "Source" line: `src/record/` and its files;
   - §6.4: the layout (`<fgosDir>/runtime/mailbox/record/snapshot.json`, `record/bodies/<id>.body`, and `runtime/mailbox/` itself left for files written without the mutex), named as owned by `record/paths.rs`; the commit-point rule (an error only before the rename); the per-hold directory check and the `O_NONBLOCK` regular-file reads; the lock row as added; "Mutual exclusion" sentence "V2 proves this on the mailbox's own path" becomes the proof reference (`tests/record_crash.rs`); body-before-snapshot and the two-part garbage collection; the rule that any new file in the record directory must be added to `Paths::is_known`; version 1 frozen by the fixture;
   - §10: the two crash rows point at `tests/record_crash.rs`; a row "A body file is replaced by a symlink or a larger file" -> "read refused, framed as body-missing";
   - §11: mark the V2 Core-suite items with their owning test files;
   - §14 V2 row: "Built on branch" with the proof command and the cost report link;
   - §16/§17: plan decisions 1-13 as agent decisions; owner questions Q1 and Q2 of this plan in §16 with their provisional defaults.
2. **Holder-lock spec** already edited in phase 1; verify it.
3. **Full gates on a fresh main merge:**
   - `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all --check`;
   - `npm test`;
   - `fgos doctor` check `git-mutation-one-door` green (census current);
   - `fgos convention check --all --json`: no violation names a file the plan added under `plans/` or `docs/`.
4. **Review:** an `ak-code-review` of the branch diff since V3's close. Report path from `fgos convention path --kind report --type review --slug mailbox-v2-final-review --json`. Fix Critical/High before closing; Medium either fixed or listed with a reason.
5. **Close:** `plan.md` `status: completed`, every phase `status: done`; push; report to the controller (board row `MAIL`, which the controller updates).

## Gates

The list in requirement 3. Long commands follow the plan's "exit must be observable" rule.

## Done when

All gates green on a fresh main merge, the review has no open Critical/High, and the controller has the hand-off: proof command, cost report path, owner questions Q1/Q2 and their current defaults, and what V4 inherits (the hold API, `Record::body`, `hook.lockWaitMs`).
