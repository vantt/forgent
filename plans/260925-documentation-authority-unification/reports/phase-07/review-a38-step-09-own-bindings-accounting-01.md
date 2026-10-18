# A38 ordinary review: Step 9 Phase-7-own bindings, N1/N2 and plan-owned accounting (package-02, A46 scope)

Reviewer: `reviewer:sonnet-session:a48d95e1d3297113a@2026-10-18`
Author sessions (preserved per row set):
- routing bindings (31) and the A34 join decision rows (15): `codex-session:fgos-run_unit-run-179224f23e2a8f@2026-10-17`
- N1 native re-carry, gap decision, document row, N2, identical-owner join: `codex-session:fgos-run_unit-run-179225dfe65eba@2026-10-18`
- accounting sets (ratchet, citation, reproduction, lanes, carry declaration, provenance, later drift): `codex-session:fgos-run_unit-run-179229832261fa@2026-10-18`
Review mode: ordinary
Reviewed commit: 9ac0f42fb4322880d3a6c4c3f57b8535fe25f25f (read-only worktree, detached; nothing written in any repo)
Content commit under review: e6b7efeece3d28f3bc9b47ecd3b748f54a8d90ed; accounting commit 2296413a2.
Scope: the 16 sets named in the request, 94 entries, every entry deep-read (mandatory). All verdicts are `deep`. No verdict is applied by this report.

## 1. Method and mechanical receipts

- Ran the producer's portable auth script, narrowed to my 16 sets (copy in the scratchpad with only the entry filter changed; no inventory, carry, sync, fgos CLI or npm test): 94 entries checked, 0 assertion failures (31 routing-binding, 15 A34-join, 7 identical-owner-join, 3 N2, 3 N1-native-recarry, 1 N1-gap-decision, 1 N1-document, 33 accounting rows).
- Independent recomputation beyond that script (details per section below): line/range/unit/compact-JSON digests, ledger rows vs occurrences, real unit digests at e6b7efeec, sealed key anchors, git ancestry and file-touch of every named commit, ratchet digests, citation findings with and without the three baseline keys, and the pinned-HEAD run of the reproduction test.
- `env -u CLAUDE_CODE_SESSION_ID node scripts/check-legacy-docs-ratchet.mjs`, run un-piped: exit 0 ("clean (995 legacy files checked; 26 accounted edit(s), 1 accounted new file(s)").
- `git diff 879a4d5fe 2296413a2 -- scripts` touches exactly two files: `scripts/check-legacy-docs-ratchet.exceptions.json` (63 lines) and `scripts/check-decision-citation-drift.baseline.json` (+7). Both are data; no script, gate or comparator code changed.

## 2. Findings that matter

1. REWORK R1 (ledger only, accounting set `accounting-reproduction-exact-pairs`): the required doc-tooling test `test/scripts/doc-rationale-reproduction.test.mjs` fails at the pinned HEAD 9ac0f42fb (2 of 8 fail: `step10-round5-reproduction.json` and `step10-sync4d-reproduction.json`, `historicalEqual:false`). Cause, proven from the test output: `unaccountedPairs` = `[{commit: 9ac0f42fb4322880d3a6c4c3f57b8535fe25f25f, path: plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md}]`. The Lead commit 9ac0f42fb (scope-to-own-changes) edited that plan file (+2 lines at line 413) after the accounting author's pairs were written. The 16 pairs themselves are correct and complete for 2296413a2; the "67/67 pass" claim holds at 2296413a2 and not at 9ac0f42fb. Exact fix: add one exact pair `{commit: "9ac0f42fb4322880d3a6c4c3f57b8535fe25f25f", path: "plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md", authority: "A46 / Phase 7 authorized plan accounting"}` to the `scripts` key of `reports/phase-06/step10-round5-reproduction.json` and to the `readOnlyScripts` key of `reports/phase-06/step10-sync4d-reproduction.json`, mirror both in `step-09-accounting-reproduction-pairs.json` `changes[*].addedExactPairs`, and re-bind the two live file digests. The commit that adds the pairs must not touch the phase-07 plan file again (otherwise it creates the next unaccounted pair); any later edit to the phase-06/07 plan files needs its own pair afterward. This is not a content or candidate defect.
2. No other rework. All 31 routing digests are real (recomputed). N2 shows no sealed answer, route or anchor change. N1's holder-lock header fix is the only identity-source change after 8b2ee4dd9. Ratchet, citation and carry accounting hold.
3. Advisories (not rework, rationale-only per L10-37): see section 9.

## 3. Routing bindings (31 entries, source: part-036, author 179224f23e2a8f)

Placeholder check: no placeholder digest remains in `cross-area-inventory.json` (all 108 rows hold real 64-hex digests; the word "placeholder" appears only in the `digestBindingReceipt` file name). For the 31 rows I recomputed:
- every source side as sha256 of the exact UTF-8 line at the stated line of the pinned file, and compared the stored `content` string (all equal);
- X-NAV target as sha256 of `docs/platform/README.md` lines 43-64 joined by newline, equal to the stored digest, and the production unit digest for anchor `unheaded-block-6` (auth);
- X-DEFECT-06..08 targets as sha256 of the compact JSON array of production unit textDigests (auth, plus anchors exist at e6b7efeec);
- X-DEFECT-09..14 targets as sha256 of the compact JSON of the `step-06-projections.json` dispositions row, with the row content equal to the stored content (auth);
- each row's source/target digest equals `cross-area-inventory.json` `sourceDigest`/`targetDigest`, reviewStatus pending (auth).

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| X-NAV-01..04 | ok | deep | Source line 432 and README block (lines 43-64) digests match. The block's system-architecture row routes to all four files named by the gap (roadmap, workspace-topology, topology audit, topology roadmap, plus architecture intent and system vision). Disposition `repair-candidate-portal-or-header` is satisfied by the candidate portal; the switchboard stays frozen. All four rows share one source line and one target block by design. |
| X-DEFECT-01..05 | ok | deep | Source line equals target line (owner-queue.md lines 21-25). These are ledger/rationale observations (C1-D01, C1-A01, C1-R01, C1-R03, C1-R05), not candidate text; routed rationale-only to Phase 9. |
| X-DEFECT-06 (TRUTH-15) | ok | deep | Target note in `runner/architecture/h-7af1f0242611.md` cites `runner.md:2470,2602` and `:2890`. Correct at the Phase 6 pin; main imports since moved legacy `docs/specs/runner.md` by +7 lines (ADR 0034 heading 2890 at B0, 2897 now; ADR 0031 2583 vs 2590). Citation drift into a live legacy file, Phase 9 accounting. Not a Phase 7 defect. |
| X-DEFECT-07 (TRUTH-26) | ok | deep | Host-use-cases link text now names a real path (`../../../architect/host-invocation-routing/host-invocation-provider-routing.md`), consistent with the Related Files row. |
| X-DEFECT-08 (TRUTH-27) | ok | deep | Candidate says `bin/fgos.mjs:4410,4498` and "evolve --help returns unknown verb". Correct at the Phase 6 pin; in this tree the unknown-verb sites are 4426/4514 (+16 from main's later bin edits). Same Phase 9 citation-drift category; the paragraph itself says "full truth check owed at promotion". |
| X-DEFECT-09..14 | ok | deep | Compact JSON digest and content equal the `step-06-projections.json` rows GRP-LIVE-01, GRP-HEAD-02, GRP-SPECS-03, F10-11, F10-12, F10-13; each carries a Phase 9 or scorecard obligation, none claims truth. |
| QF-01..13 | ok | deep | Source line equals target line (phase-07 plan lines 196-208, the family table). Lead commit 9ac0f42fb inserted only after line 412, so the bindings are unshifted. Routes match the table text (Step 5 sample / Phase 9 / Phase 8 / owner-only). |

## 4. N1 (5 entries, source: part-121, author 179225dfe65eba)

- `git diff --name-only 8b2ee4dd9 e6b7efeec` outside `plans/260925-*` lists exactly one file: `docs/platform/holder-lock/spec.md`, one line (the Implementation status header now says the state mutex stays with the state store pending implementation of the signed Event Store decision D-ADR0055, section 15). No AGENTS.md, CLAUDE.md, switchboard or other identity-scope byte changed.
- Extractor on both pins: heading unit digest changes (heading digest folds in the following block digest, `generate-doc-inventory.mjs` line 633), unheaded-block-1 digest changes (1f313e1b to 0be636c7), all other units equal; 89 units both sides.

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| N1-native-1 (claim_d96a457a, H1 heading) | ok | deep | Same claimId and anchor, edited-kept with lineage fromSourceUnitDigest 4a6160ea to toSourceUnitDigest 0fb9c475 (recomputed from both pins), unitDigest recomputed as sha256(kind+"\n"+digest), status `needs-review`. The heading digest change is mechanical (it embeds the following block), not a heading edit. |
| N1-native-2 (claim_7cfb055e, unheaded-block-1) | ok | deep | Predecessor preserved unchanged as identityGaps row with `identityStatus: identity-gap` and gapReason (edited unit, anchor not a stable heading anchor). Before row equals the persisted prior registry row; digest 1f313e1b matches the B0-side unit. |
| N1-native-3 (claim_d637f3e5, new unheaded-block-1) | ok | deep | New own claimId, sourceUnitDigest 0be636c7 equals the unit at e6b7efeec, origin `added-since-8b2ee4dd9`, absent from the prior registry (checked). `step-09-package-n1-native-boundary.json`: allowed delta is exactly these three ids, 0 lost ids, 100,035 unchanged records equal. |
| N1-gap-decision | ok | deep | Row in `ledger/decisions/s7-step09-n1-holder-lock-predecessor.json` is `supersede`, pending, no approval fields; predecessor is in identityGaps with the same sourceUnitDigest; targetUnitDigest 0be636c7 equals the real unit; the rationale names successor claim_d637f3e5 and states no identity transplant or approval. |
| N1-document | ok | deep | `documentAfter.sourceDigest` e35f39ec = sha256 of the file; blobSha 2808d006 = `git hash-object` and the e6b7efeec tree entry; sourceId preserved; registry commit field is e6b7efeec. |

## 5. N2 (3 entries, parts 114/115, author 179225dfe65eba)

Seal: `review-a38-step-07-key-reseal-02.md` (key sha256 1568f570..., commit 5d19b4940). Current key file hash is identical to the sealed value, so the key was not edited. Compared 5d19b4940 to e6b7efeec for the eight key files: README, governance, architecture-map, process spec and event-store spec are byte-unchanged; three changed (diffs read in full). All 41 distinct `path#anchor` refs in the key pass `scripts/list-doc-anchors.mjs --check` at the reviewed tree (0 failures). Heading lists compared: component-boundary identical; holder-lock same 21 headings and anchors (only line numbers shifted); foundations gains one new trailing heading `Added in candidate: Main projection conservation` and nothing renumbered.

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| N2-1 platform-foundations.md | ok | deep | Changes: L10 row added to the law index (already the target of C4's `#l10-...` anchor, which resolves) and an appended section carrying main's RUL3 D-ADR0055 supersession wording. L3 text, note at the L3 anchor, authority section and L9/L10 sections unchanged; B2/B4/B6/B7 and C4 answers, routes and anchors unchanged. |
| N2-2 holder-lock/spec.md | ok | deep | Header fix, planned ranks 58 and 70 (stated as not registered or implemented, citing Event Store spec section 4), section 15 reworded to "pending implementation of the signed decision". Cited sections 1-4, 8, 9, 13, 20, 21 keep their anchors and meaning; B3's 58/70 answer now agrees with the lock spec; A1-A7 and B1 unchanged. File hash e35f39ec matches the entry. |
| N2-3 component-boundary.md | ok | deep | Holder-lock row reworded to "pending implementation of the signed Event Store decision (D-ADR0055; implementation not started)" (this also resolves the earlier advisory about "until the event store decision") and a new Event Store row added in the same table. Anchors `#4-current-high-level-components` and `#5-how-to-change` unchanged; C1-C3, C5-C7 unchanged; the Event Store row agrees with B2-B5. File hash 40795a63 matches (auth). |

N2 conclusion: no sealed answer, route or cited anchor changed; Steps 7-8 do not need to reopen for the edits up to e6b7efeec. The key is stale against later main (the reported 92af7c8d6 drift touches component-boundary, event-store, holder-lock and process specs again); that is covered by the Phase 9 import step.

## 6. A34 joins (15 entries, part-091) and identical-owner joins (7 entries)

A34-join, per entry I checked: native tuple equals the live registry unit; decision row (full object) is present verbatim in the ledger or pilot decisions, `partial-carry`, pending, no approval fields; `targetUnitDigest` equals the real current unit digest at e6b7efeec (15/15); residual file bytes equal the prior hash (auth) and contain the claim and source digest (15/15).

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| X-A34-14 | ok | deep | Source unit exists at e6b7efeec; residual target digest equals the current target. |
| X-A34-15, X-A34-16 | ok | deep | Residual primary target 3b974a9c is the pre-rebind digest; decision target is now 16aceb21 (real). The residual's missing/rewritten RUL lines are still absent from the current target, so the residual stays accurate. |
| X-A34-17 | ok | deep | Observe residual unchanged; target digest real. |
| X-A34-18, 19, 20, 21, 22, 23, 25 | ok | deep | Residual target equals the current target digest. X-A34-21: the residual sentence is now a substring of the longer current successor text (legacy runner.md line 3134 extends it); disposition text already says "extended/reworded", so it stays valid. |
| X-A34-24, X-A34-26, X-A34-27, X-A34-28 | ok | deep | Residual primary target digest is older than the decision's rebound digest; residual text is not present in the current target (still uncarried). |

Note for all A34 entries pointing into legacy `docs/specs/*`: the native source digest does not appear in the legacy file bytes at e6b7efeec (found only in older revisions, e.g. runner.md at 31f676749). That is the declared unsynced-identity state (L11-15 and L11-18: identity changes ride the Phase 9 carry), not a join defect.

identical-owner-join (author 179225dfe65eba): for each group I checked every occurrence: claimId's native sourceUnitDigest equals the group digest (all), the ledger/pilot decision row has the same owner, anchor and targetUnitDigest (all), the target unit digest at e6b7efeec is real (all), owners set equals declared owners (all). `currentGroups` equals the expected identical units (auth).

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| identical-01 | ok | deep | Two occurrences, architecture-intent and system-vision, owners distinct, each at unheaded-block-10. |
| identical-02 (19 occ.) | ok | deep | All 19 rows found; target digests real. |
| identical-03 (5), identical-04 (2), identical-05 (2), identical-06 (3), identical-07 (3) | ok | deep | Occurrence targets differing from the group digest (for example identical-04's work-state heading 267b58ca vs group e3d926d4) are real reworded target headings, matching the GRP-HEAD-02 and GRP-SPECS-03 re-key obligations. |

## 7. Accounting sets (33 entries, parts 122-137, author 179229832261fa)

### 7.1 accounting-ratchet (7)

For the six after-rows: current file sha256 equals `expectedDigest` (all six match the bytes on disk and the live exceptions file), the named main commits touch the file and are ancestors of eab4d617b, and the listed set equals exactly `git log 70a9d1134..eab4d617b -- <file>` (the earlier accounted main pin) in every case (6/6, none missing, none extra). Each rationale ends "No authority or content approval; independent changed-row review owed" or retains the prior accounting text.

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| ratchet-0001 runtime-identity-and-activation.md | ok | deep | New exception; 1 main commit (55534d99). Cosmetic: `approvedBy` starts with "; " and the rationale with a space (data hygiene only). |
| ratchet-0002 distribution.md | ok | deep | Digest 67de192b real; 17 listed commits equal the log set. |
| ratchet-0003 observe.md | ok | deep | `allowed-new-file` digest bf89de13 real; 1 commit. |
| ratchet-0004 reading-map.md | ok | deep | Digest ff12350c real; 6 commits; rationale records PARK-PROTECTED-01 (section 8). |
| ratchet-0005 runner.md | ok | deep | Digest be8d799a real; 10 commits equal the log set. |
| ratchet-0006 work-state.md | ok | deep | Digest 78728821 real; 1 commit (cd8c1cc0, the D-ADR0055 signature). |
| ratchet-0007 platform-foundations.md (removal) | ok | deep | The exception became unused: the baseline classifies this file `generated` (non-authority payload), so edits need no exception and the checker would flag the exception as unused if kept. The checker (unchanged) exits 0. Risk note: this is the file carrying the legacy L1-L10 projection; its edits are now unaccounted by design of the classifier, which the plan froze. |

### 7.2 accounting-citation-baseline (3), accounting-reproduction (16 + 2), others

Citation baseline: removing exactly the three keys from a scratch copy of the baseline and running the unchanged `check-decision-citation-drift.mjs --baseline <copy>` yields exactly three findings (platform-foundations.md:66 ADR0055; work-state.md:1200 ADR0055 and ADR0003); with the keys present it exits 0. The three keys are verbatim copies of main-authored legacy lines; main's own baseline (eab4d617b and 92af7c8d6) does not carry them.

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| citation-baseline-0001..0003 | ok | deep | Keys equal the checker's own finding keys; no wording or script change. Authority note in section 9 (lane). |
| reproduction-exact-pairs-0001..0016 | ok (set incomplete, see R1) | deep | For all 16: the commit touches the plan file, is an ancestor of 9ac0f42fb, and appears in the live manifest (8 pairs each in `step10-round5-reproduction.json` `scripts` and `step10-sync4d-reproduction.json` `readOnlyScripts`; live file digests match). Pairs name only exact (commit, path) combinations, not a general allowlist. The set lacks the two rows for 9ac0f42fb (R1). |
| reproduction-authorized-lanes-0001 (`reports/phase-07/`) | ok | deep | Added at the end of `allowed-paths.json` (live digest 6e2dc0a0 matches). Phase 7's own report directory; reasonable. |
| reproduction-authorized-lanes-0002 (`scripts/check-decision-citation-drift.baseline.json`) | ok with Lead note | deep | Lane exists only to carry the three citation keys. L11-21 item 1 names the ratchet exceptions, not this baseline; item 2 ("existing vocabulary where precedent is mechanical") plausibly covers it, and the request lists it for review. Lead should either record one sentence in owner-answers confirming the lane or accept the reading; this is not rework of the data. |

### 7.3 closing carry, provenance, later drift

| Entry | Verdict | Mode | Note |
|---|---|---|---|
| closing-carry-declaration-0001 | ok | deep | Category "post-B0 main-authored platform sources", route Phase 9. Open sets: 3 files, 324 claims unknown-blocking, 324 without own rationale, 0 registry gaps. The 324 equal 204 Event Store + 89 Holder-lock + 31 Process, every claim is a current registry unit with matching path and digest (0 mismatches), and they reconcile with the strict-E counts (35 files, 2,436 claims) as 3 + 32 and 324 + 2,112 (the remainder is the A46 deferred Phase 9 set). No disposition or authority invented. |
| post-B0-file-provenance-0001..0003 | ok | deep | At B0 (6f0f39ca1) all three paths are absent; first-add commits on main: event-store 6a614a669, holder-lock and process 0e377d7b6; both are ancestors of eab4d617b. |
| later-main-drift-0001 | ok | deep | `git diff --name-only eab4d617b 92af7c8d6 -- docs AGENTS.md CLAUDE.md <switchboard json>` returns exactly the declared 18 files; eab4d617b is an ancestor of 92af7c8d6; action is "no merge, Phase 9". |

## 8. PARK-PROTECTED-01 (reading-map)

Facts (compared at the reviewed tree):
- `git diff eab4d617b 9ac0f42fb -- docs/specs/reading-map.md` is 10 additions and 2 deletions: the branch's transition-rule banner (Phase 01) and two replacements of `fgos-coding-compounding` with `fgos-coding-knowledge`. Main (eab4d617b and 92af7c8d6) still says `fgos-coding-compounding` three times.
- The branch keeps `fgos-coding-knowledge` in both lines of the legacy reading-map.
- The skill directory on disk is `.claude/skills/fgos-coding-knowledge` (also `.agents/skills/`, `plugins/fgOS/skills/`, `domains/coding/skills/`); no `fgos-coding-compounding` skill directory exists in this tree or in main's tree listing. Main's reading-map therefore points at a name that has no skill behind it.
- The ratchet exception for the file (digest ff12350c, revisit "Phase 08 cutover") records the divergence.

Recommendation: keep the branch bytes. Raw equality to main is not a goal; equality would reintroduce a dangling skill name. Disposition for the Lead: close PARK-PROTECTED-01 as "branch correct, divergence accepted and recorded", and add one line to the Phase 9 import step that the final-main import must keep the two `fgos-coding-knowledge` replacements (or main fixes its own file first, a separate main-side item outside Phase 7). The legacy reading-map is slated for retirement in favour of `docs/reading-map.md` at the cutover, so the divergence has a bounded life. Broader residual: other main files still say `fgos-coding-compounding` (for example `core/skills/fgos-indexing/SKILL.md`, `core/agents/docs-manager.yaml`); that is main-owned naming drift, not in this request.

## 9. Advisories (not rework)

1. The closing declaration labels Holder-lock a "main-authored" source. It is main-created (0e377d7b6) but also carries two branch-authored edits (8b2ee4dd9 and e6b7efeec: header, ranks 58/70, section 15). Suggest one clause in the declaration or the Phase 9 step: "holder-lock/spec.md = main bytes plus two reviewed branch deltas". The N1 review covers those deltas.
2. Legacy-file line citations in candidate text (X-DEFECT-06 and -08) are now off by +7 and +16 because main moved the legacy files; Phase 9 citation accounting owns them.
3. ratchet-0001 data hygiene (leading "; " in `approvedBy`, leading space in rationale) is cosmetic.
4. The 92af7c8d6 drift touches the sealed-key files again (component-boundary, event-store, holder-lock, process); the key and seal are stale against final main and must be re-checked in the Phase 9 step, as the declaration already states.

## 10. Verdict summary

| Set | Entries | ok | rework |
|---|---:|---:|---:|
| routing-binding-nav | 4 | 4 | 0 |
| routing-binding-defect | 14 | 14 | 0 |
| routing-binding-family | 13 | 13 | 0 |
| N1-native-recarry | 3 | 3 | 0 |
| N1-gap-decision | 1 | 1 | 0 |
| N1-document | 1 | 1 | 0 |
| N2 | 3 | 3 | 0 |
| A34-join | 15 | 15 | 0 |
| identical-owner-join | 7 | 7 | 0 |
| accounting-ratchet | 7 | 7 | 0 |
| accounting-citation-baseline | 3 | 3 | 0 |
| accounting-reproduction-exact-pairs | 16 | 16 | 0 (set needs 2 added rows, R1) |
| accounting-reproduction-authorized-lanes | 2 | 2 | 0 |
| accounting-closing-carry-declaration | 1 | 1 | 0 |
| accounting-later-main-drift | 1 | 1 | 0 |
| accounting-post-B0-file-provenance | 3 | 3 | 0 |
| Total | 94 | 94 | 0 entry reworks; 1 ledger rework item (R1) |

Rework items: R1 only (section 2). Rework rate is 0 of 94 entries, so no whole-set read beyond what was done is triggered (every entry was deep-read anyway).

Status: DONE_WITH_CONCERNS
Summary: 94 of 94 entries ok, 0 entry rework, 1 ledger rework item (R1): the two reproduction manifests lack the exact (9ac0f42fb, phase-07 plan) pair, so `doc-rationale-reproduction.test.mjs` fails 2/8 at the pinned HEAD while passing at 2296413a2. The 31 routing digests are real, N2 shows no sealed answer/route/anchor change, the holder-lock header fix is the only identity-source change after 8b2ee4dd9, ratchet exits 0 and its six after-digests and main-commit sets recompute exactly. PARK-PROTECTED-01: keep the branch's `fgos-coding-knowledge` (the on-disk skill name; main's `fgos-coding-compounding` is dangling), accept the divergence as recorded.
