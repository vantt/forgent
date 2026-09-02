# How to run a coordination session with `fgos coordination`

`fgos coordination` is the public CLI onto fgOS's CoordinationSession
runtime: one or more agent actors working a bounded, read-only objective
together, either agent-led (a single primary investigator, optionally
proposing its own consult) or against a declared protocol (a fixed
topology of actors and operations, such as a request/response consult, an
independent research fan-out, or the multi-phase Group Cognition
framework).

## `fgos coordination run --file <request>`

Reads a JSON request file, opens a session, dispatches every declared step
synchronously (in V1, one CLI call runs the whole session to completion or
to its best-effort terminal state), attempts to close the session, and
prints an `fgos.v1` envelope reporting what happened.

```sh
fgos coordination run --file docs/how-to/coordination-examples/agent-led-request.json
```

Global trusted policy flags apply to every dispatch in the request unless
a more specific per-actor override is declared in the request file itself:

```sh
fgos coordination run --file request.json --executor claude --tier standard
```

- `--executor <id>` — prefer this executor id for every dispatch.
- `--model <id>` — prefer this model. Only honored for `kind:
  "agent-led"` requests; a `kind: "declared-protocol"` request that also
  sets `--model` (or a per-actor `model` field) is refused up front,
  because the declared-protocol dispatch path has no model-override
  channel today (see "Request file shape" below).
- `--tier <tier>` — minimum tier for every dispatch.

These three flags are the ONLY place global policy may be declared — the
request file itself may only bind PER-ACTOR policy (see `actors` below).
A request file that tries to declare a top-level `executor`/`model`/`tier`
field is rejected.

## `fgos coordination show <id> --json`

Read-only. Prints the session's current manifest, phase, and quorum
(which required actors are completed/failed/late/missing/replaced), plus
the raw event count — enough for a stranger to understand a session's
status without any prior chat history. Never mutates anything and never
has an external effect.

```sh
fgos coordination show coord_abc123
```

## Request file shape

A request has exactly two shapes, selected by `kind`:

### `kind: "agent-led"`

A single primary actor works one bounded task.

```json
{
  "kind": "agent-led",
  "objective": "...",
  "writerId": "your-identity",
  "primaryRole": "researcher",
  "task": {
    "expectedOutputs": ["..."],
    "evidenceRequired": "reported"
  }
}
```

See `docs/how-to/coordination-examples/agent-led-request.json`.

### `kind: "declared-protocol"`

A fixed topology of actors dispatches through a sequence of `steps`, each
either a single `"operation"` (one actor) or a `"fan-out"` (several
independent actors dispatched concurrently, then optionally synthesized).
`protocolRef.id` references an already-registered `CoordinationProtocol`
FlowDefinition by id — it can never carry inline protocol content.

A step may reference an earlier step's own dispatched Assignment with a
`"$ref:<label>"` placeholder (`"$ref:<label>.<actorId>"` for a specific
fan-out branch) — the real Assignment id is only known once dispatch
actually happens, so this is how a request chains steps together without
guessing ids ahead of time.

Three real, published examples, using the protocols already registered
under `core/coordination-protocols/`:

- `docs/how-to/coordination-examples/declared-consult-request.json` — the
  simplest declared protocol: one requester, one consultant, one round
  (`core.coordination-protocol.declared-consult`).
- `docs/how-to/coordination-examples/research-protocol-request.json` — an
  independent research fan-out/fan-in: two researchers work in isolation,
  then a coordinator synthesizes their findings
  (`core.coordination-protocol.independent-research-fan-out-fan-in`).
- `docs/how-to/coordination-examples/group-cognition-framework-request.json`
  — the full 6-phase Group Cognition framework: divergent exploration,
  clustering, adversarial critique, evidence review, convergent synthesis,
  and a final recommendation-with-dissent
  (`core.coordination-protocol.group-cognition-framework`).

### Trusted per-actor policy (`actors`)

A request may bind a declared SessionActor to Persona/executor/model/tier
policy:

```json
{
  "actors": [
    { "id": "consultant-actor", "executor": "claude", "tier": "standard" }
  ]
}
```

`actors[].id` must already be declared by the protocol being used (for
`kind: "declared-protocol"`) or must be `"primary"` (for `kind:
"agent-led"`) — a request cannot invent a new actor. `actors[]` can never
carry a `role` field (Role responsibility is fixed by the protocol/domain,
never rewritten by a request) and can never bind the same actor id twice.
An actor that only ever appears inside a `"fan-out"` step's `branches` is
allocated by the protocol's own cohort planner, which accepts no
per-branch policy override — a request that tries to set one there is
refused rather than silently ignored.

## What gets rejected, and why

`fgos coordination run` validates the request file against a strict
boundary (`src/verbs/coordination/schema.mjs`) before it ever reaches the
session engine. Every one of these is a validation error (exit code 4),
never a silent acceptance:

- an unknown field, at any nesting level;
- inline protocol content inside `protocolRef` (only `{id}` is a
  reference; anything else is portable concrete infra);
- an `actors[].id` that is not already declared by the protocol/session
  being opened (an unregistered actor override);
- an `actors[]` entry carrying `role` (an actor-role rewrite);
- the same actor id bound more than once (undeclared actor multiplicity);
- any `mutation` field set to anything other than `"read-only"` (the
  whole CLI surface is read-only in V1);
- any field carrying Work lifecycle authority (`approve`, `merge`,
  `claim`, `workStatus`, and similar — a coordination session can never
  move, accept, approve, claim, return, or merge Work, per ADR-001);
- an id-shaped field (`coordinationId`, `taskKey`, a step label, an actor
  id) containing anything outside the safe filesystem charset
  (letters/digits/underscore/hyphen) — closing off path escape;
- a top-level `executor`/`model`/`tier` field in the request file (that
  authority belongs to the CLI's own flags, never a portable request-file
  field — a CLI/file conflict).

## Related

- `docs/architect/agent-coordination/contracts/coordination-session.md` —
  the CoordinationSession manifest/event contract this CLI drives.
- `docs/specs/runner.md` §"CoordinationSession — điều phối agent
  Work-độc-lập" — the platform spec summary.
- `src/runner/coordination/headless-adapter.mjs` — the headless/
  programmatic door onto the exact same engine calls this CLI uses
  (`runCoordinationHeadless`), for a caller that already has a request
  object in memory and wants the result returned directly instead of
  printed.
