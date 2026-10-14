# Independent bounded review request

Author session: codex-session:28@2026-10-15
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Entries: 18
Pack: [review-pack-261015-0027-root-pending-resume.md](review-pack-261015-0027-root-pending-resume.md)
Pack SHA256: cbddc3777b72f6937ac6cfc67ce93da772be754025f5e471f330d9a27a26e6c9
Sidecar: review-pack-261015-0027-root-pending-resume.md.json
Review scope: A36: previous bounded alias, reopened decision and retained-path wording re-review

A36: mechanically recompute full digests, check real anchors and exact shard/pack equality for every ordinary row. Deep-read a seeded random sample of at least 15% (minimum 10; all if fewer), plus every differing-digest row listed in the pack. Record seed, sampled IDs and deep/mechanical in notes. If more than 3% of deep rows need rework, read the full pack before reporting.

Write one ordinary verdict row per submitted claim, using full 64-hex native source/target digests (literal none for absent target). Write separately labelled verdicts for truth/proposal/conflict/receipt accounting. Preserve dissent and Notes verbatim; no self-review, approval carry, promotion, alias activation or consumer rewrite. Keep the three Coordination Rings holds and existing exception memberships. Do not review unchanged accepted rows or certify closed batches afresh.

Mandatory differing IDs: claim_0956ea2eadf0a32787b7fd0e51d693a6, claim_f0b2a4079764d68b1102ddddb08776ce, claim_c295c4c899afa37544bda841421c92e4, claim_d7660c15ae6c2d2e7d610c1aa571101c, claim_743cde02b9562c5f8e4724512ee6fc8f, claim_56db2b3b7a6258289e1ab13f5c69d47f, claim_60329d1f27688d4a78c094951d5ac119, claim_337ac8c09351c841eae612279299eb52, claim_1be7573f879e8eda05723b6d40b3b84e, root-authorities-draft-0263, root-authorities-draft-0300, retained-path-01, retained-path-02, retained-path-04, retained-path-05, retained-path-06
Absent-target IDs: claim_0956ea2eadf0a32787b7fd0e51d693a6, claim_f0b2a4079764d68b1102ddddb08776ce, claim_c295c4c899afa37544bda841421c92e4, claim_d7660c15ae6c2d2e7d610c1aa571101c, claim_743cde02b9562c5f8e4724512ee6fc8f, claim_56db2b3b7a6258289e1ab13f5c69d47f, retained-path-01, retained-path-02, retained-path-04, retained-path-05, retained-path-06
