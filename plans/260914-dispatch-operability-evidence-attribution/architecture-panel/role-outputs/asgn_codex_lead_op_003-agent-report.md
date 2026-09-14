# System-shaper READY candidate — D00–D06 Dispatch Operability design

## Recommendation

Accept the current D00–D06 design package as **READY for a separate implementation-planning track**, not as shipped behavior and not as authorization to edit runtime code. This is the strongest supportable verdict because the package closes the architectural ambiguities exposed by all 20 normalized incidents while explicitly constraining the new surface area and the proof needed before anything may be called implemented.

The package already records this exact boundary in the canonical runner spec and Assignment/Run/RunResult contract: it is planned, not shipped. The promotion manifest and implementation handoff preserve the same distinction.

## Load-bearing constraint

**One Run has exactly one immutable terminal truth: `RunResult`; everything else is either mutable observation, untrusted input, transport wrapping, or separately authorized repair.**

This constraint is load-bearing because it prevents all adjacent concerns from silently becoming another outcome or recovery authority:

- `RunObservation` can expose incomplete, live, ambiguous, or corrupt facts but cannot settle, retry, cancel, authorize, or clear a guard.
- `ProviderOutcome` is only a host-invocation wrapper.
- `agent-result-claim.v2` is worker input to the normalizer, never independent proof or the result itself.
- `dispatch.runtime.inspect` uses read ports only and may give a non-authorizing recovery hint; it cannot recover.
- `dispatch.runtime.reconcile` only reconciles truth already proven under CAS; it cannot decide a Run’s next semantic action.

That partition is what makes deterministic historical interpretation, safe inspection, causal humility, and narrow stale-guard repair coexist without a second terminal or mutation authority.

## Evidence supporting READY

| Evidence | What it establishes |
|---|---|
| D00 incident matrix | All 20 source incidents have one primary disposition; counts reconcile to 20, with external causes and deferrals not misrepresented as fgOS-owned prevention. |
| D01 contract | Defines sole terminal authority, v2 dimensions, corruption behavior, and byte-preserving deterministic `legacy-derived` v1 interpretation. |
| D02 design | Defines exactly-one-selector inspection, collect-before-decide resolution, typed ambiguity/conflict, and structural read-only dependency direction. |
| D03 design | Separates observation, attribution, and policy; Git snapshots can correlate but cannot prove authorship. |
| D04 design | Limits writes to proven-stale guard/projection repair with profile-gated proof, CAS, idempotency, and explicit refusals. |
| D05 design | Prevents prompt/validator drift through one claim source; requires a secret-free effective contract before launch and end-to-end production-door proof. |
| D06 review package, standalone review, red-team, and ledger | No HIGH or MEDIUM finding remained; the only process caveat—an external panel waived by user override—is disclosed rather than fabricated. |
| Canonical promotion | `docs/specs/runner.md`, the Assignment/Run/RunResult contract, and the reading map label the package planned/READY and not shipped. |

The design also meets the track exit criteria on paper: common glossary/authority model, symmetric positive and negative capabilities, explicit compatibility/corruption/concurrency behavior, traceability, a promotion manifest, and a separate implementation handoff. `git diff --check` passed when assessed; the current worktree has an unrelated untracked `architecture-panel/` directory, so it is not evidence of a runtime implementation.

## Costs and what the design makes harder

The chosen safety boundary intentionally makes several operational shortcuts harder:

- Operators cannot use a convenient universal `fgos recover <subject>` or have inspection automatically invoke recovery.
- A stale lock cannot be cleared merely because its TTL elapsed, a PID is missing once, or truncated process output looks quiet; some adapter profiles must return `unsupported`, `blocked`, or `needs-input`.
- A completed worker claim cannot by itself establish success, and a policy refusal cannot simplify the record by deleting execution evidence or review findings.
- Ambiguous duplicate IDs, multiple current Runs, corrupt admission facts, and partial liveness evidence produce typed uncertainty rather than a first-match answer.
- Implementation must carry data through config/Assignment → DispatchPlan → confinement → selected adapter → claim/provider result → normalizer → persistence → inspect. Pure evaluator or schema tests cannot close a capability.

These are real product costs—more explicit operator handoff and a wider integration-test burden—but they are the cost of avoiding unsafe recovery and false attribution.

## First reversible implementation step

Create a **separate implementation-planning track** whose first code slice defines the single source for `agent-result-claim.v2` and derives both worker prompt text and validation from it, with valid/invalid contract fixtures. Do not change settlement, recovery, or public command behavior in that first slice.

It is reversible because it adds a bounded contract compiler and tests before it becomes a launch-path or terminal-result writer. The slice must still treat the claim as untrusted input and must not claim that the effective execution contract, RunResult v2, inspection, reconciliation, or production-door proof already exists.

## Evidence versus assumption

**Evidence available now** is design and review evidence: the incident report’s normalized observations; committed D00–D05 design artifacts; D06 review/red-team/ledger; and canonical docs explicitly saying the capability is planned and unshipped.

**Assumptions that remain to be tested in a new track** are implementation assumptions, not completed facts:

- Existing adapter/confinement profiles can expose sufficiently reliable, coverage-scoped resource-incarnation evidence for every reconcile action advertised as supported.
- A single claim source can actually drive both prompt rendering and validation across all selected adapters without drift.
- An effective contract can be persisted before launch, redacted correctly, and preserved through the real persistence and inspect paths.
- Current repositories and Coordination ownership metadata can resolve every selector deterministically or refuse safely in real mixed historical data.
- The whole production door can preserve every required field and negative boundary under real launched dispatches.

The package does not mistake these assumptions for proof; D05 expressly makes production-door evidence the implementation exit condition.

## Falsification criteria

Reject or reopen the READY verdict if any of the following is true when implementation planning begins or during its evidence work:

1. A real consumer requires `ProviderOutcome`, a worker claim, an observation, or a new `DispatchOutcome` to settle or override a Run independently of immutable `RunResult`.
2. A viable `dispatch.runtime.inspect` implementation needs to import/call launch, recovery apply, process control, or Git mutation code—or host routing must interpret selector identity/authority.
3. Historical v1 data cannot be projected deterministically and byte-preservingly, or a v2 compatibility disagreement cannot fail closed as `contract-corrupt`.
4. Any proposed reconciliation action cannot prove unique identity plus dead/absent state and full CAS preconditions for its adapter profile, yet would be needed for normal operation. It must remain unsupported; if that makes the capability inadequate, reopen the design.
5. A CAS race, successor PID/guard reuse, late result, or repeated apply can produce duplicate mutation or erase a valid live guard.
6. Pre/post Git snapshots, timing, or a worker claim can be elevated to `proven` without a positive adapter/confinement coverage declaration.
7. Policy refusal erases the completed execution, artifacts, or substantive assessment, or a reviewer finding is represented as a provider crash.
8. Any committed capability can only be evidenced by a direct unit test; no selected-adapter-to-persistence-to-inspection production-door fixture can falsify field loss or forbidden recovery wiring.
9. The panel-waiver caveat is no longer acceptable to the accepting authority; the remedy is an independent panel/review replay, not a claim that one already occurred.

## Verdict

**READY candidate: accept**, subject to the above falsifiers and the explicit process caveat that D06 used inline Codex review after a user-authorized waiver of external panel dispatch. The acceptance authorizes only a new, evidence-led implementation plan. No implementation is claimed by this report.
