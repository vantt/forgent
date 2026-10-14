# Root authorities fresh-reader review

Reviewer: reviewer:claude-session:a4954387@2026-10-15
Key: [fresh-reader-key-261015-root-authorities.md](fresh-reader-key-261015-root-authorities.md), committed at 3d84b31d0 before either reader started
Docs commit read: 3d84b31d0 (worktree HEAD at scoring time; the key header names 5d71d9882, the HEAD it was written against)
Scoring rule: [pilot-b-fresh-reader-key.md](../phase-05/pilot-b-fresh-reader-key.md), with the owner decision for this batch below
Raw answers: [reader 1](fresh-reader-261015-root-authorities/fresh-reader-1.md), [reader 2](fresh-reader-261015-root-authorities/fresh-reader-2.md)

Two Sonnet readers, no conversation history, each limited by `fresh-reader-brief-root.md` to the candidate files under `docs/platform/` (start file `docs/platform/README.md`), with no `plans/`, `docs/specs/`, `docs/architect/`, `AGENTS.md` or `CLAUDE.md`. They received the three scenario titles, the six questions and the citation rule; neither saw the key. Isolation is UNPROVEN: read-only was an instruction, not a sandbox. Cross-check: both opened-file lists contain only in-scope files, and `git status --short` was empty after scoring.

Owner decision for this batch (Lead): every Step 5 candidate says the legacy document is still binding, so a reader may name the legacy owner when it cites a switchboard row or the candidate's own pointer. Citing a legacy path as evidence without that routing, or treating a candidate as binding, fails. A partial answer counts as correct, as in the pilot. Both readers named the legacy owner only through a cited switchboard row or candidate pointer, and said they could not open it.

## 1. Scoring against the key

| Reader | Scenario | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Correct |
|---|---|---|---|---|---|---|---|---:|
| 1 | A (`fgos add` without `--verify`) | yes (switchboard row and resolution algorithm, work-state portal read-first, dictionary and Add Verb; registry named as a possible surface) | yes (legacy-current, edit the owner once, candidate impact only; ratchet exception noted) | yes (dictionary row, RUL7, Add Verb, Entry Points/child-verify, Return, registry hedged) | partial (consumers named: return runs `verify`, planning children; no event-log replay or schema-evolution default, no version-token question; "locked law L5" framing is the reader's own) | partial (L5 and design gate; states the changed refusal behavior and names the two existing tests that use `add`; does not say a matching test is required, no replay proof) | partial (decision record cited through the foundations authority anchor, not the schema-evolution record; candidate impact in migration tracking; no-boundary note; Add Verb/dictionary update at the owner sits in Q2) | 6 / 6 |
| 1 | B (database as source of truth) | yes (law summary, L3 text, switchboard row and step 5, RUL1/RUL10) | yes (locked-law change, supersede, never edit in place; candidate entry vs legacy binding) | yes (L3, L1, L10, RUL1-3/10/11, single write door) | yes (single-writer reopening condition, beads case study, immutable committed log) | partial (rebuild-from-zero and one door, design gate; the reopening evidence is in Q4, the boundary note in Q6) | yes (supersede the D-ID printed in the law, boundary doc or no-change note, owner update of RUL1/RUL10) | 6 / 6 |
| 1 | C (open design note) | yes (authority matrix and scratchpad workflow; switchboard route for the candidate governance) | yes (scratchpad, possible later proposal, lifecycle, reasons from the note's state) | yes (matrix limits, ratchet, switchboard no-dual-authoring rule; no metadata/linking items) | yes (low; forking authority and over-claiming; medium on promotion) | partial (non-canonical marking, no settled claims, lifecycle to drained; ratchet check and header/link conformance not named) | yes (promotion targets, pointer or delete after drain, archive only with lasting value) | 6 / 6 |
| 2 | A | yes (portal how-to-change, switchboard row and algorithm, work-state portal pointers) | yes (spec/contract work on a legacy-current area, edit the one owner, ratchet exception) | yes (Add Verb, dictionary row 8, RUL7, validation exit 4, exit-code table) | partial (consumers: return runs `verify`; required to optional changes a public verb and a dictionary row; no log replay or version rule) | partial (design gate and L5 cited; says no test list is in scope; lists spec text to update, which is a doc edit and not proof) | partial (update owner once, candidate impact, boundary no-change note via the linking anchor; the decision record is cited only through a contract link the reader did not read) | 6 / 6 |
| 2 | B | yes (authority entry, law summary, L3 text, switchboard row) | yes (locked-law change, supersession, governance decision rule; governance marked candidate) | yes (L3, RUL1-3, L1/L7/L9 adjacent, component-boundary reached through the governance and foundations anchors) | yes (named reopening threshold; reversing a named decision without it) | yes (threshold evidence, superseding record, six-question test and design gate; no test command claimed) | yes (superseding decision, owner once then candidate summary, promotion targets) | 6 / 6 |
| 2 | C | yes (scratchpad workflow, document types, authority matrix; candidate vs legacy governance via the switchboard row) | yes (scratchpad; reasons why not a proposal yet) | partial (authority matrix and the priority dictionary rows; no ratchet, switchboard or boundary items) | yes (low while it claims nothing; risk on promotion, one owner) | partial (non-canonical marking and lifecycle; no ratchet or link conformance, no check named) | yes (promotion targets, pointer, delete after drain, archive only if lasting) | 6 / 6 |

Yes-only count (strict reading, partials as wrong): reader 1 A 3, B 5, C 5; reader 2 A 3, B 6, C 4. Under that reading three cells fall below 5 of 6 (reader 1 A, reader 2 A, reader 2 C). The criterion counts partials as correct, so those cells pass; the pattern is shown because it is systematic (section 3).

Files opened before the first correct owner (counting the owner file): reader 1 A 3 (portal, governance, switchboard), B 4 (portal, governance, switchboard, platform-foundations), C 2 (portal, governance); reader 2 A 4 (portal, governance, platform-foundations, work-state portal; the switchboard came 9th, the first correct owner is the work-state portal), B 3, C 2. Maximum 4 against a limit of 8. Over the whole run reader 1 opened 13 files and reader 2 10. The phase file says "at most 8 files read per run"; the key and the pilot count files before the first correct owner, so the criterion is read that way, and the per-run reading would fail for reader 1 (13) and reader 2 (10), as in the previous batch.

Legacy-authority answers: 0. Both readers named a legacy path (`docs/specs/work-state.md`, `docs/platform-foundations.md`, `docs/doc-governance.md`, `docs/io-contract.md`) only as the binding owner, citing the switchboard row or the candidate portal pointer, and stated they did not open it. Neither treated a candidate (`Canonical: No`) as binding. Both hedged candidate text up front. Candidate vs legacy distinction was kept in the Q2 and Q6 answers that edit a claim.

Claims spot-checked against the files: RUL7 (item schema carries the six questions, including verify), the L5 line "chi co the THEM cau", the L3 D-ID `ae461c8b` and RUL10 restating the threshold, governance section 11 carrying the component-boundary no-change rule, the cli-io-contract link to the retired decision history. All match. No invented decision IDs.

## 2. Cited anchors checked by script

Every distinct `path#anchor` of both readers was run with `node scripts/list-doc-anchors.mjs --check <path#anchor>` from the worktree root, including two anchors reader 1 cited with the path stated once in an earlier clause (`work-state/README.md#4-legacy-source-pointers`, `work-state/spec.md#2-entry-points-and-triggers`) and the non-ASCII law anchors. All exit 0.

| Reader | Distinct citations | Anchors that do not exist |
|---|---:|---|
| 1 | 31 | none |
| 2 | 27 | none |

38 distinct anchors across both readers, 0 failures. Both readers state they used only anchors printed by the tool.

## 3. Substantive notes from the readers (area gaps)

1. No stated home for a discussion scratchpad. Both readers, in scenario C, could not find a folder rule: the placement map shows `proposals/` and `history/` per area, and the legacy roots are frozen. Reader 1 would place it under `docs/platform/<area>/` and ask the owner; reader 2 says the folder stays unclear. Gap in governance: a placement entry for scratchpads is missing.
2. Reader 1 could not tell how a legitimate behavior change lands at a legacy owner. The switchboard and authoring rules say edit the declared owner once, but the ratchet exception list covers stale routes, urgent defects and mechanical link fixes. A behavior change such as scenario A fits none of them; the route for an ordinary reviewed change to a baselined legacy file is not stated.
3. Neither reader named a proof for documentation work. Reader 2 says the in-scope files give no test or check; reader 1 gives only conformance marks. Both opened the authoring rules, yet neither cited the ratchet check named there. Q5 is partial for C in both readers and for A in both; the area does not state the documentation proof in one place.
4. Risk is again assembled, not found. Q4 in scenario A is partial for both readers: consumers of `verify` are named, but the replay default for committed events and the version-token question sit in work-state decision records neither reader opened (reader 2 never opened the retired decision history). The work-state portal does not point to the schema-evolution record from the Add Verb.
5. The binding owners are outside the readers' scope by design, so every answer rests on the candidate text plus the switchboard route. Both readers flagged this. Reader 1 could not confirm whether the cli-io-contract states the `--verify` requirement and said so instead of asserting it.
6. Reader 1 raised that dropping the proof requirement is in tension with L5 ("a question can only be added"). The key does not credit or reject it; the candidate L5 text does say the six-question test can only grow, so the point is supported by the file but left to the owner as an open concern, not scored.
7. Reader 1's scenario C Q1 contains a muddled sentence about the read-order contract and its "neighbours"; the supporting claim (ready order v2 in the Read text) is consistent with dictionary row 25. Not scored down. Both readers noted `templates/README.md` calls the templates history, and used the discussion template only as a shape hint.
8. Neither reader repeated the stale "eight laws" or "phases 02 to 09 are unauthorized" sentences, and neither tripped on the `2.0` vs `3.0` manifest tokens, but those traps were not on their path, so this is not evidence the area resolves them.

## 4. Criterion

| Criterion | Result |
|---|---|
| At least 5 of 6 correct per reader and scenario | met (6 / 6 in all six cells, ten answers partial; see note below) |
| 0 non-existent cited anchors | met (0 of 38 distinct; reader 1 0 of 31, reader 2 0 of 27) |
| 0 answers relying on a legacy path as authority (owner decision applied) | met (0) |
| At most 8 files before the first correct owner | met (at most 4). Per-run reading would fail (13 and 10 files), as noted above |

Note on the first row: counted by partial = correct, as the pilot and the owner decision set. Partial count: reader 1 A 3, B 1, C 1; reader 2 A 3, B 0, C 2; 10 partial answers of 36, 0 "no". The pass is therefore lenient for scenario A in both readers (three partials each) and reader 2 scenario C; the Q4, Q5 and Q6 weakness of scenario A is a real area gap (notes 3 and 4), not a reader error. No claim here that the candidates are true; they remain candidate-unverified.
