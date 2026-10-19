# Review a38 Step 2 merged census, part 09 (evidence-lexical-refresh)

Reviewer: reviewer:sonnet-session:ac6f3d5c4e41188f3@2026-10-19
Reviewed commits: author ce84b84e7, accounting 0689b862e (worktree HEAD verified 0689b862e, read-only; no writes).
Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02-review-part-09.json, sha256 52d111558d3d0bfaaf1effe971136bf880653524d553f3c9c21aad2a7ccbd0f4 (8 entries, evidence-205..212).
Method: light only (python/jq/grep/sed). Mechanical: for every entry recomputed file sha256 vs fileDigest, checked each occurrence line equals callSite and each matchedExpression is a substring of it, and that the entry matches the same id in step-02-evidence-consumers.json. Semantic: read each call site/context and, for the fixture, its consuming test. No inventory loaded, no .fgos or secrets read.

## Per-entry verdicts

| id | file | occurrences | mechanical | semantic judgment | verdict |
|---|---|---:|---|---|---|
| evidence-205 | test/fixtures/usage/pi-multiturn-normal.jsonl | 3 (lines 4,5,13) | digest ok; spans ok | Recorded pi session JSONL. Mentions are inside recorded prompt text (cold-resumable p00..p07 evidence paths) plus machine absolute paths under /home/vantt/projects/cold-resumable-coordination-dag-p07. Only consumer is test/runner/usage-parsers.test.mjs, which parses usage numbers from the bytes. Classification source / recorded-fixture / preserve bytes / lookup-only alias for repo-relative mentions with absolute paths unresolvable is correct. Not a reader or writer of the path; no rewrite (matches the "never rewrite fixtures" rule). Legacy form true is correct. | ok |
| evidence-206 | test/runner/dispatch-executor-profile.test.mjs | 1 (line 18) | ok | Comment-only citation of historical proof dir visibility-herdr/proofs/ (continuation on line 19 names the file). Not an IO path. Maintained source test with a dead pointer after payload move; "trace/review, no edits now; candidate mirror navigation later" is a fine plan. Wrapped citation (path split across lines 18-19) is worth keeping in mind for the Step 5 link rewrite, but the row already requires exact-link review. | ok |
| evidence-207 | test/runner/dispatch-worker-home.test.mjs | 1 (line 17) | ok | Same comment-only citation, wrapped to line 18-19. Same disposition. The matching src/runner/dispatch/worker-home.mjs:31 is in the table as evidence-198. | ok |
| evidence-208 | test/runner/dispatch-worker-session.test.mjs | 1 (line 14) | ok | Comment-only citation of proofs/2026-09-06-isolation/ ; no IO. Same disposition. | ok |
| evidence-209 | test/scripts/check-doc-conservation.test.mjs | 6 (66,67,76,77,84,88) | ok; line 66/76 legacy form, 67/77/84/88 platform-side tail | Synthetic ledger rows (sourcePath legacy, targetOwner platform) exercising the evidence-mirror noncompetition rule in scripts/check-doc-inventory-gates.mjs (isEvidenceMirrorPath, line ~1010, and the area-root replace at ~794). Strings are test inputs, not real reads/writes; they must change only together with the gate regex. Marked maintained-requires-semantic-review, no edit now: correct. The stated cutover ("candidate mirror navigation") is generic and slightly off for classifier fixtures (real action is: change in lockstep with the gate when verification roots move), but this is wording, not rework. | ok |
| evidence-210 | test/scripts/check-doc-constitution.test.mjs | 7 (423,424,580,581,584,585,625) | ok; legacyForm false is correct (all platform-side paths) | kindOf() classifier assertions on synthetic platform-side verification paths (evidence-payload / collection-index / verification). The file is correctly also listed among the policy tree walkers (it reads the pilot shard dirs by readdirSync at ~647). Preserve now, semantic review at Step 5/6 parity: correct. | ok |
| evidence-211 | test/scripts/check-doc-retirement.test.mjs | 1 (line 151) | ok | Mirror pair fixture for openConflictGroups (scripts/check-doc-retirement.mjs ~98 dedup of evidence mirrors). Synthetic inputs; same lockstep-with-checker disposition. Note: scripts/check-doc-retirement.mjs itself is not in policyTreeWalkers, but it only carries LEGACY_ROOTS and mirror-dedup logic, not a payload tree walk, so no row is missing. | ok |
| evidence-212 | test/scripts/doc-candidate-conservation.test.mjs | 2 (55,56) | ok | Synthetic mirrorSource/mirrorTarget inputs for the candidate-conservation expansion test. Same disposition. | ok |

L12-7: none of the 8 rows touches docs/specs or docs/architect consumers needing patch specs; no early edit proposed (all "no edits in this batch" or preserve bytes). L12-10 not engaged. Source vs render: all `source`, correct (test/** is not a generated render). No alias activated (aliases lookup-only).

## Dynamic / unresolved section (step-02-dynamic-unresolved.json, 29 entries: cli 14, setup 6, survey 6, gateway 1, external 1, inventory 1)

- Entries and classes listed match the request's blind spots: real-reader tests, retired-corpus tests, dead-vocabulary root test, default specs-dir, UI tools, wrapped comments, gateway OpenAPI, external/.fgos state, full inventory. Statuses are all "unresolved / remaining class" with named owner; none claims coverage.
- Checked for missing classes relevant to this part: the evidence tree walkers (8 in policyTreeWalkers of step-02-evidence-consumers.json: ratchet script/baseline/exceptions, generate-doc-inventory, check-doc-inventory-gates, check-doc-constitution + its test, generate-shipped-path-inventory) are carried there with a pending status, not hidden. Other lexical evidence consumers I spot-checked (src/runner/dispatch/config.mjs:988, worker-home.mjs:31, trust-store.mjs:12, usage/pi-multiturn-no-agent-end.jsonl, run-outcome/legacy-derivation.json, run-result/real-shapes/05) are all present as evidence-196..204 rows. No untraced writer found: every mention in this part is a comment, recorded fixture text or synthetic test string; none opens/writes a verification path.
- Minor note (not rework): the dispatch-*.test.mjs / worker-home / config comments cite proofs by a path wrapped across two comment lines; the dynamic list's "wrapped-comments" entry only names src/report/knowledge-resolver.mjs and gateway network.ts. Add these wrapped evidence comments to that class or to the Step 5 link-rewrite checklist so a single-line regex rewrite does not miss the continuation lines.

## Totals

8 entries: ok 8, rework 0, needs-Lead-judgment 0. Deep reads: 8/8 (minimum 8). Mechanical failures: 0.
Smallest next action: Lead may accept part 09; carry the wrapped-comment note into the Step 5 checklist.

Status: DONE
