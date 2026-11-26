---
contract: plan-v1
title: "A config write refuses to create a project config file that the checkout's Git index tracks but its working copy lacks"
status: running
lead: head:lead-forgent-261126-0853-config-c5c37
priority: P1
blockedBy: []
base: 628d1ee213273f873f695af4e0d9657f9f6c5730
footprint:
  - plans/261126-0853-config-set-refuses-stripped-project-file/**
  - packages/config/rust/src/write.rs
  - packages/config/rust/src/provider.rs
  - packages/config/rust/src/provider/unix_verbs.rs
  - packages/config/rust/src/repair.rs
  - packages/config/rust/src/relocate.rs
  - packages/config/rust/tests/**
  - packages/config/contracts/failure-codes.v1.json
  - packages/config/contracts/fixtures/write.v1.json
  - apps/fgos/src/wiring/init.rs
  - docs/platform/config/spec.md
  - packages/git/rust/tests/scoped_commit_sync.rs
  - packages/git/rust/tests/land_push_catch_up.rs
  - test/e2e/root-file-guard-hook.test.mjs
source:
  - plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md
  - p-mfllw32ynj
created: 2026-11-26
---

# A config write never creates a stripped project config file

## Outcome

A project config write (`fgos config set`, `unset`, `patch`, `refresh-docs`, and the project target of
`init`) never creates `.fgos/config.yaml` in a checkout whose Git index tracks `.fgos/config.yaml` or the legacy
`.fgos/config.json` but whose working copy lacks it. That is the state of every worktree made by
`fgos worktree create` (its `.fgos` is removed and each tracked `.fgos` path is marked skip-worktree). The write
stops with the named refusal `config-project-file-stripped`, whose message names the main checkout and says to run
the write there (or to restore the file). The refusal leaves every file byte-identical. A fresh project, where
the file is neither tracked nor present, is created as it is today. This closes the 2026-11-17 incident, where
`fgos config set --dir <worktree>` silently installed a fresh 12-line file over the tracked 273-line one
(discussion section 2).

The launcher half of the discussion (plain `fgos` inside a linked worktree, `task-launcher-in-linked-worktree`) is
in the separate plan `261126-0856-launcher-runs-owning-release-in-linked-worktree`. That plan stays `draft` until
owner question `q-4xd2a3eqxq` is answered, so this plan can be `ready` now (product priority 2: an open question
must not block a part that can go ahead).

### Facts (prior art and the real gap)

- **The gap is still there.** `commit_observed` (`packages/config/rust/src/write.rs:169`) installs a new file with
  `install_once_with_mode` whenever the target's current bytes are absent (`:265`), and nothing checks whether Git
  tracks the path. `init` (`:489`) has the same create-only path (`:530`).
- **The Config core has no Git edge, and must keep it that way.** `fgos-git` is an optional dependency behind the
  `host-provider` feature (`packages/config/rust/Cargo.toml`). The addon and the gateway build the crate without
  it. Git facts reach Config only through the provider. `provider::roots` already asks the Git driver for the
  trusted main checkout (`packages/config/rust/src/provider.rs:232`, `GitDriver::trusted_root_at`).
- **The Git read already exists (reused, no new Git door):** `GitDriver::open_at(path)`
  (`packages/git/rust/src/driver.rs:358`) plus `GitDriver::tracked_paths`
  (`packages/git/rust/src/inspect.rs:1545`, `ls-files -z --cached --full-name`). Both are public and already used
  by `distribution/source_payload.rs`, `wiring/portfolio.rs` and `wiring/migrate.rs`. A skip-worktree entry is
  still `--cached`, so a stripped path is listed.
- **Every write request is built from the roots of one host caller.** The `WriteRequest` builders are
  `provider/unix_verbs.rs:87` (set, unset, patch, refresh-docs), `repair.rs:337` (doctor `--fix`),
  `relocate.rs:272` (target `Accounts` over `without_project`, never the project file), and two test helpers. The
  only `init` caller outside tests is `apps/fgos/src/wiring/init.rs:371`, inside the host app, which builds the
  crate with `host-provider`. The Node addon (`packages/git/node-addon/src/config.rs`) never writes.
- **Commit doors already keep a stripped config off main (D4):** `is_store_path`
  (`packages/git/rust/src/scoped_commit.rs:371`) means no checkout commit carries `.fgos`. Scoped commit drops
  skip-worktree paths (`:1574`). `.githooks/pre-commit` refuses a staged `.fgos` deletion and any `.fgos` change
  on `fgw/*`. Land rewrites `.fgos` from the target (`packages/git/rust/src/land.rs:578`).
- **Spec sections.** The discussion points at "section 11 (write transaction)". In `docs/platform/config/spec.md`
  the write transaction is section 6 and the failure table is section 14 (section 11 is verbs, setup and doctor).
  The rule goes in sections 6 and 14. The discussion's intent is unchanged; only the section number was wrong.

### Decision: how the Git fact reaches the write door

D3 places the check in `commit_observed` and the project `init`, before the lock, with the fact taken from the Git
driver port. This plan gives that fact one shape and one producer:

- `WriteRequest` gains `project_file_tracked: bool`, and `init` gains the same parameter. It means: "the
  checkout's Git index tracks `.fgos/config.yaml` or `.fgos/config.json`". Config core reads it and never computes
  it.
- One provider function, `provider::project_file_tracked(project_root) -> Result<bool, Refusal>`, computes it
  with `GitDriver::open_at` + `tracked_paths`. It returns `false` outside a repository. A Git failure is the
  existing `git-read-failed` refusal, the same one `roots` uses. The provider's `request` builder calls it only
  when the target is the project and the file is absent (`expected` is `None`), so a normal write never pays for
  an index listing. `wiring/init.rs` calls the same function for the project target.
- `repair::fix_with_roots` and `relocate` pass `false`, with a one-line comment saying why: repair edits only a
  file a check found, and relocate writes only machine files. If the phase finds that repair can create a project
  file, it computes the fact through the provider instead and says so in its report.
- In `commit_observed`, right after `current(...)` and before any edit is produced: target is `Project`, `seen` is
  `None` and `project_file_tracked` is set, so refuse with `config-project-file-stripped`. `refresh-docs` on an
  absent file already returns "nothing to do" without creating it, so it keeps that answer. In `init`, the same
  test runs after `select_source` finds no file, before `install_once_with_mode`.

Rejected: a new field on `SnapshotRequest`. It would carry a write-only fact through every read and about 20
literal constructors across five crates, for no reader. Rejected: a Git call inside Config core. It would break
the addon and gateway build and design principle 2. Rejected: a redirect to the main checkout's file (D2).

## Acceptance criteria

1. `cargo test -p fgos-config --features host-provider` passes. A new case beside the existing write tests seeds a
   Git repository whose `.fgos/config.yaml` is committed, removed from the working copy and marked
   `--skip-worktree`. In it, `set`, `patch` and project `init` each refuse with `config-project-file-stripped`.
   The message names the main checkout and the remedy, and a byte-for-byte listing of `.fgos` (names, bytes,
   modes) taken before and after is equal.
2. The same file has a case with no repository or an untracked, absent project file, where `set` and `init`
   create the file as today.
3. `packages/config/contracts/failure-codes.v1.json` lists `config-project-file-stripped` (sections `6, 14`), and
   the contract tests that pin that list (`packages/config/rust/tests/fixture_shape.rs`, `failure_matrix.rs`)
   pass. `docs/platform/config/spec.md` section 6 states the rule and section 14 has its row. The `CHANGELOG.md`
   `[Unreleased]` line is not written here: `CHANGELOG.md` is in the footprint of the running, parked plan
   `261125-1631-agent-context-engine`, and a `ready` plan may not overlap it. The line (text in phase 1, step 12)
   is carried by plan `261126-0856-launcher-runs-owning-release-in-linked-worktree`, which already owns
   `CHANGELOG.md` and goes `ready` later.
4. `plans/261126-0853-config-set-refuses-stripped-project-file/reports/` holds a short report naming, for each of
   the three D4 guards (store-path rule in scoped commit, pre-commit `.fgos` guards, land restore of `.fgos`), the
   test that owns it, with path and test name. Any guard without one is extended in its owning test file, never
   duplicated.
5. `npm test` and `cargo test --workspace` are green on the combined tree, or each failure is shown to come from
   outside this plan's files (phase 3 report).

## Non-goals

- Plain `fgos` inside a linked worktree (Q1 `q-4xd2a3eqxq`), which is in plan
  `261126-0856-launcher-runs-owning-release-in-linked-worktree`.
- Redirecting a worktree write to the main checkout (D2).
- Any new commit guard (D4).
- Changing why `fgos worktree create` strips `.fgos`, or what config a stripped worktree reads (discussion section
  3 row 6).
- `migrate`: a stripped checkout has neither file, so migrate has nothing to read and creates nothing.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The project config write and project `init` refuse `config-project-file-stripped` when the index tracks the project file and the working copy lacks it | `config` (component) | `fgos authority locate "a project config write refuses to create the project config file when the checkout's git index tracks it but the working copy lacks it"` returns `config`. It is a new refusal inside the existing write transaction, not a new door. |
| `WriteRequest.project_file_tracked`, `init`'s parameter, and `provider::project_file_tracked` | `config` (component) | The Config provider is the only place a Git fact enters Config, beside `roots`. The Git read reuses `GitDriver::open_at` + `tracked_paths` (`git` component). No new Git door. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Config refuses a stripped project file](phase-01-config-refuses-stripped-project-file.md) | - | packages/config/rust/src/write.rs, packages/config/rust/src/provider.rs, packages/config/rust/src/provider/unix_verbs.rs, packages/config/rust/src/repair.rs, packages/config/rust/src/relocate.rs, packages/config/rust/tests/, packages/config/contracts/failure-codes.v1.json, packages/config/contracts/fixtures/write.v1.json, apps/fgos/src/wiring/init.rs, docs/platform/config/spec.md | 1 | done |
| 2 | [Name the owning commit proofs](phase-02-name-commit-proofs.md) | - | plans/261126-0853-config-set-refuses-stripped-project-file/reports/commit-proofs.md, packages/git/rust/tests/scoped_commit_sync.rs, packages/git/rust/tests/land_push_catch_up.rs, test/e2e/root-file-guard-hook.test.mjs | 1 | done |
| 3 | [Integration](phase-03-integration.md) | 1, 2 | plans/261126-0853-config-set-refuses-stripped-project-file/reports/integration.md | 2 | ready |

Contract check: phases 1 and 2 are in wave 1 with disjoint footprints. Phase 3 depends on both and is in wave 2.
The hot files (the config spec, the failure-code registry) belong to phase 1 only; `CHANGELOG.md` is left out (acceptance criterion 3). Capabilities:
phase 1 `code:implement`, phase 2 `code:test`, phase 3 `code:test`. Impact analysis: `fgos dispatch decide --for
impact-analysis` reports GitNexus `tool.missing` (degraded), so blast radius is not machine-confirmed. The
callers of `commit_observed`, `WriteRequest` and `init` were listed by `rg` (Facts above), and phase 1 re-runs that
`rg` before editing.

## Owner questions

None for this plan. Q1 `q-4xd2a3eqxq` ("Inside a linked worktree, should installed fgos run the owning project's
release, or refuse and name the door?") belongs to the launcher plan.

## Risks and rollback

- **A plain deletion in the main checkout is refused too.** D1 covers any "tracked but absent" state, so a person
  who deleted `.fgos/config.yaml` in the main checkout by hand gets the refusal instead of a fresh file. The
  message therefore names both remedies: restore the file (`git checkout -- .fgos/config.yaml`), or run the write
  in the main checkout. Low, and arguably the right answer: a fresh file there would also shadow tracked content.
- **Cost of the index read.** It runs only on the rare absent-file path. Proof point: phase 1 keeps the call
  behind `expected.is_none()`.
- **Git unavailable or the path is not a repository.** Not a repository means `false`, so the write creates the
  file as today (a fresh project with no Git). A Git failure inside a repository is refused as `git-read-failed`,
  so it never falls through to creating the file.
- **Data loss during manual reproduction.** Before any hand reproduction, back up the main checkout's
  `.fgos/config.yaml` (`cp .fgos/config.yaml .fgos/runtime/tmp/config.yaml.bak`). Tests run only in temporary
  repositories.
- **Rollback:** revert phase 1's commit. Phase 2 only adds a report or extends tests, and stays.
