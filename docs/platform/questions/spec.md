# Questions Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for the questions a session sends to the owner: how one is asked, stored, answered, received and cancelled, and where the owner sees them all
Design status: Settled in docs/discussions/owner-questions/DISCUSSION.md (OQ-D1..D7, 2026-11-18); planned in plans/261118-1159-owner-question-store (QP-1..QP-23)
Implementation: Spec and contracts only (plan phase 1). No crate, verb, hook or route exists yet
Canonical: Yes for the scope below, from the day the plan lands
Owner: Questions component (proposed)
Source (planned): packages/questions/rust (crate fgos-questions)
Contracts: packages/questions/contracts/ and packages/questions/rust/observe-kinds.json
Provenance: docs/discussions/owner-questions/DISCUSSION.md and plans/261118-1159-owner-question-store/plan.md at 4f8243230 (2026-11-18)
Writer type: Agent draft writer
Canonical for: The question entity, its states, its Event Store consumer, its verbs, who may answer, ack and cancel, its refusals, its events and its receipt hook
Use this when: Asking, answering or listing owner questions, or changing how a session learns an answer
Do not use this for: Workflow gates or `fgos ask` items (Work layer), waking an idle asker (supervisor plan), measuring owner wait (Observe)
Last reviewed: 2026-11-18
Related:
- docs/discussions/owner-questions/DISCUSSION.md
- plans/261118-1159-owner-question-store/plan.md
- docs/platform/event-store/spec.md
- docs/platform/identity/spec.md
- docs/platform/observe/spec.md
- docs/platform/session-host/spec.md
- core/skills/_shared/decision-question.md
```

## 1. Purpose and owned decisions

A session (shaper, lead, supervisor, planner, a Workflow step) sometimes needs the owner to decide. The question must be
written once, with its five parts, with who asked and when; the owner must see and answer every open question in one
place; and the asking session must learn at its next stop point that its own question was answered.

This component owns:

| Decision | Owner here |
|---|---|
| The question record and its five parts | the question shape (section 2, `questions-input.v1.json`) |
| Who asked | filled in by the door from Identity or a head's envelope; never a caller field |
| The state of a question: open, answered, acked, cancelled | the fold (section 3) |
| Who may answer, ack and cancel | section 5 |
| The list of open questions | `fgos questions` (section 4) |
| The receipt of an answer by the asker | the hook (section 8) |

It does not own: the origin text (a discussion's `QUESTIONS.md`, a plan's question section, a gate keep the lasting
copy and receive the answer back); the wake-up of an idle or gone asker (supervisor plan); Workflow gates and
`fgos ask` (Work layer; read beside the list, not folded); measurement (Observe); session identity or roles (Identity).

## 2. Shared entities

| Entity | Fields | Contract |
|---|---|---|
| Question | `id` (`q-...`, minted by `fgos identity mint question`), `askedAt`, `asker{sessionId, handle, roles, persona?, pane?, machine}`, `stage`, `ref{value, branch, commit}`, `headline`, `blocks`, `parts{what, cause, options[{label, does, gain, harm, cost, recommended?}], recommendation, scope{allows, forbids}}`, `migrated`, `supersedes?` | payload of `question.asked`: `packages/questions/contracts/question-event-payloads.v1.json` |
| Answer | `id`, `option?`, `text?` (at least one), `by`, `via?`, `answeredAt` | payload of `question.answered` |
| Ack | `id`, `by`, `at` | payload of `question.acked` |
| Cancel | `id`, `by`, `reason`, `at` | payload of `question.cancelled` |

- The `ask --input` shape is `packages/questions/contracts/questions-input.v1.json`. It is the rule authority for the
  door: every measurable limit is data there (headline one line, at most 120 characters; `what` and `cause` at most
  600 characters each; 2-4 options; a `label` of at most 60 characters; exactly one option recommended; `scope.allows`
  and `scope.forbids`; `blocks` present). The guide carries the rules a program cannot measure.
- Discovery exception: options and the recommendation may be empty when `stage` is `discovery` or `exploring`, when the
  ref is a `discussion:` ref and `stage` is `shaping`, or when the question is `--migrated`. Never on a caller flag.
- `--ref` is one of `discussion:<topic>#Q<n>`, `plan:<dir>[#phase-<nn>]`, `case:<runId>[#<gate>]`. It is checked in the
  caller's own checkout (the cwd worktree, or a head's worktree from its envelope) and recorded with its branch and commit.
- The asker's `machine` is recorded so a watcher on machine A acts only on its own machine's askers.
- A question has two homes: the origin keeps the lasting text and receives the answer back; the store is the one source
  for the list and for the events. The store is a log, not state (L1).

## 3. Store

- The store is the Event Store consumer `questions` (`packages/event-store/contracts/consumers.v1.json`), with the
  stream contract `packages/questions/contracts/question-event-streams.v1.json`: four types, `domain: questions`,
  `scope: project`, `schemaVersion: 1`, `sealOnWrite: true`. Each write is sealed at once and leaves at the store's
  next push.
- The crate holds a port `QuestionLog`; the host wires it to the `StoreLogDoor` adapter Identity already uses. The
  crate writes no adapter of its own. Every list is a fold over a read.
- **Fold.** Each id has one state: `open` (asked), `answered`, `acked` or `cancelled`. `answered` needs `open`;
  `acked` needs `answered`; `cancelled` needs `open` or `answered`; a later record that does not fit is ignored by the
  fold and refused by the verb.
- **Cross-machine conflict rule.** `answer` refuses a second answer with `question-already-answered` against the local
  read. When two machines answer before they sync, the fold keeps the first answer in the Event Store's causal order
  (the reader's order, never a wall clock) and shows the other as a conflict on `show`.
- **Per-machine view** `.fgos/cache/questions.json` holds the fold. The verb rewrites it after every write and every
  read of the stream, and `fgos events sync` makes any `questions` call refresh it. The hook reads only this file, which
  a confined head can read; when it is missing, the hook prints nothing. Nothing else is cached.
- **Linux only.** The Event Store runs on Linux only (`docs/platform/event-store/spec.md`, section 22). On every other
  platform each `fgos questions` verb refuses with `event-store-unsupported-platform`. This is an owner question, not a
  silent limit.

## 4. Verbs

| Verb | Effect |
|---|---|
| `fgos questions [list] [--all] [--answered] [--json]` | One line per question: headline, recommended option, `blocks`, age, answer command; a "needs you" count first. Open gates and `fgos ask` items appear beside the store's questions through the doctor bridge request `work-questions`, fail-open (`work-sources: unavailable <reason>`). `--open` is not accepted. |
| `show <id>` | The five parts, each option's cost, the asker's handle and role, any conflict. |
| `ask --ref <ref> --input <file\|-> [--migrated] [--supersedes <id>]` | Checks shape and ref, fills the asker, mints the id, appends `question.asked`, returns the id. `--supersedes` cancels the old question with reason `superseded:<new id>`. |
| `answer <id> [--option <label>] [--text <t>] [--source <s>]` | Appends `question.answered` once. `--source` is the caller's route (`secretary`, `gateway:<caller>`) and is kept as `via`. |
| `ack <id>` | Appends `question.acked`. |
| `cancel <id> --reason <t>` | Appends `question.cancelled`. |

**Head-socket verbs.** A confined head reaches the door through its request socket: `questions ask`, `questions ack`
and `questions cancel` for every head, `questions answer` for the secretary only. They are declared in
`packages/run-supervisor/contracts/head-request.v1.json` and served by the host's internal route, which reads the
trusted envelope itself; the asker comes from the envelope and cannot be forged. Inside a head, the CLI forwards write
sub-verbs through the existing head client, retrying a `busy` answer up to 3 times, 1 s apart. Reads go straight to
the store.

## 5. Who may answer, ack and cancel

| Action | Allowed |
|---|---|
| answer | only the owner: refused with `answer-not-owner` when an agent CLI is among the caller's process ancestors (a walk of the process tree matching the kernel names of the known agent CLIs; env is never read). Exceptions: the secretary head answers through its socket with `--source secretary`, and `by` is the owner; the detached gateway and a terminal with no agent ancestor pass as the owner |
| ack, cancel | the asker session; any session holding the same `head:` role (a rotated successor, or a successor started with the gone asker's role); any head session for a question whose asker held no `head:` role or which is `migrated` |

**The owner rule guards against mistakes, not attack.** It stops an agent answering in the owner's place by accident. It
is not a security boundary: a determined local process can still reach the store.

## 6. Refusals

Each refusal is a stable code with an exit category from `packages/host-runtime/contracts/exit-codes.v1.json`
(`packages/questions/contracts/refusals.v1.json`): `asker-unresolved`, `ref-invalid`, `parts-incomplete`,
`question-unclear` (names the field and the rule), `question-unknown`, `question-already-answered`,
`question-not-open`, `answer-not-owner`, `not-asker`, and the Event Store refusals the verbs pass through
(`event-store-unsupported-platform`, `event-store-no-repository`, `event-store-lock-timeout`, `event-store-integrity`,
`event-store-io`).

## 7. Events

- The four store events of section 3 are the only writes.
- **Observe sees them as a record source, not as a second write.** The crate projects the Event Store fold into records
  of the kinds `fgos.question.asked`, `answered`, `acked` and `cancelled`, declared in
  `packages/questions/rust/observe-kinds.json`, with the question id as subject. Attrs carry the asker's session,
  handle, role, persona, pane and machine, the origin ref, `answeredAt`, `by` and `via`. An Observe write would stay on
  the machine that answered and keep a second copy; the projection reads what has synced.
- The detection `question-answered` (answered and not acked, an anti-join over this source) is defined later in
  a planned query definition file under core/questions (plan phase 5); the action belongs to the supervisor plan.

## 8. Hook

`fgos hook questions` writes nothing and exits 0 always. It reads the per-machine view only.

- `UserPromptSubmit`: one context line for each answered question of this session that has no ack.
- `Stop`: only when `stop_hook_active` is false, it blocks once, listing only answered questions whose notice is not
  yet in the session's transcript; after one notice later stops pass.
- "This session" means the session id or the same `head:` role. The session writes the answer back to the origin, then
  runs `ack`. Doctor rows `*-hook-wired` judge the wiring.

## 9. Boundaries

| With | Boundary |
|---|---|
| Observe | Observe owns measurement and the kind registry. Questions declares its kinds and exposes a record source; it never writes a record. Owner wait is measured by ops-metrics |
| Identity | Identity mints `q-` ids, resolves the asker, holds roles, and owns the agent-ancestry check. Questions never reads env to learn who called |
| Event Store | Event Store owns durability, seal, sync, locks and the platform limit. Questions registers one consumer and imports nothing from other consumers |
| Session Host | Session Host owns placement; the pane is read when available and shown only, never used to wake. The head request socket carries the head-verbs |
| Supervision | The supervisor plan owns the watcher, the action table and the successor session; it acts on `question-answered` minus `acked`, own machine only |
| Workflow | Gates and `fgos ask` stay as they are, listed beside the store through the bridge. Folding them waits for the Work layer |

## 10. Non-goals

Folding `fgos ask`, gates, `src/state/decision-question.mjs` and the `AskUserQuestion` hook into this door; answering
gates from the dashboard; the watcher and supervisor; mailbox, nudge and pane typing; owner-wait measures; instant
sync between machines.

## 11. Lịch sử quyết định

Settled in [DISCUSSION.md](../../discussions/owner-questions/DISCUSSION.md) section 4; planned in
[plan.md](../../../plans/261118-1159-owner-question-store/plan.md).

| Id | Decision | Where it lands here |
|---|---|---|
| discussion §4, decision 1 | Open questions live in an operating store; the origin keeps the lasting copy and receives the answer back | sections 2, 3 |
| discussion §4, decision 2 | A Rust component of its own, outside Observe; append-only | section 3 (storage half superseded by QP-2: Event Store, not Observe shards) |
| discussion §4, decision 3 | The asker is filled by the verb; the caller gives a checked `--ref` | sections 2, 4 |
| discussion §4, decision 4 | One place to view and answer: `fgos questions` and S04; gates and `fgos ask` read beside it | sections 4, 5 |
| discussion §4, decision 5 | Receipt by hook at `UserPromptSubmit` and `Stop`; then write back and `ack` | section 8 |
| discussion §4, decision 6 | Waking is not a question verb; `fgos.question.answered` and the detection feed the supervisor | section 7 |
| discussion §4, decision 7 | Cutover: re-ask open questions once as `migrated`; retire the markdown reader | section 2 (`migrated`), plan phase 9 |
| QP-1 | New area, spec, rows, crate and contracts | this file, `component-boundary.md`, `governance.md` |
| QP-2 | Event Store consumer `questions`, four sealed project-scope types, Linux only | section 3 |
| QP-3 | Ids from `fgos identity mint question` | section 2 |
| QP-4 | Fold states; first answer in causal order wins; who may ack and cancel | sections 3, 5 |
| QP-5 | Structured input, one parser, `questions-input.v1.json` is the rule authority | section 2 |
| QP-6 | Asker from Identity or the head envelope; `asker-unresolved` otherwise | sections 2, 4 |
| QP-7 | Ref forms, checked in the caller's own checkout | section 2 |
| QP-8 | Observe record source, not a second write | section 7 |
| QP-9 | Verb surface; `--open` removed | section 4 |
| QP-10 | Gates and `fgos ask` through the doctor bridge, fail-open | section 4 |
| QP-11 | Receipt hook, reads the view, blocks once | section 8 |
| QP-12 | Detection with `asker.machine` | section 7 |
| QP-13 | Cutover re-ask with `--migrated` | sections 2, 5 |
| QP-14 | S04 and gateway routes; no MCP answer binding; `via` from `--source` | section 4 (`--source`) |
| QP-15 | `cancel` and `--supersedes` | section 4 |
| QP-16 | Owner-only answer by ancestry; mistakes, not attack | section 5 |
| QP-17 | `recommended` option; `--option` and/or `--text` | sections 2, 4 |
| QP-18 | Events, hook line and `show` name handle and role | sections 4, 7, 8 |
| QP-19 | Measurable shape rules as data; `question-unclear` names field and rule | section 2 |
| QP-20 | Layered reading: one line, then five parts | section 4 |
| QP-21 | Miu batches at most 5; guide gains "make it easy to answer" | plan phase 9 |
| QP-22 | Heads reach the door through the request socket | section 4 |
| QP-23 | Per-machine view `.fgos/cache/questions.json` | section 3 |

Settled facts recorded while writing the contracts:

- The discovery exception is the union of what QP-19 and the phase 1 brief name (stages `discovery` and `exploring`;
  `shaping` on a `discussion:` ref; `migrated`), so each source still holds.
- Exit categories reuse the existing table; `question-unknown` is `not-found`, `question-already-answered` and
  `question-not-open` are `conflict`, input faults are `validation`, identity and ownership faults are `precondition`.
