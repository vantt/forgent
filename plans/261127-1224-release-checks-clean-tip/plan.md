---
contract: plan-v1
title: "Release checks run on a clean, exact checkout of the trunk tip they release"
status: running
priority: P0
blockedBy: []
base: 98f70f24a6797f067bf55fb94c2b0351b8925a93
footprint:
  - plans/261127-1224-release-checks-clean-tip/**
  - packages/git/rust/src/land.rs
  - packages/git/rust/src/worktree.rs
  - packages/git/rust/tests/land.rs
  - packages/git/rust/tests/worktree.rs
  - packages/session-host/rust/src/release.rs
  - packages/session-host/rust/tests/release.rs
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - core/config-standard/release.yaml
  - core/config-schema/release.schema.yaml
  - docs/platform/run-supervisor/spec.md
  - changelog.d/261127-1224-release-checks-run-on-a-clean-checkout.md
source:
  - plans/discussions/ds-r2sv5l5vnu-release-checks-clean-tip/DISCUSSION.md
  - p-sqppgb2jhq
created: 2026-11-27
lead: head:lead-forgent-261127-1224-releas-15e5c
---

# Release checks run on a clean, exact checkout of the trunk tip they release

`fgos release run` reads the trunk tip it will release and then runs the recipe `checks` in the live main checkout
(`packages/session-host/rust/src/release.rs`, loop over `recipe.checks`; adapter `HostRelease::run` in
`packages/run-supervisor/rust/src/head_request.rs`, `current_dir(&self.cfg.cwd)`). On 2026-11-27 four release runs
failed `checks-failed` on causes that live only in that checkout (backlog p-sqppgb2jhq). The owner ordered this as a
P0 product mechanism, first among the release-path fixes (discussion ds-r2sv5l5vnu, "Decided").

## Outcome

- `fgos release run` makes a detached checkout of the trunk tip it read, through the worktree door, runs every
  recipe `check` with that checkout as its working directory, and removes it when the checks end, pass or fail.
- The checkout is an **exact commit checkout**: it carries the tip's own committed `.fgos` bytes
  (`.fgos/project.json`, `.fgos/instructions/effective/rules.json` and every other tracked `.fgos` path), so the
  checks prove exactly the commit the release records.
- Every check runs with `TMPDIR` set to `<check checkout>/.fgos/runtime/tmp`, a disk-backed directory the run
  creates, so no check writes to the shared `/tmp` tmpfs and the recipe needs no `env TMPDIR=...` wrapper.
- `apply`, `probe` and `rollback` keep running from the project root, as today.
- A checkout that cannot be made refuses the release before any check runs; a checkout that cannot be removed is
  reported and the run's outcome stands.

## Decisions settled inside the frame

The discussion left three points to the planner. Each is settled here from evidence; none is a product choice.

1. **How the checkout gets the files a fresh worktree lacks.** Every worker checkout the Git port creates strips
   `.fgos` and marks its tracked entries skip-worktree (`packages/git/rust/src/worktree.rs`, create, "worker .fgos
   stripped"). The Land candidate already solves the same problem: "A Land candidate is an exact commit checkout:
   materialize those immutable target bytes before merge/verification" (`packages/git/rust/src/land.rs`, the
   `--no-skip-worktree` then `restore --source <target>` block). That block is lifted into one Git driver method that
   writes a linked checkout's tracked `.fgos` paths from a given commit; the Land candidate calls it, and the
   release adapter calls it on the check checkout. One door, the inline copy retired (design principle 1, L10).
   Rejected: a new flag on `fgos worktree create` (four more surfaces: routing, command manifest, command routes,
   command registry, for one caller); stripping nothing for every detached checkout (changes every worker's
   isolation); fixing tests to stop reading the repo's own `.fgos` (the release would still not prove the committed
   bytes, which is the stated outcome).
2. **Where the checkout lives.** `<parent of the project root>/<project directory name>-worktrees/release-check-<request id>`,
   the worktree root every lead already uses (`core/skills/fgos-lead/SKILL.md`, "never inside the project root").
   Not `/tmp` (`create_verify_checkout`'s default `<tmp>/fgos-worktrees`): `/tmp` inode exhaustion was one of the
   four failures, and its own limit is a non-goal. Not `.fgos/runtime/`: that is inside the live checkout the
   change exists to leave.
3. **A failed removal is reported, not fatal.** The removal runs `fgos worktree remove <path> --delivered-to <tip>
   --discard-ignored`. A refusal (for example `worktree-dirty-preserved` because a check left an untracked file) is
   one report line to the owner through the existing `report` port and one log line; the outcome of the run (pass,
   `checks-failed`, `asked`, `released`) is unchanged and the checkout stays on disk for the supervisor's ordinary
   `worktree remove`.

4. **Where the checks' temporary files go** (lead:SUPERVISOR order, 2026-11-27 14:21: release checks also failed
   on `/tmp`, a tmpfs with a per-user quota every agent on the machine shares; the local recipe works around it with
   `env TMPDIR=/var/tmp/fgos-release-checks`). The adapter sets `TMPDIR=<check checkout>/.fgos/runtime/tmp` for each
   check and creates that directory first. `.fgos/runtime/` is ignored (`.gitignore`), so the directory leaves the
   checkout clean for the removal check and `worktree remove --discard-ignored` deletes it through the door with
   the checkout: no hand deletion, no second directory to manage. Rejected: a sibling directory in the worktree
   root (a second path to remove by hand, outside the door); `/var/tmp` (shared by every user and outlives the run).
   A tracked file a check rewrites (for example the mutation census that
   `scripts/build-rust-distribution.mjs --read-checkout-with-addon` writes when its bytes differ) makes the removal
   refuse `worktree-dirty-preserved`; that is decision 3's reported, non-fatal case.

Also fixed by the shape of the door: a recipe with no `checks` makes no checkout; the checkout is made after the
merge-slot look and before the first check, and removed right after the last check that ran, before `ask_owner` or
`apply`. A checkout that cannot be made ends the run with the new code `check-checkout-failed` (nothing ran, nothing
applied, reported like `checks-failed`).

## Acceptance criteria

1. One owning test in `packages/session-host/rust/tests/release.rs` proves, against the fixture ports: the checks
   run with the check checkout of the tip as their directory; the checkout is made after the merge-slot look and
   removed after the checks whether they pass or the first one fails; `apply`, `probe` and `rollback` run with no
   checkout directory (project root); a recipe without checks makes none; a checkout that cannot be made ends
   `check-checkout-failed` with nothing run; a removal that fails is reported and the outcome is unchanged.
   Command: `cargo test -p fgos-session-host --test release` (a lead:SUPERVISOR job).
2. The Land candidate and the release check checkout write their `.fgos` bytes through the one Git driver method;
   `rg -n 'no-skip-worktree' packages/git/rust/src/land.rs` finds nothing. The Land's existing owning proof of its
   candidate stays green: `cargo test -p fgos-git --test land` (a lead:SUPERVISOR job).
3. The adapter makes the checkout with `fgos worktree create <path> --detach --base <tip>`, writes the committed
   `.fgos` bytes, runs each check with that directory, and removes it with `fgos worktree remove <path>
   --delivered-to <tip> --discard-ignored`; the existing release wiring proof in
   `packages/run-supervisor/rust/tests/head_request.rs` (the test whose recipe has `"checks": [["true"]]`) runs
   through a real checkout, sees its check run with `TMPDIR=<checkout>/.fgos/runtime/tmp`, and finds the checkout
   gone afterwards. Command: `cargo test -p fgos-run-supervisor --test
   head_request` (a lead:SUPERVISOR job).
4. `packages/run-supervisor/contracts/head-request.v1.json` (`release run`), `core/config-standard/release.yaml`
   and `core/config-schema/release.schema.yaml` say the checks run in an exact checkout of the trunk tip and list
   `check-checkout-failed`; `docs/platform/run-supervisor/spec.md` "Lịch sử quyết định" records the decision;
   `changelog.d/261127-1224-release-checks-run-on-a-clean-checkout.md` exists.
5. `npm test` and `cargo test --workspace` are green on the combined tree, both run as lead:SUPERVISOR jobs
   (`reports/integration.md`).
6. A live `fgos release run` on fg-server2 after the release that ships this change shows, in its `<id>.log`, the
   checks running under `forgent-worktrees/release-check-<id>` and the checkout gone afterwards (or one report line
   naming why it stayed) (`reports/integration.md`).

## Non-goals

- Changing what the recipe runs (`release.checks`, `apply`, `probe`, `rollback` values).
- Changing how `apply`, `probe` or `rollback` run.
- The machine's `/tmp` quota itself (the checks no longer use it, decision 4; other users of `/tmp` are their own
  backlog row if it recurs).
- A warm build cache for the check checkout (a cold `cargo test --workspace` and `npm install` per release run is
  accepted; see Risks).
- Any new flag on the `worktree` verb, and any change to worker checkouts other than the Land candidate's call site.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Release check checkout made and removed through `fgos worktree create --detach` / `fgos worktree remove --delivered-to --discard-ignored` | `checkout-make-provision-remove` | the adapter reaches the checkout door through the `worktree` verb, the way the door allows a Rust caller; nothing calls the Git create or remove port beside it |
| One Git driver method that writes a linked checkout's tracked `.fgos` paths from a commit | `git` | survivor: the new method in packages/git/rust/src/worktree.rs; retired: the inline `--no-skip-worktree` / `restore --source` block of packages/git/rust/src/land.rs |
| `ReleasePorts` gains make/remove of the check checkout and `run` gains a directory | `session-host` | the release rule stays pure; every implementer of `run` moves in the same change (fixture and `HostRelease`) |
| Outcome code `check-checkout-failed` and the "checks run in an exact checkout of the tip" text | `run-supervisor/head-request.v1` | `release run` entry: `does` and `result` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [One Git door for a checkout's committed .fgos bytes](phase-01-committed-state-door.md) | - | packages/git/rust/src/land.rs, packages/git/rust/src/worktree.rs, packages/git/rust/tests/land.rs, packages/git/rust/tests/worktree.rs | 1 | ready |
| 2 | [Release checks run in a check checkout: rule, port and host adapter](phase-02-release-check-checkout.md) | 1 | packages/session-host/rust/src/release.rs, packages/session-host/rust/tests/release.rs, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json | 2 | ready |
| 3 | [Docs, changelog and integration](phase-03-docs-and-integration.md) | 2 | core/config-standard/release.yaml, core/config-schema/release.schema.yaml, docs/platform/run-supervisor/spec.md, changelog.d/261127-1224-release-checks-run-on-a-clean-checkout.md, plans/261127-1224-release-checks-clean-tip/reports/** | 3 | ready |

Phases 1 and 2 are `code:implement`, each reviewed (`code:review`) before it lands. Phase 3 is `code:implement`
for the text, then `code:test` for the integration gate. The phases are serial. The release rule's port and its one
production implementer (`HostRelease`) change in one phase, because a trait change without its implementer does not
build; and the adapter calls the Git method phase 1 creates.

**Cargo runs as lead:SUPERVISOR jobs.** Confined units cannot run cargo yet (backlog p-ymhj4xcf6x: a confined
cargo hangs fetching the private pkm git dependency). Every `cargo` command in a phase's Verify is handed by the
plan's lead to lead:SUPERVISOR as one job, with the worktree path and the exact command; the unit itself writes
code and runs only `rustfmt`/`node` checks. This holds until p-ymhj4xcf6x lands, after which the unit runs them.

Checked (2026-11-27): `node scripts/plan-contract-check.mjs --plan plans/261127-1224-release-checks-clean-tip`
passes as `draft` and as `ready`; `fgos resource-check --plan` accepts (3 units, 0 findings, waves 1-2-3).

### Cross-plan overlaps

Overlaps are warnings under the live model. Known at writing:

- `261127-0151-ready-plan-runs-unattended` (ready, P0, blocked by three plans): `release.rs`, `tests/release.rs`,
  `head_request.rs`, `tests/head_request.rs`, `head-request.v1.json`, `docs/platform/run-supervisor/spec.md`.
  The owner order puts this plan first among the release-path fixes, so this plan does not wait for 0151; 0151
  meets these edits at its land.
- `261127-0143-widen-running-plan-footprint` (running): `head-request.v1.json` and `tests/head_request.rs`
  (its phase 2). Different entries of the contract and different tests; met at land.
- `261127-0016-head-run-own-failure-domain` (running): `docs/platform/run-supervisor/spec.md`. This plan adds one
  decision-history entry there; met at land.
- `261126-2324-changelog-fragments-and-skill-surface-regeneration` (running): the `changelog.d/` directory; this
  plan's fragment is its own file.

## Owner questions

None. Priority, mechanism and order are the owner's (2026-11-27, relayed by lead:SUPERVISOR); the three open points
are settled above from repository evidence.

## Risks and rollback

- **Cold build per release.** The checkout has no `node_modules` or `target/` of its own: provisioning runs
  `npm install`, and `cargo test --workspace` builds from cold. Each recipe step is bounded by
  `RELEASE_STEP_TIMEOUT` (30 minutes, `head_request.rs`). Proof point at validating and in criterion 6: the live
  run's log shows the cargo check's duration; if it nears the bound, a follow-up row (shared `CARGO_TARGET_DIR` for
  the check checkout) goes to the backlog, not into this plan.
- **Removal refused leaves a checkout on disk** (about the size of a full build). Bounded: reported to the owner
  with the path each time; the supervisor removes it with the ordinary `worktree remove`.
- **Lifting the Land candidate's block changes Land.** Bounded by the Land's existing owning proofs
  (`packages/git/rust/tests/land.rs`) staying green; the method keeps the same git argv and the same held slot.
- **The worktree verb refuses inside the supervisor** (identity, lock). Then the run ends `check-checkout-failed`
  before any check and nothing is applied: the release fails safe, never runs checks in the live checkout again.

Rollback: revert the plan's commits in reverse phase order. Reverting phase 2 alone restores checks in the project
root; reverting phase 1 then restores Land's inline block. Phase 3 is text and a report only.
