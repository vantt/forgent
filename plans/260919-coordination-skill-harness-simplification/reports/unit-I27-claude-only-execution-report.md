# Unit I27 — Claude-only parallel execution report (Lead side)

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I27`,
worktree `.claude/worktrees/coordination-skill-harness-i27-panel-depth-experiment`,
base `main@efda3dce8`, integrated `main@1abad5857511`.

This is the Lead's own execution/verification log for Unit I27. The unit's
own primary deliverable — the experiment write-up itself — is
`reports/unit-I27-panel-depth-experiment-real-comparison-report.md`, written
by the implementer; this report covers Lead's process, decisions, and
independent verification, mirroring the I28/I29 report convention.

## Scope

Phase 5 Exit criterion: build `architecture-advisory-panel-standard-v1.yaml`
(drops `phase-redteam` and its actor/role/operation, re-gates explanation
directly on `post-synthesis-open`), register it, and run a real, blind-scored
comparison against the full protocol on real cases — not a synthetic/fake-
executor measurement. File-disjoint from Phase 6 (I28/I29), run in parallel
per the user's own confirmed decision.

## Decomposition review (before any implementation)

An independent decomposition review (`review-decompose-i27`) found 3 HIGH
findings in the original draft: an unpaired-session design that couldn't
isolate the one variable being tested; no scorer/blinding methodology at
all; no pre-flight/resume-safety discipline for real spend. Rewritten before
dispatch with: a paired design (same upstream chain, vary only the final
step); a scoring-methodology decision (rubric committed before any real
call, blind cross-provider scoring, mechanical dissent-retention checklist,
factual-error only against verified ground truth); a real-executor
cost/safety discipline (smoke → canary → batch sequencing, fixed
`coordinationId`s recorded in a manifest, serial execution, quiescent
worktree).

## Real-cost execution — a long, incident-dense unit

This unit involved 29 real LLM-backed dispatches and ~81 minutes of
cumulative model wall time, and surfaced more real process/infrastructure
incidents than any other unit in this track. Each was caught, root-caused,
and disclosed — none silently absorbed:

1. **False-failure from concurrent worktree writes** (twice, different
   sessions) — same class as `tsk-3yo`. Resolved by never touching a
   dispatch worktree's files while a real dispatch is in flight; one
   instance was Lead's own mistake (dispatching a rubric-writer without
   checking implementer's live-dispatch status first — acknowledged and
   recorded).
2. **Corpus-contamination risk from bwrap confinement's whole-host
   read-only mount.** Lead's first proposed fix (a disposable worktree)
   was independently verified WRONG by the implementer reading
   `src/runner/dispatch/confinement/drivers/bwrap.mjs:356` directly
   (`--ro-bind '/' '/'` — confinement gates writes, not reads). Lead
   confirmed this directly before superseding the fix with risk-reduction
   (tight, self-sufficient objectives; reveal-content committed only after
   the corresponding withheld probe has run) rather than a false hard
   guarantee.
3. **Rubric-ordering violation, self-reported before scoring.** The
   implementer dispatched real sessions before the rubric existed,
   violating the locked "committed before first real call" requirement.
   Lead's ruling: irreversible, but mitigated by dispatching a completely
   fresh, unexposed agent to operationalize the rubric strictly from the
   pre-locked spec text — never re-spending the whole batch for a rigor
   fix. Lead read the resulting rubric (`scoring-rubric.md`, SHA
   `7421a5e612984082713defd3e3fe43946f42c39e`) in full before approving;
   it is genuinely mechanical, adds no dimension beyond the locked spec,
   and its one interpretive call (narrowing "decision-quality" to
   PRESENT-finding disposition) is the correct conservative reading.
4. **Two real infra failures**: a dead `codex` OAuth refresh token (worked
   around with a distinct-provider fallback, same `coordinationId`, kept
   the resulting real `INSUFFICIENT-EVIDENCE` verdict as honest evidence
   rather than re-spending for a cleaner result); `claude` account session
   quota exhaustion mid-standalone-session (accepted as a documented
   partial — see below).
5. **A real `coordination show`/close cwd-resolution bug** in linked
   worktrees, found and worked around (`--dir` must point at the dispatch's
   own worktree explicitly), filed as a gap not fixed (out of I27's
   file-ownership scope).

## Two open items, both resolved by explicit decision, not left ambiguous

- **Standalone standard-protocol session: accepted as PARTIAL.** 7 of
  ~10 real ops done (interpret, investigate, 3 shapers, critique, assess)
  before `claude` quota exhaustion blocked synthesis/explain/close. Lead's
  ruling: this session's sole purpose — proving the FlowDefinition
  dispatches through the real production door — is already discharged by
  7 ops across 5 phases/actors; waiting for an unknown-length quota reset
  or switching provider mid-run (contaminating the "as actually deployed"
  reading) both cost more than the marginal proof value justifies. The
  actual paired-comparison measurement does not depend on this session.
- **Human spot-check: declined by the user.** Asked directly via
  `AskUserQuestion` once the blinded packet actually existed (not before —
  premature to ask about a dependency that wasn't yet real). User chose to
  skip it and record it as a known limitation. Documented plainly in the
  final report, not silently dropped; does not invalidate the scorer's own
  marks, only the independent second-rater cross-check is missing.

## Lead independent verification before merge

- Read the full scoring rubric before approving (not rubber-stamped).
- Read the final comparison report in full.
- Directly recounted case-3's raw `scorer-marks.md` CX/CY PRESENT marks
  (12/19 and 3/19) against the report's own summary table — exact match,
  confirming the reported numbers trace to real, inspectable data rather
  than being asserted.
- Confirmed `unblinding-key.md`'s commit history: it appears only in
  `1a02b8cbd`, strictly after the scorer-marks commit `9c411dc16` — correct
  ordering per the rubric's own requirement.
- Confirmed the redaction self-check's own record shows genuine iteration
  (3 real leaks found and fixed on the first pass, clean on the second),
  not a single-pass rubber-stamp.
- Confirmed the provider check's reasoning (`xai` legal as blind scorer
  despite also serving as case-3's red-team fallback, since the rubric
  excludes only synthesizer/lead-advisor providers) is correct per the
  rubric's own text.
- Ran the full suite myself independently: 7945 tests, 7872 pass, 0 fail —
  exact match with the implementer's own reported numbers.

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I27` from the main
checkout onto post-I29 main, `ort` strategy — auto-merged both copies of
`group-thinking-trigger-surface.md` cleanly, no conflicts.
`integratedSha = 1abad5857511cec1302b092208202ead8a303acb`. Reran the 4 key
suites on the merged tree: 46/46 pass.

## Phase 5 status

Phase 5's panel-depth Exit criterion is now closed. The other 2 previously-
deferred items ("architecture-panel skill within budget" — closed earlier
this track; "≥60% Lead instruction-token reduction" — remains explicitly
deferred, not measured, non-blocking) are unchanged by this unit.

## Process notes

- This unit is the clearest demonstration in this track of the difference
  between a self-report and independent verification: nearly every
  significant finding in this unit (the confinement read-boundary, the
  rubric-ordering violation, the cwd-resolution bug) was surfaced by the
  implementer proactively, not hidden — but each was still independently
  re-verified by Lead (reading the actual source line, recounting the
  actual marks, checking actual commit ordering) before being accepted,
  consistent with this track's standing discipline that self-reports are
  data, not proof.
- The rubric-ordering incident and its mitigation is worth a general
  lesson for any future real-cost experimental unit: the "write it first"
  ordering exists specifically to prevent the person who saw the data from
  shaping the measurement instrument — when that ordering is violated, the
  correct fix is a person/agent with genuinely zero exposure operationalizing
  the pre-existing locked spec, not simply asking the original dispatcher to
  "be careful" going forward.
