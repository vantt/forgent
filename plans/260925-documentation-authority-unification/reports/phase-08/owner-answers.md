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

L12-2's premise was false: Phase 8 edits decision-target files, including evidence consumers, and positional `unheaded-block-N` anchors can shift. Step 0 is now a package turn rebinding all 85 imported drifts across all nine files, including docs/specs and architecture-manifest rows, by the established Phase 7 rebind procedure. Both ownership audits must be green before any consumer edit. Every later batch editing a decision-target file carries/rebinds its changed units in the same batch (N1 shape), resets affected review, and ends with both audits plus checks.mjs green (batch end are clarified by L12-11/L12-14 below; no B exception remains). The committed plan-local read-only `audit-report.py` runs both unchanged manifest recipes independently and enumerates manifest-qualified rows/current digests, so ownership failure cannot mask checks A. No checker edit or red-baseline waiver. Reason: binding integrity is a batch property; postponing repair would either stop intended work or silently absorb new drift. A47's final conservation/current-truth accounting remains; the 85-row rebind is no longer a Phase 9 deferral. This records a decision, not a claim that Step 0 has executed.

### L12-4 — Pre-cutover reading of Success Criterion 1 (P8-3)

Reading only; do not edit the criterion: Phase 8 proves every reader/writer of a legacy authority path is switchboard-routed or packaged as an exact cutover edit, so after the Phase 9 flip none treats legacy as authority. The literal repository-wide search is Phase 9's post-flip proof. Reason: the operative switchboard deliberately keeps legacy current before cutover; asking that it already be retired contradicts the approved sequence. This supplied A42 reading resolves the question now, not at closure.

### L12-5 — Drift scope follows every written path class (P8-4; refined by N4 below)

Historical wording, refined below: Main-drift comparison covers identity scope plus core/**, domains/**, src/**, test/**, apps/**, bin/**, scripts/** consumers and generated renders (and other actual write classes). Merge main only when that diff is empty; otherwise carry at the next batch boundary with per-file conflict review and refreshed affected proof. Reason: docs-only drift checks miss source/render/runtime changes and invalidate reviewed parity silently.

### L12-6 — Reuse Git custody/ref door; no second guard (P8-5; SUPERSEDED by L12-13)

Historical, not executable: Step 6b was only a read-only reuse check against a proposed Git custody lease/ref door and the program board at `plans/261017-1313-fgos-platform-program-board/plan.md`. The Lead coordinates with the Git lead and records landing/dependency evidence. Building any lease waits until Git 04 lands and must be designed on its door. Reason: a parallel migration ref guard would duplicate a live foundation mechanism and violate L10/RUL104. The earlier lease design is input to compatibility analysis, not permission to implement another guard. No coordination or landing is claimed by this turn.

### L12-7 — Legacy-root consumers are patch specs (P8-7)

No Phase 8 edits under docs/specs/** or docs/architect/**. Exact consumer rewrites go into the Phase 9 cutover packet. Reason: early edits churn roots that cutover retires and require avoidable ratchet exceptions. Plan-local binding repair pointing at those roots remains allowed under L12-3 without target content edits.

### L12-8 — Purpose means a small flip, not early landing (P8-8)

“Not holding hundreds of edits” means consumers route through the switchboard so the flip is one row/table change. It does not authorize early main landing, which remains owner-only. Reason: preparation and landing are separate permissions; retaining prepared batches on the branch is the approved boundary. No automatic early-harvest packet is required by this revision.

### L12-9 — Inherited obligations and Decision F revisit (P8-9)

Step 5 includes core/workflows classification through the existing shipped-path generator and inventory regeneration with its existing test. Step 7 records Plan A/B phase 06 landing status in the AGENTS.md cutover packet. Decision F revisit is settled now: keep deferring the ratchet's main landing; it guards legacy roots Phase 9 retires and retires with them. Build no --record mode (RUL104). Reason: restore missed obligations without adding a temporary ratchet feature whose roots disappear at cutover. The original Git 04 lease dependency is superseded by L12-13; A/B status must be checked rather than assumed landed.

### L12-10 — External-project conventions stay unchanged (P8-10)

The 13 shipped docs/history/<feature>/plan.md writer conventions and sibling CONTEXT/RESEARCH/DISCUSSION conventions describe external-project topology and stay unchanged in this plan. The nine historical references remain historical. Any convention change is a separate backlog item. Reason: this repo's authority migration does not redefine the layout of projects using fgOS; history is not a legacy authority root.

## Red-team recommendations applied and alternatives declined

P8-11–18: bounded/countable review parts and budgets; consistent serial estimates; independent Step 6/6b dependencies; preserve/rewrite proof for ten code/test/gate rows; seven exact conflict paths with merge-byte digests; committed inventory-pattern scanner including dogfood-fixture; explicit verifier/lease-check scorecard rows; gateway cargo suite as a Lead-run heavy job alone. Merge checkpoint/red-team into one adversarial closure review; alias cases stay columns of the census, with Step 3 review.

Not applied: P8-1/6's alternative of carrying an expected-red 85-row-plus-delta set into Phase 9, because L12-3 requires green Step 0 and same-batch N1 repair. No new owner SC question (P8-3): the supplied L12-4 reading settles it under A42. No second guard (P8-5): L12-13 now restores the owner-accepted thin-wrapper lease and rehearsal in Phase 8 on current doors. No automatic early harvest or spec-only conversion of every Step 4 edit (P8-8): L12-8 permits preparation on the branch but reserves landing. No generic 10–15-day estimate (P8-12): the earlier lease-excluding sum was 7.75–13 Doer days including fix reserve; L12-13 restores implementation/rehearsal and revises this to 8.75–15 days plus review; re-estimate after census. No fixed 85-row regeneration as the ongoing acceptance baseline: the committed reporter records both manifests, while acceptance requires zero unexplained drift and committed-byte checks under L12-11/L12-12, with raw/effective B verdicts separated. Historical blocker JSON remains historical evidence, not a waiver. All other recommendations are incorporated; no implementation/proof completion is implied.


## Supplied re-check decisions — Lead under A42, 2026-10-19

These directions come from this assignment, not an independent acceptance verdict. The earlier re-check remains NEEDS-REVISION until a fresh reviewer accepts these edits. Only planning/accounting descriptions are authored here; no execution receipt is implied.

### L12-11 — Separate committed-pair accounting after each author commit (N1)

Keep the established `6f88f5d8e` Phase 7 manifest-data route. Each batch has (1) its actual author/runner commit and (2) a separate accounting-only commit appending that batch’s exact `{commit,path,authority}` pairs to both Phase 6 reproduction manifests’ embedded exceptions data. No allowlist widening, checker logic edit or guessed commit id. The accounting commit touches only those allowlisted manifests; progress is written in the author batch before handback and the next author update reports the previous accounting receipt. **Batch end is after the accounting commit.** Run audits/checks on clean committed bytes there, never certify a working-tree snapshot and never make reproduction green a pre-commit runner requirement for out-of-allowlist author paths. Step 0 consumes the pinned exact pair list and re-enumerates before execution, including later plan commits and this runner commit when known. Reason: working-tree writes and then their unaccounted commits necessarily fail A until the approved data append; separating the checkpoints makes the established gate achievable without changing it. Both manifests must agree; the two historical `6f88f5d8e` pairs are the procedural precedent, not a blanket path exemption.

### L12-12 — One exact classifier exception to Phase 8 check B (N2; WITHDRAWN by L12-14)

Historical only; do not execute. The external lane below was never accepted and grants no exception.

Plan.md §7.4 item 3 already assigns the `core/workflows/**` classifier and shipped inventory regeneration to Phase 8. Keep that work in Step 5 and extend the existing generator. Use frozen B pins for every file except `scripts/generate-shipped-path-inventory.mjs`, recorded in the plan-owned [exception lane](check-b-exception-lanes.json) with before/after Git blob hashes, tests-first proof, actual implementation commit and independent review. The before hash is pinned now; after/proof/review are pending until implementation and cannot authorize acceptance while missing. No frozen baseline or embedded checker is edited. Retain raw historical B failure/exit after the change; Phase 8 effective B accepts only the exact reviewed lane hash, while all other B rows and A/H/I must pass. Never label the raw historical test green. Reason: the inherited authorized classifier repair conflicts with a historical byte pin, not with its behavioral contract; an explicit external accounting lane preserves both history and the intended work. This is the Phase 7 `step-09-close-accounting-lanes.json` form of an exact exception, not a broad gate waiver.

### L12-13 — Restore the accepted lease on current Holder-lock/Git doors (N3; supersedes L12-6)

The owner’s 2026-10-06 decision stands: deliver the lease in Phase 8 per all ten decisions in `cutover-write-lease-design.md` §6, including no TTL, fail closed, explicit abandon, rehearsal and reference-transaction guard. As refined by L12-15, Step 6b first performs a read-only reuse check against `src/holder-lock/index.mjs` `acquire` under a lease-owned registered lock name, and `docs/platform/git/spec.md` typed ports. It does not reuse the shared `withMainCheckout` mutex for the lease. The committed held sidecar persists the freeze across processes and holder death, failing closed; scope-only merge refusal permits code-only merges. Dispatch refusal applies at `fgos run`, `fgos workflow start` and `bind()`. Build only a thin wrapper on these doors; Publication remains the only production door to `refs/fgos/*`. Its hook-disabled private operations must not be mistaken for coverage by a repository ref hook. No parallel lock/liveness mechanism or second ref guard (L10/RUL104). No Git 04 landing dependency or inaccessible branch input. If pinned evidence establishes a real conflict with the owner design, route the five-part decision packet to the owner (facts/cause/options with costs/recommendation/precise scope); the Lead cannot reverse it under A42. Reason: the reuse rationale was valid but waiting for a future component wrongly undid an explicit owner decision. Current foundation doors provide the right first comparison. Phase 9 step 1, the main plan’s owner note and risk row, estimate and scorecard now agree. The Lead must update the external board DOC row; this scoped worker cannot and claims no coordination receipt.

### Re-check clarifications N4–N9 and P8-4/5

- **N4 / P8-4:** refine L12-5 to identity scope plus the exact files the current batch writes, including each generated path and root README/dogfood fixtures when touched. Identity diff determines merge/defer; overlap with actual batch files determines affected consumer review/parity refresh. No whole source/render-tree gate. Reason: broad trees invalidate unrelated proof daily and missed the two named surfaces.
- **N5 / P8-5:** drop the unavailable custody branch input and Git 04 wait under L12-13. Current source/spec pins, independent thin-wrapper proof and an explicit Lead board-update obligation replace them. Board writes remain outside this worker’s scope.
- **N6:** refresh the Phase 8 plan row, classifier/Decision F forward pointers and progress input counts. Historical verification JSON retains its earlier pinned counts; the new exact input receipt is authoritative for this revision. Reason: pre-commit counts omit their own future commit.
- **N7:** retain reporter code unchanged. Its same-anchor `currentDigests` field is diagnostic only and can be wrong after positional shifts. Step 0 must resolve by native id/anchor correspondence and passage content through the existing Phase 7 procedure; ambiguous/missing matches park for Lead judgment and independent review. Never substitute that digest blindly. Reason: the brief permits stating and routing this limit; this turn forbids code edits.
- **N8:** queue rows 3–5 and 31–39 are cutover-patch-only under L12-7, alongside the ten separately classified code/test/gate rows. Reason: no Phase 8 target-content edits in either legacy root.
- **N9:** record the three clean both-sides auto-merges separately from seven manual resolutions, with merge/HEAD/worktree hashes and marker checks in merge-accounting.json. Reason: ten both-parent differences do not mean ten manual conflicts.

No supplied re-check finding is declined. The reporter-code alternative is intentionally replaced by its permitted limitation/routing treatment; actual accounting, classifier/lease implementation and independent acceptance remain subsequent execution work.


## Supplied second re-check decisions — Lead under A42, 2026-10-19

### L12-14 — Withdraw the B lane and defer classifier/inventory (NEW-1, L-3)

- **Evidence/branch:** read the full embedded `checks.mjs` in both `reports/phase-06/step10-round5-reproduction.json` (`scripts["checks.mjs"]`) and `step10-sync4d-reproduction.json` (`readOnlyScripts["checks.mjs"]`). Both use `const B=start.B.map(...)` from `step10-start-checks.json.B`, require every `expected===actual`, and include `B.ok` in `result.ok`. There is no B exception-data field. Their `exceptions` literal is consumed only by `accountOf` for A commit/path pairs; extending it cannot account a generator hash.
- **Decision:** take the supplied fallback. Move `core/workflows/**` classifier repair and shipped-path inventory regeneration OUT of Phase 8 into the separate backlog proposal in the phase file/main plan. Withdraw L12-12 and its unfilled external lane; no effective-B computation remains (L-3 is dropped with the generator change). Preserve every frozen B pin and the unchanged reproduction test.
- **Reason:** `verify-phase-01` is frozen to its approved range; later inventory freshness is not a Phase 8 success criterion. RUL104 forbids editing a checker to make room. An external prose lane could not make the actual suite green and would violate the proof contract.
- **Close boundary:** Step 8 permits only P7-DOC-GAP-05’s known dead-vocabulary guard to be red. Any other red, including either embedded check or `doc-rationale-reproduction.test.mjs`, stops close. Dead-vocabulary remains a Phase 9 pre-landing blocker; no new L5 exception or landing waiver.

### L12-15 — Refine lease reuse onto current doors (NEW-2)

- **Decision:** reuse the Holder-lock `acquire` facade (`src/holder-lock/index.mjs`) under its own lease lock name, with a new lock-registry row coordinated with the Holder-lock owner through the program board before build. Do not reuse `withMainCheckout` as the lease: it is the shared callback-scoped merge mutex and releases on holder death. It may be used only for brief cutover ref/commit operations.
- **Persistence:** the committed “held” sidecar carries the freeze across Units/processes and kernel-holder death. Held sidecar plus absent lock stays refused, with no TTL or automatic reopening; decision-9 holder token and explicit release/owner abandon remain required. Scope-intersecting merges are refused; code-only merges proceed.
- **Current admission:** implement the owner’s dispatch refusal at `fgos run`, `fgos workflow start` and `bind()`; the removed `fgos dispatch execute` is not a door. Preserve typed Git/Publication ownership and all ten owner semantics.
- **Reason/scope:** this refines owner decisions 1/3/5/9/10 onto current foundations, not a reversal. Remaining real design conflicts go to the owner’s five-part packet. No new lock/liveness mechanism, parallel ref guard, registry write or lease implementation is authorized by this text revision.

### Second re-check dispositions — NEW-3 and L-1–L-4

- **NEW-3:** Step 6b before any build reads the current-main program board and current-main door pins, declares exact shared writes, intersects with Git 04 custody, COOK and other in-flight lanes, and records Holder-lock-owner registry coordination. Collision stops the build and goes to the big lead for sequencing. Reason: dropping a blanket Git 04 dependency does not permit colliding writers.
- **L-1:** L12-11’s accounting is a second Lead-dispatched `fgos run` Unit given the real author commit id, with only the two manifests in declared writes; its runner commits. No hand commit, progress write in that Unit or guessed id.
- **L-2:** Step 4 adds ≥ceil(actual commit/path pairs/60) accounting-review parts per render batch (also ≤400 KB), covering both literals, beyond source/render review. Lead sizes time from measured throughput before authoring; seed reviewer days do not absorb an unbounded generated-path count.
- **L-3:** no effective-B computation is needed or allowed after L12-14 removes the generator change. Raw B must pass unchanged.
- **L-4:** the input receipt is re-enumerated at `cf28815f6122b98986784385a31330a36d28bb71`: 30 pairs in both manifests, hence 131 Step 0 input entries and ≥3 parts. The execution brief must re-enumerate at its own input HEAD; later runner/report commits add pairs after their ids exist. Historical 21/29 counts remain valid only at their pinned heads.

All seven new findings have text dispositions; implementation, actual accounting and fresh independent acceptance remain owed. No owner design is reversed and no out-of-scope board/backlog update is claimed.

## L12-16 — Accept Step 0 (Lead, A42)

- **Evidence:** author `a2e8634df` (85/85 drifted target bindings rebound, 0 parked), accounting `b1e7aec1a` (49 pairs per manifest = 37 input + 12 from the author commit; data-only diff). Batch-end acceptance by the Lead on clean committed bytes at `b1e7aec1a`: `audit-report.py` exit 0 (no failing rows, zero unaccounted pairs), three-file reproduction/ratchet/citation tests 67/67, ratchet exit 0. Independent reviews `review-a38-step-00-author-accounting-part-0{1,2,3,4}.md`: 35 + 38 + 9 + 56 = 138 ok, 0 rework.
- **Non-blocking notes kept for Phase 9:** some rebound rows' rationale text still quotes old digests/anchors (`binding-071/072/073`); the authority string cites `a2e8634df` for all 49 pairs including the 37 earlier ones (commit/path fields exact); six previously reviewed rows lost `evidenceDigest`/`acceptanceScope` as intended (no approval carry). Rationale wording alone is never rework (L10-37).
- **Decision:** Step 0 accepted; consumer edits may start. Lead record commits under `reports/phase-08/` create commit/path pairs; they are accounted by the next batch's accounting Unit, and batch-end acceptance is judged only after it.

## L12-17 — Settle parked Pilot B rows 16 and 17 (Lead, A42)

- **Facts:** both rows are in `docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md` (lines 213, 248) and send a non-Node participant to `docs/specs/work-state.md` RUL10 for "the `.fgos/events.lock` protocol in full". Main replaced `events.lock`/`claims.lock` with the hot mutex `withStateTx` and recorded it in the legacy source as "RUL10 … bổ chú 3 (2026-10-17, mutex nóng)" (`docs/specs/work-state.md:1201`, commits `dc8acf9bf`, `247d2d1a1`, `08d754c30`). The candidate `docs/platform/work-state/spec.md` RUL10 (line 1050) lacks bổ chú 3 and still describes `events.lock`.
- **Decision:** rows 16 and 17 become **cutover-patch-only**: the exact patch repoints them to `docs/platform/work-state/spec.md#11-business-rules` (RUL10), valid only after Phase 9's first obligation (A47 main-import accounting) has carried bổ chú 3 into the candidate. Added to the Phase 9 dependency list. No early target edit.
- **P8-DOC-GAP-01:** the participant contract's prose still instructs reimplementing the retired wx/dead-pid `events.lock` protocol; that is stale content, not a link problem. It becomes a separate backlog item (rewrite against Holder-lock §15 `withStateTx`), outside Phase 8 (RUL104: link migration does not grow into content rewrites).
- **Result counts after this decision:** 2 rewrite / 21 cutover-patch-only / 24 preserve / 0 parked.

## L12-18 — Accept Step 1 (Lead, A42)

- **Evidence:** proposals `33b80f0de`, Lead L12-17 `c75796efa`, accounting `1b8603207` (13 pairs per manifest). Batch-end acceptance on clean committed bytes at `1b8603207`: reporter exit 0, three-file tests 67/67, ratchet 0. Independent review `review-a38-step-01-pilot-b-01.md`: 47/47 ok, 0 rework, agrees with L12-17.
- **Effective dispositions:** 2 rewrite / 21 cutover-patch-only / 24 preserve / 0 parked (the proposals file still shows the pre-L12-17 counts 2/19/24/2; this entry is authoritative).
- **Carried conditions:** P8-DOC-GAP-01 (participant-contract prose) must land before or with the cutover patch for rows 16/17; row 17's `:1045` line suffix is replaced together with its path. Rows 32/33 may use a different target section; the current one is acceptable.
- **Main drift:** Step 2's first census attempt was stopped after six minutes so main `51c61af64` (30 commits, 94 files) can be merged first; its partial outputs were saved outside the repo, not committed, and Step 2 reruns on the merged base.

## L12-19 — First census slice review results and dispositions (Lead, A42)

- **Evidence:** author `ce84b84e7`, accounting `0689b862e`, batch-end green (reporter 0, 67/67, ratchet 0). Independent reviews `review-a38-step-02-merged-census-part-0{1..9}.md`: 307 entries → 302 ok, 3 rework, 2 needs-Lead-judgment. The six merge rebindings (part 01) are accepted.
- **Rework (the next census batch fixes these rows; patch-spec anchors only, no disposition change):** `cli-005` (`bin/fgos.mjs:3515`) re-anchor to the multi-session checkout section of `docs/platform/runner/operations/h-51f5cd7279fd.md` (around line 649–659), or cite both sections; `setup-001` (`src/setup/git-hooks.mjs:85`) find a verified target that states the dependency-install no-op, else park with a missing-target note; `evidence-195` (`scripts/check-legacy-docs-ratchet.baseline.json`) is frozen gate data: preserve bytes, and its rows retire with the ratchet at Phase 9 (L12-9), never "mirror navigation".
- **Lead judgment, `evidence-181`/`evidence-182`** (`docs/platform/agent-coordination/playbooks/coordination-operating-harness.md`, `.../prompts/master-coordinator.md`): they carry live write destinations and `test -s` checks on the verification tree, so they are behavioral consumers → Step 5. Their cutover patch moves the write destination and checks in lockstep with the evidence payload move (parity-proven). If Step 5 shows the playbooks only describe the retired coordination engine, they become historical-preserve instead, recorded with evidence.
- **Expansion rule (parts 03 and 08 exceeded 3% rework):** both parts were already fully read; the expansion is a mechanical anchor check of every cutover-patch target (owner + anchor exists and the cited passage contains the claimed statement token) across the whole census, run in the next census batch, with failures re-reviewed.
- **Non-blocking notes to carry:** wrapped two-line evidence citations in comments go into the wrapped-comments class / Step 5 checklist; generic "candidate mirror navigation" cutover text on classifier-test rows (209–212) reads "change in lockstep with the checker"; duplicated gate-bypass `CONTEXT.md` edge is a scanner quirk.

## L12-20 — Second census slice review results and dispositions (Lead, A42)

- **Evidence:** author `8606433d6`, accounting `c801778ac`, batch-end green (reporter 0, 67/67, ratchet 0). Independent reviews `review-a38-step-02b-census-part-01..22.md`: 1,279 entries → 1,238 ok, 14 rework (1.1%), 27 needs-Lead-judgment (all settled below).
- **Live references to retiring legacy paths** (`skills-031/105/164`, `setup-018..020`, `cli-001/003`, `skills-192` and their kind): any live consumer (skill, instruction, code, maintained prose) of a path that moves or retires at cutover (`docs/specs/**`, `docs/architect/**`, or a legacy-current file with a move alias such as `docs/operator-runbook-herdr-cockpit.md`) gets an exact cutover patch to its canonical successor; when only a non-canonical conservation carrier exists, the patch points at the history/provenance location. `preserve` is allowed only for a historical citation whose lookup-only alias resolves after cutover.
- **No executable `new` text on parked rows** (`skills-001/009/045/078/084/087/090/118/126` and kind): a row parked on Step 3 or checker parity carries a candidate suggestion only, status blocked; Step 3 sets exact text. Shipped external-project citation conventions stay unchanged (L12-10); `scripts/check-decision-citation-drift.mjs` scope changes are out of plan.
- **`instructions-019/020`** (AGENTS.md install gate → `docs/distribution-vision.md`): parked to Step 3; default target is the packaging-distribution portal README, which links the vision as direction. This changes an always-loaded sentence's meaning, so it is listed explicitly in the Phase 9 cutover owner packet.
- **Bare decision ids** (`ADR0020` etc. without a path): not path consumers; they resolve through the decision index and stay guarded by the citation-drift checker. Phase 9 adds a check that the regenerated decision index still resolves every cited id to the candidate area decision histories.
- **Non-authority IO constructs** (`migrate-porting-state-backfill.mjs` ×8 under `docs/distillery`): get preserve edges like `distill.mjs`, for census consistency.
- **Deleted code-panel/plan-loop dispositions** (part 22 rows 14–20): record stripping commit `8eff54d0f` (2026-09-28) as the provenance of the stub text; no action change.
- **Rework for the next census batch:** relabel `skills-137/138` (prohibited-writer), `skills-160` (reader, no destination), `skills-166` (writer of `docs/history/<feature>/plan.md`); add edges for AGENTS.md lines 27, 35, 70 and fix the two mis-joined `docs/decisions/*.md` glob edges plus the three `citation-format.md` glob rows; AGENTS.md `sourcePaths` add `core/instructions/decision-question.md`; D-ADR0030 owner is `docs/platform/runner/decisions/h-36d872fbb0e5.md`.
- **Expansion (parts 08 and 14 exceeded 3%; wrapped citations are systematic):** a mechanical rescan of every census class for path citations wrapped across lines (join continuation lines; truncated owners like `skills-182/183` rebound), each new edge re-reviewed; plus re-check every instruction-class `docs/decisions` reference.
