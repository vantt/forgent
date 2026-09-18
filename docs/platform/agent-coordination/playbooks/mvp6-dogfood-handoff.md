# MVP6+ Dogfood Handoff

Document type: Playbook
Design status: N/A (records a real, already-proven runtime path; invents nothing)
Implementation: Active for MVP3-MVP5 (produce/review/red-team/revise/recheck/close, resume); visibility windows/aggregation rules/deliberation memory/dynamic specialist pull-in are NOT implemented (see "Future Expansion" below)
Last reviewed: 2026-09-03
Canonical for: how a maintainer starts MVP6+ dogfooding (Agent Coordination coordinating its own plan/artifact review loops) through the real runtime/surface path — not a new design, not a runtime dependency

Related: [Coordination Operating Harness](coordination-operating-harness.md),
[Master Multi-Agent Implementation Coordinator](prompts/master-coordinator.md),
[Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../contracts/coordination-session.md),
[FlowDefinition Contract](../contracts/flow-definition.md),
[Thin Launcher Surface Readiness](../verification/step-09-group-thinking-mvp1-mvp2/thin-launcher-surface-readiness.md),
[Step 09 MVP3-MVP5 verification index](../verification/step-09-mvp3-to-mvp5/index.md),
[`docs/how-to/run-a-coordination-session.md`](../../../how-to/run-a-coordination-session.md),
[Step 09 Group Thinking Substrate proposal](../../proposals/step-09-group-thinking-substrate.md)

## Purpose

Step 09's plan states the intent directly: "After MVP5, Step 09 should be
able to dogfood its own substrate for MVP6+ design and implementation
coordination: a maintainer can give it a plan/artifact, get
Doer/Reviewer/Red-Team/Fixer/Recheck outputs through the runtime ledger, and
resume from persisted state"
(`plans/260903-1049-step09-mvp3-to-mvp5/plan.md:32-34`).

This document is that handoff. Every mechanism named below is real and
already proven by a closed cell in the `step-09-mvp3-to-mvp5` verification
track — never aspirational. Where something MVP6+ would eventually want does
not exist yet, it is named as a gap or as explicit future expansion, not
described as if it already works.

This replaces manual [Master Prompt](prompts/master-coordinator.md)
orchestration **only** for the narrow slice of work that fits the shipped
`standalone-master-coordination-loop` shape (produce → required
review+red-team → driver-authorized revise → driver-authorized recheck →
driver disposition → close). The Master Prompt harness remains the fallback
for everything else — see "What remains outside coordination authority"
below.

## 1. Input shape

A dogfood round is a JSON coordination request. Two request shapes exist
today, selected by `kind`; MVP6+ dogfooding uses `kind: "declared-protocol"`
against the frozen fixture:

- **Fixture id/version** (frozen, `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P00.1.md` §3
  "Fixture id/version"): `protocolRef.id:
  core.coordination-protocol.standalone-master-coordination-loop`,
  `metadata.version: 1.0.0` — read directly from
  `core/coordination-protocols/standalone-master-coordination-loop.yaml:35-37`.
  Four worker-only actors (`doer`, `reviewer`, `red-team`, `fixer`), no
  coordinator/driver actor inside the graph (yaml lines 14-17, 49-57).
- **Request steps.** A `declared-protocol` request carries an ordered
  `steps[]` array; each step's `type` reaches a specific engine door —
  `operation` → `dispatchDeclaredOperation`, `fan-out` →
  `dispatchResearchFanOut`, `authorize` → `authorizeDeclaredOperation`,
  `disposition` → `recordDriverDisposition`
  (`docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/thin-launcher-surface-readiness.md`
  "Request shape a launcher would emit" table). The whole loop as one such
  request is recorded verbatim in
  `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P04.1.md`
  §"R4's live proof" (the `part1.json`/`part2.json` split).
- **`$ref` resolution.** Every cross-step reference is a `$ref:<stepLabel>`
  (or `$ref:<stepLabel>.<actorId>` for a fan-out branch) placeholder,
  resolved by `run.mjs` against that run's own dispatched Assignment ids — a
  caller never guesses or templates a real Assignment id
  (`thin-launcher-surface-readiness.md` "Request shape" section). **This
  placeholder does not survive a call boundary**: `run.mjs`'s `labels` map is
  created fresh once per `runCoordinationUseCase` call, so a follow-up
  request naming a prior call's own Assignment id must substitute that id
  literally, not via `$ref` (P04.1.md §"R4's live proof", "No `$ref:` label
  survives a call boundary").
- **Trusted per-actor policy (`actors[]`).** A request may bind
  Persona/executor/model/tier per actor
  (`docs/how-to/run-a-coordination-session.md` "Trusted per-actor policy");
  this is the concrete, already-legal mechanism for routing Reviewer/Red-Team
  to the read-only-scoped `executors.claude-reviewer` executor and for
  escalating Red-Team to `critical` tier for one round
  (`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P03.1.md`
  "Final Intended Mapping" and "R4/R6" sections — both proven live by that
  cell's R8 dispatch tests, not merely described).
- **Driver identity.** `writerId` is a required top-level request field,
  never optional and never inferred (`src/verbs/coordination/schema.mjs`,
  cited in P04.1.md's Red-Team Recheck point 3). It is the identity every
  `authorize`/`disposition` step is pinned to, and — as of P04.1 — the
  identity a resumed request must match exactly (see §5 below).

## 2. Command/surface

Two real, already-shipped CLI entry points, both wired to the exact same
runtime door (`runCoordinationUseCase`, `src/verbs/coordination/run.mjs`) —
never a second/forked engine (`thin-launcher-surface-readiness.md`
"What already exists"):

- **`fgos coordination launch-master-loop --plan <path> --objective <text>
  --writer-id <id>`** — the thin composer for the fixture's REQUIRED first
  pass only (`produce-candidate` → `review-candidate` + `red-team-candidate`).
  It deliberately never emits an `authorize`/`disposition`/`revise-candidate`/
  `reviewer-recheck`/`red-team-recheck` step — every optional binding is
  driver-authorized, and authorizing one is a driver decision made after
  reading this run's own evidence, never a composer default
  (`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P02.1.md`
  §3 "Design Decisions Worth Recording"). This is the right and only tool
  for **starting** a dogfood round.
- **`fgos coordination run --file <request.json>`** — the general
  request-file door. This is the right tool for **every round after the
  first**: authorizing a revision, dispatching the revision, authorizing a
  recheck, dispatching the recheck, and recording a driver disposition, all
  against the SAME `coordinationId` the launcher opened. P04.1's own live
  proof used this door specifically because
  `launch-master-loop`'s composer "intentionally only composes the FIRST
  PASS ... and never authorizes/dispositions anything ... so it cannot
  express R4's resume-through-an-authorized-round scenario"
  (P04.1.md §"R1/R2 — the live scenario and how it's started"). Hand-author
  the follow-up request the same way P04.1's `part2.json` did (see §5 below
  for the exact shape).

Both commands are documented mechanically, with real example request files,
in `docs/how-to/run-a-coordination-session.md`.

## 3. Expected roles

Four worker roles, matching the fixture's own `spec.actors[]`
(`standalone-master-coordination-loop.yaml:49-57`), each mapped to a real
dispatch policy proven live by
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P03.1.md`
("Final Intended Mapping" table and R8 dispatch-proof tests):

| Role | Operation(s) | Fixture-declared floor |
|---|---|---|
| Doer | `produce-candidate` | `minTier: standard` |
| Reviewer | `review-candidate` (+ `reviewer-recheck`) | `minTier: analytical` |
| Red-Team | `red-team-candidate` (+ `red-team-recheck`) | `minTier: analytical`, escalatable per-round to `critical` via `assignmentPolicy`/`cliPolicy`/`actors[].tier` |
| Fixer | `revise-candidate` (driver-authorized) | `minTier: standard` |

**Recheck is not a fifth actor.** `reviewer-recheck` and `red-team-recheck`
are Reviewer's and Red-Team's own operations at the graph's
`phase-recheck` node (`standalone-master-coordination-loop.yaml:150-159`),
both `driver-authorized` — the same two actors performing a second,
authorized pass over the Fixer's revision, not a distinct role. Every
operation in this fixture dispatches structurally read-only
(`isReadOnlyMode: true`, `mutation: 'read-only'`, unconditional for every
role — P03.1.md R1 finding #3), so Reviewer/Red-Team/Recheck never need a
git-write grant to produce their own RunResult.

## 4. Expected artifacts

Every worker output is a real Assignment/Run/RunResult with evidence refs —
no synthetic or narrated-only output. P04.1's live two-call resume proof
produced exactly this shape end to end:

- 6 Assignments (`asgn_<writerId>_op_001`–`op_006`), each with its own
  `.fgos/assignments/<assignmentId>/runs/01/agent-report.md` +
  `agent-result.json`, linked via `result-linked`
  (P04.1.md §"R3 — evidence path").
- 3 `operation-authorized` events (one per driver-authorized binding
  actually authorized this round), each with a distinct `invocationKey`
  and `authorizationId`.
- 2 `driver-disposition-recorded` events (`rejected` then `accepted` in
  P04.1's own scenario), each carrying `targetRef`/`evidenceRefs`.
- `fgos coordination show <coordinationId> --json` renders all of the
  above for a stranger with no chat history: `status`, `phase`,
  `assignmentRefs`, `authorizations` (each `consumed: true/false`),
  `ignoredAuthorizations` (an authorization written after the session
  already closed — reported, never hidden), `dispositions` (each
  `postTerminal: true/false`, each ref marked `...OwnedBySession`), and
  `pendingDriverAuthorizations` (every declared `driver-authorized`
  operation with no matching authorization yet — `null` for an agent-led
  session) (`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P02.2.md`
  §2 "Design Decisions"; live output reproduced in P04.1.md
  §"`fgos coordination show`, after both calls (R7)").
- **Recheck lineage is not rendered as a guaranteed edge.** The
  `assignments[].authorizationId → authorizations[].targetArtifactRef` join
  is best-effort and artifact-revision-scoped, not a hard
  original→recheck pointer (`P00.1.md` §3 "Artifact ref behavior", restated
  by `docs/how-to/run-a-coordination-session.md` "`fgos coordination show`").
  A future MVP6+ renderer must not present it as more precise than this.

## 5. Resume command

The exact mechanism P04.1 built and live-proved
(`src/verbs/coordination/run.mjs:130-146`, `findExistingManifest`):

1. Compose a follow-up `kind: "declared-protocol"` request naming the SAME
   `coordinationId` the first call opened (or `launch-master-loop` opened,
   since it forwards `--coordination-id` through the same door) and the
   SAME `writerId` as the original open.
2. Run it through `fgos coordination run --file <followup.json>`.
3. `run.mjs` resolves the existing manifest via `resumeSession` instead of
   opening a new session, and every step in the follow-up request's
   `steps[]` reaches the identical dispatch/authorize/disposition doors a
   fresh-open request would — zero new call sites, zero duplicate
   Assignment, zero reconsumed `invocationKey`, zero lost disposition
   (P04.1.md §"R4 — the resume gap, confirmed, and the fix").

```bash
fgos coordination run --file part2.json   # same coordinationId, same writerId as part1.json
```

**The writerId-identity constraint (hard, non-optional).** A resumed
request's `writerId` MUST equal `manifest.provenanceRoot.writerId` exactly,
or the request is refused before any step dispatches:

```text
coordination run: writerId "<x>" is not the driver identity of session
"<id>" (its provenanceRoot.writerId is "<y>") -- a resumed request may only
dispatch under the session's own driver/provenance-root identity
```

This gate was added specifically to close a real, live-reproduced session-
hijack primitive (P04.1's own Red-Team HIGH-1: a foreign-`writerId` resumed
request could dispatch and consume the original driver's authorizations
under a spoofed identity) and is confirmed-resolved by an independent
Red-Team recheck and Reviewer recheck (P04.1.md §"Red-Team Recheck",
§"Reviewer Recheck", both "Final verdict: APPROVE").

**No driver handoff exists.** There is no `replaceDriver`/provenance-transfer
path — a session opened by writer A can only ever be resumed, authorized, or
dispositioned by A
(`thin-launcher-surface-readiness.md` gap #4: "That is a product decision to
make before it becomes load-bearing, not a bug to route around"). MVP6+
dogfooding must run every round for one coordination session under the same
operator/process identity until a driver-handoff design is accepted — this
is a still-open limitation, not something MVP5 closed.

**Terminal sessions absorb, they don't reopen.** A third request against an
already-`completed` session is refused at the first regular dispatch call
(`fgos: session "<id>" is not active (status: "completed") -- cannot create
an Assignment`, P04.1.md §"Terminal-absorbing across the resume door too").

## 6. What remains outside coordination authority

Dogfooding MVP6+ coordinates **plan/artifact/review loops only**. Source,
worktree, and git mutation are explicitly not owned by this substrate after
MVP5:

- Plan text, verbatim (`plans/260903-1049-step09-mvp3-to-mvp5/plan.md:94-96`,
  Non-Negotiable Boundaries): "Do not claim Step 09 standalone coordination
  owns code mutation after MVP5. Dogfooding MVP6+ may use the substrate to
  coordinate plan/artifact/review loops, while source mutation remains under
  existing external tooling or later Coding/Work authority."
- Measured, not merely asserted: P04.1's live proof ran the whole two-call
  resume scenario inside a workspace that never had a `.git` directory and
  never touched `.fgos/state.json` (the Work state file) — `eventLines`/
  `stateView` (Work event log/state) identical before and after both calls
  (P04.1.md §"No Work / no git / no repo mutation, measured (R6)").
- `Coordination Foundation Baseline`'s own Accepted Invariants: "Work
  remains the sole delivery lifecycle authority... Coordination may
  reference Work as read-only context, but coordination verbs may not move
  Work status/stage, approve, merge, or mutate Work lifecycle."
- Practically: an MVP6+ dogfood round produces Reviewer/Red-Team verdicts
  and Fixer revisions as coordination Assignment evidence — a human (or a
  separate, already-existing Coding/Work-domain workflow) still has to read
  that evidence and actually apply/commit/merge any resulting change. This
  substrate does not do that step, before or after MVP5, and nothing in this
  handoff should be read as claiming otherwise.

## Future Expansion (not hidden prerequisites)

The following are named in the original substrate proposal
(`docs/architect/proposals/step-09-group-thinking-substrate.md`, framing
language only — not built) as later capability, not as something MVP6+
dogfooding needs before it can start:

- **MVP6 — visibility windows.** Fail-closed private-first-pass and
  post-independent-pass legality, with exact runtime authority still carried
  by `grantedContextRefs`. Anonymization and aggregate transformation remain
  deferred.
- **MVP7 — evidence-preserving aggregation.** One validated synthesis method
  with explicit source coverage, dissent, unresolved objections, omissions,
  failures, artifact revisions, and `consensus | qualified | no-consensus`
  outcome. Vote/rank/convergence remain deferred.
- **MVP8 — deliberation memory.** Artifact-backed `proposal`, `objection`,
  `response`, `clarification`, `rank`, and `specialist-request` contributions
  with replayable lineage, never mailbox/chat semantics.
- **MVP9 — bounded specialist pull-in.** Driver-authorized binding into a
  predeclared specialist slot. Arbitrary `addSessionEdge` and topology overlay
  remain deferred.

After MVP9, an external Group-Thinking Protocol Pack and Conformance Suite use
RFC-review-lite, Nominal-Group-lite, and Delphi-feedback-lite to prove the
public substrate. A thin `fgos-group-thinking` skill may launch those
definitions, but none of these layers owns session, visibility, aggregation,
or disposition truth.

None of these four block starting MVP6+ dogfooding through the path
described above — the produce/review/red-team/revise/recheck/disposition/
resume/show loop this document describes is already real and already
sufficient for a single-writer, single-session plan/artifact review round.
They are the next things Step 09 could build, not things it is secretly
missing today.

## Still-open limitations (name, don't hide)

Carried forward from `P04.1.md`'s own Gaps section, restated here because a
dogfooding maintainer will hit them directly:

- **No driver handoff / no multi-writer resume** (§5 above) — one operator
  identity per session, for the life of that session.
- **Resume-against-a-corrupted-session is proven by code inspection and by
  two regression tests (malformed JSON, missing `session.json`), not by
  every possible corruption shape** — both named shapes fail closed
  (P04.1.md LOW-1, CONFIRMED-RESOLVED via the Fixer's regression tests).
- **Concurrent resume of the SAME session by two independent writer-identical
  processes is real and held** (P04.1's Red-Team live two-process race,
  "Attempted and held — not a finding") — but only for the identical-writer
  case; a driver-handoff design would need its own concurrency proof.
- **Session-wide `aggregateBounds` fields other than `maxAssignments` are
  argued inert-on-resume by construction, not each individually tested**
  (P04.1.md Gaps, last bullet) — `partialPolicy`, `objective`,
  `primaryRole`, `workRef` all reuse the same `openParams`-only code path
  `maxAssignments` was tested through, but only `maxAssignments` has its own
  regression test.
- **The pre-existing self-heal-branch gap on session-wide caps under real
  concurrent dispatch** (`P00.1.md` Carried-Forward Gap #4, still open) is
  unrelated to resume specifically and was not re-attacked by this track.
- **A crash between session-directory creation and manifest write
  permanently bricks that exact `coordinationId`.** `openSession`
  (`store.mjs`) creates the session directory before writing
  `session.json`; a process killed in that narrow window (Ctrl-C, OOM,
  machine sleep, CI timeout) leaves a directory with no manifest —
  `P00.1.md` Carried-Forward Gap #15 (12/40 real SIGKILLs reproduced
  against this exact window in the MVP1/MVP2 predecessor track). `P04.1.md`'s
  own Red-Team "Broken/corrupted-session resume" section independently
  reproduced the same shape against the new resume door: `findExistingManifest`
  correctly reports `not-found` for a manifest-less directory, which falls
  through to `openStandaloneSession`, which then hits `EEXIST` on the
  already-existing directory and throws `"coordination session ... already
  exists"` — uncaught, no recovery path. This fails closed (no corruption),
  but is not recoverable: a dogfooding maintainer who hits this must abandon
  that `coordinationId` and start a new one, since §5's "resume" recipe
  above assumes a fixed `coordinationId` is always resumable. Not fixed or
  owned by any cell in this plan.
