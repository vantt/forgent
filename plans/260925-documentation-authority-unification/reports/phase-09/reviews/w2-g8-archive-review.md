# w2-g8-archive review: G8 archive design/rehearsal (c9826a369), at ae9b9a6ef

Verdicts: 6 APPROVE / 6 REWORK (12 items, all checked; no sampling). Machine form: w2-g8-archive-review.json.

## Verified (APPROVE)
- Manifest custody is exact. 6,663 = 573 + 6,090. Blob, size, mode and sha256 recomputed for every row.
- Archive ref policy (create-only, local, no rewrite) and prior-prune recovery: all 279 blobs reachable and hash-equal.
- scriptRefs coverage is 2,918 joins, including 47 readers / 135 joins. 0 live test/script/src readers point at a moved or pruned target.
- Tip size: 1,269,268,475 B recomputed against 1,269,268,322 B claimed. The 153 B difference is the disclosed post-measurement wording edit.
- Checkout time on real disk. The rehearsal clone is not visible here, so I rebuilt the same tree in /tmp/fgos-work/w2-g8-archive. `git worktree add --detach` on ext4 NVMe took 21.03 / 23.86 / 18.67 s, median 21.0 s (load avg 22-30). A pin control took 99.3 s. This is under 60 s, but not ≤20 s, and 2.5× the tmpfs figure.

## REWORK
1. All 313 retirement specs give themselves as their owningProof, so none names an owning proof. 53 retire scripts that read no moved record. Ten are current Phase 09 gate replayers.
2. The rehearsal never reaches check A, because both ownership tests fail earlier in both runs. checks.mjs lines 9/23 would flag the removal commit: 375 of its moved paths are outside allowed-paths.json. The design must name pair accounting for that commit.
3. The 1.27 GB tip is only partly justified. 491 MB (47 files) has live readers. 540 MB (5,663 files) is kept only by the 1 MB threshold, with no reader. The design's explanation misstates this, and the reasons mislabel several live product inputs as "small record". The owner must decide on the small-record tranche.
4. Low: the 'tmpfs' label is hardcoded in rehearse.py.
5. Low: the main-side "small manifest" is 2.7 MB, mostly the retained audit, and archive/** adds 14 MB to the tip.

G8 stays partial; it is not met-local.
