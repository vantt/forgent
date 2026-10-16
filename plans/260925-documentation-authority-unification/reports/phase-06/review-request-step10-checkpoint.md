# Step 10 refreshed independent checkpoint request

Content pin: `38672e7f157788cbe1b2bf59511bd61046dce660`; docs are unchanged from this pin. Package pin is **the runner commit containing this request**, resolved by the reviewer with `git rev-parse HEAD`. Producer: `codex-session:unit-run-1792176628519-ac852ba4@2026-10-17`. Phase 6 remains open; no owner acceptance, promotion, retirement, sealing or cutover is claimed.

First complete the ONE [ordinary request](review-request-step10-close-index.md): **25 entries in one file** (3 pending backlog decisions, 1 full re-carry accounting row, 6 list/receipt refreshes, 15 native changes). Apply only committed matching verdicts with Notes verbatim, then refresh the checkpoint population. Request preparation grants no approval.

The current complete unselected [source population](checkpoint-10-source-population.json) contains **22,759 active bindings** from all 1,045 frozen-map sources: **22,757 reviewed** (13,313 producer-labelled script-proven; 9,444 manual) and **2 pending** (`claim_f0b2a4079764d68b1102ddddb08776ce`, `claim_127225b8542c701295574b1b00749594`). It separately preserves 2,235 scoped native identity gaps. Population SHA256: **`eba7f5fa4ff78dc9078d44642b874b7000171d7f8fe8f6361cb5eed937a4d71d`**. Producer labels are conveniences, not proof of exactness, current truth or reviewer approval.

Use a fresh reviewer session started by Lead under A38. Read `review-brief.md`, Step 10/shared rules, `owner-answers.md` A28/A34/A36/A38/A42/A43 and L10-37..40, `step-10-report.md`, the ordinary request, prior truth samples and red-team evidence at their pins. **Commit order: sensitivity pack first; `review-10-checkpoint.md` second; seed key last.** Under a worker contract, use separate runner-owned rounds and never run Git writes inside the worker.

Frozen checkpoint requirements:

- catch at least 5/6 sensitivity mutations and produce at most 2 false flags/24 controls;
- read every judgment row; draw 100 distinct script-proven exact rows and independently recompute at least 10%;
- draw 50 distinct candidate blocks (20 unnamed, 20 rewritten-rationale, 10 random), disclosing short strata; two unlabelled invented claims stop the phase;
- run independent A28 current-truth sampling and a final red-team with 0 open Critical/High;
- preserve A36 mechanical/deep rules, one rework round, and the existing second-round-above-3% stop condition.

Producer results to reproduce independently:

- Sole native sync: **802.964s**, one compact persistence of 62,195,972 bytes, known IDs 99,584→99,585 with zero loss, 4,486 files/91,388 active tuples equal. Registry SHA256 **`b20238af95f89cd3a83fbc20dd53ce8df1192153415cd85b9586d53884aa9c2b`**. Do not repeat carry-forward or persistence.
- Global D: 0 fatal for both priors together, identity alone and Phase 02 alone (94.040s/94.759s/94.018s). Strict E covers 22,759 claims/2,235 gaps in 1,045 sources: 2 pending, 28 partial, 362 groups, 2,336 reverse, 0 unknown and 0 undisposed reading-map gaps.
- Exact comparator: exit 0 / `ok=true` / **zero differences**. Its `strictGreen=false` field truthfully reflects the expected open categories above; it is not a hidden comparator difference or waiver.
- Promotion 160/160, H 609 files/217 checked/0 findings, T9 17/17, mutation 12/12. Audit and rationale consistency each cover 12,905 rows/93 shards with 0 findings; 66 historical witness limits stay explicit. Ownership has 0 new active pairs/0 native duplicates/0 target drift. Replay 366+98+4 and A/B/H/current routes are clean.
- Relevant tests finish 507/507 after one isolated seeded-fixture rerun; no full npm-suite claim. Alias draft validates all 9,236 entries. Snapshot has 68,463 rows, verifies true, is unsealed, SHA256 `96ab39486f6e67f96e93a5e6251828e9c5861595a2100a58fb15459b4c844820`.
- Full checkpoint refresh: **123 shards / 2,558,697,813 bytes / 19 top-level fields**, every part hash and all 91,388 native tuples verified. Aggregate SHA256 **`4d00146ebab1b783c01425088be06b8fa75d81d18a9c55178082983b49891775`**. Registry bytes are reused from the sole persistence.
- Inputs exercised by strict E changed, so the rehearsal was rerun. Genuine whole-corpus + Step 2 reduced rehearsal completed in 968.706s; clone removed=true; docs diff empty; cutover exit 1 with 7 pass/12 blocked/1 review. No blocker was simulated away.

Use the portable commands/helpers in [step10-package-reproduction.json](step10-package-reproduction.json) and the bounded ordinary helper in [step10-close-reproduction.json](step10-close-reproduction.json). Run native inventory, D/E, checkpoint export and rehearsal ONE AT A TIME with 4096 MiB old-space/16 MiB semi-space and at least 6 GiB scratch; release consumed scratch transports before rehearsal. Never repeat native carry-forward or registry persistence.

The checkpoint report must preserve the two pending backlog decisions until independently approved, all expected strict-E opens, A34/current-truth/consumer/cutover queues, 20 wording/citation/successor notes, 32 Phase 7/8 groups, 14 runner-cutover bindings, witness limits and the unreported owner token total. Producer execution is not reviewer confirmation. After ordinary review/application and an accepted checkpoint, complete A28 truth sampling and final red-team; only a separate close turn may set `awaiting owner review`.
