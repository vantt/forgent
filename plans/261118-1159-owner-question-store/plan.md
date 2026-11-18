---
contract: plan-v1
title: "Owner-question store: one Rust door to ask, answer and receive owner questions, with events, a receipt hook, one list and the S04 screen"
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
  - docs/platform/system-overview/spec.md
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
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - packages/host-runtime/contracts/command-manifest.json
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
  - apps/fgos/tests/questions_*.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/src/mcp.rs
  - apps/fgos-gateway/tests/**
  - apps/fgos-gateway/web/src/api/**
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx
  - core/questions/**
  - core/skills/**
  - domains/coding/skills/**
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - src/portfolio/open-questions.mjs
  - src/portfolio/work-questions.mjs
  - src/setup/agent-hooks.mjs
  - src/session-host/head-start.mjs
  - src/cli/command-registry.mjs
  - bin/fgos.mjs
  - test/portfolio/**
  - test/setup/**
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
[DISCUSSION.md](../../docs/discussions/owner-questions/DISCUSSION.md). The code facts below were checked against
`base`; the scout's findings are in [reports/scout-code-facts.md](reports/scout-code-facts.md).

## Outcome

Every question a session sends to the owner goes through one door, `fgos questions ask`. The door gives the question
an id, fills in the asker itself, stamps `askedAt`, checks the five parts and checks the origin ref. The owner sees
every open question and answers it in one place: `fgos questions`, the S04 dashboard screen, or Miu, who batches
them. The asking session learns at its next stop point that its own question was answered. It writes the answer back
to the place the question came from, then acks it. When the asker is idle or gone, the supervisor plan resumes the
work from `fgos.question.answered`. The old markdown reader of open questions is gone.

## Decisions taken by the planner

These are inside the settled frame. They are decided on evidence, not asked. Say so if one is wrong.

| id | decision | ground |
|---|---|---|
| QP-1 | New area **Questions**: spec `docs/platform/questions/spec.md`, crate `packages/questions/rust` (`fgos-questions`), contracts in `packages/questions/contracts/` | a new area gets a spec before code (L5 q2); OQ-D2 says a component of its own, not Observe |
| QP-2 | The store **calls** Observe's shard door and store lock (`fgos_observe::{shard_path, append_lines, read_store, acquire_store_lock}`); it does not move them to a lower crate. The store name is `questions`, so the shards live at `.fgos/observe/questions/<writer>.jsonl` in the main checkout | OQ-D2 leaves this choice to the planner. The door is already a public lib API (`packages/observe/rust/src/shard.rs:75,149,206,279`) used by three crates. Moving it would make ops-metrics, which is editing that crate now, churn for no gain (RUL104). The path is a storage detail behind the store's own contract |
| QP-3 | Ids come from `fgos identity mint question`: a new random kind with prefix `q`, 10 base32 chars, no network | id-minting law; `packages/identity/rust/src/mint.rs:18-26,65-80` adds a random kind cheaply |
| QP-4 | Three record kinds in the store: `asked`, `answered` and `acked`. The open list, the answered-not-acked list and `show` are folds over these records. `answer` runs under the store lock, reads the fold and refuses a second answer with `question-already-answered`. `ack` is accepted only from the asker session or a session started as its successor (`--for <id>` from the supervisor's start) | OQ-D1, acceptance 2; the lock gives one-answer on one machine. Across machines, the earliest `answeredAt` wins on read and the later one is shown as a conflict, because sync is by git and not instant (DISCUSSION §3 row 8) |
| QP-5 | The five parts arrive structured, not as markdown: `ask --input <file\|->` takes JSON `{what, cause, options:[{label, does, gain, harm, cost}], recommendation, scope}`, and serde is the one parser. `options` and `recommendation` may be empty only when `--open-discovery` is set, as `decision-question.md` allows for discovery questions | OM-D13 "one parser"; a structured input needs no markdown parser at all. `src/state/decision-question.mjs` stays with `fgos ask` (Work layer, out of scope; the backlog row below folds it) |
| QP-6 | The asker is filled from Identity: `current_session` gives `{id, handle}` (`packages/identity/rust/src/current.rs:154`), roles come from the directory entry (`directory.rs:66`), the persona is the `head:<persona>` role when there is one, and the pane comes from Session Host placement when it can be read (display only). There is no flag that sets the asker. A caller with no resolvable session is refused with `asker-unresolved` | OQ-D3 |
| QP-7 | `--ref` accepts three forms: `discussion:<topic>#Q<n>`, `plan:<dir>[#phase-<nn>]` and `case:<runId>[#<gate>]`. The verb checks that the file exists and that the anchor is present (the `Qn` row or phase file). It does not check a case gate, because the Work layer is on hold; the case dir must exist | OQ-D3 |
| QP-8 | Events: after the store append, the use case writes `fgos.question.asked` / `fgos.question.answered` through Observe's write door (`record::write`, ops-metrics phase 4). The write is fail-open, and its deterministic id is the question id plus the record kind, so a replay is idempotent. The kinds are declared in `packages/questions/rust/observe-kinds.json`, embedded with `include_str!` and injected in `apps/fgos/src/wiring/observe_declarations.rs` | OM-D12/OM-D13. The ops-metrics plan's own non-goals give the declaration and the producer to this component (its plan.md, Non-goals), which overrides the discussion's older wording "ops-metrics registers the kind" |
| QP-9 | The verb is native Rust: `fgos questions [list] [--all] [--answered] [--json]`, `show <id>`, `ask`, `answer <id> [--option <label>] [--text <t>] [--via secretary]`, `ack <id>`, `cancel <id> --reason <t>`. A bare `fgos questions` lists the open ones. `--open` goes with no alias (L10, SV-8); its callers move (`src/session-host/head-start.mjs:97`, the secretary skill, `docs/reading-map.md:191`, and the supervisor and multica plans, told by message) | OQ-D4; one door |
| QP-10 | Open Workflow gates and `fgos ask` items appear next to the store's questions through one bounded read of the legacy payload: `src/portfolio/work-questions.mjs`, run through `legacy_exec` the way `wiring/doctor/bridge.rs` does. The read is fail-open: when it fails, the list shows `work-sources: unavailable <reason>` and still lists the store. The markdown readers of `open-questions.mjs` (QUESTIONS.md and plan sections) are deleted (L10). Only its gate and ask part moves into `work-questions.mjs` | OQ-D4 keeps gates and `fgos ask` side by side. No Rust reader of the case projection exists (`readCaseProjection` folds events in Node, `src/workflow/case-projection.mjs:313`), and writing one now would redesign the Work layer, which is on hold. `fgos questions --open` already lists gates today, so dropping them would be a regression |
| QP-11 | The receipt hook is `fgos hook questions`, on `UserPromptSubmit` (adds one context line) and `Stop` (blocks the stop once per answered question with a one-line reason, so a running asker picks up the answer without anything typed into its pane). Notice-once state is kept per session under `.fgos/runtime/questions/notified/<session>.json`. The hook exits 0 always, like the other native hook kinds (`routing.rs:97-109`). Claude Code gets both rows. Other CLIs get a row only where `agent_hooks.rs` already has an equivalent event; the phase report lists the others | OQ-D5; PS-9 (no pane typing); the hook pattern of mailbox and session-rotation |
| QP-12 | The `question-answered` detection lives at `core/questions/definitions/question-answered.query.json` (installed payload, glob-readable) with the attrs of OQ-D6. The watcher and its action table belong to the supervisor plan, which is told the path | OQ-D6 |
| QP-13 | The cutover re-asks every open question through the verb with `--migrated`. The flag marks the record; the asker is still filled from Identity (the cutover session), so OQ-D3 holds. Today that is 0 open `QUESTIONS.md` rows and a handful of draft-plan sections (scout §8) | OQ-D7 says asker `migrated`; a flag that sets the asker would break OQ-D3, so a marker field carries the same fact |
| QP-14 | S04 grows its list and answer through the gateway: `GET /v1/questions` and `POST /v1/questions/{id}/answer` shell the same verb through `run_verb_blocking`, plus the MCP tools `list_questions` and `answer_question`. The `fgos ask` rows S04 already shows stay, side by side | OQ-D4, one door; `apps/fgos-gateway/src/gateway.rs:432,1270` |

**Lessons taken from the fork `vantt/multica`** (its "decision" feature, `vantt/patches/0004-decisions.spec.md` and
`0006-inbox.spec.md`; summary in [reports/multica-decisions-lessons.md](reports/multica-decisions-lessons.md)):

| id | decision | ground |
|---|---|---|
| QP-15 | A fourth record kind `cancelled` (`fgos questions cancel <id> --reason <text>`), accepted only from the asker or its successor, and only while the question is open. Superseding is `ask --supersedes <id>`, which writes the new question and cancels the old one with reason `superseded:<new id>` under one lock. The event is `fgos.question.cancelled`, so owner-wait measures close the wait | the fork's agents really use `cancel` (open/answered/cancelled CHECK, 409 otherwise); without it a stale question stays open forever, and an append-only store needs an explicit closing record |
| QP-16 | Only the owner answers. `answer` is refused with `answer-not-owner` when the caller is an agent session, unless that session holds the secretary role and passes `--via secretary`; then `by` is the owner and `via` names the session. A terminal with no agent session, or the gateway token, answers as the owner | the fork returns 403 for an agent actor; OQ-D4 says Miu answers for the owner and `by` records that |
| QP-17 | Each option may carry `recommended: true`, and exactly one option does (none only with `--open-discovery`). `answer` takes `--option <label>` and/or `--text <note>`, so the answer is a choice, free text, or both. S04 preselects the recommended option, so the common answer is one click | the fork's recommended flag on the option and its preselected radio; the five-part template keeps its recommendation text, and the flag only points at one option |
| QP-18 | The `answered` event, the hook line and `show` name the asker's handle and role, and the list prints a "needs you" count first | the fork's wake worked only once the answer named the asker (`3df3e309`); the supervisor resumes by the stored handle |

Not taken from the fork:
- a due date, which the fork records and never acts on;
- a 2-8 option cap, because the template says 2-4;
- waking through a posted comment, because fgOS has its own hook and supervisor;
- a SQL table;
- Telegram buttons, since mailbox and push channels are deferred.

**Prior art reused:** the shard door and store lock of Observe; the write door and declaration loader of ops-metrics
phases 1 and 4; the definition runner of its phase 7; Identity `current_session`, the directory and mint; the native
hook kind pattern (`routing.rs:97`, `wiring/session_rotation_hook.rs`); the hook row builder `agent_hooks.rs`; the
legacy bounded read of `wiring/doctor/bridge.rs` and `legacy_exec.rs`; the gateway `run_verb_blocking`; and the S04
screen `NeedsAnswer.tsx`. Prior art of the reader: `967101665` created `src/portfolio/open-questions.mjs` and
`5c7cf3d13` fixed its unreadable-case path. Nothing like it existed before, and nothing was removed.
**Missing, added here:** a question record and store, the mint kind, the verb, the hook kind and its rows, the
definition file and the gateway routes.

## Acceptance criteria

1. `cargo test -p fgos-questions` proves the following:
   - `ask` returns a `q-` id and records the asker (session id, handle, roles, persona), `askedAt`, stage, ref and the
     five parts;
   - a missing part, a bad ref and an unresolved asker are refused by name;
   - no input field sets the asker.
2. The same test proves the following:
   - `answer` records `{option, text, by, via, answeredAt}` once, and a second answer gives
     `question-already-answered`;
   - an agent session that is not the secretary gets `answer-not-owner`;
   - `ack` and `cancel` from a third session are refused;
   - `ask --supersedes` cancels the old question with reason `superseded:<new id>`;
   - a cancelled question leaves the open list.
3. The same test, run over a fixture Observe store, shows that `ask` and `answer` write `fgos.question.asked`,
   `fgos.question.answered` and `fgos.question.cancelled` with the OQ-D6 attrs, and that a held Observe lock leaves the question recorded and only
   raises the write door's counter.
4. `cargo test -p fgos --test questions_verb` proves three things:
   - `fgos questions` lists the store's open questions and the open gates and `fgos ask` items from a fixture, each
     row carrying its answer command;
   - a failing work read still lists the store;
   - `fgos questions --open` is an unknown flag.
5. `cargo test -p fgos --test questions_hook`, on a fixture with two sessions, proves that each session is told only
   about its own answered question, only once, and that it is no longer told after `ack`.
6. `cargo test -p fgos-questions --test definition_question_answered` runs
   `core/questions/definitions/question-answered.query.json` through the definition runner of ops-metrics on a
   fixture, and it returns one row per answered question with the OQ-D6 attrs.
7. The gateway test answers a question through `POST /v1/questions/{id}/answer`. `NeedsAnswer.test.tsx` shows store
   questions next to `fgos ask` items.
8. `rg -n "open-questions|collectOpenQuestions|questions --open" src bin core domains test docs/platform` finds
   nothing outside history text. No open owner question is left in `docs/discussions/*/QUESTIONS.md` or in a draft
   plan without a `q-` id.
9. The gate is green on the combined tree:
   - `npm test` and `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - the msvc and `aarch64-apple-darwin` compile checks;
   - `node scripts/plan-contract-check.mjs --plan plans/261118-1159-owner-question-store`.

## Non-goals

- Folding `fgos ask` and Workflow gates into the store, which happens when the Work layer resumes (backlog row
  `p-wgbzcazoak`).
- The watcher, the action table, the supervisor and the successor-session start, which belong to plan
  `261118-1045-project-supervisor`.
- Mailbox, nudges and typing into a pane.
- Owner-wait measures, which ops-metrics phase 15 computes once the kinds exist.
- Instant sync between machines.
- Moving `src/state/decision-question.mjs` to Rust.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Area spec, record contract, kinds](phase-01-spec-and-contract.md) | - | docs/platform/questions/**, packages/questions/contracts/**, packages/questions/rust/observe-kinds.json | 1 | draft |
| 2 | [Mint kind `question`](phase-02-mint-kind.md) | - | packages/identity/rust/src/mint.rs, packages/identity/rust/tests/**, docs/platform/identity/spec.md | 1 | draft |
| 3 | [Store crate and use cases](phase-03-store-crate.md) | 1, 2 | packages/questions/rust/src/**, packages/questions/rust/Cargo.toml, packages/questions/rust/tests/store_*.rs, Cargo.toml, Cargo.lock, docs/architecture-manifest.json | 2 | draft |
| 4 | [Native verb, one list, retire the markdown reader](phase-04-native-verb.md) | 3 | apps/fgos/Cargo.toml, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/questions.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/tests/questions_verb.rs, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, bin/fgos.mjs, src/portfolio/open-questions.mjs, src/portfolio/work-questions.mjs, src/session-host/head-start.mjs, test/portfolio/**, test/rust-host/**, packages/git/contracts/mutation-census.v1.json | 3 | draft |
| 5 | [Detection `question-answered`](phase-05-answered-definition.md) | 3 | core/questions/**, packages/questions/rust/tests/definition_*.rs, test/fixtures/questions/** | 3 | draft |
| 6 | [Receipt hook](phase-06-receipt-hook.md) | 4 | apps/fgos/src/wiring/questions_hook.rs, apps/fgos/src/wiring/questions_hook_unsupported.rs, apps/fgos/src/routing.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/tests/questions_hook.rs, packages/distribution/rust/src/agent_hooks.rs, src/setup/agent-hooks.mjs, test/setup/**, packages/distribution/contracts/doctor-registry.v1.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs | 4 | draft |
| 7 | [Gateway and S04](phase-07-gateway-s04.md) | 4 | apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/src/mcp.rs, apps/fgos-gateway/tests/**, apps/fgos-gateway/web/src/api/**, apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx, apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md | 4 | draft |
| 8 | [Cutover: re-ask, skills ask through the verb](phase-08-cutover-and-skills.md) | 4, 6 | docs/discussions/*/QUESTIONS.md, core/skills/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/** | 5 | draft |
| 9 | [Docs, backlog, integration gate](phase-09-docs-and-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8 | CHANGELOG.md, docs/backlog.md, docs/reading-map.md, docs/platform/system-overview/spec.md, plans/261118-1159-owner-question-store/reports/integration.md | 6 | draft |

**Waves.**
- Wave 1 runs phases 1 and 2: the spec and contract alongside the identity mint kind, which touch disjoint files.
- Wave 2 runs phase 3, the crate.
- Wave 3 runs phase 4 (host wiring, Node) and phase 5 (the definition file and its test), which touch disjoint
  files.
- Wave 4 runs phase 6 (the hook) and phase 7 (the gateway), which touch disjoint files.
- Wave 5 runs phase 8 (cutover and skills).
- Wave 6 runs phase 9 (docs and the full gate).

Phase 6 waits for phase 4 because both write `routing.rs`, the routes and the registry, and the hook kind sits next to
the verb's route. Phase 8 waits for the hook, so the skills can tell sessions to ack.

**Hot files.**
- `routing.rs`, `command-routes.json`, `command-registry.mjs` and the generated `command-manifest.json` go to phase 4
  in wave 3, then phase 6 in wave 4.
- The skill render surfaces go to phase 8 only (`npm run build:skills`).
- `mutation-census.v1.json` is regenerated, never hand-merged, by phase 4.
- `CHANGELOG.md`, the backlog and the reading map go to phase 9 only.
- `Cargo.lock` is written by phase 3. Phase 4 adds one dependency line and regenerates the file.

**Footprint across plans.** Every plan in `blockedBy` writes some of these files: ops-metrics writes the Observe
crate, `observe_declarations.rs`, the routes, the doctor registry and the skills; session-verb writes `src/**`, the
gateway, Identity and the skills; S5 writes `main.rs`, `routing.rs` and the registry. This plan therefore starts
after all three. Plan `261118-1045-project-supervisor` writes the same host files and reads `fgos questions` and
`question-answered`, so it lists this plan in its `blockedBy`. Its planner agreed on 2026-11-18 (session `plan-supervisor-b9`):
- it uses the bare `fgos questions`;
- the watcher reads `core/questions/definitions/`;
- a successor's `session start` carries the question id for `--for`;
- the supervisor itself never acks or cancels.

**Contract check (by reading, script run below).**
- Every phase sits in a later wave than each of its dependencies.
- The footprints within a wave are disjoint:
  - wave 1: `docs/platform/questions/**` and `packages/questions/{contracts,rust/observe-kinds.json}` against Identity;
  - wave 3: `apps/fgos/**`, `src/**` and the census against `core/questions/**`, `packages/questions/rust/tests/definition_*` and `test/fixtures/questions/**`;
  - wave 4: `apps/fgos/src/wiring/questions_hook*`, `routing.rs`, the routes and the setup against `apps/fgos-gateway/**`
    and the S04 docs.
- Phase 4's `test/portfolio/**` and phase 6's `test/setup/**` are in different waves.
- Script result: `node scripts/plan-contract-check.mjs --plan plans/261118-1159-owner-question-store` prints `ok`.
  From a linked worktree the YAML door refuses (`git-addon-unavailable`), because the addon belongs to the activated
  release, so the script was run on a scratch copy whose `readFrontmatter` parses with PyYAML. The rest of the
  check is the repo's own code.
- `--all` flags no footprint overlap for this plan, which is `draft`.

## Leader rules (every phase)

- In step 0, re-grep every input. This plan was written before the three blockers landed, and file and line numbers
  will move. Stop with `NEEDS_CONTEXT` when a finding changes a decision above, such as an Identity API renamed by
  session-verb phase 4 or a write-door signature changed by ops-metrics phase 4.
- New code is Rust; Node only calls it, apart from `work-questions.mjs`, which is landed Node code moved and trimmed
  (QP-10).
- When a phase deletes a mechanism, it retires that mechanism's tests in the same phase and names the test that now
  owns the behaviour (design principle 8).
- Generated files are regenerated, never hand-merged.
- Run tests only through the repo's test runner. Check `git diff --stat` for unexpected deletions before every
  commit.

## Owner questions

None. Every point the discussion left to the planner is decided above on evidence.

## Risks and rollback

| risk | proof point |
|---|---|
| The write-door or declaration API differs from ops-metrics' plan once it lands (QP-8) | Phase 3 step 0 reads the landed `record` module; the event write stays behind one function in the crate |
| A `Stop` hook that blocks can loop | Notice-once state, plus a test that the second `Stop` passes (acceptance 5) |
| The legacy work read is slow or fails | It is bounded and fail-open, and the store list never depends on it (acceptance 4) |
| An identity rename from session-verb lands mid-plan | That plan is a blocker, so its renames are on `main` before phase 2 starts |
| Two machines answer the same question | The earliest `answeredAt` wins on read and the later one is shown as a conflict (QP-4) |

**Rollback.** Each phase lands as one merge commit, and reverting that commit undoes it. Phase 4 is the one
behaviour switch, because it retires the Node reader, so reverting phase 4, together with phases 6-8 if they have
landed, restores `fgos questions --open`. The store files under `.fgos/observe/questions/` are inert once the verb is
gone.
