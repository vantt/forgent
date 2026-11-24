# Defect 2 Reproduction Report

## Objective
Reproduce defect 2 before changing code, investigating why `fgos authority render` reported `written: []` when invoked from a linked worktree whose `docs/platform/component-boundary.md` was edited.

## Environment & Test Setup
A test repository with a main checkout and a linked worktree was set up:
- Main checkout contains the component authority model and views under `docs/platform/`.
- A linked worktree (`wt`) was added from main via git.
- The `component-boundary` generated view section in `wt/docs/platform/component-boundary.md` was hand-edited (`HAND EDITED ROW`).
- Shell integration helper `scripts/fgos-shell-integration.sh` was sourced in a subshell from within `wt`.
- `fgos authority render --json` was executed from `wt`.

## Execution & Output
- `scripts/fgos-shell-integration.sh` resolves `$common_dir`, finds the main checkout root `root=$(dirname "$common_dir")`, and passes `--dir "$root"` to `fgos` if `--dir` was omitted by the caller.
- The command executed became `fgos authority render --json --dir <main>`.
- The installed host binary accepted `--dir <main>` and resolved `root = <main>`.
- `write_views` ran against `<main>`, where `component-boundary.md` was clean and unedited.
- The output was:
  ```json
  {
    "contract": "fgos.v1",
    "data": {
      "written": [],
      "skipped": []
    }
  }
  ```
- Result on disk:
  - `<main>/docs/platform/component-boundary.md`: unchanged (already clean).
  - `<wt>/docs/platform/component-boundary.md`: remained tampered with `HAND EDITED ROW`; was not rendered or rewritten.

## Finding
- `written` was technically accurate for the tree that `fgos authority render` actually targeted (`<main>`).
- However, `<main>` was targeted instead of the caller's working directory (`<wt>`) because `scripts/fgos-shell-integration.sh` appends `--dir <main>` and the `authority` verb unconditionally operated on `request.root`.
- Therefore, **Defect 2 is confirmed to be a shadow of Defect 3**.
- Step 2 and Step 3 resolve Defect 3 by introducing `source_tree(root, cwd)` so that `authority` operates on `cwd` when `cwd` is inside a linked worktree of `root`, and returning `"root": <tree>` in the answers.
