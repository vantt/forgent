# Example family: material-context reopen

Grounded in a real turn —
[P01.2 Turn 1](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/human/1-person.md)
— but this file's own second half is a deliberate, disclosed rewrite: the
real session ran on the **manual playbook**, before this protocol existed,
and the manual playbook could reopen Phase 3 with a fresh dispatch. This
protocol's graph cannot. What follows is what actually happens to the same
real turn under the protocol this skill dispatches through today.

## The real turn

Answering the panel's own step-5 question ("did shell development stop
because the shell is abandoned, or because it's considered done?"):

> "anh bỏ quên, vì nhiều việc quá, chứ đó cũng là một feature đáng dùng."
> ("I forgot about it, because I had too much going on — but it's also a
> feature worth using.")

**Classification: `introduce-context` — a fact the panel didn't have.**
Neither of the panel's two hypothesized readings (abandoned vs.
working-as-designed) survives this sentence intact: the person named a
third state — valued, but genuinely unwatched — that neither shaper had put
on the board. This is real new material, not a restatement or a dispute of
an existing claim.

## What the manual playbook actually did (real, and no longer available as-is)

The real lead advisor's impact assessment found one cheap, concrete,
person-independent question this fact created: does the shell still build
and run against the CURRENT daemon? Both original shapers had assumed an
answer without checking. The driver authorized a **narrow reopen of Phase
3** — a fresh context-investigator dispatch, answering that one question —
and it found a real, live defect: a fresh daemon's one-time auth token is
printed to stdout, which the desktop shell discards, an unpassable login
wall for a first-time user. Read the real finding:
[`scout-report-followup-1.md`](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/scout-report-followup-1.md).

## What THIS protocol does with the same turn — the real, bounded difference

`phase-dialogue-reopen` offers exactly three operations:
`revise-synthesis`, `revise-explanation`, `close-dialogue`. There is no
operation that re-dispatches the context investigator. Record the turn the
same way regardless of what it turns out to need:

```json
{
  "kind": "declared-protocol",
  "objective": "Continue aap_mdview_example: record Turn 1 and evaluate the bounded reopen.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_mdview_example",
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

Then the coordinator faces a real fork, and must be honest about which side
of it this turn is actually on:

**If the new fact is integrable from the existing ledger** — the
synthesizer can incorporate it into a revised recommendation using what's
already been argued plus the turn's own content, without needing a fresh
independent investigation. **`grantedContextRefs` must name the real
ledger — never `[]`.** An empty grant is schema-legal and dispatches
without error, but it hands the synthesizer none of the proposals, none of
the critique, and not even its own prior synthesis — silently
contradicting the very sentence that follows it ("re-weighted against it").
Confirmed live: an authorization with `grantedContextRefs: []` produces a
real Assignment whose own `contextGrant.refs` is empty, while the correct
shape below produces a `contextGrant.refs` array naming all seven prior
Assignments (see the how-to guide's committed live-proof evidence). The
three placeholder-shaped ids below stand for this session's own real
`synthesize-recommendation`/`critique-proposals`/`assess-constraints`
assignmentIds — substitute the real ones `fgos coordination show
aap_mdview_example --json` reports before dispatching:

```json
{
  "kind": "declared-protocol",
  "objective": "Continue aap_mdview_example: bounded reopen of the synthesis.",
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
      "authorizationId": "auth_revise_1",
      "invocationKey": "ik_revise_1",
      "reason": "Bounded reopen per human turn \"turn_1\": the person named a third state (valued-but-unwatched) neither original hypothesis covered; the existing ledger's three candidates can be re-weighted against it without a fresh shaper pass.",
      "grantedContextRefs": ["<this session's real synthesize-recommendation assignmentId>", "<this session's real critique-proposals assignmentId>", "<this session's real assess-constraints assignmentId>"]
    },
    {
      "type": "operation",
      "as": "revise",
      "operationId": "revise-synthesis",
      "targetActorId": "synthesizer-actor",
      "objective": "Re-weigh the three candidates against the valued-but-unwatched state, using the granted ledger.",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

This consumes one of the synthesizer's two `revise-synthesis` invocations.
`actors[]` is repeated here because it does not persist from the opening
call (see the how-to guide's own note) — dropping it would silently
dispatch the synthesizer through the global default executor instead of
the confined roster.

**If the new fact genuinely requires fresh investigation** — as it did for
real here, since "does the shell still build against the current daemon"
is a scout-answerable question no amount of re-reasoning over existing
evidence can settle — `revise-synthesis` must **not** fabricate that
investigation's answer. Per `SKILL.md`'s own Bounded Reopen Scope: record
in `dialogue/1-response.md` that the new material needs a fresh independent
pass, and open a **new cell** — a new `coordinationId`, a fresh
`phase-framing` entry, explicitly inheriting this session's own
`intake.md`/`scout-report.md` as context rather than re-litigating them:

```json
{
  "kind": "declared-protocol",
  "objective": "Follow-on cell: does the desktop shell still build and run against the current daemon? Inherits intake.md/scout-report.md from aap_mdview_example.",
  "writerId": "coordinator-driver",
  "coordinationId": "aap_mdview_example--followup-1",
  "protocolRef": { "id": "core.coordination-protocol.architecture-advisory-panel-v1" },
  "aggregateBounds": { "maxRounds": 20, "maxAssignments": 30 },
  "actors": [
    { "id": "context-investigator-actor", "executor": "codex-readonly", "tier": "analytical" }
  ],
  "steps": [
    {
      "type": "operation",
      "as": "investigate",
      "operationId": "investigate-context",
      "targetActorId": "context-investigator-actor",
      "objective": "Does the desktop shell still build and run against the current daemon, or has it drifted since its last real change? (inherited context: aap_mdview_example's own intake.md/scout-report.md)",
      "expectedOutputs": ["agent-result.json (status, summary)"]
    }
  ]
}
```

Every opening request in this guide declares `aggregateBounds` — this one
included, even though a single-operation session like this one is nowhere
near the platform's default 10-round cap. The discipline is the request
shape, not a per-example risk judgment: a reader who extends this new-cell
pattern with more phases inherits a request that already raises the cap,
rather than rediscovering the same blocking bug the how-to guide's own
note describes.

**Said to the person plainly, every time this fork resolves the second
way:** "a full re-run of [the scout check] needs a new session; here is
what the panel can tell you today without one." This is the accurate
picture of what V1 bounds — a real, deliberate narrowing from the manual
playbook, not an oversight the person should have to discover by reading
source.
