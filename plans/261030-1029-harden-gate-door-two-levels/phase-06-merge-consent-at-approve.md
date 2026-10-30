# Phase 06: Merge consent at `fgos approve` on the real diff

Shape adjustment 5: declared writes can be incomplete before work, so the check on the real diff at merge is mandatory. It may ask late; that costs rework, never safety. Merge is the one place the grant binds to an exact digest (adjustment 3). Runs in parallel with phase 05 (disjoint files).

## Context

- `fgos approve` (`src/verbs/merge/approve.mjs`, 909 lines) merges, verifies and runs the Iron Law (`approve.mjs:55,~370-380`) at the trunk boundary (RUL37, `docs/specs/runner.md:999`). `sync-root` lands a root onto trunk with the same Iron Law call (`src/verbs/merge/sync-root.mjs:89`).
- `fgos-fanout` auto-calls `fgos approve` for leaf items unless the title hits the keyword list (`core/skills/fgos-fanout/SKILL.md:130-145`); this phase moves that check into `approve` and deletes the prose.
- The item's own diff is computed once by `ironLawForItem` (`src/runner/iron-law-gate.mjs:55-58`, `filesChanged` returned for reuse).

## Requirements

1. In `approve` and `sync-root`, after the Iron Law block and before the clean-tree check, build the merge subject from the real diff: changed and deleted paths (name-status through the Git component's Inspect port, the same diff base as `ironLawDiffOpts`), diff size, the Unit's capability facts, and `digest` = the candidate head tree id. Call `decide`.
2. `auto` writes `gate.auto` with the digest and proceeds. `ask`: if a human grant with the same digest exists, proceed; if the caller is a human CLI session, `approve` itself is the answer: it grants through the CLI channel and proceeds; otherwise it records `gate.asked` (visible on the dashboard) and refuses `merge-consent-missing` with the three channels named. The item stays in `awaiting-approval`.
3. A changed candidate (new commit, rebase) has a new digest, so an older merge grant never carries over.
4. **Calls through the gateway are not a human CLI session.** The gateway's MCP `approve_work` (`apps/fgos-gateway/src/mcp.rs:321`) runs `fgos approve` as a child of the detached gateway, which has no agent CLI in its ancestry, so the CLI-channel check in step 2 would take an agent's MCP call for a human. The gateway marks every verb it spawns for MCP with its channel, and `approve` treats that call as an agent call (records `gate.asked`, refuses `merge-consent-missing`). REST calls from the dashboard keep the dashboard channel. One MCP test proves `approve_work` without a grant is refused. Added by HARDEN on review; the same rule covers every verb the gateway spawns for MCP, not only `answer_work` (phase 03).
5. No new flag. `--acknowledge-iron-law` keeps its meaning (test-first proof); it is not consent.

## Files

- **Modify:** `src/verbs/merge/approve.mjs` (one call site after the Iron Law block); `src/verbs/merge/sync-root.mjs` (same); `src/runner/iron-law-gate.mjs` only if the shared diff read needs to also return deletions (one field added to the returned object, reused, not a second git read).
- **Modify:** `core/skills/fgos-fanout/SKILL.md:130-145` (leaves: call `fgos approve`; a `merge-consent-missing` refusal means wait for the human, never retry); regenerate render surfaces with `npm run build:skills` (`.agents/skills/`, `plugins/fgOS/skills/`, `.claude/skills/` wrappers; never edited by hand).
- **Delete:** the agent-side keyword check in `core/skills/fgos-fanout/SKILL.md:130-145` (the "unless title/description hits `HEAVY_KEYWORDS`" rule and its pointer to `src/intake/risk-keywords.mjs`).

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| none | the merge-consent wiring: one case each in `test/cli/fgos-approve-3.test.mjs` (or the approve test file that owns the Iron Law ordering, found with `rg -l "Iron Law" test/cli`): auto proceeds; ask from an agent session refuses with `merge-consent-missing`; a human grant with the same digest proceeds; a new commit after the grant refuses. The policy itself is owned by `packages/gate/rust/tests/facts.rs` and `require.rs` |

## Steps

1. Extend the shared diff read with deletions if needed.
2. Add the merge subject and the `decide`/`require` call to `approve` and `sync-root`.
3. Fanout prose; `npm run build:skills`.
4. Tests in the existing approve file.

## Validation

- Focused Node via `fr.mjs`: `test/cli/fgos-approve-3.test.mjs`, `test/cli/fgos-approve-5.test.mjs`, `test/cli/fgos-merge.test.mjs`, `test/direct/fgos-merge.test.mjs`, `test/direct/merge-gate.test.mjs`, `test/cli/fgos-iron-law-gate.test.mjs`, `test/e2e/self-improve-loop.test.mjs`
- Dogfood: a fanout leaf with only `low` paths lands without a question; a leaf that deletes a tracked file asks on the dashboard and lands after the grant.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Unattended runs stop at merge more often than before (late asks) | M x M | Expected by adjustment 5; the ask is durable and visible on the dashboard; the frame grant earlier covers most cases, only `high` facts at merge ask late |
| Digest choice (tree id) differs from what Git's land path merges | L x H | Git/OPC reviews; the digest is read from the same candidate ref the land operation uses |

## Rollback

Revert with drop B.

## Net size (estimate)

Node: about +45. Skill prose: about -15. Tests: about +40 in existing files.
