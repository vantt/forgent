# A38 vocabulary review: Steps 3-4, Part 2

Reviewer: reviewer:claude-session:a4954387@2026-10-17
Author session: as the request names it (Lead-started Doer session that wrote `step-04-vocabulary-rows.json`; not this session)
Review mode: ordinary
Request commit: 2f0d4a550 (read-only worktree, detached; `git rev-parse HEAD` = 2f0d4a5502f0259da212d840abd49ec6a95f725d)
Scope: `review-request-a38-step-03-step-04-01.md` Part 2, 13 entries. Light commands only; no fgos CLI, no writes to the repo.

## Totals

13 entries: 13 ok, 0 rework. Part 2 pin recomputed: `201871b9...5f3c` matches the request. Rows file sha256 `a59f14e2...c865`, checks file `e201dd40...2910` (the request pins no value for these two; recorded only).
`jq -e` gate (rows=10, candidateEdits=3, deferredRationaleRows=5): true.

## Per-entry verdicts

| Entry | Verdict | Note |
|---|---|---|
| V-01 component | ok | One owner (`component-boundary.md`). Meaning matches the "High-level component/module" row at lines 198-200 (source/package/service grouping, implementation ownership, replacement strategy; not for deciding source of truth). Aliases and prohibited conflations (authority boundary, class, entity) are consistent. Cited range 194-203 covers it. |
| V-02 package | ok | One owner pair, aliases and conflations named. Lines 86-90 only list "component packaging" as a change category, so the "no authority" half rests on line 199 (V-01) and the packaging-distribution README (exists, area portal). Citation is thin but meaning is not wrong. |
| V-03 bounded context | ok | Matches line 200 (model, vocabulary, reason-to-change) and the "Every small authority rule or helper function" negative column. |
| V-04 authority boundary | ok | Matches the third concept row and lines 211-228 (a boundary may cross a module boundary; examples such as "Only dispatch creates DispatchPlan"). Prohibited folder/service/packaging conflations are consistent with the "Do not use for: Packaging" cell. |
| V-05 responsibility ring (A43) | ok | Meaning is correct and the A43 guard is explicit: `prohibitedConflations` lists class, entity, schema type, mandatory module, runtime object, and `a43Guard` says a ring never implies a class or entity. Matches A43 in `phase-06/owner-answers.md:365` and `agent-coordination/vocabulary/concept-relationships.md:95-110` ("responsibility boundaries, not necessarily one process or module per ring"; no Orchestrator/Launcher/Router/Driver/Dispatcher class or entity required or planned). Non-blocking: the cited `component-boundary.md:432-451` is the boundary table and contains no "ring" term; the actual ring text is `concept-relationships.md:95-110`. See Notes 1 and 2. |
| V-06 candidate authority | ok | Consistent with governance (candidate-only status, "A target marked partial/candidate does not outrank" the map, line 460) and the Proposal/candidate rows. Prohibits automatic promotion; no authority is conferred. Citations are file-level only. |
| V-07 current authority | ok | Switchboard section 2 selects the owner by route and `authorityStatus` (promoted / legacy-current / candidate), not by path, recency or detail. Consistent with its "Follow the explicit current route" rule. |
| V-08 historical authority | ok | Governance line 145 ("History | Archived context | Current authority" in the must-not column) and `agent-coordination/spec.md:24-42` (engine retired, history retained, current owners named) support "evidence, no current decision or runtime authority" and "revived API" as a prohibited conflation. |
| V-09 producer / consumer | ok | Owner is the contract plus the architecture contract registry (`architecture-map.md` section 7, lines 437-455: non-deterministic boundaries require a contract row). Plan Step 3 lines 270-288 require every consumer named and a contract id. Prohibitions (producer is not state owner by default, one sampled consumer is not all consumers) are consistent with the "no second state-write owner" rule. |
| V-10 proposal / settled decision | ok | Governance Proposal row (line 123, "Non-canonical candidate ... before acceptance"), scratchpad "Must not establish ... settled decisions", Decision "provenance and supersession", and promotion-targets list (~249-270). Cited range 124-140 begins one line after the Proposal row; cosmetic. |
| TRUTH-15 runner self-citation | ok | Diff touches exactly 4 lines in `h-7af1f0242611.md`: `runner.md:2434` -> `:2890` twice (line 2890 is `### 0034 - Doi ten capacity/capacities thanh executor/executors, chot tach capability`, which is what ADR 0034 means), and `runner.md:2172-2180` -> `:2470,2602` (both lines carry the "2x2 grid: launcher / driver / orchestrator" text; 2602 sits inside `### 0031`). The old targets are now ADR 0026 text, so the old citations were stale. Wording "luoi 2x2" -> "cac bang" is a citation-label nuance, not a meaning change. Matches the log entry; no vocabulary or authority change. |
| TRUTH-26 archive-path label | ok | One-line diff in `host-use-cases.md:50`: only the visible link label changes from `../../../../plans/260918-.../plan.md` to `../../../../archive/plans/260918-.../plan.md`. Destination `(../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md)` is byte-identical and exists (19.1K); `plans/260918-host-invocation-r3-remote-peer` does not exist, so the old label was stale. Destination unchanged, as logged. |
| TRUTH-27 CLI line citation | ok | One-line diff in `h-51f5cd7279fd.md:456`: `bin/fgos.mjs:4415,4503` -> `:4410,4498`. Lines 4410 and 4498 are the `unknown verb` throw/`refuseHelp` sites that the sentence says (`evolve --help` returns "unknown verb"); 4415 and 4503 are an unrelated comment and an `if (!entry.subcommands)`. Behavior claim unchanged, "full truth check owed at promotion" retained. |

## Confirmations requested

- Ten term rows: 10 unique ids V-01..V-10, each with one `owner`, `allowedAliases`, `prohibitedConflations` and citations. The ten families (component, package, bounded context, authority boundary, responsibility ring, candidate/current/historical authority, producer/consumer, proposal/settled) are all present.
- A43 guard: present in V-05 and not contradicted by any other row. `rg 'class|entity|schema type|runtime object|responsibility ring'` hits only V-01/V-05 prohibited lists and the V-05 guard.
- Exactly three candidate edits: `git diff 1d78440f9 2f0d4a550 -- docs/platform` = 3 files, 6 insertions and 6 deletions (4+1+1 lines). Each hunk matches its `post-review-edits.md` row and the `candidateEdits` array. Changes are only stale citation numbers or a visible link label.
- X-DEFECT-01..05: `deferredRationaleRows` lists them; the inventory rows still carry `inspect-and-fix-if-candidate-text; rationale-only-to-Phase-9`, and no diff touches them (the `cross-area-inventory.json` change in this range is a `targetStep` label normalization, e.g. `2` -> `"Step 2"`, 80 lines, none in X-DEFECT-01..05).
- No mass replacement, history erasure, vocabulary/checker edit, promotion or authority change: the whole-range stat lists 17 files, 3 of them in `docs/platform`, the rest under the plan reports; nothing in `scripts/`, switchboard, root instructions or history snapshots. `step-04-checks.json` records `protectedBoundary.diffFromB0: []` and `stopConditions` all empty.
- Stop-condition assessment: none fired (no incompatible owner meanings, no history erased, no checker/vocabulary edit needed).

## Notes

1. V-05 citation gap (non-blocking, per L10-37 wording alone is not rework): the ring definition lives in `docs/platform/agent-coordination/vocabulary/concept-relationships.md:95-110`. `component-boundary.md` has no "ring" term. Adding that citation to V-05 would make the row self-verifying; the meaning and guard are right today.
2. Conflation hazard outside Step 4 scope: `docs/platform/proposals/component-authority-boundary-map.md:427-445` ("Strategic ring = Orchestrator ... Flow ring = Router + Driver") is a proposal that equates rings with named entities. It is a proposal (V-10 treats proposals as non-authority) and A43 supersedes the ring-to-entity table, so it is not a Step 4 defect, but a later pass may want a superseded-by-A43 pointer there. Not an A43 violation by this step.
3. The three corrected files are changed candidate units and return to pending; Step 9 rebinds them. This review accepts only the bounded records and does not close Step 9 accounting.

## Unresolved

- None blocking. Optional: whether the Doer adds the `concept-relationships.md:95-110` citation to V-05 (Note 1).

Status: DONE
Summary: 13 of 13 entries ok, 0 rework; the three candidate edits are citation or visible-label corrections only and match the log and diff; X-DEFECT-01..05 stay rationale-only; no stop condition fired.
Concerns: V-05 cites a boundary table that has no ring term (real home is concept-relationships.md:95-110), and an older proposal still maps rings to entities; both are non-blocking.
