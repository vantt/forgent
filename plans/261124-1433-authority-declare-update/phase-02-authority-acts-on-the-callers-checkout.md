# Phase 2: Authority acts on the caller's checkout

Capability: `code:implement`

## Inputs

- `plans/261124-1433-authority-declare-update/plan.md` (Facts: defect 2 and defect 3).
- `apps/fgos/src/wiring/authority.rs`: `project_authority_request`, `model_dir`, `answer`, `render`, and the tests
  `seeded_repository` and `render_check_fails_naming_the_view_whose_generated_block_was_hand_edited`.
- `apps/fgos/tests/authority.rs`: the binary-level tests (`authority_render_check_finds_every_view_…`).
- `scripts/fgos-shell-integration.sh`, lines around `root=$(dirname "$common_dir")` and `--dir "$root"`: the source
  of the main-checkout `--dir`. Read it only; do not change it.
- `apps/fgos/src/wiring/unit_run_host/machine.rs`: how `resolve_repo` gives the work tree and the trusted main root.
- `apps/fgos/src/invocation_doors.rs`: `VERB_ROOTS` and `project_root`. Read only; `authority` stays a `READER`.

## Files it writes

`apps/fgos/src/wiring/authority.rs`, `apps/fgos/tests/authority.rs`.

## Steps

1. **Reproduce defect 2 before changing anything.** Build the host (`npm run fgos:dev -- version` builds it). Make
   a throwaway linked worktree with `fgos worktree` (never by hand), hand-edit its `component-boundary` block, and
   source `scripts/fgos-shell-integration.sh` in a bash subshell. Then run `fgos authority render --json` from the
   worktree through that helper. Record in `plans/261124-1433-authority-declare-update/reports/` which tree changed
   and what `written` said. Remove the worktree with `fgos worktree remove --discard-ignored`. If `written` is wrong
   for the tree that actually changed, the cause is in `write_views` or the presenter. Prove it and fix it in this
   phase with a test. If `written` is right for the tree that changed, defect 2 is defect 3's shadow; the report
   says so and step 3 closes it.
2. **Pick the tree.** Add one function, `source_tree(root, cwd) -> PathBuf`. It returns the work tree of `cwd` when
   `cwd` is inside a linked worktree whose trusted main root equals `root` (compare real paths). Otherwise it returns
   `root`. Take `cwd` from the process (`std::env::current_dir()`) at projection time, and store it on
   `AuthorityRequest` as `tree`. `model_dir`, `declare` (its `dir` and `root` arguments) and `render` use `tree`.
   `StoreApprovals` keeps `root`.
3. **Name the tree in the answers.** The render answer (write, `--check` and `--preview-holder`) and the declare
   answer carry `"root": <tree>`. The doc comment of `answer` says so.
4. Tests, one per behaviour, in the files that own them:
   - In the `authority.rs` unit tests: `source_tree` returns the worktree when the root is that worktree's main
     checkout. It returns the root for an unrelated directory and for the main checkout itself. Use a real
     `git init` and `git worktree add` in a temp dir.
   - In `apps/fgos/tests/authority.rs`, one wiring test: the host binary run with cwd inside a linked worktree of a
     seeded repository and `--dir <main checkout>` re-renders the worktree's view and leaves the main checkout's
     file byte-identical. The answer's `written` names the view and `root` names the worktree.

## Verify

`cargo test -p fgos --test authority` and `cargo test -p fgos wiring::authority` pass.
`cargo clippy -p fgos -- -D warnings` passes.

## Rollback

Revert this phase's commit. The answers lose `root`, and `authority` again acts on the `--dir` root.
