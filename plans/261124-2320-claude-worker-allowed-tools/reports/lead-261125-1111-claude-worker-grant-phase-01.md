# Phase 1 report: the grant in the standard invocation

Phase 1 is on main at `29dd50475` (unit commit `983e3876d` on branch `claude-worker-allowed-tools/p01`).
Phase 2 is parked on the release step, which a confined head cannot do.

## What ran

- Unit: `fgos run` ticket `c-1317-1795578707224`, executor `gemini` (from `fgos dispatch decide --for execute`),
  unit run `unit-run-1795578707648-53ccfd0f`, outcome `pass`. It wrote only the three footprint files.
- Land: ticket `c-48708-1795579715142`, `fgos land claude-worker-allowed-tools/p01 --test test/runner/dispatch.test.mjs`.
  It passed the land gate (the land suite plus the dispatch test), landed `CHANGELOG.md`,
  `core/config-standard/runner.yaml` and `test/runner/dispatch.test.mjs`, and removed the worktree. An earlier
  attempt (`c-48107-1795579646640`) was refused `land-target-ahead` while a supervisor commit was not yet pushed;
  it landed once main and origin matched.

## Review against the phase file

Done inline by the lead. No code-reviewer agent type exists in this session.

- `runner.yaml`: only the `claude-cli-bwrap` args changed. `--allowedTools` is last, followed by the one value
  `Bash(cargo:*),Bash(node:*),Bash(npm test:*)`.
- `dispatch.test.mjs`: the existing allowlist test is extended and retitled, with no second test added. The pattern
  now accepts `Bash(npm test:*)`. The test reads the standard through `resolveInvocationRoot` and `parseYaml`, and
  asserts the exact three-tool grant, `acceptEdits`, no git add or commit grant, and no
  `--dangerously-skip-permissions`. The old assertions are kept.
- `CHANGELOG.md`: one line under `## [Unreleased]`.

## Verify results

| Check | Result |
|---|---|
| `node --test test/runner/dispatch.test.mjs` | 161 of 161 pass (worktree), and again in the land gate |
| `cargo test -p fgos-config` (loads the standard) and `cargo test -p fgos-run-supervisor --test controller_config` | all pass |
| `config check` | Same findings on the branch as on main (machine files, global permissions and comment warnings). None concern the standard. This ran through plain `fgos`, which reads the activated release's standard, so it is weak proof for the edit. |
| `npm test`, `cargo test --workspace` | **Not run.** In the lead's confinement the worktree's `target/` and `.fgos/runtime/` are read-only, so `npm test` stops while staging the addon (EROFS), and `npm run fgos:dev` fails the same way. A full workspace build in the scratchpad filled the 16 GB `/tmp` tmpfs. |

Criterion 4 (full `npm test` and `cargo test --workspace`) is therefore open. The change touches no Rust and no
Node source; the owning Node test and the Rust crate that loads the standard both pass.

## Next

Phase 2 needs the owner or the unconfined supervisor to stage and activate a release from main at or after
`29dd50475`. The full `npm test` and `cargo test --workspace` can run in that same unconfined session. After that,
any session that can call `fgos run` runs the live cargo probe.
