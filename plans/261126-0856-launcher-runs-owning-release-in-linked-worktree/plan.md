---
contract: plan-v1
title: "Plain fgos inside a linked worktree stops pushing callers to --dir"
status: draft
priority: P2
blockedBy: []
footprint:
  - plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/**
  - packages/distribution/rust/src/launcher.rs
  - docs/platform/packaging-distribution/spec.md
  - CHANGELOG.md
source:
  - plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md
  - p-mfllw32ynj
created: 2026-11-26
---

# Plain fgos inside a linked worktree

## Outcome

Inside a linked worktree made by `fgos worktree create` (its `.fgos` stripped, so it has no
`.fgos/installation`), the installed `fgos` launcher stops answering "no .fgos/installation found". Depending on
the answer to owner question `q-4xd2a3eqxq`, it does one of two things:

- **Recommended answer, "Run the owning project's release":** when the walk up finds no activation, and the
  nearest `.git` is a file (`gitdir: <path>`) whose git dir holds a `commondir`, the launcher resolves the main
  checkout (the parent of the common dir) and runs the release named by the main checkout's
  `.fgos/installation/activation.json`, with every trust rule RUL17 already applies (store-only release, digest
  shape, `status: ready`). Anything odd (a relative or missing `gitdir`, a missing `commondir`, a common dir that
  is not named `.git`, no activation there) is refused by name, as today.
- **Other answer, "refuse and name the door":** the refusal names the main checkout and the door to use (for
  example `run fgos from <main checkout>, or use fgos run --worktree`).

Either way, no caller needs `fgos config set --dir <worktree>` for everyday work. That `--dir` call was the path
of the 2026-11-17 incident (discussion section 2). The write itself is already made safe by plan
`261126-0853-config-set-refuses-stripped-project-file`; this plan removes the push toward it (task
`task-launcher-in-linked-worktree`).

### Facts

- `packages/distribution/rust/src/launcher.rs` holds the `sh` and `cmd` launcher bodies (`launcher_body`). They
  walk up only for `.fgos/installation/activation.json`, use only shell builtins, and execute nothing from the
  project (module header, RUL17 in `docs/platform/packaging-distribution/spec.md`).
- A worktree from `fgos worktree create` has no `.fgos` (stripped; `packages/git/rust/src/worktree.rs:935`), so
  the walk finds nothing when the worktree sits outside the main checkout.
- The launcher tests live in the module's own `#[cfg(test)]` block (for example
  `the_cmd_launcher_runs_the_store_release_the_nearest_activation_names_and_refuses_outside_a_project`).

## Acceptance criteria

1. `cargo test -p fgos-distribution launcher` passes with a new case. It builds a main checkout carrying an
   activation and a store release, plus a linked worktree (`git worktree add`, `.fgos` absent). From the
   worktree, the `sh` launcher either runs the main checkout's release (recommended answer) or refuses naming the
   main checkout (other answer). The case also covers the odd shapes (missing `commondir`, a relative `gitdir`),
   which are refused by name.
2. The `cmd` body gets the same behaviour and case, or the plan's report says why Windows is left as is.
3. `docs/platform/packaging-distribution/spec.md` RUL17 states the linked-worktree rule, and `CHANGELOG.md`
   `[Unreleased]` has one line.
4. `npm test` and `cargo test --workspace` are green, or each failure is shown to come from outside this plan's
   files.

## Non-goals

- Any change to the config write door (plan `261126-0853-config-set-refuses-stripped-project-file`).
- Any change to how `fgos worktree create` strips `.fgos`.
- Running a release from inside the worktree's own files (RUL17 trust rule: nothing under the project executes).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The launcher resolves (or refuses with a door) in a linked worktree with no activation | `packaging-distribution` (component) | `fgos authority locate "the installed launcher shim finds the activated release by walking up for the installation directory"` returns `packaging-distribution`. The existing launcher is extended in place; no new door. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Launcher in a linked worktree](phase-01-launcher-in-linked-worktree.md) | - | packages/distribution/rust/src/launcher.rs, docs/platform/packaging-distribution/spec.md, CHANGELOG.md | 1 | draft |
| 2 | [Integration](phase-02-integration.md) | 1 | plans/261126-0856-launcher-runs-owning-release-in-linked-worktree/reports/integration.md | 2 | draft |

Contract check: one implementation phase and one integration phase in later waves. Both phases are `draft`
because Q1 decides phase 1's behaviour, and nothing in this plan goes ahead without that answer. Capability:
phase 1 `code:implement`, phase 2 `code:test`.

## Owner questions

- `q-4xd2a3eqxq`: "Inside a linked worktree, should installed fgos run the owning project's release, or refuse
  and name the door?" (asked by the shaper; recommended "Run the owning project's release"). When it is answered,
  the planner keeps the chosen branch in phase 1, drops the other, sets `base`, and flips this plan to `ready`.

## Risks and rollback

- **Trust (recommended branch).** A `.git` file and `commondir` arrive with the worktree, not with a clone. Even
  so, the launcher resolves only an absolute `gitdir` and a common dir that ends in `.git`, and then applies
  RUL17's store-only rule. So the worst case runs a release from this machine's verified store, never a project
  file.
- **`CHANGELOG.md` and the distribution spec are also in the footprint of the running plan
  `261125-1631-agent-context-engine`.** Before flipping this plan to `ready`, rerun
  `node scripts/plan-contract-check.mjs --plan <this dir>`. If that plan is still active, add it to `blockedBy` or
  narrow the footprint.
- **Rollback:** revert phase 1's commit; the launcher returns to today's refusal.
