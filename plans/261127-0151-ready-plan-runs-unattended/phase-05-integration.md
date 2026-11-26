# Phase 5: Changelog and integration

Capability: `code:implement` for the changelog fragment, then `code:test` for the gate.

## Inputs

- All earlier phases landed on main.
- `changelog.d/` fragment format: any existing file there, e.g.
  `changelog.d/261126-2324-changelog-fragments-and-skill-surface-regeneration.md`.
- Host steps of `plan.md` "Unattended run": the supervisor's `fgos release run` after phase 3 lands makes the new door
  available to plain `fgos`.

## Footprint

`changelog.d/261127-0151-a-ready-plan-runs-unattended.md`,
`plans/261127-0151-ready-plan-runs-unattended/reports/integration.md`.

## Steps

1. If the activated release does not yet carry `release check` (`fgos can-i release check --worktree <path>` or
   `fgos release check --help` answers unknown), ask the supervisor with `fgos supervisor raise --kind
   coordination-help` naming `fgos release run`, and wait for it (plan host step 1).
2. Create the phase worktree from main and write the changelog fragment: plans now carry an Unattended run section
   the contract check enforces at `ready`; a lead runs the full gate with `fgos release check --worktree <path>`.
3. Run the full gate through the new door from this confined lead: `fgos release check --worktree <this worktree>`.
   Record each argv and exit code in `reports/integration.md`. This is acceptance criteria 3 and 5 in one live call.
4. Prove the red path once: in a scratch linked worktree, make one check fail (e.g. a deliberately failing test file
   that is never committed), run the door, record red and non-zero exit, confirm `git rev-parse main` is unchanged and
   no release record was written; remove the scratch change.
5. Run `node scripts/plan-contract-check.mjs --plan plans/261127-0151-ready-plan-runs-unattended` and
   `node scripts/plan-contract-check.mjs --all`; record the output.
6. Land the fragment and report. At close, follow U3: list superseded worktrees and merged branches for the
   supervisor (plan host step 3); unmerged or dirty ones go in the report.

## Verify

`reports/integration.md` shows green for every `release.checks` argv on the combined tree through the door, the red
proof with main unchanged, and both contract-check runs clean. Pass: all of it present and green.

## Rollback

Revert the fragment commit; the report is history and stays.
