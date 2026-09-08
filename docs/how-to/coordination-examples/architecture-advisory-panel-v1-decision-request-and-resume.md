# Example family: consolidated Decision Request, and resume

Two things live in this file because the protocol's own graph ties them
together: Phase 4 ("Ask Reluctantly") is coordinator bookkeeping, not a
graph operation (see `SKILL.md`'s Entry Flow table — Phase 4 has no node of
its own), and whatever it decides directly shapes what a resumed session
needs to re-derive.

## Part 1 — the real pattern: both sessions to date sent zero

**Honest disclosure, not a gap being smoothed over:** neither
[P01.2](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/decision-request.md)
nor P01.3 ever sent a Decision Request to the person. Both wrote the file
anyway, because "we decided not to ask" is itself a decision that needs a
record — a successor coordinator should never re-derive it from nothing, or
worse, re-ask what was already reasoned through. Here is P01.2's real
verdict table, **condensed from the source** (the reasoning is the
artifact — read
[`decision-request.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/decision-request.md)
itself for the full, unabridged text of every cell):

| Candidate gap | User-exclusive? | Material now? | Disposition |
|---|---|---|---|
| Whether "local ownership" means a cache, replica, or independent authority | Partially — scoutable in part, final scope is the person's own intent | Yes, in principle | **Not asked yet** — each shaper states its own explicit working definition instead; divergence here is useful signal |
| Whether the pressure is latency, offline, install/distribution, or velocity | No — scout-answerable | Scout already answered it | **Resolved by scouting**, not asked |
| Whether "native" implies reimplementation or relocation | No — scout-answerable | Yes | **Resolved by scouting** — the shell owns zero relocatable library code |
| Whether the shell is a product bet or a spike | **Yes — only the person can say** | Doesn't flip the technical recommendation, only the investment level | **Not asked now** — carried as a named dependency into the explanation, stated plainly as "the part that stays theirs" |
| Whether the decision is already made | N/A — already answered directly by the person before dispatch | No | **Answered**, not re-asked |

**No candidate cleared both bars (genuinely user-exclusive AND material
enough to change what Phase 5 should produce) strongly enough to interrupt.**
This is the real discipline: a gap that fails the materiality test is never
silently dropped — it is carried forward as an explicit named default,
stated in every downstream shaper's prompt, and surfaced again, by name, in
the final explanation as something that remains the person's own call.

## Part 2 — a constructed case where a Decision Request WOULD send

No real session to date has crossed both bars for more than one gap at
once, so this half is deliberately marked as constructed for illustration
— a hypothetical layered on top of the real vnflow case (P01.3), not a
copy of a real send and not a real scout finding. The opening request that
started this same case is the
[unclear-start example](architecture-advisory-panel-v1-unclear-start.md)'s
own — same `protocolRef.id`, same `actors[]` roster, same `coordinationId`
(`aap_vnflow_example`) — a Decision Request never opens a new session or a
new roster of its own; it happens inside Phase 4, before Phase 5 dispatches
against that already-resolved roster, reproduced here for this file's own
self-containment:

```json
"actors": [
  { "id": "lead-advisor-actor", "executor": "claude-bwrap", "tier": "critical" },
  { "id": "context-investigator-actor", "executor": "codex-readonly", "tier": "analytical" },
  { "id": "system-shaper-actor", "executor": "claude-bwrap", "tier": "analytical" },
  { "id": "alternative-shaper-actor", "executor": "agy-bwrap", "tier": "analytical" },
  { "id": "constraint-advocate-actor", "executor": "codex-readonly", "tier": "analytical" },
  { "id": "architecture-critic-actor", "executor": "codex-readonly", "tier": "analytical" },
  { "id": "synthesizer-actor", "executor": "claude-bwrap", "tier": "critical" },
  { "id": "red-team-actor", "executor": "agy-bwrap", "tier": "critical" }
]
```

Say P01.3's real
[`scout-report.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/scout-report.md)
had additionally surfaced this constructed twist: the real
`alert_dispatch_intraday.py` path writes trade-signal alerts to a log with
no configured retention policy, and separately, whether the standing
2026-06-22 decision's real 7-day EOD-context staleness window is compliant
depends on which instrument class is running through it — both are
regulatory-obligation facts that live with the person's own compliance
team, not in the repository, and per `SKILL.md`'s own named exception
("if proceeding requires inventing a fact about the person's own
obligations that cannot be defaulted safely, ask immediately and say why
waiting would have been worse"), scouting further cannot resolve either
one. A single, consolidated message — never a first question, then a
second one three minutes later:

> Before the panel diverges on the three-seam design, two things only you
> can settle, together, not two separate messages:
>
> 1. **Alert-log retention.** Which regulatory retention window applies to
>    intraday trade-signal alerts — 90 days, 1 year, 7 years? This decides
>    whether `alert_dispatch_intraday.py` needs a durable, auditable log or
>    an ephemeral one, before any shaper proposes a mechanism for it.
> 2. **EOD-context staleness compliance.** Is the existing 7-day acceptance
>    window (your own 2026-06-22 decision) compliant for every instrument
>    class this pipeline now handles, or does a subset need a shorter one?
>    This bounds what "a checked input" can mean for the third seam.
>
> Everything else we found was either answerable by reading the repository
> (see scout-report.md) or doesn't change what a first proposal looks
> like — we're proceeding on those without asking. If we don't hear back:
> we'll assume a 1-year retention window for #1 (the conservative default
> for trade-signal logs — cheap to shorten later, expensive to have
> discarded data you needed), and treat the existing 7-day window as
> compliant for every instrument class for #2 (matching your own standing
> decision already in force) — both stated as explicit, named assumptions
> in every shaper's prompt, not silently assumed.

This is the "ask reluctantly, but clearly, and only once" shape: batched,
each question stated with why it can't wait and why it can't be defaulted,
and a real, substantive named default for each — never a placeholder — so
the person can see exactly what happens if they say nothing.

Recording the person's real answer, once it arrives, is the same
`human-turn` mechanism every other family in this guide uses — this
protocol has no separate "decision request answered" step, because
Phase 4 is coordinator bookkeeping, not a graph operation (see this file's
own opening paragraph):

```json
{
  "kind": "declared-protocol",
  "objective": "Continue aap_vnflow_example: record the person's answer to the compliance Decision Request.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_vnflow_example",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "steps": [
    {
      "type": "human-turn",
      "as": "personTurn1",
      "turnId": "turn_1",
      "turnOrdinal": 1,
      "channel": "claude-code-chat",
      "artifactRef": "human/1-person.md",
      "externalRef": "claude-code-transcript:sess-1:uuid-1",
      "attributedTo": { "type": "person", "id": "the-user" }
    }
  ]
}
```

No `actors[]` override is needed on this particular call — a `human-turn`
step records a turn, it does not dispatch an operation against a
role-bound actor, so there is nothing here for a per-actor executor
override to apply to. The roster this session actually dispatches through
is the one declared at `aap_vnflow_example`'s own opening call (the
[unclear-start example](architecture-advisory-panel-v1-unclear-start.md))
— and per the how-to guide's own note, that `actors[]` block must be
repeated on any LATER call in this same file's Part 2/3 sequence that goes
on to authorize or dispatch an operation (e.g. a `revise-synthesis`
following this turn, shaped exactly like the
[material-context reopen example](architecture-advisory-panel-v1-material-context-reopen.md)).

## Part 3 — resuming a session, from durable artifacts and `show` alone

This half IS live-verified, not constructed — see the how-to guide's own
"Resuming a session later" section for the real command sequence and real
`fgos coordination show --json` output this reuses. The fresh-session
resume order (`SKILL.md`'s own list) puts `show`'s own reported quorum and
`pendingDriverAuthorizations` FIRST, ahead of any prose file:

1. `fgos coordination show <id> --json` — the hard, replay-derived truth of
   phase/quorum state and what's still pending, independent of any prose
   file's own claim.
2. `session.md` — the coordinator's compact status board. If it disagrees
   with (1), trust (1).
3. `intake.md`, then the newest `human/<n>-person.md` — what was actually
   asked and said, read before any panel artifact.
4. `interpretation.md` and `dispositions.md` — what the panel believes and
   what the driver has authorized.
5. Only what the next action actually needs — not every proposal, "to feel
   oriented."

No chat history, no raw dispatch log, and — confirmed by the live proof in
the how-to guide — no re-reading of `decision-request.md`/`session.md` is
strictly required to know **what's next**: `show`'s own `quorum.missing` and
`pendingDriverAuthorizations` already say it, straight from the event log.
Those prose files answer **why**, which `show` cannot.
