# Owner answer q-t3jfp6mg6a: sweep worktrees of done/withdrawn plans

Answered 2026-11-28T01:02Z (owner via secretary): option "Sweep worktrees of done/withdrawn plans". Scope: only
worktrees of done or withdrawn plans that no live session or run uses, through fgos worktree remove; never running or
ready plans, the main checkout or origin.

Sweep 2026-11-28 by head:supervisor-forgent on fg-server2 (disk then 71G free, 42 worktrees):
- Removed: 261127-0151-ready-plan-runs-unattended-p05f, -p05g, 261128-0105-backlog-index-generated-p02.
- Refused by the door, handed to lead:SUPERVISOR (mail 1da8897d51fc719d): 261122-0056-orchestration-skeleton-p12, -p16,
  261128-0105-backlog-index-generated-p03, 261127-1220-confined-rust-offline-p01 (delivery-unproven, squash-landed);
  261125-2041-gather-fgos-rules-to-one-owner-p01, 261126-2324-changelog-fragments-and-skill-surface-regeneration-p01
  (worker-state-preserved); 261127-0151-ready-plan-runs-unattended-p04, release-check-chk-c-16037-1795830553634 (dirty).
This answer also settles the single-worktree asks q-2smabpi5bz, q-o6l2tbf6nr, q-42sigq3of6 and q-pkvxdfpg3n.
