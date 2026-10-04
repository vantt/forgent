---
title: "Role inputs reach the next role (panel synthesizer fix)"
status: pending
priority: P1
created: 2026-10-04
---

# Role inputs reach the next role

## Problem (verified in code, 2026-10-04)

`panel.mjs` calls `runRole({ role: 'synthesizer', inputs: memberResults })`. `runRole`
(`src/runner/execution/run.mjs:355`) destructures `inputs` and never reads it. The assignment
is built in `dispatchBound` (:299) with `contextRefs: unit.inputs || []` (:319), so the synthesizer brief says
`Context refs: - (none)`. Live evidence: `plans/reports/council-ab-comparison-261004.md`
(synthesizer contradicted two of three panelists and named none of them).

## Category

Data hand-off between roles of one Unit run. Not a pattern flaw, not a protocol gap. `reviewed`
works only because producer and checkers share one worktree; read-only panelists share nothing
but their outbox.

## Prior art (AGENTS.md "prior art before design")

- `git log -S'inputs: memberResults'` and `-S'unit-run:'` both land on one commit (`abe6f2b3c`,
  Wave B): the pattern side and the `unit-run:<id>/<role>` input grammar were written together;
  the runner side was never wired. No later change removed it.
- The retired coordination engine passed earlier step outputs as granted `contextRefs`. Same
  mechanism, so reuse `contextRefs`; invent nothing.

## Design (smallest change)

`contextRefs` is already the contract for "files this role should read": a string array,
rendered one per line in the brief, mounted read-only (`--ro-bind / /`). Each role result already
lists its artifacts in `runResult.evidence.artifacts` (live and from `history()` alike).

So: `runRole` passes `inputs` to `dispatchBound` (signature :299, call :440), which turns them
into absolute paths of the report artifacts and appends them to the assignment's `contextRefs`.
Three small edits in `run.mjs` plus one pure helper, no new store, no new format, no change to
any pattern, and `inputs` defaults to `[]` so every other caller is
byte-identical.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Wire `inputs` into `contextRefs`](phase-01-wire-inputs-into-context-refs.md) | pending |
| 2 | [Say what to do with them (conditional)](phase-02-role-task-statement-conditional.md) | pending, only if phase 1 acceptance shows refs are ignored; needs the per-role unit to reach `dispatchBound` |

## Not in this plan

- Resolving `unit-run:<id>/<role>` strings in `unit.inputs` (validated, still unresolved): same
  helper could serve it; separate follow-up so this stays one small change.
- Council gates, stance sensor, persona-per-seat, glm-herdr idle timeout.

## Acceptance

1. Synthesizer assignment lists every panelist report as an absolute path; panelist and
   `reviewed` assignments are unchanged.
2. Live rerun of the same panel question: synthesizer output names the panelists' positions.
3. `npm test` green (env `-u CLAUDE_CODE_SESSION_ID`).

## Follow-up candidate: observer transcript (owner idea, 2026-10-04)

Need: roles may be blind to parts of the discussion, but the human observer wants to read the
whole process afterwards.

Finding: nothing new has to be recorded. Each role's assignment already stores what it was
shown (`brief-N.md`, and after phase 1 its context refs), what it said (`outbox/report-N.md`),
who played it (executor, persona, `fallbackFrom` in `unit.json` bindings and `result.json`) and
when. `src/verbs/dispatch/show-run.mjs` reads one run; no verb reads a whole Unit run.

Shape: a read-only projection over the existing files (Unit run id in, ordered markdown out:
per role the seen inputs, the answer, the executor/persona, the outcome), blind by construction
because it reads storage, not the roles. Needs its own spec check and plan; it depends on
phase 1 only for showing which inputs the synthesizer saw.

## Review log

Opus read-only review (2026-10-04) verified: `inputs` unread, only `panel.mjs` passes it, brief shows `(none)`, prior art commit, bwrap `--ro-bind / /` makes main `.fgos` readable, resume/fallback keep refs identical (assignment.json written once). Corrections applied: edit site is `dispatchBound` not `runRole`; artifact lookup is by file name; contract validator is not on this path; panel test already asserts 3 inputs; phase 2 needs the per-role unit plumbed.

## Related finding: two hand-off mechanisms (RUL11 signal)

`src/workflow/runner.mjs:33` (`buildUnitObjective`) already hands a prior STEP's output to the next
step, by inlining report text into the objective. It picks the report with
`endsWith('agent-report.md')`, but live herdr workers write `outbox/report-N.md`, so it very
likely drops them silently (not yet reproduced). Patterns (this plan, contextRefs) and Workflows
(inline text) then hand off differently. Do not widen this plan; after phase 1, decide one
mechanism and share the report-lookup helper. Record as follow-up.
