# Unit I33 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I33`,
worktree `.claude/worktrees/coordination-skill-harness-i33-group-thinking-reclassification`,
base `main@222110373` (post-I30), integrated `main@5f4ed37b8`.

Phase 7 item 4a, substantially narrowed after decomposition review found
the original protocol-id rename technically unsafe (no alias mechanism in
`protocol-loader.mjs`). File-disjoint from I31, ran in parallel.

## Implementer (sonnet, fullstack-developer)

Reclassified the `group-thinking` protocol pack's 6 members via a new
per-member `kind` field (`discussion`/`advisory-panel`/`coordination-loop`)
plus a `metadata.description`, rather than physically splitting into
multiple pack files. Correctly rejected the split option with real
consumer-code evidence: `group-thinking-pack.mjs`'s `defaultPackPath`/
`GROUP_THINKING_PACK_FILE` hardcode a single pack-file path with no
selection mechanism anywhere, and `fgos-architecture-panel/SKILL.md`
genuinely dispatches `architecture-advisory-panel-v1` through this exact
gate (`runGroupThinkingRequest`) — a split would have broken that live
dispatch path without also touching files outside this unit's ownership.
Verified `assertPackShape` tolerates the new field (no exact-shape
validation) before committing to the approach. Documented a real, honest
caveat in the file itself: `loadProtocolPack()` currently strips
unrecognized member fields before returning, so `kind` is source-of-truth
documentation, not yet CLI-visible through `pack list --json` — correctly
left the wiring-through as future work outside this unit's file ownership,
not silently implied as done.

Fixed the stale `fgos:code-panel` "implemented" label in
`skill-package-distribution.md`'s adapter-mapping table (now correctly
`deprecated`, per I29's stub conversion). Confirmed `fgos-group-thinking`
untouched throughout (locked, non-negotiable per Unit I26's earlier
reversal).

Correctly reasoned through the `docs/decisions/` question (this unit's
scope item 3, recording the deferral decisions durably): confirmed
`docs/decisions/` is `generated: true` by `fgos decision-index` and
explicitly "never hand-edit," and no `docs/specs/<area>.md` exists for
agent-coordination architecture — the deferral decisions are already
durably recorded verbatim in plan.md with full reasoning, so no additional
file was created against the repo's generated-only convention. Flagged the
judgment call explicitly for Lead review rather than silently deciding.

Self-caught and cleanly reverted an early mistake (edited the main checkout
instead of the worktree) before any lasting effect.

## Process note: a real coordination gap, worth naming

The implementer reported "waiting for a background test notification"
mid-unit and then went idle for roughly 3.5 hours with no further update —
the notification apparently never landed, or was mis-waited on. Lead
caught the stall via direct worktree inspection (unchanged git state across
repeated checks) rather than assuming progress from the last message, and
prompted the implementer to run the test in the foreground directly instead
of continuing to wait. This resolved it immediately. Worth remembering for
future units: a background-task wait with no other signal is a real stall
risk, and Lead's own habit of checking worktree state directly (not just
`ListAgents`'s idle/running flag) is what caught it here.

## Lead final verification and merge

Independently reproduced the CLI probe for all 6 pack members myself
(`fgos coordination pack show-protocol <id> --json`), confirming genuine
full FlowDefinition data returned for each — not a stub or error, spot-
checked one in full. Confirmed `fgos-group-thinking/SKILL.md`'s diff is
empty. Confirmed the hardcoded-pack-path and architecture-panel-dispatch
claims directly against source (`group-thinking-pack.mjs:58-66`,
`fgos-architecture-panel/SKILL.md:118-123`). Ran the full suite myself:
7971 tests, 7847 pass, 51 fail — all 51 confirmed (via failure-file grep)
to be the same pre-existing `test/rust-host/*` binary-missing gap every
worktree-based unit this track has hit, zero overlap with this diff.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I33` from the main
checkout onto post-I31 main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 5f4ed37b82445f3e50debe3e2a1d6ec7fc27432b`.
Reran a pack probe on the merged tree, confirmed resolving correctly.

## Unresolved / follow-up

- `kind` field is not yet CLI-visible through `pack list --json`
  (`loadProtocolPack()` strips unrecognized member fields) — named, not
  fixed, candidate for a future unit if that visibility becomes needed.
