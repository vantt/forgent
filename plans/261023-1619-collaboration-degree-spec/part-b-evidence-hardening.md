# Part B outline: milestone evidence hardening (separate backlog item)

Status: outline only, not a design and not approved. Split out of the collaboration-degree spec by the COOK lead (RUL104) after two red-team reviews. Part A (`spec-draft.md`) is independent of everything here: it changes no ledger fold, no guard, no consent payload and no workflow, so Part B can land later, or never, without leaving Part A broken.

Design source for all items: advisory packet rev.3, `.fgos/assignments/unit-run-1792741678364-45ec2060/producer/2/runs/01/outbox/report-1.md` (advice; the owner decided only Q1 = (a)). Findings: `reports/red-team-contracts.md` (C-F#) and `reports/red-team-assumptions-scope.md` (A-F#); rev.3 findings are named reviewer/red-team/tester F#.

Why one item: the pieces share one data model (a milestone's evidence) and one risk (re-judging cases already on disk). Splitting them again would leave a milestone accepted by two different rules.

## Items

| # | Item | What it has to settle | Finding sources |
|---|---|---|---|
| B1 | Evaluator-kind enforcement on every event path (`settle`, `step.complete`, `gate.answer`) **with ledger versioning and migration for running cases** | a milestone accepts only the evaluator kind its guard names; findings never achieve a guarded milestone. The rule must be versioned per workflow snapshot (a case pinned to an older workflow keeps today's fold) so existing ledgers and in-flight cases fold as before. Before any change: list which shipped playbooks and `domains/marketing` milestones rely on receiptless `step.complete`, and which core workflows would regress (not checked in this pass) | A-F1, A-F2; packet F3; rev.3 RR5 |
| B2 | Two guards on one milestone: the data model | today a milestone holds one digest and one receipt payload and `achieve()` overwrites it; consent first makes the milestone eligible with no verdict. Needs per-guard evidence slots, one digest to satisfy every guard, merge not replace, and the consumer-side switch in `case-admission.mjs` gaining a verdict case. Both orders (consent first, verdict first) need proofs | C-F1; packet F3, F8 |
| B3 | Settle-time digest restamp | the tested-subject digest is computed at settle (`case-admission-port.mjs`) and copied onto receipts, so a pass on one tree can vouch for another. The verify checkpoint must record the tested digest in its durable result and the adapter must read, not recompute. Closes the gap Part A states in its section 11 ("Not claimed": the receipt digest is still computed at settle) | C-F3; packet F1, F3 |
| B4 | Consent: `milestones`, `subjectRef`, digest | writer and drain carry milestones; the writer, not the caller, computes the digest; accepts only milestone ids that have a `human-consent` row; defines who may call it (owner door only); re-approval of a new digest when a workflow case has no `gate.park`. Must reconcile the existing stale-approval re-park path in `src/workflow/runner.mjs` (~448-457) | C-F8, A-F2; red-team F1 (rev.3); packet F3, F8; gaps G2, G3 of the earlier draft |
| B5 | Freshness for cases of a conductor-driven workflow | `readCase` supplies `currentDigests` for cases of a conductor-driven workflow; a locator for subjects whose workflow `subject` is prose; `current-digest-unknown` fails closed; no restamp. Owner of locator validation unresolved | A-F2; packet F3; unresolved question of C-reviewer |
| B6 | `reviewer-verdict` guard primitive | a seventh closed-catalog primitive: amends RUL-WF-7 ("Primitive thứ bảy là một dòng ý tưởng tính năng"), N10 and RUL-WF-19; admission refusal `verdict-seat-required`; also the Part A gap G2 (`verify-command-required` for a solo activity whose workflow requires a verify receipt) belongs with the admission work here | packet F3, F4; A-F2; Part A gap G2 |
| B7 | Q1 (a) assessor seat | owner chose option (a): one read-only, out-of-process assessor issuing a verdict. **The design is still advice**: role `assessor`, posture set, solo as the loop, author-independence where provenance exists, otherwise unsupported. Must define "provenance" and put the independence proof at the layer that sees `inputs` (not the seat resolver). Rewrite RT-6 and RR6 for a decision already made; do not label the design owner-approved | C-F4 (milestone binding), C-F10 (S17 layer), A-F9; red-team F4, F5 (rev.3); packet F9 |
| B8 | Coding-workflow restructure (F8) | split `plan-shaped` from `plan-validated`; `validate-plan` on `rfc`; declared units for `fix-verify-red`; `integrate` with a verify requirement; what milestone a light `review-item` verdict binds to (today `produces: []`); the two MUST rows on `plan-validated` and the in-flight effect (RR13: no `plan.md`-bound consent exists until the cutover, which blocks `implement-item` on in-flight coding cases); the correction of `workflow.md:428` (consent subject `plan.md`, not the decisions artifact) as a superseding decision | C-F4, A-F2; packet F8; red-team F5 consent subject; unresolved question 2 of C-reviewer |
| B9 | Admission enforcement of "a different pattern is a route deviation" (Part A gap G1) | admission compares the requested pattern with the activity unit and treats a difference as a recorded deviation | owner Q2 decision; Part A G1 |
| B10 | Hygiene: correct the skill text "let the config rule apply" (`route-table-pending.md`) and any test or fixture left naming `mutatingMinRigor`. The config key itself (`runner.patterns.defaultRule`) is retired by Part A's config conversion (spec-draft.md 13.1-13.2), which owns it | independent of B1-B9; may ship with Part A | packet F6 |

Part A (2026-10-24 revision) adds no admission code and no `port.admit` proposal field; B6 and B9 receive the admission checks `verify-command-required` and `verdict-seat-required` and the proposal fields they need (effective pattern name, loop, effective params, seat postures, verify checkpoint presence, verify command presence). The words *workflow*, *case*, *unit*, *pattern*, *loop*, *seat* and *run* in this file follow the Part A glossary (spec-draft.md section 2; D-ADR0073).

## Constraints inherited from the owner and Part A

- Domain-neutral: no coding assumption in the platform wording; the coding workflow is one consumer. Only one conductor-driven workflow ships today (`domains/coding/workflows/feature.yaml`), so non-coding fixtures stay test-local until another workflow exists (A-F8).
- No new ledger and no new event kind unless the owner approves one; additive payload fields still change what other projects fold and are not "free" (A-F7).
- "Light means fewer people or a different topology, never a weaker receipt than the milestone guard" (owner).
- Rules to apply when this is planned: L10 (move every consumer, delete the old path in the same change), design principles 1, 2, 7, 8, install/setup/doctor gate, CHANGELOG.

## Order the lead may choose (advice, not decided)

B10 can go first (no dependency). B1 and B2 are one change; B3 can go with them. B4 and B5 come after B2. B6 and B7 need B1 to be meaningful. B8 comes last because it is the consumer. B9 is optional.

## Open questions for the owner when this is picked up

1. Is Part B approved as a whole, or item by item?
2. Do the shipped playbooks rely on receiptless `step.complete` (B1 evidence still to be gathered)?
3. Accept that `plan-validated` cannot be achieved with consent on in-flight coding cases until the coding cutover (B8)?

No file outside this directory changes by writing this outline.
