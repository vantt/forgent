# Review a38 - Step 4 wave 3 part 11 (set step04-012, category A)

Pin dc24ce645. Both files have an empty `diff` and zero `patch` slots, so no comment-only patch can change behavior. Every slot is either preserve or parked.

## apps/fgos-gateway/src/gateway.rs - set step04-012, stratum code comments - verdict ok
Whole 2521-line source read. I grepped every docs/, specs/, .md and plans/ reference to find missed edges.

Slots reviewed: 19 edge ids (class6-l-000021..33, 36, 38, 39 (two segments), 42, 48).
- Preserve, 17 slots. They are history conventions and named history evidence, retained native contract paths, and wrapped references (31, 38, 39).
  - Verified on disk: `docs/contracts/fgos-gateway-api-v1.yaml`, `docs/history/fgos-interface-daemon/`, `docs/history/herdr-web-dashboard/` and `docs/history/herdr-web-dashboard-plan-realignment/` all exist.
  - `docs/history/<feature>/` and `docs/history/` (l-32, 33, 42, 48) are the portable external-project convention, which L12-10 keeps unchanged.
  - The contract-path comments (l-22, 24, 27, 28, 29, 36, 38) describe a path the code still reads at line 1187, `state.root.join("docs/contracts/...")`. That reader is Step 5 and is correctly listed in `stepFiveExcluded` (l-37). Preserving the comment text keeps comment and code in agreement.
- Parked, 2 slots (l-23 line 13, l-26 line 131). Both cite `docs/specs/distribution.md` row 5b for the gateway token file.
  - Row 5b exists in the old spec (`~/.fgos/config.json`, "not created by anything except `fgos setup`"), so the source claim is accurate today.
  - The park rests on carrying that precise row, not on a plain path move. This matches the L12-62 rule that a park needs a passage-content live-holder search, and `searchWitness` and `passageSearchWitness` are present.
  - Not rework: the passage-search terms (`EXIT_CODES`, `spawn_fgos_verb` for l-23; `distribution` for l-26) are weak for a "gateway token" claim. They do not change the outcome.

`stepFiveExcluded` (code strings and test fixtures at lines 878, 895, 1187, 1740, 1741, 2314, 2320, 2332, 2335, 2351, 2357) matches my grep of every executable `docs/...` string. I found no missed comment edge. Bare `plan.md` and `CONTEXT.md` mentions are bare filenames, not edges.

## apps/fgos-gateway/web/src/lib/network.ts - set step04-012, stratum code comments - verdict ok
Whole 23-line source read.

Slots reviewed: class6-l-000067 (lines 1 and 2, the two segments of the wrapped `docs/specs/herdr-\n// web-dashboard.md`) and class6-l-000068 (lines 3 and 4).
- l-67, parked, both segments. The comment claims R5 says "reachable on network" has no dedicated contract field and that only `baseUrl` is observable.
  - In the review worktree, `docs/platform/herdr-web-dashboard/spec.md` R5 (line 239) now describes static serving defaults and the `fgos gateway start` lifecycle and bind.
  - That is a real description mismatch, so a plain redirect would make the comment false. Parking for a description rewrite is correct, and the wrapped reference is treated as one complete locator.
  - The witnesses are present.
- l-68, preserve, both segments. `docs/contracts/fgos-gateway-api-v1.yaml` is a retained native path that still exists and is still read by gateway.rs, so the preserve is correct.

## Counts
- Slots reviewed: 19 edge ids in gateway.rs plus 2 edge ids in network.ts (the l-39 and l-67/68 duplicates are physical segments of one logical edge).
- Rework: 0.
- Outcome defects: 0.
- Record-text note: l-23 and l-26 `reason` and `blockedReason` repeat the "L12-62: A51, ..." prefix, and l-67 repeats the "A51, ..." prefix. This is cosmetic and not rework.
- Lead-judgment questions: none. For the category A sweep changes I could only confirm that the final parked and preserved outcomes are consistent with their cited witnesses and rules. The pre-sweep outcomes are not in my payload.

Status: DONE
Summary: Both files have no patches (empty diffs), so no behavior can change. All 21 slots are correctly preserved or parked, and I found no missed edges or outcome defects. The gateway contract-file reader stays Step 5.
