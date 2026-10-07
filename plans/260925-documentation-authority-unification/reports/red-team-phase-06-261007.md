# Red-team review: Phase 6 plan, single-executor version (2026-10-07)

Reviewed: `phase-06-transform-all-platform-areas-as-candidate-material.md` and `reports/phase-06-planning-261007.md` as committed in `5481306aa` ("restate the batch transformation plan for a single executor"). The first pass of this review was written against the earlier multi-agent version (`5f76eb020`); this report replaces it. Step numbers below are the new ones (Step 1 = old B0, Step 2 = old B1, and so on, per planning report section 11). Read-only: no plan file edited. "Verified" means read in the repo scripts or data at this head; "not verified" is stated.

Hostile reading: one Codex agent with repo access, no chat history, runs about 8 to 12 working days alone; the gates are the only independent safeguard, so every proof was traced into the gate code.

**Verdict: execute after fixes.** The step order, the extractor freeze, the tooling-first Step 1 and the stop conditions are sound, and removing the harness removed the Claude-specific dependency. But the plan's central safeguard, "reviewed only by someone other than the author", is not enforceable by any gate and has no procedure, so a single executor can complete and mark everything `reviewed` alone. Several script-level problems from the first pass are still in the text. Fixes are plan text and Step 1 scope; no redesign.

## Critical

### C1. Self-review: the "reviewer is not the author" rule is an honor-system sentence with no mechanism, no procedure and no capacity

Evidence:
- Shared rules, decision shards: "`reviewed` only after a read-only review pass by someone who did not write the row (the owner or a second session; a single executor must not review its own rows)". Risk table: "reviewer must differ from author".
- Verified: `pilot/claim-decisions.schema.json` has no author or `decidedBy` field (only the description "One shard has one author"); `check-doc-inventory-gates.mjs:580` accepts `reviewStatus: reviewed` when `reviewedBy`, `reviewedAt` and `rationale` are non-empty strings, and nothing compares `reviewedBy` with anyone. The Pilot B precedent is the string `"independent reviewer (review-b-behaviors)"`.
- Step 1 does not add a check; the planned `reviewedBy` for mirror and exact rows is "the check" (script), which also relies on Q2b not yet answered.
- The plan keeps three reviewer-shaped controls that are now all done by the author: "10% hand-recomputed" and "100% of judgment rows read in both directions" (P5, written as steps of the executor's own loop), the seeded 30-row pack, and the 100-row spot check ("by hand").
- No review protocol exists: what the second session reads, where it writes (a report file under `reports/phase-06/`, as `reports/phase-05/review-b-*.md` did), who flips `reviewStatus` to `reviewed`, how the owner starts that session. The executor cannot start a second session itself.
- Capacity: 5,420 judgment rows at about 61 rows per review run is about 90 review runs. "Owner or a second session" does not say who. If it is the owner, it is about 5,400 rows of owner reading; if it is a second Codex session, the independence is weak (same model, same blind spots) and the plan does not say which it accepts. The plan's own risk "same-model blind spots" lost its countermeasure when the Opus pass, red-team and hostile reviewers were removed.

Failure scenario: the executor finishes a step, writes `"reviewedBy": "second session"` on its own rows because the review round-trip is slow, and every strict gate goes green. The whole phase passes X1 with zero independent review, and the owner cannot tell from the committed data.

Fix:
1. Step 1 adds an additive check: shard-level `author` field (required) and a gate finding when a row's `reviewedBy` equals the author or is not matched by a committed review report whose `reviewer` id differs from the author. Review reports are files under `reports/phase-06/review-<shard>.md` listing claim ids, verdicts and the reviewer's session identifier, written by the reviewing session, not the author.
2. State who reviews, row by row: the owner reviews the owner-judgment classes (archive/delete lists, conflicts, restores, SC-1, mixed-kind placements); a second session, started by the owner with a committed reviewer prompt file, reviews the rest. State plainly that this is a same-model review and what the compensating controls are (deterministic checks, seeded packs run by the reviewer session, owner sampling).
3. Put the review waits in the step list as owner wait points (Steps 2 to 9 each end with "review report committed"), with the rule that a pending review parks that step and the executor continues with a step that does not depend on it (product priority 2 in AGENTS.md).
4. Cost the review time in the estimate; today section 11 only says it "adds time".
5. Seeded checks: the seed is made and held by the owner or a separate session, not by the author; otherwise the author already knows which units are mutated.

## High

### H1. Reviewed decisions are bound to target digests the plan edits afterwards; unheaded anchors are positional (unchanged from the first pass)

Evidence (verified): `check-doc-inventory-gates.mjs:574-576` fails `decision-target-drift` when the current digest at `targetOwner#targetAnchor` differs from `targetUnitDigest`, read from the committed tree at `inventory.commit`; decision findings are in `fatalFindings` (line ~787), so fatal in every mode. A heading digest covers title, section payload and the following unit (`generate-doc-inventory.mjs:633`). Non-heading anchors are `unheaded-block-N`, a running counter (`:608`), renumbered by any earlier insertion. Edits to targets after decisions exist: Step 5 SC-1 text change in `cli-io-contract.md` (while the plan says Phase 5 shards stay valid), Step 3 restores and HI-I027, Step 4 stub, link repoints and "portal last" in every step, Step 10 promotion headers for any remaining documents, Step 6 against Plan B's edits.

The edit limit still reads: "header block, verbatim restores of dropped text (labelled), link repoints between candidates". SC-1, HI-I027 and the dropped-001 stub are not in that list, so the executor cannot tell which rule wins.

Fix: add the rule "an edit to a decided target document is followed by recomputing the affected rows (list them with a script) before the commit"; say cross-step link repoints are collected into one pass before the final refresh; list SC-1, HI-I027 and the dropped-001 stub as allowed edits; list the Pilot B rows that target the SC-1 heading as "re-decide"; have the exact-entry type refuse an `unheaded-block-N` target unless the digest is unique in that file (H4).

### H2. Duplicate groups and identical units with more than one legacy member break the one-owner invariants; no rule (unchanged)

Evidence (verified): every claim of every file in a duplicate-content group gets the same `semanticClaimId` (hash of the blob, `generate-doc-inventory.mjs:1731-1742`); `validateSemanticClaimOwners` (`check-doc-inventory-gates.mjs:655`) is an invariant finding when one id has more than one distinct `targetOwner`. Planning report: duplicates are 804 pairs, 8 groups of 4, 2 of 6, 1 of 8, 1 of 78 across legacy, platform and history copies. `identical-units-multiple-owners` (line ~733) is open data when one `sourceUnitDigest` has different owners in different legacy files.

Failure scenario: a group of 4 has two legacy copies, each mirrored to its own platform copy: two owners, fatal in every gate run. Identical short units (separator, "None", labels) carried exactly to different counterparts keep scoped strict above 0 forever. A file in a duplicate group whose rows go to two target documents is also fatal.

Fix: in Step 1 add the rule and a test: all legacy members of a group name the same single owner (the canonical platform copy), the others are `delete-as-duplicate` against it; define how exact entries resolve identical-unit owners. Add a synthetic probe (a group of 4; two legacy files sharing a short unit). Count the groups with more than one legacy member by script in the baseline.

### H3. Gate commands still do not run as written

Verified:
- `--decisions` is read once (`:946`); the plan now says "until repeatable `--decisions` exists run it once per directory". That is workable but each run then reports the other directory's rows as open, so only scoped strict runs are meaningful; say so. `loadDecisionShards` throws when a directory is missing or empty (`:504-511`), so Step 0's gate command with `ledger/decisions` (absent) exits 1. Create the directory with a valid empty shard in Step 0 or run only the existing directory.
- `check-doc-candidate-status.mjs` and `--check-placement` have no path filter (options: `--repo-root`, `--json`, `--strict`, `--switchboard`, `--constitution`). "No finding for touched paths" is a hand filter. At this head the run already reports 5 findings (3 missing promotion fields and 2 unresolved links, all in the three promoted README portals) and 433 unrouted documents (302 exempt evidence payloads); state the day-one set as expected.
- "`git diff 39630b398 -- <never-modified paths>` empty beyond accounted exceptions" cannot hold after `git merge main`. Use `git log --no-merges <last-sync-pin>..HEAD -- <paths>` empty, with the pin recorded at each sync.
- Success criterion 1 and Step 10 (2): "`--strict --scope ...` exits 0 except `holds.md`". The gate exits nonzero while any scoped row is open and no step adds a hold mechanism. Define holds as rows with a named non-blocking disposition, or define the check as "strict `--json` open rows minus the hold list equals 0".
- The extractor guard (`git diff 39630b398 -- scripts/generate-doc-inventory.mjs`) covers only that file. It imports `classifyFile` from `check-legacy-docs-ratchet.mjs` and helpers from `generate-shipped-path-inventory.mjs` and `doc-inventory-artifact.mjs` (lines 14-21), and switchboard routes feed classification, so changes there or the Step 1 additive routes can change rows without moving the guard. The "no id lost" rerun covers part of it; add the imported files to the guard.

### H4. The exact-carry proof is sound for blob-identical files, not as stated for unit-level rows (unchanged)

Evidence (verified): `sourceUnitDigest` is `textDigest`; for non-heading units that is `sha256(raw)` of the block alone; for headings it covers title, section payload and the following unit (`:633`). The plan defines an exact carry as "the unit text exists byte for byte in the counterpart" (Architecture), anywhere in the file.

Proves: the text exists in the counterpart. Does not prove: the same heading ancestry (a unit moved from "Settled" to "Rejected" counts as exact); that a repeated short block is the same occurrence (Phase 5 needed Decision G1 for this); that the counterpart is the intended owner when neighbours diverged.

Spot check: the criterion is "a 100-row hand spot check per batch"; all 16,640 exact rows sit in Step 2 (other steps have none; the 234 rows in Step 5 are Pilot B rows), so it is 100 of 16,640, random, by the author. A defect class of 80 rows is missed about 60% of the time.

Fix: the proposal script checks for 100% of rows: digest unique in the target file (else carry the occurrence index), same ancestor heading chain in source and target (else send to the diff pack), and routes blocks below a length threshold to the diff pack. Stratify the spot check by those classes plus 100 random rows, drawn and judged by the reviewer session. Say that mirror entries (blob-equal files) are proven by blob equality only.

### H5. Orphaned work: some closure items are no longer assigned to any step

The first version assigned the 12 history semantic-conflict groups and the 2 history duplicate groups to the close, and the single `implementation-alignment.md` collision (host-invocation-routing vs packaging-distribution) to two steps. The new Step 2(c) says "later the 12 history groups" and Step 10 has no item for them; Steps 3 and 4 do not mention the collision. Success criterion 4 ("818 of 818 duplicate and 151 of 151 conflict groups closed") cannot be reached by the listed steps. Also missing from the new Step 10: the 78-file duplicate group that spans history copies, and "link queues complete for all sources".

Fix: assign each to a step with a done condition; list the groups by script in the baseline.

### H6. A single executor over 8 to 12 days has no resume protocol, and the owner answers have no home

Evidence: Shared rules and Step 0 say "Owner authorization and answers to Q1 to Q5 recorded", with no file name. Steps have "Done:" lines but there is no progress record, so an agent that loses its context mid-Step 9 has to infer state from `git log`. The old file's owner decision points (archive and delete lists, conflicts, stop conditions, close) are gone from the text; the list-to-the-owner items remain inside steps (Step 2 "list to the owner", Step 3 obsolete entries, Step 7 `delete-as-obsolete`) with no instruction to park and continue. The step text uses undefined ids and names (M-xx defects, E2, SC-1, HI-I027, G-groups, "Pilot B shape", "diff pack", "seeded check", "second reader") and gives no read-first list. The Q answers still change the steps (Q2 option B/C, 2b no, Q1(b)/(c), Q3(b)/(c), Q5(b)/(c)); Step 1 is written only for the authorized-tooling case.

Fix: Step 0 names `reports/phase-06/owner-answers.md` and stops if it is missing or the answers are not the recommended set (state the set as a precondition, otherwise stop and replan). Add `reports/phase-06/progress.md`, updated in every commit, listing step, shard, review state and next action. Add a read-first list (constitution, vocabulary, `pilot/README.md`, `reports/phase-05/pilot-method-defects.md`, `fix-round.md`, `pilot-a-discrepancy.md` section 2, the planning report) and one-line definitions of the ids; state the park-and-continue rule.

### H7. Dropped-claims restoration can be closed by writing a data field (unchanged)

Verified: `dropped-claims-unreviewed` (`check-doc-inventory-gates.mjs:748-753`) tests only that `reviewedDisposition` has non-empty `decision`, `reviewer`, `reviewedAt`. Nothing checks that a "restored" entry's anchor contains the text; register anchors are positional (`unheaded-block-24`). Step 3's "all 16 registered groups appear as restored or flagged (known-answer check)" is an executor assertion. Add a gate check in Step 1: `restored` carries `anchor` and `unitDigest`, recomputed at the committed tree; `defer-with-owner` needs the stub anchor to exist.

Also: the switchboard marks Agent coordination, Host invocation routing and Packaging-distribution `promoted` (verified: `authorityStatus: promoted`), so restores, HI-I027 and the dropped-001 stub edit live areas read today; the owner should see those diffs, not only the executor.

## Medium

### M1. The red-team and hostile review steps were removed, and the effort checkpoint lost its baseline

The first version had a per-step hostile review (two reviewers per batch, Critical/High fixed) and a closing three-reviewer pass; the committed version has neither, nor the criterion "0 open Critical or High after red-team". With one executor that is the only adversarial look at a diff of thousands of lines. Restore at least one red-team per step group, run by the second session with a committed prompt.

Effort stop condition: "actual effort per judgment row above 1.5 times the first two batches' average". Effort has no unit (tokens are not visible to every agent), and Steps 2 and 3 are a poor baseline: Step 2's 394 judgment rows are mostly diff reviews, so a normal Step 3 or Step 6 would trip the stop, or if Step 3 is expensive the baseline hides later overruns. The first version used the Pilot B figure (4.8k tokens per row). Define the unit (wall time or reported tokens) and take the baseline from Step 3 and Step 6 separately, with an absolute ceiling.

### M2. Counts that do not close, and sources in no step

- Rows per step sum to 22,426, but the planning report (section 3 closing note) says `docs/distribution-vision.md` (22), `docs/id-systems-audit.md` (32), `docs/work-item-lifecycle-vision.md` (25), `docs/backlog.md` (5) and `docs/platform/proposals/documentation-system-unification.md` (198) are carried by the root step. Step 5 accounts for 84 of the 282 rows; the 198-row platform document is in no step and not in the 1,040-file count.
- `docs/decisions/index.md` (one generated file, AGENTS.md calls it a live projection) is named a retiring root in the planning report (section 5) but is in no step; `docs/architecture-manifest.json`, `doc-registry.json/.md`, `enduser-docs-index.json` are in no step (not verified whether they are in the 1,040).
- 816 versus 814 mirror duplicate groups (the retirement check excludes only groups whose every path is under `docs/(architect|platform)/.../verification/<x>/`): which two are open is not stated.
- 131 `docs/platform` documents are `unrouted` today (not evidence); the plan adds routes for new areas only.
- Step 7 (1,815 rows) is a "place by constitution kind, verbatim" step; the proof that a placed block carries its source unit is a post-authoring check, and Step 1 defines only a counterpart-based proposal script. Say how Step 7 rows are proven (a variant that runs after authoring) or they are 1,815 reviewed judgment rows.

### M3. Plan B and main churn: Step 6 still conflicts on content

Plan B (pending; `plan.md` §7.5) writes a row in `docs/platform/component-boundary.md`, creates `docs/platform/convention/spec.md` (no promotion fields, no route), and edits `reading-map.md` and `system-overview.md` on main. Step 6 authors against `component-boundary.md` on this branch: a content conflict in `docs/platform/**` is a stop condition. Step 6 says only "re-pin after Plan B's pointer lines if it landed". The switchboard is also edited by Step 1 (routes) and possibly by Plan B. Record the Plan B state at Step 0; merge main before touching `component-boundary.md`; give the switchboard one writer.

### M4. Promoted portals versus the stop condition on reader links

Shared rules: "portal last" and link repoints; stop condition: "a reader document links a candidate". The three promoted portals are reader documents. State whether a promoted portal may link new documents of its own area.

### M5. Step 1 needs paths the Related Code Files list does not name

Amendment 2.4-001 is listed; the constitution kinds required by Q5(a) (`governance`, `portal`, `switchboard-doc`) edit `minimum-constitution.json/.md`, and the new entry kinds (mirror, exact-carry, corpus rule) need a shard `version` and `pilot/claim-decisions.schema.json` changes (`loadDecisionShards` requires `version: 1`). "Never modified: rule text of the constitution and vocabulary" sits next to those. Cite the Phase 4 ruling that the ratchet roots stay `docs/specs` and `docs/architect` so T5 changes only the retirement check.

### M6. Rehearsal and corpus rules come too late

Corpus rules (history, user knowledge, consumer rows; 45,759 rows) are built in Step 1 but no step applies them; the 18,497 candidate rows are not covered by Q2c at all; "do candidate rows become non-blocking at the flip" is measured only in Step 10, after all content exists. Run a reduced rehearsal after Step 2, and decide the corpus-rule application then.

### M7. Reader runs and the seeded checks have no operator

"Two fresh-context reader runs ... answer key committed first" and "a second reader reviewed the diff" need sessions the executor cannot start. State who runs them, what prompt they get (committed file), and that the key is committed before the reader starts.

## Low

- Step 10 criterion 10 says a "sealed immutable claim-conservation snapshot plus digest/proof will survive cutover as D2 evidence and an H2 import source"; sealing is Phase 9, and "D2/H2" are undefined here. Say Phase 6 produces a dry-run only.
- Scratch at `/tmp/phase06` is shared, not session-specific, and holds shards of about 2 GB class; clean it at the end (inode and space issues have happened before in this repo).
- Per-commit cost: every target-document commit reruns a 18 s, 2.3 GB generator plus a gate and the suite; define which checks run per commit and which per step.
- Alias drafts, link previews and queues pull Phase 8 work forward; fine as drafts, not in the effort estimate.
- Not verified: the Plan B, council-parity and request-to-run writers' real file lists (the planning report marks them UNPROVEN).

## Answers to the brief

- **Claims lost or weakened:** the rules (`supersede` whole-unit, `partial-carry`, `unknown-blocking` with `searched`) are correct and enforced by the gate. The risks are self-review (C1), stale decisions under later edits (H1), the exact-carry proof (H4) and the one-owner invariants (H2).
- **Script-proven exact mirror, 16,640 rows:** sound for the 12,882 blob-identical evidence rows; not as stated for the 3,758 unit-level rows (H4).
- **Two owners / canonical-looking candidates:** H2 at gate level; candidate status is kept by the switchboard, which is sound; M4 for portal links.
- **17 dropped claims:** restoration is planned but closure is data-only (H7).
- **Order against main churn:** runner last and distribution rows last are right; Plan B on Step 6 is not covered (M3).
- **Retirement-check gaps fixed before content relies on them:** in order (Step 1 first), but the repeatable `--decisions` and one-owner rule must be first (H2, H3), the corpus rules are never applied (M6) and some roots are in no step (M2).
- **Step 1 changing the extractor:** no. The guard is too narrow (H3).
- **Gates and commands real:** the flags exist (`--decisions`, `--scope`, `--strict`, `--cutover`, `--promotion`, `--check-placement`, `--no-ledger`, `list-doc-anchors.mjs --check`, `doc-alias-resolver.mjs --table`; verified). Behavior gaps in H3. The checkpoint refresh command in Step 3 uses the committed paths named in Decision G5 (`reports/identity-registry.json`, `reports/doc-inventory.json/.md`; present).
- **Cost and stop checkpoint:** estimates still scale from Phase 5 in-process runs and do not price the owner or second-session review (C1, M1); the stop baseline is weak.
- **Single-executor follow-ability:** structure good (Done lines, exact commands); gaps are in H6.
- **Engine scope / third documentation system:** none added; new constitution kinds and the snapshot format are the only drift, both recorded exceptions.

## Unresolved questions

- Who performs the independent review (owner rows versus second-session rows), and is a same-model second session acceptable to the owner? (C1)
- Is Plan B landing before Step 6? (M3)
- How many duplicate groups have more than one legacy member, and which two of the 816 are not all-mirror? (H2, M2)
- Are the 282 rows and the root JSON files in the 1,040-file count? (M2)

Status: DONE
Summary: Phase 6 single-executor version reviewed against repo scripts and data; verdict execute after fixes; one Critical (unenforceable self-review), seven High, seven Medium.
Concerns/Blockers: none for the review.
