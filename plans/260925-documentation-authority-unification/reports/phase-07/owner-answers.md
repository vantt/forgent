# Phase 7 owner and Lead decisions

## Inherited owner answers

Owner answers A1-A44 remain authoritative in
[`../phase-06/owner-answers.md`](../phase-06/owner-answers.md). Phase 7 especially
inherits A28, A34, A36, A38, A42, A43 and A44.

- A44 closes Phase 6 and authorizes Phase 7.
- A42 delegates ordinary owner-routed choices for the remaining plan to the Lead.
- Main landing, push, Phase 9 cutover/legacy retirement, deletion, locked-law changes
  and stable/public contract renumbering remain owner-only.

The decisions below were supplied by the Lead in assignment
`unit-run-1792200236674-43960430/producer/1` as A42 applications. They repair the
independent red-team findings without authorizing promotion, cutover or retirement.

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

## Open owner question — CTR010 (sent)

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

An L11 decision settles only its stated scope. It cannot authorize promotion, alias
adoption, retirement, deletion, cutover, main landing, push, locked-law change or the
CTR010 renumbering that remains with the owner.
