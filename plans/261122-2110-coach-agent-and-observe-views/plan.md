---
contract: plan-v1
title: "A coach head the supervisor starts, reading ready observe views, transcripts and memory, with private detail kept off git"
status: draft
priority: P2
blockedBy:
  - 261122-0118-heads-stable-and-able
  - 261122-1950-owner-communication-standard
footprint:
  - plans/261122-2110-coach-agent-and-observe-views/**
  - core/agents/coach.yaml
  - core/skills/fgos-coach/**
  - core/coach/**
  - core/watcher/definitions/coach-due.query.json
  - core/config-standard/coach.yaml
  - core/config-schema/coach.schema.yaml
  - core/skills/fgos-supervisor/SKILL.md
  - src/session-host/head-grants.mjs
  - src/session-host/head-request.mjs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/fixtures/definitions/coach-due/**
  - test/live/coach-run.live.mjs
  - packages/observe/rust/src/friction.rs
  - packages/observe/rust/src/friction_cli.rs
  - packages/observe/rust/src/private_detail.rs
  - packages/observe/rust/src/lib.rs
  - packages/observe/rust/tests/private_detail.rs
  - packages/observe/rust/tests/coach_views.rs
  - packages/observe/rust/tests/fixtures/coach-views/**
  - packages/observe/rust/src/sources/transcript_citations.rs
  - packages/observe/rust/src/sources/mod.rs
  - packages/observe/rust/tests/transcript_citations.rs
  - packages/observe/rust/tests/fixtures/transcript-citations/**
  - packages/observe/rust/transcript-citation-kinds.json
  - apps/fgos/src/wiring/observe_query.rs
  - apps/fgos/src/wiring/owner_reaction_hook.rs
  - apps/fgos/tests/owner_reaction_hook.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/main.rs
  - apps/fgos/src/wiring/mod.rs
  - packages/observe/contracts/owner-signals.v1.json
  - src/setup/agent-hooks.mjs
  - test/setup/agent-hooks.test.mjs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/distribution/contracts/agent-hooks.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/tests/goldens/agent-hooks-vectors.json
  - apps/fgctl/tests/goldens/**
  - test/cli/subcommand-flag-drift.test.mjs
  - docs/platform/observe/spec.md
  - docs/platform/supervision/spec.md
  - docs/platform/agent-mailbox/spec.md
  - docs/reading-map.md
  - CHANGELOG.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
base: c4ce42b06d12fe72c5238f17391e4de6a1968ee5
source:
  - plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md
  - p-kmavlfevvu
created: 2026-11-22
---

# A coach head fed by observe views, transcripts and memory

Answers the settled discussion `plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md`
(decisions CA-D1 to CA-D6, inheriting OC-D4 and OC-D5 from `ds-cfsfcbknl6`) and backlog row `p-kmavlfevvu`.

## Outcome

When unsettled friction piles up (one signature reaches 3 records) or a week passes with any unsettled friction and
no coach run, the watcher raises `coach-due` once and the supervisor starts exactly one coach head
(`head:coach-<handle>`). The coach reads ready-made views, so it never composes a query to fetch its data. It picks at
most 3 problems ranked by the goal they hurt (goal compass, CA-D5), diagnoses each from the views, the session
transcripts and the heads' memory stores, and writes one report. Every change it proposes is a reviewable new version,
never an in-place edit (CA-D6). Small instruction or memory text goes to the owner as one batched question. Anything
else goes to the supervisor as an evidenced problem, which the supervisor turns into a backlog row. The coach settles
the frictions it filed and, on its next run, reports each signature's count before and after.

Any producer can write friction whose detail holds private text (people's words, transcript excerpts, credentials in
output). The tracked record keeps only ids and the signature. The text goes to a git-ignored local store (CA-D4). The
owner-reaction hook is one such producer, with no special store, view or coach logic (CA-D1).

## Acceptance criteria

The discussion's five criteria (hand-off block) map one to one, plus the gate:

1. A fixture store with one signature at the threshold makes `coach-due` answer exactly one row, and the supervisor
   skill starts one coach head for it and none while one is live:
   `cargo test -p fgos-supervision --test definitions` (the `coach-due` fixture pair) and
   `node --test test/session-host/head-grants.test.mjs` (coach grant). Phase 1.
2. Every new coach view (U1-U5, U7, U10, U11, U14) answers on a fixture store and is held on name, version and row
   shape. Every reused definition (U6, U8, U9) answers or returns a named `unmeasured`:
   `cargo test -p fgos-observe --test coach_views`. Phases 2 and 4.
3. A friction recorded with private detail leaves no detail text under `.fgos/observe/records/`, and
   `git check-ignore .fgos/observe/private/<writer>.jsonl` matches:
   `cargo test -p fgos-observe --test private_detail`. Phase 3.
4. A coach run on a fixture project writes one report. Every proposal in it cites the goal and source line it serves,
   there are at most 3 proposals, and the run stays within its budget:
   `node --test test/live/coach-run.live.mjs` (live, run by hand or by the integration phase; it spends model tokens).
   Phase 1 writes it; phase 4 adds the curation case.
5. The owner-reaction hook records one friction for "khoan, cái này là gì" with no owner words in the tracked store:
   `cargo test -p fgos --test owner_reaction_hook`. Phase 5.
6. `npm test` and `cargo test --workspace` are green on the combined tree. `CHANGELOG.md` `## [Unreleased]` names the
   coach, its config keys and the private detail store. Phase 6.

## Non-goals

- The communication standard itself (`ds-cfsfcbknl6`, plan `261122-1950-owner-communication-standard`). This plan
  uses its `owner-communication` friction layer and does not define it.
- A SQLite projection with SQL views. It is reopened only when the coach records enough `coach-query-gap` frictions
  (CA-D3).
- Reviving the work-item retrospective loop (tsk-1lv, `a670be686`).
- Hooks for Codex and other CLIs. They come later, each through its own adapter.
- The managed Claude Dreams service (CA-D6). Only its pattern is used.
- The coach writing goals, editing live rules or memory in place, or writing the backlog (CA-D5, CA-D6, OC-D5).
- Pointing the communication standard's OC-D14 friction `--detail` duty at the private store. That edit belongs to
  the other plan, which owns `core/skills/_shared/friction-capture.md`. Phase 3 only ships the door it will use.

## Prior art (reused and missing)

- **Reused:** the watcher's definition-to-event-to-supervisor door (`core/watcher/definitions/*.query.json`, the
  supervisor skill's per-kind sections; `discussion-settled` starts a planner the same way). The named-query door
  (`packages/observe/rust/src/definition/`, `fgos metrics query --def`). Friction already sits on the record contract
  (`fgos.friction.recorded` / `fgos.friction.resolved`, `packages/observe/rust/src/friction.rs`), and its settle rule
  (resolve by subject or by signature) maps to the query grammar's `without ... anchor: after` anti-join, as
  `supervisor-stuck` already uses. Existing definitions for U6, U8 and U9 (`domains/coding/observe/definitions/`,
  `core/attention/definitions/plan-no-progress`). The transcript reader `packages/observe/rust/src/sources/claude_transcripts.rs`
  and its record source `transcript_records.rs`. The head grant table (`src/session-host/head-grants.mjs`) and the
  request socket. The dropped owner-reaction phase (`c61de4c1c`, `plans/261122-1751-owner-communication-standard/phase-02-capture-owner-reaction.md`)
  is reused almost whole in phase 5, with its detail moved to the private store. `instruction-audit` is the coach's
  tool for U12.
- **Missing:** a coach persona, skill, grant and trigger; views for U1-U5, U7, U10, U11 and U14; a private detail
  store; a cheap way to find which transcripts cite a rule or memory (U14, the discussion's open point, answered by
  phase 4's citation source).
- **Not revived:** the retrospective loop of tsk-1lv. It was keyed to work-item statuses that no longer drive work.

## Approach and alternatives

- **Trigger (CA-D2).** One raised definition, `coach-due`, under `core/watcher/definitions/`, which `watcher.definitions`
  already lists as a directory, so `watcher.yaml` does not change. Thresholds come from `coach.*` config keys through
  the definition's `params.configKey`, as `plan-no-progress` does. "Never two" is enforced twice: the event id is
  derived from `kind|subject|ts`, and the supervisor skill starts the coach only when no `head:coach-` role is live.
  Rejected: a timer or cron outside the watcher, because it would be a second door.
- **Views (CA-D3).** Versioned named definitions under `core/coach/definitions/`. Each file carries `"version"` in
  its name or body, and a contract test pins name, version and row columns, which matches `vantt/pkm`'s
  `agent_views(name, version)` intent. Rejected: a SQLite projection (CA-D3 non-goal).
- **Private detail (CA-D4).** A new `--private-detail <text>` input on `fgos friction record`. The text is appended to
  `.fgos/observe/private/<writerId>.jsonl` keyed by the record id. The tracked record stores no detail and carries a
  `fgos.friction.detail_ref` attribute holding the record id. On first write the store creates
  `.fgos/observe/private/.gitignore` containing `*`. That makes `git check-ignore` match in every project that uses
  fgOS (mission #1), not only this repository. Rejected: one line in the root `.gitignore`. It only covers this repo,
  and the root is a guarded hot file.
- **Citation finding for U14 (open point).** A new record source, `transcript_citations.rs`. It emits one
  `fgos.transcript.citation` record per (needle, transcript, first line) for needles taken from the effective rule
  ids (`.fgos/instructions/effective/repo.json`) and the memory store's `name:` slugs. It scans only transcripts
  modified inside the query window, under a byte cap from config. The `rule-evidence` view then counts citations per
  needle in the same named-query door, and a needle with zero citations is a "never fires" candidate. Contradictions
  stay a model judgement in the coach's per-transcript pass (CA-D6). Rejected: the coach grepping transcripts ad hoc,
  because it repeats the fetch work CA-D3 removes. Also rejected: an embedding index, which would be a new mechanism.
- **Coach output (OC-D5, CA-D6).** A report whose path comes from `fgos convention path --kind report --type coach`.
  Proposed new versions of rule text go in the report. Proposed memory versions and any transcript excerpt go under
  `.fgos/observe/private/coach/<run>/`, because they can hold private text. Evidenced problems are raised with
  `fgos supervisor raise`. Each proposal is recorded as an `fgos.coach.proposal` metrics record for U11.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Coach head, grant and start](phase-01-coach-head-and-start.md) | - | core/agents/coach.yaml, core/skills/fgos-coach/SKILL.md, core/skills/fgos-coach/references/goal-compass.md, core/watcher/definitions/coach-due.query.json, core/config-standard/coach.yaml, core/config-schema/coach.schema.yaml, core/skills/fgos-supervisor/SKILL.md, src/session-host/head-grants.mjs, src/session-host/head-request.mjs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/coach-due/**, test/live/coach-run.live.mjs | 1 | draft |
| 2 | [Coach views](phase-02-coach-views.md) | 1 | core/coach/definitions/friction-hot.query.json, core/coach/definitions/friction-cases.query.json, core/coach/definitions/friction-by-ref.query.json, core/coach/definitions/fix-effect.query.json, core/coach/definitions/friction-returned.query.json, core/coach/definitions/token-waste.query.json, core/coach/definitions/producer-silence.query.json, core/coach/definitions/coach-outcomes.query.json, core/coach/README.md, core/skills/fgos-coach/references/views.md, packages/observe/rust/tests/coach_views.rs, packages/observe/rust/tests/fixtures/coach-views/** | 2 | draft |
| 3 | [Private detail store](phase-03-private-detail-store.md) | - | packages/observe/rust/src/private_detail.rs, packages/observe/rust/src/friction.rs, packages/observe/rust/src/friction_cli.rs, packages/observe/rust/src/lib.rs, packages/observe/rust/tests/private_detail.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, test/cli/subcommand-flag-drift.test.mjs | 1 | draft |
| 4 | [Transcript and memory curation](phase-04-transcript-and-memory-curation.md) | 1, 3 | packages/observe/rust/src/sources/transcript_citations.rs, packages/observe/rust/src/sources/mod.rs, packages/observe/rust/transcript-citation-kinds.json, packages/observe/rust/tests/transcript_citations.rs, packages/observe/rust/tests/fixtures/transcript-citations/**, apps/fgos/src/wiring/observe_query.rs, core/coach/definitions/rule-evidence.query.json, core/skills/fgos-coach/references/curation.md | 2 | draft |
| 5 | [Owner-reaction hook, one producer](phase-05-owner-reaction-hook.md) | 3 | packages/observe/contracts/owner-signals.v1.json, apps/fgos/src/wiring/owner_reaction_hook.rs, apps/fgos/tests/owner_reaction_hook.rs, apps/fgos/src/routing.rs, apps/fgos/src/main.rs, apps/fgos/src/wiring/mod.rs, src/setup/agent-hooks.mjs, test/setup/agent-hooks.test.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/contracts/doctor-registry.v1.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, apps/fgctl/tests/goldens/**, docs/platform/agent-mailbox/spec.md | 2 | draft |
| 6 | [Integrate, docs and gate](phase-06-integrate-docs-and-gate.md) | 1, 2, 3, 4, 5 | core/skills/fgos-coach/SKILL.md, packages/observe/rust/tests/coach_views.rs, packages/observe/rust/tests/transcript_citations.rs, test/live/coach-run.live.mjs, docs/platform/observe/spec.md, docs/platform/supervision/spec.md, docs/reading-map.md, CHANGELOG.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | draft |

Waves: phases 1 and 3 have disjoint footprints and run at once. In wave 2, phases 2, 4 and 5 own disjoint files:
phase 2 owns the eight U1-U11 definitions and the contract test, phase 4 owns `rule-evidence` and the citation source,
and phase 5 owns the hook. Phase 4 writes its U14 contract case in its own test file
(`transcript_citations.rs`), so `coach_views.rs` has one writer in wave 2. Phase 6 adds the U14 row to that test.
Hot files: `core/skills/fgos-coach/SKILL.md` has one writer per wave (phase 1, then phase 6, which adds the links to
`views.md` and `curation.md`). The generated render surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`,
`.claude/skills/**`) are regenerated once, by phase 6, with `npm run build:skills` and never hand-merged. Phase 1
regenerates them only on its own branch so it can probe the coach live. `command-registry.mjs` and
`command-manifest.json` are written by phase 3 (wave 1) and phase 5 (wave 2), never in the same wave.

Contract check: `node scripts/plan-contract-check.mjs --plan plans/261122-2110-coach-agent-and-observe-views` passes
the plan's own rules. The plan stays `draft` because its footprint overlaps two active plans on hot files it cannot
avoid. Against `261122-0118-heads-stable-and-able` (running) it shares `src/session-host/head-grants.mjs`,
`src/session-host/head-request.mjs`, the head-request contract and tests, `core/skills/fgos-supervisor/SKILL.md`,
`apps/fgos/src/routing.rs`, `src/cli/command-registry.mjs`, the doctor registry and the render surfaces. Against
`261122-1950-owner-communication-standard` (ready) it shares the supervisor skill, `docs/platform/observe/spec.md`,
`docs/reading-map.md`, `docs/platform/agent-mailbox/spec.md`, `CHANGELOG.md` and the render surfaces, and phase 5 needs
that plan's `owner-communication` layer. Both are named in `blockedBy`. Flip to `ready` once both are `done`, after
re-running the check and moving `base` to the then-current `main`. The draft plan `261122-1946-agent-start-context`
also claims `core/agents/**`, `routing.rs` and `wiring/mod.rs`. It is not active, so this is not a check error, but
whichever of the two starts second must rebase over the other.

## Owner questions

None. The provisional numbers (3 records, 7 days, 3 signatures, 3 proposals) are CA-D2 defaults, written as config
keys and reversed by the coach's own reports. They are not asked again.

## Risks and rollback

| Risk | Level | Proof point (carried to validation) |
|---|---|---|
| The settle rule (resolve by subject or by signature) cannot be expressed with two `without ... anchor: after` clauses, so `coach-due` and `friction-hot` would count settled friction | medium | Phase 1 step 2 writes the `coach-due` fixture with one friction settled by subject and one settled by signature, and both must drop out. If the grammar cannot express this, register the existing `UnsettledSource` (`friction.rs`) as a record source of a derived kind `fgos.friction.unsettled` in `observe_query.rs` instead. That adds a source, not a query mechanism. |
| A sandboxed coach head cannot read `.fgos/observe/records`, run `metrics query`, read `~/.claude/projects` transcripts or memory, or resolve friction | high | Phase 1 step 1 probes each read from a real coach head (`test/live/head-grant-probe.live.mjs` style) before wiring. Any read that fails goes through the request socket as a granted verb. Transcripts and memory that stay unreadable become a named gap in the coach report, not a silent skip. |
| Overlap with `heads-stable` on the head grant and request files makes merges painful | medium | `blockedBy` holds the whole plan until that plan is done, so nothing is merged concurrently. |
| Transcript scanning is slow on a large `~/.claude/projects` | medium | Scan only files modified inside the window, under `coach.transcriptScanMaxBytes`. The phase 4 test proves the cap stops the scan. |
| A coach proposal misreads a goal | low | CA-D5 checks: every proposal cites a goal and source line, or it is not made. An owner rejection is recorded as friction `coach-misread-goal`. |
| Private text leaks through the coach report | medium | The report holds paths and line numbers only, and excerpts go to `.fgos/observe/private/coach/<run>/`. The live test greps the report for the fixture's private phrase and fails if it is found. |

Rollback: each phase is one commit on `main` through `fgos land`. `git revert` of a phase commit removes it. Reverting
phase 1 removes the trigger, so no coach starts, and the rest is inert data. Reverting phase 3 restores `--detail`
behaviour, and existing private store files stay on disk, ignored. The single revert path for the whole plan is to
revert its phase commits in reverse wave order.
