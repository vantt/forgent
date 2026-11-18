---
contract: plan-v1
title: "Owner-question store: one Rust door, also reachable from confined heads, to ask, answer, receive and cancel owner questions, with events, a receipt hook, one list and S04"
status: draft
priority: P1
blockedBy:
  - 261118-0936-ops-metrics
  - 261118-0947-session-verb-for-agent-sessions
  - 261115-2328-execution-read-door
footprint:
  - plans/261118-1159-owner-question-store/**
  - docs/platform/questions/**
  - docs/platform/identity/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/governance.md
  - docs/platform/session-host/spec.md
  - docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md
  - docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml
  - docs/reading-map.md
  - docs/backlog.md
  - docs/architecture-manifest.json
  - docs/discussions/*/QUESTIONS.md
  - CHANGELOG.md
  - Cargo.toml
  - Cargo.lock
  - packages/questions/**
  - packages/identity/rust/src/mint.rs
  - packages/identity/rust/tests/**
  - packages/identity/contracts/identity.write.v1.json
  - packages/event-store/contracts/consumers.v1.json
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/distribution/contracts/doctor-bridge.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/**
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
  - apps/fgos/src/wiring/doctor/bridge.rs
  - apps/fgos/src/wiring/doctor/packaging.rs
  - apps/fgos/tests/questions_*.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/tests/**
  - apps/fgos-gateway/web/src/api/**
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx
  - core/questions/**
  - core/instructions/id-minting.md
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
  - src/session-host/head-start.mjs
  - src/cli/command-registry.mjs
  - bin/fgos.mjs
  - scripts/plan-contract-check.mjs
  - test/portfolio/**
  - test/cli/questions-verb.test.mjs
  - test/setup/**
  - test/session-host/**
  - test/rust-host/**
  - test/fixtures/questions/**
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
asker's own checkout. The question lives in the Event Store, so every machine sees it once the machines sync.

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
| QP-2 | **The store is an Event Store consumer.** It is registered as consumer `questions` in `packages/event-store/contracts/consumers.v1.json`, with stream contract `packages/questions/contracts/question-event-streams.v1.json`. The types are `question.asked`, `question.answered`, `question.acked` and `question.cancelled`, all `scope: project`. The crate reaches the store through a port, the way Identity does (`EntryLog`, `packages/identity/rust/src/shared.rs:61`), and every list is a fold over a read. There is no cache view, as with mailbox. This replaces the first draft's Observe shard store | OQ-D2's storage half rested on "sync by git", but Observe shards are never committed or synced (red team H4: untracked in `git status`, and no committer). The Event Store is the "single authority for how an fgOS event ... is shared across machines" (`component-boundary.md:95`). It already has a Rust consumer (Identity), and it has its own locks (`event-append`), which removes the shared-lock contradiction (C2) and the Observe-directory problem (M5). OQ-D2's settled part still holds: a separate Rust component, outside Observe, append-only |
| QP-3 | Ids come from `fgos identity mint question`, a new random kind with prefix `q` and no network | the id-minting law; `mint.rs:18-26,65-80` |
| QP-4 | The fold gives each id a state: open, answered, acked or cancelled. `answer` refuses a second answer against the local read with `question-already-answered`. When two machines answer before they sync, the earliest `answeredAt` wins, and the later answer is kept as a conflict, shown by `show` and S04. **Who may ack or cancel:** the asker session; any session holding the same `head:` role (a rotated successor); a session holding the Identity role `answers:<question id>` (the supervisor's successor, set by the supervisor plan at start); and, for a `migrated` record, any head session | OQ-D1 and acceptance 2; red team H2 (rotation), H3 (successor link) and M8 (migrated) |
| QP-5 | The five parts arrive structured. `ask --input <file\|->` takes JSON per `questions-input.v1.json`, and serde is the one parser. That contract is the rule authority for this door. `src/state/decision-question.mjs`, which still guards `fgos ask` and the `AskUserQuestion` hook, is folded later; the backlog row below covers it | OM-D13 "one parser"; red team M2 |
| QP-6 | The asker is filled from Identity:<br>- `current_session` gives `{id, handle}`;<br>- roles come from the directory entry;<br>- the persona comes from `FGOS_HEAD_PERSONA` as Identity reports it, never from splitting the role;<br>- the pane comes from Session Host placement when it can be read, and is used only for display.<br>Through the head socket, the run supervisor serving that head supplies the asker from its envelope, so the asker cannot be forged. No flag sets the asker. A caller with no resolvable identity is refused with `asker-unresolved` | OQ-D3; red team C1, L4 |
| QP-7 | `--ref` takes one of `discussion:<topic>#Q<n>`, `plan:<dir>[#phase-<nn>]` and `case:<runId>[#<gate>]`. It is checked in **the caller's own checkout** (its cwd worktree, or the head's worktree from the envelope). The ref is recorded with its branch and commit | red team H6: draft plans and discussions live on branches until they land |
| QP-8 | Events: after each store append, the use case writes `fgos.question.asked`, `answered`, `acked` or `cancelled` through Observe's landed write door (`RecordDoor::write`, `packages/observe/rust/src/record/store/door.rs`). The write is fail-open, and its deterministic id is `<question id>:<kind>`. The kinds are declared in `packages/questions/rust/observe-kinds.json` and injected in `observe_declarations.rs` | OM-D12 and OM-D13; the ops-metrics non-goals give the declaration and the producer to this component; red team L1, M4 |
| QP-9 | The native verb is `fgos questions [list] [--all] [--answered] [--json]`, with the sub-verbs `show <id>`, `ask`, `answer <id> [--option <label>] [--text <t>] [--via secretary]`, `ack <id>` and `cancel <id> --reason <t>`. A bare `fgos questions` lists the open questions. `--open` gets no alias (L10). Every caller moves:<br>- `head-start.mjs:97`, which already expects the bare verb (red team L3);<br>- the secretary skill;<br>- the reading map;<br>- `test/cli/questions-verb.test.mjs`, retired, with `apps/fgos/tests/questions_verb.rs` as the new owner.<br>The supervisor plan has already moved (`origin/plan/supervisor` `07a741621`) | OQ-D4, one door |
| QP-10 | Open Workflow gates and `fgos ask` items appear next to the store's questions through **a new request kind `work-questions` on the existing doctor bridge** (`apps/fgos/src/wiring/doctor/bridge.rs`, contract `doctor-bridge.v1.json`). The manifest names that bridge as the one bounded way a native verb reaches Node (`docs/architecture-manifest.json:1175`), and it already carries `work-store-init`. Its module `src/setup/doctor-bridge.mjs` gains the request: gates come from `readCaseProjection` (code moved from `open-questions.mjs`), and `fgos ask` items come from the Work view's awaiting-human list (existing reads). The read is fail-open: when it fails, the list prints `work-sources: unavailable <reason>` and still lists the store. The request extends a door that is due to retire (S7), so it retires with that door | red team M1. No Rust reader of the case projection exists (`case-projection.mjs:313`), and writing one would redesign the Work layer, which is on hold. Dropping gates would be a regression of today's `--open` |
| QP-11 | The receipt hook `fgos hook questions` writes nothing; it only reads the Event Store, which a confined head can read. On `UserPromptSubmit` it adds one context line for each answered question this session has not acked. On `Stop`, and only when `stop_hook_active` is false, it blocks once with one reason listing every such question. That gives at most one continuation per stop, repeated until each question is acked. It exits 0 always. "This session" means the session id or the same `head:` role (QP-4). Rows go to Claude Code, and to any other CLI whose row builder has an equivalent event. The existing `*-hook-wired` doctor rows judge the wiring; there is no new row | OQ-D5; PS-9 (no pane typing); red team C1, M9, M10; the mailbox adapters already read `stop_hook_active` (`packages/mailbox/rust/store/src/adapters/claude.rs:15`) |
| QP-12 | The detection `core/questions/definitions/question-answered.query.json` returns answered questions with no `acked` event (an anti-join on `fgos.question.acked`) and the OQ-D6 attrs. The supervisor plan's watcher reads that directory (agreed, `07a741621`) | OQ-D6; red team M4: no wake for an answer the asker already took |
| QP-13 | The cutover re-asks every open question through the verb with `--migrated`. The flag marks the record, and the asker is still resolved. Any head may ack a migrated question (QP-4) | OQ-D7 without breaking OQ-D3; red team M8 |
| QP-14 | S04 renders exactly what `GET /v1/questions` returns: store questions, `fgos ask` items and gates, each with its answer door. Store questions are answered through `POST /v1/questions/{id}/answer` and `fgos ask` items through the existing route. Gates show their `fgos workflow answer` command, because the Work layer is on hold. S04's own `listWork` call goes, so nothing shows twice. **No answer binding goes on the gateway's MCP surface.** The REST answer passes the authenticated `Caller` from `require_token` (`gateway.rs:440`), and the answer records `via: gateway:<caller>` | OQ-D4; red team M6, H1, L2 |
| QP-15 | A `cancelled` record (`cancel <id> --reason`), and `ask --supersedes <id>`, which cancels the old question with reason `superseded:<new id>` | the fork `vantt/multica` (`reports/multica-decisions-lessons.md`) |
| QP-16 | Only the owner answers. `answer` is refused with `answer-not-owner` when the caller is an agent. An agent is an Identity session whose process ancestry contains an agent CLI (`resolve::ancestry_cli`, `packages/identity/rust/src/resolve.rs:214`); env alone does not decide it. The exception is the secretary head, which answers through its socket with `--via secretary`; then `by` is the owner. The gateway with an authenticated caller, and a terminal with no agent in its ancestry, pass as the owner. The spec states that this rule **guards against mistakes, not against attack**: an agent that runs code can always get around it | the fork's "only people answer"; OQ-D4; red team H1 |
| QP-17 | An option may carry `recommended: true`. `answer` takes `--option` and/or `--text`. S04 preselects the recommended option | the fork; OQ-D4 |
| QP-18 | The `answered` event, the hook line and `show` name the asker's handle and role. The list prints a "needs you" count first | the fork's wake by naming the asker (`3df3e309`) |
| QP-19 | `ask` checks only **measurable** shape rules, all held as data in `questions-input.v1.json`, and refuses with `question-unclear`, naming the field and the rule:<br>- `headline`: one line, at most 120 characters, counted in Unicode characters, not bytes;<br>- `what` and `cause`: at most 600 characters each;<br>- 2-4 options, each with a `label` of at most 60 characters plus `does`, `gain`, `harm` and `cost`;<br>- exactly one option recommended;<br>- `scope.allows` and `scope.forbids` both present;<br>- `blocks` present.<br>Options and a recommendation may be empty only when the ref is `discussion:` and `stage` is `shaping` (discovery), never because of a caller flag. The guide carries the rules a program cannot measure: one decision per question, no "as above" or "như trên", and every code defined before it is used | the owner's request (clear questions, light load); `decision-question.md`; red team M3 |
| QP-20 | Reading is layered. The list shows one line per question: `headline`, recommended option, `blocks` and age. `show` and S04 expand to the five parts, with each option's cost next to it | the owner's request; the fork's preselected radio |
| QP-21 | Miu batches at most 5 questions, ordered by `blocks`, then plan priority, then age, headline first. `decision-question.md` gains a "make it easy to answer" section: plain words in the owner's language, every term defined, the recommendation first, the cost in numbers, and what happens if the owner does not answer yet. Miu rewrites a question that breaks the guide before showing it | the owner's request; AGENTS.md priority #2 |
| QP-22 | **Confined heads reach the door through their request socket.** New head-request verbs `questions ask`, `questions ack` and `questions cancel` (every head) and `questions answer` (secretary only) go in `head-request.v1.json`. They are served in `head_request.rs` by the head's run supervisor, which resolves the asker from the envelope, and granted in `head-grants.mjs`. Inside a head, the `fgos questions` CLI forwards these sub-verbs to the socket, as the head's other request verbs do. Reads go directly to the store | red team C1: a head can never bind `.fgos` writable (`src/runner/dispatch/confinement/workspace-paths.mjs:26-31`), and heads are the main askers |

Not taken from the fork:
- a due date, which the fork never acts on;
- the 2-8 option cap, because the template says 2-4;
- a comment-triggered wake;
- a SQL table;
- Telegram buttons.

**Prior art reused:**
- the Event Store, its consumer registry and Identity's `EntryLog` port pattern;
- Observe's landed write door and declaration registry (ops-metrics phases 1 and 4) and its definition runner
  (phase 7);
- Identity `current_session`, the directory, `ancestry_cli` and mint;
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
   - `ack` and `cancel` are accepted from the asker, the same `head:` role and the `answers:<id>` role, and refused
     from anyone else;
   - `--supersedes` cancels the old question.
3. The same suite shows that each store write emits its `fgos.question.*` event with the OQ-D6 attrs, and that a
   failing Observe write door leaves the question recorded and only raises the door's counter.
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
6. `cargo test -p fgos-run-supervisor` shows that a head's `questions ask` over the socket records the envelope's role
   as the asker, and that a shaper's `questions answer` is refused because it is not granted.
7. `cargo test -p fgos-questions --test definition_question_answered` returns one row per answered question with no
   ack.
8. The gateway tests show that REST answers record `via: gateway:<caller>` and that no MCP binding answers.
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
- The watcher, the action table, the supervisor, and starting the successor with role `answers:<id>`. These belong
  to plan `261118-1045-project-supervisor`.
- Mailbox, nudge and pane typing.
- Owner-wait measures, which belong to ops-metrics phase 15.
- Instant sync between machines. Questions travel at the Event Store's sync pace.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Area spec, contracts, kinds](phase-01-spec-and-contract.md) | - | docs/platform/questions/**, docs/platform/component-boundary.md, docs/platform/governance.md, packages/questions/contracts/**, packages/questions/rust/observe-kinds.json | 1 | ready |
| 2 | [Mint kind `question`](phase-02-mint-kind.md) | - | packages/identity/rust/src/mint.rs, packages/identity/rust/tests/**, packages/identity/contracts/identity.write.v1.json, docs/platform/identity/spec.md, core/instructions/id-minting.md | 1 | draft |
| 3 | [Store crate and use cases](phase-03-store-crate.md) | 1, 2 | packages/questions/rust/src/**, packages/questions/rust/Cargo.toml, packages/questions/rust/tests/store_*.rs, packages/event-store/contracts/consumers.v1.json, Cargo.toml, Cargo.lock, docs/architecture-manifest.json | 2 | draft |
| 4 | [Native verb, one list, retire the markdown reader](phase-04-native-verb.md) | 3 | apps/fgos/Cargo.toml, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/questions.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/doctor/bridge.rs, apps/fgos/tests/questions_verb.rs, packages/distribution/contracts/doctor-bridge.v1.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, src/setup/doctor-bridge.mjs, bin/fgos.mjs, src/portfolio/open-questions.mjs, src/portfolio/plan-sections.mjs, scripts/plan-contract-check.mjs, src/session-host/head-start.mjs, test/portfolio/**, test/cli/questions-verb.test.mjs, test/rust-host/**, docs/architecture-manifest.json, packages/git/contracts/mutation-census.v1.json | 3 | draft |
| 5 | [Detection `question-answered`](phase-05-answered-definition.md) | 3 | core/questions/**, packages/questions/rust/tests/definition_*.rs, test/fixtures/questions/** | 3 | draft |
| 6 | [Receipt hook](phase-06-receipt-hook.md) | 4 | apps/fgos/src/wiring/questions_hook.rs, apps/fgos/src/wiring/questions_hook_unsupported.rs, apps/fgos/src/routing.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/doctor/packaging.rs, apps/fgos/tests/questions_hook.rs, packages/distribution/rust/src/agent_hooks.rs, src/setup/agent-hooks.mjs, test/setup/**, .claude/settings.json, .codex/hooks.json, .agents/hooks.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, packages/git/contracts/mutation-census.v1.json | 4 | draft |
| 7 | [Gateway and S04](phase-07-gateway-s04.md) | 4 | apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/tests/**, apps/fgos-gateway/web/src/api/**, apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx, apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md | 4 | draft |
| 8 | [Head door: questions over the request socket](phase-08-head-door.md) | 4 | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/**, packages/run-supervisor/contracts/head-request.v1.json, src/session-host/head-grants.mjs, test/session-host/**, apps/fgos/src/wiring/questions.rs, docs/platform/session-host/spec.md, packages/git/contracts/mutation-census.v1.json | 5 | draft |
| 9 | [Cutover: re-ask, skills ask through the verb](phase-09-cutover-and-skills.md) | 6, 8 | docs/discussions/*/QUESTIONS.md, core/skills/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, packages/git/contracts/mutation-census.v1.json | 6 | draft |
| 10 | [Docs, backlog, integration gate](phase-10-docs-and-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9 | CHANGELOG.md, docs/backlog.md, docs/reading-map.md, packages/git/contracts/mutation-census.v1.json, packages/host-runtime/contracts/command-manifest.json, plans/261118-1159-owner-question-store/reports/integration.md | 7 | draft |

**What each phase really waits for (H9).** The plan as a whole is `draft` behind three blockers, because its later
phases share files with them. The phases themselves wait for less:
- Phase 1 is docs and contracts only, and its files are disjoint from every running or ready plan. It is `ready` and
  can start now.
- Phase 2 waits for session-verb phase 4, which rewrites `packages/identity/**`.
- Phase 3 waits for phase 2 and for the landed Observe write door (ops-metrics phase 4, landed `4fddbb722`).
- Phases 4 and later wait for S5 phases 10-12 and session-verb phase 5, which own `main.rs`, `routing.rs`, the
  registry and the head-request contract.
- Phase 5 waits for ops-metrics phase 7, the definition runner.

**Waves.**
- Wave 1: phases 1 and 2.
- Wave 2: phase 3.
- Wave 3: phases 4 and 5.
- Wave 4: phases 6 and 7.
- Wave 5: phase 8, alone, because it shares the census and `wiring/questions.rs` with phases 4 and 6.
- Wave 6: phase 9. It needs the hook and the head door, because the skills tell heads to ask and ack through the
  socket.
- Wave 7: phase 10.

**Hot files, one writer per wave.**
- `packages/git/contracts/mutation-census.v1.json` is regenerated, never hand-merged. Phases 4, 6, 8, 9 and 10 each
  regenerate it, one per wave, because each one changes pinned files and the census test is part of its gate.
- `routing.rs`, `command-routes.json`, `command-registry.mjs` and `command-manifest.json`: phase 4 (wave 3), then
  phase 6 (wave 4), then a final regeneration in phase 10.
- `wiring/questions.rs`: phase 4, then phase 8.
- `docs/architecture-manifest.json`: phase 3, then phase 4.
- Skill renders: phase 9 only.
- `CHANGELOG.md`, the backlog and the reading map: phase 10.

**Footprint across plans.** The three blockers write overlapping files. The supervisor plan lists this plan in its
`blockedBy`, and its planner has agreed (`origin/plan/supervisor` `07a741621`) to:
- use the bare verb;
- read definitions from `core/questions/definitions/`;
- pass the question id when it starts a successor.

It also sets role `answers:<id>` on that successor (QP-4). This plan's planner sends it that point.

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

None. Moving the store from Observe shards to the Event Store (QP-2) changes the storage half of OQ-D2. The shaper set
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
| H3 successor link has no owner | role `answers:<id>`, set by the supervisor plan, which is told |
| H4 no sync across machines | QP-2 moves the store to the Event Store |
| H5 supervisor plan out of step | resolved upstream in `07a741621` |
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
| L1 write door API | QP-8 names `RecordDoor::write` |
| L2 MCP tools | QP-14 adds no MCP binding |
| L3 `head-start.mjs` bug | QP-9; a CHANGELOG note in phase 10 |
| L4 persona | QP-6 |
| L5 files that setup writes | added to phase 6's footprint |
| L6 contract check | see "Contract check" above |

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
