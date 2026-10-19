# A38 independent review: Phase 8 Step 1, Pilot B 47 joins

Reviewer: reviewer:sonnet-session:a9d382ce364a5d632@2026-10-19
Worktree: /home/vantt/projects/forgentX-s8-review, detached at 1b8603207 (verified). Author commit 33b80f0de. Lead settlement c75796efa (L12-17). Proposals pin inputHead 8b1d91078.

## Mechanical replay

- Portable replay: all per-row assertions passed for all 47 joins (queue equality, key, source line/context hash, reference spans, original-commit line at 2d0d67838, every target/future/alternative section hash and anchorExists, planLinkPass records). 
- Replay then stopped at the protectedPins loop on 3 pins. Cause, verified: those files changed legitimately after the proposals' inputHead (commit c75796efa edits owner-answers.md; 1b8603207 edits the two phase-06 reproduction manifests). Their hashes match at inputHead 8b1d91078 (git show) and differ only in the later worktree. The other 58 pins match. Not a proposal defect; the replay's worktree-hash check is stale against the post-author commits. The two remaining asserts (rows 3-5/31-39 cutover-patch-only, counts) were checked separately: counts in the packet are 2 rewrite / 19 cutover-patch-only / 24 preserve / 2 parked, consistent with itself; rows 3-5, 31-39 are all cutover-patch-only.
- Light tests (doc-link-pass, check-doc-candidate-status, check-doc-constitution): 95 pass, 0 fail.
- check-legacy-docs-ratchet: clean (995 legacy files; 26 accounted edits, 1 accounted new file).
- git diff --check: clean; git diff --name-only HEAD: empty.

## Per-index verdicts (47 joins; deep-read of source context + actual target passage for all rows named below)

| # | Disposition (packet) | Verdict | Source / target, reason |
|---|---|---|---|
| 0 | cutover-patch-only | ok | scripts/generate-shipped-path-inventory.mjs isPublishedDoc literal list (line ~271). Real classifier literal, not navigation; generator frozen in Phase 8; target cli-io-contract §1 exists. Parity proof need (identical membership/role output) is stated. |
| 1 | preserve | ok | check-doc-conservation.test.mjs:559 (orig 447). Synthetic inventory object; no file read; preserved bytes with paired assertion. |
| 2 | preserve | ok | same test :560 (orig 448), paired expected literal in findUnmatchedScope assertion; consistent with row 1. |
| 3 | cutover-patch-only | ok | component-boundary-advisory.md:140 table cell; docs/architect is a L12-7 cutover bucket; candidate spec §1 scope fits lifecycle-engine ownership. |
| 4 | cutover-patch-only | ok | domainization/README.md:8 Related list; spec-owner link, L12-7; §1 fits. |
| 5 | cutover-patch-only (no-op) | ok | distribution-baseline.md:64 dated baseline row; deliberate no-op preserving historical label, as the request directs. |
| 6 | cutover-patch-only | ok | gateway OpenAPI :455 rollup description; rollup-verb section (candidate spec ~951) is the correct owner; byte/schema/error parity and CTR010 unchanged are stated. |
| 7 | cutover-patch-only | ok | OpenAPI :709 WorkItem; §3 Data Dictionary (58-94) is the right owner; parity need same as 6. |
| 8 | cutover-patch-only | ok | OpenAPI :738 WorkDetail raw logs; §4 Capture and Evidence Records (95+) matches. |
| 9 | preserve | ok | distillery deep-dive: dated reference comparison saying footprint is advisory-only at "~1022"; redirect would falsely make history current. |
| 10 | preserve | ok | calibration-slice: names the measured 425-finding source file. |
| 11 | preserve | ok | same doc :61, 124-finding historical accounting. |
| 12 | preserve | ok | tsk-2sp-1 scope identifies the audited file. |
| 13 | preserve | ok | past cleanup operation applied to the named specs. |
| 14 | preserve | ok | runtime-claim-doing-separation: narrative of documents left stale after a landing. |
| 15 | preserve | ok | how-to cites the completed calibration slice as an example. |
| 16 | parked in packet; settled by L12-17 to cutover-patch-only | ok (agree with L12-17) | participant-contract.md:213. Verified: candidate spec RUL10 (line 1050) has bổ chú 1/2 (events.lock) but not bổ chú 3; legacy spec line 1201 carries bổ chú 3 (hot mutex withStateTx). A path swap now would send readers to retired lock prose. See L12-17 section. |
| 17 | parked in packet; settled by L12-17 | ok (agree, with patch-text note) | participant-contract.md:248, reference written with a line suffix `docs/specs/work-state.md:1045`. The cutover patch must replace the whole `path:line` token with the anchor link, not only the path (stale line number otherwise). |
| 18 | preserve | ok | participant-contract.md:34 past-tense "had to read the ~215KB spec"; size claim is history. |
| 19 | preserve | ok | historical caller census listing two prose mentions. |
| 20 | rewrite | ok | knowledge doc: RUL33/RUL34 navigation. Switchboard anchor 2-area-authority-routes exists (line 46) and its Work-state row (line 54) routes to docs/specs/work-state.md; RUL33/34 exist in both legacy and candidate spec §11 (lines 1073-1074), so rule ids survive. No behavior change. |
| 21 | preserve | ok | incident evidence (green tests vs stale coverage:full spec). |
| 22 | preserve | ok | tsk-1uw/tsk-2t5 rewrite history. |
| 23 | preserve | ok | bee-to-fgos env-var migration receipt. |
| 24 | preserve | ok | decomposition decision footprint, historical. |
| 25 | preserve | ok | block quote of original Shape; verbatim quote. |
| 26 | preserve | ok | cites `work-state.md:229,1016` and says answer resumes to statusAtAsk. Verified: legacy G4 (line ~229) has that behavior; candidate G4/Answer Verb (lines 212, 925) clamps `doing` to `todo` via durableStatusAtAsk. Preservation keeps the old meaning and does not certify it as current. |
| 27 | preserve | ok | old "indefinite hold" liveness gap citing "Open Gaps". Candidate §13 Known Gaps now documents on-demand reclaim; different from the historical gap. Preserve is right. |
| 28 | preserve | ok | retrospective source bibliography (file:line read 2026-07-31). |
| 29 | preserve | ok | conditional rule "IF the switchboard routes to a legacy document (such as ...)"; example paths must stay legacy. |
| 30 | rewrite | ok | routing-handoff-contract.md:35 trust-boundary table row. Route via switchboard to Work-state; `fgos add` single write door and "no direct events.jsonl write" stay in the row; future schema target is §3. |
| 31 | cutover-patch-only | ok | fgos-plugin.md:169 lifecycle/FSM meaning of verbs; §9 Behaviors and Operations (681-1029) fits; docs/specs consumer is L12-7. |
| 32 | cutover-patch-only | ok (note) | fgos-plugin.md:19 "business rules owned by Work-State area". §1 Purpose and Scope states ownership boundary, acceptable; §11 Business Rules would also fit. Low-severity: Lead may choose at cutover; not rework. |
| 33 | cutover-patch-only | ok (note) | herdr-web-dashboard.md:328 lifecycle meaning of status/stage/question/answer; §9 is a 350-line section, acceptable; §3 would be a narrower alternative for status/stage names. Not rework. |
| 34 | cutover-patch-only | ok | herdr-web-dashboard.md:68 Shared Entities "Work item" row; §3 Data Dictionary matches. |
| 35 | cutover-patch-only | ok | reading-map.md:28 CLI entry listing lifecycle verbs; §2 Entry Points and Triggers (31-57) matches; CLI registry/envelope meaning distinct. |
| 36 | cutover-patch-only | ok | reading-map.md:29 state-core line. Verified the line now contains `withStateTx`/hot mutex (no events.lock) and one explicit path `docs/specs/work-state.md §envelope`; target is cli-io-contract Envelope Shape (131-157), correct CTR001 owner. Updated hot-mutex prose preserved. The "RUL10" mention has no path and needs no patch. |
| 37 | cutover-patch-only | ok | reading-map.md:30 `src/cli/command-registry.mjs` entry, `spec: ... §sổ verb`; target cli-io-contract §7 Machine-Readable Verb Registry (265-340) is correct. |
| 38 | cutover-patch-only | ok | reading-map.md:55 `src/state/impact.mjs`; candidate "Triage Verb" section (958-964) is read-only triage, matches. |
| 39 | cutover-patch-only | ok | system-overview.md:51 pull-door paragraph; §7 Pull Door Take And Return (525-608) matches. |
| 40 | preserve | ok | dogfood-fixture scenario: recorded fixture using retired clarify/decompose vocabulary ("Giai đoạn Chia-việc"); fixture bytes, not a reader. |
| 41 | preserve | ok | ratchet baseline JSON key at :5977; accounting identity for the frozen legacy file. |
| 42 | preserve | ok | ratchet exceptions JSON `path` at :247; same reasoning, rationale and digest context retained. |
| 43 | cutover-patch-only | ok | decisions-corpus-retired.test.mjs:45 NARRATIVE_TARGETS list (real-file reads with `### <id> ` heading coverage). Candidate retired-decision-history.md has 43 `### 0NNN` headings under `## n. ADR` sections and an ADR 0032 Team Harness section (13). Cutover must keep all ids covered; stated. |
| 44 | cutover-patch-only | ok | same test :78, two duplicate queue edges at one physical read; both identities kept. Verified regex `### 0032 — Multi-role Team Harness` does not match the candidate heading `## 13. ADR 0032 Multi-Role Team Harness`; packet correctly requires heading parity at cutover and no gate weakening. |
| 45 | cutover-patch-only | ok | duplicate of 44 (queue rows 44/45 are identical on line 78); handled as the same physical patch with distinct identities. |
| 46 | preserve | ok | check-decision-citation-drift.test.mjs:112 synthetic `file:` label for a detector fixture; no read. |

## L12-17 verdict (rows 16 and 17 plus P8-DOC-GAP-01)

Agree. Evidence: candidate RUL10 (docs/platform/work-state/spec.md line 1050) still describes `.fgos/events.lock` and has bổ chú 1 and 2 only. Legacy docs/specs/work-state.md line 1201 carries bổ chú 3 (events.lock, claims.lock and porting events.lock replaced by `withStateTx`; Holder-lock §15 "Hot state mutex and porting events" exists at docs/platform/holder-lock/spec.md:291). So a path swap now would point to either retired prose or a gap; keeping both as cutover-patch-only with a Phase 9 dependency (carry bổ chú 3 first) is correct and added to phase-09 (verified in diff c75796efa). Moving the stale participant-contract prose to a separate backlog item respects RUL104 and the decision that link migration is not a content rewrite.

Concerns (not disagreements):
1. After Phase 9 carries bổ chú 3, candidate RUL10 will say events.lock is gone while the participant contract at lines 213 and 248 still says "specified in full at RUL10: the .fgos/events.lock primitive (wx plus dead-pid reap)". The cutover patch would then point a reader at a RUL10 that contradicts the sentence next to it. Suggest P8-DOC-GAP-01 be sequenced before or with the row 16/17 patch, or the patch carry an explicit "retired protocol, see RUL10 bổ chú 3" qualifier.
2. Row 17's reference carries a `:1045` line suffix; the patch must replace the whole token.
3. The packet at 33b80f0de still records 2 parked and counts 2/19/24/2; after L12-17 the effective counts are 2/21/24/0. Lead should record this in the packet follow-up or progress so the settled matrix is traceable; the packet itself should not be edited retroactively.

## Totals

- ok: 47 (indexes 0-46), including 16 and 17 as parked-then-settled by L12-17
- rework: 0
- needs-Lead-judgment: 0 (the packet's two parked rows are resolved by L12-17; reviewer agrees)
- Notes only (not rework): 17 (token form), 32/33 (alternative section choice), L12-17 concern 1 (sequencing with P8-DOC-GAP-01)
- Rework rate 0%, under the 3% expansion threshold. Deep-read: all 47 sources and every distinct target section named above.
- Replay caveat: 3 protected pins differ in this later worktree by design; confirm Lead's accounting records that the pin check is against inputHead 8b1d91078.
