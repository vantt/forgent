# Review a38 — Step 4 wave 3, part 17 (set step04-022)

Pin dc24ce645, all 6 source files read through the pinned payload and blobs (docs-path grep of each blob matches the slots). 9 joined slots reviewed (8 preserve, 1 parked, 0 patch). No diff in any record, so there is nothing to apply.

| File | Cat | Slots | Verdict |
| --- | --- | --- | --- |
| src/runner/agent-roster.mjs | B | 1 preserve (l-000249) | ok |
| src/runner/anti-loop.mjs | B | 3 preserve (l-000250 x2 wrapped lines 21-22, l-000251 line 54) | ok |
| src/runner/claim-liveness.mjs | B | 1 preserve (l-000252) | ok |
| src/runner/claim-port.mjs | B | 1 preserve (l-000253) + 1 Step 5 exclusion (l-000254) | ok |
| src/runner/dispatch/assignment-policy.mjs | A | 1 parked (l-000255) | ok |
| src/runner/dispatch/cli.mjs | B | 2 preserve (l-000257, wrapped lines 5-6) | ok |

## Outcome defects
None.

## Evidence
- Preserve slots: every cited path exists in the pinned tree (docs/history/core-foundation-domain-boundary/DISCUSSION.md, runtime-claim-doing-separation/CONTEXT.md, session-claim-liveness/CONTEXT.md, dispatch-activation-and-handoff-redesign/CONTEXT.md, docs/architect/doing-coordination-redesign.md), so none is a dead "see X" pointer. Each is named history/design-origin evidence (L12-10, L12-47, ruling 2 of L12-62). Wrapped paths (anti-loop 21-22, cli 5-6) are covered, one slot per source line for the same edge, same passage.
- claim-port.mjs line 224 is a template-literal `rationale:` runtime string. It is correctly in `stepFiveExcluded` (L12-60(1)).
- assignment-policy.mjs l-000255 (line 416, `docs/history/executor-policy-dispatch-seams/`): this is a "see X ... for the edge cases" navigation pointer. The path is absent from the pinned tree, and `git log --all -S` on the path outside the plan dir finds only df527cb5d, a commit that wrote the comment. No history path ever existed. Dead-link park is correct (L12-60(4), L12-62). Passage-content live-holder search: I grepped docs/platform, docs/knowledge, docs/specs, docs/reference and docs/tutorials for `resolveExecutorProvider`: 0 live hits. RT1/H2b appear only in docs/platform/agent-coordination/verification/step-08-standalone-coordination/P00.2.md, which is dated verification evidence, not a live holder. The successor note (archive/plans/260915-executor-policy-dispatch-seams/, which exists at the pin, plus P00.2.md) is non-executable and accurate. Consistent with the record's witness. No live holder, so park holds.
- Bare filenames (`CONTEXT.md` anti-loop line 2, `AGENTS.md` cli line 818, `design.md` assignment-policy 62/88) are not edges (L12-49).
- Step 5 / render: no render paths, sourceRenderProvenance empty in all six records, as expected for .mjs.

## Record-text notes (not rework)
- l-000255 reason text repeats "L12-62: L12-62:" in reason and blockedReason (cosmetic).

## Lead-judgment questions
None.

## Counts
Set step04-022 part 17: files reviewed 6 (A 1, B 5), outcome rework 0, slots 9 reviewed / 0 rework.

Status: DONE
