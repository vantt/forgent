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
  "kind": "declared-protocol",
  "objective": "Continue aap_vnflow_example: record Turn 1 (clarify).",
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
their final response: P01.2's Attack 1, "the 'Stay Thin' reversibility
illusion." Its real target claim, stated precisely because the constructed
turn below must attack what was actually recommended, not a stronger
straw version of it: fixing the shell's launcher bugs "is notoriously
complex state-machine engineering... by successfully engineering this
coordination, you deeply entrench the multi-process architecture"
([`critiques/architecture-critic.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/critiques/architecture-critic.md)).
**What the real recommendation actually commits to, and what it explicitly
does not:** put the shell in CI, fix three specific, deterministic bugs
(silent fallback, wrong-port connection, raw-bind-host URL), ship
telemetry — and, in the same breath, decline the harder cold-start-race
coordination work Attack 1 worried about most
([`explanation.md:18`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/explanation.md),
Step 4: "Do not build robust cold-start coordination yet"). A challenge
that accuses the panel of recommending the declined work would be
attacking a position nobody holds. This one attacks the part that was
actually recommended:

> "You're recommending we fix the three launcher bugs and put the shell in
> CI — but your own critic said fixing this kind of coordination is what
> entrenches the multi-process split, win or lose on the cold-start
> question. Isn't shipping CI and three bug fixes still 'successfully
> engineering the coordination' in the sense your critic meant? What would
> actually change your mind here?"

**Classification: `challenge` — disputes a specific claim.** Per the
Decision Dialogue table, this authorizes "defend with existing evidence, or
concede and route to `revise-synthesis`/`revise-explanation` if the
concession changes the packet" — and it **only consumes a reopen invocation
if it actually changes something.** Two real, honest outcomes are both
legitimate here, and the coordinator does not get to pick the flattering
one:

1. **Defend, no reopen.** The real
   [`synthesis.md:83`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/synthesis.md)
   already states this exact posture toward Attack 1, precisely enough to
   quote rather than paraphrase: *"partially concessive, not resolving.
   Step 4 declines exactly the state-machine work Attack 1 names as
   entrenching, which removes the attack's near-term bite. It does **not**
   settle the underlying claim, because the claim is about relative cost
   and no cost comparison was ever performed."* That is the honest answer
   to this exact turn: the riskiest part of what the challenge fears
   (cold-start coordination) was already declined, but whether even the
   three named bug fixes plus CI meaningfully entrenches the split is
   genuinely unresolved — nothing new has been argued on either side since.
   No `revise-*` dispatch, no reopen spent.
2. **Concede and reopen.** If the challenge surfaces something the panel's
   own ledger did not already carry (a reason the cost-comparison claim is
   wrong that no advisor stated — e.g. a real estimate of the hours either
   path would cost), THAT is what authorizes `revise-synthesis` — citing
   the human turn's own `reason` field, per the Known-Gaps workaround for
   `tsk-44p` (no schema-legal `human-turn:` ref exists in any `authorize`
   step's structured fields today). `grantedContextRefs` must name the
   real ledger the synthesizer is re-weighing — never `[]`, which is
   schema-legal but silently starves the reopen of every prior proposal,
   critique, and synthesis (verified live; see the how-to guide's own note
   and its committed proof evidence):

```json
{
  "kind": "declared-protocol",
  "objective": "Continue aap_mdview_example: bounded reopen per Turn 2's challenge.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_mdview_example",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "actors": [
    { "id": "synthesizer-actor", "executor": "claude-bwrap", "tier": "critical" }
  ],
  "steps": [
    {
      "type": "authorize",
      "as": "authRevise",
      "operationId": "revise-synthesis",
      "targetActorId": "synthesizer-actor",
      "authorizationId": "auth_revise_challenge_1",
      "invocationKey": "ik_revise_challenge_1",
      "reason": "Bounded reopen per human turn \"turn_2\": the person supplied a real hours estimate for the cost-comparison Attack 1's own settling evidence names, which no advisor's critique had.",
      "grantedContextRefs": ["<this session's real synthesize-recommendation assignmentId>", "<this session's real critique-proposals assignmentId>"]
    },
    {
      "type": "operation",
      "as": "revise",
      "operationId": "revise-synthesis",
      "targetActorId": "synthesizer-actor",
      "objective": "Re-weigh Attack 1's cost-comparison claim against the person's new hours estimate.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

The distinction that matters, stated plainly so a coordinator doesn't
default to reopening every challenge out of caution: **a challenge that
merely restates a disagreement the packet already visibly carries earns a
defense, not a reopen.** Spending a reopen on a challenge that changes
nothing is how a two-invocation budget gets burned on ceremony instead of
the genuinely new material it exists for.
