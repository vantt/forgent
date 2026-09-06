# Example family: unclear start (vnflow)

Grounded in a real, closed session:
[P01.3](../../architect/agent-coordination/verification/architecture-advisory-panel/P01.3.md)
(worked here as a narrated example, not a copy of the proof files
themselves).

## What the person actually said

The whole input, verbatim:

> start from the symptom "EOD and intraday evolution is becoming difficult"
> and determine whether the right decision is to keep separate pipelines
> with shared contracts, introduce one pluggable pipeline abstraction, or
> reframe the problem elsewhere

This is genuinely ambiguous in a way the mdview case was not: it names a
*feeling* ("becoming difficult"), not a fact; it offers three candidate
framings including an explicit escape hatch ("reframe elsewhere"); and it
does not say which of the three the person suspects is right. The skill
takes this exactly as seriously as a crisp question — no problem brief was
requested, no protocol was named, and the coordinator still resolved a full
request from it.

## What the coordinator builds

Same shape as the clear-start example — `interpret-request` +
`investigate-context` — with the objective text carrying the person's own
ambiguity forward rather than resolving it early:

```json
{
  "kind": "declared-protocol",
  "objective": "Symptom: 'EOD and intraday evolution is becoming difficult.' Determine whether to keep separate pipelines with shared contracts, introduce one pluggable pipeline abstraction, or reframe the problem elsewhere -- three explicit candidate framings, none pre-selected.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_vnflow_example",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "aggregateBounds": { "maxRounds": 20, "maxAssignments": 30 },
  "actors": [
    { "id": "lead-advisor-actor", "executor": "claude-bwrap", "tier": "critical" },
    { "id": "context-investigator-actor", "executor": "codex-readonly", "tier": "analytical" },
    { "id": "system-shaper-actor", "executor": "claude-bwrap", "tier": "analytical" },
    { "id": "alternative-shaper-actor", "executor": "agy-bwrap", "tier": "analytical" },
    { "id": "constraint-advocate-actor", "executor": "codex-readonly", "tier": "analytical" },
    { "id": "architecture-critic-actor", "executor": "codex-readonly", "tier": "analytical" },
    { "id": "synthesizer-actor", "executor": "claude-bwrap", "tier": "critical" },
    { "id": "red-team-actor", "executor": "agy-bwrap", "tier": "critical" }
  ],
  "steps": [
    {
      "type": "operation",
      "as": "interpret",
      "operationId": "interpret-request",
      "targetActorId": "lead-advisor-actor",
      "objective": "Interpret a symptom-shaped, three-option-plus-escape-hatch framing without pre-selecting an option.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    },
    {
      "type": "operation",
      "as": "investigate",
      "operationId": "investigate-context",
      "targetActorId": "context-investigator-actor",
      "objective": "Scout the real pipeline code for what actually duplicates versus what only appears to.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

Same roster as the clear-start example, resolved once at intake — see
that file's own note on what omitting `actors[]` would cost, and the
how-to guide's own notes on why `aggregateBounds` is declared here and why
`actors[]` must be repeated on every later call that dispatches one of
these roles.

## What actually happened (real, P01.3)

The lead advisor's own interpretation flagged, before any shaper ran, that
"reframe elsewhere" is unbounded in altitude and warned downstream roles not
to treat the other two options as the real question when only the third
tests the shared premise underneath both. The scout then partly
contradicted the intake's own suggested hypothesis: a shared engine layer
already existed (duplication was not structural at the execution level),
but real drift had happened in two specific seams — a shared buy-gate rule
silently bypassed for intraday, and a schema-tolerance fix that reached one
pipeline's loaders but not the other's.

All three shapers, working independently and blind to each other, converged
on the SAME option — keep the two pipelines, close the real seams, no new
abstraction — but by three different mechanisms, and the panel reported that
honestly as genuine convergence rather than manufacturing artificial
disagreement to look more thorough. The critic still found 5 real attacks
against the converged position (1 conceded), including independently
re-verifying two of them against the actual repository before trusting them
— a scheduler-deadlock claim and an alert-cap severity claim, both checked
against real source rather than accepted on the critic's own say-so.

The synthesis correctly refused to pick between three competing mechanisms
for one remaining seam when no shaper had produced a fact that would
separate them — it named the missing observation instead of authoring a
tiebreak nobody had earned. This is the same discipline named in
`SKILL.md`'s Synthesizer packet ("if the evidence genuinely cannot separate
two candidates, say that decisively") applied to a genuinely unclear-start
case: unclear input did not become false certainty by the time it reached
the person.

## What happened after — a real, unusual dialogue path

The person's real Phase 9 reply did not answer either of the panel's two
open questions directly. It asked, first, for the questions to be restated
more plainly (a clean `clarify` turn — see the
[clarification/challenge example](architecture-advisory-panel-v1-clarification-and-challenge.md)),
then asked for an independent directional opinion from a separately
authorized, non-panel consultation (`kongming`) instead of deciding. That
consultation re-investigated the real repository itself and returned a
sharper verdict — the root cause was one layer beneath the panel's own three
seams entirely (a missing shared point-in-time reader, not a shaping
problem). The coordinator independently re-verified the consultation's key
factual claim against real source before recording it as trusted, and
attributed every claim to the consultation by name rather than folding it
into the panel's own voice. This out-of-panel-consultation path is a real,
named convention (`SKILL.md`'s own section on it), not an improvisation —
and it happened for real exactly once, in this session.
