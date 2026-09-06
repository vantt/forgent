# How to use the `fgos-architecture-panel` skill

`fgos-architecture-panel` runs a 9-role advisory panel — lead advisor,
context investigator, three independent shapers (system, alternative,
constraint), architecture critic, synthesizer, independent red-team, and an
on-demand specialist — against the real, registered
[`core.coordination-protocol.architecture-advisory-panel-v1`](../../core/coordination-protocols/architecture-advisory-panel-v1.yaml)
protocol. It is a member of the `fgos-group-thinking` Protocol Pack
(`core/protocol-packs/group-thinking.json`), so everything this guide shows
runs through the SAME `fgos coordination run --file` / `fgos coordination
show --json` doors — the same ones
[`use-fgos-group-thinking.md`](use-fgos-group-thinking.md) already documents
for RFC-Review-Lite/Nominal-Group-Lite/Delphi-Feedback-Lite. Read that guide
first if the request-file shape (`kind`, `protocolRef`, `steps[]`, `$ref:`
chaining, `actors[]` per-role overrides) is unfamiliar; this guide does not
restate it.

Full doctrine — what a good session should think and say, not just which
door to call — lives in
[`core/skills/fgos-architecture-panel/SKILL.md`](../../core/skills/fgos-architecture-panel/SKILL.md).
This guide is the person-facing complement: what you, the person bringing a
real architecture question, actually experience at each step.

## You never write a request file yourself

You bring raw, possibly one-sentence intent. The coordinator (the agent
running this skill) resolves the protocol id, the roster, and every request
step from your words — you never author JSON, never pick a protocol, never
name a role list. Two real sentences that were, in full, the entire input to
a real session:

> "decide whether the experimental native desktop shell should remain a thin
> client of the existing single-daemon registry/render/search authority or
> acquire local ownership"
> — real intake, [mdview case, P01.2](../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/intake.md)

> "start from the symptom 'EOD and intraday evolution is becoming difficult'
> and determine whether the right decision is to keep separate pipelines
> with shared contracts, introduce one pluggable pipeline abstraction, or
> reframe the problem elsewhere"
> — real intake, [vnflow case, P01.3](../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/intake.md)

Neither sentence names a protocol, a role, or an executor. Both are real,
both ran, both reached a real outcome (see the two example families below).

## Do you need to know the CLI at all?

No — but this guide shows the real request JSON alongside the prose anyway,
for the same reason `use-fgos-group-thinking.md` does: so a coordinator
picking this skill up cold can see the exact mechanical shape a raw sentence
turns into, and so nothing here reads as hand-waving over a mechanism that
doesn't actually exist. If you are the person asking the question, you can
stop reading after this section and the phase table below — the request
JSON in the example files is for whoever is running the coordinator side of
the session (an agent, or you wearing that hat), not for you to write.

## What you'll see, phase by phase

The protocol's own graph runs nine judgment phases (the full mapping onto
real operation ids is in `SKILL.md`'s own table; this is the same nine
phases described for you, the person):

| Phase | What happens | Do you see anything yet? |
|---|---|---|
| 1. Intake and Framing | The coordinator freezes your words verbatim and resolves a roster. | No — this is bookkeeping. |
| 2/3. Understand You / Understand The Problem | The lead advisor reads your intent (never the scout's evidence); the context investigator scouts the real repository (never invents, reports absence honestly). Both dispatch blind to each other. | No — unless something genuinely needs you (next row). |
| 4. Ask Reluctantly | The coordinator checks every open gap against three tests: was it scouted, is it truly only yours to answer, and does it change what the panel produces *now* — before defaulting or asking. | **Maybe.** In the two real sessions to date, the answer was "no" to sending anything — both proceeded on named, explicit defaults instead. See the [Decision Request example](coordination-examples/architecture-advisory-panel-v1-decision-request-and-resume.md) for both the real "nothing sent" pattern and a constructed case where something would be. |
| 5. Diverge Honestly | Three shapers independently propose — genuinely different candidates, not a strawman and two real options. | No. |
| 6. Debate Claims | The critic attacks the strongest proposal, not the weakest; the constraint advocate ranks operational risk. | No. |
| 7. Converge Without Flattening | The synthesizer recommends ONE thing, keeping live disagreement visible rather than smoothing it into a footnote. | No. |
| (red-team) | An independent attacker checks the packet and the panel's own conduct, not just the architecture. | No. |
| 8. Explain For Ownership | The lead advisor writes the one document meant for you. | **Yes — this is the first thing you read.** |
| 9. Stay In Dialogue | You respond. See Decision Dialogue below. | Yes, for as long as you keep talking. |

Phases 1-7 plus the red-team pass produce nothing you need to read along the
way — they are the panel doing its job before it talks to you. The
explanation (Phase 8) is written to be defensible to colleagues who will
live in the resulting codebase, not a summary of what happened internally —
read a real one:
[P01.2's `explanation.md`](../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/explanation.md).

## Decision Dialogue — how you keep talking after the explanation lands

Every reply you give is classified before anything happens next — never
assumed from tone. This is the actual table `SKILL.md` operates from,
restated for what each looks like from your side:

| If you... | The panel... | Costs one of your two reopens? |
|---|---|---|
| Ask what something means, dispute nothing | Answers from what's already been written — no new panel work | No |
| Dispute a specific claim | Defends it with existing evidence, or concedes and revises | Only if the concession actually changes something |
| Tell it something it didn't know | Incorporates the new fact into a revised recommendation | Yes |
| Ask for an option nobody proposed | Evaluates it against everything already argued | Yes |
| Ask for parts of two options combined | Produces that combination as an explicit, evaluated candidate | Yes |
| State a decision, or an intentional "not now, revisit if X" | Records it verbatim and stops advising (or parks, naming the trigger) | Ends the dialogue, doesn't reopen it |

**The two-reopen budget is real, not a suggestion.** `revise-synthesis` and
`revise-explanation` are each hard-capped at 2 invocations by the protocol
itself (`activation.maxInvocations: 2`) — a mid-session crash and resume
does not reset it, and neither does asking nicely. If you exhaust it and
still have genuinely new material, the honest answer is "this session's
bounded reopen budget is spent; going further needs a new session" — see the
[material-context reopen example](coordination-examples/architecture-advisory-panel-v1-material-context-reopen.md)
for exactly when that line gets said.

**This protocol's reopen is narrower than the manual playbook's was, on
purpose.** The manual playbook (the two real sessions below both used it,
before this protocol existed) could reopen Phase 3, 5, or 6 with a fresh
dispatch. This protocol's graph has no backward edge into re-shaping or
re-critiquing — only the synthesizer's own `revise-synthesis` and the lead
advisor's own `revise-explanation`. When your turn would, under the old
playbook, have reopened shaping or critique, the synthesizer incorporates
what it can from your turn plus the existing ledger; if it genuinely can't
(the new material needs a fresh independent proposal or attack, not
re-weighing what's already argued), the coordinator opens a **new session**
that inherits this one's `intake.md`/`scout-report.md`, rather than
fabricating a fresh shaper's voice inside a revision. Said to you plainly,
every time it applies: "a full re-run of [X] would need a new session; here
is what the panel can tell you today without one."

Every family below is a real request-JSON shape plus real or realistically
constructed prose — not request JSON alone:

- [Clear start (mdview)](coordination-examples/architecture-advisory-panel-v1-clear-start.md)
- [Unclear start (vnflow)](coordination-examples/architecture-advisory-panel-v1-unclear-start.md)
- [Consolidated Decision Request, and resume from durable artifacts alone](coordination-examples/architecture-advisory-panel-v1-decision-request-and-resume.md)
- [Clarification and challenge](coordination-examples/architecture-advisory-panel-v1-clarification-and-challenge.md)
- [Material-context reopen](coordination-examples/architecture-advisory-panel-v1-material-context-reopen.md)
- [Alternative and composite reopen](coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md)
- [Final decision, and a genuine defer](coordination-examples/architecture-advisory-panel-v1-final-decision-and-defer.md)
- [Heterogeneous roster, and the homogeneous fallback](coordination-examples/architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md)

## Resuming a session later — proven, not asserted

A fresh agent (or you, days later) resumes from exactly two things: the
session's own durable artifacts on disk, and one read-only call:

```bash
fgos coordination show <coordinationId> --json
```

This was verified live for this guide, not assumed: a throwaway session
(`aap_entry_proof_1`, a stub-executor sandbox, not a real project) was
opened with `fgos coordination run --file request-1.json --dir <scratch>`
naming only two Phase-1 operations, then genuinely resumed in a **second,
separate CLI invocation** (`request-2.json`, the three Phase-5 shapers) —
`fgos coordination show` between the two calls reported, with no chat
history and no raw log involved:

- the exact roster still missing quorum (`quorum.missing`), by real actor
  id — `lead-advisor-actor` still showed missing even after its own
  `interpret-request` step reported `"done"`, because that actor's quorum
  completion needs its OTHER two gating operations
  (`explain-recommendation`, `close-dialogue`) too — a real, load-bearing
  behavior of the multi-operation quorum rule, not a quirk;
- every `driver-authorized` operation still awaiting authorization
  (`pendingDriverAuthorizations`), naming the exact node, operation, and
  actor for each — `critique-proposals`, `assess-constraints`,
  `synthesize-recommendation`, `red-team-packet`, `explain-recommendation`,
  `revise-synthesis`, `revise-explanation`, `close-dialogue`, all present
  and named before any of them had run;
- a real event count, growing correctly across the second call.

No `decision-request.md`/`session.md`/`interpretation.md` was needed to
know what to do next — `show`'s own reported `quorum`/`pendingDriverAuthorizations`
already said it. Those prose files (see the example families) add *why*, not
*what's next* — `show` already answers *what's next* on its own, straight
from the replayed event log.

## Do you need a new use-case or CLI verb for any of this?

**No — investigated directly, not assumed.** Before writing this guide, the
raw-intent-to-request translation above and the resume proof above were both
driven for real through nothing but `fgos coordination run --file` and `fgos
coordination show --json` — the same two doors `fgos-group-thinking` already
exposes for every other protocol in its pack. Nothing about this protocol's
9 roles, its `driver-authorized` gates, its bounded dialogue reopen, or its
specialist slot required a new request-step type, a new CLI sub-verb, or a
new resume mechanism — every one of those capabilities was already proven
generically by the sibling group-thinking protocols and re-exercised here
end to end (`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`,
13 conformance cases) and, for the entry/resume claim specifically, by the
live throwaway proof cited above. The only two real gaps this track has
found (`tsk-44p`, `tsk-3xk`) are pre-existing request-schema gaps general to
every protocol using a `human-turn:` ref or a specialist slot — not specific
to this protocol, not an entry/resume ergonomics problem, and already named
with their workarounds in `SKILL.md`'s own Known Gaps section.

## Executor roster — never one collapsed provider

`SKILL.md`'s own Executor Roster table names a specific executor, tier, and
cognitive rationale per role, and warns loudly that the three proven-safe
pairs (`claude-bwrap`, `agy-bwrap`, `codex-readonly`) are not yet registered
in this repository's dispatch config (`tsk-1o4`) — naming one to `fgos
coordination run` today silently falls back to the unconfined global default
executor instead of refusing. Read that warning in full before dispatching
any real session; the
[heterogeneous/homogeneous example](coordination-examples/architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md)
shows both the real `actors[]` override shape this roster resolves to and
the manual-dispatch workaround the two real proof sessions actually used.

## Related

- [`core/skills/fgos-architecture-panel/SKILL.md`](../../core/skills/fgos-architecture-panel/SKILL.md)
  — the skill's own full doctrine: phase-by-phase graph mapping, per-role
  task packets, Decision Dialogue mechanics, Driver Disposition rules,
  fresh-session resume, and every named gap.
- [`use-fgos-group-thinking.md`](use-fgos-group-thinking.md) — the gate
  mechanism this skill is a member of, and the request-file shape this guide
  assumes.
- [P01.2](../architect/agent-coordination/verification/architecture-advisory-panel/P01.2.md)
  and [P01.3](../architect/agent-coordination/verification/architecture-advisory-panel/P01.3.md)
  — the two real, closed manual-proof sessions every example family below
  draws from.
- [P03.2](../architect/agent-coordination/verification/architecture-advisory-panel/P03.2.md)
  — the protocol's own conformance proof (13 cases: premature reveal, hidden
  dissent, unauthorized specialist, over-cap reopen, human-authority
  impersonation, heterogeneous actor/tier provenance).
