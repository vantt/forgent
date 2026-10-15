# Review: runner report and native proof accounting (s9i)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Channel: report, 1 entry (pinnedText is the older author checkpoint at the content commit, revisedReport is the current step-09-report at the request commit; I reviewed the revised text and confirmed the pinned text equals the old file at the content commit). Non-source accounting channel; no source approval, no truth, no closure. No sensitivity pack requested or produced. Scripts and raw outputs in the scratch dir work-s9i. Digest recomputed by script and by hand (the Python recompute drawn with seed s9i-261015-hand-digest-seed-3 includes runner-report). Deep row: the single entry.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| runner-report | ok | deep: read the revised step-09-report.md (sha256 4e9fc188, equals shownText and the file at the request commit) against the evidence - sync log timestamps 10:04:38.274 to 10:27:07.624 give 1349.35 s and the recovery generation 617.102 s (the failed deserialize of the truncated cache is in the log; the 137 exit is the author statement only), one persisted compact registry of 61883121 bytes whose sha256 dbf89fc8 equals the committed working-identity-registry.json, known IDs 98470 to 99020 equal 550 added with 90408 kept plus 366 paired equal 90774 old units and 91324 claims, six raw D and E outputs show D fatal 0 and E fatal 3 with opens 495 / 28 / 63 for both, identity and phase02, 63 unique reverse rows in candidate-unverified-runner.json with coherent per-file counts, residual file sha256 77346a00 and 32 blocks equal the sidecar, shard recount 495 units / 166 headings / 0 Unit-exact / 494 Weak-exact / 1 Judgment with one unequal target digest (the H1), 34 request files plus sidecars with equal Entries counts (495 source, 14, 167, 63, 33, 181, 1, 1), and the three named test files 44 of 44 on rerun; the request commit touches only reports/phase-06 and docs, scripts, tests and ledger are equal from the content commit to HEAD. Limits: native D and E and the native identity tuple comparison were not rerun (about 10 minutes each, so that equality is the author result and the raw outputs); the 85 revisions reproduce as the rank of the deepest witness blob in distinct-blob order; the 590 / 589 placement figure survives only in the superseded historical section (known); E stays red and no closure is claimed, which matches the text. | ccddeec99c3e9e4321a0ab1aaa3ca479fbd9b923fcca20849108adccede1784c | none |

## Notes

- The report states that Strict E is red, that independent reviews and final closure are owed, and that no Step 8 one-row request was touched; all three statements hold at the pinned tree.
- The new proof files are pinned by the request commit, not the content commit, as the entry itself says; I treated them that way and verified that docs, scripts, tests and ledger bytes are identical between the two.

Unresolved: native D, E and tuple equality not independently re-executed by me (author result accepted only as recorded evidence); everything the report lists as owed remains owed.

Status: DONE
