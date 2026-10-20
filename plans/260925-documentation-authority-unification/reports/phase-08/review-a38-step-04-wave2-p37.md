# Review a38 - Step 4 wave 2, part 37 (set step04-027)

Reviewer: fresh-context A38. Pin dc24ce645. Payload step-04-wave2-p37.json (2 files, 13 slots). No checker, probe or script run; no writes to the worktree. store.mjs (2214 lines, 110859 bytes) was read as an outline plus every docs/path region (grep of all `docs/`, `.md`, `plans/` hits with surrounding context at lines 575-582, 853-862, 888-896, 1143-1152, 1268-1280, 1436-1446, 1762-1776, 2086-2095); tool-registry.mjs (282 lines) read whole. Diffs are empty for both files (no patch slot), so no code behavior can change.

## Per file

| File | Set / stratum | Verdict | Slots reviewed |
| --- | --- | --- | --- |
| src/state/store.mjs | step04-027 / unpatched sample | ok | 11 (10 preserve, 1 parked) |
| src/state/tool-registry.mjs | step04-027 / unpatched sample | ok | 2 (both preserve) |

### store.mjs
- l-000454 (579) `docs/history/<id>/` : example of external work-item history convention in a bug-found-live note; L12-10 literal; preserve. Line 615 `docs/history/${id}/plan.md` and the line 641 message are executable code/runtime string, correctly in stepFiveExcluded (l-000455 plus supplemental twin).
- l-000456 (857-858 wrapped, two slots), l-000458 (1147), l-000459 (1273), l-000460 (1440): citations of `docs/architect/doing-coordination-redesign.md` (design origin of the claim settle / status-at-ask split, dated "design target confirmed 2026-08-25"). Target exists at the pin. Recorded as original implementation/proposal evidence, preserved literal (same treatment as src/runner siblings). Acceptable under L12-60/26/38/40/46 as authored; see question 1.
- l-000457 (892-893 wrapped, two slots) `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md`: file exists at the pin; docs/distillery is a retained native path (L12-26(3)); preserve correct.
- l-000461 (1768) parked: comment illustrates decision `scope` with "one matching `docs/specs/<area>.md`". Live-holder check: rg over docs/platform (excluding history, proposals, verification) finds no live statement of the scope-equals-area convention; the only occurrences of `docs/specs/<area>.md` are generic template sentences (platform-foundations.md 103-105, switchboard.md 98), which are themselves migration-state text. The decision-index reader (src/report/decision-index.mjs) groups by free-text scope and is Step 5. A truthful replacement example is not available yet, so park as description-rewrite is correct; no Phase 9 patch is possible.
- l-000462 (1772) `docs/decisions/index.md`: generated projection that exists at the pin and stays (L12-60 ruling 5); preserve correct.
- l-000463 (2090) `docs/history/` wrapped with line 2091 `execution-fanout/CONTEXT-tsk-4so.md`: target exists; named history evidence; preserve correct.
- Not edges and correctly unslotted: bare `plan.md`, `CONTEXT.md`, `dag-request-scheduler.md` (line 85), `.fgos/...` paths.

### tool-registry.mjs
- l-000464 (3) `docs/distillery/deep-dives/tool-registry.md`: exists, retained native path; preserve correct.
- l-000465 (16) `docs/history/tool-registry-capability-port/CONTEXT.md`: exists, named history evidence; preserve correct.
- Bare `DISCUSSION.md`, `plan.md`, `.fgos/config.json` are not edges.

## Outcome defects
None.

## Record-text notes (not rework)
- store.mjs l-000458 (1147) and l-000463 (2090) wrap the cited path across two lines but carry a slot only for the first line, whereas l-000456 and l-000457 slot both lines. Both dispositions are preserve, so no outcome effect; for consistency the second line could be added.
- l-000461 parked reason prefix is doubled ("A51, L12-30/31/32/58/60: A51, L12-30/31/32/58/60:").

## Lead-judgment questions
1. store.mjs l-000458 (1147) and l-000459 (1273) cite `doing-coordination-redesign.md §7.3/§9.2` for "settle DIRECTLY from preClaimStatus to finalStatus, no durable intermediate work.move leg". A live statement of that behavior exists at docs/platform/work-state/spec.md lines 561-566 ("Settlement (`settleClaim`) chuyen THANG tu `preClaimStatus` ... sang `finalStatus` ... cung giao dich", no anchor heading for that bullet). The author preserved these as design-origin evidence (a retiring-tree source is only a non-canonical carriage at docs/platform/proposals/doing-coordination-redesign.md). If Lead wants live "see X" pointers to retiring docs/architect to patch to a live holder whenever one states the behavior, these two (and the matching src/runner siblings) would become patch or park slots; otherwise preserve is consistent with the authored rule. I did not count it as rework because the citations read as provenance (D2, dated design target, tsk-40m) and an anchor-less patch target would be a file-level pointer into a long spec.

## Counts
- step04-027 unpatched stratum: 2 reviewed, 0 rework (no patched stratum files in this part).
- Part total: 2 files reviewed, 0 rework; 13 slots = 12 preserve, 1 parked, 0 patch.

Status: DONE
