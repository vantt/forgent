# Example family: alternative and composite reopen

Neither real session to date used `request-alternative` or
`request-composition` — both worked examples below are constructed, grounded
in P01.2's real three shaped proposals so the mechanics are exercised
against real candidate material rather than invented options.

## Real starting material (P01.2)

Three shapers, three independently dispatched proposals — but one shaper's
own proposal internally carries two named arms, and getting that structure
right matters for what a genuine cross-proposal composition can combine
(see the note at the end of this section):

- **System Shaper:** "Keep the desktop shell a thin client. Do not begin
  local ownership work now" — spend the reversible step on the four
  concrete launcher-coordination defects the scout found.
- **Alternative Shaper:** one proposal, two named arms —
  **primary: "Delete the Experiment"** (drop the shell entirely), and
  **fallback: "The Smaller Path / Launcher Fix"** (if deletion is
  unpalatable, fix only the cold-start race and the raw-bind-host bug,
  with an explicit reversibility trigger: "defer any architectural shift
  until a verifiable metric... proves that the HTTP daemon hop is an
  actual bottleneck").
- **Constraint Advocate:** "Keep Authority in the Daemon; Repair Desktop
  Attachment" — thin client, plus an explicit operating-boundary table
  naming who owns what (registry/render/search stay daemon-owned; window
  state and presentation stay desktop-owned) and a named connection-health
  deliverable: "show connecting, connected, and failed states with
  actionable diagnostics."

See
[`proposals/`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/proposals/)
for the real, full text of all three. **The corrected structure above
matters for `request-composition` below:** the alternative shaper's own
"Delete" and "Smaller Path" are two arms of ONE proposal, not two
independent shapers' work — combining them is not a cross-proposal
composition. The example below instead composes the alternative shaper's
own reversibility discipline with the constraint advocate's distinct,
separately-proposed connection-health deliverable — genuinely two shapers,
not two arms of one.

## `request-composition` — parts of two options combined

A realistic person turn against this real material:

> "I like the alternative shaper's discipline — don't invest further until
> a real latency number proves it's needed. But I also want the
> constraint advocate's connecting/connected/failed states now, so at
> least failures are visible while we wait for that number. Can we do
> both?"

**Classification: `request-composition`.** Per the Decision Dialogue table,
this authorizes `revise-synthesis` with the composition as an **explicit
candidate** — never the coordinator quietly improvising the merge itself
outside the synthesizer's own dispatch. `grantedContextRefs` must name the
real ledger — never `[]`, which is schema-legal but silently starves the
reopen of every proposal and critique it is meant to re-weigh against
(verified live; see the how-to guide's own note and its committed proof
evidence):

```json
{
  "kind": "declared-protocol",
  "objective": "Continue aap_mdview_example: record Turn 2 and request a composite candidate.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_mdview_example",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "actors": [
    { "id": "synthesizer-actor", "executor": "claude-bwrap", "tier": "critical" }
  ],
  "steps": [
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
      "reason": "Bounded reopen per human turn \"turn_2\": the person requested the alternative shaper's own reversibility trigger combined with the constraint advocate's own connection-health deliverable -- an explicit composite of two DIFFERENT shapers' proposals, not a coordinator-authored merge.",
      "grantedContextRefs": ["<this session's real shape-alternative-proposal assignmentId>", "<this session's real shape-constraint-proposal assignmentId>", "<this session's real synthesize-recommendation assignmentId>"]
    },
    {
      "type": "operation",
      "as": "revise",
      "operationId": "revise-synthesis",
      "targetActorId": "synthesizer-actor",
      "objective": "Evaluate the requested composite (alternative shaper's reversibility trigger + constraint advocate's connection-health states) as an explicit candidate against the existing ledger.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

The synthesizer's own revised packet must name this candidate explicitly as
a composite of the two named shapers' proposals, evaluate it against the
same falsification/evidence discipline every other candidate got, and
never present it as if a single shaper had proposed it that way from the
start.

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
