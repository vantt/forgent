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
  `src/runner/loop.mjs:901-915,1538`; `src/workflow/runner.mjs:337,703`.
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

### L11-18 — Merge main again before the reader key is sealed

- **Date:** 2026-10-17
- **Status:** decided (Lead under A42; same trade-off the owner approved in L11-15)
- **What is happening:** main `741e6206b` changed the identity scope again (6 files):
  `AGENTS.md`, new candidate `docs/platform/event-store/spec.md`,
  `instruction-composition-and-projection.md`, legacy `docs/specs/distribution.md`,
  `docs/specs/platform-foundations.md` (laws L1–L8 become L1–L10) and `docs/specs/reading-map.md`.
- **Options and costs:** defer per L11-3 (Step 7 seals a key over a corpus that misses
  the event-store spec, and N2 forces a reader-staleness recheck after the Step 9
  merge); merge now (identity stays unsynced until the single Step 9 carry, as with L11-15).
- **Decision:** merge now, before Step 7 authoring. The `reading-map.md` conflict keeps
  the branch transition note and takes main's L1–L10 line. The event-store spec joins
  Step 7 navigation scope; all identity changes ride the Step 9 carry; L11-3 stays the
  default for later merges.
- **Affected rows/steps:** Steps 7, 8, 9; P7-DOC-GAP-03.

### L11-19 — Third main merge invalidates the seal; repair anchors and re-seal

- **Date:** 2026-10-17
- **Status:** decided (owner asked to keep up with main, then continue; Lead under A42)
- **What is happening:** main `eab4d617b` changed three of the eight sealed key files
  (`component-boundary.md`, `event-store/spec.md` +486/-, `holder-lock/spec.md`) after the
  2026-10-17T08:31:30Z seal. Merged cleanly at `dd9486292`. Three key anchors broke
  because sections were renumbered: holder-lock `#16-related-files` → `#21-related-files`,
  `#15-lịch-sử-quyết-định` → `#20-lịch-sử-quyết-định`, event-store
  `#23-proof-required-before-acceptance-of-the-implementation` → `#23-proof-gates`.
- **Decision:** the earlier seal is void (phase rule: a candidate change after sealing
  returns to Step 7). The Lead repaired the three anchors in the key, proof, key review
  part and the candidate `docs/platform/README.md` link (logged); all 41 key refs and all
  README anchor links pass the unchanged anchor checker. A fresh key reviewer must
  re-validate every answer against the changed specs and re-seal before any reader
  starts. Identity changes ride the Step 9 carry as in L11-15/L11-18.
- **Affected rows/steps:** Steps 7, 8, 9.

### L11-20 — Reconcile the candidate corpus with the signed Event Store decision

- **Date:** 2026-10-17
- **Status:** decided (Lead under A42)
- **What is happening:** the re-seal review (`review-a38-step-07-key-reseal-01.md`) found
  that main signed the Event Store design (D-ADR0055, superseding L3 clauses 1 and 4),
  while the key (B2, B4, B5, B6, B7), candidate `docs/platform/README.md` and candidate
  `platform-foundations.md` L3 still read it as an unsigned draft.
- **Decision:** carry main's verbatim D-ADR0055 supersession note into candidate
  `platform-foundations.md` L3 beside the unchanged original text (relative link
  adjusted) and annotate the L3 index row; rewrite the README event-store row as a signed
  design with implementation not started; rewrite the five key answers to the signed
  state. The candidate `component-boundary.md` holder-lock row (main-authored, "until the
  event store decision") stays as main wrote it: locks remain with the state store until
  implementation; its wording reconciliation joins P7-DOC-GAP-03 at Step 9. A fresh key
  reviewer re-validates and seals.
- **Affected rows/steps:** Steps 7, 8; P7-DOC-GAP-03.

### L11-21 — Account main imports at the close instead of stopping on them

- **Date:** 2026-10-18
- **Status:** decided (Lead under A42; owner: "em cứ điều phối để tiếp tục")
- **What is happening:** the N1 re-entry package (`879a4d5fe`) finished the native carry,
  rebind and a 7,250-entry request, but closing checks are red only on main imports:
  D has seven legacy-ratchet findings (six main-side edits to legacy specs whose
  exception digests predate the imports, one now-unused exception); strict E has 15
  findings (unknown-blocking files, registry gaps and rationale-less claims, largely from
  sources main authored after B0, such as the Event Store, Holder-lock and Process specs);
  the comparator has 347 mismatches; `npm test` could not start inside the sandboxed worker
  (EROFS on the user-level full-suite lock).
- **Decision:**
  1. Re-account `scripts/check-legacy-docs-ratchet.exceptions.json` for the main-side legacy
     edits exactly as the earlier main-import accounting commits did (`1c626c8aa`,
     `37f6f7499`, `c3f22d6a6`): digest, main commit list, rationale; remove or re-scope the
     unused exception. This is reviewed accounting data, not a gate or baseline edit.
  2. Account every other E/comparator finding with existing vocabulary where the
     precedent is mechanical. Units whose source was authored on main after B0 directly in
     `docs/platform/**` (Event Store, Holder-lock, Process and any other such files) and that
     have no Phase 6 transformation lineage become ONE declared Phase 9 carry category,
     "post-B0 main-authored platform sources", with their exact open sets listed; main keeps
     editing them until cutover, so Phase 9 accounts them against the final main bytes.
     Strict E may stay nonzero only for that declared set and the existing Phase 8/9 carries.
  3. The Lead runs `npm test` outside the sandboxed worker and records it.
  4. The 7,250-entry review runs after the checks are green or declared, sized per A36.
- **Affected rows/steps:** Step 9.

## A46 — Close Phase 7 on its own work; main-import accounting moves to Phase 9

- **Date:** 2026-10-18 · **Decided by:** owner (option B)
- **Question:** Step 9 accounting kept growing with main drift (strict E: 2,112 unexplained
  claims, 32 files, 233 gaps; comparator 24 errors; review 7,702 entries / 2,794 deep reads;
  main moved again by 18 identity-scope files).
- **Answer:** Phase 7 closes on its own work. Its closing review covers only the units
  Phase 7 changed and plan-owned accounting (`review-scope-step-09-phase7-own.json`:
  22 sets, 1,255 entries, deep-read minimum 272; mechanical auth still covers all parts).
  Every main-import accounting set (85 sets, 6,447 entries: imported/inherited-canonical
  units, decision and native-change rows, candidate lists, exclusions, gaps, aliases,
  global mismatches, the post-B0 main-authored sources) becomes ONE dedicated step at the
  start of Phase 9, run once against the final main bytes before cutover.
- **Closing criteria change (supersedes the L11-2 green-E/comparator requirement for these
  sets only):** D 0 fatal and the ratchet stay required; strict E and the comparator may be
  red only for the exact open sets recorded in `step-09-package-blocker.json` and this
  scope file; the rest of Step 9 (changed-row review, red-team/checkpoint, scorecard)
  still runs. Phase 7 close pin is main `eab4d617b`.

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
- **Evidence:** S3-09; `src/runner/loop.mjs:901-915,1538`;
  `src/workflow/runner.mjs:337,703`.
- **Boundary:** document the mapping in its owner document; do not mint another
  contract or imply the Run Result Evaluator mutates Work.

### P7-DOC-GAP-02 — Lock setup/doctor candidate conservation resolved

- **Status:** resolved in the candidate; bounded close re-review requested.
- **Evidence:** `docs/platform/packaging-distribution/spec.md:530-533` contains 5g/7/7b; `src/setup/registrations.mjs:2264-2302` registers checks/fixes; `src/setup/holder-lock-checks.mjs:174-223,445-464,519-557` implements them. Current hashes and probes: `step-09-close-pin-verification.json`, X-LOCK-05.
- **Boundary:** conservation only, no runtime or authority change.

### P7-DOC-GAP-03 — Carry main's new laws and instruction changes into candidates

- **Status:** routed to the Step 9 closing carry of main imports.
- **Gap:** main `741e6206b` raised the locked platform laws from L1–L8 to L1–L10 in legacy
  `docs/specs/platform-foundations.md` and changed `AGENTS.md`, legacy
  `docs/specs/distribution.md` and `instruction-composition-and-projection.md`; candidate
  successors (`docs/platform/platform-foundations.md` and the distribution/instruction
  candidates) must conserve these changes before cutover.
- **Boundary:** documentation conservation only; a law change is never edited in place
  by this plan; no code change.

### P7-DOC-GAP-04 — Reader findings narrowed to promotion work

- **Status:** Step 9 conservation resolved; remaining promotion issues deferred to Phase 9. No reader score changed.
- **Resolved evidence:** `docs/platform/holder-lock/spec.md:126-131` carries planned Event Store ranks 58/70; `docs/platform/component-boundary.md:85` carries the signed-design Event Store row; `holder-lock/spec.md:8,247` waits for implementation of D-ADR0055, not for its decision.
- **Still deferred:** candidate README Accepted versus Candidate/Draft headers; L10's verbatim L3 rule-4 reference and its D-ADR0055 supersession must be reconciled at promotion. Scorecard explicitly names both candidate inconsistencies.
- **Boundary:** documentation only; no law rewritten or authority promoted.

### P7-DOC-GAP-05 — Main's retired-name guard rejects carried source text in component-boundary

- **Status:** routed to Phase 9 as a pre-landing blocker (must be resolved before the plan
  branch lands on main).
- **Gap:** main's `test/runner/dead-vocabulary-guard.test.mjs` (gateway/plugin retired-name
  test, added by main `2636ba229`) scans `docs/platform/component-boundary.md` with no
  history exemption; the Phase 6 verbatim carriage sections "README source carriage" and
  "repo-layout-vision source carriage" quote retired names (lines 1293–1602), so the test
  fails on the plan branch only.
- **Expected fix:** at promotion, move the carriage sections out of the anchor into their own
  history/provenance file (rebinding their units), or retire them with the legacy sources;
  never rewrite verbatim carried text or weaken the guard.
- **Other suite failures at `879a4d5fe`** (fgctl stage contention, runner race timing,
  store CAS concurrency, missing `.claude/skills/instruction-audit` render) touch no plan
  path; the plan changes no `src/`, `packages/`, `apps/` or `bin/` byte versus `eab4d617b`.


### L11-22 — Close Phase 7 with the measured suite residual (closing red-team H1)

- **Decision (Lead, A42):** the `npm test` proof row is met by a measured set difference, not
  by a green run. Phase 7 closes with exactly one plan-caused failing test, the dead-vocabulary
  guard (P7-DOC-GAP-05, Phase 9 pre-landing blocker); every other failure is present at the
  main pin or is a demonstrated timing flake.
- **Evidence:** `step-09-close-suite-attribution.json`. The 21 test files failing in the full
  suite at `879a4d5fe` or `eab4d617b` were run serially at plan HEAD `c2409de08` (280 fail)
  and at main pin `eab4d617b` (288 fail). Failing only at HEAD: the dead-vocabulary guard, and
  "an agent herdr reports idle whose screen keeps changing is not ended as idle", which passed
  3/3 rerun alone at HEAD (no `src/` or `test/` byte differs from the main pin). The main pin's
  full suite (8,076 tests / 95 fail) shows the remaining failures are host/environment and
  pre-existing on main.
- **Why:** the plan changes no code; waiting for a green host suite would block on main-owned
  failures that Phase 7 cannot fix (RUL104: no gate edits).
- **Scope:** Phase 7 close only. Landing on main still requires the dead-vocabulary guard green.

### L11-23 — Correct main-checkout alignment and defer the main-authored header

- **Decision (Lead directions in closing brief, A42):** X-MAIN-01 and X-LOCK-04 become `doc-fix`, deferred to Phase 9 main-import header refresh. Main-checkout is already cut over; only hot-state implementation remains pending.
- **Reason/evidence:** `cd7ed1207` is an ancestor of `eab4d617b`; `src/runner/repo-locks.mjs:54-74` exposes `withMainCheckout`; `src/runner/main-checkout-lock.mjs` is deleted. The stale holder-lock header clause is identical on main. Refresh its main-door/worktree-admin wording in the Phase 9 import step, preserving the separate signed Event Store pending-implementation fact.
- **Scope/proof:** no candidate header edit; both rows re-pinned in `step-09-close-pin-verification.json`.

### L11-24 — Account every additional plan-owned data lane explicitly

- **Decision (Lead directions in closing brief, A42):** Check A uses the original Phase 7 allowlist ∪ the exact paths in `step-09-close-accounting-lanes.json`. This is an explicit accounting amendment, not a claim that the original allowlist already covered them. No allowed-paths file is edited.
- **Lanes and commits:** native registry persistence — `dbb86522a`, `879a4d5fe`, `681a86005`; all eight candidate-unverified lists — `dbb86522a`; citation baseline append — `2296413a2`; both reproduction manifests — `2296413a2`, `681a86005`; ratchet exceptions — `2296413a2`; retired-unit decisions — `dbb86522a`; Phase 6 allowed-paths widening — `2296413a2`. The JSON records every exact path and full commit id, including repeated touches (19 path/commit occurrences, 15 distinct paths).
- **Reason:** these are plan-owned accounting records written by first-parent non-merge commits. They must be visible in the close account; this does not authorize further edits to scripts/baselines or alter native checks. The Phase 8 consumer and Phase 9 cutover-note paths are also named exact lanes for the present closing brief.
- **Check I:** red only for the imported main delta: `docs/platform/holder-lock/spec.md`, `docs/platform/process/spec.md`, `docs/platform/session-identity/spec.md`. Frozen baseline remains unchanged; no frozen-I-green claim.
- **Evidence:** `step-09-close-accounting-lanes.json` and `step-09-close-checks.json`. Any path outside the union stops the close.

### L11-25 — Accept protected reading-map divergence and unpark

- **Decision (Lead directions in closing brief, A42):** PARK-PROTECTED-01 is closed as branch correct, divergence accepted and recorded; unpark it.
- **Reason/evidence:** `git diff eab4d617b HEAD -- docs/specs/reading-map.md` is +10/-2: the transition banner plus two compounding→knowledge fixes preserve correct branch navigation. Raw equality with main is false and is not asserted.
- **Scope:** no protected file edit. Phase 9 retains this navigation in its reviewed cutover merge. This is a named provenance exception to raw equality, not a general protected-path waiver.

### L11-26 — Refresh final evidence and repair the bounded Assignment citation

- **Decision (Lead directions in closing brief, A42):** re-pin Step 3/5 final authored bytes; correct S3-09/P7-DOC-GAP-01 and X-LOCK-05 citations. Resolve the latter's candidate-conservation gap. Repair Assignment line 69 to cite `dispatch/assignment.mjs:443-444,626-628`.
- **Reason/evidence:** these are the declared/inline provenance stamp sites; the old spans no longer show those stamps. `step-09-close-pin-verification.json` provides whole-file SHA and one-line probes per numeric span; `step-09-close-assignment-unit-delta.json` uses the unchanged production extractor and finds two affected units (Assignment heading and block 10), with 57/59 unit objects unchanged.
- **Target rebinding:** three existing decision targets are rebound to the two current extractor digests (`step-09-close-assignment-target-rebindings.json`), preserving source tuples and pending review. This repairs the three target-digest drifts causing the first 65/67 doc-test run; no native identity is assigned.
- **N1 boundary:** candidate fix must be runner-committed before native re-carry, D/E/comparator and independent review. They are not claimed here on stale HEAD. One bounded request is prepared and held until committed-byte package evidence exists. No approvals carry.

### L11-27 — Publish a draft scorecard with explicit close blockers

- **Decision (Lead directions in closing brief, A42):** `phase-07-scorecard.md` is a draft close account. Keep separate Lead-fill placeholders for H1 suite decision and H2 A46 ratification; point at existing L11-22 for H1 facts without rewriting its decision.
- **Reason:** the historical review and checkpoint evidence is useful now, but the candidate N1 repair and H2 answer prevent a passing close claim. Disclose stale key hashes/no fresh seal and the Accepted-versus-Candidate/Draft inconsistency.
- **Corrected H2 facts (no ratification):** 35 unknown files equal every `docs/platform/**` file changed since B0 `6f0f39ca1`: 6 main-touched, 29 plan-only; 2,436 claims, 233 gaps. Source: closing red-team H2, `step-09-runner-n1-open-sets.json`, and `step-09-package-blocker.json.correctedAttribution`. Owner answer and Lead record are pending; do not call the Phase 7 own work fully accounted.

Closing verification note for L11-26/L11-27: the first 65/67 doc-test run exposed three stale target digests, now rebound. The second run remains 65/67 because both historical reproduction `checks.mjs` reject the required working Phase 8/9 plan paths; ownership assertions pass and historical unaccountedPairs is empty. `step-09-close-doc-tests.json` and its logs retain both results. L11-24 current Check A accounts these exact paths; this does not rewrite the older checker or assert its green status. Next committed-byte package must account the runner commit through the approved reproduction-manifest data process.

### L11-28 — Accept the closing re-review and route two untouched stale code citations to Phase 9

- **Decision (Lead, A42):** the closing re-review cycle is complete: `review-a38-step-09-close-rework-02-part-0{1,2,3}.md` (108 ok / 2 rework, both fixed at `1b3302680` and `a97d954d0`) and `review-a38-step-09-close-rework-03.md` (50/50 ok). Two further stale code-line citations the -03 reviewer noted are recorded as **P7-DOC-GAP-06** and routed to the Phase 9 promotion truth check, not fixed now.
- **P7-DOC-GAP-06:** (a) `docs/platform/agent-coordination/contracts/assignment-run-runresult.md:31` cites `assignment-runner.mjs:431,560,574` for `provenance.kind` inline/declared/unit-run; real uses are near 368, 387, 500, 514, 1164. (b) `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md:60` cites `execution-contract.mjs:345-346` for budget; those lines are the `contract.role` check (`371-382` is correct).
- **Why:** both sit in text Phase 7 did not change; line drift from main code moves is pervasive in the candidate corpus, and L11-6/A28 keep the full operative-claim truth check at Phase 9 promotion. Fixing them now would open another carry and re-review cycle for citations outside Phase 7's changed set.
