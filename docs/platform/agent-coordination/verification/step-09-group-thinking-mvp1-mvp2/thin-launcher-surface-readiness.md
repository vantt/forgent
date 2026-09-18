# Thin Launcher Surface Readiness (Phase 03 R7)

Document type: Verification note
Design status: N/A (records readiness, accepts nothing)
Implementation: Not started — deliberately
Last reviewed: 2026-09-03
Canonical for: nothing. This is evidence, not a design.

Cell: P03.2. R7's own requirement text is "document the future thin
launcher shape, but do not implement a skill/slash surface in this phase."
No skill file, slash command, or new CLI subcommand was created by this
cell. What follows is what a launcher would wrap, and what it would still
be missing on the day someone writes one.

## What already exists, and is what a launcher would call

| Surface | Entry point | Status |
|---|---|---|
| Run one coordination request end to end, synchronously | `fgos coordination run --file <request.json>` → `runCoordinationUseCase` (`src/verbs/coordination/run.mjs`) | shipped |
| Same door, in-process, for a headless caller | `runCoordinationUseCase(ctx, {requestObject})` — the headless adapter's own entry (`src/runner/coordination/headless-adapter.mjs`) | shipped |
| Read a session back for a stranger | `fgos coordination show <id> --json` → `showCoordinationUseCase` (`src/verbs/coordination/show.mjs`) | shipped, read-only by construction |

`run.mjs` is the ONLY place a request becomes engine calls. A launcher
must compose a request file and invoke that door — never open a session,
dispatch, authorize, or record a disposition on its own. Doing otherwise
would fork schema/planning/protocol/dispatch/evidence/recovery/quorum/
budget logic, which is exactly what the module's own header comment
forbids.

## Request shape a launcher would emit

A `kind: "declared-protocol"` request carries `protocolRef.id` plus an
ordered `steps` array. As of this cell, `steps[]` has four types:

| `type` | Reaches | Notes |
|---|---|---|
| `operation` | `dispatchDeclaredOperation` | One declared operation, synchronously awaited. |
| `fan-out` | `dispatchResearchFanOut` | Branches dispatch concurrently inside the engine. |
| `authorize` | `authorizeDeclaredOperation` | Issues one `operation-authorized` event for a `driver-authorized` binding. |
| `disposition` | `recordDriverDisposition` | Appends one `driver-disposition-recorded` ledger event. |

Every cross-step reference is a `$ref:<stepLabel>` (or
`$ref:<stepLabel>.<actorId>` for a fan-out branch) placeholder, resolved
by `run.mjs` against this run's own dispatched Assignment ids. A launcher
never needs to know, guess, or template a real Assignment id — which is
what makes a static request file able to express the whole loop.

Driver provenance is NOT a request field. `authorize`/`disposition` steps
derive `authorizedBy` from the request's own top-level `writerId`, because
the engine pins both events to the session's `provenanceRoot.writerId`. A
request that names `authorizedBy` is refused at the schema boundary rather
than accepted as a field with no independent effect.

The whole Master Coordination loop as one such request is recorded
verbatim in `P03.2.md`'s Commands section, and lives executably in
`test/verbs/coordination-run-live-proof.test.mjs`.

## What a launcher would still be missing

These are named so nobody builds a launcher on top of a hole. None is a
defect in what shipped; each is a surface that does not exist yet.

1. **No resume door.** `runCoordinationUseCase` always calls
   `openStandaloneSession`/`openDeclaredProtocolSession`. Re-running a
   request that names an existing `coordinationId` is refused at session
   open (`coordination session "<id>" already exists`) — fail-closed and
   correct, but it means the request door cannot continue an
   already-opened session. The engine's crash-resume/idempotency
   properties are real (proven in P03.1 and in `test/runner/
   coordination-driver-authorization.test.mjs`); they are simply not
   reachable from a request file today. A launcher that wants
   "authorize the next round tomorrow" needs a `run --resume <id>`-shaped
   door, or a request-level "attach to existing session" mode, first.
2. **`show` does not yet render the new event kinds.** Its return shape
   predates `operation-authorized`/`driver-disposition-recorded`; it
   reports `eventCount` and `assignmentRefs`, not authorizations,
   dispositions, or recheck history. `replaySession` already
   reconstructs `authorizations`/`assignments`/`results`/`dispositions`
   (P03.1 R4), so the data exists — but see the two constraints below
   before wiring it.
3. **Two constraints on any future disposition/recheck renderer**, both
   recorded as P03.2 preconditions in `index.md`'s forward notes and both
   still true after this cell:
   - Recheck lineage in `replaySession`'s shape is
     artifact-revision-scoped and best-effort (the
     `assignments[].authorizationId → authorizations[].targetArtifactRef`
     join), not a guaranteed original→recheck edge. A renderer must not
     present it as one.
   - A disposition's `targetRef`/`evidenceRefs` carry no session-scope
     check, and a post-terminal disposition reads indistinguishably from
     a legitimate one. Both are inert today because nothing reads them
     into a prompt or a gate. The moment a renderer puts them in front of
     a worker, `assertRefsOwnedBySession` belongs at that door first, and
     post-terminal records need marking rather than presenting.
4. **No driver handoff.** `authorizedBy.id` must equal
   `manifest.provenanceRoot.writerId`, so a session opened by writer A can
   only ever be authorized and dispositioned by A (P02.2's R8 ruling,
   inherited by `driver-disposition-recorded` in P03.1). A launcher run
   by a different operator/process than the one that opened the session
   cannot authorize anything in it. That is a product decision to make
   before it becomes load-bearing, not a bug to route around.

## Non-goals restated

No skill file, no slash command, no new CLI subcommand, no request-file
generator, and no launcher of any kind was implemented here. The one
change to the run surface in this cell is the two new request step types
above, added because without them the R5 live proof could not reach
`authorizeDeclaredOperation`/`recordDriverDisposition` at all.
