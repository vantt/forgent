---
contract: plan-v1
title: "Owner-question store: one Rust door, also reachable from confined heads, to ask, answer, receive and cancel owner questions, with events, a receipt hook, one list and S04"
status: ready
priority: P1
blockedBy: []
footprint:
  - plans/261118-1159-owner-question-store/**
  - docs/platform/session-host/spec.md
  - docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md
  - docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml
  - docs/reading-map.md
  - docs/backlog.md
  - docs/architecture-manifest.json
  - docs/discussions/*/QUESTIONS.md
  - CHANGELOG.md
  - Cargo.lock
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/distribution/contracts/doctor-bridge.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/run-supervisor/contracts/head-request.v1.json
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/src/invocation_doors.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos/src/wiring/questions_hook.rs
  - apps/fgos/src/wiring/questions_hook_unsupported.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/src/wiring/metrics_sources.rs
  - apps/fgos/src/wiring/observe_sources/**
  - apps/fgos/src/wiring/head_questions.rs
  - apps/fgos/src/wiring/doctor/bridge.rs
  - apps/fgos/src/wiring/doctor/packaging.rs
  - apps/fgos/tests/questions_*.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/tests/**
  - apps/fgos-gateway/web/src/api/**
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx
  - core/skills/**
  - domains/coding/skills/**
  - .agents/skills/**
  - .agents/hooks.json
  - .claude/skills/**
  - .claude/settings.json
  - .codex/hooks.json
  - plugins/fgOS/skills/**
  - src/portfolio/open-questions.mjs
  - src/portfolio/plan-sections.mjs
  - src/setup/doctor-bridge.mjs
  - src/setup/agent-hooks.mjs
  - src/session-host/head-grants.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - src/session-host/head-start.mjs
  - src/cli/command-registry.mjs
  - bin/fgos.mjs
  - scripts/plan-contract-check.mjs
  - test/portfolio/**
  - test/cli/questions-verb.test.mjs
  - test/setup/**
  - test/session-host/**
  - test/rust-host/**
base: 570780a581227d42e3ab5cbbdbb47e9395848e57
source:
  - docs/discussions/owner-questions/DISCUSSION.md
  - docs/discussions/ops-metrics/DISCUSSION.md
  - plans/261117-1856-secretary-session-spine/plan.md
created: 2026-11-18
---

# Owner-question store

Design and every decision (OQ-D1..D7, plus OM-D11 and OM-D13 inherited):
[DISCUSSION.md](../../docs/discussions/owner-questions/DISCUSSION.md). Code facts checked at `base`:
[reports/scout-code-facts.md](reports/scout-code-facts.md). The independent validation and red team of the first draft
is in [reports/validation-redteam.md](reports/validation-redteam.md). This version answers every finding in it; the
answers are listed under "Review findings and answers".

## Outcome

Every question a session sends to the owner goes through one door, `fgos questions ask`. That includes a confined
head, which reaches the door through its request socket. The door gives the question an id, fills in the asker
itself, stamps `askedAt`, checks the five parts and the question's shape, and checks the origin ref against the
asker's own checkout. The question lives in the Event Store, so every machine sees it once the machines sync. That holds on Linux; owner
question Q1 covers the other platforms.

The owner sees every open question in one place, next to the open Workflow gates and `fgos ask` items, and answers
there: `fgos questions`, the S04 dashboard screen, or Miu, who batches them. Each question takes one line until it
is opened.

The asking session learns at its next stop point that its own question was answered. A head that has rotated learns
it through its role. The session writes the answer back to the origin, then acks. When the asker is idle or gone, the
supervisor plan's successor does this, woken by `fgos.question.answered` minus `acked`. The old markdown reader is
gone.

## Decisions taken by the planner

These are inside the settled frame. They are decided on evidence, not asked. Say so if one is wrong.

| id | decision | ground |
|---|---|---|
| QP-1 | New area **Questions**: spec `docs/platform/questions/spec.md`, a row in `docs/platform/component-boundary.md` and a holder row in `docs/platform/governance.md`, crate `packages/questions/rust` (`fgos-questions`), contracts in `packages/questions/contracts/` | a new area gets a spec before code (L5 q2); OQ-D2 makes it a component of its own, outside Observe; the area table is `component-boundary.md:82` |
| QP-2 | **The store is an Event Store consumer.** It is registered as consumer `questions` in `packages/event-store/contracts/consumers.v1.json`, with the stream contract `packages/questions/contracts/question-event-streams.v1.json`. The types are `questions.asked`, `questions.answered`, `questions.acked` and `questions.cancelled`, all `scope: project` and `sealOnWrite: true`, so each write is sealed at once and leaves at the store's next push (the Work types do the same). The crate keeps a port `QuestionLog`, and the host wires it to the existing `StoreLogDoor::open_stream` (`apps/fgos/src/wiring/identity_log.rs:56`), the adapter Identity already uses; the crate writes no adapter of its own. Every list is a fold over a read. **Platform:** the Event Store runs on Linux only (`docs/platform/event-store/spec.md:649`), so on macOS and Windows every `fgos questions` verb refuses with `event-store-unsupported-platform` (owner question Q1) | OQ-D2's storage half rested on "sync by git", but Observe shards never sync (round 1 H4). The Event Store is the one cross-machine door (`component-boundary.md:95`), and it has its own locks. OQ-D2's settled part still holds: a separate Rust component, outside Observe, append-only. Round 2 found the second adapter (M) and the missing sealing (M) |
| QP-3 | Ids come from `fgos identity mint question`, a new random kind with prefix `q` and no network | the id-minting law; `mint.rs:18-26,65-80` |
| QP-4 | The fold gives each id a state: open, answered, acked or cancelled. `answer` refuses a second answer with `question-already-answered` against the local read. When two machines answer before they sync, the fold keeps the first in the Event Store's causal order (the store's reader order, not a wall clock) and shows the other as a conflict. **Who may ack or cancel:**<br>- the asker session;<br>- any session holding the same `head:` role. This covers a rotated successor, and a successor the supervisor starts with the gone asker's role;<br>- any head session, for a question whose asker held no `head:` role or which is `migrated`.<br>No new role kind is added | OQ-D1, acceptance 2; round 1 H2, H3 and M8; round 2 H4: Identity accepts only `lead:`, `work:` and `head:` roles (`packages/identity/rust/src/directory.rs:37-41`), so `answers:<id>` is dropped. Asking the supervisor plan to start a successor under the asker's own role keeps the rule to one check |
| QP-5 | The five parts arrive structured. `ask --input <file\|->` takes JSON per `questions-input.v1.json`, and serde is the one parser. That contract is the rule authority for this door. `src/state/decision-question.mjs`, which still guards `fgos ask` and the `AskUserQuestion` hook, is folded later; the backlog row below covers it | OM-D13 "one parser"; red team M2 |
| QP-6 | The asker is filled from Identity:<br>- `current_session` gives `{id, handle}`;<br>- roles come from the directory entry;<br>- the persona comes from `FGOS_HEAD_PERSONA` as Identity reports it;<br>- the pane comes from Session Host placement when it can be read, and is used only for display;<br>- the machine id is recorded too (QP-12).<br>Through the head socket, the asker comes from the head's envelope (QP-22), so it cannot be forged. No flag sets the asker. A caller with no resolvable identity gets `asker-unresolved` | OQ-D3; round 1 C1, L4 |
| QP-7 | `--ref` takes one of `discussion:<topic>#Q<n>`, `plan:<dir>[#phase-<nn>]` and `case:<runId>[#<gate>]`. It is checked in **the caller's own checkout** (its cwd worktree, or the head's worktree from the envelope). The ref is recorded with its branch and commit | red team H6: draft plans and discussions live on branches until they land |
| QP-8 | **Question events reach Observe as a record source, not as a second write.** The crate exposes a `RecordSource` that projects the Event Store fold into records of the kinds `fgos.question.asked`, `answered`, `acked` and `cancelled`. Those kinds are declared in `packages/questions/rust/observe-kinds.json` and injected in `observe_declarations.rs`, and the source is registered in `apps/fgos/src/wiring/metrics_sources.rs`, the way ops-metrics registers its run projection. `fgos metrics query` and the definitions therefore read question events that have synced across machines, from one source of truth, without writing anything to Observe | round 2 H5: an Observe write would stay on the machine that answered. That breaks the wake (B answers, A's asker is never woken) and keeps a second copy (principle 7). OM-D13 says the verb emits the events "through the Observe write door". Its purpose, that ops-metrics can query owner wait, is met. The mechanism follows ops-metrics' own pattern for data owned elsewhere (its phases 8 and 11, sources). Reported, not asked |
| QP-9 | The native verb is `fgos questions [list] [--all] [--answered] [--json]`, with the sub-verbs `show <id>`, `ask`, `answer <id> [--option <label>] [--text <t>] [--source <s>]`, `ack <id>` and `cancel <id> --reason <t>`. A bare `fgos questions` lists the open questions. `--open` gets no alias (L10). Every caller moves:<br>- `head-start.mjs:97`, which already expects the bare verb (red team L3);<br>- the secretary skill;<br>- the reading map;<br>- `test/cli/questions-verb.test.mjs`, retired, with `apps/fgos/tests/questions_verb.rs` as the new owner.<br>The supervisor plan has already moved (`origin/plan/supervisor` `07a741621`) | OQ-D4, one door |
| QP-10 | Open Workflow gates and `fgos ask` items appear next to the store's questions through **a new request kind `work-questions` on the existing doctor bridge** (`apps/fgos/src/wiring/doctor/bridge.rs`, contract `doctor-bridge.v1.json`). The manifest names that bridge as the one bounded way a native verb reaches Node (`docs/architecture-manifest.json:1175`), and it already carries `work-store-init`. Its module `src/setup/doctor-bridge.mjs` gains the request: gates come from `readCaseProjection` (code moved from `open-questions.mjs`), and `fgos ask` items come from the Work view's awaiting-human list (existing reads). The read is fail-open: when it fails, the list prints `work-sources: unavailable <reason>` and still lists the store. The request extends a door that is due to retire (S7), so it retires with that door | red team M1. No Rust reader of the case projection exists (`case-projection.mjs:313`), and writing one would redesign the Work layer, which is on hold. Dropping gates would be a regression of today's `--open` |
| QP-11 | The receipt hook `fgos hook questions` writes nothing. It reads the per-machine view `.fgos/cache/questions.json` (QP-23), never the whole stream.<br>- On `UserPromptSubmit` it prints one context line for each answered question of this session that has no ack.<br>- On `Stop`, only when `stop_hook_active` is false, it blocks once, listing only the answered questions whose notice line is **not yet in the session's transcript** (`transcript_path`, readable in the sandbox). After one notice, later stops pass, so a reply such as Miu's to the owner is not followed by a forced turn.<br>- It exits 0 always.<br>"This session" means the session id, or the same `head:` role (QP-4). Rows go to Claude Code, and to each other CLI whose row builder has an equivalent event. The existing `*-hook-wired` doctor rows judge the wiring | OQ-D5; PS-9; round 1 C1, M9, M10; round 2 M (a whole-stream read on every prompt grows over time, and the mailbox keeps store reads out of its hook) and M (a forced turn after every reply) |
| QP-12 | The detection `core/questions/definitions/question-answered.query.json` returns answered questions that have no `acked` record, by an anti-join over the QP-8 source, with the OQ-D6 attrs plus `asker.machine`. The supervisor's watcher acts only on rows whose `asker.machine` is its own machine, so an asker on machine A is woken by A's watcher whichever machine answered | OQ-D6; round 1 M4; round 2 H5 |
| QP-13 | The cutover re-asks every open question through the verb with `--migrated`. The flag marks the record, and the asker is still resolved. Any head may ack a migrated question (QP-4) | OQ-D7 without breaking OQ-D3; red team M8 |
| QP-14 | S04 renders exactly what `GET /v1/questions` returns: store questions, `fgos ask` items and gates, each with its answer door. Store questions are answered through `POST /v1/questions/{id}/answer` and `fgos ask` items through the existing route. Gates show their `fgos workflow answer` command (the Work layer is on hold). S04 drops its own `listWork` call. **The gateway's MCP surface gets no answer binding.** The REST answer passes the gateway's existing `--source gateway:<caller>` (`gateway.rs:447,952`), which the record keeps as `via` | OQ-D4; round 1 M6, H1, L2; round 2 M: reuse `--source`, never a parallel `--via` flag |
| QP-15 | A `cancelled` record (`cancel <id> --reason`), and `ask --supersedes <id>`, which cancels the old question with reason `superseded:<new id>` | the fork `vantt/multica` (`reports/multica-decisions-lessons.md`) |
| QP-16 | Only the owner answers. `answer` is refused with `answer-not-owner` when an **agent CLI is among the caller's process ancestors**. A new Identity function `agent_in_ancestry(tree, pid)` walks the process tree with the existing `ProcessTree` port (`resolve.rs:199`) and matches the kernel command names of the known agent CLIs (claude, codex, agy, pi, omp; one list beside Identity's CLI table). It never reads env, so `env -u` does not get past it. The secretary head is the exception: it answers through its socket with `--source secretary`, and `by` is the owner. The detached gateway, which `fgos gateway start` reparents away from any agent, and a terminal with no agent ancestor pass as the owner. The spec says this rule **guards against mistakes, not attack** | the fork; OQ-D4; round 1 H1; round 2 H3: `ancestry_cli` only told pi from omp |
| QP-17 | An option may carry `recommended: true`. `answer` takes `--option` and/or `--text`. S04 preselects the recommended option | the fork; OQ-D4 |
| QP-18 | The `answered` event, the hook line and `show` name the asker's handle and role. The list prints a "needs you" count first | the fork's wake by naming the asker (`3df3e309`) |
| QP-19 | `ask` checks only **measurable** shape rules, held as data in `questions-input.v1.json`, and refuses with `question-unclear`, naming the field and the rule:<br>- `headline`: one line, at most 120 characters;<br>- `what` and `cause`: at most 600 characters each (counted in characters);<br>- 2-4 options, each with a `label` of at most 60 characters plus `does`, `gain`, `harm` and `cost`;<br>- exactly one option recommended;<br>- `scope.allows` and `scope.forbids` both present;<br>- `blocks` present.<br>Options and the recommendation may be empty only when `stage` is `discovery` or `exploring` (the Node checker's names) or the question is `--migrated`, never on a caller flag. The guide carries the rules a program cannot measure | the owner's request; `decision-question.md`; round 1 M3; round 2 M and L (stage names, cutover options) |
| QP-20 | Reading is layered. The list shows one line per question: `headline`, recommended option, `blocks` and age. `show` and S04 expand to the five parts, with each option's cost next to it | the owner's request; the fork's preselected radio |
| QP-21 | Miu batches at most 5 questions, ordered by `blocks`, then plan priority, then age, headline first. `decision-question.md` gains a "make it easy to answer" section: plain words in the owner's language, every term defined, the recommendation first, the cost in numbers, and what happens if the owner does not answer yet. Miu rewrites a question that breaks the guide before showing it | the owner's request; AGENTS.md priority #2 |
| QP-22 | **Confined heads reach the door through their request socket.** New head-request verbs are `questions ask`, `questions ack` and `questions cancel` for every head, and `questions answer` for the secretary only. They are declared in `head-request.v1.json` and granted through one shared list `QUESTION_VERBS`, next to `HEAD_VERBS` in `head-grants.mjs`. The run supervisor's socket only carries them. The payload entry `runHeadRequest` (`src/session-host/head-request.mjs:89`), which reads the trusted envelope, serves them by calling the host's internal route `fgos internal head-questions --run-dir <dir>`. Rust reads the envelope itself and runs the `fgos-questions` use case, with the caller filled from that envelope, so Node stays a thin caller and cannot forge the asker. Inside a head, the `fgos questions` CLI forwards write sub-verbs through the existing client (`head-request-client.mjs` on the Node side, `head_client::request_head` in Rust). It retries a `busy` answer up to 3 times, 1 s apart. Reads go straight to the store | round 1 C1; round 2 H2: the verbs run in a Node child, not in `head_request.rs` (`head_request.rs:1-8`) |
| QP-23 | One per-machine view `.fgos/cache/questions.json` holds the fold. The verb rewrites it after every write and every read of the stream, and `fgos events sync` makes any `questions` call refresh it. The watcher tick (supervisor plan) runs `fgos questions --json`, so answers fetched from another machine reach the view within one tick. The hook reads only this file, which a confined head can read; if it is missing, the hook prints nothing | round 2 M (hook cost, sandbox read). The consumer registry already allows a `cachePath` (`consumers.v1.json`, Work), and this view is the questions consumer's own. Nothing else is cached |

Not taken from the fork:
- a due date, which the fork never acts on;
- the 2-8 option cap, because the template says 2-4;
- a comment-triggered wake;
- a SQL table;
- Telegram buttons.

**Prior art reused:**
- the Event Store, its consumer registry and Identity's `EntryLog` port pattern;
- Observe's declaration registry and record sources (ops-metrics phases 1, 5 and 8) and its definition runner
  (phase 7);
- Identity `current_session`, the directory, the `ProcessTree` port and mint;
- the host's `StoreLogDoor`, the consumer `cachePath`, and Observe record sources (ops-metrics phases 8 and 11);
- the head request socket and grant table;
- the native hook kind pattern, and `stop_hook_active` as the mailbox adapters handle it;
- `agent_hooks.rs`;
- the doctor bridge and its `work-store-init` precedent;
- the gateway's `run_verb_blocking` and `require_token` `Caller`;
- `NeedsAnswer.tsx`.

The reader's history: `967101665` created `open-questions.mjs`, and `5c7cf3d13` fixed it.

**Missing, added here:**
- the question consumer and fold;
- the mint kind;
- the native verb and four head-socket verbs;
- the hook kind and its rows;
- the bridge request;
- the definition;
- the gateway routes.

## Acceptance criteria

1. `cargo test -p fgos-questions`, over an Event Store in a temp repo, shows that:
   - `ask` returns a `q-` id;
   - it records the asker (session id, handle, roles, persona), `askedAt`, stage, ref with branch and commit,
     `headline`, `blocks` and the five parts;
   - no input field sets the asker;
   - a bad ref, an unresolved asker, and one case for each QP-19 rule are refused by name.
2. The same suite shows that:
   - `answer` records `{option, text, by, via, answeredAt}` once, and a second answer gets
     `question-already-answered`;
   - two answers merged from two machines fold to the earliest, and the later one is kept as a conflict;
   - an agent caller gets `answer-not-owner`;
   - `ack` and `cancel` are accepted from the asker and from the same `head:` role (and from any head for a migrated
     question, or one whose asker held no head role), and refused from anyone else;
   - a caller whose process ancestry holds an agent CLI is refused `answer-not-owner` even with every session
     variable unset;
   - on a non-Linux target, every verb refuses with `event-store-unsupported-platform`;
   - `--supersedes` cancels the old question.
3. The same suite shows three things:
   - the record source projects each stored event into its `fgos.question.*` record, with the OQ-D6 attrs and
     `asker.machine`;
   - the view `.fgos/cache/questions.json` matches the fold after every write;
   - an event merged from another machine appears in the source and the view after a read.
4. `cargo test -p fgos --test questions_verb` shows that the list:
   - prints the "needs you" count first;
   - gives one line per question: headline, recommended option, `blocks`, age, answer command;
   - lists gates and `fgos ask` items through the bridge request on a fixture;
   - still lists the store when the bridge fails;
   - rejects `--open` as an unknown flag.
5. `cargo test -p fgos --test questions_hook`, on a fixture with two sessions and one rotation, shows that:
   - each session, and the rotated successor, is told only about its own answers;
   - `Stop` blocks once, and passes when `stop_hook_active` is true;
   - the hook writes no file;
   - after `ack` nothing is shown.
6. `cargo test -p fgos --test questions_head` and the session-host request test show three things:
   - a head's `questions ask` through `runHeadRequest` and `internal head-questions` records the envelope's role as
     the asker;
   - a shaper's `questions answer` is refused as not granted;
   - a `busy` socket is retried.
7. `cargo test -p fgos-questions --test definition_question_answered` returns one row per answered question with no
   ack.
8. The gateway tests show that REST answers record `via` from `--source gateway:<caller>` and that no MCP binding answers.
   `NeedsAnswer.test.tsx` shows all three sources without duplicates and preselects the recommended option.
9. `rg -n "open-questions|collectOpenQuestions|questions --open|sectionText" src bin core domains test docs/platform`
   finds nothing outside history text, and no open owner question is left without a `q-` id.
10. The gate is green on the combined tree:
    - `npm test` and `cargo test --workspace`;
    - `cargo clippy --workspace -- -D warnings`;
    - the msvc and `aarch64-apple-darwin` compile checks;
    - the gateway tests;
    - `node scripts/plan-contract-check.mjs --plan plans/261118-1159-owner-question-store`, run on the main checkout
      after landing (see "Contract check" below).

## Non-goals

- Folding `fgos ask`, Workflow gates, `src/state/decision-question.mjs` and the `AskUserQuestion` hook into this
  door. That happens when the Work layer resumes (backlog row `p-wgbzcazoak`).
- Answering gates from S04.
- The watcher, the action table, the supervisor, and starting a successor under the asker's head role. These belong
  to plan `261118-1045-project-supervisor`.
- Mailbox, nudge and pane typing.
- Owner-wait measures, which belong to ops-metrics phase 15.
- Instant sync between machines. Questions travel at the Event Store's sync pace.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Area spec, contracts, kinds](phase-01-spec-and-contract.md) | - | docs/platform/questions/**, docs/platform/component-boundary.md, docs/platform/governance.md, packages/questions/contracts/**, packages/questions/rust/observe-kinds.json | 1 | done |
| 2 | [Mint kind `question`, agent ancestry check](phase-02-mint-kind.md) | - | packages/identity/rust/src/mint.rs, packages/identity/rust/src/resolve.rs, packages/identity/rust/tests/**, packages/identity/contracts/identity.write.v1.json, docs/platform/identity/spec.md, core/instructions/id-minting.md | 1 | done |
| 3 | [Store crate and use cases](phase-03-store-crate.md) | 1, 2 | packages/questions/rust/src/**, packages/questions/rust/Cargo.toml, packages/questions/rust/tests/store_*.rs, packages/event-store/contracts/consumers.v1.json, package.json, Cargo.toml, Cargo.lock, docs/architecture-manifest.json | 2 | done |
| 4 | [Native verb, one list, retire the markdown reader](phase-04-native-verb.md) | 3 | apps/fgos/Cargo.toml, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/questions.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/observe_sources/**, apps/fgos/src/wiring/doctor/bridge.rs, apps/fgos/tests/questions_verb.rs, packages/distribution/contracts/doctor-bridge.v1.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, src/setup/doctor-bridge.mjs, bin/fgos.mjs, src/portfolio/open-questions.mjs, src/portfolio/plan-sections.mjs, scripts/plan-contract-check.mjs, src/session-host/head-start.mjs, test/portfolio/**, test/cli/questions-verb.test.mjs, test/rust-host/**, docs/architecture-manifest.json, packages/git/contracts/mutation-census.v1.json | 3 | draft |
| 5 | [Detection `question-answered`](phase-05-answered-definition.md) | 3 | core/questions/**, packages/questions/rust/tests/definition_*.rs, test/fixtures/questions/** | 3 | done |
| 6 | [Receipt hook](phase-06-receipt-hook.md) | 4 | apps/fgos/src/wiring/questions_hook.rs, apps/fgos/src/wiring/questions_hook_unsupported.rs, apps/fgos/src/routing.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/doctor/packaging.rs, apps/fgos/tests/questions_hook.rs, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/contracts/doctor-registry.v1.json, src/setup/agent-hooks.mjs, test/setup/**, .claude/settings.json, .codex/hooks.json, .agents/hooks.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, packages/git/contracts/mutation-census.v1.json | 4 | draft |
| 7 | [Gateway and S04](phase-07-gateway-s04.md) | 4 | apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/tests/**, apps/fgos-gateway/web/src/api/**, apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx, apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md | 4 | draft |
| 8 | [Head door: questions over the request socket](phase-08-head-door.md) | 6 | packages/run-supervisor/contracts/head-request.v1.json, src/session-host/head-grants.mjs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, test/session-host/**, apps/fgos/src/main.rs, apps/fgos/src/wiring/questions.rs, apps/fgos/src/wiring/head_questions.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/tests/questions_head.rs, docs/platform/session-host/spec.md, packages/git/contracts/mutation-census.v1.json | 5 | draft |
| 9 | [Cutover: re-ask, skills ask through the verb](phase-09-cutover-and-skills.md) | 6, 8 | docs/discussions/*/QUESTIONS.md, core/skills/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, packages/git/contracts/mutation-census.v1.json | 6 | draft |
| 10 | [Docs, backlog, integration gate](phase-10-docs-and-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9 | CHANGELOG.md, docs/backlog.md, docs/reading-map.md, packages/git/contracts/mutation-census.v1.json, packages/host-runtime/contracts/command-manifest.json, plans/261118-1159-owner-question-store/reports/integration.md | 7 | draft |

**What each phase really waits for (H9).** The plan as a whole is `draft` behind three blockers, because its later
phases share files with them. The phases themselves wait for less:
- Phase 1 is docs and contracts only, and its files are disjoint from every running or ready plan. It is `ready` and
  can start now.
- Phase 2 waits for session-verb phase 4, which rewrites `packages/identity/**`.
- Phase 3 waits for phase 2 and for Observe's landed record contract and query engine (ops-metrics phases 1 and 5).
- Phases 4 and later wait for S5 phases 10-12 and session-verb phase 5, which own `main.rs`, `routing.rs`, the
  registry and the head-request contract.
- Phase 5 waits for ops-metrics phase 7, the definition runner.

**Waves.**
- Wave 1: phases 1 and 2.
- Wave 2: phase 3.
- Wave 3: phases 4 and 5.
- Wave 4: phases 6 and 7.
- Wave 5: phase 8, alone, because it shares the census, `main.rs`, `wiring/mod.rs` and `wiring/questions.rs`
  with phases 4 and 6 (its internal route is a `main.rs` branch, not a public route).
- Wave 6: phase 9. It needs the hook and the head door, because the skills tell heads to ask and ack through the
  socket.
- Wave 7: phase 10.

**Hot files, one writer per wave.**
- `packages/git/contracts/mutation-census.v1.json` is regenerated, never hand-merged. Phases 4, 6, 8, 9 and 10 each
  regenerate it, one per wave, because each one changes pinned files and the census test is part of its gate.
- `routing.rs`, `command-routes.json`, `command-registry.mjs` and `command-manifest.json`: phase 4 (wave 3), then
  phase 6 (wave 4), then a final regeneration in phase 10. Phase 8 adds no public route.
- `apps/fgos/src/main.rs` and `wiring/mod.rs`: phase 4, then phase 6, then phase 8.
- `wiring/questions.rs`: phase 4, then phase 8.
- `docs/architecture-manifest.json`: phase 3, then phase 4.
- Skill renders: phase 9 only.
- `CHANGELOG.md`, the backlog and the reading map: phase 10.

**Footprint across plans.** The three blockers write overlapping files. The supervisor plan lists this plan in its
`blockedBy`, and its planner has agreed to the following. The agreement is recorded in its local branch `plan/supervisor`
(`31acf2896`, not yet pushed); its update for round 2 below is requested.
- use the bare verb;
- read definitions from `core/questions/definitions/`;
- pass the question id when it starts a successor.

Round 2 changes two points, and its planner has been told:
- a successor is started under the gone asker's own `head:` role, not with an `answers:<id>` role;
- the watcher acts only on `question-answered` rows whose `asker.machine` is its own machine (QP-12).

**Contract check.**
- By reading:
  - every phase sits in a later wave than each dependency;
  - footprints within a wave are disjoint: wave 1 is docs and contracts against Identity; wave 3 is
    `apps/fgos/**`, `src/**` and the census against `core/questions/**`, the definition tests and fixtures; wave 4 is
    the hook files against `apps/fgos-gateway/**` and the S04 docs.
- By script: the repo's own script refuses in a linked worktree (`git-addon-unavailable`, because the YAML door's
  addon belongs to the activated release). It was run on a scratch copy whose `readFrontmatter` parses with PyYAML,
  and it prints `ok`. It must run again with the real YAML door on the main checkout before `ready` (red team L6).

## Leader rules (every phase)

- Step 0 re-greps every input. Stop with `NEEDS_CONTEXT` when a finding changes a decision above.
- New code is Rust. Node is only a thin caller, with one exception: the bridge request in `doctor-bridge.mjs`, which
  moves existing Node reads (QP-10).
- Deleting a mechanism retires its tests in the same phase and names the test that now owns the behaviour
  (principle 8).
- Generated files are regenerated, never hand-merged.
- Tests run only through the repo's test runner. Check `git diff --stat` for unexpected deletions before every commit.

## Owner questions

**Approved by the owner on 2026-11-18. Q1 answer: A.** The plan stays `draft` only because its three blockers are
not done. Phase 1 is `ready`. Once the blockers land, the next planner or supervisor sets `ready` after the real
contract check.

### Q1: the questions door runs on Linux only (answered A, 2026-11-18)

1. **What is happening.** With the Event Store as the store, `fgos questions`, the hook, S04 and Miu's batches work
   only on Linux. On macOS and Windows they refuse by name. Today's markdown reader works everywhere, but it does not
   sync across machines and it cannot wake anyone.
2. **Cause.** The Event Store declares itself Linux only (`docs/platform/event-store/spec.md:649`): its seal crash
   matrix has never run on macOS or Windows (backlog `p-zsy3fmbcpd`). `fgos ask` and the whole Work layer already run
   on it, so they are Linux only today as well.
3. **Options.**
   - **A. Event Store, Linux only** (recommended). Questions sync across the three machines and wake the right
     asker. On macOS and Windows the verbs refuse until `p-zsy3fmbcpd` lands. Cost: none on top of this plan.
   - **B. A shard store per machine on every platform.** It works on macOS and Windows, but questions never cross
     machines. An answer given on machine B never reaches an asker on machine A, so the wake is lost. Cost: about
     the same as A, plus a second store to migrate later.
   - **C. A, plus doing `p-zsy3fmbcpd` first** (Event Store on macOS). Every platform syncs. Cost: an Event Store
     project of its own, several days, which pushes this plan back.
4. **Recommendation.** A. All of the owner's machines run Linux, and the Work layer has already accepted the same
   limit. Cross-machine sync and the wake are the reason this plan exists.
5. **Scope of the answer.** "A" allows the Linux-only limit for the questions door, written into its spec and
   CHANGELOG. It does not change the Event Store's support plan. Phases 1 and 2 do not depend on this answer.

Everything else is decided above on evidence. Moving the store from Observe shards to the Event Store (QP-2) changes the storage half of OQ-D2. The shaper set
that half on a premise that turned out false: shards were assumed to sync by git, and they do not. The analysis picks
the Event Store clearly, so the planner decided it and reports it here.

## Review findings and answers

These come from [reports/validation-redteam.md](reports/validation-redteam.md).

| finding | answer |
|---|---|
| C1 confined heads cannot write; Stop loop | QP-22 adds the head-socket verbs; QP-11 makes the hook write nothing and respect `stop_hook_active`; acceptance 5 and 6 |
| C2 shared lock contradicts acceptance 3 | QP-2 moves the store to the Event Store, which has its own locks; acceptance 3 is restated |
| H1 owner rule can be bypassed; gateway identity | QP-16 decides by ancestry and states it is not a security control; QP-14 has no MCP answer and records `via: gateway:<caller>` |
| H2 rotation | QP-4 and QP-11 match on the same `head:` role |
| H3 successor link has no owner | successor under the asker's head role (QP-4, round 2) |
| H4 no sync across machines | QP-2 moves the store to the Event Store |
| H5 supervisor plan out of step | agreed; local `31acf2896`, round 2 update requested |
| H6 ref checked on main | QP-7 checks the caller's checkout |
| H7, H8 footprints and generated files | the table and frontmatter are rewritten; the census is regenerated by each phase that changes pinned files, one per wave |
| H9 blocking on all of ops-metrics | the per-phase waits above; phase 1 is `ready` |
| M1 a second bridge | QP-10 uses the existing doctor bridge |
| M2 two validators | QP-5 names the authority; the fold is in backlog row `p-wgbzcazoak` |
| M3 rules that cannot be measured or can be gamed | QP-19 keeps only measurable rules, counts characters, and ties discovery to the stage |
| M4 no "not acked yet" | QP-8 adds the `acked` event; QP-12 anti-joins on it |
| M5 store inside Observe's directory | QP-2 |
| M6 S04 set and duplicates | QP-14 |
| M7 wrong area map | QP-1 |
| M8 migrated questions | QP-4 and QP-13 |
| M9 one block per question | QP-11 blocks once per stop |
| M10 duplicate doctor row | QP-11 uses the existing rows |
| L1 write door API | QP-8 now uses a record source instead of the write door |
| L2 MCP tools | QP-14 adds no MCP binding |
| L3 `head-start.mjs` bug | QP-9; a CHANGELOG note in phase 10 |
| L4 persona | QP-6 |
| L5 files that setup writes | added to phase 6's footprint |
| L6 contract check | see "Contract check" above |

### Round 2 ([reports/redteam-round2.md](reports/redteam-round2.md))

| finding | answer |
|---|---|
| H1 the Event Store is Linux only | QP-2 names the limit and the refusal; owner question Q1 |
| H2 head verbs are served by a Node child | QP-22: `runHeadRequest` calls the internal Rust route |
| H3 no agent ancestry check exists | QP-16: a new `agent_in_ancestry` over `ProcessTree` (phase 2) |
| H4 Identity refuses `answers:<id>` | QP-4: same `head:` role, no new role kind |
| H5 the wake reads unsynced Observe | QP-8 adds a record source over the synced store; QP-12 filters by `asker.machine` |
| M second store adapter | QP-2 reuses `StoreLogDoor` |
| M hook reads the whole stream; sandbox write | QP-23 view; the hook reads one file |
| M footprint gaps | `package.json`, `head-request*.mjs`, `resolve.rs`, internal route and `metrics_sources.rs` are added |
| M a parallel `--via` | QP-14 and QP-16 reuse `--source` |
| M sealing and Event Store refusals | QP-2 `sealOnWrite: true`; phase 1 lists the store refusals |
| M a forced turn after every reply | QP-11 checks the transcript |
| M cutover invents options | QP-19 relaxes the rules for `--migrated` |
| L stage names, bridge line kind, shared grant list, clock order, wrong cited commit | QP-19, phase 4 step 2, QP-22, QP-4, the footprint section |

## Risks and rollback

| risk | proof point |
|---|---|
| The Event Store consumer API needs more than Identity's port uses (ordered read, type registry) | Phase 3 step 0 reads Identity's adapter and the store's `append`/`read`; the store sits behind one port in the crate |
| The head socket has a 60 s bound and serves one request at a time | An `ask` is one append plus one event write, far below the bound; the phase 8 test times it |
| `Stop` blocks every turn until the ack | This is intended, because an answer waits for its ack. A stop with `stop_hook_active` set passes (acceptance 5) |
| The bridge read is slow or fails | It is bounded and fail-open, and the store list never depends on it (acceptance 4) |
| Two machines answer the same question | The earliest answer wins on read, and the later one is displayed (QP-4) |

**Rollback.** Each phase lands as one merge commit. Phase 4 is the one behaviour switch, because it retires the Node
reader. Reverting it, together with phases 6-9 if they have landed, restores `fgos questions --open`. Question events
already in the Event Store stay in the log, and nothing reads them without the consumer. Removing the consumer row
from `consumers.v1.json` makes the store ignore them.
