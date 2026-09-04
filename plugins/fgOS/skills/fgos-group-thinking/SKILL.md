---
name: fgos-group-thinking
user-invocable: false
description: >-
  Launch, resume, or render replay for a group-thinking coordination
  protocol -- one registered in the group-thinking Protocol Pack
  (`core/protocol-packs/group-thinking.json`). Never selects, infers, or
  defaults a protocol on its own: the caller must explicitly name a
  pack-registered protocol id before anything runs. Use when a person or
  work item asks to start or continue an RFC-review, nominal-group, or
  Delphi-feedback-style coordination round through the group-thinking pack.
  Examples: "run the rfc-review-lite protocol for this proposal", "resume
  coordination session coord_xyz", "show me the replay for this
  group-thinking session".
---

# fgos-group-thinking

A thin selection gate in front of the SAME public coordination doors
`fgos coordination run`/`fgos coordination show` already expose
(`src/verbs/coordination/{run,show}.mjs`). This skill adds exactly one
thing those doors do not have on their own: a caller must explicitly name
a protocol id that is a **registered member of the group-thinking Protocol
Pack** before any request naming that protocol is allowed to run. It never
composes a coordination step on a protocol's behalf, never decides what a
protocol does, and never talks to the session store directly — see
[`src/verbs/coordination/group-thinking-pack.mjs`](../../../src/verbs/coordination/group-thinking-pack.mjs)
for the one gate function this whole skill is built on
(`runGroupThinkingRequest`).

Protocol semantics live in the FlowDefinition documents themselves
(`docs/architect/agent-coordination/contracts/flow-definition.md`), never
in this file — reading a protocol's own declared graph, not this skill's
prose, is how you learn what RFC-Review-Lite, Nominal-Group-Lite, or
Delphi-Feedback-Lite actually do.

## 1. See which protocols are registered

```bash
node -e "
import('./src/verbs/coordination/group-thinking-pack.mjs').then(({ loadProtocolPack }) => {
  console.log(JSON.stringify(loadProtocolPack(), null, 2));
});
"
```

An empty `members: []` means no protocol is registered yet — there is
nothing this skill can run against. Never guess or hand-author a protocol
id that is not listed here, even if it happens to be a real, loadable
`CoordinationProtocol` FlowDefinition elsewhere in this repo; pack
membership is a real narrowing on top of `protocol-loader.mjs`'s own
project/domain/core discovery, not a restatement of it. Every id/version
pair here names an already-registered FlowDefinition `metadata.id@version`
— this pack never assigns a protocol a second identity of its own.

## 2. Read the protocol's own declared shape

```bash
node -e "
import('./src/runner/definitions/protocol-loader.mjs').then(({ loadCoordinationProtocol }) => {
  console.log(JSON.stringify(loadCoordinationProtocol(process.argv[1]), null, 2));
});
" -- "<protocol id from step 1>"
```

Learn its declared actors, operations, activation modes, and graph from
this output — never from this skill's own text, which deliberately does
not enumerate them (Phase 10's own constraint: "do not hide protocol
semantics in skill prose").

## 3. Compose a request

Build a request object/file in the exact shape `fgos coordination run
--file` already accepts
([`src/verbs/coordination/schema.mjs`](../../../src/verbs/coordination/schema.mjs)):
`kind: "declared-protocol"`, `protocolRef: {id: "<the id you selected in
step 1>"}`, `writerId`, `objective`, and one `operation` / `authorize` /
`disposition` / `fan-out` step per action, following that protocol's own
declared graph from step 2. `$ref:<label>` placeholders resolve within one
call only — a resumed request needs the earlier call's real assignment ids.

**Per-actor provider/tier is a first-class part of this request shape —
never one hardcoded provider for the whole session.** Add an `actors[]`
entry per actor that needs a non-default choice: `{id, executor?, model?,
tier?, persona?}` — e.g. `{id: "reviewer-actor", executor: "codex-cli"}`
alongside `{id: "red-team-actor", executor: "agy-cli"}` lets Claude,
Codex, and Antigravity collaborate as different actors within the SAME
session (all real, registered `cli-spawn` executors in this repo's own
`.fgos/config.json`). Give each `operation`/`fan-out` step naming that
actor an explicit `targetActorId` — `run.mjs`'s own per-actor resolution
(`actorPolicyFields`) only looks up `actors[]` when a step names its actor
explicitly. This gate never reads or rewrites `actors[]`; it only checks
`kind`/`protocolRef.id` before forwarding the whole request unchanged (see
the Gate section below) — a request can bind whatever per-actor executors
it needs, exactly as a hand-authored `fgos coordination run --file`
request already could.

## 4. Launch or resume

```bash
node -e "
import('./src/verbs/coordination/group-thinking-pack.mjs').then(async ({ runGroupThinkingRequest }) => {
  const result = await runGroupThinkingRequest(
    { cwd: process.cwd(), repoRoot: process.cwd() },
    { protocolId: '<protocol id from step 1>', requestPath: '<path to your request.json>' },
  );
  console.log(JSON.stringify(result, null, 2));
});
"
```

`protocolId` is required, and must equal the request's own
`protocolRef.id` — an unset, unregistered, or mismatched id is refused
before anything dispatches (see the Gate section below). A request naming
an **existing** `coordinationId` resumes that session through the exact
same door (`run.mjs`'s own resume behavior, `findExistingManifest`) — this
skill adds no separate resume mechanism of its own.

## 5. Render replay

```bash
fgos coordination show <coordinationId> --json
```

Public replay is the existing `fgos coordination show` command,
unmodified — this skill renders nothing of its own and hides nothing
`show.mjs` already reports (authorizations, dispositions, aggregations,
specialist bindings, pending driver authorizations, dispositions'
session-ownership marks).

## The gate, and why it holds

`runGroupThinkingRequest` is the **only** function this skill ever calls
to dispatch or resume anything, and it does nothing but: (1) refuse when
no `protocolId` is given; (2) refuse when `protocolId` is not a member of
the pack registry, or the registered definition's version has drifted
from what the pack pinned; (3) refuse when the request's own
`protocolRef.id` disagrees with the selected `protocolId`, or the request
is `kind: "agent-led"` (no bound protocol to gate); (4) forward the
untouched request straight into `runCoordinationUseCase`
([`run.mjs`](../../../src/verbs/coordination/run.mjs)) — the exact door
`fgos coordination run` and the headless adapter already use, with zero
altered fields. Everything after that point is `run.mjs`'s own,
already-proven behavior; nothing here reimplements or forks it.

This is why the five bypasses a later cell (P10.5) must prove impossible
do not need special defensive code in this skill — the door it calls
never exposed them as caller-invocable actions in the first place:

- **Switch protocols silently.** There is no default or inferred protocol
  anywhere in this chain. `protocolId` is a required, explicit parameter,
  checked against the pack registry AND the request body before anything
  runs — an unset or disagreeing id is refused, never guessed.
- **Bypass grants.** `run.mjs`'s `authorize` step type dispatches through
  `authorizeDeclaredOperation`, the same mediated door every hand-authored
  request already uses, with the same context-grant enforcement. This
  skill adds no second grant path — it only forwards the request object.
- **Validate its own aggregate.** `run.mjs`'s public request vocabulary
  has exactly four step kinds: `operation`, `authorize`, `disposition`,
  `fan-out`. None of them calls `validateSessionAggregation` or any other
  aggregation-validation door — that capability simply is not reachable
  through this surface.
- **Authorize a specialist.** For the same reason: no step kind reaches
  `authorizeSpecialistSlot` / `recordSpecialistAuthorization`. Specialist
  authorization is not in `run.mjs`'s public request vocabulary at all.
- **Close a session directly.** `runCoordinationUseCase` always attempts
  `closeSessionByQuorum` as its own last, automatic step, gated by the
  engine's own quorum/aggregation rules. There is no separate "close" step
  or door this skill (or any request through this door) can invoke to
  force a close outside that gate.
