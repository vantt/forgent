---
contract: plan-v1
title: "Communication standard (tiêu chuẩn giao tiếp): one always-loaded standard for how every agent talks to the owner, and cheap answers in the question door"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261122-1950-owner-communication-standard/**
  - core/skills/_shared/owner-communication.md
  - core/instructions/owner-communication.md
  - core/skills/_shared/decision-question.md
  - core/instructions/decision-question.md
  - core/skills/_shared/coordination-driver.md
  - core/skills/_shared/plan-contract.md
  - core/skills/_shared/friction-capture.md
  - core/skills/fgos-cook/SKILL.md
  - core/skills/fgos-cook/references/case-and-doors.md
  - core/skills/fgos-run/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-shaping/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - domains/coding/skills/fgos-coding-discovering/SKILL.md
  - domains/coding/skills/fgos-coding-exploring/SKILL.md
  - domains/coding/skills/fgos-coding-implement/SKILL.md
  - domains/coding/skills/fgos-coding-knowledge/SKILL.md
  - domains/coding/skills/fgos-coding-validating/SKILL.md
  - domains/coding/skills/fgos-coding-shaping/SKILL.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md
  - docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md
  - docs/platform/agent-mailbox/spec.md
  - docs/platform/documentation/subcomponents/admission/spec.md
  - docs/platform/platform-foundations.md
  - docs/platform/questions/spec.md
  - docs/platform/observe/spec.md
  - docs/reading-map.md
  - packages/yaml-doc/upgrade-record.md
  - packages/git/contracts/mutation-census.v1.json
  - packages/observe/rust/friction-kinds.json
  - packages/questions/contracts/questions-input.v1.json
  - packages/questions/contracts/question-event-payloads.v1.json
  - packages/questions/contracts/refusals.v1.json
  - packages/questions/rust/src/shape.rs
  - packages/questions/rust/src/record.rs
  - packages/questions/rust/src/usecase.rs
  - packages/questions/rust/tests/store_usecases.rs
  - apps/fgos/src/wiring/questions.rs
  - src/state/decision-question.mjs
  - src/state/status-fsm.mjs
  - test/docs/rul11-anchor-phrase.test.mjs
  - test/state/awaiting.test.mjs
  - AGENTS.md
  - .fgos/instructions/effective/repo.json
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - CHANGELOG.md
base: 392373096f1bb832a7bde0c66a35ea8bb072f5b9
source:
  - plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md
  - p-wb6rkwpjsg
created: 2026-11-22
---

# Communication standard (tiêu chuẩn giao tiếp)

Answers the settled discussion `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`
(decisions OC-D1, OC-D3 to OC-D14; OC-D2 superseded by OC-D8, OC-D7 item 1 by OC-D13) and backlog row
`p-wb6rkwpjsg`. The discussion's task 1 is phases 1 and 2; its task 3 is phases 3 and 4.

## Outcome

Every head, lead and worker, in every agent CLI, loads one standard, **tiêu chuẩn giao tiếp**, that tells it
why the owner's attention matters (the owner is overloaded, OC-D8), the principle judged from the reader's
side and its test before sending, and three parts: A conduct (OC-D9, OC-D10, the noticing and recording duty
of OC-D14), B presenting information in nine points with a fixed shape per kind of message (OC-D11), and
C when and where to speak, plus a few curated cases. It replaces both decision-question files; no caller
points to the old paths. An agent that sees its communication fell short records a friction under a new
`owner-communication` layer (OC-D4, OC-D14). Every owner question in the question door carries a stated
default ("if no answer by X, I take A"), its options are shown lettered A to D with the recommended one
first, and the owner can answer with the letter alone (OC-D7 item 2, case C5).

## Acceptance criteria

1. `git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'`
   prints nothing, and `core/skills/_shared/owner-communication.md` and `core/instructions/owner-communication.md`
   exist (phase 1).
2. `AGENTS.md`'s fgOS Effective Instructions block carries the standard's always-loaded instruction, proven by
   `node --test test/docs/rul11-anchor-phrase.test.mjs` (phase 1).
3. `npm run build:skills` leaves `git status --porcelain` empty after each phase that edits a skill source
   (phases 1 and 4).
4. `fgos friction record --layer owner-communication ...` is accepted by a host built from the tree, and
   `docs/platform/observe/spec.md` lists the value (phase 2).
5. `fgos questions ask` with options but no `parts.default` is refused `question-unclear` naming
   `parts.default`; a discovery question without options is still accepted without it
   (`cargo test -p` the questions crate, phase 3).
6. `fgos questions <id>` shows options as `A.` to `D.`, the recommended one first, and the default line;
   `fgos questions answer <id> --option A` resolves to that option's label (phase 3).
7. Questions already in the store without a default still fold and display (phase 3).
8. `npm test` and `cargo test --workspace` green on the combined tree; `CHANGELOG.md` `## [Unreleased]` has
   one line for the standard and one for the question door (phase 5).

## Non-goals

- Keeping information valid: fresh data, stale questions, nudging the concerned agent (OC-D1, OC-D12; the
  stale-question part goes to draft plan `261122-0056-orchestration-skeleton`).
- The coach role and the observation cluster with pre-built views (OC-D5, OC-D13; backlog `p-kmavlfevvu`).
- Any hook that scans the owner's incoming messages (OC-D13) or checks the agent's outgoing messages
  (OC-D7 item 3).
- Renaming the `fgos hook decision-question` guard or its hook kind: it is an install contract
  (`packages/distribution/contracts/agent-hooks.v1.json`) that the discussion did not ask to change; only its
  doc pointers move.
- Changing the approved-frame rule or the product priority order: both move into the standard word for word.
- Changing a locked law: `docs/platform/platform-foundations.md` only gets its link updated.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Write the standard and move every caller](phase-01-standard-and-callers.md) | - | core/skills/_shared/owner-communication.md, core/instructions/owner-communication.md, core/skills/_shared/decision-question.md, core/instructions/decision-question.md, core/skills/_shared/coordination-driver.md, core/skills/_shared/plan-contract.md, core/skills/_shared/friction-capture.md, core/skills/fgos-cook/SKILL.md, core/skills/fgos-cook/references/case-and-doors.md, core/skills/fgos-run/SKILL.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, domains/coding/skills/fgos-coding-discovering/SKILL.md, domains/coding/skills/fgos-coding-exploring/SKILL.md, domains/coding/skills/fgos-coding-implement/SKILL.md, domains/coding/skills/fgos-coding-knowledge/SKILL.md, domains/coding/skills/fgos-coding-validating/SKILL.md, domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md, docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md, docs/platform/agent-mailbox/spec.md, docs/platform/documentation/subcomponents/admission/spec.md, docs/platform/platform-foundations.md, docs/platform/questions/spec.md, docs/reading-map.md, packages/yaml-doc/upgrade-record.md, packages/git/contracts/mutation-census.v1.json, src/state/decision-question.mjs, src/state/status-fsm.mjs, test/docs/rul11-anchor-phrase.test.mjs, test/state/awaiting.test.mjs, AGENTS.md, .fgos/instructions/effective/repo.json, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | draft |
| 2 | [Friction layer value for owner communication](phase-02-friction-layer.md) | - | packages/observe/rust/friction-kinds.json, docs/platform/observe/spec.md | 1 | draft |
| 3 | [Stated default and lettered options in the question door](phase-03-question-door.md) | 1 | packages/questions/contracts/questions-input.v1.json, packages/questions/contracts/question-event-payloads.v1.json, packages/questions/contracts/refusals.v1.json, packages/questions/rust/src/shape.rs, packages/questions/rust/src/record.rs, packages/questions/rust/src/usecase.rs, packages/questions/rust/tests/store_usecases.rs, apps/fgos/src/wiring/questions.rs, docs/platform/questions/spec.md | 2 | draft |
| 4 | [Skills that ask questions fill the default](phase-04-skills-fill-default.md) | 1, 3 | core/skills/_shared/owner-communication.md, core/skills/_shared/plan-contract.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-secretary/SKILL.md, domains/coding/skills/fgos-coding-shaping/SKILL.md, domains/coding/skills/fgos-coding-planning/SKILL.md, packages/git/contracts/mutation-census.v1.json, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | draft |
| 5 | [Integration: changelog and full gate](phase-05-integration.md) | 1, 2, 3, 4 | CHANGELOG.md, plans/261122-1950-owner-communication-standard/reports/** | 4 | draft |

Wave reasoning: phase 1 and phase 2 share no file and run at once. Phase 3 waits for phase 1 only because both
edit `docs/platform/questions/spec.md`. Phase 4 waits for phase 3 because skills must not tell agents to fill a
field the door still refuses (`additionalProperties: false`), and for phase 1 because both rebuild the
generated skill surfaces (hot files). `CHANGELOG.md` has one writer, the last phase.

Phase 1 is not split further on purpose: every caller edit is a link change into a skill or doc, and every
skill edit rebuilds the same generated surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`), so a split would
put two writers on one hot file, and deleting the old files must happen with the last caller move (L10).

### Decisions taken in this plan

- **Task 3 stays in this plan, not folded into `261122-0056-orchestration-skeleton`.** That plan is `draft` and
  blocked by two other plans, so folding would hold a small owner-visible gain behind them (product priority 1).
  The overlap is three files in `packages/questions/`; when that plan is set `ready` it rebases on this one and
  either adds `blockedBy: [261122-1950-owner-communication-standard]` or lands after it. Its `fgos-supervisor`,
  `fgos-lead` and `plan-contract.md` entries overlap phase 1 and 4 the same way.
- **One file plus one instruction** (OC-D6): `core/skills/_shared/owner-communication.md` holds the whole standard;
  `core/instructions/owner-communication.md` holds the motive and principle in a few lines and points to it.
- **The default field** is `parts.default`, a non-empty string saying what the asker does, and when, if no answer
  comes. Required whenever options are required (the `decided` shape); optional under the discovery exception,
  where there are no options to default to. Optional on read, so questions already in the store still fold.
- **Answer by letter** (case C5: the owner typed sentences where one letter would do): `--option` accepts `A` to `D`
  as the position in display order, recommended first, besides the full label.
- **Friction layer value** is `owner-communication`; the signature (`--error-class`) carries the kind of fault
  (permission-asking, unexplained-id, too-long, wrong-language, ...) per OC-D4 point 3.
- **Report shape**: the three "At most 10 lines" lines in `fgos-lead`, `fgos-secretary`, `fgos-supervisor` become a
  pointer to the standard's status-report shape, keeping each skill's own file-location sentence.

### Prior art

Reused: the five-part decision-question text and the approved-frame rule (moved into Part B point 8 and Part A
unchanged in substance); the instruction projection that renders `core/instructions/*.md` with `appliesTo: ["*"]`
into each project's `AGENTS.md` (`src/setup/instruction-projections.mjs`); the friction store and its layer list
(`packages/observe/rust/friction-kinds.json`, a data-only change per `docs/platform/observe/spec.md` line 136);
the question door's existing `recommended` flag and its shape check (`packages/questions/rust/src/shape.rs`).
Missing and added: an owner-communication layer value, a stated default field, lettered display and letter
answers. The guard `fgos hook decision-question` (commit 3d3d32648) keeps its name and job.

### Contract check

`node scripts/plan-contract-check.mjs --plan plans/261122-1950-owner-communication-standard` was run; result in
the landing commit's message. Same-wave footprints (phases 1 and 2) are disjoint.

## Owner questions

None. Every point the discussion left open is decided above from its evidence; the T-signal list is written as
provisional (discussion section 6, step 3) and refined by the coach later.

## Risks and rollback

- **Live agents asking without the new field get refused** after phase 3 lands and before phase 4. The refusal
  names `parts.default`, so an agent can fix and re-ask; phase 4 follows directly. Proof point: phase 3's test that
  the refusal names the field.
- **The activated release lags the source**: plain `fgos` keeps running the old release until a new one is
  staged and activated, so heads still see the old text and are refused `friction record` (discussion hand-off,
  19:35). The fallback in OC-D14 (write the facts into the working file) covers it; activation is not in this plan.
- **Mutation census drift**: `packages/git/contracts/mutation-census.v1.json` hashes skill files. Phases 1 and 4
  regenerate it with its own script; if phase 2 or 3 reports census drift, the phase stops and raises it rather
  than editing outside its footprint.
- **Standard too long to be read**: OC-D6's reverse condition; if the fragment passes about 200 lines, phase 1
  keeps only the curated cases that carry a distinct lesson.
- **Rollback**: each phase lands as one commit; `git revert` of the phase commits in reverse wave order restores
  the old files and door. Phase 1 alone is safe to revert as a unit because it holds every caller move.
