# Lead-Advisor Interpretation — D06 Review and Promotion

## Scope of this report

This is an interpretation of the decision burden for the supplemental D06
architecture panel. It does not select, alter, or recommend an architecture.
It distinguishes design readiness from implementation authority and identifies
the evidence conditions under which the eventual panel may honestly issue
`READY` or must issue `NOT READY`.

## Decision burden

The panel is not being asked whether the design is attractive in the abstract.
It must decide whether the accepted D00-D05 package and its D06 promotion are
coherent, complete, evidence-backed, and process-valid enough to become the
input to a *separate* implementation plan.

That burden has four parts:

1. **Substantive architecture integrity.** Test DOEA-01 through DOEA-13 against
   source/contract evidence, especially the single terminal truth, read-only
   inspection, bounded CAS reconciliation, attribution strength, historical
   compatibility/corruption behavior, production-door proof, component
   ownership, and symmetric negative capabilities. The review may falsify a
   track decision with evidence, but may not reopen one from preference alone
   (`architecture-decision-lock.md`, lines 6-24).
2. **Coverage and traceability.** Determine whether the mandatory D06 questions
   are actually answered, every incident and material claim is traceable, all
   findings have an allowed disposition, and accepted findings received both
   required rechecks (`phase-06-cross-design-review-promotion.md`, lines 27-49,
   74-79).
3. **Review-process validity.** Establish durable evidence of the registered
   architecture panel, its role outputs, dissent, confidence, replay/trace, and
   independent Reviewer and Red-Team work. These are express required outputs,
   not optional polish (`phase-06-cross-design-review-promotion.md`, lines
   29-34, 51-58).
4. **Promotion and handoff validity.** Confirm that current canonical targets
   were re-read, collision checks were real, only accepted facts were promoted,
   all runtime behavior remains labelled planned, and the handoff clearly
   separates designed, not implemented, deferred, and unknown states
   (`phase-06-cross-design-review-promotion.md`, lines 36-38, 60-66, 74-79).

The final decision is binary. A caveated `READY` cannot be used to bypass a
failed acceptance condition; caveats may describe residual risk only after the
gate itself is met.

## Meaning of READY

Here, `READY` means only: the design is precise and sufficiently evidenced to
create a new implementation track (`plan.md`, lines 160-165). It does **not**
mean that `dispatch.runtime.inspect`, `dispatch.runtime.reconcile`, RunResult
v2, evidence attribution, or any other runtime behavior exists or ships. It
does not authorize source mutation in this design track
(`architecture-decision-lock.md`, lines 46-48; `promotion-manifest.md`, lines
3-18; `implementation-handoff.md`, lines 3-17).

An evidence-valid `READY` therefore requires all of the following together:

- one consistent glossary and authority model, with no second terminal Run
  truth or hidden semantic-recovery/mutation path;
- explicit, testable compatibility, identity, ambiguity, corruption,
  concurrency/CAS, liveness-coverage, attribution, and negative-capability
  behavior;
- production proof defined through the selected adapter and persistence path,
  not merely direct unit/evaluator calls;
- complete traceability and an allowed disposition for every finding, with no
  unresolved HIGH and with the required rechecks for accepted findings;
- durable registered-panel and independent-review evidence, including dissent
  and confidence rather than only conclusions;
- conflict-aware canonical promotion that says planned/proposed, plus a
  design-only implementation handoff; and
- no unresolved human product decision and no proposed change to a locked
  platform law.

## Meaning of NOT READY

`NOT READY` means that one or more of those design or evidence gates is not
met. It is not a claim that the whole direction is wrong, nor a demand to begin
implementation. It prevents this package from being treated as settled input
to an implementation plan until the named deficit is resolved.

Conditions that force `NOT READY` include:

- direct evidence of a second terminal or mutation authority, an inspect-to-
  recover backdoor, unsupported reconciliation presented as supported, or
  causal attribution stronger than its evidence;
- unresolved ambiguity in identity, compatibility, corruption, concurrency,
  liveness coverage, negative capabilities, or the production proof path;
- any unresolved HIGH finding, a HIGH deferred without owner and trigger,
  broken traceability, or an accepted finding without the required independent
  rechecks;
- a genuinely new product choice or a proposed locked-law change that has not
  been decided by the person holding that authority;
- absence of the required panel/reviewer/red-team provenance or independence;
- canonical promotion that overwrites concurrent work, omits required target
  evaluation, or presents planned behavior as shipped; or
- an internally contradictory readiness/closeout record that leaves a stranger
  unable to determine which state is authoritative.

## Codex-only override and its limitation

The supplemental panel request explicitly binds **every static actor** to the
Codex executor. That is an executor/provider constraint, not a waiver of the
registered architecture-advisory-panel protocol, its distinct roles, its
visibility windows, its replay, or the separate Reviewer and Red-Team duties.
All actors may be Codex-only while still being separate protocol actors.

The limitation must be recorded honestly: the panel has role/process diversity
but no provider-family diversity. Correlated model priors and correlated blind
spots therefore remain more likely than in a cross-provider panel. This limits
confidence; by itself it need not invalidate the panel because it is the
explicit user constraint. What would invalidate the evidence is collapsing
Codex-only into a single inline actor while still claiming that the required
multi-role or independent review occurred.

This differs materially from the existing D06 record. The review packet treats
the earlier instruction as a waiver of the panel and says no external agent
dispatch occurred (`reviews/d06-review-packet.md`, lines 19-30, 42-47). The
decision lock and closeout repeat that interpretation
(`architecture-decision-lock.md`, lines 39-44; `reports/track-closeout.md`,
lines 4-7). The current supplemental request instead runs the registered panel
with Codex-bound actors. The final synthesis must state whether the supplemental
panel supersedes/remedies the earlier process caveat; it must not silently
equate “all actors are Codex” with “there is only one actor.”

## Material ambiguities and evidence gaps for the panel to resolve

1. **Override scope.** The quoted earlier instruction is recorded as waiving
   the panel, while the current authoritative supplemental request constrains
   actor provider choice and expressly calls for a panel. The old waiver claim
   and the new Codex-only panel must be reconciled in the final evidence chain.
2. **Independence/provenance.** The current standalone review and red-team files
   contain conclusions but no session/replay references, actor provenance,
   visibility evidence, or evidence that they were independent
   (`reviews/d06-standalone-review.md`; `reviews/d06-red-team.md`). Recording the
   missing panel as LOW (SR-2) does not itself satisfy the original required
   panel evidence.
3. **Recheck semantics.** Both ledger findings are marked accepted, but the
   ledger records a single prose “Recheck” result rather than evidence of the
   two required rechecks (`reviews/d06-finding-ledger.md`, lines 3-8 versus the
   phase brief at lines 32-34).
4. **Promotion coverage.** The phase says the host operation catalog and
   operator/CLI docs must at least be evaluated. The manifest names only the
   RunResult contract, runner spec, and reading map, and gives no explicit
   no-change disposition for the other mandatory evaluation targets
   (`promotion-manifest.md`, lines 6-10; phase brief, lines 60-66). Whether they
   were evaluated is not evidenced by the listed artifacts.
5. **Closeout state.** The repository HEAD is the D06 promotion merge, yet
   `plan.md` still says “READY TO RUN D00-D06” and lists D06 as pending
   (`plan.md`, lines 9, 167-177); the closeout also says the D06 commit/merge is
   pending (`reports/track-closeout.md`, lines 9-19). This conflicts with the
   decision lock and promotion manifest already declaring `READY`.
6. **Decision-authority terminology.** DOEA-01..13 are called candidate
   decisions and a design lock, while the manifest says they are track-local
   labels, not platform-wide ADRs (`promotion-manifest.md`, lines 20-24). The
   panel should preserve that distinction: challenging a DOEA row requires
   evidence, but it is not automatically a request to supersede an L1-L8 locked
   platform law.
7. **Claim packet depth.** The packet lists seven affirmative claims and several
   rejected attacks, but does not itself enumerate unknowns, the full negative-
   capability set, or actual contrary source evidence as requested by the phase
   brief. Other panel roles may supply that evidence; the current packet alone
   does not demonstrate it.

## Product-decision and locked-law boundary

The listed artifacts assert that no new product decision or locked-law change
was required (`reviews/d06-finding-ledger.md`, lines 8-9), and no explicit
proposal to change an L1-L8 platform law appears in them. The current decision
burden therefore does not automatically require a human product choice.

That assertion remains falsifiable. A human decision becomes necessary if the
panel finds that readiness depends on changing committed scope (for example,
adding a recovery door or a new component), choosing among materially different
consumer-visible semantics, or superseding a locked platform law. Evidence that
merely shows a DOEA row is internally inconsistent can produce a readiness
finding; preference for a different design cannot reopen it. Any such human
decision must be surfaced as unresolved, not guessed inside the panel.

## Lead-advisor handoff

The downstream panel should treat the present `READY` as the claim under review,
not as a premise. It should evaluate substantive design integrity and process
evidence separately, explicitly disclose the single-provider limitation, and
use the exact binary meanings above. This report intentionally makes no design
recommendation and issues no final D06 verdict.
