# How to use the `fgos-group-thinking` skill

Three pre-registered coordination protocols — RFC-Review-Lite,
Nominal-Group-Lite, Delphi-Feedback-Lite — reachable through one gate,
`fgos-group-thinking`, that adds exactly one thing over the plain
`fgos coordination run --file` door: you must name an already-registered
protocol id before anything runs. It never selects, infers, or defaults a
protocol for you.

This guide is deliberately example-driven. Every request file below is a
real, committed, end-to-end-tested example (`docs/how-to/coordination-examples/`)
— not a sketch. Protocol semantics live in the FlowDefinition YAMLs
themselves (`core/coordination-protocols/group-thinking-*.yaml`), never in
this guide's own prose; read the skill's own `SKILL.md`
(`core/skills/fgos-group-thinking/SKILL.md`) for the full mechanism and the
five bypasses it structurally cannot allow.

## Before you start: see what's registered

```bash
node -e "
import('./src/verbs/coordination/group-thinking-pack.mjs').then(({ loadProtocolPack }) => {
  console.log(JSON.stringify(loadProtocolPack(), null, 2));
});
"
```

Three members today: `core.coordination-protocol.group-thinking-rfc-review-lite`,
`...nominal-group-lite`, `...delphi-feedback-lite`. Never hand-author a
protocol id that isn't in this list, even if a loadable FlowDefinition
exists elsewhere — pack membership is a real narrowing, not a restatement
of what `protocol-loader.mjs` can find.

## The multi-call pattern (why this matters)

RFC-Review-Lite and Nominal-Group-Lite each have a **driver-authorized**
phase — a step the driver must explicitly authorize before it can
dispatch, gated behind a visibility window that only opens once earlier
work settles. That means **the session correctly stays open across two or
more separate calls**: you cannot always finish these protocols in one
shot, and the engine will tell you so (`closed: false`, with `quorum.missing`
naming exactly who still owes work). Delphi-Feedback-Lite has no
driver-authorized phase, so its full six-step chain runs in a single call.

This "launch, resume" pattern is exactly what a real kernel bug in this
platform used to break — a session could silently, permanently close
after an actor's *first* settled step, even with real work still declared
and pending. That bug is fixed (see
`docs/architect/agent-coordination/contracts/coordination-session.md`'s
"Multi-Operation Quorum Completion" section for the full mechanism); the
examples below exercise the fix directly, not around it.

## 1. RFC-Review-Lite — independent objections, controlled reveal, response

**Shape:** a coordinator convenes, a proposer proposes, two objectors
raise independent objections (neither can see the other's objection until
both have settled — a real privacy gate, not a suggestion), then the
driver authorizes the proposer to respond to both together.

**Call 1** — settle the proposer and both objectors; record their
contributions as deliberation-ledger lineage. Stops here: `respond` is
driver-authorized and cannot dispatch yet.

```bash
fgos coordination run --file docs/how-to/coordination-examples/group-thinking-rfc-review-lite-request.json
```

Check what's still owed:

```bash
fgos coordination show coord_rfc_review_example --json
```

`quorum.missing` names `proposer-actor` — it has a settled `propose`, but
its own `respond` binding (gated behind the `reveal` window, which just
opened) is still pending. This is the multi-operation quorum rule working
as intended, not a stall.

**Call 2** — a genuinely separate, later call, naming the SAME
`coordinationId`. Fill in the two objection `assignmentId`s from call 1's
own result (`docs/how-to/coordination-examples/group-thinking-rfc-review-lite-resume-request.json`
ships with placeholder strings for both — replace them with call 1's real
output before running) — the driver authorizes and grants read access to
both objections together, the proposer responds, the response is linked
as a `response`-typed contribution (`respondsTo` the primary objection,
`anchors` the other), and the driver records a disposition:

```bash
fgos coordination run --file docs/how-to/coordination-examples/group-thinking-rfc-review-lite-resume-request.json
```

The session closes naturally at the end of this call — every gating
binding (`propose`, both `object`s, `respond`) is now settled.

```bash
fgos coordination show coord_rfc_review_example --json
```

Replay shows four contribution-typed lineage records: the proposal, both
objections, and the response — each with its own `respondsTo`/`anchors`
chain, reconstructable from nothing but the session's own event log.

## 2. Nominal-Group-Lite — private proposals, controlled share, clarification, private rank

**Shape:** three participants privately propose (none sees another's
proposal), the facilitator shares all three together once, the driver
authorizes clarification, then each participant privately ranks the
clarified set. No tally or winner is computed by this protocol — ranking
is captured, never scored.

**Call 1** — three private proposals, then the driver authorizes and
dispatches `share`:

```bash
fgos coordination run --file docs/how-to/coordination-examples/group-thinking-nominal-group-lite-request.json
```

The session stays open: `clarify` (facilitator, driver-authorized, gated
behind the `clarified` window `share` just opened) and all three
`private-rank` bindings (required, gated behind `ranking-open`, which
`clarify` will open) are still pending.

**Call 2** — resume the same session (fill in `share`'s real
`assignmentId` from call 1's result into
`group-thinking-nominal-group-lite-resume-request.json`'s own placeholder):
authorize and dispatch `clarify`, then all three participants privately
rank, each ranking linked as a `rank`-typed contribution.

```bash
fgos coordination run --file docs/how-to/coordination-examples/group-thinking-nominal-group-lite-resume-request.json
```

The session closes at the end of this call.

## 3. Delphi-Feedback-Lite — private round-1, mediated aggregate, bounded round-2

**Shape:** a facilitator convenes, two panelists give independent
round-1 answers, the facilitator produces one mediated, evidence-
preserving aggregate (never attributing a specific answer to a specific
panelist), then both panelists give a round-2 answer informed by that
aggregate. `maxRounds: 2` is a hard structural cap, not a convention — no
proposal operation can be requested a third time. No anonymity or
statistical-convergence claim is made by this protocol; it captures
round-2 revision, nothing stronger.

No phase here is driver-authorized, so the whole chain runs in **one
call**:

```bash
fgos coordination run --file docs/how-to/coordination-examples/group-thinking-delphi-feedback-lite-request.json
```

This example also demonstrates **per-actor provider customization** —
the request's own `actors[]` block:

```json
"actors": [
  { "id": "panelist-a", "executor": "codex-cli" },
  { "id": "panelist-b", "executor": "agy-cli" }
]
```

Nothing in this whole request path collapses different actors onto one
hardcoded provider. `panelist-a` dispatches through `codex-cli`,
`panelist-b` through `agy-cli`, `facilitator-actor` through whatever
default the CLI's own `--executor` flag or this repo's `.fgos/config.json`
resolves — Claude, Codex, and Antigravity genuinely collaborating as
different actors within the same session. Add `model`/`tier`/`persona` to
any `actors[]` entry the same way; give each step naming that actor an
explicit `targetActorId` (already true in every example above) — the pack
gate never reads or rewrites `actors[]`, so this works exactly as it
would for a hand-authored `fgos coordination run --file` request.

## Reading replay, always

```bash
fgos coordination show <coordinationId> --json
```

Never mutates anything. Reports the manifest, phase, quorum (who's
completed/missing/late), every authorization and disposition (with
session-ownership marks — a ref pointing at a *different* session's
Assignment is flagged, never silently trusted), and — via replay
reconstruction — every contribution-typed lineage record this session has
linked. This is how you check what's still owed before writing a resume
request, and how you verify a closed session's full deliberation trail
without reading raw event-log JSON by hand.

## What each protocol deliberately does NOT claim

- **RFC-Review-Lite**: no general comment/thread service — every piece of
  reasoning is one of the closed contribution types (`proposal` /
  `objection` / `response`), never a free-form thread.
- **Nominal-Group-Lite**: no tally, no winner, no scoring — ranks are
  captured as `rank`-typed contributions, never aggregated into a result.
- **Delphi-Feedback-Lite**: no strong anonymity guarantee beyond "the
  aggregate doesn't attribute a specific answer to a specific panelist,"
  and no statistical-convergence claim — `maxRounds: 2` bounds the
  protocol, it doesn't measure whether opinions converged.

If you need vote/rank-tally/weighted-scoring, anonymization, or arbitrary
topology overlays, those are explicitly-named deferred capabilities (see
`docs/architect/proposals/step-09-group-thinking-substrate.md`'s own
Implementation note) — not silently missing, not something to route
around by hand-composing a request that pretends otherwise.

## Related

- `core/skills/fgos-group-thinking/SKILL.md` — the skill's own real
  contract: the exact gate mechanism, the five bypasses it cannot allow,
  and why.
- `docs/architect/agent-coordination/contracts/coordination-session.md` —
  "Multi-Operation Quorum Completion" and "Group-Thinking Protocol Pack"
  sections: the full proof trail for everything this guide demonstrates.
- `docs/how-to/run-a-coordination-session.md` — the underlying
  `fgos coordination run`/`show` CLI this skill is a thin gate in front
  of; read this first if the request-file shape itself (steps, `$ref:`
  chaining, `actors[]`) is unfamiliar.
- `docs/how-to/coordination-examples/group-thinking-*.json` — every
  example this guide references, real and independently validated
  end-to-end through the pack gate before being committed.
