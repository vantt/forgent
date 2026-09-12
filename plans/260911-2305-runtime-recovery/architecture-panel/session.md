# Session — architecture-advisory-panel--runtime-recovery

Case: independent architecture-advisory review of fgOS's runtime-recovery
detailed design package, per `plans/260911-2305-runtime-recovery/design-panel-prompt.md`.

Coordinator: this session (writerId `runtime-recovery-panel-coordinator`).

## Status

Phase 1 (Framing): **dispatched, in flight** (background task `bnkgy2nxe`).
`interpret-request` (lead-advisor-actor, claude-bwrap) and
`investigate-context` (context-investigator-actor, claude-bwrap/standard)
via `plans/260911-2305-runtime-recovery/architecture-panel/requests/phase1-framing.json`.

## Status log

- Phase 1 first attempt (op_001/op_002): **failed** — coordinator
  methodology bug (tee into an in-repo log file + a coordinator Write to
  session.md, both during a live read-only dispatch, tripped the real
  read-only-violation gate correctly). Not a design/panel content defect.
- Phase 1 retry (op_003/op_004, distinct taskKeys): **done/reported**, both
  genuinely settled. Transcribed to `interpretation.md`/`scout-report.md`.
  Context investigator found two real contradictions with file:line
  evidence (see scout-report.md): (a) S2's "name already runId-shaped"
  premise understates the gap — `runId` is never threaded into
  `herdr-round.mjs`'s agent-name construction at all; (b) S1's
  "reuse withEventsLock" claim is true only for the CoordinationSession
  path — the standalone Team-Dispatch-V1 path
  (`assignment-runner.mjs`) has NO admission lock/fencing today.
- Phase 4: zero decision requests sent (`decision-request.md`) — all 8
  lead-advisor ambiguities resolved from repo text or defaulted with a
  named carry-forward, per Scout Before Ask.
- **Structural finding, coordinator decision:** the case requires ≥3 named
  alternatives (baseline conservative / gateway-change / long-horizon
  writable-continuation) but the registered protocol's `phase-shaping`
  node only has two competing-proposal roles (system-shaper,
  alternative-shaper) plus the constraint advocate (which produces
  findings, not a candidate). Resolution: system-shaper -> "baseline
  conservative", alternative-shaper -> "gateway-change". The third
  ("long-horizon writable/continuation") will be produced via the
  protocol's own `answer-specialist-question` operation
  (`specialist-answer-slot`, driver-authorized) AFTER Phase 5 settles,
  authorized with persona `long-horizon-continuation-designer` — using the
  mechanism the protocol actually provides for a bounded on-demand
  question, rather than distorting an existing role into two jobs. This is
  not asked of the person: it is a protocol-roster mapping decision, fully
  resolvable from the registered graph.
- Independence rule for Phase 5: the two shapers do NOT receive the prior
  three-round review reports or design-audit-final.md/detailed-design-
  review.md (per A8 resolution, decision-request.md) — same 16-item
  reading list the context investigator used, plus interpretation.md/
  scout-report.md only.

## Phase 5 + specialist: done

Three independent Phase 5 dispatches (system-shaper/claude-opus,
alternative-shaper/agy-gemini, constraint-advocate/codex-gpt) all `done`,
transcribed to `proposals/*.md`. Plus one specialist dispatch
(codex-bwrap) for the third named alternative (long-horizon writable/
continuation), via `authorizeSpecialistSlot` + an `authorize` step +
`operation` step (two coordinator mistakes fixed live: missing
`protocolRef` on a resumed request; missing the `authorize` step for a
`driver-authorized` specialist operation — specialist-slot authorization
and operation-invocation authorization are two separate gates).

**Convergent finding across 4 independent dispatches** (scout,
system-shaper, constraint-advocate, specialist — 3 different provider
families total): the standalone Team-Dispatch-V1 path
(`assignment-runner.mjs`) has no admission fencing, and this is the real
blocking dependency under every later profile, not a
CoordinationSession-scoped nicety. See `proposals/specialist-long-horizon.md`'s
closing coordinator note.

System-shaper's proposal additionally self-corrected two of the scout's
own framings with new evidence (C1: one launch path with an optional
ledger above it, not two peer paths; C2: the runId-to-Herdr gap is a
one-expression fix, not new plumbing) — a healthy, real critique dynamic
already visible before Phase 6 even starts.

alternative-shaper's output (agy/gemini) is real but thinner (41 lines vs.
434/112) — not the known agy one-line-wrapper failure (content is
coherent, just less developed) — flagged for the critic.

## Phase 6 + Phase 7: done

Critique (agy/gemini-3.1-pro-high) and assess-constraints (codex/gpt-5.6-terra)
both `done`, transcribed. Critic self-verified C1 by directly reading
`runExecutorAttempt`, correctly identified alternative-shaper's
falsification criterion as theatre, and **corrected this coordinator's own
"4 independent sources" framing to "citation cascade"** — accepted and
fixed live in `proposals/specialist-long-horizon.md`. Constraint advocate's
second pass ranked the standalone admission gap as the single top HIGH
risk shared across all three candidates.

Synthesis (claude/opus) done, transcribed to `synthesis.md`. Recommends
baseline-conservative; gateway-change is the designated loser (does not
close the shared gap, unresolved HIGH Herdr-authority finding, contradicts
a locked baseline decision without contradicting evidence); long-horizon
treated as additive/values-choice, not a competing mechanism. Raises one
new escalation: whether dropping `generation` from S1 admission touches
one of the 15 locked baseline decisions — unresolved, named for the
person, not adopted in-panel.

## Red-team: blocked by host memory, not by design

Three consecutive dispatch attempts for `red-team-packet`
(red-team-actor, codex-bwrap/gpt-5.6-sol/critical) were killed by the
harness's own low-memory guard, not by a code/validation error — each got
past `authorize`, created a real Assignment/Run, and was killed mid-flight
after the executor CLI actually launched (confirmed via `run.json` stuck at
`status: "running"`, no `result.json`, no live process afterward — genuine
OOM kill each time, at rest the host reports ~11Gi available so the spike
is tied to this specific dispatch's launch, not sustained pressure).
Attempts 01/02/03 under `asgn_runtime_recovery_panel_coordinator_op_012`
are void (no settlement) and are left on disk, never reused — exactly the
"void attempt number, skip forever" rule the panel's own S1' proposal
names. `dispatch.claim` cleared after each kill per the engine's own
documented repair guidance (confirm no live process, then remove).
Stopped after 3 consecutive kills of the same operation rather than
looping further, per anti-loop discipline — this is a host resource
constraint, not a panel-process bug, and retrying blindly would keep
consuming host memory without a different outcome. State is clean and
resumable: attempt 04 will self-heal identically (no duplicate
authorization, same `authorizationId`/`invocationKey`) whenever the host
has headroom.

## Red-team: done (attempt 04, after 3 OOM kills on 01-03)

Verdict **REVISE** (codex/gpt-5.6-sol). Independently re-verified the
critic's C1 claim directly against source, verified Phase 5 isolation,
verified transcription fidelity, found no fabricated citation. **Caught a
real defect this coordinator introduced**: synthesis treated "does
`generation`/`incarnation` touch the 15 locked decisions" as unresolved,
but `design-panel-prompt.md`'s own baseline decision 4 answers it
verbatim — root cause was the synthesizer's reading list never including
the actual source brief, only a paraphrase. Corrected in `synthesis.md`
via an appended coordinator note (original synthesizer text preserved
unedited). This is now the one real product decision this panel surfaces:
does the person want `generation` retained per baseline decision 4, or
accept system-shaper's evidence-based departure? See `redteam.md` for
full findings.

Also confirmed: the specialist mechanism for the third alternative was a
real, available door but not strictly necessary (over-engineered relative
to a simpler shaper-brief change) — noted, not re-litigated.

## Phase 8: done. Session substantively complete.

Explanation (claude/opus) done — leads with consequence, names the one
real decision (generation/incarnation), does not flatten any unresolved
item, includes an honest "how much to trust this" section. All mandatory
outputs assembled in `final-recommendation.md` (contract table, phase
readiness matrix, simplicity audit, alternatives w/ designated loser,
final recommendation) — coordinator synthesis, no new dispatch needed
(no protocol operation produces these).

## Status: awaiting the person's answer (Phase 9 dialogue, if it comes)

Zero further decision requests beyond the generation/incarnation question
already surfaced. Phase 9 (`revise-synthesis`/`revise-explanation`/
`close-dialogue`) only dispatches if the person actually responds with a
real turn — per BOUNDS #6, no fabricated human input. Session stays open
at `post-explanation-open`.

## Roster (locked at intake, see intake.md)

lead-advisor/context-investigator/system-shaper/synthesizer -> claude-bwrap;
alternative-shaper/architecture-critic -> agy-bwrap; constraint-advocate/
red-team -> codex-bwrap. architecture-critic and red-team pinned to tier
`critical` (protocol declares `analytical` minTier for both; actor-level
override raises the floor, never lowers it).

`aggregateBounds`: wallTimeMs 86400000 (24h, per tsk-oed's known gap —
undocumented default is 1h and would starve a multi-phase session), 40
assignments, 30 rounds, concurrency 3.
