# Step 8 fresh-reader score, round 1

Scorer: scorer:sonnet-session:a52eda71c8f750d40@2026-10-17
Key: plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-key.md
Key SHA-256 (recomputed, equals the required value): 1568f570026679c959cbc9f42af8e2d0542ee8d5ee9022ac78ad7b10c94a4056
Seal: review-a38-step-07-key-reseal-02.md, sealedAt 2026-10-17T11:55:30Z, commit 5d19b4940, eight candidate hashes
Readers:
- reader-1: `reader-1:sonnet-session:a970e221f1a542328@2026-10-17`, start 2026-10-17T11:56:00Z
- reader-2: `reader-2:sonnet-session:ac28990dac4064164@2026-10-17`, start 2026-10-17T11:56:05Z (self-reported finish 11:56:38Z)

Method: key read in full; both answers read in full; every explicit path#anchor re-run with
`env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check docs/platform/<path>#<anchor>` in
/home/vantt/projects/forgentX-s8-review. Shorthand section citations (HL#17, PS#3, ES#23 and similar) were
checked against the real `## N.` headings. A cell passes only when it identifies owner/obligation, gives a
real supporting candidate anchor and applies it to the proposal. Partial scores zero. Pass needs at least
5/6 on Q1-Q6 per scenario. Q7 is the authoring probe and must be correct.

## 1. Preconditions

| Check | Result |
|---|---|
| Key SHA-256 equals 1568f570...4056 | yes |
| Seal 11:55:30Z precedes both starts (11:56:00Z, 11:56:05Z) | yes, 30 s and 35 s margin |
| Eight allowed files in reader corpus hash to the seal's eight candidate hashes | yes, all eight identical (README bcaf7a43, foundations e050932d, governance 0e7d8209, architecture-map 62a92dc3, component-boundary 281aad15, holder-lock 86471bd4, process dbca061f, event-store 66a50ad6) |
| Worktree docs/platform equals the reader corpus | yes, `diff -rq` empty, so worktree anchor checks apply to what readers saw |
| Corpus snapshot 5d19b4940 equals sealed commit | yes |

Observation, not a rule failure: reader-2 self-reports 33 s wall time for eight files and 21 answers. The
read log is internally consistent with the file contents (line counts 796, 1629 and the cited line 412/455
rows are accurate), so no evidence of key exposure; recorded for the Lead.

## 2. Read-log validation

| Reader | Distinct files | Allowed only | Forbidden or out-of-scope read | Verdict |
|---|---|---|---|---|
| reader-1 | 8 (README, process, holder-lock, event-store, foundations, component-boundary, governance, architecture-map); READER-BRIEF is the brief itself | yes | none. It states it did not open an rtk tee-log hint nor an auto-saved tool-results file | ok |
| reader-2 | 8 (README, holder-lock, process, event-store read twice and counted once, component-boundary, governance, foundations, architecture-map); brief only besides | yes | none | ok |

Neither reader opened session-identity, dashboard portal, contracts, plans, legacy docs or switchboards; both
only named them as unopened. Proof distinction respected by both: each states "observed by me: none".

## 3. Anchor verification

Both counts below are distinct path#anchor strings extracted from each answer (citations with a real heading anchor).

### reader-1 (24 extracted strings)

| Result | Refs |
|---|---|
| resolves (exit 0), 19 | architecture-map.md#9-luật-vận-hành-bản-đồ; component-boundary.md#3-update-rule, #4-current-high-level-components, #5-how-to-change; governance.md#3-document-types, #4-authority-matrix, #5-metadata, #11-linking-discipline; holder-lock/spec.md#1-purpose, #2-ownership-boundary, #7-registry, #15-hot-state-mutex-and-porting-events-pending; platform-foundations.md#2-authority, #4-design-gate, #l5-definition-of-done-sáu-câu-hỏi; process/spec.md#3-facts-the-judge-table; README.md#2-area-registry, #4-how-to-change-platform-docs |
| FAILS, fabricated, 1 | `platform-foundations.md#l3--luật-store-truth--jsonl-db-là-view` (cited in B1 and B7; real anchor is `l3-luật-store-truth-ở-jsonl-db-là-view`). The invented slug (double hyphens, missing "ở") appears nowhere in the candidate corpus (grep over all eight files finds no `l3--`), so the reader made it up by slug rule and never verified it, against the brief's "cite only anchors you verified" |
| non-resolving shorthand, 4 strings | `architecture-map.md#9`, `component-boundary.md#4`, `README.md#1`, `README.md#3`, `README.md#4`: bare section numbers in prose that map to real `## N.` headings (README #1, #3, #4; boundary section 4; map section 9). Not counted as fabrication, noted as sloppy |

Shorthand HL#14/#17/#19/#20/#21, PS#1-#9 and ES#2/#3/#4/#9/#13/#15/#20/#22/#23/#24/#25/#26 all map to real headings.

### reader-2 (43 extracted strings)

All 43 resolve with exit 0 (every event-store, holder-lock, process, governance, component-boundary,
architecture-map and foundations anchor cited, including `platform-foundations.md#3-law-summary`,
`holder-lock/spec.md#20-lịch-sử-quyết-định`, `process/spec.md#8-lịch-sử-quyết-định`,
`event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1`). Fabricated: 0. Line-number
references "CB line 412" and "AM line 455" were also checked and are accurate (Work Integration Boundaries row; CTR010 row).

## 4. Score tables (Q1-Q6 scored, Q7 probe)

Key references: key rows A1-A7, B1-B7, C1-C7 of the sealed key.

### reader-1

| Cell | Key ref | Verdict | Note |
|---|---|---|---|
| A1 | A1 | pass | README#2, HL#1/#2, PS#3 |
| A2 | A2 | pass | two-component split; live-holder takeover limit cited in A3/A4 |
| A3 | A3 | pass | port, registry, predecessor, signal-by-identity |
| A4 | A4 | pass | high; unknown held; PID reuse; bare PID; PS#7, HL#1/#17/#19 |
| A5 | A5 | pass | vectors in cargo and Node, doctor checks, PS#5; "observed: none" |
| A6 | A6 | pass | PS#8, HL#20, supersede not edit |
| A7 | A7 | pass | proposal not fact; owners PS#3 and HL; all 12 metadata fields; links |
| B1 | B1 | pass in content, anchor FAILS | foundations L3 anchor invalid (see section 3) |
| B2 | B2 | pass | signed D-ADR0055, not started, L3 clause 2 kept (B4, B6) |
| B3 | B3 | pass | owners; 58 under 60 throws; ack after fsync |
| B4 | B4 | pass | high; signed vs implemented; gates unmet; superseding note beside L3 |
| B5 | B5 | pass | 23.2 matrix; prototype evidence cannot substitute |
| B6 | B6 | pass | superseding record, ES#26, foundations#2 |
| B7 | B7 | pass in content, anchor FAILS | repeats the invalid L3 anchor |
| C1 | C1 | pass | portal, CB#4, map 5 and 9 |
| C2 | C2 | pass | surface not L0 Process; Work owns completion |
| C3 | C3 | pass | state door, run door, evaluator, CTR010; no CTR001/003/005 ids but obligations covered |
| C4 | C4 | pass | L10, L9/L7 |
| C5 | C5 | pass | row, manifest, architecture test, npm test |
| C6 | C6 | zero (partial) | map registration and boundary note given; no decision record and no map version update |
| C7 | C7 | pass | authority claim contradicts boundary; metadata and links |

Per scenario Q1-Q6: A 6/6 (pass), B 6/6 (pass on content), C 5/6 (pass). Probes A7, B7, C7 correct.
Score nonetheless fails the gate on the hard rule: one fabricated anchor.

### reader-2

| Cell | Key ref | Verdict | Note |
|---|---|---|---|
| A1 | A1 | pass | README#2, HL#1/#2, PR#3/#4 |
| A2 | A2 | pass | owner split; superseding decision, not silent edit |
| A3 | A3 | pass | judge vectors, port, registry, predecessor, fence; non-owner statements |
| A4 | A4 | pass | high; unknown means hold; PR#7; HL#4 Windows limit |
| A5 | A5 | pass | vectors in cargo and Node, HL#5, HL#13 doctor checks, PR#5; observed none |
| A6 | A6 | pass | HL#20, PR#8, CB#3 |
| A7 | A7 | pass | rejected claim; PR#3 and HL owners; 12 fields; typed links, boundary note |
| B1 | B1 | pass | README row, ES#1/#2/#23/#26, L3 note by name, HL#15 |
| B2 | B2 | pass | owner Event Store; reversal needs decision superseding D-ADR0055 (L3 1/4 superseded in B3, clause 2 stands in B4) |
| B3 | B3 | pass | 58/70 rows, state 60 gate, ES#13; ack point in B4 |
| B4 | B4 | pass | settled / provisional / not implemented; seal under gate throws |
| B5 | B5 | pass | ES#23.2 items; ES#24 not a substitute; observed none |
| B6 | B6 | pass | D-ADR0055 in ES#26, review threshold, L3 note |
| B7 | B7 | pass | contradicts L3 clause 2 and D-ADR0055; ES#26 supersession; proposals non-canonical |
| C1 | C1 | pass | README, CB#3/#4, PF L10, AM#9 |
| C2 | C2 | pass | host and surface slice; Work, Execution Core, Evaluator owners |
| C3 | C3 | pass | Work verbs, evaluator "should not authorize lifecycle mutation", Execution Core, CTR010; registration obligations covered |
| C4 | C4 | pass | L9, L10; surface bypass; Execution Core forbids lifecycle dependency |
| C5 | C5 | pass | boundary note (would be false), AM#9 row, manifest and architecture test; names the unproven gap |
| C6 | C6 | pass | decision record plus version bump, boundary row |
| C7 | C7 | pass | boundary-changing decision, not a fact; metadata; links; registration |

Per scenario Q1-Q6: A 6/6, B 6/6, C 6/6. Probes A7, B7, C7 correct.

## 5. Other gate checks

| Check | reader-1 | reader-2 |
|---|---|---|
| Start after seal | yes | yes |
| At most 8 distinct files, only allowed | yes | yes |
| Forbidden or out-of-scope read | none | none |
| Fabricated anchors | 1 (L3, cited twice) | 0 |
| Legacy used as authority | none (legacy only noted as carried text) | none |
| Authoring probes correct | 3/3 | 3/3 |
| Each scenario at least 5/6 | yes | yes |

## 6. Defect adjudication (reader-reported)

| Reported defect | Adjudication |
|---|---|
| README anchors `#l5-definition-of-done-sáu-câu-hỏi` and `#9-luật-vận-hành-bản-đồ` broken (both readers; reader-2 says slugs differ) | READER ERROR. The checker returns exit 0 for both; README lines 86 and 88 use exactly those anchors, and the real anchors are `l5-definition-of-done-sáu-câu-hỏi` (foundations line 221) and `9-luật-vận-hành-bản-đồ`. Reader-1 mis-derived the slugs by hand ("double hyphen"), the same error that produced its fabricated L3 anchor. Not a candidate defect |
| holder-lock rank table lacks ranks 58 and 70 | ACCURATE OBSERVATION, not a defect. holder-lock/spec.md section 7 table has 10/15/20/30/40/50/55/60/80; event-store/spec.md section 4 declares `event-seal` 58 and `event-append` 70 as "two new registry rows" for a not-started implementation and states the effect on rank order. Consistent as planned; the registry rows land with implementation. Related stale text (HL still treating state 60 as pending, ES line-number cites such as holder-lock/spec.md:114-126) belongs to the already-routed P7-DOC-GAP-03 / Step 9 wording work. Rationale-only, never a Step 8 fail |
| platform-foundations.md header Design status Candidate, Canonical: No, Canonical for: None until review and atomic cutover (both readers); governance.md also Canonical: No | ACCURATE, and by design: the corpus is a pre-cutover candidate (headers confirmed at foundations lines 5-18, governance line 11). README still routes to them as anchors. It is a known cutover-state fact, not a wrong answer-driving contradiction; no key answer depends on Canonical: Yes. Advisory for Step 9, not a candidate content defect |
| component-boundary.md and architecture-map.md "Canonical: Yes, after review" with Draft status | ACCURATE (lines 8), same cutover-state class; rationale-only |
| component-boundary.md section 4 table has no Event Store row (reader-2) | ACCURATE, minor routing gap. Event Store appears only in carried text (line 1012 "Work State And Event Store Kernel"); the README area registry does route to event-store. Readers still answered B correctly. Advisory to Step 9 alongside P7-DOC-GAP-03 (the boundary doc is already flagged stale, "until the event store decision") |
| HL/PR headers use `Implementation status:` while governance asks `Implementation:`; ES lacks Writer type | ACCURATE metadata-name drift in area specs; advisory, rationale-only, Step 9/Phase 9 truth item |
| ES cites holder-lock line numbers and HL#9 rank rule | Plausibly stale line cites, advisory, same class |

Real candidate defects found that affect Step 8 scoring: 0. Advisory items for Step 9 only: component-boundary
Event Store row and stale wording, metadata field-name drift, Candidate/Canonical flags until cutover.

## 7. Overall gate verdict: FAIL (round 1)

Exact reasons:
1. reader-1 cites one fabricated, non-resolving anchor, `platform-foundations.md#l3--luật-store-truth--jsonl-db-là-view`, in B1 and B7. The hard gate requires zero fabricated anchors. Checker: exit 1, missing; the invented slug is not found anywhere in the eight allowed files. This is a reader error (the candidate's valid anchor is `l3-luật-store-truth-ở-jsonl-db-là-view`), not a candidate or key defect.
2. reader-1 also scores zero on C6 (no decision record or map version update); this does not by itself fail (C is 5/6) but is recorded.
3. Everything else passes: reader-2 passes every criterion (18/18 DoD, 3/3 probes, 0 fabricated, 8 allowed files, starts after seal, no legacy authority); reader-1 passes read log, start order, budget, legacy and probes, with 6/6, 6/6, 5/6.

Because Step 8 requires BOTH readers to pass, the round-1 gate fails. No correction of the candidate or key is implied
by the failure (both reader-reported "broken README anchors" are reader errors; the key stays valid). Per Step 8 the
Lead may use the remaining round (round 2, new reader sessions) or record an L11 decision; this score does not choose.

Status: DONE
Summary: FAIL. reader-1 A 6/6, B 6/6, C 5/6, probes 3/3 but 1 fabricated anchor (foundations L3, cited twice); reader-2 A 6/6, B 6/6, C 6/6, probes 3/3, 0 fabricated. Fabricated anchors total 1. Real candidate defects found: 0 (README anchor reports were reader errors; rank 58/70 gap and Candidate/Canonical flags are accurate but by-design/Step 9 advisories).
