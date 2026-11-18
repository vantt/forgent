# Owner question: which history reader the discussion status source (phase 14) uses

Asked by lead:SUPERVISION, 2026-11-18. Plan 261118-1045-project-supervisor, phase 14. Phase 14 is parked on branch
`sv/p14` (commit 7a4cd6dfb). No other phase waits on it before phase 16 wiring.

**Chuyện gì đang xảy ra:** Phase 14 emits a record when a `docs/discussions/*/DISCUSSION.md` marker flips on the trunk.
The supervisor uses it to start a planner for a settled discussion. The phase forbids a second history reader: if no
reusable one exists, it must stop for your choice (step 0). The seat built its own reader anyway (first-parent walk +
changed paths + blob reads, through Git component calls), and the codex review flagged exactly that.

**Nguyên nhân:** I checked what exists on main.
- The only history reader is ops-metrics' `commit_records` in `apps/fgos/src/wiring/observe_sources/plan_history.rs`.
  It is private to that source and walks every branch for `plan.md` front matter.
- It is slow: queries over `fgos.plan.*` take 30-80 s on this repository, longer than the watcher's 60 s interval.
- The fix for both is backlog row `p-vtalldv5zn`: one Git door call, `walk_changes` (commits that change a path set
  since a point). It is `proposed`, and no plan or lead owns it. The OPS-METRICS lead has closed.

**Các lựa chọn:**
- **A. Keep phase 14's own reader now; both readers move to `walk_changes` later.**
  - Gain: the discussion trigger works as soon as phase 16 wires it.
  - Harm: a second history walker sits beside plan_history (L10 debt) until `p-vtalldv5zn` lands.
  - Cost: about 1 hour (fix the review's root-commit and rename defects); it adds a line to `p-vtalldv5zn`.
- **B. Build `walk_changes` in the Git crate now (new phase 14a in this plan, OPC review); phase 14 and plan_history
  both read through it.**
  - Gain: one door; plan queries also get fast, which the watcher needs (the 30-80 s cost above).
  - Harm: it touches `apps/fgos/src/wiring/observe_sources/plan_history.rs`, which ops-metrics owns, and the
    ops-metrics lead has closed. This plan grows by one Git phase.
  - Cost: about 300-500 lines of Rust plus tests in `packages/git/rust` and plan_history, about 1 day. It closes
    `p-vtalldv5zn`.
- **C. Drop the discussion trigger for now.** The supervisor learns about settled discussions from the secretary's
  handoff (today's path), and phase 14 waits until `p-vtalldv5zn` is planned by someone.
  - Gain: no new mechanism, no debt.
  - Harm: "discussion settled -> planner starts" is not automatic, so you or the secretary must start the planner.
  - Cost: none now; the `discussion-settled` definition stays unmeasured.

**Khuyến nghị:** B. The 30-80 s plan-history cost already hurts the watcher (phase 16 records it as a risk). One door
fixes that and gives phase 14 its reader without a copy. Choose A if you want the trigger sooner and accept a known
second walker for a while.

**Phạm vi của câu trả lời:** "B" authorizes a new phase 14a with footprint `packages/git/rust/src/**` (one new door
call), `packages/git/rust/tests/**`, `docs/platform/git/spec.md` and `apps/fgos/src/wiring/observe_sources/plan_history.rs`,
reviewed by lead:OPC, which closes `p-vtalldv5zn`. Phase 14 is then reworked onto it. "A" authorizes landing phase 14's own
reader after the review fixes, plus a note on `p-vtalldv5zn`. "C" parks phase 14 and marks it withdrawn for this plan.
No option changes another phase.

## Answer

Owner, 2026-11-18 (relayed by the supervisor): **B**. Phase 14a is added to the plan with the footprint above, reviewed
by lead:OPC; it closes `p-vtalldv5zn`; phase 14 is reworked onto it.
