---
contract: plan-v1
title: "A shaper runs in its own worktree and branch: rounds are saved on the branch, the discussion lands on main once"
status: running
priority: P0
blockedBy: []
footprint:
  - plans/261125-1557-shaper-worktree/**
  - apps/fgos/src/wiring/unit_run_host/session_attempt.rs
  - apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs
  - packages/execution/contracts/execution-routes/execution-routes.v1.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/src/route.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/session-host/rust/src/permissions.rs
  - packages/session-host/rust/tests/permissions.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - packages/run-supervisor/rust/examples/internal_harness.rs
  - apps/fgos/tests/questions_head.rs
  - apps/fgos/tests/mailbox_routes.rs
  - bin/fgos.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - test/cli/session-verb.test.mjs
  - src/session-host/head-plan.mjs
  - src/session-host/head-request.mjs
  - test/session-host/head-request.test.mjs
  - src/session-host/head-start.mjs
  - test/session-host/head-start.test.mjs
  - core/skills/fgos-shaping/SKILL.md
  - core/agents/shaper.yaml
  - .agents/skills/fgos-shaping/SKILL.md
  - plugins/fgOS/skills/fgos-shaping/SKILL.md
  - .claude/agents/shaper.md
  - docs/platform/session-host/spec.md
  - docs/platform/supervision/spec.md
  - changelog.d/261125-1557-shaper-runs-in-own-worktree.md
  - src/cli/command-registry.mjs
base: dc49aa88162cbd26bbca308f337b7c1f05387a86
source:
  - plans/discussions/ds-xb6hplcn2m-shaper-worktree/DISCUSSION.md
  - p-rjzck3f7mg
created: 2026-11-25
lead: head:lead-forgent-261125-1557-shaper-2216b
---

# A shaper runs in its own worktree and branch

> **Owner order 2026-11-27 17:3x: first.** Shapers editing discussions in the main checkout keep dirtying it, which blocks lands and the release checks. The 2318 blocker is dropped: changelog lines are now fragments under `changelog.d/` (plan 261126-2324 phase 1), so phase 5 no longer touches `CHANGELOG.md`.

## Outcome

`fgos session start shaper --name <topic>` (by hand, by the secretary or by the supervisor) creates, or reuses on a
rotation, one linked worktree and one branch for the discussion, and launches the shaper inside it. The shaper edits
`plans/discussions/<dir>/` only in that worktree. Each round is persisted by a door, `fgos session save`, which commits
exactly the shaper's granted discussion paths on its own branch through Git's ScopedCommit; nothing reaches main. When
the discussion is settled or paused, the shaper lands its branch on main once with `fgos land --branch`, held to its
discussion directory as the footprint. The main checkout never holds a discussion edit, and main receives one commit
per discussion checkpoint instead of one per round.

This is the discussion half of backlog row p-rjzck3f7mg ("a discussion arrives once, settled"; "the main checkout never
holds a discussion edit"). The wake-record and lead-state half of that row is folded into the keeper plan by owner
order and is not planned here.

## Prior art (what existed, what was reused, what was missing)

- **Worktree door.** `fgos worktree create <path> --branch <b> [--base <ref>]` (Git component, door
  `checkout-make-provision-remove`) already creates and provisions a registered linked worktree. The lead reaches it
  through the head request verb `worktree create` (`src/session-host/head-request.mjs` `worktreeCreate`), which
  requires an absolute path outside the project root, in the sibling `<project dir>-worktrees/` directory. Reused as
  is: the shaper start calls the same host verb from outside the sandbox. Missing: nothing creates a worktree for a
  head at start; the lead creates its own later, from inside.
- **Head launch.** `placeHead` (`src/session-host/head-start.mjs`) launches every head through
  `launchSessionInHost` with `projectRoot` as the only root. In Rust,
  `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` uses `request.project_root` for the attempt cwd, the
  attempt locks, the seat settings and the `.fgos` directory. The sandbox resolver binds `workspace-paths` grants
  under `context.repoRoot` or `context.cwd` (`packages/execution/engine/src/confinement/policy/resolver.rs`). Missing:
  a way to launch a head whose working checkout differs from the project root whose `.fgos` it uses.
- **Scoped commit.** Git's ScopedCommit (`packages/git/rust/src/lib.rs`, spec `docs/platform/git/spec.md` section 8)
  commits exactly named literal paths on a checkout and is what the runner uses after a Unit's passing round and what
  the paths land uses. Reused as the door that persists a round. Missing: no head verb exposes it on a head's own
  linked worktree; the shaper's sandbox has `.git` read-only, so the shaper cannot commit by itself.
- **Branch land.** `fgos land --branch <b> --footprint <paths>` already lands a branch under the merge slot
  (`landVerb` in `head-request.mjs`), but refuses every persona except a lead (`land-branch-lead-only`) and takes the
  footprint from the lead's plan. Reused: the shaper's footprint is its discussion directory. Missing: the shaper
  case.
- **Session write** (`session write`, answered by the head's supervisor in `packages/run-supervisor/rust/src/head_request.rs`
  (`WRITE_VERB`) through the `WritePublisher` port declared in `packages/run-supervisor/rust/src/route.rs` and filled by
  `apps/fgos/src/wiring/session_write_publish.rs`) is the shape copied for the new verb: a Rust answer in the
  supervisor, a port filled by the composition root, no Node route child. Reused by adding one member to the same
  port instead of a second port, so `apps/fgos/src/main.rs` and `supervise.rs` stay untouched.
- **History.** Owner decision 2026-11-25 (row p-rjzck3f7mg, "Discussions"): a shaper works in a worktree or branch of
  its own and commits each round there; the discussion lands on main once. Owner words 2026-11-25 14:0x: whoever
  starts a shaper creates the worktree. The skill rule "land at a checkpoint, not every round"
  (`core/skills/fgos-shaping/SKILL.md`, 86ae44d70 and earlier) cut the commit count but kept the dirty file in the
  main checkout, which made lead 2108's sync refuse at 11:08.

## Refresh 2026-11-26

Re-checked against main `e0740b3bf`: every prior-art symbol below still exists (`worktreeCreate`, `landVerb` with
`land-branch-lead-only`, `placeHead`/`launchSessionInHost`, `discussionOfHead`, `rotate.mjs` calling `placeHead`,
ScopedCommit, the shaping skill's checkpoint rule, the supervision spec's "Only a lead lands a branch"); nothing on
main has added a head `workdir` or a save verb. Changed: base moved to the trunk tip; `session write` is now answered
in `head_request.rs`, so phase 2 extends the existing `WritePublisher` port instead of adding a port file and wiring
in `main.rs`; `CHANGELOG.md` became a `changelog.d/` fragment (plan 261126-2324). Plans 261125-2313 and 261124-2143
add nothing this plan needs.

Held in `draft`, blocked by plan 261126-2318 (overlap warns), for one reason only: at `ready` the plan contract check
still refuses a cross-plan footprint overlap, and this plan shares paths with three running plans (Keeper 261122-0056:
`head-request.mjs`, `bin/fgos.mjs`, the command manifest, the permissions contract and test, both specs; gather-rules
261125-2041: the shaping skill, the shaper agent and the generated surfaces; changelog fragments 261126-2324:
`changelog.d/**`). The shares are real and cannot be cut. Plan 261126-2318's phases 1 and 2 (run as Keeper phases 19
and 20) make that overlap a warning, by the owner's decision in discussion ds-yf3vnbidi6 D1. When they are on main:
re-run `node scripts/plan-contract-check.mjs --plan plans/261125-1557-shaper-worktree`, set the plan and its phase rows
to `ready`, drop the `blockedBy`, and land the plan dir. Nothing else in the plan changes.

## Acceptance criteria

1. A head launch request with `workdir` set to a registered linked worktree of the project runs the attempt there:
   cwd, sandbox root and `workspace-paths` binds resolve in the worktree, while `.fgos`, the runner config, the
   account lease and Identity stay the project root's. A `workdir` that is not a linked worktree of the project is
   refused `workdir-not-linked`. Proof: `cargo test -p fgos session_attempt` (owning test in
   `apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`).
2. `fgos session save <path>... --message <text>` from a head commits exactly those paths on the branch checked out
   in the head's own working checkout through ScopedCommit and answers `{commit, paths}`. It is refused
   `save-needs-linked-worktree` when the head runs in the main checkout, `path-outside-grant` for a path its grant
   does not name, and `save-nothing-to-commit` when nothing changed; main's tip is untouched in every case. Proof:
   `cargo test -p fgos-run-supervisor head_request` and `cargo test -p fgos-session-host permissions`; the CLI wiring
   proof in `test/cli/session-verb.test.mjs` (`node --test test/cli/session-verb.test.mjs`).
3. A shaper's `land` with `branch` is accepted only for its own discussion branch (`discussion/<dir>`), with the
   footprint `plans/discussions/<dir>` set by the route; any other branch is `land-branch-not-own`, and a lead keeps
   its plan footprint. Proof: `node --test test/session-host/head-request.test.mjs`.
4. `startHeadSession` for a shaper creates the worktree `<project dir>-worktrees/<discussion dir>` on branch
   `discussion/<dir>` from the trunk tip through the worktree door, launches with `workdir` set to it, and on a
   rotation or a second start reuses the same worktree; a path registered on another branch is refused
   `shaper-worktree-mismatch`. Planner, lead, secretary and supervisor launches are unchanged. Proof:
   `node --test test/session-host/head-start.test.mjs`.
5. `core/skills/fgos-shaping/SKILL.md` tells the shaper to save every round with `fgos session save` and land the
   branch once with `fgos land --branch` when settled or paused; the generated copies match (`npm run build:skills`
   leaves no diff). The session-host and supervision specs describe the new verb and the shaper's branch land.
6. Integration: on the combined tree, `npm test` and `cargo test --workspace` are green, and one live run (phase 6)
   shows a shaper started on a scratch topic leaves `git status` of the main checkout clean through two saved rounds
   and puts exactly one commit on main when it lands.

## Non-goals

- The wake-record and lead running-state half of p-rjzck3f7mg (owner order: folded into the keeper plan).
- Creating a discussion stub for a brand-new topic (p-ucnc6j52qk); a shaper still binds to an existing directory.
- Removing a shaper's worktree after it landed (p-6sd4fslxv7, p-pv7ha3l5ss own worktree reaping and head end of work).
- A worktree for the planner; it writes only plans and lands with `--paths` as today.
- Any change to the land door's merge, gate or footprint rules beyond accepting the shaper's own branch.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Head launch request field `workdir` (a linked worktree the attempt runs in) | `session-host` | Extends the head launch path; the launch-session route contract `packages/execution/contracts/execution-routes/execution-routes.v1.json` gains the optional field. |
| Shaper start creates or reuses its worktree | `checkout-make-provision-remove` | Calls the existing worktree door; no second creation path. |
| Head request verb `session save` | `run-supervisor/head-request.v1` | One new verb in the existing contract, answered by the head's supervisor like `session write`. |
| Round persistence through ScopedCommit | `git` | Reuses ScopedCommit; no new Git operation. |
| Shaper branch land with its discussion footprint | `git` | survivor: `git` (land door); retired: the `land-branch-lead-only` refusal for a shaper in `src/session-host/head-request.mjs`. |
| Shaping skill rule: save each round, land once | `portfolio/discussion.schema.v1` | survivor: `portfolio/discussion.schema.v1`; retired: the rule "between checkpoints the file stays in the main checkout" in `core/skills/fgos-shaping/SKILL.md`. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Launch a head inside a linked worktree](phase-01-launch-in-worktree.md) | - | apps/fgos/src/wiring/unit_run_host/session_attempt.rs, apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs, packages/execution/contracts/execution-routes/execution-routes.v1.json | 1 | done |
| 2 | [The session save verb](phase-02-session-save.md) | - | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/src/route.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/src/permissions.rs, packages/session-host/rust/tests/permissions.rs, apps/fgos/src/wiring/session_write_publish.rs, packages/run-supervisor/rust/examples/internal_harness.rs, apps/fgos/tests/questions_head.rs, apps/fgos/tests/mailbox_routes.rs, bin/fgos.mjs, packages/host-runtime/contracts/command-manifest.json, test/cli/session-verb.test.mjs, `src/cli/command-registry.mjs` | 1 | done |
| 3 | [A shaper lands its own discussion branch](phase-03-shaper-branch-land.md) | - | src/session-host/head-plan.mjs, src/session-host/head-request.mjs, test/session-host/head-request.test.mjs | 1 | done |
| 4 | [The shaper start creates its worktree](phase-04-shaper-start-worktree.md) | 1, 3 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs | 2 | done |
| 5 | [Skill, specs and changelog](phase-05-skill-and-docs.md) | 2, 3, 4 | core/skills/fgos-shaping/SKILL.md, core/agents/shaper.yaml, .agents/skills/fgos-shaping/SKILL.md, plugins/fgOS/skills/fgos-shaping/SKILL.md, .claude/agents/shaper.md, docs/platform/session-host/spec.md, docs/platform/supervision/spec.md, changelog.d/261125-1557-shaper-runs-in-own-worktree.md | 3 | ready |
| 6 | [Integration and live proof](phase-06-integration.md) | 1, 2, 3, 4, 5 | plans/261125-1557-shaper-worktree/reports | 4 | ready |

Hot files: `apps/fgos/src/wiring/session_write_publish.rs`, `bin/fgos.mjs` and the command manifest belong to
phase 2 alone; the generated skill and agent copies belong to phase 5 alone and are regenerated with
`npm run build:skills`, never hand-edited. `fgos resource-check --plan plans/261125-1557-shaper-worktree` answered
`accept (6 units, 0 findings)` with waves 1: {1, 2, 3}, 2: {4}, 3: {5}, 4: {6}; phase 6 re-runs it on the combined
tree. Phases 1, 2 and 3 have disjoint footprints and start at once.

## Owner questions

None. The owner settled the direction (discussion ds-xb6hplcn2m); the verb name `session save`, the branch name
`discussion/<dir>` and the worktree path `<project dir>-worktrees/<discussion dir>` are decided here from the existing
conventions (the lead door's sibling directory, the `session` verb family of head doors).

Alternatives weighed and rejected:
- Overloading `land --paths` so a shaper's paths land commits on its branch instead of main: one verb with two
  targets by persona is harder to read and to test than a verb whose only target is the caller's own checkout.
- Letting the shaper run `git commit` itself: its sandbox keeps `.git` read-only by design, and opening it would let a
  head write any ref.
- A plain branch without a worktree: the shaper would still edit files in the main checkout, which is the incident
  this plan removes.

## Risks and rollback

- **The `.fgos` directory resolved from the worktree.** Hooks and confined `fgos` calls inside the shaper resolve the
  project from their cwd. Phase 1 proves the attempt keeps the project root's `.fgos`; phase 6's live run checks the
  questions, mailbox and rotation hooks from inside the worktree. Medium risk; proof point carried to validation.
- **Rotation.** A successor must reuse its predecessor's worktree, not create a second one; owned by phase 4's test.
- **Shared files with running plans.** The plan-level footprint shares `head-request.mjs`, `bin/fgos.mjs`, the
  command manifest, `head-permissions.v1.json`, `permissions.rs` tests and both specs with the Keeper plan
  (261122-0056); of Keeper's unfinished phases only phase 18 (both specs, generated skill surfaces) touches the same
  files, and plan 261126-2318 shares the supervision spec and the generated skill globs. Conflicts are met at land
  (the land door merges and gates the combined tree); whichever lands second rebases.
- **Changelog fragments.** Phase 5 writes a fragment under `changelog.d/` (plan 261126-2324 phase 2). If that phase
  has not landed on main when phase 5 starts, phase 5 waits for it rather than editing `CHANGELOG.md`.
- **Rollback.** Each phase is one squash land; revert phases in reverse wave order. With phase 4 reverted, shapers
  launch in the main checkout as before and the skill text of phase 5 must be reverted with it.
