# Host Invocation checkpoint effort record

Author session: codex-session:1@2026-10-11
Authored document commit: ffab9879172f3143d96b25b87f5bbd2c4d93b718
Frozen checkpoint commit: 76353c58eb885becc550d734fde5d7c2709cce33

| Measure | Observed |
|---|---:|
| Legacy sources | 6 |
| Source rows authored | 431 |
| Judgment rows requiring complete independent review | 257 |
| Weak-exact rows requiring complete independent review | 174 |
| Script-proven Unit-exact/Mirror rows | 0 |
| Restore groups, all native T9 anchors checked | 16 |
| Literal source units placed in restore groups | 51 |
| Current-batch metadata exception groups | 1 |
| Candidate-unverified rows, exact native reverse equality | 572 |
| Owned document commits | 21 |
| Completed independent Host review rounds | 0 |
| Boundary tests passed | 155 |

The six original pending shards were joined into one real batch without changing any row, so the existing checkpoint sensitivity selector can use its 174 byte-equal pending rows. This is not a newly script-approved exact class; all 431 decisions remain pending. No author seed or nonce was generated.

UNPROVEN: reviewer throughput/rework rate until the first committed review; owner token total (not available in the tool evidence); the reviewer-held sensitivity score, red-team verdict, two fresh-reader scores and A28's 30-unit current-truth sample. These are not estimated or reported as passed. Counts and actual argv/output are in host-invocation-accounting.json.
