# Red-team re-check: Phase 7 plan (9 steps)

Reviewer: reviewer:claude-session:a4954387@2026-10-17
Review mode: plan re-check
Content commit: e8d72c8aa

Read-only. `F` = `plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md` at e8d72c8aa; `OA` = `reports/phase-07/owner-answers.md`. No git write, no fgos CLI, secrets file not read.

## Finding status

| ID | Status | Evidence |
|---|---|---|
| P7-1 (Critical) | closed | F:96-99 (rule 4, author turn before package turn), F:104-108 (rule 6, post-review-edits log, rebind by content+occurrence, no approval carries), F:377-406 Step 9: one native carry over committed bytes (F:385-387), rebind of every changed unit incl. candidate-unverified, identical groups, A34 carries (F:388-392), ordinary review at <=60 entries/<=400 KB, D both+each, strict E, comparator exit 0 / ok=true / zero diff (F:393-398); no handoff to Phase 9 stated at F:379-380 and F:465-466; matches L11-2 in OA. |
| P7-2 (High) | closed | F:408-439 explicit scratch inventory/registry at HEAD, both `--decisions` dirs, `--previous-registry` per prior, `env -u CLAUDE_CODE_SESSION_ID npm test`; expected-exit table F:441-450 (strict E and retirement dry run expected red, delta recorded, not a stop; F:396-398). Residual wording nit: the retirement command at F:433-435 carries no `--decisions`; it is recorded-only so not a blocker. |
| P7-3 (High) | closed | F:147-152 allowed-paths committed in Step 1 (F:229-230), checks A/B/C/G/H/I table F:154-161 run after every fix batch and in Step 9; protected-path `git diff --stat "$B0"..HEAD` list F:~163-185 with empty/blob-equal rule; stop condition F:454-455. |
| P7-4 (High) | closed | F:128-145 uses the full-scope three-dot diff (`docs AGENTS.md CLAUDE.md` + switchboard json): empty means merge allowed, non-empty means defer to Step 9 closing merge before the single carry; matches L11-3 exactly (OA:66-88). Protected-blob-equals-main-parent proof included. |
| P7-5 (High) | closed | F:252-268 (Step 2: 27 pairs mostly mechanical, one triple full read, "target settled; legacy source retires at Phase 9" as a report-level reading, not an enum; "resolved" = settled meaning + one target owner), F:462-463; matches L11-4. Four duplicate groups moved to Step 6 (F:325-327, F:199). Effort re-sized (about 1 session). |
| P7-6 (High) | closed | F:30-43 (criterion 2 states post-cutover frame), F:340-357 Step 7: navigation repaired in candidate README/portals/headers before sealing, frame stated in brief and key, readers start at `docs/platform/README.md`, 8-file budget in proof; F:209-214 four routes assigned to Step 7; switchboards stay Phase 8. Matches L11-5. |
| P7-7 (High) | closed | Order is now 1 -> {2..6} -> 7 (seal) -> 8 -> 9 (F:216-223); all content edits precede sealing (F:342, F:351-352). Six stale rows: inventoried only in Step 3 (F:279-280), written only in Step 5 (F:309-311). |
| P7-8 (High) | closed | F:118-120 (rule 9), F:305, F:315-316: scope is Step 1 rows + known stale tables + A36 seeded sample; full truth stays Phase 9 under A28 3(b). Same bound in L11-6. |
| P7-9 (Medium) | closed | F:86-89 rule 2 + L11-1 (OA:20-40). |
| P7-10 (Medium) | closed | F:242-245 owner batch released in Step 1; Step 3 CTR010 rows park (F:281-283); zero-conflict verdict waits; L11-7. |
| P7-11 (Medium) | closed | F:232-235 independent fresh-inventory group derivation; queue join labelled drift detection only; proof F:248. |
| P7-12 (Medium) | closed | F:368-370 two-round cap, new reader sessions, L11 decision after round 2. |
| P7-13 (Medium) | closed | F:113-117 rule 8 (rationale wording stays Phase 9 under L10-37; candidate citation defects still fixed). |
| P7-14 (Medium) | closed | F:189-207 routing table covers all 13 families with a destination each; Step 1 gives every family a stable id (F:187-188 and F:238-241). |
| P7-15 (Medium) | closed | F:399-402 checkpoint merged into the closing red-team, reviewer-held 6-mutation/30-row pack, separate A36 truth sample; success criterion F:473-474. |
| P7-16 (Medium) | closed | F:6 effort filled, F:216-223 dependency shape, per-step effort lines. |
| P7-17 (Low) | closed | F:90-95 rule 3: identity string formats, author header equals `authoredBy`, distinct reviewer report paths. |
| P7-18 (Low) | closed | F:331-333 check mode or scratch-clone only; scratch diff is a finding. |
| P7-19 (Low) | closed | F:345-346, F:353, F:361-363 authoring probe per scenario/reader, scored in Step 8. |

Count: 19 closed, 0 partly closed, 0 open.

## Specific checks requested

- Requirements and success criteria: D1-D9 keys and meaning unchanged (F:33-43 vs old 74-82). Two wording changes only: D8 "without legacy paths" became "without legacy authority", and criterion 2 now names the post-cutover frame (F:45-48). Both come from L11-5 and match plan section 10; neither weakens the bar. The success list is longer (nine bullets vs two), all stricter; criteria 1 and 2 remain verbatim in substance.
- Nine dimensions after merge to nine steps: D1 Steps 1-2; D2 and D5 Step 3; D3 Step 4; D4, D6, D9 Step 5 (alignment kept as an explicit subpass, F:312-314; A34 residual and activation conditions F:307-308); D7 Step 6; D8 Steps 7-8. All nine covered; none orphaned.
- Closing accounting step: Step 9 exists with native carry (F:385-387), rebind (388-392), D both/each (F:393-394, 416-428), strict E (F:395-398, 430-431), and unchanged comparator (F:396-397, 446). Present.
- Main-sync rule matches L11-3: same diff command and scope, empty then merge, non-empty then defer to Step 9 (F:128-145; OA:78-81).
- Phase 8/9 scope: no step opens it. Navigation edits stay inside candidate files (F:342-344); switchboards, aliases, consumers, retirement, promotion all routed (F:189-214); retirement dry run is read-only expected-red; Step 9 carry/D/E is the L11-2 conservation account, not cutover.

## New findings

No new Critical or High.

Observations (Medium/Low, no change required to proceed):

- N1 (Medium): Step 9 has no explicit repair path if the closing red-team, truth sample or changed-row review finds a candidate-content defect after the carry. Rule 4 forbids identity-source edits after the carry, and the stop list (F:452-455) halts but does not say a fix means a second full carry plus key invalidation if readers are affected. Suggest one sentence: a post-carry content fix re-enters at Step 9 item 1 and the Lead records an L11 decision on whether the reader gate must repeat. Ledger-only review rework (plans/ paths) does not change identity-scope bytes and needs no re-carry.
- N2 (Low): a deferred main merge in Step 9 item 1 occurs after the reader gate; if main ever imports bytes under `docs/platform/**`, reader evidence goes stale. Expected not to occur (main-owned paths are legacy/root), and check A/C already flag it.
- N3 (Low): Step 9 is large (carry, review, D/E, comparator, red-team, truth sample, npm test) at "1-2 Doer sessions"; schedule risk only.

## Verdict: ready

Status: DONE
Summary: All 19 findings (P7-1..P7-19) are closed in the revised plan with line evidence above; requirements and success criteria keep their meaning (two L11-5 wording tightenings), all nine dimensions remain covered across nine steps, Step 9 holds the native carry, rebind/review, D both/each, strict E and comparator, the main-sync rule equals L11-3, and nothing opens Phase 8/9 scope. No new Critical/High.
Concerns: N1 (no stated re-entry rule for a post-carry content defect), N2, N3 are advisory; the retirement dry-run command lacks `--decisions` (recorded-only, not a blocker).
