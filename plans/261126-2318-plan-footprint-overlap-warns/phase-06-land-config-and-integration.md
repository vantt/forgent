# Phase 6: land config and integration

Runs from the main checkout: `.fgos/config.yaml` is skip-worktree in a linked worktree and `fgos config set`
refuses there (`config-project-file-stripped`).

## Inputs

- `plan.md`, acceptance criteria 5 and 7, risks.
- `plans/261126-2318-plan-footprint-overlap-warns/reports/land-regenerate-skill-surfaces.md` (phase 3's list).
- `.fgos/config.yaml` `land.regenerate` (run, files, when).

## Files this phase may write

- `.fgos/config.yaml` (only `land.regenerate`)
- `plans/261126-2318-plan-footprint-overlap-warns/reports/**`

## Steps

1. Confirm the activated release carries phase 3: `git merge-base --is-ancestor <phase 3 commit> <activated
   release source commit>` (activation record `.fgos/installation/activation.json`). If not, raise a release
   request to the supervisor (`fgos supervisor raise`) and stop here; steps 3 onward wait.
2. `git diff .fgos/config.yaml`. If it holds edits that are not this phase's (on 2026-11-26 an uncommitted
   `release:` block), do not land them: ask the owner with `fgos questions ask` in the five-part form (land them
   with this change, or the owner lands them first) and wait.
3. With `fgos config set` (each with `--why` citing D1 of `ds-yf3vnbidi6`): `land.regenerate.run` runs
   `npm run build:skills` before the command selectors and the census; `land.regenerate.files` adds
   `.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**` and any other pure-output file phase 3
   listed (never `AGENTS.md`); `land.regenerate.when` adds `domains/**`.
4. `fgos land --paths .fgos/config.yaml --message "chore(config): the land door regenerates the generated skill
   surfaces"`.
5. Integration: in a fresh linked worktree at the trunk tip run `npm test` and `cargo test --workspace`; write the
   result (commands, counts, any failure with its cause) to `reports/integration.md`. A failure caused by this plan
   goes back to the phase that owns it; an unrelated failure is named with its owner and does not block.
6. Evidence for criterion 5 on the real config: the next land that touches `core/**` or `domains/**` runs the
   regeneration; record its `.fgos/runtime/land/<operation id>.log` path in the report, or that none happened yet.

## Verify

Both suites green on the combined tree; `fgos config get land.regenerate --json` on main shows the globs.

## Rollback

`fgos config set` the previous `land.regenerate` value (from `git show HEAD~1:.fgos/config.yaml`) and land it.
