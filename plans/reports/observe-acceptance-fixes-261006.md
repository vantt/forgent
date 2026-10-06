# Observe acceptance repairs — 2026-10-06

Status: in progress. Baseline is committed `0b06824a7` plus watchdog commit `ea1c8fee0`; tracked working tree was clean at start. The original Opus acceptance reports are immutable review records, not edited by this repair.

## Owner decisions and scope

- Owner confirmed in this conversation: **“Đúng, xác nhận yêu cầu”** to the question whether “làm hết tất cả phase đi” on 2026-10-05 superseded the foundation-only gate. This is confirmation captured now, not a claim that the reviewers found historical authorization in the repository.
- For timestamps, the owner specified: **“hiện nay chỉ có mình anh dùng, chưa ai dùng nhiều nên không cần quá nhiều backward compatible, làm sao để chính xác, ổn định, chạy nhanh và đơn giản.”** The implementation choice under those criteria is result `settledAt`/`timestamp`, then same-run `run.json.settledAt`; never `startedAt` or assignment `createdAt` as settlement. Remaining undated results are counted skips, not fabricated completion times. This is the implementer's technical choice, not a quote of an exact sequence selected by the owner.
- No new work item, push, release activation, credential read, `.fgos/events` or `.fgos/backups` mutation. User requested separate ordered repair commits. Narrow checks run after each group; exactly one final full npm suite runs after every other test job finishes.

## Verification-policy conflict, not a repository law

The requested permanent exact import-closure assertion and source-enumerator allow-list tests conflict with this session runtime's prohibition on permanent source-text/wiring tests. **They are not restored/implemented.** This is not a rule inferred from AGENTS.md or any repository file. The original guard criterion is restored verbatim and unchecked; inventory and behavioral tests are not represented as an equivalent guard. No owner waiver is claimed.

A throwaway inventory used the existing reconciliation test's static import walk and its two proven-leaf cutoffs. Current closure is exactly these 12 modules (the historical assertion named the other 11):

```text
src/config/global-config.mjs
src/config/shared-config-file.mjs
src/runner/dispatch/assignment-layout.mjs
src/runner/dispatch/provider-capacity.mjs
src/runner/dispatch/reconciliation-planner.mjs
src/runner/dispatch/run-result.mjs
src/runner/dispatch/runtime-inspection.mjs
src/runner/dispatch/visibility-session.mjs
src/runner/dispatch/worker-artifacts.mjs
src/setup/config-merge.mjs
src/util/unique-tmp-tag.mjs
src/verbs/dispatch/reconcile.mjs
```

This is a dated observation, **not permanent regression prevention**. Historical assertion was read with `git show 2639e0c85:test/runner/dispatch-reconciliation-import-graph.test.mjs`; it was deleted in the feature commit rather than updated. The guard remains an explicitly unmet original-plan criterion.

## Diagnosis baseline

User-supplied Opus probes and failure observations are the pre-fix baseline; they are not rerun merely to confirm. Read-only scouts mapped the affected Node/Rust sources, caller chains and test homes. All findings below are associated with `0b06824a7` unless they describe an evidence/process claim. Tests will prove changed behavior, not assert implementation text or incidental wiring.

| Surface | Exact observed symptom / input | Underlying defect and expected behavior |
|---|---|---|
| research panel | `researcher-1..3` valid stances give `measurement: unmeasured, stanceSeats: 0` | `discussions.rs:123-138` selects voters from labels; writer's actual panelist kind is dropped. Reader must consume writer-owned kind. |
| inline reviewed producer | summary `outcome: pass` and settledAt before checkers | `run.mjs:600-603` settles the whole unit from a producer record. Only pattern completion may settle a multi-role unit. |
| missing votes | three missing votes give `agreement: 0, genuineSplit: true` | `discussions.rs:157-167` treats zero valid claims as measured dissent. It must be unmeasured/null. |
| checker throw | early execution-failure summary omits still-running sibling | `reviewed.mjs:321-322` fail-fast Promise.all escapes before peers drain. Wait for all peers before propagating the original failure. |
| missing/unusable summary | killed units and null settledAt summaries disappear | `unit_summary.rs:131-141` silently skips and exposes no scan diagnostics. Count missing/unusable artifacts without reconstructing owner pattern semantics. |
| backfill / publication | in-flight unit may look settled; derived-write error throws passed unit | backfill has no live-unit guard; synchronous derived publication exceptions escape authoritative settlement. Preserve authoritative result and warn on derived-write failure. |
| coverage / lookup | newly created no-result run causes shortfall; duplicate id selects first path | recent tolerance inspects only result files; findRunDir returns first identity match. Use candidate-dir freshness and reject ambiguous identity before show/watch/recover. |
| eval | partial known rubric and duplicate evalId accepted; arm64 no-follow flag wrong | validator only checks nonempty scores, append has no locked uniqueness check, hard-coded Unix flags are architecture-specific. Enforce rubric completeness/identity under lock and use libc platform constants. |
| judge evidence | isolated claim false; solo cites panel; historical objective not reused | effective configured invocation did not isolate; comparison arms shared prior-result access and used a different question. Correct provenance; old scores are not an independent historical-question comparison. |

## Finding ledger

Each row will receive its commit and exercised proof, or an explicit non-fix/UNPROVEN disposition. Original reports: [foundation](opus-acceptance-review-foundation-261006.md), [discussion](opus-acceptance-review-discussion-measurement-261006.md), [eval/honesty](opus-acceptance-review-phase6-and-honesty-261006.md).

| Report finding | Disposition | Commit / proof |
|---|---|---|
| Foundation H1: dropped owner-dated history / incomplete policy choice | Pending settled-time fallback and doctor eligibility | Owner criteria above; 706 settled / 219 started-only is reviewer baseline, not a fresh count. |
| Foundation H2: deleted closure / missing source guard | **Not fixed: runtime test-policy conflict**; original criterion reopened | Current 12-module throwaway closure above; no permanent prevention claimed. |
| Foundation M1: Node/Rust admission equivalence overclaimed | Pending product classification or explicit directory-only scope | — |
| Foundation M2: newly created dir tolerance | Pending | — |
| Foundation M3: misleading shortfall example paths | Pending | — |
| Foundation M4: missing result called unparseable | Pending missing-result reason | — |
| Foundation M5: duplicate id spoof / outbox protection scope | Pending ambiguous lookup and scoped wording | — |
| Foundation Low: degraded flag not consumed | Pending disposition; no silent extra scope | — |
| Foundation Low: symlink files count as run-dir barriers | Pending disposition | — |
| Foundation Low: assignments/runs empty assignment id | Pending disposition | — |
| Foundation Low: watchdog out-of-plan | Already separate `ea1c8fee0`; no rewrite | Commit reported in user prompt. |
| Discussion H1: researcher seats unmeasured | Pending writer-owned kind | — |
| Discussion M1: inline producer prematurely settles unit | Pending | — |
| Discussion M2: zero valid claims reported genuineSplit | Pending | — |
| Discussion M3: reviewed checker throw loses peer | Pending | — |
| Discussion M4: crashed/killed units lack detector | Pending summariesMissing diagnostics | — |
| Discussion L1: unusable summaries silently dropped | Pending counted skip reasons | — |
| Discussion L2: stance line for every worker | Pending measured-seat-only prompting | — |
| Discussion L3: backfill races in-flight units | Pending active-unit exclusion | — |
| Discussion L4: derived summary error fatal | Pending nonfatal warning | — |
| Discussion L5: roleTasks now apply to panel members | Pending restore unrequested behavior or explicit disposition | — |
| Discussion L6: resume silently ignores stance options | Pending explicit refusal | — |
| Eval Medium: incomplete known rubric | Pending | — |
| Eval Low-Medium: duplicate evalId | Pending | — |
| Eval Low-Medium: architecture-specific no-follow constant | Pending | — |
| Eval Low: lexical timestamp list ordering | Pending disposition | — |
| Eval Low: unsafe shard silently skipped | Pending disposition | — |
| Eval concurrency: same shard not exercised | Pending cross-process same-shard regression | — |
| Honesty High: false isolation provenance | Pending records/report/plan/journal/how-to correction | Reviewer transcript findings are ground truth. |
| Honesty High: solo consumed panel output | Pending explicit confound disclosure | Old scores stay real but not an independent comparison. |
| Honesty High: weakened exact import closure | Same unresolved runtime-policy conflict as foundation H2 | No restoration claimed. |
| Honesty Medium: different historical question | Pending explicit deviation disclosure | — |
| Honesty Medium: raw judge command contradicts dispatch door | Pending how-to routed invocation / data-only blindness limit | — |
| Honesty Medium: cross-project unqualified runRefs | Pending root qualification in setup provenance | — |
| Authorization unproven | **Owner confirmed now** | Exact answer above, historical transcript discoverability remains separate. |
| Watchdog residual append failure may prevent kill | Not changed: outside requested repair groups | Review identifies risk; no claim it is resolved here. |
| Original all-phase completion / re-review approval claims | Reopened by acceptance; not proof that all consumer defects were absent | New regression and finding-specific proof pending. |

## Verification

No final full-suite run has started. Final Rust, CLI, narrow and full-suite outputs will be persisted here. Any live re-comparison will use the entire historical objective and genuinely independent arms; lack of real isolation or provider quota will be reported rather than fabricated. No old score will be relabeled as a new comparison.

### Initial verification correction

- The existing reconciliation import-graph suite was exercised unchanged: `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/dispatch-reconciliation-import-graph.test.mjs`, **22 pass / zero fail**. This does not restore the missing exact assertion or source-enumerator guard.
- GitNexus incremental refresh failed on an inconsistent derived FTS index; `analyze --force` rebuilt successfully at the current checkout (58,821 nodes, 81,138 edges). Pre-commit `detect-changes --scope all --repo /home/vantt/projects/forgentX` reports docs only, no affected processes, LOW risk. Generated AGENTS.md/CLAUDE.md edits are not staged.
