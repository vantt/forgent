# Phase 8 owner answers and Lead decisions

Author: `codex-session:fgos-run_unit-run-1792366642fb4c@2026-10-19`.

## Inherited decisions

Read [Phase 6 A1–A44](../phase-06/owner-answers.md), then [Phase 7 A45–A48 and L11-1–L11-28](../phase-07/owner-answers.md) and [the closed scorecard](../phase-07/phase-07-scorecard.md). These records are inherited, not copied or re-decided. A38 independent review is Lead-started, fresh-context, read-only, with no authorship overlap; the proposed Phase 8 harness carries the same eligibility as L11-1. A42 lets the Lead settle owner-routed choices with reasons and report them at checkpoints. It does not authorize main landing, push, Phase 9 cutover or deletion. Stable/public contract renumbering also stops for the owner. A45 already assigns Gateway CTR010 and confinement CTR011 in candidates; legacy lines wait for cutover.

## A49 — Authorize Phase 8 detailing (owner, 2026-10-19)

- **Direction:** detail Phase 8, “Eliminate switchboard bypasses and prepare consumers”, after Phase 7 closed under A48.
- **Scope:** this planning turn plus the explicitly assigned main-merge accounting data. Fill Related Code Files and independently parkable Implementation Steps against the unchanged Requirements and Success Criteria. Record progress. This is not an implementation, tooling-build, consumer-rewrite or cutover receipt.
- **Standing delegation:** A42 continues; Phase 8 Lead decisions start at L12-1. The Lead starts independent reviewers under A38. No reviewer is started by this Doer turn.
- **Limits:** no main landing, push, promotion, retirement, deletion, contract renumbering or Phase 9 execution. Current turn writes only the plan subtree and the six ratchet exception accounts. No fgOS CLI, state access, git writes, native sync or global D/E.

## L12-1 — Account main merge and preserve its conflict resolutions

- **Date/status:** 2026-10-19; Lead direction supplied in the assignment, recorded by the Doer, not an author-selected review verdict.
- **What is happening:** merge `49ad04648447439b5c243af6ddd0b604acb5b3e5` imports main `708ea660894eb88aa4575ec07bf13d916d02c14c` into the plan branch. The Lead resolved seven conflicts. Six legacy exception digests now mismatch.
- **Cause:** upstream platform and legacy documentation changed after common base `eab4d617b06cf5e05d8602f35987a9798e67005c`; preservation requires explicit accounting, not another transformation.
- **Options/cost:** leave digests stale (ratchet blocks); re-account imported digests/main commits using `1c626c8aa`, `37f6f7499`, `c3f22d6a6` and L11-21 (six data rows, no source edit); carry/rebind now (violates A47 and this turn's scope).
- **Decision/recommendation:** use the established accounting procedure; preserve these supplied resolutions:
  1. `component-boundary.md`: take main's Terminal-control, Containment port, Git, Run Supervisor, Launch gate and Agent protocol rows, plus new Holder-lock and Session Identity text. Keep the plan's Event Store row immediately after Git. Main's three route rows precede the plan's carriage sections.
  2. Holder-lock spec: main's sides win. `event-seal` and `event-append` are registered in `lock-registry.v1.json`; the state store's hot mutex `withStateTx` replaces `events.lock`/`claims.lock`. These two facts supersede L11-20's old wording at those spots; they do not claim Event Store implementation has shipped.
  3. Packaging-distribution `activation-binding`, `release-manifest`, `setup-doctor-registry`: main's new numbered sections precede the plan's retained-source appendices.
  4. Intent-preservation ledger: main's two new rows collided with candidate PF-I011/PF-I012, so main's rows are PF-I022/PF-I023 in the candidate. Main references them only in `plans/reports/phase-lead-261018-2025-controller-death-p06-doctor-docs-changelog.md`; reconciling that incoming reference at Phase 9 landing is a named obligation, not an edit now.
  5. Citation-drift baseline: accept main's removal of the deleted unlock-skill entry and retain the plan's two `docs/specs` entries. The baseline is untouched by this turn.
- **Accounting scope:** update only the six exception digests, append exact main commit provenance and keep their inherited approval/revisit metadata. Five files equal main's bytes; reading-map preserves the L11-25 accepted banner and two knowledge-skill fixes. This is not content approval. [Merge accounting](merge-accounting.json) records both digests and per-path main commits.
- **Reproduction scope:** enumerate exact first-parent non-merge commit/path pairs against the two existing manifest exception arrays. At input HEAD no pair is missing; leave both manifests unchanged rather than inventing a pair or changing embedded checker logic. A later runner commit needs its actual commit/path accounting, never a guessed id.
- **Unit boundary:** no carry/rebind. Phase 9's first obligation remains per-unit accounting of every changed candidate file (A47), now including the thirteen `docs/platform` files changed by this merge. The Phase 9 file contains the exact list.
- **Proof/limit:** ratchet exit 0 after data accounting. The requested three-file test run has an additional reproduction blocker: ownership audits see 85 target-digest drifts across nine targets, before any Phase 8 edit. [Exact rows](reproduction-blocker.json). Adding commit/path pairs cannot repair target bindings. Do not modify the audit or rebind units to manufacture a pass. Route this conflict to the Lead under A42; independent review is still owed.
- **Known separate blocker:** P7-DOC-GAP-05 dead-vocabulary guard is Phase 9's pre-landing obligation, not an excuse for the reproduction failure.

## Owner-only decision routing for later execution

No owner answer is needed to finish this detailing turn. The Lead settles routine link choices, ambiguities, review sizing and scope readings under A42, recording L12 decisions. A proposed new engine or expansion outside the approved scope is first analyzed by the Lead; it is not silently added.

When an excluded action becomes concrete, send one batched decision packet following `core/skills/_shared/decision-question.md`. Each question includes these five explicit parts:

- **What is happening:** identify the pinned reviewed change and the action requested (main landing/push; Phase 9 cutover/deletion; stable/public contract renumbering).
- **Cause:** show remaining evidence, consumer parity and dependency results, and why current authority cannot safely move earlier.
- **Options and cost:** execute the exact reviewed action (state touched paths/contracts, time and rollback cost), defer it (state affected rows and waiting cost), or revise scope (state rework/review cost). Supply actual estimates at that gate, not invented approval now.
- **Recommendation:** Lead chooses from the evidence and names unresolved proof; this planning document does not recommend bypassing a failed gate.
- **Scope of answer:** specify exactly which landing/push, cutover/deletion paths or contract identities are approved; no bundled permission for other excluded actions. A49 alone approves none of them.

## L12-2 — Drifted target bindings from the main merge stay with the Phase 9 accounting (superseded by L12-3)

Historical record only. Its false premise and expected-red policy are superseded; do not execute this direction.

- **Facts:** after merge `49ad04648`, the two ownership audits in `test/scripts/doc-rationale-reproduction.test.mjs` (step10-round5, step10-sync4d) reject 85 decision target bindings whose target digests drifted because main edited nine files: activation-binding (50), release-manifest (14), docs/specs/runner.md (7), setup-doctor-registry, architecture-manifest.json, confinement-authority.md, distribution.md (3 each), component-boundary and holder-lock spec (1 each). Exact rows: `reports/phase-08/reproduction-blocker.json`. No reproduction pair is missing; the ratchet is green after the six re-accounted exceptions.
- **Decision:** rebinding these is main-import accounting of changed candidate files, which A47 makes the first Phase 9 obligation; it is not done in Phase 8. Until then the two audits are expected red for exactly these 85 rows (plus the known dead-vocabulary guard, P7-DOC-GAP-05). Every Phase 8 proof run compares the failing set against `reproduction-blocker.json`; any other failing row, test or file is a stop.
- **Why:** Phase 8 edits consumers (instructions, skills, code comments, tests), not candidate docs/platform content, so it adds no rows to this set; repeating a rebind now would be redone after every later main merge.

## Supplied revision decisions — Lead under A42, 2026-10-19

Recorded by the Doer from this assignment; these are settled Lead directions, not independent-review verdicts. They resolve the plan red-team at `fc2076ece` and do not authorize implementation in this detailing turn.

### L12-3 — Green binding package before consumers (supersedes L12-2; P8-1/2/6)

L12-2's premise was false: Phase 8 edits decision-target files, including evidence consumers, and positional `unheaded-block-N` anchors can shift. Step 0 is now a package turn rebinding all 85 imported drifts across all nine files, including docs/specs and architecture-manifest rows, by the established Phase 7 rebind procedure. Both ownership audits must be green before any consumer edit. Every later batch editing a decision-target file carries/rebinds its changed units in the same batch (N1 shape), resets affected review, and ends with both audits plus checks.mjs green. The committed plan-local read-only `audit-report.py` runs both unchanged manifest recipes independently and enumerates manifest-qualified rows/current digests, so ownership failure cannot mask checks A. No checker edit or red-baseline waiver. Reason: binding integrity is a batch property; postponing repair would either stop intended work or silently absorb new drift. A47's final conservation/current-truth accounting remains; the 85-row rebind is no longer a Phase 9 deferral. This records a decision, not a claim that Step 0 has executed.

### L12-4 — Pre-cutover reading of Success Criterion 1 (P8-3)

Reading only; do not edit the criterion: Phase 8 proves every reader/writer of a legacy authority path is switchboard-routed or packaged as an exact cutover edit, so after the Phase 9 flip none treats legacy as authority. The literal repository-wide search is Phase 9's post-flip proof. Reason: the operative switchboard deliberately keeps legacy current before cutover; asking that it already be retired contradicts the approved sequence. This supplied A42 reading resolves the question now, not at closure.

### L12-5 — Drift scope follows every written path class (P8-4)

Main-drift comparison covers identity scope plus core/**, domains/**, src/**, test/**, apps/**, bin/**, scripts/** consumers and generated renders (and other actual write classes). Merge main only when that diff is empty; otherwise carry at the next batch boundary with per-file conflict review and refreshed affected proof. Reason: docs-only drift checks miss source/render/runtime changes and invalidate reviewed parity silently.

### L12-6 — Reuse Git custody/ref door; no second guard (P8-5)

Step 6b is only a read-only reuse check against Git phase 04 (`git/p04-custody`) custody lease/ref door and the program board at `plans/261017-1313-fgos-platform-program-board/plan.md`. The Lead coordinates with the Git lead and records landing/dependency evidence. Building any lease waits until Git 04 lands and must be designed on its door. Reason: a parallel migration ref guard would duplicate a live foundation mechanism and violate L10/RUL104. The earlier lease design is input to compatibility analysis, not permission to implement another guard. No coordination or landing is claimed by this turn.

### L12-7 — Legacy-root consumers are patch specs (P8-7)

No Phase 8 edits under docs/specs/** or docs/architect/**. Exact consumer rewrites go into the Phase 9 cutover packet. Reason: early edits churn roots that cutover retires and require avoidable ratchet exceptions. Plan-local binding repair pointing at those roots remains allowed under L12-3 without target content edits.

### L12-8 — Purpose means a small flip, not early landing (P8-8)

“Not holding hundreds of edits” means consumers route through the switchboard so the flip is one row/table change. It does not authorize early main landing, which remains owner-only. Reason: preparation and landing are separate permissions; retaining prepared batches on the branch is the approved boundary. No automatic early-harvest packet is required by this revision.

### L12-9 — Inherited obligations and Decision F revisit (P8-9)

Step 5 includes core/workflows classification through the existing shipped-path generator and inventory regeneration with its existing test. Step 7 records Plan A/B phase 06 landing status in the AGENTS.md cutover packet. Decision F revisit is settled now: keep deferring the ratchet's main landing; it guards legacy roots Phase 9 retires and retires with them. Build no --record mode (RUL104). Reason: restore missed obligations without adding a temporary ratchet feature whose roots disappear at cutover. Lease implementation remains dependent on Git 04, and A/B status must be checked rather than assumed landed.

### L12-10 — External-project conventions stay unchanged (P8-10)

The 13 shipped docs/history/<feature>/plan.md writer conventions and sibling CONTEXT/RESEARCH/DISCUSSION conventions describe external-project topology and stay unchanged in this plan. The nine historical references remain historical. Any convention change is a separate backlog item. Reason: this repo's authority migration does not redefine the layout of projects using fgOS; history is not a legacy authority root.

## Red-team recommendations applied and alternatives declined

P8-11–18: bounded/countable review parts and budgets; consistent serial estimates; independent Step 6/6b dependencies; preserve/rewrite proof for ten code/test/gate rows; seven exact conflict paths with merge-byte digests; committed inventory-pattern scanner including dogfood-fixture; explicit verifier/lease-check scorecard rows; gateway cargo suite as a Lead-run heavy job alone. Merge checkpoint/red-team into one adversarial closure review; alias cases stay columns of the census, with Step 3 review.

Not applied: P8-1/6's alternative of carrying an expected-red 85-row-plus-delta set into Phase 9, because L12-3 requires green Step 0 and same-batch N1 repair. No new owner SC question (P8-3): the supplied L12-4 reading settles it under A42. No second lease implementation/rehearsal (P8-5): L12-6 waits for Git 04. No automatic early harvest or spec-only conversion of every Step 4 edit (P8-8): L12-8 permits preparation on the branch but reserves landing. No generic 10–15-day estimate (P8-12): the cut lease implementation and revised step sum give 7.75–13 Doer days including fix reserve, plus review; re-estimate after census. No fixed 85-row regeneration as the ongoing acceptance baseline: the committed reporter records both manifests, while acceptance requires zero unexplained drift and green checks. Historical blocker JSON remains historical evidence, not a waiver. All other recommendations are incorporated; no implementation/proof completion is implied.
