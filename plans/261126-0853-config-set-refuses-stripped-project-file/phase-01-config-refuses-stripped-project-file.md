# Phase 1: Config refuses a stripped project file

Capability: `code:implement`. Depends on: none. Wave 1.

## Inputs

- `plans/261126-0853-config-set-refuses-stripped-project-file/plan.md`, the Facts and the "how the Git fact
  reaches the write door" sections (that decision is the shape to build).
- `plans/discussions/ds-gszx4utkr4-config-set-dir-never-overwrites/DISCUSSION.md`, D1 to D3.
- `docs/platform/config/spec.md` sections 6 and 14.
- `packages/config/rust/src/write.rs` (`commit_observed`, `init`, `WriteRequest`).
- `packages/config/rust/src/provider.rs` (`roots`, `refuse`) and `packages/config/rust/src/provider/unix_verbs.rs`
  (`request`).
- `packages/git/rust/src/driver.rs:358` (`open_at`) and `packages/git/rust/src/inspect.rs:1545`
  (`tracked_paths`).
- `packages/config/contracts/failure-codes.v1.json`, and `packages/config/rust/tests/fixture_shape.rs` and
  `failure_matrix.rs` (what they require of a new code).
- `packages/config/rust/tests/golden_init.rs`, `write_golden.rs` and `common/mod.rs` (existing test helpers).

## Files this phase may write

`packages/config/rust/src/write.rs`, `packages/config/rust/src/provider.rs`,
`packages/config/rust/src/provider/unix_verbs.rs`, `packages/config/rust/src/repair.rs`,
`packages/config/rust/src/relocate.rs`, `packages/config/rust/tests/**`,
`packages/config/contracts/failure-codes.v1.json`, `packages/config/contracts/fixtures/write.v1.json`,
`apps/fgos/src/wiring/init.rs`, `docs/platform/config/spec.md`, `CHANGELOG.md`.

## Steps

1. Re-list the callers before editing (GitNexus is not on this machine):
   `rg -n "WriteRequest \{|write::init|fn init\(|commit_observed\(" packages apps --glob '*.rs'`. Every hit must be
   one of those named in the plan's Facts. A new one gets the field too.
2. `write.rs`: add `pub project_file_tracked: bool` to `WriteRequest`, with a doc line saying "the checkout's Git
   index tracks `.fgos/config.yaml` or `.fgos/config.json`; supplied by the host caller, never computed here".
   Add the same `project_file_tracked: bool` parameter to `init`.
3. `commit_observed`: after `let seen = current(req, &at, false)?;` and after the existing "refreshing an absent
   file" early return, add the refusal: `req.target == SourceKind::Project && seen.is_none() &&
   req.project_file_tracked` gives `config-project-file-stripped`. The order matters: `refresh-docs` on an absent
   file keeps its "nothing to do" answer. The refusal detail names `roots.trusted_root` as the main checkout and
   says "run the write there, or restore the file with `git checkout -- .fgos/config.yaml`". It never names a
   value.
4. `init`: for the project target, when `select_source` finds no file and `project_file_tracked` is set, refuse
   with the same code before `install_once_with_mode`.
5. `provider.rs`: add `pub fn project_file_tracked(project_root: &Path) -> Result<bool, Refusal>`. It calls
   `GitDriver::open_at(project_root)`. `None` gives `Ok(false)`. Otherwise it pages `tracked_paths` and returns
   whether `.fgos/config.yaml` or `.fgos/config.json` is present. Map Git errors to the existing `git-read-failed`
   refusal. Paths are repository-relative (`--full-name`); the config file sits at the checkout's top level
   (`roots.project_root` is the top level). If the phase finds the project root can be a subdirectory, compare
   against the path relative to the repository top level instead.
6. `unix_verbs.rs` `request`: set `project_file_tracked` to
   `kind == SourceKind::Project && expected.is_none() && project_file_tracked(&roots.project_root)?`. Call it only
   in that case.
7. `repair.rs` and `relocate.rs`: pass `false`, each with a one-line comment giving the reason (repair edits only
   a file a check found; relocate writes machine files). First confirm the repair claim by reading
   `fix`: if a repair can install a project file that is absent, compute the fact the way step 6 does, and say so
   in the commit message.
8. `apps/fgos/src/wiring/init.rs`: for the project target, pass
   `fgos_config::provider::project_file_tracked(&project_root)`. A refusal there becomes the existing "config
   files not created" warning, so `fgos init` keeps its warning-not-error behaviour.
9. Register the code: `failure-codes.v1.json` entry `config-project-file-stripped`, origin `spec`, section
   `6, 14`, meaning "The checkout's Git index tracks the project config file but its working copy lacks it; a
   write would create a file that hides the tracked one." Add a fixture case to `fixtures/write.v1.json` if
   `failure_matrix.rs` or `fixture_shape.rs` requires one for each code.
10. Tests (`packages/config/rust/tests/`, in the file that owns write-transaction behaviour, `write_golden.rs`, or
    `golden_init.rs` for init. If neither can host a Git fixture, add `stripped_project_file.rs` and say why in
    its header). Use a temporary Git repository: commit `.fgos/config.yaml`, run `git update-index
    --skip-worktree .fgos/config.yaml`, remove the file. Then:
    - `set`, `patch` (through the provider request builder, so the real fact producer runs) and project `init` each
      return `config-project-file-stripped`;
    - a listing of `.fgos` (names, bytes, modes) taken before and after is equal;
    - in the same repository with the file untracked (or in a plain directory), `set` and `init` create the file.
    Titles name the behaviour in plain words, with no plan or phase ids. Update the two existing helpers that build
    a `WriteRequest` (`common/mod.rs`, `write_concurrency.rs`) and the `init` calls in `golden_init.rs` with
    `false`.
11. `docs/platform/config/spec.md`: in section 6, after the transaction steps, add one paragraph stating the rule
    (a write never creates a project file the index tracks but the working copy lacks; refused with
    `config-project-file-stripped`; nothing redirects to the main checkout). Add the row to the section 14 table.
    Add a dated line to section 18's decision history citing the discussion (D1 to D3).
12. `CHANGELOG.md` `[Unreleased]`: one line, "Fixed: `fgos config set`, `patch` and `init` no longer create a
    fresh `.fgos/config.yaml` in a worktree whose tracked config was stripped; they refuse with
    `config-project-file-stripped` and name the main checkout."

## Verify

```bash
cargo test -p fgos-config --features host-provider
cargo test -p fgos-config
cargo build -p fgos
```

Pass: all green, the new cases included. Without the feature the crate still builds and its tests pass, which
proves Config core gained no Git edge.

## Rollback

Revert this phase's commit. No data migration and no file format change.
