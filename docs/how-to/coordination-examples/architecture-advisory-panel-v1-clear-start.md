# Example family: clear start (mdview)

Grounded in a real, closed session:
[P01.2](../../architect/agent-coordination/verification/architecture-advisory-panel/P01.2.md)
(worked here as a narrated example, not a copy of the proof files
themselves — read those for the complete, unabridged artifacts).

## What the person actually said

The whole input, verbatim, re-confirmed directly by the person the same day:

> "mdview vẫn chưa quyết, cho panel dispatch vào đi"
> ("mdview is still undecided, go ahead and dispatch the panel into it")

which resolved to this framing at intake:

> decide whether the experimental native desktop shell should remain a thin
> client of the existing single-daemon registry/render/search authority or
> acquire local ownership

This is "clear" in the sense that mattered to the coordinator: one crisp
technical question, one repository, no ambiguity about which system is under
discussion or what the two poles of the decision are. It is not "clear" in
the sense of "easy" — the real session still found genuine disagreement
(see below).

## What the coordinator builds — no protocol id, no roster, from the person

The person named neither. The coordinator resolves the roster from the
proven-safe allowlist (`SKILL.md`'s own Executor Roster table) and opens the
session:

```json
{
  "kind": "declared-protocol",
  "objective": "Thin-client vs. local-ownership decision for the experimental native desktop shell (mdview).",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_mdview_example",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "steps": [
    {
      "type": "operation",
      "as": "interpret",
      "operationId": "interpret-request",
      "targetActorId": "lead-advisor-actor",
      "objective": "Interpret the person's intent: thin-client vs. local-ownership for the desktop shell.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    },
    {
      "type": "operation",
      "as": "investigate",
      "operationId": "investigate-context",
      "targetActorId": "context-investigator-actor",
      "objective": "Scout the real repository for what the desktop shell actually owns today and what changed recently.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

Note what is absent: no `actors[]` override naming a bwrap-wrapped executor
here — see the
[heterogeneous/homogeneous example](architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md)
for that shape and its own live registration caveat; this file stays focused
on the entry/framing mechanics.

## What actually happened (real, P01.2)

The context investigator's scout falsified part of the intake's own
implicit framing before any shaper touched the case: the shell has **zero**
domain logic of its own (nothing to relocate if "local ownership" ever
happened — it would mean genuine reimplementation), and the "single-daemon
authority" framing was already partly false in practice (the CLI and the
MCP tool already talk to the daemon directly, bypassing the shell
entirely). Three shapers then diverged for real: two proposed "stay thin,
fix what's actually broken"; one proposed deleting the shell outright. The
critic found 5 attacks, conceded one, and two were decision-changing —
including a "reversibility illusion" attack that stayed live and unresolved
all the way to the final response.

The synthesizer's one recommendation, and the explanation the person
actually read, both preserved that live disagreement rather than smoothing
it — read the real
[`synthesis.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/synthesis.md)
and
[`explanation.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/explanation.md).
The explanation opens like this, not with an architecture diagram:

> "Keep the daemon as the single authority. [...] But do not start with the
> launcher work. Start by getting the shell into CI and getting numbers out
> of it. [...] Step 5 is cheap and it changes everything downstream. If you
> can answer it today, answer it today — before step 1."

Consequence first, architecture second, and a cheap, decision-relevant
question named as the highest-leverage next move — this is the explanation
standard `SKILL.md` names for the lead advisor role, not a rhetorical
flourish specific to this one case.

## What happened after — real dialogue, real outcome

The person's real Phase 9 reply revealed a fact the panel's own two
hypotheses (abandoned vs. working-as-designed) had not considered: the
shell wasn't abandoned OR working as designed — it was simply forgotten
under workload, and still valued. That single sentence reclassified as
`introduce-context` under Decision Dialogue (see the
[material-context reopen example](architecture-advisory-panel-v1-material-context-reopen.md)
for the full mechanics of what a fact like that authorizes under this
protocol) and led, across two real turns, to a concrete final outcome: fix
four named first-run defects, defer Windows packaging, drop a
telemetry-first sequencing that would have manufactured a false "nobody
wants this" signal. See the
[final decision/defer example](architecture-advisory-panel-v1-final-decision-and-defer.md)
for that real outcome in full.
