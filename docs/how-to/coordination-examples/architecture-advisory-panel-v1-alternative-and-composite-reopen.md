# Example family: alternative and composite reopen

Neither real session to date used `request-alternative` or
`request-composition` — both worked examples below are constructed, grounded
in P01.2's real three shaped proposals so the mechanics are exercised
against real candidate material rather than invented options.

## Real starting material (P01.2)

Three independently shaped, genuinely different proposals reached the
person: **stay-thin-and-fix** (harden the launcher, keep the shell a thin
client), **stay-thin-smaller-path** (the same direction, deliberately
smaller scope), and **delete-entirely** (drop the shell). See
[`synthesis.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/synthesis.md)
for the real, full treatment of all three plus the critic's attacks against
each.

## `request-composition` — parts of two options combined

A realistic person turn against this real material:

> "What if we do the smaller-scope path, but still fix the four launcher
> bugs from the other proposal? I don't want the bigger investment, but I
> don't want to skip the concrete fixes either."

**Classification: `request-composition`.** Per the Decision Dialogue table,
this authorizes `revise-synthesis` with the composition as an **explicit
candidate** — never the coordinator quietly improvising the merge itself
outside the synthesizer's own dispatch:

```json
{
  "type": "human-turn",
  "as": "personTurn2",
  "turnId": "turn_2",
  "turnOrdinal": 2,
  "channel": "claude-code-chat",
  "artifactRef": "human/2-person.md",
  "externalRef": "claude-code-transcript:sess-1:uuid-2",
  "attributedTo": { "type": "person", "id": "the-user" }
},
{
  "type": "authorize",
  "as": "authRevise",
  "operationId": "revise-synthesis",
  "targetActorId": "synthesizer-actor",
  "authorizationId": "auth_revise_composite_1",
  "invocationKey": "ik_revise_composite_1",
  "reason": "Bounded reopen per human turn \"turn_2\": the person requested the smaller-scope path's scope combined with the launcher-fix proposal's concrete fixes -- an explicit composite candidate, not a coordinator-authored merge.",
  "grantedContextRefs": []
},
{
  "type": "operation",
  "as": "revise",
  "operationId": "revise-synthesis",
  "targetActorId": "synthesizer-actor",
  "objective": "Evaluate the requested composite (smaller-scope path's investment level + the launcher-fix proposal's four concrete fixes) as an explicit candidate against the existing ledger.",
  "expectedOutputs": ["agent-result.json (status, summary)"]
}
```

The synthesizer's own revised packet must name this candidate explicitly as
a composite of the two named proposals, evaluate it against the same
falsification/evidence discipline every other candidate got, and never
present it as if a shaper had proposed it that way from the start.

## `request-alternative` — an option nobody proposed

A different realistic turn against the same real material:

> "None of these three feel right. What about just replacing the desktop
> shell with a minimal, purpose-built Windows viewer instead of trying to
> fix or delete the current one?"

**Classification: `request-alternative`.** This names a genuinely new
solution class — not a variant of any of the three shaped proposals (it
isn't "stay thin," "smaller," or "delete"; it's "replace with something
narrower and platform-specific"). The Decision Dialogue table's own two
legal paths apply, and picking the wrong one is the actual judgment call
here:

- **If evaluable against the existing ledger** (the scout report and the
  critique already cover enough of the relevant ground — e.g., the scout
  already established the shell owns zero relocatable domain logic, which
  bears directly on "build something new instead"), `revise-synthesis`
  evaluates the alternative directly, same authorize/operation shape as
  above.
- **If it needs a genuinely fresh independent shaping pass** (the option is
  different enough that only a dedicated shaper, isolated from the other
  three, could produce a real candidate for it rather than a synthesizer's
  own after-the-fact sketch) — per Bounded Reopen Scope, that is a **new
  cell**, inheriting this session's `intake.md`/`scout-report.md`, exactly
  as shown in the
  [material-context reopen example](architecture-advisory-panel-v1-material-context-reopen.md).
  A synthesizer inventing a fresh shaper's voice inside `revise-synthesis`
  itself is never legal, regardless of how well-informed the coordinator
  feels — that fabrication is exactly what BOUNDS #7 exists to prevent.

**The judgment that matters:** "genuinely new solution class" does not
automatically mean "needs a new cell." The test is whether the existing
ledger already contains enough evidence to evaluate it honestly, not
whether it sounds architecturally different from what's already on the
table.
