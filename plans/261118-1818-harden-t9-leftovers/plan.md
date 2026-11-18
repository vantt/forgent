---
title: "HARDEN T9 leftovers: doctor row timing, fixture echo, empty RouterPolicy"
description: "Three of the four T9 leftovers the root closing report listed, chosen by the owner on 2026-11-18, plus the one deliberately deferred (the admission gate)."
status: pending
priority: P2
effort: ~1d
branch: main (plan only; each phase runs on its own track branch in its own linked worktree from origin/main)
tags: [harden, t9, doctor, host-runtime]
blockedBy: []
blocks: []
created: 2026-11-18
---

# HARDEN T9 leftovers

Source: `plans/reports/closing-261118-1344-harden-root-closing.md` section 7, item 3. The owner chose on 2026-11-18: do 1, 2 and 4, leave 3 for later. Each change must leave the system smaller or equal (RUL104): no new feature, layer or mechanism beyond the one named.

| Phase | Item | Backlog | Decision |
|---|---|---|---|
| 1 | `fgos doctor --json` carries per-row timing (owner pick 2b, 2026-10-21) | p-syd72acyow | do |
| 2 | `test.fixture.echo` leaves the production catalog; the test-only provider moves under tests | p-s2qkffw2cr | do |
| 3 | Admission gate that can never refuse (`authority_gate.rs`, `allow_catalog_policies`) | p-ltwb2h3k6s | not now: a real fix needs an external policy source, which is a new mechanism; carried by the code comment as a later composition-root obligation |
| 4 | Empty `RouterPolicy` is deleted with every caller in the same change | p-afwjbaupv7 | do |

Order: phase 2 then phase 4 (same crate, `packages/host-runtime/rust`, one writer), phase 1 alongside them (doctor code, disjoint files). Phase 3 stays open.

## Acceptance

- Phase 1: every row of `fgos doctor --json` carries its own elapsed milliseconds, measured in the component that runs the row; one red test first; the doctor wall time does not grow by more than noise.
- Phase 2: `rg "test.fixture.echo"` finds nothing in non-test source; the production catalog no longer lists it; tests that need an echo operation build it in their own fixture; net lines at most zero.
- Phase 4: `rg "RouterPolicy"` finds nothing; selection logic unchanged; all callers moved in the same commit.
- Every phase: focused tests, then `cargo test --workspace` for touched crates, impact analysis before editing a symbol, `detect_changes` before commit.

## Phase files

Phases are small enough to run from this table; no separate phase files. Evidence and file:line for each item: closing report section 6 (T9 inputs, verified one by one).
