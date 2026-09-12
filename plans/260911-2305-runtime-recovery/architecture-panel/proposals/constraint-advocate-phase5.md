Role: Constraint Advocate (Phase 5 — findings against the current package,
before any alternative proposal existed to attach to)
Author: codex-bwrap / openai-codex / gpt-5.6-terra / analytical
Dispatch: prompts/constraint-advocate-phase5.md -> runs/asgn_..._op_007/01
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_007/runs/01/agent-report.md`

Scope: the current `detailed-design.md` and `phase-designs/` package,
tested against the scout's confirmed source observations.

## Ranked findings

### 1. S1/P01 Run Admission and Fencing — the standalone Team-Dispatch-V1 path remains outside the claimed fence (HIGH, IRREVERSIBLE for effects)

`assignment-runner.mjs:810-827` selects the next attempt by directory
scan + `existsSync` + recursive `mkdirSync`, no admission lock, exclusive
publication, generation, or fence. Two concurrent `executeAssignment`
calls for one `assignmentId` can both admit and launch attempts.
`withEventsLock` protects the CoordinationSession event-store path; it
does not serialize this standalone directory path.

Magnitude: two or more concurrent invocations of the same standalone
Assignment can produce two live worker attempts and two externally-visible
effect attempts — not a rare migration window, it lasts for every
standalone invocation until that path uses the S1 admission door. Result
fencing can prevent one authoritative result but cannot undo a duplicated
provider call, prompt delivery, or worker-side write.

Reversibility: a code rollout is revertible; already-created Runs,
workers, and external effects are not reliably reversible after the fact.
This is the one concern that sinks an unqualified claim that "S1 closes
the concurrency gap." S1 is acceptable only if the capability is
explicitly scoped as CoordinationSession-only and P08 does not advertise
standalone no-duplicate admission/launch — a named residual, not a closed
gap.

Cheapest survivable mitigation: route standalone admission through the
same Assignment-scoped atomic admission/fencing boundary before creating
`runs/NN`, making the admission record — not directory existence — the
source of truth. One bounded writer-path change plus a two-process
concurrent-admission test; no new recovery subsystem.

### 2. S2/P02 Launch Reconciliation — `runId` does not reach the Herdr resource identity used by today's live dispatcher (HIGH, IRREVERSIBLE for duplicate work)

The S2 brief treats deterministic naming as a lookup aid and says legacy
dispatch without Run identity keeps its existing naming path. The scout
confirmed the currently dispatched Herdr path DOES have a deterministic
runner `runId` (`assignment-runner.mjs:852`), but it is not passed through
the dispatch/transport call chain to `runHerdrRound` —
`herdr-round.mjs:654` derives `agentName` from `workId` + `Date.now()`.

Magnitude: every current Herdr-backed standalone Run is affected — after a
crash between create and locator persistence, the recovery layer has no
durable Run identity to find that worker. It must park, or risks a
duplicate create if any caller treats a missing timestamp-name lookup as
absence. This blocks the S2 F-b/F-f promises for the path that calls
Herdr today — not a cosmetic naming discrepancy.

Reversibility: the missing wire is code-revertible; an orphaned worker or
duplicate delivery created during the gap is not. Gateway `absent-proven`
remains a separate external dependency; this finding is prior to it.

Cheapest survivable mitigation: add the `runId` handoff from
`executeAssignment` through transport into `runHerdrRound`, persist it in
the launch intent, construct the lookup aid from it. Until that wire and
the gateway probe exist, leave replacement create blocked and expose only
reattach/observe/park.

### 3. S1/S2 migration boundary — no executable rollout split for existing schema-1 and standalone records (MEDIUM, conditionally IRREVERSIBLE)

The accepted contract requires v2 only for new schema-2 sessions,
quiescence + validated mapping for schema-1 upgrades, legacy Runs retain
their existing profile. The phase pack has S1's "schema-1 callers stay
behavior-compatible," S2's legacy naming exception, and P08's generic
"migration" — but no owned decision classifying existing
CoordinationSession records versus existing standalone `runs/NN`
directories.

Magnitude: two durable formats and two runtime paths must coexist during
rollout. Without an explicit profile gate, a recovery attempt may
interpret a legacy locator/directory as a v2 admission or launch fact —
exactly where the contract forbids directory presence from deciding
admission. Affected population: every pre-rollout resumable Run; no count
evidenced.

Reversibility: rollback works only while old readers still understand
newly emitted records. A partial on-disk rewrite or a v2 event treated as
v1 truth is not safely reversible by deletion — it may discard recovery
evidence.

Cheapest survivable mitigation: first rollout new-profile-only, fail
closed on legacy recovery, fixtures proving legacy records read under
their old semantics rather than migrated on read. A profile-selection and
compatibility-fixture decision, not a data backfill.

## Concerns considered and not raised

- **Writable takeover (P06): not raised** — disabled by default, explicit
  grant/quiescence gate, not required for read-only recovery; residual
  already capability-gated.
- **Terminal transfer (S5/P07): not raised** — first profile refuses it,
  pending contract amendment; cannot create an enabled migration hazard in
  the current profile.
- **S3 repeat/effect policy: not raised as a separate blocker** — parks
  unknown delivery, network-allow, undeclared sinks; its practical
  dependency on S2 is already captured by finding 2.
- **S4 evaluator extraction: not raised** — the scout found only that a
  `legalNext`-shaped helper wasn't confirmed in the inspected portion of
  `session-engine.mjs`; insufficient evidence of an operational/migration
  failure.
- **Gateway `absent-proven` availability: not raised separately** — the S2
  package names it as an external dependency and safely parks without it;
  the unmentioned `runId` plumbing (finding 2) is the distinct current-
  package defect.
