---
contract: plan-v1
title: "Gather every fgOS rule to one owner in the Agent Context Engine and resolve the 14 measured conflicts"
status: done
lead: head:lead-forgent-261125-2041-gather-52cd9
priority: P1
blockedBy:
  - 261125-1631-agent-context-engine
  - 261122-2108-delete-dead-node-execution-closure
  - 261124-0004-heads-operate-without-owner
base: 0a5d19f47b7cc0adf10d3073b100068bd5ff90a6
footprint:
  - plans/261125-2041-gather-fgos-rules-to-one-owner/**
  - core/instructions/**
  - components/*/instructions/**
  - domains/*/instructions/**
  - .fgos/instructions/effective/**
  - AGENTS.md
  - core/skills/**
  - core/agents/**
  - core/prompt-templates/**
  - domains/coding/skills/**
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - .claude/agents/**
  - packages/agent-start-context/goldens/**
  - test/docs/**
  - CHANGELOG.md
source:
  - plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
  - p-y3umlovk73
created: 2026-11-25
---

# Gather every fgOS rule to one owner

> **Runs on the fg-server machine (owner order, 2026-11-26).** This plan is worked only on fg-server (lead `lead:RULE` there). No agent on fg-server2 or any other machine starts, restarts, admits, closes or lands work for it; on fg-server2 a `plan-no-progress`, `head-gone` or `leadLive: false` for it is expected and is marked handled with no action.

## Outcome

Every fgOS-owned rule has one owner unit in the Agent Context Engine (ACE-D1), and every other place that stated it
points to that unit instead of restating it. The 31 duplicate clusters and all 14 conflicts C1-C14 measured in the
[P2 report](../reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md) are resolved; the gathering is not
done until all 14 are (ACE-D4). The hand-written fgOS rule sections of `AGENTS.md` move into units with no `when:`
restriction, so the rendered `AGENTS.md` still carries every rule; scoping them by L8 is ASC phase 9's, which starts
only when this plan is `done` (owner, 2026-11-25 20:4x).

This was phase 5 of plan [261125-1631-agent-context-engine](../261125-1631-agent-context-engine/plan.md) (discussion
task [#task-gather-rules](../discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md)). The owner moved it to its
own plan on 2026-11-25 20:4x, answering that plan's owner question 5 with yes, so a parked conflict question stalls
only this plan and ASC 9, not the rest of ASC.

## Prior art

- The P2 report (2026-11-25): 519 statements from 72 files, 31 clusters each with a suggested owner, 14 conflicts
  C1-C14 with their lines. Its method is the rerun method of criterion 1.
- ACE (plan `261125-1631`): the rule-unit schema and `when:` keys (phase 1), the compile and check door
  `fgos internal context-engine compile|check` and the migrated 7 units (phase 3), and the write-time check with the
  nearest-rule search in the pre-commit hook (phase 4). Every unit written here passes through them; nothing here
  re-implements a check.
- The anchor tests `test/docs/rul11-anchor-phrase.test.mjs`, `rul104-anchor-phrase.test.mjs`,
  `agents-doctrine-anchors.test.mjs`, `run-doors-doctrine.test.mjs` (L8 rule 3); they move with their phrase.
- `npm run build:skills`: the one generator of the skill render surfaces and the AGENTS.md projection block.
- **Missing, and built here:** the move table (owner unit and pointers per cluster), and the resolution of each
  conflict.

## Acceptance criteria

1. The P2 method, rerun on the merged tree by an independent agent with the same corpus definition, finds no
   duplicate cluster outside pointers and none of C1-C14. Its report is under this plan's `reports/` (phase 1).
2. Every rule in `reports/gather-table.md` has one owner unit that is in `.fgos/instructions/effective/rules.json`,
   and its text is in the rendered `AGENTS.md` (phase 1).
3. Each of C1-C14 is resolved by one kept statement, recorded as "C<n>: kept <rule>, because <evidence>" in the
   commit body and in the table; a conflict whose evidence does not settle it, or whose choice changes a behaviour
   an owner already decided, is a five-part owner question and the plan is not `done` until it is answered (ACE-D4).
4. `fgos internal context-engine check` passes on all units; the RUL11 and RUL104 anchor tests pass without being
   weakened (`node scripts/run-tests.mjs test/docs test/setup`) (phase 1).
5. `npm test` and `cargo test --workspace` are green on the merged tree (phase 2).

## Non-goals

- The rule store, schema, compile door and write-time check: plan `261125-1631`.
- Scoping units by start facts (L8) and the AGENTS.md byte cut: ASC phase 9.
- Rewording text that is not part of a conflict.
- Skill-local rules stated in exactly one place, unless owner question 2 decides otherwise.
- AgentKit, GitNexus and MDView text (ASC-D2).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Gather every fgOS rule to one owner](phase-01-gather-rules.md) | - | core/instructions/**, components/*/instructions/**, domains/*/instructions/**, .fgos/instructions/effective/**, AGENTS.md, core/skills/**, core/agents/**, core/prompt-templates/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, .claude/agents/**, packages/agent-start-context/goldens/**, test/docs/**, plans/261125-2041-gather-fgos-rules-to-one-owner/reports/** | 1 | done |
| 2 | [Integration gate, changelog](phase-02-integration.md) | 1 | CHANGELOG.md | 2 | done |

Ticket `c-2271-1795691361563` (gemini, worktree `261125-2041-gather-fgos-rules-to-one-owner-p01`, branch
`gather-fgos-rules-to-one-owner/p01`) was started by the fg-server2 lead before it saw the progress below; it duplicates
phase 1 and is not to be landed. The phase continues on `gather-rules/p01` once the owner lifts the pause; the
duplicate's run is to be stopped and its worktree discarded by the supervisor.
The fg-server2 lead ended at 18:21 (event `lead-ended`); it is not restarted while the owner pause holds. The duplicate
run was still live at 18:30; its stop and discard wait on owner question `q-42sigq3of6`.

### Progress (lead on fg-server, 2026-11-26)

Started 2026-11-26 after the context engine plan was `done`. Phase 1 is in progress on branch `gather-rules/p01` (not landed):
the move table `reports/gather-table.md` (31 clusters, 14 conflicts: 12 settled by evidence, one parked, two owner
questions) and batch U1 (eight new rule units) are committed there; batches U2, U3, P1 to P5 and A are not started.
**Paused by the owner at 2026-11-26 18:20** to look first at changes to the context engine's `when:` labels made on the other
machine; resume at batch U2 after merging main. Owner questions filed in the store: `q-ni4vxzxqwa` (conflict C2),
`q-ipifo7ty53` (conflict C6), `q-3oqocuhfht` (order with the communication standard plan). Decided by the lead on the plan's
own recommendation: owner question 2 below (single-location skill rules stay), and criterion 2 reads "owner unit or owner
persona file" because a persona description is read at start without opening a file.

### Done (fg-server, 2026-11-27)

Phase 1 landed in eight gathering rounds (`gather-rules/p01` through `p01r8`); each round fixed what the previous
independent check found. Criterion 1: the sixth independent rerun
(`reports/research-261127-0500-gather-rules-rerun-6.md`) found no duplicate cluster outside pointers, no broken
`Rule:` pointer (119 pointers, 17 ids, each in `rules.json` and AGENTS.md) and no missing path. Its one remaining
item, stale claim-release wording in three coding skills, was fixed in round 7. Criteria 2 and 3: the move table
`reports/gather-table.md` and the commit bodies. C2 and C6 were answered by the owner (option A for both), and the
parked asking-a-person rules were gathered into `product-priority-order`. Criterion 4: `fgos internal context-engine
check` passes; `test/docs` and `test/setup` pass. Round 8 merged the RUL11 and RUL104 anchor tests' duplicate body
into one test, without weakening either.

Criterion 5 (phase 2), the full gate on main at `a7ec1ef7d`, run with debuginfo off to fit the disk: npm test and
`cargo test --workspace` are not fully green, and no failure touches the gathered rules.
- One failure came from the start-context plan's Observe declaration list. It is fixed in the same commit that
  closes this plan.
- The rest were already on main before this plan:
  - herdr pane timeouts (`test/run-supervisor/terminal-cutover.test.mjs`, `terminal-crash-matrix.test.mjs`);
  - `fgctl` upgrade and init (`test/rust-host/fgctl-upgrade.test.mjs`, `fgctl-init-download-sources.test.mjs`);
  - bwrap credential provisioning (`test/runner/provider-per-cli-credential-sources.test.mjs`);
  - the workflow guide schema (`test/workflow/guide-schema.test.mjs`);
  - a concurrent-prune race (`test/workflow/case-close.test.mjs`);
  - two `fgos-run-supervisor` head-request tests that depend on the machine.
- The changelog line is under `## [Unreleased]`.

Baseline evidence (2026-11-27 06:00, fg-server): each failing file was rerun on `f68937f41`, the main of the start
of this work, before either plan's later lands. Every failure is already there:
- `terminal-cutover` 8 failures and `terminal-crash-matrix` 1 (herdr pane timeouts);
- `fgctl-upgrade` 19 and `fgctl-init-download-sources` 4 (main now: 9 and 2);
- `provider-per-cli-credential-sources` 2;
- `guide-schema` 2;
- the same two `fgos-run-supervisor` head-request tests.

`case-close` passes on main when run alone (three runs out of three), so its failure in the full suite is a timing
race under load. No failure is introduced by these plans. The suites are therefore green except for failures that
predate the plans and lie outside their footprints. Each phase's own rule was to fix nothing outside its footprint,
so they are left to their owners.

Gate rerun (2026-11-27 08:40, fg-server, main at `6c14b0fdc`), after the earlier failures were fixed at their cause:
- `fgctl`: the init fixture now keeps directory modes;
- credential provisioning under bwrap: a production fix;
- `guide-schema`: a stale test;
- the herdr terminal cases: the harness now runs confined;
- the head-request mail case: it now binds its own Identity state.

Result:
- `cargo test --workspace` is green (exit 0).
- `npm test`: 6,543 pass and 1 fail of 6,571. The failing test, "the orphan sweep kills a run the harness did not
  finish..." (`test/scripts/mailbox-live-confined.test.mjs`), passes 19 of 19 when run alone, three times out of
  three: a timing race under full-suite load, not a defect.

Final gate (2026-11-27 13:00, fg-server, main at `22a23e5d7`), green to the letter: `npm test` exits 0, with 6,545
pass and 0 fail of 6,572; `cargo test --workspace` exits 0. The last failures were fixed at their cause:
- `case-close`: the concurrent prune races in `src/workflow/case-close.mjs`;
- the `.fgos` write witness: it now sees directories that `mkdtemp` makes;
- the supervisor flag-drift test: it now reads the `widen` parser;
- the config fixture: a duplicate entry removed;
- the head-request host exec: it now waits out ETXTBSY.

The owner chose to activate only on a green gate. Release `b6eb617b59e0` was built from this main and activated on
fg-server. Its four red doctor rows (hook wiring, a missing tool, `tsk-5db`, provider quarantine) predate both plans.

### Waits on other plans

| phase | waits for | shared files or data |
|---|---|---|
| 1 | `261125-1631` (ACE), whole plan | its compile and check door (phase 3), the write-time check (phase 4), `core/instructions/**`, `.fgos/instructions/effective/**`, `CHANGELOG.md` (phase 6) |
| 1 | `261122-2108` | `core/skills/fgos-run/SKILL.md`, `core/skills/_shared/capability-catalog.md`, `core/skills/_shared/capability-matching.md` |
| 1 | `261124-0004` | `core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`, `core/agents/{secretary,supervisor}.yaml` |
| 1 | `261122-1950` (draft) | the asking-a-person doctrine; order is owner question 1 |

ASC phase 9 waits for this whole plan (owner join point). No phase here waits for ASC. `261114-2051` phase 11 edits
single `AGENTS.md` paragraphs without a frontmatter footprint; phase 1 rebases over it.

### Hot files, one writer per wave

Inside this plan, phase 1 is the only writer of every file but `CHANGELOG.md` (phase 2). Across plans, phase 1 can
run while ASC phases 5, 7 and 8 run. The files both may touch are all generated or new-file-only, and each is
regenerated by its own tool by whichever lands second, never merged by hand:

| file | other writer | how it is kept to one writer at a time |
|---|---|---|
| `.fgos/instructions/effective/**` | ASC 5 (ritual units) | generated: the second lander reruns `fgos internal context-engine compile` |
| `core/instructions/**` | ASC 5 adds new unit files only (the ritual and first steps) | different files; a ritual sentence that restates a gathered rule is refused by ACE 4's pre-commit check for whichever lands second, which then points to the other |
| `.claude/agents/**` | ASC 5 (regenerated through `compose`) | generated by `scripts/project-agents.mjs`; the second lander regenerates |
| `packages/agent-start-context/goldens/**` | ASC 5, 7, 8 | only when ASC 5 has landed and this phase changes persona text that an opening shows; the golden test's update mode regenerates the touched cases, named in `NOTES.md` |
| `core/agents/**` | none (ASC 5 no longer edits persona files) | - |

`AGENTS.md` and `test/docs/**` are written by ASC 9 only after this plan is `done`; `CHANGELOG.md` by ASC 11 later.
The owner chose to run the plans one after another, ACE then this plan then ASC (2026-11-25 21:0x; recut report
`plans/reports/planner-261125-2038-ace-asc-plan-recut.md`, question A), so no ASC phase runs beside this plan.

## Authority map

No component, contract, door or decision kind is created or moved. Rule text moves between files whose owners stay
as they are; the owner of each unit is the component or domain of its root, checked by ACE's owner registry.

| New or moved thing | Model row | Note |
|---|---|---|
| Repo-wide rule units under `core/instructions/` and the compiled set | `docs.packaging-distribution/instruction-composition-and-projection` | The composition half of this row moves to `agent-context-engine` in ACE phase 3, before this plan starts; this plan adds units, no row. |
| Hand-written fgOS rule sections of `AGENTS.md` (laws index, priority, doctrine) | `platform-foundations` | Text moves into units; the laws themselves stay in `docs/platform/platform-foundations.md`. |
| Coding-domain rule units and coding skills | `coding-domain` | Copies in `domains/coding/skills/**` become pointers. |
| Copies in core skills and shared skill references | `domain-components` | Copies become pointers to unit ids. |
| Copies in persona definitions `core/agents/*.yaml` | `runner` | Copies become pointers; `.claude/agents/**` is regenerated. |
| Render surfaces `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`, the projection block | `packaging-distribution` | Regenerated by `npm run build:skills`, never edited by hand. |

## Owner questions

Carried over unanswered from plan `261125-1631` (details in
`plans/reports/planner-261125-1631-agent-context-engine-plan.md`):

1. **Order with the communication standard plan `261122-1950`** (was ACE Q2). Both rewrite the asking-a-person
   doctrine (clusters 12-14 and 19, conflict C7). Recommendation there: 1950 lands first. Still open.
2. **Scope of "every rule" (ACE-D1) for skill-local rules** (was ACE Q3). Recommendation there: move rules stated in
   more than one place plus every hand-written AGENTS.md rule; a rule stated in exactly one skill stays there. Still
   open; phase 1 assumes the recommendation.
3. **Approval id** (ACE Q1, ASC Q2) does not apply here: this plan declares nothing.

## Risks and rollback

- **Breadth.** Many skills change at once. Mitigations: the move table first, pointer-only edits outside conflicts,
  regenerated surfaces, and the independent rerun of criterion 1.
- **A parked conflict.** A conflict that needs the owner parks only itself; phase 1 lands the rest and stays open
  until the answer, and only ASC 9 waits (owner join point).
- **Rule loss.** Criterion 2 proves each moved rule is in the compiled set and in the rendered `AGENTS.md`; the anchor
  tests follow their phrase.
- **Concurrent edits.** `261124-0004`, `261122-2108` and `261114-2051` edit single lines of the same skills or
  `AGENTS.md`; phase 1 rebases over them and rechecks the table.
- **Rollback.** Revert the phase's commits; the copies and conflicts return, and the units added here go away.
  The compiled set and the render surfaces are regenerated from the reverted sources.
