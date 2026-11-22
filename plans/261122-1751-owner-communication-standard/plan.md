---
contract: plan-v1
title: "Tiêu chuẩn giao tiếp: one shared communication standard for talking to the owner, reaction capture and cheap answers"
status: draft
priority: P1
base: 29a99b87b68160b259a268888c3d270ea3b7a1c9
blockedBy:
  - 261118-1341-s6a-execution-tier-rust
  - 261122-0118-heads-stable-and-able
footprint:
  - plans/261122-1751-owner-communication-standard/**
  - core/skills/_shared/owner-communication.md
  - core/skills/_shared/decision-question.md
  - core/instructions/owner-communication.md
  - core/instructions/decision-question.md
  - core/skills/_shared/coordination-driver.md
  - core/skills/_shared/plan-contract.md
  - core/skills/_shared/friction-capture.md
  - core/skills/fgos-cook/**
  - core/skills/fgos-run/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-shaping/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - domains/coding/skills/fgos-coding-discovering/SKILL.md
  - domains/coding/skills/fgos-coding-exploring/SKILL.md
  - domains/coding/skills/fgos-coding-implement/SKILL.md
  - domains/coding/skills/fgos-coding-knowledge/SKILL.md
  - domains/coding/skills/fgos-coding-validating/SKILL.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md
  - domains/coding/skills/fgos-coding-shaping/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - AGENTS.md
  - .fgos/instructions/effective/repo.json
  - docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md
  - docs/platform/agent-mailbox/spec.md
  - docs/platform/documentation/subcomponents/admission/spec.md
  - docs/platform/platform-foundations.md
  - docs/platform/questions/spec.md
  - docs/platform/observe/spec.md
  - docs/reading-map.md
  - packages/git/contracts/mutation-census.v1.json
  - packages/yaml-doc/upgrade-record.md
  - packages/observe/rust/friction-kinds.json
  - packages/observe/contracts/owner-signals.v1.json
  - src/state/decision-question.mjs
  - src/state/status-fsm.mjs
  - test/docs/rul11-anchor-phrase.test.mjs
  - test/state/awaiting.test.mjs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/main.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/owner_reaction_hook.rs
  - apps/fgos/tests/owner_reaction_hook.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos/tests/questions_verb.rs
  - src/setup/agent-hooks.mjs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/distribution/contracts/agent-hooks.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/tests/goldens/agent-hooks-vectors.json
  - apps/fgctl/tests/goldens/**
  - test/setup/agent-hooks.test.mjs
  - packages/questions/contracts/questions-input.v1.json
  - packages/questions/contracts/refusals.v1.json
  - packages/questions/rust/src/**
  - packages/questions/rust/tests/**
  - CHANGELOG.md
source:
  - plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md
  - p-wb6rkwpjsg
created: 2026-11-22
---

# Tiêu chuẩn giao tiếp: one shared communication standard for talking to the owner

Mode: standard (three tasks from one settled discussion; one shared-text change that moves about 40 callers, one new
hook kind, one contract change in the question door).

## Outcome

Every head, lead and worker, in every agent CLI, loads one standard named **tiêu chuẩn giao tiếp** (communication standard, OC-D8). It says why the
owner's attention matters (the owner is overloaded, so every message is made as easy to take in as possible), the principle judged from the reader's side, how the principle applies to each kind of
message (before speaking, names and ids, language and length, decision questions, status and incident reports) and a
few curated cases (OC-D2 as superseded by OC-D8, OC-D3). It replaces both decision-question files; no caller points at the old paths
(OC-D6, L10). Bad exchanges land in the friction store under a new `owner-communication` layer (OC-D4). A hook on
the owner's prompt records one friction candidate when the prompt carries a reaction signal, and never blocks or
slows the prompt (OC-D7 level 1). The question door shows options lettered A to D with the recommended one first,
accepts a letter as an answer, and refuses a decision question that does not say what the asker does if no answer
comes (OC-D7 level 2).

## Acceptance criteria

1. `git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'`
   prints nothing; `core/skills/_shared/owner-communication.md` and `core/instructions/owner-communication.md` exist
   (phase 1).
2. `AGENTS.md` carries the standard's motive and principle, projected from `core/instructions/owner-communication.md`
   (`test/docs/rul11-anchor-phrase.test.mjs`) (phase 1).
3. `npm run build:skills` leaves no diff (phase 1, re-checked in phase 4).
4. `fgos friction record --layer owner-communication ...` is accepted (phase 1).
5. A Claude Code `UserPromptSubmit` payload whose prompt is "khoan, cái này là gì" makes `fgos hook owner-reaction`
   record exactly one friction with layer `owner-communication`; a neutral prompt records none; the hook exits 0 and
   prints nothing in both cases (`cargo test -p fgos --test owner_reaction_hook`) (phase 2).
6. `fgos questions ask` with a decided question and no `parts.default` is refused `question-unclear` naming
   `parts.default`; `fgos questions` shows options as `A.` to `D.` with the recommended one at `A.`; `fgos questions
   answer <id> --option A` answers with that option (`cargo test -p fgos-questions`, `cargo test -p fgos --test questions_verb`) (phase 3).
7. `npm test` and `cargo test --workspace` green on the merged tree (phase 4).

## Non-goals

- Keeping information valid: fresh data, stale questions, nudging the concerned agent (OC-D1, its own item).
- The coach role: persona, when it starts, its verbs (OC-D5, its own item). This plan only names the coach as the
  reader of the friction records.
- Any check on the agent's own outgoing message (OC-D7 level 3).
- Changing the approved-frame rule or the product priority order; they move into the standard word for word.
- Renaming the existing `decision-question` hook kind or its guard (`src/state/decision-question.mjs`,
  `fgos hook decision-question`). They check a question's shape; only their comments point at the new standard.
- Codex support for the reaction hook: the questions hook header (`apps/fgos/src/wiring/questions_hook.rs`) records
  that Codex has no prompt event, so the hook ships for Claude Code only.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Write the standard and move every caller](phase-01-write-standard-and-move-callers.md) | - | core/skills/_shared/owner-communication.md, core/skills/_shared/decision-question.md, core/instructions/owner-communication.md, core/instructions/decision-question.md, core/skills/_shared/coordination-driver.md, core/skills/_shared/plan-contract.md, core/skills/_shared/friction-capture.md, core/skills/fgos-cook/**, core/skills/fgos-run/SKILL.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-supervisor/SKILL.md, domains/coding/skills/fgos-coding-discovering/SKILL.md, domains/coding/skills/fgos-coding-exploring/SKILL.md, domains/coding/skills/fgos-coding-implement/SKILL.md, domains/coding/skills/fgos-coding-knowledge/SKILL.md, domains/coding/skills/fgos-coding-validating/SKILL.md, domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md, .agents/skills/**, plugins/fgOS/skills/**, AGENTS.md, .fgos/instructions/effective/repo.json, docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md, docs/platform/agent-mailbox/spec.md, docs/platform/documentation/subcomponents/admission/spec.md, docs/platform/platform-foundations.md, docs/platform/questions/spec.md, docs/platform/observe/spec.md, docs/reading-map.md, packages/git/contracts/mutation-census.v1.json, packages/yaml-doc/upgrade-record.md, packages/observe/rust/friction-kinds.json, src/state/decision-question.mjs, src/state/status-fsm.mjs, test/docs/rul11-anchor-phrase.test.mjs, test/state/awaiting.test.mjs | 1 | draft |
| 2 | [Capture the owner's reaction](phase-02-capture-owner-reaction.md) | 1 | packages/observe/contracts/owner-signals.v1.json, apps/fgos/src/routing.rs, apps/fgos/src/main.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/owner_reaction_hook.rs, apps/fgos/tests/owner_reaction_hook.rs, src/setup/agent-hooks.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/contracts/doctor-registry.v1.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, apps/fgctl/tests/goldens/**, test/setup/agent-hooks.test.mjs, docs/platform/agent-mailbox/spec.md | 2 | draft |
| 3 | [Cheap answers in the question door](phase-03-cheap-answers-question-door.md) | 1 | packages/questions/contracts/questions-input.v1.json, packages/questions/contracts/refusals.v1.json, packages/questions/rust/src/**, packages/questions/rust/tests/**, apps/fgos/src/wiring/questions.rs, apps/fgos/tests/questions_verb.rs, docs/platform/questions/spec.md, core/skills/_shared/owner-communication.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-supervisor/SKILL.md, domains/coding/skills/fgos-coding-planning/SKILL.md, domains/coding/skills/fgos-coding-shaping/SKILL.md, .agents/skills/**, plugins/fgOS/skills/** | 2 | draft |
| 4 | [Integrate and run the full gate](phase-04-integrate-and-gate.md) | 2, 3 | CHANGELOG.md | 3 | draft |

Contract reading: phase 1 is alone in wave 1. Phases 2 and 3 share wave 2 with disjoint footprints: phase 2 owns
the hook, the hook table and the mailbox spec's hook section; phase 3 owns the question door, the asking skills and
the generated skill copies. `CHANGELOG.md` is a hot file and belongs only to phase 4. The generated copies under
`.agents/skills/` and `plugins/fgOS/skills/` are hot files, rebuilt by `npm run build:skills`, never hand-merged;
phase 1 and phase 3 each rebuild them in their own wave.

### Sequencing against other plans

Checked by hand on 2026-11-22 against every `ready` or `running` contract plan, because
`node scripts/plan-contract-check.mjs` refuses to start in the planner's sandbox (`git-addon-unavailable`: it builds
the addon in a read-only `target/`). The land door runs it again.

- `261118-1341-s6a-execution-tier-rust` (running) owns `apps/fgos/src/routing.rs`, `main.rs`, `wiring/mod.rs`,
  `src/setup/**`, `test/setup/**`, `src/cli/command-registry.mjs`, `packages/host-runtime/**`,
  `docs/reading-map.md` and the mutation census.
- `261122-0118-heads-stable-and-able` (running) owns the lead, secretary and supervisor skills,
  `friction-capture.md`, `plan-contract.md`, the generated skill copies, the doctor registry, the command manifest,
  `routing.rs`, `command-registry.mjs` and `CHANGELOG.md`.

Phase 1 cannot narrow around them: L10 moves every caller of the old paths in one change, and those callers include
files both plans own. The contract makes any overlap with a running plan an error for a `ready` plan, so this plan
stays `draft` with both in `blockedBy` and goes `ready` once both are `done`; whoever sees the second one finish
(the supervisor, or this head on its next wake) re-runs the check and flips `status: ready` alone.

The draft plan `261122-0056-orchestration-skeleton` also lists `packages/questions/contracts/questions-input.v1.json`,
`refusals.v1.json`, `packages/questions/rust/src/{shape,record,usecase,lib}.rs`, `apps/fgos/src/wiring/questions.rs`,
`routing.rs`, `wiring/mod.rs`, the doctor registry, the command manifest, `plan-contract.md` and the lead and supervisor
skills (the collision the discussion's hand-off names). It is `draft` and blocked by two other plans, so it is not
active. Decision: this plan keeps phase 3 rather than folding it into the skeleton. Phase 3 is a small, self-contained
change to the question shape, and the skeleton is a large plan that is still blocked. Whichever of the two becomes
`ready` second must list the other in `blockedBy`, and the contract check enforces that once both are active. If the
skeleton goes `ready` first, its question-door edits land first and phase 3 rebases onto them; the field and the
lettering touch the option shape, not the recipients and notifier the skeleton adds.

### Prior art reused, and what was missing

- **Standard text:** `core/skills/_shared/decision-question.md` (five parts, approved frame, "make it easy to answer")
  and `core/instructions/decision-question.md` become one application inside the new standard (OC-D6); nothing is
  kept beside them.
- **Always-loaded layer:** `src/setup/instruction-projections.mjs` already projects every `core/instructions/*.md`
  with `appliesTo: ["*"]` into each project's `AGENTS.md`; the new instruction rides that door.
- **Case log:** the friction store (`fgos friction record` / `rank`, declarations in
  `packages/observe/rust/friction-kinds.json`) is reused as is; only one layer value is missing (OC-D4).
- **Prompt hook:** the native `questions` hook (`apps/fgos/src/wiring/questions_hook.rs`) already parses the Claude
  Code `UserPromptSubmit` payload through the mailbox adapter, resolves the session and reads the transcript tail;
  the new hook reuses that adapter and caller code. It is a separate kind because the questions hook writes nothing
  and the reaction hook writes a record; one concern per kind keeps both simple.
- **Question door:** `questions-input.v1.json` is already the rule authority and refuses `question-unclear` naming the
  field; the default field and the recommended-first lettering are added there and in `shape.rs`.
- **Missing:** a written standard beyond the question template, a friction layer for owner communication, an owner
  signal trigger, a prompt-side capture, and lettered options with a stated default.

## Owner questions

None. Every point the plan needs is settled in the discussion (OC-D1 to OC-D8). Two choices the discussion left to
the planner are decided here and recorded in the phase files: the default field is `parts.default` with `does` and
`when`, required on decided questions only (phase 3); letters follow a recommended-first order computed by one
function in the questions package, so display and answer cannot disagree (phase 3). The T-signal phrase list starts
from the discussion's provisional table (section 6, step 3) and lives as data, so the coach can refine it later
without code (phase 2).

## Outstanding questions

None

## Risks and rollback

- **Missed caller (medium).** About 40 files cite the old paths, half of them generated. Proof point for validating:
  acceptance criterion 1's `git grep` is empty and `npm run build:skills` leaves no diff.
- **Projected `AGENTS.md` drifts from source (medium).** `AGENTS.md` and `.fgos/instructions/effective/repo.json` are
  generated; phase 1 regenerates them through the instruction projection, never by hand, and the anchor test pins the
  text.
- **The hook slows or breaks the owner's prompt (high).** The hook is served natively, has a bounded timeout like the
  questions row (10 s), catches every panic and exits 0, and its row is guarded `|| true`. Proof point: the
  hook test runs with an unwritable store and still exits 0 with no output.
- **False positives in the signal list (low).** A record is a candidate for the coach, not a verdict; the phrase list
  is data and can shrink without code.
- **Existing open questions lack `parts.default` (low).** The field is required at ask time only; stored questions
  without it still fold and display.
- **Rollback:** each phase lands as its own commit through the land door; `git revert` of that commit undoes it.
  Phase 1 must be reverted as a whole (the new files and the moved callers in one commit), and phases 2 and 3 must be
  reverted before phase 1 because they depend on its layer value and text.
