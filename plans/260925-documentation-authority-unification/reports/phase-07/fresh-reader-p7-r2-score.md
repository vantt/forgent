# Step 8 fresh-reader round 2 score

Scorer: scorer:sonnet-session:a5df078f099d3a6b8@2026-10-17
Key: plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-key.md
Key SHA-256 (recomputed in worktree c0e99c604): 1568f570026679c959cbc9f42af8e2d0542ee8d5ee9022ac78ad7b10c94a4056 (equals the required value and the seal in review-a38-step-07-key-reseal-02.md)
Seal: sealedAt 2026-10-17T11:55:30Z, commit 5d19b4940, reviewer reviewer:sonnet-session:af694ae076618d5e6@2026-10-17
Corpus check: the eight allowed files in reader-corpus-5d19b4940/docs/platform hash to the eight candidate hashes in the seal (README bcaf7a43, foundations e050932d, governance 0e7d8209, architecture-map 62a92dc3, component-boundary 281aad15, holder-lock 86471bd4, process dbca061f, event-store 66a50ad6). The same eight files in the worktree docs/platform are byte-identical (cmp) to the corpus.

Readers (both after the seal):
- reader-3:sonnet-session:aab9a52ae255b47e3@2026-10-17, start 2026-10-17T12:01:56Z (6 min 26 s after seal)
- reader-4:sonnet-session:a4fa6d88ae3dc9923@2026-10-17, start 2026-10-17T12:02:01Z (6 min 31 s after seal)
Reader identities differ from each other, from the round-1 readers and from the key author/reviewer, as far as the headers show.

## 1. Question scoring (Q1-Q6 DoD, Q7 authoring probe)

Rule applied: a cell passes when it names the owner/obligation with a real supporting anchor and applies it to the proposal (key "Common evidence and scoring"); partial scores zero. Equivalent anchors inside the eight files and file+heading citations are accepted. "Observed proof" was stated as "none" by both readers in A5/B5/C5.

| Cell | Key reference | reader-3 | reader-4 |
|---|---|---|---|
| A1 | README area registry, holder-lock 2, process 3 | PASS (README registry rows, holder-lock 1/2, process 3, boundary 4) | PASS (same chain) |
| A2 | two-component change; holder-lock cold exclusion, process facts/control, no TTL takeover | PASS (two L1/L0 components, no automatic takeover path) | PASS (two authorities, no path defined for taking from a live holder) |
| A3 | port.v1, predecessor, registry; judge vectors, signal-by-identity | PASS (7, 8, process 2 and 4, fence) | PASS (port, registry, predecessor, judge, signal_by_identity) |
| A4 | high; unknown held; PID reuse/namespace; bare PID race; limits | PASS (process 3, 4, 7; holder-lock 1, 17, 19) | PASS (same distinctions; settled/implemented/draft split) |
| A5 | reject; shared judge vectors Rust+Node; setup/doctor; required not run | PASS (cargo+Node vectors, doctor checks, fgctl refusal, L5; observed none). Does not name "full suite" or identity-safe control vectors; counted as category coverage | PASS (shared vectors, doctor checks, fgctl, L5, new vector for unknown/held; observed none) |
| A6 | decision history at owners, boundary or no-change note | PASS (holder-lock 20, process 8, boundary 5) | PASS |
| A7 | false claim; process 3 / holder-lock 3; baseline metadata; links | PASS (12-field baseline listed; Related Files; boundary; proposal route) | PASS (12-field baseline listed; Proposal/scratchpad; typed Related Files) |
| B1 | portal, event-store 3, L3, holder-lock 9 | PASS (README row, event-store 2/9/4/13/23.2, L3) | PASS (README row, event-store 2/9/10/4/13/23/26, L3, holder-lock 7) |
| B2 | contract plus locked-law change; signed D-ADR0055, not implemented; supersedes L3 clauses 1,4 | PASS (26, D-ADR0055, clauses 1 and 4; clauses 2,3 kept in B4) | PASS (signed, D-ADR0055, L3 locked law; clauses 1 and 4 in B3) |
| B3 | store/consumer/holder-lock split; ack after fsync; 58 under 60 refused, 70 allowed | PASS (3, 4, 13; 58/70/60; fsync in B4) | PASS (3, 4, 13; 58/70/60; fsync in B4) |
| B4 | high; signed is not implemented; gates unmet | PASS (fsync, seal-under-gate violation, view-only contradicts L3.2, "half wrong", not started) | PASS (same, plus section 23.1 "not proven") |
| B5 | 23.2 owns acceptance; 24 cannot substitute | PASS (kill matrix, 10,000 interleavings, V-AUTH-01, three-machine, setup/doctor, npm+cargo; observed none) | PASS (same categories plus rg door check; observed none) |
| B6 | keep decision and law separate from status; no placeholder D-ID | PASS (new decision supersedes D-ADR0055; L3 note; "Not started" line) | PASS |
| B7 | false; conflicts with L3.2 and D-ADR0055; route to foundations + event-store 26 | PASS (26, supersedes D-ADR0055, baseline "as in A7", links; stream-type registration not named, "where relevant" in key) | PASS (26, 15, 25, L3; Supersedes D-ADR0055; Related Files; no in-place edit) |
| C1 | portal, map + boundary table, not retired cognition | PASS (README row, boundary 4, register, L9/L10, map change rule) | PASS (README row, boundary 4, register, L9/L10, map 9) |
| C2 | slice/authority design change; surface is not L0; Work owns lifecycle | PASS | PASS |
| C3 | CTR001/002 state, 003, 005; 010/011 not duplicated; evaluator does not mutate Work | PASS (CTR002, CTR005, Execution Core, evaluator, Work engine) | PASS (CTR005, CTR002, CTR010 gateway REST named correctly; boundary 15) |
| C4 | high; second run/write door; success is not merged/durable | PASS (L9, L10, run door) | PASS |
| C5 | reuse doors; map row + manifest + architecture test; map ritual caveat; no run inferred | PASS (ritual, manifest/architecture test, behavior tests, L5; observed none; caveat not stated, nothing invented as law) | PASS (adds that the ritual's binding force is itself pending) |
| C6 | decision + map update, boundary note | PASS | PASS |
| C7 | proposed reassignment contradicting boundary; Work owns lifecycle; metadata/links/registration | PASS (authority violation, Work engine, baseline, Related Files, map slice row) | PASS (surface only displays/requests; baseline; typed links; slice row, manifest row, contract) |

Per-scenario scores (Q1-Q6, threshold 5/6; authoring probe must be correct):

| Reader | A | A probe | B | B probe | C | C probe |
|---|---|---|---|---|---|---|
| reader-3 | 6/6 | correct | 6/6 | correct | 6/6 | correct |
| reader-4 | 6/6 | correct | 6/6 | correct | 6/6 | correct |

Both readers: 18/18 DoD answers and 3/3 authoring probes. No reader was held to 5/6 by a borderline cell, so the verdict does not depend on the lenient A5 and C5 calls noted above (a failure of one of those would still leave 5/6).

## 2. Anchor verification

Method: every `path#anchor` token in each answer was extracted, shorthand same-file `#anchor` tokens in reader-4 were resolved against the file named in that bullet, and each was run in the worktree as `env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check docs/platform/<path>#<anchor>`.

| Reader | Distinct full path#anchor citations | Shorthand anchors resolved | File+heading citations without an anchor | Result |
|---|---|---|---|---|
| reader-3 | 33 | none | L5, L9, L10, L3 and sections of platform-foundations; map section 9 (anchor also valid) | 33/33 exit 0 |
| reader-4 | 25 | 30 (holder-lock 2,3,5,8,13,17,19; process 3,4,5,7; event-store 2,4,9,10,13,15,21,23,26,232; governance 7; boundary 4,5) | L3, L9, L10 headings; "5-high-level-component-authority-register" and "15. Run Result Evaluator Boundary" | all exit 0 |

Checks that exit 0 beyond the extracted list: component-boundary#5-high-level-component-authority-register, component-boundary#15-run-result-evaluator-boundary, platform-foundations#l9-thang-hoàn-tất-của-một-việc-run-merge-durable, #l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa, #l3-luật-store-truth-ở-jsonl-db-là-view, process/spec.md#5-os-neutral-port. One reader-4 shorthand, `#5-os-neutral-port`, was cited in the process-spec context and exists there; it does not exist in holder-lock/spec.md and was not cited for it.

Fabricated anchors: 0 for both readers. File+heading citations without an anchor are acceptable per the round-2 instruction. Reader-4's "decision log seq 65" matches event-store/spec.md line 716.

## 3. Read-log validation

| Item | reader-3 | reader-4 |
|---|---|---|
| Start after seal (11:55:30Z) | yes, 12:01:56Z | yes, 12:02:01Z |
| Distinct files read | 8 (README, holder-lock, process, event-store, governance, foundations, component-boundary, architecture-map) | 8 (README, process, governance, foundations, holder-lock, event-store, component-boundary, architecture-map) |
| Only allowed files | yes | yes |
| Brief read | READER-BRIEF.md, the brief itself, uncounted | same |
| Out-of-scope read declared | none; names session-identity, work-state, proposals README, contract JSON, herdr-web-dashboard README without opening | none; `wc -c` on the eight files (sizes only, no content) and overflow-file paths not opened |
| Out-of-scope read visible in answer | none (links, contracts and tests are named, "not checked") | none |

Limitation: I validate the logs from the readers' own reports and from the consistency of their citations with the eight files; I did not have the tool transcripts. Nothing in either answer cites or quotes content from a file outside the eight (the only cross-file facts, such as CTR010 as gateway REST and "legacy foundations lines 184-190", appear in the allowed files themselves). Key never cited as read by either reader. Verdict: budget, scope and ordering conditions met.

Legacy-as-authority answers: 0. Both treat platform-foundations.md (candidate, carrying L3/L9/L10 text) as the law surface, cite owners inside the candidate corpus, and name legacy only as provenance or as a route they did not open.

## 4. Adjudication of reader-reported defects

Verified against worktree c0e99c604.

| # | Reported by | Finding | Verdict | Route |
|---|---|---|---|---|
| 1 | both | holder-lock/spec.md section 7 rank table lists 10..80 with `state` at 60 and no 58 or 70 row; event-store/spec.md section 4 (line 138-141, 725) declares `event-seal` 58 and `event-append` 70 and cites holder-lock lines 114-126 | Real candidate defect (cross-owner inconsistency in carried text). Not a reader error. It does not make any key cell wrong (B3 is owned by event-store section 4). Registry rows belong to the owner doc and land with implementation | Step 9, as part of the existing P7-DOC-GAP-02/03 lock-row carry and wording reconciliation; rows themselves arrive with the Event Store implementation, no Phase 7 rework |
| 2 | reader-3 | component-boundary section 4 has no Event Store row (only the Holder-lock row mentions the event store, line 84; line 1012 is the carried legacy list) | Real candidate gap in the boundary table; the README registry row and event-store spec section 3 still route correctly. Wording/coverage, not an authority conflict | Step 9 (P7-DOC-GAP-03 boundary wording) or a Phase 8 area-reconciliation row; no re-key needed |
| 3 | both | component-boundary.md:84 and holder-lock/spec.md:243 say "until the event store decision" although D-ADR0055 is signed | Real stale wording, already recorded as advisory in the reseal-02 review. Rationale-only wording, never a fail | Step 9 / P7-DOC-GAP-03 (say "until implementation") |
| 4 | reader-4 | README header says `Design status: Accepted` while governance, foundations, boundary and map say Candidate/Draft and Canonical: No | Real metadata inconsistency in the portal header; README body also says legacy sources remain in place. Status labelling only; both readers scored correctly by treating drafts as drafts | Phase 9 (cutover flips candidate headers and status together); not a Phase 7 rework |
| 5 | reader-4 | platform-foundations L10 still says its doctrine stands "SAU L3 rule 4" (line 355) though D-ADR0055 superseded clauses 1 and 4 | Real, but expected: the law text is carried verbatim and a law is superseded by a note beside the original, never edited in place (foundations section 2; L3 supersession note present at line 185 and in the law summary row). L10 gains no contradiction with the signed decision because the Work door remains the consumer's gate. Rationale-only wording | Phase 9 truth item (reconcile law cross-references at cutover); no rework |

Other reader remarks (session-identity absent from README registry, metadata field-name drift in the three specs, missing "how to register a low-level primitive" rule, heading-level quirks in carried sections) are navigation or wording observations outside the key's required answers; none changes a score. They are listed for Step 9 / Phase 9 triage and are not adjudicated as failures.

## 5. Overall gate verdict

PASS.

Reasons:
1. Key integrity: key SHA-256 matches the seal; the seal timestamp precedes both start times; reader corpus and worktree files hash-equal the eight sealed candidate hashes.
2. Each reader scored 6/6 in each of scenarios A, B and C (threshold 5/6) with a correct authoring probe in all three.
3. 0 fabricated anchors across 58 distinct full citations plus 30 resolved shorthand anchors and the heading-only citations; every checked anchor exits 0 in `scripts/list-doc-anchors.mjs --check`.
4. Each read log lists 8 distinct allowed files, no out-of-scope read, no key exposure visible.
5. 0 legacy-as-authority answers.
6. Five reader-reported defects are real candidate wording/consistency issues but none is a score failure; each is routed (Step 9 or Phase 9) above.

Status: DONE
Summary: PASS. reader-3 A 6/6, B 6/6, C 6/6, probes 3/3 correct; reader-4 A 6/6, B 6/6, C 6/6, probes 3/3 correct. Fabricated anchors 0; read-log violations 0; legacy-authority answers 0. Real non-blocking defects: holder-lock rank table lacks 58/70 (Step 9), component-boundary lacks an Event Store row (Step 9 or Phase 8), "until the event store decision" stale wording (Step 9), README "Accepted" header versus candidate headers (Phase 9), L10 cites superseded L3 rule 4 (Phase 9).
