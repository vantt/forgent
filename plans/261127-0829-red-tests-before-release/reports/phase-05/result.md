# Phase 5 result: dev-host tests leave the real store alone

- Fix: `test/rust-host/help-routes.test.mjs` only. `devDoor()` now runs `scripts/run-rust-dev-host.mjs` from a
  temporary checkout copy under the file's scratch directory, built like `dev-host.test.mjs`'s `fixture()`, so staging and
  `pruneRunDirs` never touch the real `.fgos/runtime/`. It also adds a `// boundary:` reason on that spawn. The door, the
  store-leak guard and every assertion are unchanged. The other three dev-host tests already used temporary roots.
- Landed `8574114e70` (branch `red-tests-before-release/p05`; land gates plus the four tests passed).
- The branch carried main's `c4ff00277d` (the witness credits directories `mkdtemp` makes) through merge `25e33e19c4`.
  That fix covers the door's own run directory. This phase covers the prune of a pre-existing stale directory.

## Gate (lead:SUPERVISOR, unconfined, worktree p05 at `25e33e19c4`, `.fgos/project.json` and `rules.json` restored)

| Run | Log | Result |
|---|---|---|
| the four dev-host files, stale `run-planted` planted | `four-files.log` | 33 pass, 0 fail, exit 0; `run-planted` survived |
| full `npm test`, stale dir planted | `npm-test.log` | 6536 pass, 2 fail; no store-leak guard failure; `run-planted` survived |
| the 2 failed files alone (`loop.test.mjs`, `closing-block.test.mjs`) | `timeout-rerun.log` | 102 pass, 0 fail, exit 0 |

The 2 failures in the full run were whole-file 600 s watchdog timeouts at load average 12.9 (several cargo runs on the
machine). Neither file shares a path with this change. Both passed in the phase-4 suite, and both pass alone at load 3.6.
The comment-only commit `8cd028b178` came after the gate.

## Against the plan's acceptance criteria

1. Listed files: phase 4 `listed-files.log` 42 of 42 pass; the exit 1 there was the dev-host leak this phase fixed.
2. `npm test`: no single run exited 0. The full run is green except two load timeouts, which pass alone. The release's
   own `npm test` from main is the next full proof.
3. `cargo test --workspace`: green except one test that needs the tracked `.fgos/project.json`, which fgos worktrees
   leave out. It passes with the file present (`../phase-04/rerun-start-context.log`).
4. No assertion deleted, no skip or env switch added (`git diff` of `help-routes.test.mjs`: one helper, one changed
   spawn path, one comment).
5. `plan-contract-check` passes (land gate).
