# Review step 10 accounting part 7 (fresh package evidence reproduction)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16
Review mode: ordinary
Request commit: f1f414b02
Content commit: 62751458b22b47e930dc33b8501d07798b91ace3

## Scope and method

Request: review-request-step10-accounting-07-62751458b.md and sidecar (10 fresh package evidence entries, no claim rows). The request asks to reproduce the measured evidence, not to approve claims; each row says what I reproduced and what I did not.

Worktree: read-only /home/vantt/projects/forgentX-s8-review at f1f414b02 (git status --short empty at the end). No sensitivity pack was requested or made (ordinary review). I never ran the fgos CLI and never read secrets.local.env. The evidence files exist only from the request commit, not at 62751458b, so SHA256 values were compared with the files in the worktree.

Reruns (mine, scratch outputs only): the 490-test command passed (tests 490, pass 490, fail 0, cancelled 0, skipped 0, TMPDIR in my scratch dir). The consistency command ran unchanged from the worktree root with output under /tmp/fgos-work/review627-x3/ (the script requires /tmp/fgos-work and writes only its --output file; I used a private subdirectory because other reviewers run the same commands): rows 12895, shards 92, generated 836, legacyFindings 0, generatedFindings 0, sourceWitnessLimits 84, ok true; my raw output sha256 equals the committed rawReportSHA256 65c11dbe8f04e5e5 and the interned witnesses expand to my raw output for all 3498 heading comparisons. The embedded read-only scripts were written to the same private subdirectory with only the directory name changed, and inventory, D (three runs), ownership, ownership audit and link replay were run sequentially: D raw files, target-ownership and link-replay outputs are byte identical to the committed ones, D summary equal except the seconds fields.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| fresh-checks | ok | mechanical: SHA256 equals the file; check A reproduced independently (521 first-parent non-merge commits dbe5c4328 to 62751458b against allowed-paths.json give exactly the 8 recorded historical offenders and none new); check B reproduced (the five extractor blobs at 62751458b equal the recorded actual and expected values and extractor-blobs.txt); H not reproduced (check-doc-constitution needs the uncommitted doc-inventory shards and the regeneration command writes inside the repository, so I did not run it); I read only | none | cf2d1f261cd438a934d65c5bf3380926549dc7dee49fb52173a93d68126ddf9e |
| fresh-native-proof | ok | mechanical: SHA256 equals the file; the registry in the request worktree has bytes 62180479 and sha256 562c2583 equal to the proof and my inventory replay printed files 4486, units 91374, registryUnchanged true with the same sha256; against the 287a22d33 registry known ids rise 99549 to 99555 (proof 99553 to 99555 after the earlier four gaps), zero ids lost, and the two new units and two new gaps equal the proof lists; sync seconds, exit 137 history and activeTupleEquality over all 91374 units were not reproduced | none | 0f628ba4e69365f9b3168ecbe4fd66e64d9bd280498922b1bb6b6c614ff13238 |
| fresh-D-summary | ok | mechanical: SHA256 equals the file; I ran D three times from the replayed inventory and the raw both, identity and phase02 files are byte identical to the committed ones, zero fatal findings, summary equal except the seconds fields | none | 791218c194de6c8d0cb52e3771f8833b430effb2c90998a32b5679c7bf1be708 |
| fresh-rebindings | ok | mechanical: SHA256 equals the file; I recomputed the target unit digest of every claims and registryGaps row with a target (9210, equal to checkedRows) with the extractor: 9203 equal with zero drift and 7 rows with non-markdown file-block payload targets (svg or log) that my markdown lookup cannot place, so rowsRebound 0 is consistent but those 7 were not independently resolved; the repair helper itself was not run | none | 18a860a55f21dba7341d0f2dae8d749c06d27ddb9bfbb0d4cd38196a5deaecce |
| fresh-target-ownership | ok | mechanical: SHA256 equals the file; my ownership run gives collisions 254, newGapGroups 0, newActivePairs 0, nativeDuplicates 0, drift 0 and the output file is byte identical to the committed one; the audit script prints all 254, active 207, sameSource 205, drift 0 | none | 2b677738da6b1f11b9307046ad7a74345893533663ca62ccad800546b29d1469 |
| fresh-link-replay | ok | mechanical: SHA256 equals the file; my replay output is byte identical to the committed file and the audit script reports 366 original rows and 98 later rows with 0 findings and the four round3 edits equal the committed vision.md and packaging lines | none | 973ed51820a387ce5addf7e63d58c949083ccc9c7d0b92746ab887a86f911d57 |
| fresh-all-shards-consistency | ok | mechanical: SHA256 equals the file; my rerun of the unchanged checker gives 12895 rows, 92 shards, 836 generated rows, 0 findings, ok true, its raw sha256 equals rawReportSHA256 65c11dbe and the interned witnesses expand to my raw output for all 3498 headings; the checker passes claim_4eeb2f40 although its rationale has a false label sentence, so this proves consistency with the generator only | none | d16bd192a1cbad42d4903355cd8dcf18b41a30e6c790b1059cb9773c0b479670 |
| fresh-predecessor-reconciliation | ok | mechanical: SHA256 equals the file; for the two new predecessors (claim_f15e4328 and claim_9e9d711e in the advisory playbooks) the before digests recompute at 287a22d33 and the current digests at 62751458b at the named anchors, recorded before texts equal the files, registryWritten false and approvalCarried false hold | none | 6454e80e61cc17f1fcecae3ce36b17a6a5e5f1db10bdde980e3bfb5d0ac58e69 |
| fresh-native-dependent-refresh | ok | mechanical: SHA256 equals the file; for the four changed rows (two s2 agent-coordination heading rows, two s10-round4 gap rows) after equals the row in the request worktree shard, before equals the row at 62751458b where the shard exists, all four stay pending with no approval carried; the rows themselves belong to other requests | none | dec45de3bb67976443bf361690661397221f6ddbb1cabca44fc6c94975cc7a38 |
| fresh-reproduction | ok | mechanical: SHA256 equals the file; I ran the listed commands sequentially with only the scratch directory renamed (review627-x3) to avoid collisions with parallel reviewers, nothing was written inside the worktree, and every output matched as described in the rows above; the historical author mutation scripts were not run | none | 60070cb2b3ab0c6daff10f0afba523928897a26f4ecb1bd02ba0c0d964d891a9 |

## Notes

1. Evidence rows say ok only for what the note states I reproduced; nothing here approves current truth or cutover.
2. Important limit: the unchanged checker reports 0 findings although claim_4eeb2f406288458e61bad21531966ab1 carries a label sentence that is false for its row (see its verdict), so zero checker findings does not prove rationale truth; the checks above are my own recomputation.

Unresolved: check H was not reproduced because it cannot run read-only here.
