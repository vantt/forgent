Role: Lead Advisor
Author: claude-bwrap / claude / opus / critical
Dispatch: prompts/lead-advisor-interpretation.md -> runs/asgn_..._op_003/01
Reads: intake.md, design-panel-prompt.md (both in full); peeked at plan.md
header, reports/phase-00-baseline-260911.md header, plan directory listing,
repo git status only to calibrate the ratification question — did not read
detailed-design.md/phase-designs/* (context investigator's job).
Revision: v1
Written: 2026-09-11T17:12Z (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output: `.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_003/runs/01/agent-report.md`
(this file curates it; the run artifact is the primary record).

## Intent

Literal ask delegates entirely to design-panel-prompt.md [high]. Actual
goal: move the runtime-recovery track from DESIGN-GATED to "code-panel may
open for phase X" without the design's own author being the sole judge
[high — plan.md's own blocked-until-reviewed language + the prompt's final
required output]. Underlying worry, inferred from the unusually specific
"never build" ban list (RecoveryManager, checkpoint framework, health
store, effect ledger, implicit workspace authority): abstraction creep may
already be present or re-enter [medium]. Second worry, stated three times
across the prompt: a fresh agent with no chat history must be able to
execute the contract correctly [high].

## Vocabulary to adopt (their terms, not translated)

simple / experienced complexity (not sơ sài) · essential complexity ·
abstraction (pejorative) · contract (owner+inputs+outputs+unknown+
mutation+replay) · chỉnh shape · phase (two numberings: S0-S5 slices,
P00-P08 code-panel phases — S4↔P04+P05, S5↔P07, P06/P08 have no S-number)
· code-panel · chat history · baseline decisions · profile (writable
profile disabled by default) · authority/write door (CoordinationSession
+ Run only; Herdr/name/timestamp/PID are evidence, never authority) ·
park/safe park · gateway dependency · five readiness labels (exact
strings: READY FOR IMPLEMENTATION, READY WITH EXTERNAL DEPENDENCY, DESIGN
BLOCKED, DISABLED PROFILE, NOT APPLICABLE) · zero decision request ·
designated loser · residual risk / typed non-blocking residual.

Register: "Không" (do not) appears ~15 times; report findings in the same
negative register (what must not happen), not a praise register [high].

## Altitude

Ceiling: below service-rewrite, CoordinationSession stays session
authority [high]. Floor: above code — no code [high]. Core altitude:
component-authority + port-boundary inside Agent Coordination runtime
[high]. Second altitude: delivery-process — phase sequencing and per-phase
readiness, the decision with real consequence [high]. Product-bet altitude
mostly excluded but may leak at P06 writable / S5 continuation [medium].

## Constraints

Stated (all high, verbatim in the prompt): 15 baseline decisions
overturned only with direct contradicting evidence; no code, no silent
implementation while a contract is vague; no rewrite of Agent Coordination;
mandatory 15-item reading order, prose is not evidence until cross-checked;
five readiness labels exact strings (the operation brief said "four" — the
source prompt's five wins, corrected here); nine per-phase "must" checks;
seven mandatory outputs; conclusion rules (no generic approval, no vague
READY, no dependency disguised as local abstraction, no code-panel for an
unready phase); final deliverable executable by a fresh agent with no chat
history.

Implied: Node-first (S0-S4), Rust parity out of scope except as P08
residual [medium]. The alternatives list is prescribed by *kind*
(baseline conservative / gateway-change / long-horizon), not necessarily
including the current design as one of the three [medium — this is
Ambiguity 4 below, resolved with a named default before Phase 5]. The
final deliverable is likely a **revised design package** (edits/
supersession), not merely a review memo — "Đánh giá và hoàn thiện thiết
kế" + "design package mà một agent mới có thể... triển khai" [medium-high
— flagged, not resolved, for driver confirmation before any write scope
is exercised; this panel protocol has no write-to-PROJECT_ROOT capability
regardless, so any "hoàn thiện" output stays advisory-only per this
skill's own Bounds #2].

## Risk appetite

Near-zero tolerance [high, each named as "Không"]: silent production
behavior change; duplicate spawn/admission; identity by name/timestamp/
PID; hidden retry/close; new authority outside CoordinationSession/Run;
abstraction standing in for an absent capability; READY with a vague
crash path. Acceptable residual [high]: a named, typed, owned gap (READY
WITH EXTERNAL DEPENDENCY, DISABLED PROFILE, typed non-blocking residual).
Scope-growth appetite: near zero for new abstractions, non-zero for
contract-text additions [medium-high].

## Decision burden

(1) Deference-vs-independence tension: the 15 decisions came from the same
coordinator now running this panel [high, unresolved by design]. (2)
"Proof" for READY sits close to the no-code line — unclear whether
*designing* an acceptance test counts as code [medium]. (3) Phases are
coupled (S3/S4 may not advertise automatic recovery without S2's proof;
B04 blocks S2; B01 blocks S5) but the five labels have no "ready once
sibling phase lands" value [high that the gap exists]. (4) Reversibility
asymmetry: false READY costs committed code and review cycles; false
BLOCKED costs one more design round — the prompt explicitly prefers the
cheaper error [high]. (5) The whole package is one day old, uncommitted,
and can drift while being graded [high on fact]. (6) Escalation burden:
zero-decision-request preference pressures toward under-escalation
[medium]. (7) Speed-vs-thoroughness tension named but not resolved [low].

## Ratification check

Architecture layer (the 15 decisions): **declared ratification, legitimate
— not being reopened** [high]. Packaging layer (per-phase contracts,
ports, crash paths, proofs, readiness): **genuinely undecided** — a
five-label matrix and a 10-question audit requiring keep/simplify/move-
boundary/add-contract on every answer is not what a ratification-seeker
writes [high]. Is the person open to a baseline being overturned? Yes,
narrowly — surface with file/symbol evidence and let the person overturn
it; the panel never overturns in-panel [medium].

## Ambiguities handed to the context investigator / driver (A1-A8)

See "Coordinator Boundary Check — Scout Before Ask" section of session.md
for how each was resolved (asked now / defaulted / deferred to Phase 8-9)
before Phase 5 dispatch.

Not evaluated by this role, by charter: whether the design is actually
simple/hexagonal/SRP-clean, phase readiness, or which architecture is
right — those belong to the context investigator, shapers, critic, and
synthesizer.
