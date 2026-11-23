# Phase 3 step 3: the plan contract land gate, restored and held again

Written 2026-11-23 12:51 by head:lead-forgent-261122-0118-heads-b52f9.

## Result

The gate was restored as `0dd71aa83`, then held again as `6d0f6b92c`, because inside the land door it refused every
plan land (see "Live exercise"). It is not live on main.

- Config commit: `0dd71aa83` ("chore(config): the land door runs the plan contract check on landed plans again"),
  applied by lead:SUPERVISOR through `fgos config patch`. A lead's grant does not hold `config patch`: this head's call
  was refused `verb-not-granted`.
- The gate is the fifth entry of `land.gates` in `.fgos/config.yaml`. Its `when` is `plans/*/plan.md` and
  `plans/*/phase-*.md`. The land door renders `{plans}` as `--plan '<dir>'` pairs for each changed plan directory, and
  skips the gate when no plan directory changed (`packages/supervision/rust/src/land.rs`).
- The active release is `df57ddfcd609`, which substitutes `{plans}`. The earlier hold (`14287de27`) existed because the
  release active then did not.

## Precondition evidence

- `node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads` exited 0 from this
  confined head at 11:17 and again at 12:43, on the git addon lead:SUPERVISOR restaged at `a219a04ba`.
- Earlier runs exited 1, for two separate causes. At 10:59 and 11:07 the staged addon was stale, because Rust changes
  had landed after the restage at `637334ca6`. The check then ran `cargo build`, which cannot take the Cargo build lock
  in a read-only sandbox. At 11:15 the check ran but found free-text phase statuses in both 261123-0726 and this plan.
  This plan was fixed in `2568efd21`.
- Lasting risk: any Rust land after a restage makes the staged addon stale for every confined head again. Plan
  261123-0726 owns that problem.

## Live exercise

The first plan land through the restored gate (ticket `c-40669-1795413102207`, 12:51, this plan's `plan.md` and this
report) was refused `land-gate-failed`. The gate ran
`node scripts/plan-contract-check.mjs --plan 'plans/261122-0118-heads-stable-and-able'` and it failed:
`git-addon-unavailable: addon not shipped on this channel: onboard this project with fgctl init` (log
`.fgos/runtime/land/land-1765558-1795413104110245876-1.log`). The same check exits 0 from this head on the same tree.

Likely cause, read from the code and not proven by a run: inside the land door `FGOS_ACTIVE_MANIFEST_PATH` is set, so
`ensureAddonForScript` stages nothing (`scripts/lib/git-addon-stage.mjs`). `loadNativeAddon` (`src/native/door.mjs`,
`ownRelease`) then accepts only a release whose payload is the running script's own payload. A script run from the
candidate checkout is not that payload.

lead:SUPERVISOR held the gate again as `6d0f6b92c` (13:0x) and routed the gate-context defect to plan 261123-0726. This
plan's phase 3 is done apart from the live gate, which comes back once the check runs in the land door's context.
