# Lead report: wave 1 (2026-11-27 01:19)

## Phase 2: done

- Unit `c-1450` (gemini, code:implement) produced `edb5c0b096`. Review by openai (`unit-run-1795711878674-369fdc4e`) found
  no blocking issues and two test nits: the ordering case does not invert creation order, and the dry-run case checks
  only that fragments still exist, not their contents.
- Landed at `2d095fb63a`. The land gates ran `test/scripts/prepare-release.test.mjs`. The plan row was set `done` at `7e4f20dc11`.

## Phase 1: done

- `77536ba638` implements globs. Review (`unit-run-1795712388398-77a6ebf0`) found three blocking issues: tree names
  were decoded as UTF-8, symlinks were dereferenced on read and restore, and the measurement report was not empirical.
- `1c058a580a` fixed them, and the report now holds two real `build:skills` runs: exit 0, the three
  `fgos-supervisor/SKILL.md` surfaces rewritten each time, `AGENTS.md` untouched. The re-review on claude
  (`unit-run-1795713830779-102640c4`) found one blocking gap: a literal entry such as `gen` mixed with globs had its
  subtree pruned.
- `34fbefe360` fixed that and refuses symlinked parents. The review on claude (`unit-run-1795716004337-ca8993af`) found
  no blocking issues and four nits: a literal-only directory entry, a silent skip on a dir/file type swap, and two
  test-coverage gaps.
- Confined units cannot run cargo, because the private dependency pkm needs credentials the sandbox lacks (supervisor
  note). lead:SUPERVISOR ran the land suite unconfined on the earlier `1c058a580a` state: 69 passed
  (`.fgos/runtime/tmp/supervisor-cargo-2324-p01-land.log`). A rerun at `34fbefe360` was asked for (events
  `01fc1d4c651c2aaf`, `177fcad18d128e36`). lead:SUPERVISOR then ran it unconfined at `34fbefe360`: 71 passed, fmt clean (`.fgos/runtime/tmp/2324-p01-cargo-gate.log`). Landed at `ca75d69142`. The worktree was kept (`worktree-worker-state-preserved`) and handed to the supervisor.

## Next

Phase 3 (config from the main checkout, after a
release that carries phase 1; integration gates also need unconfined cargo).

## Provider notes

The openai review seat hit its usage limit twice (`c-7706` failed exit-11; `c-8314` settled `pass` with no report).
gemini's fix unit `c-9148` hung on cargo and left no edits.
