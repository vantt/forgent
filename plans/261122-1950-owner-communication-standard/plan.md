---
contract: plan-v1
title: "Communication standard (tiêu chuẩn giao tiếp): one always-loaded standard for how every agent talks to the owner, and cheap answers in the question door"
status: running
priority: P1
blockedBy: []
footprint:
  - plans/261122-1950-owner-communication-standard/**
  - core/skills/_shared/owner-communication.md
  - core/instructions/owner-communication.md
  - core/skills/_shared/decision-question.md
  - core/instructions/decision-question-template.md
  - core/instructions/product-priority-order.md
  - core/skills/_shared/coordination-driver.md
  - core/skills/_shared/plan-contract.md
  - core/skills/_shared/friction-capture.md
  - core/skills/_shared/write-door.md
  - core/skills/fgos-cook/SKILL.md
  - core/skills/fgos-cook/references/case-and-doors.md
  - core/skills/fgos-cook/references/propose.md
  - core/skills/fgos-cook/references/reading-ak-plans.md
  - core/skills/fgos-run/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-shaping/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - core/agents/secretary.yaml
  - core/agents/shaper.yaml
  - core/agents/supervisor.yaml
  - .claude/agents/secretary.md
  - .claude/agents/shaper.md
  - .claude/agents/supervisor.md
  - domains/coding/skills/fgos-coding-discovering/SKILL.md
  - domains/coding/skills/fgos-coding-exploring/SKILL.md
  - domains/coding/skills/fgos-coding-implement/SKILL.md
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
  - packages/agent-start-context/goldens/**
  - packages/observe/rust/friction-kinds.json
  - packages/observe/rust/src/friction.rs
  - packages/questions/contracts/questions-input.v1.json
  - packages/questions/contracts/question-event-payloads.v1.json
  - packages/questions/contracts/refusals.v1.json
  - packages/questions/rust/src/shape.rs
  - packages/questions/rust/src/record.rs
  - packages/questions/rust/src/usecase.rs
  - packages/questions/rust/tests/store_usecases.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx
  - apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx
  - src/state/decision-question.mjs
  - src/state/status-fsm.mjs
  - test/docs/rul11-anchor-phrase.test.mjs
  - test/state/awaiting.test.mjs
  - AGENTS.md
  - .fgos/instructions/effective/**
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - changelog.d/261122-1950-owner-communication-standard.md
  - apps/fgos/tests/questions_verb.rs
base: 303d8f6c081ac28c6f6dc6c613ec535affc20dda
source:
  - plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md
  - p-wb6rkwpjsg
created: 2026-11-22
lead: head:lead-forgent-261122-1950-owner-2eb2c
host: fg-server2-jdp2bv
---

# Communication standard (tiêu chuẩn giao tiếp)

Answers the settled discussion `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`
(decisions OC-D1, OC-D3 to OC-D14; OC-D2 superseded by OC-D8, OC-D7 item 1 by OC-D13) and backlog row
`p-wb6rkwpjsg`. The discussion's task 1 is phases 1 and 2; its task 3 is phases 3 and 4.

**Refreshed 2026-11-28** by head:planner-ds-cfsfcbknl6 against base `e31dc58435`. The 2026-11-22 version was
held behind five plans on the owner's order ("runs last"); all five are now `done`, so `blockedBy` is empty. The
tree moved under it, and this refresh re-traced the footprint: the always-loaded instruction is now
`core/instructions/decision-question-template.md` (rule-unit frontmatter, compiled into
`.fgos/instructions/effective/rules.json`); the fragment gained the **When to ask** section (plan
`261127-0144-when-to-ask-owner-rule`, done), which moves into the standard word for word; new callers appeared
(`core/agents/*.yaml` and their rendered `.claude/agents/*.md`, the 16 start-context goldens, `write-door.md`,
`product-priority-order.md`, three `fgos-cook` references); the gateway web screen also renders options; and
changelog entries now go to a `changelog.d/` fragment, never `CHANGELOG.md`. The Authority map and Unattended
run sections are added. Scope is unchanged.

## Outcome

Every head, lead and worker, in every agent CLI, loads one standard, **tiêu chuẩn giao tiếp**, that tells it
why the owner's attention matters (the owner is overloaded, OC-D8), the principle judged from the reader's
side and its test before sending, and three parts: A conduct (OC-D9, OC-D10, the noticing and recording duty
of OC-D14), B presenting information in nine points with a fixed shape per kind of message (OC-D11), and
C when and where to speak (which carries today's When to ask rule unchanged), plus a few curated cases. It
replaces both decision-question files; no caller points to the old paths. An agent that sees its communication
fell short records a friction under a new `owner-communication` layer (OC-D4, OC-D14). Every owner question in
the question door carries a stated default ("if no answer by X, I take A"), its options are shown lettered A to
D with the recommended one first, and the owner can answer with the letter alone (OC-D7 item 2, case C5).

## Acceptance criteria

1. [core] `git grep -n -e "_shared/decision-question" -e "decision-question.md" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md' ':!changelog.d' ':!packages/agent-start-context/goldens/NOTES.md'`
   prints nothing (the goldens NOTES file is an append-only log whose old entries stay as written), and `core/skills/_shared/owner-communication.md` and `core/instructions/owner-communication.md`
   exist (phase 1).
2. [core] `AGENTS.md`'s fgOS Effective Instructions block carries the standard's always-loaded instruction (id
   `owner-communication`) and no `decision-question-template` entry, proven by
   `node --test test/docs/rul11-anchor-phrase.test.mjs` (phase 1).
3. [core] `npm run build:skills && node scripts/project-agents.mjs` leaves `git status --porcelain` empty after
   each phase that edits a skill or agent source, and `node --test test/scripts/project-agents.test.mjs` passes
   against the recaptured goldens (phases 1 and 4).
4. [core] `owner-communication` is an accepted friction layer: the observe crate's test that enumerates the layer
   list accepts it, and `docs/platform/observe/spec.md` lists the value (phase 2).
5. [core] `fgos questions ask` with options but no `parts.default` is refused `question-unclear` naming
   `parts.default`; a discovery question without options is still accepted without it
   (`cargo test` of the questions crate, phase 3).
6. [core] `fgos questions <id>` shows options as `A.` to `D.`, the recommended one first, and the default line;
   `fgos questions answer <id> --option A` resolves to that option's label; the gateway's Needs-answer screen
   shows the same letters (phase 3).
7. [core] Questions already in the store without a default still fold and display (phase 3).
8. [core] `fgos release check --worktree <integrated worktree>` green on the combined tree (it runs `npm test`
   and `cargo test --workspace`); `changelog.d/261122-1950-owner-communication-standard.md` holds one line for the
   standard and one for the question door (phase 5).

## Non-goals

- Keeping information valid: fresh data, stale questions, nudging the concerned agent (OC-D1, OC-D12).
- The coach role and the observation cluster with pre-built views (OC-D5, OC-D13; backlog `p-kmavlfevvu`).
- Any hook that scans the owner's incoming messages (OC-D13) or checks the agent's outgoing messages
  (OC-D7 item 3).
- Renaming the `fgos hook decision-question` guard, its hook kind, `src/state/decision-question.mjs` or
  `scripts/decision-question-hook.mjs`: an install contract (`packages/distribution/contracts/agent-hooks.v1.json`)
  the discussion did not ask to change. Prose that names "the decision-question template" as the guard's check
  (doctor registry rows, test comments, specs' history lines) stays: the decision question remains a named
  application inside the standard. Only path references move.
- Changing the approved-frame rule, the When to ask rule or the product priority order: they move into the
  standard word for word.
- Changing a locked law: `docs/platform/platform-foundations.md` only gets its link updated.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The communication standard fragment `core/skills/_shared/owner-communication.md` (asking, reporting and presenting to the owner) | `questions` | survivor: `core/skills/_shared/owner-communication.md`; retired: `core/skills/_shared/decision-question.md` |
| The always-loaded instruction unit `owner-communication` | `agent-context-engine/rule-unit.v1` | survivor: `core/instructions/owner-communication.md`; retired: `core/instructions/decision-question-template.md` |
| Friction layer value `owner-communication` | `observe/observe.friction.v1` | one value in `packages/observe/rust/friction-kinds.json`; survivor: the JSON declaration; retired: the hand-copied `PUBLISHED_LAYERS`, `PUBLISHED_KINDS` and `PUBLISHED_DISPOSITIONS` lists in `packages/observe/rust/src/friction.rs`, which now read the same file |
| `parts.default` field, lettered display, answer by letter | `questions/questions-input.v1` | extends the existing ask and answer contract; no new verb |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Write the standard and move every caller](phase-01-standard-and-callers.md) | - | core/skills/_shared/owner-communication.md, core/instructions/owner-communication.md, core/skills/_shared/decision-question.md, core/instructions/decision-question-template.md, core/instructions/product-priority-order.md, core/skills/_shared/coordination-driver.md, core/skills/_shared/plan-contract.md, core/skills/_shared/friction-capture.md, core/skills/_shared/write-door.md, core/skills/fgos-cook/SKILL.md, core/skills/fgos-cook/references/case-and-doors.md, core/skills/fgos-cook/references/propose.md, core/skills/fgos-cook/references/reading-ak-plans.md, core/skills/fgos-run/SKILL.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, core/agents/secretary.yaml, core/agents/shaper.yaml, core/agents/supervisor.yaml, .claude/agents/secretary.md, .claude/agents/shaper.md, .claude/agents/supervisor.md, domains/coding/skills/fgos-coding-discovering/SKILL.md, domains/coding/skills/fgos-coding-exploring/SKILL.md, domains/coding/skills/fgos-coding-implement/SKILL.md, domains/coding/skills/fgos-coding-validating/SKILL.md, domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md, docs/knowledge/why-a-gate-dialogue-keeps-the-agent-s-checkpoint-separate-fr/gate-checkpoint-vs-answer-separation.md, docs/platform/agent-mailbox/spec.md, docs/platform/documentation/subcomponents/admission/spec.md, docs/platform/platform-foundations.md, docs/platform/questions/spec.md, docs/reading-map.md, packages/yaml-doc/upgrade-record.md, packages/git/contracts/mutation-census.v1.json, packages/agent-start-context/goldens/**, src/state/decision-question.mjs, src/state/status-fsm.mjs, test/docs/rul11-anchor-phrase.test.mjs, test/state/awaiting.test.mjs, AGENTS.md, .fgos/instructions/effective/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | done |
| 2 | [Friction layer value for owner communication](phase-02-friction-layer.md) | - | packages/observe/rust/friction-kinds.json, packages/observe/rust/src/friction.rs, docs/platform/observe/spec.md | 1 | done |
| 3 | [Stated default and lettered options in the question door](phase-03-question-door.md) | 1 | packages/questions/contracts/questions-input.v1.json, packages/questions/contracts/question-event-payloads.v1.json, packages/questions/contracts/refusals.v1.json, packages/questions/rust/src/shape.rs, packages/questions/rust/src/record.rs, packages/questions/rust/src/usecase.rs, packages/questions/rust/tests/store_usecases.rs, apps/fgos/src/wiring/questions.rs, apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx, apps/fgos-gateway/web/src/screens/NeedsAnswer.test.tsx, docs/platform/questions/spec.md, `apps/fgos/tests/questions_verb.rs` | 2 | running |
| 4 | [Skills that ask questions fill the default](phase-04-skills-fill-default.md) | 1, 3 | core/skills/_shared/owner-communication.md, core/skills/_shared/plan-contract.md, core/skills/fgos-lead/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-shaping/SKILL.md, core/skills/fgos-secretary/SKILL.md, domains/coding/skills/fgos-coding-shaping/SKILL.md, domains/coding/skills/fgos-coding-planning/SKILL.md, packages/git/contracts/mutation-census.v1.json, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | ready |
| 5 | [Integration: changelog fragment and full gate](phase-05-integration.md) | 1, 2, 3, 4 | changelog.d/261122-1950-owner-communication-standard.md, plans/261122-1950-owner-communication-standard/reports/** | 4 | ready |

Wave reasoning: phase 1 and phase 2 share no file and run at once. Phase 3 waits for phase 1 only because both
edit `docs/platform/questions/spec.md`. Phase 4 waits for phase 3 because skills must not tell agents to fill a
field the door still refuses (`additionalProperties: false`), and for phase 1 because both rebuild the
generated skill surfaces (hot files). The changelog fragment has one writer, the last phase.

Phase 1 is not split further on purpose: every caller edit is a link change into a skill, agent or doc, and every
skill or agent edit rebuilds the same generated surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`,
`.claude/agents/*.md`, the goldens), so a split would put two writers on one hot file, and deleting the old files
must happen with the last caller move (L10).

Contract check: `node scripts/plan-contract-check.mjs --plan plans/261122-1950-owner-communication-standard` and
`fgos resource-check --plan plans/261122-1950-owner-communication-standard` were run on this refresh; the
same-wave footprints (phases 1 and 2) are disjoint. Cross-plan overlap with the running plan
`261128-0942-session-type-submits-enter` (`docs/platform/agent-mailbox/spec.md`, `core/skills/fgos-supervisor/SKILL.md`
and its generated copies) is a warning met at land, not an ordering.

### Decisions taken in this plan

- **Refresh in place, not a new plan.** The discussion already has this plan as its one live plan and the backlog row
  links it; a second plan dir would leave two plans for one topic (design principle 1). Scope is unchanged, so the
  dir and `created` date stay.
- **Task 3 stays in this plan.** The overlap with `261122-0056-orchestration-skeleton` is gone: that plan is `done`.
- **One file plus one instruction** (OC-D6): `core/skills/_shared/owner-communication.md` holds the whole standard;
  `core/instructions/owner-communication.md` is a rule unit (same frontmatter keys as
  `decision-question-template.md`: `kind: law`, `owner: core`, `scope: repo`, `mode: append`) holding the motive
  and principle in a few lines and pointing to it. The When to ask section keeps its anchor `{#when-to-ask}`, so
  pointers move as `owner-communication.md#when-to-ask`.
- **The default field** is `parts.default`, a non-empty string saying what the asker does, and when, if no answer
  comes. Required whenever options are required (the `decided` shape); optional under the discovery exception,
  where there are no options to default to. Optional on read, so questions already in the store still fold.
- **Answer by letter** (case C5): `--option` accepts `A` to `D` as the position in display order, recommended
  first, besides the full label. Today askers often start labels with "A." by hand; display strips nothing and
  adds the letter only when the label does not already start with that same letter and a dot.
- **Friction layer value** is `owner-communication`; the signature (`--error-class`) carries the kind of fault
  (permission-asking, unexplained-id, too-long, wrong-language, ...) per OC-D4 point 3. The detail is a short
  redacted paraphrase, never the owner's words verbatim: friction records sit in a git-tracked path.
- **Report shape**: the "At most 10 lines" sentences in `fgos-lead`, `fgos-secretary`, `fgos-supervisor` become a
  pointer to the standard's status-report shape, keeping each skill's own file-location sentence.

### Prior art

Reused: the five-part decision-question text, the approved-frame rule and the When to ask section (moved into the
standard unchanged in substance); the rule-unit compile that renders `core/instructions/*.md` into `AGENTS.md` and
`.fgos/instructions/effective/rules.json` (`npm run build:skills`); `scripts/project-agents.mjs` and the goldens
recapture pattern of plan `261127-0144-when-to-ask-owner-rule` (`reports/recapture-goldens.sh`); the friction store
and its closed layer list (`packages/observe/rust/friction-kinds.json`); the question door's existing
`recommended` flag and its shape check (`packages/questions/rust/src/shape.rs`). Found on this refresh: the
discussion took adding a layer to be data only (as `docs/platform/observe/spec.md` says), but the record door checks
`PUBLISHED_LAYERS`, a hand copy of the JSON list in `packages/observe/rust/src/friction.rs`; phase 2 makes the code
read the JSON it already embeds, so the spec's sentence becomes true (RUL11, design principle 7). Missing and added: an
owner-communication layer value, a stated default field, lettered display and letter answers. The guard
`fgos hook decision-question` (commit 3d3d32648) keeps its name and job.

## Unattended run

### Host steps

| step | argv | executor |
|---|---|---|
| full gate on the integrated tree | fgos release check --worktree <integrated worktree> | lead |

### Cleanup

Standing rule.

### Beyond the rule

None. No trust boundary, component, decision kind or locked law changes; `parts.default` extends an existing
contract under its own owner; every step is revertible by `git revert`.

### Split

Parallel by file boundary: the friction layer (phase 2) runs beside the standard (phase 1); the door (phase 3) and
the skill examples (phase 4) follow in order because they share a spec file and the generated skill surfaces. One
step per phase, no staged compatibility releases: the only live-facing break (askers without `parts.default`
refused between phases 3 and 4) is short, self-explaining, and closed by phase 4.

## Owner questions

None. Every point the discussion left open is decided above from its evidence; the T-signal list is written as
provisional (discussion section 6, step 3) and refined by the coach later. The owner's 2026-11-22 order that this
plan runs last is met: every plan it was held behind is `done`.

## Risks and rollback

- **Live agents asking without the new field get refused** after phase 3 lands and before phase 4. The refusal
  names `parts.default`, so an agent can fix and re-ask; phase 4 follows directly. Proof point: phase 3's test that
  the refusal names the field.
- **The activated release lags the source**: plain `fgos` keeps running the old release until a new one is
  staged and activated, so heads still see the old text. The fallback in OC-D14 (write the facts into the working
  file) covers a refused `friction record`; activation is not in this plan.
- **Mutation census and goldens drift**: `packages/git/contracts/mutation-census.v1.json` hashes skill files and the
  start-context goldens copy the agent files. Phases 1 and 4 regenerate both with their own scripts; if phase 2 or 3
  reports such drift, the phase stops and widens through `fgos supervisor widen` rather than editing outside its
  footprint.
- **Standard too long to be read**: OC-D6's reverse condition; if the fragment passes about 220 lines (it now also
  carries When to ask, about 75 lines), phase 1 keeps only the curated cases that carry a distinct lesson.
- **Rollback**: each phase lands as one commit; `git revert` of the phase commits in reverse wave order restores
  the old files and door. Phase 1 alone is safe to revert as a unit because it holds every caller move.
