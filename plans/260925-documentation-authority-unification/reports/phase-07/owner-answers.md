# Phase 7 owner and Lead decisions

## Inherited owner answers

Owner answers A1-A44 remain authoritative in
[`../phase-06/owner-answers.md`](../phase-06/owner-answers.md). Phase 7 especially
inherits A28, A34, A36, A38, A42, A43 and A44.

- A44 closes Phase 6 and authorizes Phase 7.
- A42 delegates ordinary owner-routed choices for the remaining plan to the Lead.
- Main landing, push, Phase 9 cutover/legacy retirement, deletion, locked-law changes
  and stable/public contract renumbering remain owner-only.

L11-1..L11-7 were supplied by the Lead in assignment
`unit-run-1792200236674-43960430/producer/1` as A42 applications. L11-8..L11-11 are
the Lead's bounded decisions on the committed Step 1 A38 review. Together they repair
the independent findings without authorizing promotion, cutover or retirement.

## Phase 7 Lead decisions

### L11-1 — Extend A38 independent-review eligibility through Phase 7

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** Phase 7 needs independent reviewers, key reviewers, fresh
  readers and scorers, while A38's original wording was scoped to Phase 6.
- **Cause:** A44 continued A42 but did not expressly extend A38, leaving the planned
  review roles without a recorded independence rule.
- **Options and costs:** require owner-started external sessions only (more owner
  waiting); accept Lead-started fresh-context reviewer subagents under the same A38
  constraints (lower latency, same separation); or self-review (invalid).
- **Recommendation:** extend A38 to Phase 7 for Lead-started fresh-context reviewer
  subagents that did not author the reviewed rows.
- **Scope of answer:** Phase 7 review, key, reader, scorer, red-team and truth-sample
  roles only; it does not waive distinct identities, pinned briefs or artifact proof.
- **Lead decision:** the recommended extension applies.
- **Reason:** independence comes from fresh context, author/reviewer separation and
  evidence binding; requiring the owner to start every session adds waiting without
  strengthening those controls.
- **Evidence:** A38, A42, A44; red-team P7-9.
- **Affected rows/steps:** shared review rule; Steps 1-9.

### L11-2 — Close Phase 7 with one complete final-byte accounting step

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** Phase 7 candidate edits change native identity-scope bytes and
  would invalidate Phase 6 target digests, candidate-unverified tuples, identical
  groups, A34 bindings and comparator equality.
- **Cause:** the first plan treated re-review as local but omitted a final native
  conservation carry.
- **Options and costs:** hand changed units to Phase 9 (cheap now, makes Phase 7's
  close claim false); carry after every edit (many ~11 GiB jobs); or make one L10-42
  shaped carry after the final content (one expensive package turn, complete proof).
- **Recommendation:** one final carry and accounting step.
- **Scope of answer:** one native carry at final committed Phase 7 content; rebind and
  independently re-review every changed unit; refresh target digests,
  candidate-unverified lists, identical groups and A34 partial carries; run D against
  both priors together and each alone, strict E and the unchanged comparator.
- **Lead decision:** Step 9 is the single closing accounting step; no Phase 7-changed
  unit is handed to Phase 9.
- **Reason:** it preserves Phase 6 conservation at the bytes Phase 7 actually closes
  while paying the native cost once.
- **Evidence:** L10-39, L10-42; red-team P7-1/P7-2.
- **Affected rows/steps:** every changed unit; Step 9.

### L11-3 — Synchronize main only when the full identity-scope rule can be honored

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** the owner asked Phase 7 to keep up with main, but a partial
  scope check previously missed root instruction drift.
- **Cause:** `docs/` alone is not the native identity scope; root `AGENTS.md`,
  `CLAUDE.md` and the transitional switchboard also participate.
- **Options and costs:** never merge until a later phase (stale branch); merge freely
  and repeatedly (repeated carry/review); or merge early only on an empty full-scope
  diff and otherwise defer to the single close carry.
- **Recommendation:** the conditional/deferred rule.
- **Scope of answer:** before a Phase 7 merge, compare
  `HEAD...main -- docs AGENTS.md CLAUDE.md
  plans/260925-documentation-authority-unification/transitional-switchboard.json`.
  Empty may merge; non-empty waits until Step 9, whose single carry accounts for both
  Phase 7 and main identity changes.
- **Lead decision:** apply the recommended rule.
- **Reason:** it satisfies the owner's freshness request without recreating Phase 6's
  repeated close-turn failure.
- **Evidence:** L10-41/L10-42; red-team P7-4.
- **Affected rows/steps:** shared synchronization rule; Steps 1 and 9.

### L11-4 — Read candidate-versus-own-legacy pairs as target settled

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** most queued “conflicts” are a reviewed candidate paired with
  its own still-live legacy source; none of the plan's old report labels described that
  transitional state accurately.
- **Cause:** Phase 9 owns retirement, while Phase 7 must still settle meaning and the
  single target owner.
- **Options and costs:** mislabel as deferral/owner block (false); add a vocabulary enum
  (forbidden and unnecessary); or record a report-level reading of existing fields.
- **Recommendation:** use “target settled; legacy source retires at Phase 9.”
- **Scope of answer:** resolution reports for candidate-versus-own-legacy pairs. It is
  not a vocabulary value, authority flip or retirement action.
- **Lead decision:** use the recommended reading; Step 2 becomes a mostly mechanical
  27-pair pass, with the intra-platform triple read in full.
- **Reason:** settled meaning and one target owner are compatible with a legacy source
  remaining live until the atomic cutover.
- **Evidence:** reviewed Phase 6 source→candidate bindings; red-team P7-5.
- **Affected rows/steps:** 27 semantic candidate/legacy pairs; Step 2.

### L11-5 — Test readers in the post-cutover frame and repair candidate navigation

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** current candidate headers say non-canonical while the success
  criterion asks whether the future corpus works without legacy authority; prior
  readers also exceeded the budget because candidate routes were missing.
- **Cause:** the old brief mixed present authority with post-cutover acceptance and
  deferred all navigation to the root switchboard.
- **Options and costs:** test current truth (cannot satisfy the criterion); allow legacy
  ownership (hides the target-corpus defect); or declare the post-cutover frame and
  repair candidate-only navigation before sealing.
- **Recommendation:** the post-cutover frame plus candidate portal/header repairs.
- **Scope of answer:** reader brief/key and candidate navigation only. Readers start at
  `docs/platform/README.md`; legacy is provenance, never owner. The root switchboard
  and candidate switchboard files remain Phase 8; Phase 7 changes portal/header links.
- **Lead decision:** apply the recommendation.
- **Reason:** it directly measures the second success criterion and removes the known
  read-budget failure without performing Phase 8 work early.
- **Evidence:** Phase 6 fresh-reader gaps; red-team P7-6.
- **Affected rows/steps:** candidate navigation; Steps 7-8.

### L11-6 — Finish bounded content/alignment work before key sealing

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** the old order edited candidate truth after the key/readers and
  assigned six stale coordination rows to two steps; “every operative claim” also
  expanded into Phase 9's full truth check.
- **Cause:** implementation alignment, authority separation and acceptance ordering
  were expressed as separate whole-corpus passes.
- **Options and costs:** keep the order (stale key and duplicate writers); do the full
  corpus check now (unbounded and violates A28); or finish a bounded population before
  sealing and leave full truth to Phase 9.
- **Recommendation:** bounded pre-key work.
- **Scope of answer:** only Step 1 cross-area rows, known stale tables and a seeded A36
  sample. The six stale coordination rows belong only to Step 5's authority-separation
  subpass; its implementation-alignment subpass later verifies them.
- **Lead decision:** all implementation-alignment edits finish before key sealing;
  apply the bounded scope and ownership above.
- **Reason:** reader evidence stays current, duplicate writes disappear and A28 3(b)
  remains intact.
- **Evidence:** A28, A36; red-team P7-7/P7-8.
- **Affected rows/steps:** Step 5 and Steps 7-8.

### L11-7 — Route CTR010 numbering to the owner now

- **Date:** 2026-10-17
- **Status:** sent by the Lead; owner answer pending
- **What is happening:** CTR010 names both `confinement-authority.v1` in the platform
  contract registry and `fgos-gateway.v1` in Gateway API material; the registry also
  lacks a separate Gateway REST row.
- **Cause:** two independently evolved public/stable contract names reused the same
  number.
- **Options and costs as sent:** (A) Gateway keeps CTR010; confinement-authority takes
  the next verified-free number and Gateway receives its missing registry row; (B)
  confinement-authority keeps CTR010 and Gateway takes the next verified-free number
  plus its registry row; (C) defer, parking only the dependent rows.
- **Recommendation as sent:** option A. This is the Lead's released recommendation;
  the owner still decides because the choice renumbers a stable/public contract.
- **Scope of answer:** the contract number owner and the new Gateway registry row.
  No edit, renumbering or compatibility claim occurs until the owner answers.
- **Lead decision:** ask this question in the first owner batch; continue unrelated
  work. Park the CTR010 rows in Step 3 and the final zero-conflict verdict in Step 9.
- **Reason:** A42 cannot renumber a stable/public contract, and asking at Step 1 removes
  avoidable owner latency from the critical path.
- **Evidence:** `docs/platform/architecture-map.md`,
  `docs/platform/component-boundary.md`,
  `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`, Phase 6
  owner queue; red-team P7-10.
- **Affected rows/steps:** CTR010 and Gateway REST registry rows; Steps 1, 3 and 9.

### L11-8 — Identify the architecture-manifest pair by paths, not a stale blob

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** the Phase 6 queue keys the architecture-manifest duplicate
  pair with stale blob `e6d9582dd`, while both paths share current blob `2ff043edb`.
- **Cause:** the two files changed together after the queue snapshot, so their member
  set stayed stable while the content-addressed key changed.
- **Options and costs:** edit the dated Phase 6 queue (destroys its snapshot meaning),
  keep using the stale key (breaks the current join), or key the Phase 7 row by its two
  stable paths and retain the current blob as evidence.
- **Recommendation:** use the two paths as identity and record `2ff043edb`; leave the
  Phase 6 queue unchanged.
- **Scope of answer:** X-DUP-03 and its Step 6 join only; no baseline or queue edit.
- **Lead decision:** apply the recommendation.
- **Reason:** membership is the stable fact across synchronized content changes; a
  stale content key cannot identify the current group.
- **Evidence:** `review-a38-fresh-groups-01.md`; X-DUP-03.
- **Affected rows/steps:** X-DUP-03; Steps 1 and 6.

### L11-9 — Treat an already-promoted target as the settled target authority

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** X-SEM-12 pairs a still-live legacy source with a target that
  was already promoted rather than one still labelled candidate.
- **Cause:** L11-4 named candidate-versus-own-legacy pairs but did not spell out the
  stronger already-promoted case.
- **Options and costs:** invent a separate handling path (duplicate semantics), reopen
  the promotion (outside Phase 7), or apply the existing settled-target reading.
- **Recommendation:** apply “target settled; legacy source retires at Phase 9.”
- **Scope of answer:** X-SEM-12's report-level reading only; no promoted-file edit,
  retirement or authority transition.
- **Lead decision:** apply the recommendation.
- **Reason:** a promoted file is already the target authority, so it satisfies the
  single-target requirement more strongly than a candidate target does.
- **Evidence:** `review-a38-cross-area-inventory-01.md`; L11-4; X-SEM-12.
- **Affected rows/steps:** X-SEM-12; Step 2 and Phase 9 retirement.

### L11-10 — Use the candidate platform portal as the navigation host

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** four system-architecture candidate files have no candidate
  navigation host, and no area-local portal exists at B0.
- **Cause:** the earlier migration deferred their routes to the root switchboard,
  which Phase 7 may not edit.
- **Options and costs:** create another portal (new surface), wait for Phase 8 (reader
  gate remains broken), or add one system-architecture area entry to the existing
  candidate `docs/platform/README.md` and link all four files there.
- **Recommendation:** use `docs/platform/README.md` in Step 7.
- **Scope of answer:** the planned Step 7 candidate navigation edit only; no root
  switchboard or authority-status change now.
- **Lead decision:** apply the recommendation.
- **Reason:** the existing candidate portal is the reader entrypoint fixed by L11-5
  and can expose all four routes without creating a competing portal.
- **Evidence:** X-NAV-01..04; `review-a38-cross-area-inventory-01.md`; L11-5.
- **Affected rows/steps:** X-NAV-01..04; Step 7.

### L11-11 — Bind placeholder inventory digests to real units at close

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** 31 Step 1 rows presently hash a note id, target path or route
  placeholder rather than the content/routing unit they are meant to prove.
- **Cause:** Step 1 intentionally allowed late binding for 14 DEFECT, four NAV and 13
  QF rows, but their hashes cannot serve as closing evidence.
- **Options and costs:** accept the placeholders (false proof), bind them during each
  content step (duplicated work), or require real unit digests in Step 9's single
  closing package.
- **Recommendation:** require all 31 real bindings in Step 9 and normalize routing
  notation now to distinguish Phase 8/9 from Phase 7's Step 9.
- **Scope of answer:** inventory proof and route notation; no checker, baseline or
  vocabulary change.
- **Lead decision:** apply the recommendation.
- **Reason:** late binding remains efficient only if close proves the actual units;
  explicit Phase/Step notation removes an otherwise material routing ambiguity.
- **Evidence:** `review-a38-cross-area-inventory-01.md` Notes 2-4.
- **Affected rows/steps:** X-DEFECT-01..14, X-NAV-01..04, QF-01..13; Steps 1 and 9.

### L11-12 — Classify S3-01 as historical/deferred intent

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** S3-01 treated the preserved Team Cognition Engine advisory
  chain as a current cross-area seam missing a contract id.
- **Cause:** the engine is retired, and current `runPattern` has no cognition producer;
  the surviving current owners are CollaborationPattern and Workflow.
- **Options and costs:** mint a contract for a nonexistent producer (false current
  architecture); delete preserved intent (loses history); or classify it as
  historical/deferred intent with no id and route the visible superseded label to
  Step 5.
- **Recommendation:** use the historical/deferred classification and Step 5 route.
- **Scope of answer:** S3-01 matrix/check classification only; Step 5 owns any visible
  candidate relabeling.
- **Lead decision:** apply the recommendation; allocate no contract id.
- **Reason:** a retired advisory with no runtime producer is not a live contract seam.
- **Evidence:** `review-a38-step-03-04-architecture-01.md` R1;
  `docs/platform/agent-coordination/spec.md:24-42`;
  `src/runner/execution/patterns/index.mjs:34-46`.
- **Affected rows/steps:** S3-01; Steps 3 and 5.

### L11-13 — Treat S3-09 as covered and queue the internal policy gap

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** S3-09 claimed a missing cross-area contract between
  RunResult and lifecycle action.
- **Cause:** the write side already crosses CTR001/CTR002 and the read side consumes
  the run-result contract recorded by S3-08; only the driver's undocumented
  confidence/category-to-action mapping remains.
- **Options and costs:** mint a redundant id (duplicates existing boundaries); ignore
  the undocumented decision mapping (leaves a reader gap); or mark the seam covered
  and carry the internal mapping as an owner-queue documentation gap.
- **Recommendation:** mark S3-09 covered by CTR001, CTR002 and S3-08, and queue the
  driver-policy documentation gap without creating a contract.
- **Scope of answer:** S3-09 classification plus the documentation-gap queue entry;
  no runner-spec edit in this turn.
- **Lead decision:** apply the recommendation.
- **Reason:** an internal decision arrow is not a new wire contract, but its mapping
  still needs an explicit owner-readable explanation.
- **Evidence:** `review-a38-step-03-04-architecture-01.md` R4;
  `src/runner/loop.mjs:1011-1030`; `src/workflow/runner.mjs:83-97,164-166`.
- **Affected rows/steps:** S3-09; Step 3; owner queue item
  `P7-DOC-GAP-01` below.

### L11-14 — Allocate live-seam registry ids without inventing payload versions

- **Date:** 2026-10-17
- **Status:** decided
- **What is happening:** S3-02 and S3-04 are live public/persisted seams but lacked
  registry ids; CTR011-CTR013 were verified unused before this application.
- **Cause:** the documents survived the engine retirement, while their present
  payloads carry no version field of their own.
- **Options and costs:** leave both unregistered (Step 3 stop remains); invent payload
  versions (false implementation claim); allocate registry ids and state the missing
  fields honestly.
- **Recommendation:** CTR012 for `workflow-step-operation`, CTR013 for Assignment;
  leave DispatchPlan inside `assignment-run.v2`.
- **Scope of answer:** candidate registry/docs and Step 3 evidence only; no code,
  payload, checker, vocabulary or shipped-contract change.
- **Lead decision:** apply the recommendation.
- **Reason:** it closes the live registry seams while keeping implementation truth
  explicit and avoiding an unnecessary DispatchPlan id.
- **Evidence:** `review-a38-step-03-04-architecture-01.md` R2/R3;
  `src/workflow/definition.mjs:241-253`; `src/workflow/steps.mjs:57-85`;
  `src/runner/execution/run.mjs:555-580`;
  `src/runner/dispatch/assignment.mjs:443-444,626-628`;
  `src/runner/dispatch/plan.mjs:56`;
  `src/runner/dispatch/assignment-runner.mjs:1570-1583`.
- **Affected rows/steps:** S3-02, S3-04; Step 3.

### L11-15 — Merge the holder-lock landing now and carry it at the close

- **Date:** 2026-10-17
- **Status:** decided by the owner ("merge nhé"), Lead recommendation
- **What is happening:** main `0d6da9033` landed holder-lock with lock fences; a
  plan branch that keeps the old lock code fails against the fences, so Step 5
  Doer runs need main merged first.
- **Cause:** main changed the identity scope (8 files: `docs/architecture-manifest.json`,
  `docs/platform/component-boundary.md`, new `docs/platform/holder-lock/spec.md` and
  `docs/platform/process/spec.md`, `docs/specs/{distribution,reading-map,runner}.md`,
  one install guide), which L11-3 would defer.
- **Options and costs:** defer per L11-3 (blocks Step 5 runs); merge now (native
  identity stays unsynced until the single closing carry already required by L11-2).
- **Recommendation:** merge now; this one case overrides L11-3's deferral.
- **Scope of answer:** this merge only; L11-3 stays the default for later merges.
- **Lead action:** merged; the one conflict in `docs/platform/component-boundary.md`
  is resolved keeping both sides (logged in `post-review-edits.md`); the two new
  `docs/platform/` specs join the Step 5/6 scope; all identity-scope changes ride the
  Step 9 native carry.
- **Affected rows/steps:** Steps 5, 6, 9.

### L11-16 — Bound the Step 5 remainder draw and keep the frame compact

- **Date:** 2026-10-17
- **Status:** decided (Lead under A42); owner approved the history rewrite ("ok làm tiếp")
- **What is happening:** the Step 5 author read "A36 seeded sample of the remainder"
  as 15% of all 22,454 `docs/platform` units (3,369 deep reads, full read above 3%)
  and committed the frame as 375 part files (about 18 MB).
- **Cause:** A36's 15% rule was written for conservation packs; applied to the whole
  corpus it becomes the full current-truth sweep L11-6 assigned to Phase 9.
- **Options and costs:** keep it (a whole-corpus truth sweep inside Phase 7 and 18 MB
  carried into main history); bound the draw and compact the frame.
- **Decision:** the remainder draw is a reviewer-seeded sensitivity sample of exactly
  60 units; more than 10% substantive candidate-content defects stops and escalates
  to the owner (as A37). Bounded statements and A34 bindings keep A36's 15%/3% rule.
  The frame is one file of sorted stable ids plus file digests, exclusions and a
  sorted-id digest; the reviewer recomputes membership from the extractor.
- **History:** the unpushed author commit was rewritten once (soft reset and
  recommit) so the 18 MB part files never enter branch history; author content is
  otherwise unchanged.
- **Affected rows/steps:** Step 5 review; L11-6 scope wording is unchanged.

### L11-17 — Settle the Step 5 review rework and rebinds

- **Date:** 2026-10-17
- **Status:** decided (Lead under A42; owner said go ahead)
- **What is happening:** the Step 5 review returned 142/143 ok; X-LOCK-05 was labelled
  `aligned` although its statement file, candidate `packaging-distribution/spec.md`,
  lacks the lock check/fix rows that main added only to legacy `docs/specs/distribution.md`.
  QF-01..13 and CONTROL-FRAME carried digests or paths from before L11-16.
- **Decision:** X-LOCK-05 becomes `deferred`: code evidence holds, but the candidate
  successor must gain the lock rows (P7-DOC-GAP-02) in the Step 9 closing carry of
  main imports; no candidate edit now. QF-01..13 rebind to the current
  `owner-answers.md` digest; CONTROL-FRAME repoints to `step-05-remainder-frame.json`.
  One bounded re-review checks exactly these rows.
- **Evidence:** `review-a38-step-05-bounded-part-02.md` R1/G1/G2;
  `review-a38-step-05-seed-and-rollup-01.md`.
- **Affected rows/steps:** X-LOCK-05, QF-01..13, CONTROL-FRAME; Steps 5 and 9.

## Resolved owner question — CTR010 (A45)

- **Question:** Which contract keeps CTR010, and which verified-free identity should
  the other contract receive?
- **Recommendation sent by the Lead:** Gateway keeps CTR010;
  `confinement-authority.v1` receives the next verified-free number; add the missing
  Gateway registry row.
- **Cost of recommendation:** the registered confinement contract and its
  rollout/history references must be updated and independently reviewed.
- **Alternative cost:** retaining CTR010 for confinement updates Gateway
  candidate/knowledge/YAML references and adds its registry row; deferral keeps Step
  3's collision rows and Step 9's zero-conflict verdict parked.
- **Scope of answer:** contract numbering and registry ownership only. Unrelated Phase
  7 work continues; Step 3's affected rows and Step 9 closure wait.
- **Dispatch fact:** Lead sent this question before Step 1 execution. Step 1 found no
  additional owner-only question; `owner-batch-01.md` records the complete five-part
  sent form.
- **Owner answer A45:** option A. Gateway REST `/v1` (`fgos-gateway.v1`) keeps CTR010;
  `confinement-authority.v1` takes verified-free CTR011; add the missing Gateway REST
  registry row. No code or shipped-contract change. Legacy `docs/architecture-map.md`
  waits for Phase 9 cutover.
- **Reason:** Gateway held CTR010 first on 2026-08-13 and the number is already present
  in the shipped OpenAPI, Gateway source, doc registry, end-user index and knowledge
  article.
- **Evidence:** owner answer A45; candidate Gateway OpenAPI; candidate architecture
  registry; the independent Steps 3-4 architecture review confirmed CTR011 unused.
- **Affected rows/steps:** S3-14, S3-15, X-DUP-01, X-CTR010-01; Steps 3, 6 and 9.

An L11 decision settles only its stated scope. It cannot authorize promotion, alias
adoption, retirement, deletion, cutover, main landing, push, locked-law change or the
remaining owner-only actions named above.

## Phase 7 owner queue

### P7-DOC-GAP-01 — Document the Work driver's confidence/category-to-action mapping

- **Status:** queued; not a contract-id gap.
- **Gap:** current code maps `runOutcome()` confidence/category and `satisfied` into
  Work/Workflow lifecycle action, but the policy is not explained in the runner
  documentation.
- **Expected owner:** runner specification owner.
- **Evidence:** S3-09; `src/runner/loop.mjs:1011-1030`;
  `src/workflow/runner.mjs:83-97,164-166`.
- **Boundary:** document the mapping in its owner document; do not mint another
  contract or imply the Run Result Evaluator mutates Work.

### P7-DOC-GAP-02 — Carry main's lock setup/doctor rows into the candidate distribution spec

- **Status:** routed to the Step 9 closing carry of main imports.
- **Gap:** main `0d6da9033` added lock check/fix rows (5g, 7, 7b) to legacy
  `docs/specs/distribution.md`; candidate `docs/platform/packaging-distribution/spec.md`
  does not carry them yet.
- **Evidence:** X-LOCK-05; `src/setup/registrations.mjs:2223-2258`;
  `src/setup/holder-lock-checks.mjs`.
- **Boundary:** documentation conservation only; no code change.
