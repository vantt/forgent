# Phase 4: Attention flags: command, manifest, wiring proof

## Inputs (read first)
- `src/cli/command-registry.mjs` around the `dispatch inspect` entry (~1462-1495: flags `run`, `assignment`, `cwd`, `terminal`, `provider-capacity`, examples).
- `packages/host-runtime/contracts/command-manifest.json` (generated: regenerate with `node scripts/export-command-selectors.mjs`, read its header for the flag).
- `bin/fgos.mjs` arm `sub === 'inspect'` (~2445).
- Phase 3's selector contract (`plan.md` phase table; `phase-03-attention-reader.md`).
- `test/cli/dispatch-inspect.test.mjs` (helpers `run`, `assignment`, `admission`, `materialize`).

## Files this phase may write
`src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`, `bin/fgos.mjs`, `test/cli/dispatch-inspect.test.mjs`.
Also regenerates the census file in its commit (hot file). Depends on phase 3 being merged.

## Steps
1. Registry: add boolean flag `attention` and string flag `since` to `dispatch inspect`, description "runs that need a person since a time, across every worktree of the project; one line each with the reason and the next command", and the example `fgos dispatch inspect --attention --since 2026-11-17`. Update the verb's usage line so the selector list reads run, assignment, cwd, terminal, provider-capacity, attention.
2. `bin/fgos.mjs`: pass `attention: flags.attention === true, since: flags.since` into the selector payload.
3. Regenerate the command manifest and the census; confirm the manifest diff is only the two flags.
4. Text output: the default (non-`--json`) rendering prints `lines` one per row, then one line for the terminal state when it is not `scanned` with findings; find how `--terminal` renders its text today (`rg -n "terminal" src/cli/*.mjs bin/fgos.mjs`) and follow it rather than adding a renderer.
5. ONE wiring proof in `test/cli/dispatch-inspect.test.mjs`: a root with one failed run and one live run past its timeout; `--attention --since <date> --json` exits 0 and lists both with `reason` and `nextCommand`; the text form prints one line each; `--attention` alone exits 4 with a message naming `--since`; `--attention --run x` exits 4 (exactly one selector). Do not repeat the row-rule cases from phase 3.

## Verify
- `node --test test/cli/dispatch-inspect.test.mjs` passes.
- `node --test test/cli` for the command registry / manifest freshness tests (`rg -l "command-manifest" test` lists them) passes.
- `npm run fgos:dev -- dispatch inspect --attention --since 2026-11-17 --dir .` returns without error on this checkout (live check; also reports honestly "not-scanned" for the terminal part if herdr is absent).

## Rollback
`git revert` the phase commit; regenerate manifest and census on the reverted tree.
