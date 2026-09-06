# Example family: clarification and challenge

Clarify is real and grounded in
[P01.3](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/dialogue/1-impact.md).
No real session to date sent a pure `challenge` (a dispute of a specific
claim, as opposed to a clarify or a new fact) — the challenge half below is
constructed for illustration, grounded in a live, unresolved disagreement
both real sessions actually left on the table.

## Clarify (real, P01.3)

After reading `explanation.md`, the person's entire real reply was three
short utterances. The first:

> "giải thích lại câu hỏi" ("explain the question again")

**Recording, real mechanism, always this order regardless of which verb the
turn turns out to be:** write the verbatim turn to a durable artifact
first, then submit the `human-turn` request step citing it — the engine
computes the turn's revision hash from that file's own real committed
bytes, never from a caller's claim:

```json
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
```

**What happens next — and what does NOT.** A `clarify` classification
authorizes exactly one thing: answering from what's already been written.
It dispatches no operation, consumes none of the two bounded reopen
invocations, and needs no `authorize` step at all — `SKILL.md`'s own
Decision Dialogue table lists `clarify` as "Answer from existing artifacts;
no operation dispatch." The coordinator drafts `dialogue/1-impact.md` and
`dialogue/1-response.md` as its own bookkeeping (the reconciliation this
protocol's graph forces, since no operation exists for "restate the
question" at this point in the graph — see `SKILL.md`'s own Decision
Dialogue reconciliation note for exactly why that is not a
BOUNDS-#7 violation), and the response goes straight back to the person: a
plainer restatement of the same two open questions, nothing new argued.

## Challenge (constructed, grounded in a real, still-unresolved dispute)

Both real sessions to date left one dispute genuinely unresolved through to
their final response: P01.2's "does hardening the shell's launcher
coordination make the architecture easier or harder to reverse later" —
the recommendation assumed easier, one objection in the panel held the
opposite, and neither side produced evidence that settled it. A real
`challenge` turn against that exact recommendation might read:

> "You're recommending we harden the launcher coordination because it keeps
> our options open — but isn't that the same as saying the multi-process
> split becomes 'the thing that works,' and gets harder to walk back the
> more we invest in it? What would actually change your mind here?"

**Classification: `challenge` — disputes a specific claim.** Per the
Decision Dialogue table, this authorizes "defend with existing evidence, or
concede and route to `revise-synthesis`/`revise-explanation` if the
concession changes the packet" — and it **only consumes a reopen invocation
if it actually changes something.** Two real, honest outcomes are both
legitimate here, and the coordinator does not get to pick the flattering
one:

1. **Defend, no reopen.** If the synthesis already carries this exact
   objection as a live, attributed, unresolved disagreement (which, in the
   real P01.2 case, it does — this is not a new claim, it is the same
   Attack 1 the person is now pushing on directly), the honest answer is to
   say so plainly: "this is the same open disagreement the panel already
   named and did not resolve — nothing new has been argued on either side
   since." No `revise-*` dispatch, no reopen spent, because nothing about
   the packet actually changed.
2. **Concede and reopen.** If the challenge surfaces something the panel's
   own ledger did not already carry (a reason the reversibility premise is
   wrong that no advisor stated), THAT is what authorizes
   `revise-synthesis` — citing the human turn's own `reason` field, per the
   Known-Gaps workaround for `tsk-44p` (no schema-legal `human-turn:` ref
   exists in any `authorize` step's structured fields today):

```json
{
  "type": "authorize",
  "as": "authRevise",
  "operationId": "revise-synthesis",
  "targetActorId": "synthesizer-actor",
  "authorizationId": "auth_revise_challenge_1",
  "invocationKey": "ik_revise_challenge_1",
  "reason": "Bounded reopen per human turn \"turn_2\": the person surfaced a reason the reversibility premise may be wrong that no advisor's own critique had stated.",
  "grantedContextRefs": []
}
```

The distinction that matters, stated plainly so a coordinator doesn't
default to reopening every challenge out of caution: **a challenge that
merely restates a disagreement the packet already visibly carries earns a
defense, not a reopen.** Spending a reopen on a challenge that changes
nothing is how a two-invocation budget gets burned on ceremony instead of
the genuinely new material it exists for.
